import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import bodyParser from "body-parser";
import multer from "multer";
import QRCode from "qrcode";
import http from "http";
import { Server as SocketIO } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

const PORT = process.env.PORT || 3000;

// Setup uploads
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

let packages = []; // In-memory storage

function generatePackageID() {
  return "PKG-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// ====== Front Desk ======
app.get("/frontdesk", (req, res) => res.render("frontdesk", { pkg: null }));

app.post("/frontdesk/create", async (req, res) => {
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
    warehouse: req.body.warehouse || "Main",
    status: "Created",
    photo: null,
    createdAt: new Date(),
  };

  packages.push(pkg);
  const qrData = `${req.protocol}://${req.get("host")}/track/${id}`;
  pkg.qr = await QRCode.toDataURL(qrData);

  res.render("frontdesk", { pkg });
});

// ====== Driver ======
app.get("/driver", (req, res) => res.render("driver", { pkg: null }));
app.post("/driver/lookup", (req, res) => {
  const pkg = packages.find((p) => p.id === req.body.id);
  res.render("driver", { pkg });
});
app.post("/driver/claim/:id", (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (pkg) pkg.status = "On Truck";
  res.redirect("/driver");
});
app.post("/driver/deliver/:id", upload.single("photo"), (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (pkg) {
    pkg.status = "Delivered";
    if (req.file) pkg.photo = "/uploads/" + req.file.filename;
  }
  res.redirect("/driver");
});

// ====== Tracking ======
app.get("/track/:id", (req, res) => {
  const pkg = packages.find((p) => p.id === req.params.id);
  if (!pkg) return res.status(404).send("Package not found");
  res.render("track", { pkg });
});

// ====== Admin ======
app.get("/admin", (req, res) => res.render("admin", { packages }));

// ====== Warehouse ======
app.get("/warehouse", (req, res) => res.render("warehouse", { packages }));
app.get("/warehouse/scan", (req, res) => res.render("warehouse_scan"));

// Socket.IO for live scanning
io.on("connection", (socket) => {
  socket.on("scan", (id) => {
    const pkg = packages.find((p) => p.id === id);
    if (pkg) {
      socket.emit("scanned", pkg); // back to scanner
      io.emit("update", pkg);      // broadcast to warehouse dashboard
    }
  });

  socket.on("updateStatus", ({ id, status }) => {
    const pkg = packages.find((p) => p.id === id);
    if (pkg) {
      pkg.status = status;
      io.emit("update", pkg); // live update
    }
  });
});

// Redirect root
app.get("/", (req, res) => res.redirect("https://amazon.com"));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
