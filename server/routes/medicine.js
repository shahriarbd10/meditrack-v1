const express = require("express");
const Medicine = require("../models/Medicine");
const router = express.Router();

// Get all medicines
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching medicines", error: err.message });
  }
});

// Get single medicine by ID
router.get("/:id", async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ msg: "Medicine not found" });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching medicine", error: err.message });
  }
});

// Add new medicine
router.post("/add", async (req, res) => {
  try {
    const newMedicine = new Medicine(req.body);
    await newMedicine.save();
    res.status(201).json(newMedicine);
  } catch (err) {
    res.status(500).json({ msg: "Error adding medicine", error: err.message });
  }
});

// Edit medicine by ID
router.put("/edit/:id", async (req, res) => {
  try {
    const updatedMedicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMedicine) return res.status(404).json({ msg: "Medicine not found" });
    res.json(updatedMedicine);
  } catch (err) {
    res.status(500).json({ msg: "Error updating medicine", error: err.message });
  }
});

// Delete medicine by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Medicine not found" });
    res.json({ msg: "Medicine deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting medicine", error: err.message });
  }
});

module.exports = router;
