const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"Kalyanamaalai" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
