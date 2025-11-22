// models/user/controller.js
const pool = require("../../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// ==============================
// Multer Setup for profile photos
// ==============================
const uploadDir = "uploads/profile_photos";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==============================
// User Controller
// ==============================
const UserController = {
  // =========================
  // User Registration
  // =========================
  registerUser: async (req, res) => {
    upload.single("profile_photo")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: "File upload error", error: err });

      const {
        name,
        email,
        gender,
        password,
        phone,
        address_en,
        dob,
        father_name_en,
        mother_name_en,
        siblings,
        location,
        marital_status,
        // user_forms fields
        full_name_en,
        religion_en,
        caste_en,
        gothram_en,
        star_en,
        raasi_en,
        height,
        weight,
        complexion_en,
        education_en,
        occupation_en,
        income_en,
        preferred_age_range,
        preferred_religion,
        preferred_occupation,
        preferred_location
      } = req.body;

      if (!name || !email || !gender || !password)
        return res.status(400).json({ message: "Missing required fields" });

      const photo = req.file ? req.file.filename : null;

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table
        const [userResult] = await conn.query(
          `INSERT INTO users
            (name, full_name_en, email, gender, password, phone, address_en, dob, father_name_en, mother_name_en, siblings, location, marital_status, profile_photo, hasSubmittedForm, isApproved)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
          [
            name,
            full_name_en || name,
            email,
            gender,
            hashedPassword,
            phone,
            address_en,
            dob,
            father_name_en,
            mother_name_en,
            siblings,
            location,
            marital_status,
            photo
          ]
        );

        const userId = userResult.insertId;

        // Insert into user_forms table
        await conn.query(
          `INSERT INTO user_forms
            (user_id, full_name_en, religion_en, caste_en, gothram_en, star_en, raasi_en,
             height, weight, complexion_en, education_en, occupation_en, income_en,
             preferred_age_range, preferred_religion, preferred_occupation, preferred_location,
             profile_photo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            full_name_en || name,
            religion_en,
            caste_en,
            gothram_en,
            star_en,
            raasi_en,
            height,
            weight,
            complexion_en,
            education_en,
            occupation_en,
            income_en,
            preferred_age_range,
            preferred_religion,
            preferred_occupation,
            preferred_location,
            photo
          ]
        );

        await conn.commit();
        return res.status(201).json({ message: "User registered successfully", userId });
      } catch (e) {
        await conn.rollback();
        console.error("Registration error:", e);
        return res.status(500).json({ message: "Server error", error: e });
      } finally {
        conn.release();
      }
    });
  },

  // =========================
  // Submit or update user form
  // =========================
  submitForm: async (req, res) => {
    upload.single("profile_photo")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: "File upload error", error: err });

      const conn = await pool.getConnection();
      try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const {
          full_name_en,
          gender,
          dob,
          email,
          phone,
          address_en,
          education_en,
          occupation_en,
          income_en,
          father_name_en,
          mother_name_en,
          siblings,
          location,
          marital_status,
          preferred_age_range,
          preferred_religion,
          preferred_occupation,
          preferred_location,
          religion_en,
          caste_en,
          gothram_en,
          star_en,
          raasi_en,
          height,
          weight,
          complexion_en,
        } = req.body;

        const photo = req.file ? req.file.filename : null;

        const [[existing]] = await conn.query(
          "SELECT * FROM user_forms WHERE user_id=? LIMIT 1",
          [userId]
        );

        await conn.beginTransaction();

        if (!existing) {
          // Insert new form
          await conn.query(
            `INSERT INTO user_forms
              (user_id, full_name_en, religion_en, caste_en, gothram_en, star_en, raasi_en,
               height, weight, complexion_en, education_en, occupation_en, income_en,
               preferred_age_range, preferred_religion, preferred_occupation, preferred_location,
               profile_photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              full_name_en,
              religion_en,
              caste_en,
              gothram_en,
              star_en,
              raasi_en,
              height,
              weight,
              complexion_en,
              education_en,
              occupation_en,
              income_en,
              preferred_age_range,
              preferred_religion,
              preferred_occupation,
              preferred_location,
              photo
            ]
          );
        } else {
          // Update existing form
          await conn.query(
            `UPDATE user_forms SET
              full_name_en=?, gender=?, dob=?, email=?, phone=?, address_en=?,
              education_en=?, occupation_en=?, income_en=?, father_name_en=?, mother_name_en=?,
              siblings=?, location=?, marital_status=?, preferred_age_range=?, preferred_religion=?,
              preferred_occupation=?, preferred_location=?, religion_en=?, caste_en=?, gothram_en=?,
              star_en=?, raasi_en=?, height=?, weight=?, complexion_en=?, profile_photo=?
              WHERE user_id=?`,
            [
              full_name_en, gender, dob, email, phone, address_en,
              education_en, occupation_en, income_en, father_name_en, mother_name_en,
              siblings, location, marital_status, preferred_age_range, preferred_religion,
              preferred_occupation, preferred_location, religion_en, caste_en, gothram_en,
              star_en, raasi_en, height, weight, complexion_en, photo, userId
            ]
          );
        }

        // Update users table for quick reference
        await conn.query(
          "UPDATE users SET full_name_en=?, gender=?, hasSubmittedForm=1, isApproved=0 WHERE id=?",
          [full_name_en, gender, userId]
        );

        await conn.commit();
        return res.status(200).json({ message: "Form submitted successfully" });
      } catch (e) {
        await conn.rollback();
        console.error("Form submission error:", e);
        return res.status(500).json({ message: "Server error", error: e });
      } finally {
        conn.release();
      }
    });
  },

  // =========================
  // Other existing methods
  // (getForms, getFormById, checkFormStatus,
  // getApprovedUsers, sendConnectionRequest,
  // notifications, account details, etc.)
  // =========================
  getForms: async (req, res) => { /* unchanged */ },
  checkFormStatus: async (req, res) => { /* unchanged */ },
  getFormById: async (req, res) => { /* unchanged */ },
  getApprovedUsers: async (req, res) => { /* unchanged */ },
  sendConnectionRequest: async (req, res) => { /* unchanged */ },
  getNotifications: async (req, res) => { /* unchanged */ },
  markReadNotifications: async (req, res) => { /* unchanged */ },
  getAccountDetails: async (req, res) => { /* unchanged */ },
  updateAccountDetails: async (req, res) => { /* unchanged */ },
};

module.exports = UserController;
