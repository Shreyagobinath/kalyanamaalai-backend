const express = require("express");
const router = express.Router();

// Controllers
const AuthController = require("./controller");
const UserController = require("../user/controller");

// Middleware
const { verifyToken } = require("../../middleware/authmiddle");

// Routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

// Check if form is already filled
router.get("/form-status", verifyToken, UserController.checkFormStatus);

module.exports = router;

