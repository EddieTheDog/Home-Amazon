import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import http from 'http';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

// In-memory package storage (replace with DB for production)
let packages = [];

// ------------------------ ROUTES ------------------------

// Front desk page
app.get('/frontdesk', (req, res) => {
  res.render('frontdesk');
});

// Create package
app.post('/frontdesk', (req, res) => {
  const pkg = {
    id: `PKG-${Date.now()}`,
    name: req.body.name,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    email: req.body.email,
    weight: req.body.weight,
    dimensions: req.body.dimensions,
    speed: req.body.speed,
    notes: req.body.notes,
    status: 'Processing',
    photo: null,
    createdAt: new Date()
  };
  packages.push(pkg);
  res.render('track', { pkg });
});

// Driver panel
app.get('/driver', (req, res) => {
  res.render('driver', { pkg: null });
});

app.post('/driver/lookup', (req, res) => {
  const pkg = packages.find(p => p.id === req.body.id);
  res.render('driver', { pkg });
});

app.post('/driver/update/:id', upload.single('photo'), (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.send('Package not found');
  pkg.status = req.body.status;
  if (req.file) {
    pkg.photo = `/uploads/${req.file.filename}`;
  }
  res.render('driver', { pkg });
});

// Warehouse scanner page
app.get('/warehouse', (req, res) => {
  res.render('warehouse', { packages });
});

// Warehouse scan endpoint
app.post('/warehouse/scan', (req, res) => {
  const { barcode } = req.body;
  const pkg = packages.find(p => p.id === barcode);
  if (pkg) {
    // Example: change status
    pkg.status = 'Received at warehouse';
    io.emit('packageScanned', pkg); // live update to front-end
    res.json({ success: true, pkg });
  } else {
    res.status(404).json({ success: false });
  }
});

// URLs page
app.get('/URLs', (req, res) => {
  const links = [
    { name: 'Front Desk', url: '/frontdesk' },
    { name: 'Driver', url: '/driver' },
    { name: 'Warehouse', url: '/warehouse' }
  ];
  res.render('urls', { links });
});

// Redirect homepage to Amazon
app.get('/', (req, res) => {
  res.redirect('https://amazon.com');
});

// ------------------------ SOCKET.IO ------------------------

io.on('connection', socket => {
  console.log('Client connected');
});

// ------------------------ SERVER ------------------------

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
