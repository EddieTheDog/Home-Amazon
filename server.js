// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Middleware / view engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory storage (replace with DB later) ---
let packages = [];   // { id, description, sender, recipient, status, notes, photo, location }
let users = [];      // optional, for drivers/admins

// --- Routes ---
// Homepage
app.get('/', (req, res) => {
  res.render('index', { counts: { packages: packages.length } });
});

// Front desk (create package)
app.get('/frontdesk', (req, res) => {
  res.render('frontdesk', { });
});

// Admin dashboard (manage packages)
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { packages });
});

// Driver panel
app.get('/driver', (req, res) => {
  res.render('driver', { });
});

// Scan page (phone scanner)
app.get('/scan', (req, res) => {
  res.render('scan', { });
});

// Tracking page (customer)
app.get('/track', (req, res) => {
  res.render('track', { });
});

// API: create package (front desk form post)
app.post('/api/packages', (req, res) => {
  const { description, senderName, senderContact, recipientName, recipientContact, recipientAddress, notes } = req.body;
  if (!recipientName || !recipientAddress) return res.status(400).send('Recipient required');
  const id = uuidv4().split('-')[0].toUpperCase(); // short tracking code
  const pkg = {
    id,
    description: description || '',
    sender: { name: senderName || '', contact: senderContact || '' },
    recipient: { name: recipientName, contact: recipientContact || '', address: recipientAddress },
    status: 'at_store',
    notes: notes || '',
    photo: null,
    location: 'Store'
  };
  packages.unshift(pkg);
  // If request from form submit -> redirect to frontdesk with code query
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
    return res.redirect(`/frontdesk?created=${id}`);
  }
  res.json({ success: true, package: pkg });
});

// API: lookup by code
app.get('/api/packages/:code', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.code);
  if (!pkg) return res.status(404).json({ error: 'Not found' });
  res.json({ package: pkg });
});

// API: update package status / add photo (driver)
app.post('/api/packages/:code/update', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.code);
  if (!pkg) return res.status(404).json({ error: 'Not found' });
  const { status, dropOffMethod, photoBase64 } = req.body;
  if (status) pkg.status = status;
  if (dropOffMethod) pkg.dropOffMethod = dropOffMethod;
  if (photoBase64) pkg.photo = photoBase64; // store base64 for now
  io.emit('package-updated', pkg.id);
  res.json({ success: true, package: pkg });
});

// Simple delete (admin)
app.post('/api/packages/:code/delete', (req, res) => {
  packages = packages.filter(p => p.id !== req.params.code);
  res.json({ success: true });
});

// Socket.io: broadcast scans and updates
io.on('connection', socket => {
  socket.on('scan', code => {
    // when scanner emits scan, forward to admin dashboards
    io.emit('scan', code);
  });
});

// --- start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
