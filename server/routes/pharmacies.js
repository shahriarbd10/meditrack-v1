// server/routes/pharmacies.js
const express = require("express");
const Pharmacy = require("../models/Pharmacy");
const router = express.Router();

/**
 * GET /api/pharmacies/by-owner/:ownerUserId
 */
router.get("/by-owner/:ownerUserId", async (req, res) => {
  try {
    const doc = await Pharmacy.findOne({ ownerUserId: req.params.ownerUserId });
    if (!doc) return res.status(404).json({ message: "Pharmacy not found" });
    res.json({ data: doc });
  } catch (err) {
    console.error("Get pharmacy by owner error:", err);
    res.status(500).json({ message: "Server error while fetching pharmacy" });
  }
});

/**
 * PUT /api/pharmacies/:id  (update profile)
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    const updated = await Pharmacy.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Pharmacy not found" });
    res.json({ message: "Pharmacy updated", data: updated });
  } catch (err) {
    console.error("Update pharmacy error:", err);
    res.status(500).json({ message: "Server error while updating pharmacy" });
  }
});

module.exports = router;
