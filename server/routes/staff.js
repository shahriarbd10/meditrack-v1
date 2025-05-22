const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Middleware to verify pharmacy user (add your auth middleware here)

router.post("/", async (req, res) => {
  const { name, email, password, pharmacyId } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Staff user exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staffUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "staff",
      pharmacyId, // link to pharmacy user if needed
    });

    await staffUser.save();
    res.status(201).json({ msg: "Staff user created" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
