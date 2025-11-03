import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import { Server as SocketIO } from 'socket.io';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

const upload = multer({ dest: 'uploads/' });

// In-memory storage (replace with DB for production)
let packages = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Redirect home to amazon
app.get('/', (req, res) => res.redirect('https://amazon.com'));

// Front Desk
app.get('/frontdesk', (req, res) => res.render('frontdesk'));
app.post('/frontdesk/create', (req, res) => {
  const id = Date.now().toString();
  const pkg = {
    id,
    recipient: req.body.recipient,
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
    status: 'Created',
    photo: null
  };
  packages.push(pkg);
  res.render('track', { pkg });
});

// Driver
app.get('/driver', (req, res) => res.render('driver', { pkg: null }));
app.post('/driver/lookup', (req, res) => {
  const pkg = packages.find(p => p.id === req.body.id);
  res.render('driver', { pkg });
});
app.post('/driver/update/:id', upload.single('photo'), (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (pkg) {
    pkg.status = req.body.status;
    if (req.file) pkg.photo = `/uploads/${req.file.filename}`;
  }
  res.render('driver', { pkg });
});

// Warehouse
app.get('/warehouse', (req, res) => res.render('warehouse', { packages }));
app.get('/warehouse/scan', (req, res) => res.render('warehouse-scan', { packages }));
app.post('/warehouse/update/:id', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (pkg) pkg.status = req.body.status;
  io.emit('update', pkg);
  res.sendStatus(200);
});

// URLs
app.get('/urls', (req, res) => {
  const links = [
    { name: 'Front Desk', url: '/frontdesk' },
    { name: 'Driver', url: '/driver' },
    { name: 'Warehouse', url: '/warehouse' }
  ];
  res.render('urls', { links });
});

// Socket.io connection
io.on('connection', socket => {
  console.log('Client connected');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
