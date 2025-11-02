import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();

// === Setup paths ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middleware ===
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// === File upload config for driver photos ===
const upload = multer({ dest: "public/uploads/" });

// === In-memory database ===
let packages = [];

// === Redirect homepage ===
app.get("/", (req, res) => res.redirect("https://amazon.com"));

// === Front Desk: create a package ===
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk", { pkg: null, qr: null });
});

app.post("/frontdesk", async (req, res) => {
  const { senderName, recipientName, address, notes } = req.body;
  const id = uuidv4();

  const pkg = {
    id,
    senderName,
    recipientName,
    address,
    notes,
    status: "At Drop-off Location",
    createdAt: new Date().toLocaleString(),
    photo: null
  };

  packages.push(pkg);

  const trackingURL = `${req.protocol}://${req.get("host")}/track/${pkg.id}`;
  const qr = await QRCode.toDataURL(trackingURL);

  res.render("frontdesk", { pkg, qr });
});

// === Tracking page ===
app.get("/track/:id", (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).send("Package not found");
  res.render("track", { pkg });
});

// === Admin Panel ===
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

app.post("/admin/update/:id", (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (pkg) {
    pkg.status = req.body.status || pkg.status;
    pkg.notes = req.body.notes || pkg.notes;
  }
  res.redirect("/admin");
});

app.post("/admin/delete/:id", (req, res) => {
  packages = packages.filter(p => p.id !== req.params.id);
  res.redirect("/admin");
});

// === Driver Panel ===
app.get("/driver", (req, res) => {
  res.render("driver", { pkg: null });
});

app.post("/driver/lookup", (req, res) => {
  const { id } = req.body;
  const pkg = packages.find(p => p.id === id);
  if (!pkg) return res.render("driver", { pkg: null, error: "Package not found" });
  res.render("driver", { pkg });
});

app.post("/driver/update/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (pkg) {
    pkg.status = req.body.status || pkg.status;
    if (req.file) pkg.photo = `/uploads/${req.file.filename}`;
  }
  res.redirect("/driver");
});

// === URLs Index ===
app.get("/urls", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.render("urls", {
    links: [
      { name: "Front Desk Panel", url: `${base}/frontdesk` },
      { name: "Admin Dashboard", url: `${base}/admin` },
      { name: "Driver Panel", url: `${base}/driver` },
      { name: "Tracking Example", url: `${base}/track/example-id` }
    ]
  });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Shipping service running on port ${PORT}`));
