const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/stats", async (req, res) => {
  try {
    const totalPharmacies = await User.countDocuments({ role: "pharmacy" });
    const totalStaff = await User.countDocuments({ role: "staff" });
    const activeUsers = await User.countDocuments(); // all users

    res.json({ totalPharmacies, totalStaff, activeUsers });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
