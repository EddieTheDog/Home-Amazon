// server.js
import express from "express";
import http from "http";
import { Server as SocketIO } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import bodyParser from "body-parser";

// Helper for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

// In-memory package storage
let packages = [];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public/uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Redirect homepage to Amazon
app.get("/", (req, res) => res.redirect("https://amazon.com"));

// Front Desk Panel
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

app.post("/frontdesk/create", (req, res) => {
  const id = Date.now().toString(); // auto-generate unique ID
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
    status: "Created",
    photo: null,
  };
  packages.push(pkg);
  res.render("frontdesk", { pkg });
});

// Driver Panel
app.get("/driver", (req, res) => {
  res.render("driver", { pkg: null });
});

app.post("/driver/lookup", (req, res) => {
  const pkg = packages.find((p) => p.id === req.body.id);
  res.render("driver", { pkg });
});

app.post("/driver/update/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (pkg) {
    pkg.status = req.body.status || pkg.status;
    if (req.file) pkg.photo = "/uploads/" + req.file.filename;
  }
  res.render("driver", { pkg });
});

// Admin Panel
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

// Tracking Page
app.get("/track", (req, res) => {
  res.render("track", { packages });
});

// URLs Page
app.get("/urls", (req, res) => {
  const links = [
    { name: "Front Desk", url: "/frontdesk" },
    { name: "Driver Panel", url: "/driver" },
    { name: "Admin Panel", url: "/admin" },
    { name: "Tracking", url: "/track" },
  ];
  res.render("urls", { links });
});

// Socket.IO for live warehouse updates
io.on("connection", (socket) => {
  console.log("Client connected: " + socket.id);

  socket.on("scan-package", (id) => {
    const pkg = packages.find((p) => p.id === id);
    if (pkg) {
      socket.emit("package-scanned", pkg);
      console.log("Package scanned: ", id);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
