// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db"); // <-- fixed import
const authRoutes = require("./models/auth/routes");
const userRoutes = require("./models/user/routes");
const adminRoutes = require("./models/admin/routes");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000", // your React dev URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // if you send cookies
}));

// Middleware
app.use(express.json({strict:false}));
app.use(express.urlencoded({extended:true}));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/test-Emails",userRoutes);

// Test database connection and start server
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
