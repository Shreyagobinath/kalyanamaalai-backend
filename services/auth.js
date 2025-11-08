const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const AuthService = {
  async registerUser(name, email, password) {
    const [existing] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .promise()
      .query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [
        name,
        email,
        hashedPassword,
        "user",
      ]);

    return { message: "User registered successfully!" };
  },

  
  async loginUser(email, password) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "user") {
      throw new Error("Access denied: Not a user account");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      message: "User login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

 
  async loginAdmin(email, password) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    const admin = rows[0];

    if (!admin) {
      throw new Error("Admin not found");
    }

    if (admin.role !== "admin") {
      throw new Error("Access denied: Not an admin account");
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      message: "Admin login successful",
      token,
      user: { id: admin.id, name: admin.name, email: admin.email },
    };
  },
  
};

module.exports = AuthService;
