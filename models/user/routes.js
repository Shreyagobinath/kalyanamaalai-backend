const express = require("express");
const router = express.Router();
const UserController = require("./controller");
const { verifyToken } = require("../../middleware/authmiddle");

router.post("/forms", verifyToken, UserController.submitForm);
router.get("/forms", verifyToken, UserController.getForms);

router.get("/approved",verifyToken,UserController.getApprovedUsers);
router.post("/connect",verifyToken,UserController.sendConnectionRequest);
router.get("/notifications",verifyToken,UserController.getNotifications);

router.get("/notifications",verifyToken,UserController.getNotifications);
router.put("/notifications/mark-read",verifyToken,UserController.markReadNotifications);

router.get("/account-details", verifyToken, UserController.getAccountDetails);
router.put("/account", verifyToken, UserController.updateAccountDetails);

module.exports = router;
