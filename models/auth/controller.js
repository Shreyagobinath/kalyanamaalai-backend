// models/auth/controller.js
const pool = require("../../config/db"); // MySQL pool (promise)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/email");

const AuthController = {
  // ======================
  // LOGIN
  // ======================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user by email
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE email=? LIMIT 1",
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = rows[0];

      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, role: user.role || "user" },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "7d" }
      );

      // Build user object for frontend
      const responseUser = {
        id: user.id,
        full_name_en: user.full_name_en || user.name || "N/A",
        email: user.email || "-",
        gender: user.gender || null,
        city: user.city || null,
        status: user.status || "pending",
        created_at: user.created_at || null,
        photo_url: user.photo_url || "",
        role: user.role || "user",
        profile_photo: user.profile_photo || "",
        form_completed: Number(user.form_completed || 0),
        isApproved: Number(user.isApproved || 0),
        hasSubmittedForm: Number(user.hasSubmittedForm || 0)
      };

      return res.status(200).json({
        message: "Login successful",
        token,
        role: user.role || "user",
        user: responseUser
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(400).json({ message: err.message || "Login failed" });
    }
  },

  // ======================
  // REGISTER (NEW USER)
  // ======================
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const full_name_en = name; // map frontend "name" to backend "full_name_en"


      // Check required fields
      if (!full_name_en || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      // Check if user already exists
      const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
      if (existing.length) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await pool.query(
        "INSERT INTO users (full_name_en, email, password, hasSubmittedForm, isApproved, form_completed, role) VALUES (?, ?, ?, 0, 0, 0, ?)",
        [full_name_en, email, hashedPassword, role || "user"]
      );

      // Optional: send welcome email
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Kalyanamaalai",
          text: `Hi ${full_name_en}, Welcome to Kalyanamaalai!`,
          html: `<p>Hi <b>${full_name_en}</b>,</p>
                 <p>Welcome to <b>Kalyanamaalai</b> ❤️ Your account has been created successfully.</p>`
        });
      } catch (mailErr) {
        console.warn("Welcome email failed:", mailErr?.message || mailErr);
      }

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: result.insertId,
          full_name_en,
          email,
          role: role || "user",
          hasSubmittedForm: 0,
          form_completed: 0,
          isApproved: 0
        }
      });

    } catch (err) {
      console.error("Register error:", err);
      return res.status(400).json({ message: err.message || "Registration failed" });
    }
  },

  // ======================
  // CHECK FORM STATUS
  // ======================
  async checkFormStatus(req, res) {
    try {
      const userId = req.user.id;

      const [rows] = await pool.query(
        "SELECT hasSubmittedForm, isApproved, form_completed FROM users WHERE id = ?",
        [userId]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = rows[0];

      return res.json({
        hasForm: Number(user.hasSubmittedForm) === 1,
        isApproved: Number(user.isApproved) === 1,
        form_completed: Number(user.form_completed || 0)
      });
    } catch (err) {
      console.error("Form status error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // ======================
  // GET FULL USER DETAILS
  // ======================
  async getFullUserDetails(req, res) {
    try {
      const userId = req.params.id;

      const query = `
        SELECT
          id, full_name_en, dob, gender, email, phone,
          religion_en, caste_en, gothram_en, star_en, raasi_en,
          height, weight, complexion_en, education_en, occupation_en,
          income_en, address_en, father_name_en, mother_name_en,
          siblings, location, marital_status, preferred_age_range,
          preferred_religion, preferred_occupation, preferred_location,
          hasSubmittedForm, isApproved, form_completed
        FROM users
        WHERE id = ? LIMIT 1
      `;

      const [rows] = await pool.query(query, [userId]);

      if (!rows.length) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error("Error fetching user details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = AuthController;
