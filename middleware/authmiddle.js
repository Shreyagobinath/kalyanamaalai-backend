const jwt = require("jsonwebtoken");
require("dotenv").config();

// ✅ Verify Token Middleware
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ✅ Only Admin Access
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ✅ Only User Access
exports.isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "User access required" });
  }
  next();
};

// ✅ Alternative Auth Middleware (Some routes use this)
exports.authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};



// ⭐⭐⭐ NEW MODIFICATION ADDED ⭐⭐⭐
// ✅ Check if the user already completed the form
const db = require("../config/db");

exports.checkFormStatus = (req, res, next) => {
  const userId = req.user.id;

  db.query(
    "SELECT form_completed FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.log("Form Status Check Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attach form status to request so frontend can use it
      req.formCompleted = results[0].form_completed;

      next();
    }
  );
};