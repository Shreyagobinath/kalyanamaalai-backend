// utils/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT, // e.g., 587
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS, // your email password / app password
  },
  tls:{
    rejectUnauthorized: false,
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"Kalyanamaalai" <${process.env.SMTP_USER}>`, // 👈 this line
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
