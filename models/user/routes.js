const express = require("express");
const router = express.Router();
const UserController = require("./controller");
const { verifyToken } = require("../../middleware/authmiddle");
const sendEmail = require("../../utils/email");

router.post("/forms", verifyToken, UserController.submitForm);
router.get("/forms", verifyToken, UserController.getForms);

router.get("/approved",verifyToken,UserController.getApprovedUsers);
router.post("/connect",verifyToken,UserController.sendConnectionRequest);
router.get("/connections/approved",verifyToken,UserController.getApprovedConnections);

router.get("/notifications",verifyToken,UserController.getNotifications);
router.put("/notifications/mark-read",verifyToken,UserController.markReadNotifications);

router.get("/account-details", verifyToken, UserController.getAccountDetails);
router.put("/account", verifyToken, UserController.updateAccountDetails);

router.get("/test-email", async (req, res)=>{
    try{
        await sendEmail({
            to: "shreyagobinath29@gmail.com",
            subject: "Test Email from API",
            text:"your email setup works!!!!!🎉"
        });

        res.json({messager:"Email sent successfully!"});   
    }catch (err){
        console.error("Email error:",err);
        res.status(500).json({message:"Failed to send email",error:err});
    }
});

module.exports = router;
