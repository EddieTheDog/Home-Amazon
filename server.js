// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Temporary in-memory "database"
let packages = [];

// Homepage redirect to Amazon
app.get('/', (req, res) => {
  res.redirect('https://www.amazon.com');
});

// Staff pages
app.get('/frontdesk', (req, res) => res.render('frontdesk'));
app.get('/driver', (req, res) => res.render('driver'));
app.get('/admin', (req, res) => res.render('admin'));
app.get('/track', (req, res) => res.render('track'));
app.get('/urls', (req, res) => res.render('urls'));

// API endpoint to create a package
app.post('/api/package/create', (req, res) => {
  try {
    const { name, description, address, priority } = req.body;
    const id = Date.now().toString(); // simple unique ID
    const pkg = { id, name, description, address, priority, status: 'created', timestamp: new Date() };
    packages.push(pkg);
    res.json({ success: true, package: pkg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to get all packages (for admin/tracking)
app.get('/api/packages', (req, res) => {
  res.json({ success: true, packages });
});

// API endpoint to update a package
app.post('/api/package/update/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pkgIndex = packages.findIndex(p => p.id === id);
    if (pkgIndex === -1) throw new Error('Package not found');
    packages[pkgIndex] = { ...packages[pkgIndex], ...req.body };
    res.json({ success: true, package: packages[pkgIndex] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to get a package by ID
app.get('/api/package/:id', (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });
  res.json({ success: true, package: pkg });
});

// 404 redirect to error page
app.use((req, res, next) => {
  res.status(404).redirect('/error?msg=Page not found&route=' + encodeURIComponent(req.originalUrl));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err); // log error
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers
  };
  res.status(500).render('error', { errorInfo });
});

// Error page route
app.get('/error', (req, res) => {
  const { msg, route } = req.query;
  res.render('error', { errorInfo: { message: msg || 'Unknown error', route } });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
