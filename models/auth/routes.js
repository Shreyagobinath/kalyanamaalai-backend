// backend/routes/auth.js
const express = require("express");
const router = express.Router();

// Controllers
const AuthController = require("./controller");
// Middleware
const { verifyToken } = require("../../middleware/authmiddle");

// ==============================
// AUTH ROUTES
// ==============================

// LOGIN
router.post("/login", AuthController.login);

// REGISTER
router.post("/register", AuthController.register);

// ==============================
// CHECK FORM & APPROVAL STATUS
// Protected route: user must be logged in
// ==============================
router.get("/check-form-status", verifyToken, AuthController.checkFormStatus);

// ==============================
// GET FULL USER DETAILS BY ID
// Protected route: user must be logged in
// ==============================
router.get("/user/:id", verifyToken, AuthController.getFullUserDetails);

module.exports = router;
