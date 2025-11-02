import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup storage for delivery photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public/uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory package store
let packages = [];

// Helper: Generate unique ID
function generatePackageID() {
  return "PKG-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// ======== ROUTES ========

// Front Desk
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk", { pkg: null });
});

app.post("/frontdesk/create", async (req, res) => {
  try {
    const id = generatePackageID();
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
      shippingDeck: req.body.deck || "Unassigned",
      status: "Created",
      photo: null,
      createdAt: new Date(),
    };
    packages.push(pkg);

    // Generate QR code linking to tracking page
    const qrData = `${req.protocol}://${req.get("host")}/track/${id}`;
    const qrImage = await QRCode.toDataURL(qrData);
    pkg.qr = qrImage;

    res.render("frontdesk", { pkg });
  } catch (err) {
    res.status(500).send("Error creating package");
  }
});

// Driver panel
app.get("/driver", (req, res) => {
  res.render("driver", { pkg: null });
});

app.post("/driver/lookup", (req, res) => {
  const pkg = packages.find((p) => p.id === req.body.id);
  res.render("driver", { pkg });
});

app.post("/driver/claim/:id", (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (pkg) {
    pkg.status = "On Truck";
  }
  res.redirect("/driver");
});

app.post("/driver/deliver/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (pkg) {
    pkg.status = "Delivered";
    if (req.file) {
      pkg.photo = "/uploads/" + req.file.filename;
    }
  }
  res.redirect("/driver");
});

// Tracking page
app.get("/track/:id", (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (!pkg) return res.status(404).send("Package not found");
  res.render("track", { pkg });
});

// Admin panel
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

// Redirect root to external page
app.get("/", (req, res) => {
  res.redirect("https://amazon.com");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
