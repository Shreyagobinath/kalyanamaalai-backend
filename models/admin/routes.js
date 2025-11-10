const express = require("express");
const router = express.Router();
const AdminController = require("./controller");
const { verifyToken, isAdmin } = require("../../middleware/authmiddle");

router.get("/forms/pending", verifyToken, isAdmin, AdminController.getPendingForms);
router.put("/forms/approve/:id", verifyToken, isAdmin, AdminController.approveForm);
router.put("/forms/reject/:id", verifyToken, isAdmin, AdminController.rejectForm);

router.get("/users", verifyToken, isAdmin, AdminController.getAllUsers);
router.delete("/user/:id", verifyToken, isAdmin, AdminController.deleteUser);

module.exports = router;
