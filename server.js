import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// In-memory package store
let packages = [];

// ======================== ROUTES =========================

// Front Desk: create package
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

app.post("/frontdesk", async (req, res) => {
  const { recipient, address, city, state, zip, country, phone, email, weight, dimensions, notes } = req.body;
  const id = uuidv4();

  const qrData = `https://yourdomain.com/track/${id}`;
  const qrPath = `/uploads/${id}.png`;

  await QRCode.toFile(path.join(__dirname, "../public", qrPath), qrData);

  const newPackage = {
    id,
    recipient,
    address,
    city,
    state,
    zip,
    country,
    phone,
    email,
    weight,
    dimensions,
    notes,
    status: "Processing",
    qr: qrPath,
    photo: null,
  };

  packages.push(newPackage);
  res.render("frontdesk", { pkg: newPackage });
});

// Driver panel: lookup & update
app.get("/driver", (req, res) => {
  res.render("driver");
});

app.post("/driver/lookup", (req, res) => {
  const pkg = packages.find(p => p.id === req.body.id);
  res.render("driver", { pkg });
});

app.post("/driver/update/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.send("Package not found.");

  pkg.status = req.body.status;
  if (req.file) {
    pkg.photo = `/uploads/${req.file.filename}`;
  }

  res.render("driver", { pkg });
});

// Warehouse view
app.get("/warehouse", (req, res) => {
  res.render("warehouse", { packages });
});

// Track package
app.get("/track/:id", (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.send("Package not found.");
  res.render("track", { pkg });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
