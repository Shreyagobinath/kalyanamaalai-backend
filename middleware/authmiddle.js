// backend/middleware/authmiddle.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

// ==============================
// VERIFY JWT TOKEN
// ==============================
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ==============================
// ADMIN ACCESS ONLY
// ==============================
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ==============================
// USER ACCESS ONLY
// ==============================
exports.isUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({ message: "User access required" });
  }
  next();
};

// ==============================
// GENERIC ROLE CHECKER
// ==============================
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// ==============================
// ALTERNATIVE AUTH MIDDLEWARE
// ==============================
exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// CHECK IF USER COMPLETED FORM
// ==============================
exports.checkFormStatus = (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  db.query(
    "SELECT form_completed FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Form Status Check Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attach form status to request so frontend can use it
      req.formCompleted = results[0].form_completed;
      next();
    }
  );
};
