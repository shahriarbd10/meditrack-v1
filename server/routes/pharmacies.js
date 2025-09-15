// server/routes/pharmacies.js
const express = require("express");
const Pharmacy = require("../models/Pharmacy");
const router = express.Router();

/**
 * GET /api/pharmacies/by-owner/:ownerUserId
 * Return the MOST RECENT pharmacy doc for this owner.
 */
router.get("/by-owner/:ownerUserId", async (req, res) => {
  try {
    const doc = await Pharmacy.findOne({ ownerUserId: req.params.ownerUserId })
      .sort({ createdAt: -1 });
    if (!doc) return res.status(404).json({ message: "Pharmacy not found" });
    res.json({ data: doc });
  } catch (err) {
    console.error("Get pharmacy by owner error:", err);
    res.status(500).json({ message: "Server error while fetching pharmacy" });
  }
});

/**
 * PUT /api/pharmacies/:id
 * Update existing doc. If body.resubmit === true, reset to pending.
 * (Legacy edit path that you already had working.)
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.resubmit) {
      updates.approvalStatus = "pending";
      updates.isActive = false;
      updates.rejectionReason = "";
      updates.reviewedBy = null;
      updates.reviewedAt = null;
    }

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

/**
 * POST /api/pharmacies
 * Generic create: submit a NEW pharmacy application.
 */
router.post("/", async (req, res) => {
  try {
    const payload = {
      ownerUserId: req.body.ownerUserId,
      pharmacyName: req.body.pharmacyName,
      pharmacyType: req.body.pharmacyType,
      licenseNo: req.body.licenseNo,
      binVat: req.body.binVat,
      staffCount: req.body.staffCount,
      openingHours: req.body.openingHours,
      website: req.body.website,
      phone: req.body.phone,
      address: req.body.address,
      approvalStatus: "pending",
      isActive: false,
      rejectionReason: "",
      reviewedBy: null,
      reviewedAt: null,
      resubmissionOf: req.body.resubmissionOf || null,
    };

    const created = await Pharmacy.create(payload);
    res.status(201).json({ message: "Pharmacy submitted", data: created });
  } catch (err) {
    console.error("Create pharmacy error:", err);
    // Helpful detail if unique index exists on ownerUserId
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate ownerUserId. Multiple submissions may be blocked by schema." });
    }
    res.status(500).json({ message: "Server error while creating pharmacy" });
  }
});

/**
 * POST /api/pharmacies/resubmit
 * Preferred “create-as-new” endpoint for resubmission.
 */
router.post("/resubmit", async (req, res) => {
  try {
    const payload = {
      ownerUserId: req.body.ownerUserId,
      pharmacyName: req.body.pharmacyName,
      pharmacyType: req.body.pharmacyType,
      licenseNo: req.body.licenseNo,
      binVat: req.body.binVat,
      staffCount: req.body.staffCount,
      openingHours: req.body.openingHours,
      website: req.body.website,
      phone: req.body.phone,
      address: req.body.address,
      approvalStatus: "pending",
      isActive: false,
      rejectionReason: "",
      reviewedBy: null,
      reviewedAt: null,
      resubmissionOf: req.body.resubmissionOf || null,
    };

    const created = await Pharmacy.create(payload);
    res.status(201).json({ message: "Resubmitted as new", data: created });
  } catch (err) {
    console.error("Resubmit pharmacy error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate ownerUserId. Multiple submissions may be blocked by schema." });
    }
    res.status(500).json({ message: "Server error while resubmitting pharmacy" });
  }
});

module.exports = router;
