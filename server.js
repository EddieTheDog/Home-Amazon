// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Redirect homepage to amazon.com
app.get("/", (req, res) => {
  res.redirect("https://amazon.com");
});

// Front Desk page
app.get("/frontdesk", (req, res) => {
  res.render("frontdesk");
});

// Driver page
app.get("/driver", (req, res) => {
  res.render("driver");
});

// Admin page
app.get("/admin", (req, res) => {
  res.render("admin");
});

// Tracking page
app.get("/track", (req, res) => {
  res.render("track");
});

// URLs page with staff links
app.get("/urls", (req, res) => {
  const links = [
    { name: "Front Desk", url: "/frontdesk" },
    { name: "Driver", url: "/driver" },
    { name: "Admin", url: "/admin" },
    { name: "Tracking", url: "/track" },
  ];
  res.render("urls", { links });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Home-Amazon server running on port ${PORT}`);
});
