// server/routes/auth.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Multer setup for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safe = file.fieldname + "-" + Date.now() + ext;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Invalid file type"), ok);
  },
});

// Register: supports optional logo
router.post("/register", upload.single("logo"), register);

// Login (json body)
router.post("/login", login);

module.exports = router;
