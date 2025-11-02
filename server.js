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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let packages = [];

// --- Routes ---
app.get('/', (req, res) => {
  res.render('home', { created: req.query.created || null });
});

// --- Staff URLs page ---
app.get('/urls', (req, res) => {
  res.render('urls', {
    links: [
      { name: 'Front Desk', path: '/frontdesk' },
      { name: 'Admin Dashboard', path: '/dashboard' },
      { name: 'Driver Panel', path: '/driver' },
      { name: 'Scanner', path: '/scan' },
      { name: 'Tracking Page', path: '/track' }
    ]
  });
});

// --- existing views ---
app.get('/frontdesk', (req, res) => res.render('frontdesk', {}));
app.get('/dashboard', (req, res) => res.render('dashboard', { packages }));
app.get('/driver', (req, res) => res.render('driver', {}));
app.get('/scan', (req, res) => res.render('scan', {}));
app.get('/track', (req, res) => res.render('track', {}));

// --- APIs ---
app.post('/api/packages', (req, res) => {
  const { description, senderName, senderContact, recipientName, recipientContact, recipientAddress, notes } = req.body;
  const id = uuidv4().split('-')[0].toUpperCase();

  const pkg = {
    id,
    description: description || '',
    sender: { name: senderName || '', contact: senderContact || '' },
    recipient: { name: recipientName || '', contact: recipientContact || '', address: recipientAddress || '' },
    notes: notes || '',
    status: 'created'
  };
  packages.unshift(pkg);
  io.emit('package-created', pkg);
  res.redirect(`/?created=${id}`);
});

app.get('/api/packages/:id', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Not found' });
  res.json({ package: pkg });
});

io.on('connection', socket => {
  socket.on('scan', code => io.emit('scan', code));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
