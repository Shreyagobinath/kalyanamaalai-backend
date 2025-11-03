const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/db");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

// Import routes
const authRoutes = require("./routes/authroutes");
const adminRoutes = require("./routes/adminroutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, rows) => {
    if (err) {
      console.error("Database test failed:", err);
      return res.status(500).json({ success: false, message: "DB connection failed" });
    }
    res.json({ success: true, message: "DB connected!", result: rows[0].result });
  });
});

