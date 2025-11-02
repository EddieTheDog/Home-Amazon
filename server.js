import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// In-memory package storage
let packages = [];

// Routes
app.get('/', (req, res) => res.redirect('https://amazon.com'));

app.get('/frontdesk', (req, res) => res.render('frontdesk'));
app.get('/admin', (req, res) => res.render('admin', { packages }));
app.get('/driver', (req, res) => res.render('driver', { packages }));
app.get('/track', (req, res) => {
  const { packageId } = req.query;
  const pkg = packages.find(p => p.packageId === packageId);
  if (!pkg) return res.status(404).send('Package not found');
  res.render('track', { package: pkg });
});

// API
app.post('/api/packages', (req, res) => {
  const data = req.body;
  if (!data.recipient || !data.address) {
    return res.status(400).json({ error: 'Recipient and address are required' });
  }
  const newPackage = {
    packageId: uuidv4(),
    recipient: data.recipient,
    address: data.address,
    city: data.city || '',
    state: data.state || '',
    zip: data.zip || '',
    country: data.country || '',
    phone: data.phone || '',
    email: data.email || '',
    weight: data.weight || '',
    dimensions: data.dimensions || '',
    deliverySpeed: data.deliverySpeed || 'standard',
    notes: data.notes || '',
    status: 'created',
    claimedBy: null,
    deliveredAt: null
  };
  packages.push(newPackage);
  res.json({ message: 'Package created', packageId: newPackage.packageId });
});

app.post('/api/packages/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, claimedBy } = req.body;
  const pkg = packages.find(p => p.packageId === id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  if (status) pkg.status = status;
  if (claimedBy) pkg.claimedBy = claimedBy;
  if (status === 'delivered') pkg.deliveredAt = new Date();
  res.json({ message: 'Package updated', package: pkg });
});

app.delete('/api/packages/:id', (req, res) => {
  const { id } = req.params;
  packages = packages.filter(p => p.packageId !== id);
  res.json({ message: 'Package deleted' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
