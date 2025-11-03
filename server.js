import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 10000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: path.join(__dirname, "uploads/") });

// Simple in-memory storage (replace with a database for production)
let packages = [];

// ---------------------- FRONT DESK ---------------------- //
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

app.post("/frontdesk/create", (req, res) => {
  const pkg = {
    id: packages.length + 1,
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
  res.render("track", { pkg });
});

// ---------------------- DRIVER ---------------------- //
app.get("/driver", (req, res) => {
  res.render("driver", { pkg: null });
});

app.post("/driver/lookup", (req, res) => {
  const pkg = packages.find((p) => p.id == req.body.id);
  res.render("driver", { pkg: pkg || null });
});

app.post("/driver/update/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find((p) => p.id == req.params.id);
  if (pkg) {
    pkg.status = req.body.status;
    if (req.file) {
      pkg.photo = "/uploads/" + req.file.filename;
    }
  }
  res.render("driver", { pkg });
});

// ---------------------- TRACK ---------------------- //
app.get("/track/:id", (req, res) => {
  const pkg = packages.find((p) => p.id == req.params.id);
  res.render("track", { pkg });
});

// ---------------------- WAREHOUSE ---------------------- //
app.get("/warehouse", (req, res) => {
  res.render("warehouse", { packages });
});

app.get("/warehouse/scan", (req, res) => {
  res.render("scan");
});

app.post("/warehouse/update", (req, res) => {
  const pkg = packages.find((p) => p.id == req.body.id);
  if (pkg) {
    pkg.status = req.body.status;
  }
  res.json({ success: !!pkg });
});

// ---------------------- START SERVER ---------------------- //
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
