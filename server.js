import express from "express";
import path from "path";
import multer from "multer";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Simple in-memory storage for demonstration
let packages = [];
let links = [
  { name: "Front Desk", url: "/frontdesk" },
  { name: "Admin Panel", url: "/admin" },
  { name: "Driver Panel", url: "/driver" },
  { name: "Tracking", url: "/track" },
];

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Redirect root to amazon.com
app.get("/", (req, res) => {
  res.redirect("https://amazon.com");
});

// URLs page
app.get("/URLs", (req, res) => {
  res.render("urls", { links });
});

// Front Desk
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

app.post("/frontdesk/create", (req, res) => {
  const pkg = {
    id: packages.length + 1,
    address: req.body.address,
    notes: req.body.notes || "",
    status: "Created",
    photo: null,
  };
  packages.push(pkg);
  res.redirect("/frontdesk");
});

// Driver
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

// Admin Panel
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

// Tracking
app.get("/track", (req, res) => {
  res.render("track", { packages });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
