    const express = require("express");
    const router = express.Router();
    const AdminController = require("../controller/admin");

    const { verifyToken, isAdmin } = require("../middleware/authMiddle");

    router.get("/users", verifyToken, isAdmin, AdminController.getAllUsers);
    router.delete("/user/:id", verifyToken, isAdmin, AdminController.deleteUser);

    router.get("forms/pending",verifyToken,isAdmin,AdminController.getPendingForms);
    router.put("forms/:id/approve",verifyToken,isAdmin,AdminController.approveForms);
    router.put("forms/:id/reject",verifyToken,isAdmin,AdminController.rejectForms);
    router.put("/profile",verifyToken,isAdmin,AdminController.updateProfile);


    module.exports = router;
