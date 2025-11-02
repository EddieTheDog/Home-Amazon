import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import multer from 'multer';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Storage for uploaded photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// In-memory package storage
let packages = [];

// --------------------- ROUTES ---------------------

// Redirect homepage to Amazon
app.get('/', (req, res) => {
  res.redirect('https://www.amazon.com');
});

// Front Desk Page
app.get('/frontdesk', (req, res) => {
  res.render('frontdesk', { package: null });
});

// Handle Front Desk package creation
app.post('/frontdesk/create', async (req, res) => {
  const id = uuidv4();
  const pkg = {
    id,
    recipientName: req.body.recipientName,
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

  // Generate QR code
  const qrData = `https://home-amazon.onrender.com/track/${id}`;
  pkg.qrCode = await QRCode.toDataURL(qrData);

  packages.push(pkg);

  res.render('frontdesk', { package: pkg });
});

// Driver page
app.get('/driver', (req, res) => {
  res.render('driver', { pkg: null });
});

// Driver lookup
app.post('/driver/lookup', (req, res) => {
  const pkg = packages.find(p => p.id === req.body.id);
  res.render('driver', { pkg: pkg || null });
});

// Driver update
app.post('/driver/update/:id', upload.single('photo'), (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.send('Package not found');

  pkg.status = req.body.status || pkg.status;
  if (req.file) {
    pkg.photo = '/uploads/' + req.file.filename;
  }

  res.render('driver', { pkg });
});

// Admin panel
app.get('/admin', (req, res) => {
  res.render('admin', { packages });
});

// Tracking page
app.get('/track/:id', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  res.render('track', { pkg });
});

// URLs page
app.get('/URLs', (req, res) => {
  const links = [
    { name: 'Front Desk', url: '/frontdesk' },
    { name: 'Driver', url: '/driver' },
    { name: 'Admin', url: '/admin' }
  ];
  res.render('urls', { links });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
