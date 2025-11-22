// models/user/routes.js
const express = require("express");
const router = express.Router();
const UserController = require("./controller");
const { verifyToken, authorizeRoles } = require("../../middleware/authmiddle");
const sendEmail = require("../../utils/email"); // make sure this import exists

// ==============================
// USER FORM ROUTES
// ==============================

// Submit user form (with profile photo)
router.post("/forms", verifyToken, authorizeRoles("user"), async (req, res) => {
  try {
    const { name, dob, gender, city, email } = req.body;

    // Insert into DB
    await UserController.submitForm(req, res);

    // Send JSON response
    return res.status(200).json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Form submission error:", err);
    return res.status(500).json({ message: "Error submitting form" });
  }
});

// Get all forms of current user
router.get("/forms", verifyToken, authorizeRoles("user"), UserController.getForms);

// Check current user's form & approval status
router.get("/forms/status", verifyToken, authorizeRoles("user"), UserController.checkFormStatus);

// Get specific form by ID
router.get("/forms/:id", verifyToken, authorizeRoles("user"), UserController.getFormById);

// ==============================
// APPROVED USERS
// ==============================
router.get("/approved", verifyToken, authorizeRoles("user"), UserController.getApprovedUsers);

// ==============================
// CONNECTION REQUESTS
// ==============================
router.post("/connect", verifyToken, authorizeRoles("user"), UserController.sendConnectionRequest);

// ==============================
// NOTIFICATIONS
// ==============================
router.get("/notifications", verifyToken, authorizeRoles("user"), UserController.getNotifications);
router.put("/notifications/mark-read", verifyToken, authorizeRoles("user"), UserController.markReadNotifications);

// ==============================
// ACCOUNT
// ==============================
router.get("/account-details", verifyToken, authorizeRoles("user"), UserController.getAccountDetails);
router.put("/account", verifyToken, authorizeRoles("user"), UserController.updateAccountDetails);

// ==============================
// TEST EMAIL ROUTE
// ==============================
router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "priyankaangkuraj@gmail.com",
      subject: "Test Email from API",
      text: "your email setup works!!!!!🎉",
    });

    res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email", error: err });
  }
});

module.exports = router;
