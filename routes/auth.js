const express = require("express");
const router = express.Router();
const AuthController = require("../controller/auth");

router.post("/register", AuthController.register);
router.post("/login", AuthController.loginUser);
router.post("/admin/login", AuthController.loginAdmin);


module.exports = router;
