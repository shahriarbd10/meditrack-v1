const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// GET staff filtered by pharmacyId
router.get("/", async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    if (!pharmacyId) {
      return res.status(400).json({ msg: "pharmacyId query parameter is required" });
    }
    const staffUsers = await User.find({ role: "staff", pharmacyId });
    res.json(staffUsers);
  } catch (err) {
    res.status(500).json({ msg: "Server error fetching staff", error: err.message });
  }
});

// POST create new staff user
router.post("/", async (req, res) => {
  const { name, email, password, pharmacyId } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Staff user already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staffUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "staff",
      pharmacyId,
    });

    await staffUser.save();
    res.status(201).json({ msg: "Staff user created", user: staffUser });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
