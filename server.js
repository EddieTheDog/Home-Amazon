import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
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

// === In-memory database (for now) ===
let packages = [];

// === Routes ===

// Home redirects to /frontdesk for now
app.get("/", (req, res) => res.redirect("/frontdesk"));

// Front Desk — create packages
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk", { pkg: null, qr: null });
});

app.post("/frontdesk", async (req, res) => {
  const { senderName, recipientName, address, notes } = req.body;

  const pkg = {
    id: uuidv4(),
    senderName,
    recipientName,
    address,
    notes,
    status: "At Drop-off Location",
    createdAt: new Date()
  };

  packages.push(pkg);

  const trackingURL = `${req.protocol}://${req.get("host")}/track/${pkg.id}`;
  const qr = await QRCode.toDataURL(trackingURL);

  res.render("frontdesk", { pkg, qr });
});

// Track package
app.get("/track/:id", (req, res) => {
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).send("Package not found");
  res.render("track", { pkg });
});

// Admin (view all packages)
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

// URL index
app.get("/urls", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.render("urls", {
    links: [
      { name: "Front Desk", url: `${base}/frontdesk` },
      { name: "Tracking", url: `${base}/track/example` },
      { name: "Admin Dashboard", url: `${base}/admin` },
      { name: "Driver Panel", url: `${base}/driver` },
    ]
  });
});

// Placeholder for driver panel
app.get("/driver", (req, res) => {
  res.render("driver");
});

// === Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
