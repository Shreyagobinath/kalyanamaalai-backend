const pool = require("../../config/db"); // Use pool
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const {transporter} = require("../../utils/email"); 
const nodemailer = require("nodemailer");

const sendEmail = async ({to, subject, text, html})=>{
  try{
    const info = await transporter.sendEmail({
      from: `"Kalyanamaalai" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
  }catch (err){
    comsole.error("Failed to send email:",err);
  }
}

exports.register = async ({ name, email, password, role }) => {
  const [existing] = await pool.execute("SELECT * FROM users WHERE email=?", [email]);
  if (existing.length) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, email, hashed, role || "user"]
  );
  return result;
};

exports.login = async ({ email, password }) => {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email=?", [email]);
  const user = rows[0];
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  // Include role in the JWT
  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: "1d" }
  );

  return { token, role: user.role, user: { id: user.id, name: user.name, email: user.email } };
};
