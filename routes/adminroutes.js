const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
require("dotenv").config();


function verifyAdmin(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied, no token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied, not an admin" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM admins WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Admin not found" });

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Admin login successful", token });
  });
});



router.get("/pending-users", verifyAdmin, (req, res) => {
  db.query("SELECT * FROM users WHERE status = 'pending'", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

router.put("/approve/:id", verifyAdmin, (req, res) => {
  const userId = req.params.id;

  db.query("UPDATE users SET status = 'approved' WHERE id = ?", [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "User approved successfully!" });
  });
});


router.put("/reject/:id", verifyAdmin, (req, res) => {
  const userId = req.params.id;

  db.query("UPDATE users SET status = 'rejected' WHERE id = ?", [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "User rejected successfully!" });
  });
});

router.get("/approved-users", verifyAdmin, (req, res) => {
  db.query("SELECT * FROM users WHERE status = 'approved'", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});


router.get("/rejected-users", verifyAdmin, (req, res) => {
  db.query("SELECT * FROM users WHERE status = 'rejected'", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

module.exports = router;
