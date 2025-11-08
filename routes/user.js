const express = require("express");
const router = express.Router();
const UserController = require("../controller/user");
const { verifyToken } = require("../middleware/authMiddle");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { submitForm} = require("../controller/user");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
}).single("profilePhoto");


router.get("/profile", verifyToken, UserController.getProfile);
router.put("/profile", verifyToken, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) 
      return res.status(400).json({ message: `File upload error: ${err.message}` });
     else if (err) 
      return res.status(400).json({ message: err.message });
    return UserController.updateProfile(req, res);
  });
});

router.post("/forms",UserController.submitForm);


module.exports = router;
