// models/admin/routes.js
const express = require("express");
const router = express.Router();
const AdminController = require("./controller");
const { verifyToken, isAdmin } = require("../../middleware/authmiddle");
const pool = require("../../config/db"); // MySQL pool

// ==============================
// FORM MANAGEMENT
// ==============================

// Get all pending forms with user details
router.get("/forms/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
  SELECT 
    f.id AS form_id,
    f.user_id,
    u.name AS user_name,       -- correct column
    u.email AS user_email,
    u.gender AS gender,        -- correct column
    f.status
  FROM user_forms f
  JOIN users u ON f.user_id = u.id
  WHERE f.status = 'Pending'
  ORDER BY f.created_at DESC
`;

    const [rows] = await connection.query(query);
    connection.release();

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching pending forms:", err);
    res.status(500).json({ message: "Failed to fetch pending forms" });
  }
});
// ==============================
//FORM MANAGEMENT
// ==============================
// Approve a form
router.put("/forms/approve/:id", verifyToken, isAdmin, AdminController.approveForm);

// Reject a form
router.put("/forms/reject/:id", verifyToken, isAdmin, AdminController.rejectForm);

//Pending a form
router.get("/forms/pending", verifyToken, isAdmin, AdminController.getPendingForms);


// ==============================
// USERS MANAGEMENT
// ==============================

router.get("/users", verifyToken, isAdmin, AdminController.getAllUsers);

router.get("/user/:id", verifyToken, isAdmin, AdminController.getUserById);

router.delete("/user/:id", verifyToken, isAdmin, AdminController.deleteUser);

// ==============================
// CONNECTION REQUESTS
// ==============================

router.get("/connections/pending", verifyToken, isAdmin, AdminController.getPendingConnections);

router.put("/connections/approve/:id", verifyToken, isAdmin, AdminController.approveConnection);

router.put("/connections/reject/:id", verifyToken, isAdmin, AdminController.rejectConnection);

// ==============================
// ADMIN NOTIFICATIONS
// ==============================

router.get("/notifications", verifyToken, isAdmin, AdminController.getNotifications);

module.exports = router;
