const pool = require("../../config/db"); // Use pool
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { transporter } = require("../../utils/email");
const nodemailer = require("nodemailer");

// Function to send emails
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Kalyanamaalai" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
};

// ==========================
// REGISTER
// ==========================
exports.register = async ({ name, email, password, role }) => {
  const [existing] = await pool.execute("SELECT * FROM users WHERE email=?", [email]);
  if (existing.length) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    "INSERT INTO users (name,email,password,role,hasSubmittedForm,isApproved,form_completed) VALUES (?,?,?,?,0,0,0)",
    [name, email, hashed, role || "user"]
  );

  // Optional: send welcome email
  sendEmail({
    to: email,
    subject: "Welcome to Kalyanamaalai",
    text: `Hi ${name}, Welcome to Kalyanamaalai!`,
    html: `<p>Hi <b>${name}</b>,</p><p>Welcome to <b>Kalyanamaalai</b> ❤️ Your account has been created successfully.</p>`
  });

  return {
    id: result.insertId,
    name,
    email,
    role: role || "user",
    hasSubmittedForm: 0,
    form_completed: 0,
    isApproved: 0
  };
};

// ==========================
// LOGIN
// ==========================
exports.login = async ({ email, password }) => {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email=?", [email]);
  const user = rows[0];
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token, // JWT token
    role: user.role,
    user: {
      id: user.id,
      full_name_en: user.full_name_en || user.name,
      name: user.name || user.full_name_en,
      email: user.email,
      hasSubmittedForm: Number(user.hasSubmittedForm || 0),
      form_completed: Number(user.form_completed || 0),
      isApproved: Number(user.isApproved || 0),
    },
  };
};
