// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db"); // MySQL pool
const cors = require("cors");

//Routes
const authRoutes = require("./models/auth/routes");
const userRoutes = require("./models/user/routes");
const adminRoutes = require("./models/admin/routes");

dotenv.config();

const app = express();

// ==============================
// CORS Configuration
// ==============================
app.use(
  cors({
    origin: "http://localhost:3000", // React dev server
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ==============================
// Middleware
// ==============================
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// ==============================
// Routes
// ==============================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

// ==============================
// NEW ADMIN ROUTE: Pending Forms
// ==============================
app.get("/api/v1/admin/forms/pending", async (req, res) => {
  try {
    const connection = await db.getConnection();

    const query = `
      SELECT f.id AS form_id, 
             f.user_id, 
             u.full_name_en AS user_name, 
             u.email AS user_email, 
             u.gender, 
             f.status
      FROM forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.status = 'Pending'
      ORDER BY f.created_at DESC
    `;

    const [rows] = await connection.query(query);
    connection.release();

    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending forms:", err);
    res.status(500).json({ message: "Failed to fetch pending forms" });
  }
});

// ==============================
// Test Database Connection & Start Server
// ==============================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await db.getConnection();
    await connection.ping(); // simple ping to check connection
    connection.release();
    console.log("✅ Backend connected successfully to MySQL");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
