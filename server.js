import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')));
app.use(bodyParser.urlencoded({ extended: true }));

// Temporary in-memory store for packages
let packages = [];

// Frontend: Warehouse dashboard
app.get('/warehouse', (req, res) => {
  res.render('warehouse', { packages });
});

// Phone scanning page
app.get('/warehouse/scan', (req, res) => {
  res.render('warehouse-scan');
});

// Receive scanned package from phone
app.post('/warehouse/scan', (req, res) => {
  const { packageId } = req.body;

  // Find the package
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return res.status(404).send('Package not found');

  // Emit to all warehouse clients
  io.emit('scannedPackage', pkg);
  res.sendStatus(200);
});

// Example endpoint to create packages (normally front desk)
app.post('/package/create', (req, res) => {
  const { id, recipient, status } = req.body;
  packages.push({ id, recipient, status: status || 'Received' });
  res.redirect('/warehouse');
});

// Socket.io connection
io.on('connection', socket => {
  console.log('A client connected to warehouse dashboard');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
