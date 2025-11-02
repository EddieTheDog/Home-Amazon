const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// In-memory storage for packages
let packages = [];

// Routes
app.get("/", (req, res) => {
  // Redirect homepage to Amazon as requested
  res.redirect("https://www.amazon.com");
});

// Front Desk page
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

// Admin page
app.get("/admin", (req, res) => {
  res.render("admin", { packages });
});

// Driver page
app.get("/driver", (req, res) => {
  res.render("driver", { packages });
});

// Tracking page
app.get("/track", (req, res) => {
  res.render("track", { packages });
});

// Staff URLs page
app.get("/urls", (req, res) => {
  res.render("urls");
});

// API to create a package
app.post("/api/packages", (req, res) => {
  const { packageId, recipient, address, notes } = req.body;
  if (!packageId || !recipient || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newPackage = {
    packageId,
    recipient,
    address,
    notes,
    status: "At Front Desk",
    timestamp: new Date(),
  };

  packages.push(newPackage);
  res.json({ success: true, package: newPackage });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
