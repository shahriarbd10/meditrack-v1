// server/routes/pharmacyInventory.js
const express = require("express");
const PharmacyInventory = require("../models/PharmacyInventory");

const router = express.Router();

/**
 * GET /api/pharmacy-inventory?pharmacyId=abc
 * Optional: &q=search (matches populated medicine name/generic)
 */
router.get("/", async (req, res) => {
  try {
    const { pharmacyId, q } = req.query;
    if (!pharmacyId) return res.status(400).json({ message: "pharmacyId is required" });

    // Populate basic medicine info for UI
    const list = await PharmacyInventory.find({ pharmacyId })
      .populate({ path: "medicineId", select: "name genericName category imageUrl amount strength price vat" })
      .sort({ createdAt: -1 });

    if (!q || !q.trim()) return res.json({ data: list });

    const s = q.toLowerCase();
    const filtered = list.filter((row) => {
      const m = row.medicineId || {};
      const fields = [m.name, m.genericName, m.category].filter(Boolean).map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
    res.json({ data: filtered });
  } catch (err) {
    console.error("List pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while listing pharmacy inventory" });
  }
});

/**
 * POST /api/pharmacy-inventory
 * body: { pharmacyId, medicineId, batchNo, stock, minStock, purchasePrice, sellingPrice, vat, expiryDate, notes }
 */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.pharmacyId || !payload.medicineId) {
      return res.status(400).json({ message: "pharmacyId and medicineId are required" });
    }
    const created = await PharmacyInventory.create(payload);
    const doc = await created.populate({ path: "medicineId", select: "name genericName category imageUrl amount strength price vat" });
    res.status(201).json({ message: "Item added", data: doc });
  } catch (err) {
    console.error("Create pharmacy inventory error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "This medicine/batch already exists for this pharmacy." });
    }
    res.status(500).json({ message: "Server error while adding inventory item" });
  }
});

/**
 * PUT /api/pharmacy-inventory/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    const updated = await PharmacyInventory.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate({ path: "medicineId", select: "name genericName category imageUrl amount strength price vat" });

    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item updated", data: updated });
  } catch (err) {
    console.error("Update pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while updating inventory item" });
  }
});

/**
 * DELETE /api/pharmacy-inventory/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await PharmacyInventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted", data: deleted });
  } catch (err) {
    console.error("Delete pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while deleting inventory item" });
  }
});

module.exports = router;
