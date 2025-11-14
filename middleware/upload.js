// middlewares/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define upload folder
const uploadDir = path.join(__dirname, "../uploads/profile_photos");

// ✅ Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
