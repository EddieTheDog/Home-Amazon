const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let packages = []; // in-memory storage

// Create package
app.post('/api/packages', (req, res) => {
  packages.push({ ...req.body, status: 'pending' });
  res.json({ success: true });
});

// Get all packages
app.get('/api/packages', (req, res) => res.json(packages));

// Get single package
app.get('/api/packages/:id', (req, res) => {
  const pkg = packages.find((p) => p.id.toString() === req.params.id);
  res.json(pkg || {});
});

// Delete package
app.delete('/api/packages/:id', (req, res) => {
  packages = packages.filter((p) => p.id.toString() !== req.params.id);
  res.json({ success: true });
});

// Deliver package with photo
const upload = multer({ dest: 'uploads/' });
app.post('/api/packages/:id/deliver', upload.single('photo'), (req, res) => {
  const pkg = packages.find((p) => p.id.toString() === req.params.id);
  if (pkg) {
    pkg.status = req.body.status || 'delivered';
    pkg.photo = req.file?.filename || null;
  }
  res.json({ success: true });
});

// Redirect home
app.get('/', (req, res) => res.redirect('https://amazon.com'));

app.listen(port, () => console.log(`Server running on port ${port}`));
