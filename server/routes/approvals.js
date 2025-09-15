// server/routes/approvals.js
const express = require("express");
const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/approvals?status=pending|approved|rejected
 * Admin: list pharmacy applications by status (default: pending)
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = (req.query.status || "pending").toLowerCase();
    const list = await Pharmacy.find({ approvalStatus: status })
      .populate("ownerUserId", "name email")
      .sort({ createdAt: -1 });

    const data = list.map((ph) => ({
      _id: ph._id,
      pharmacyName: ph.pharmacyName,
      pharmacyType: ph.pharmacyType,
      licenseNo: ph.licenseNo,
      website: ph.website,
      phone: ph.phone,
      address: ph.address || {},
      approvalStatus: ph.approvalStatus,
      rejectionReason: ph.rejectionReason || "",
      reviewedBy: ph.reviewedBy || null,
      reviewedAt: ph.reviewedAt || null,
      createdAt: ph.createdAt,
      owner: ph.ownerUserId
        ? { _id: ph.ownerUserId._id, name: ph.ownerUserId.name, email: ph.ownerUserId.email }
        : null,
    }));

    res.json({ data });
  } catch (e) {
    console.error("approvals list", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/approvals/:id/approve
 */
router.post("/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Pharmacy.findByIdAndUpdate(
      id,
      {
        approvalStatus: "approved",
        isActive: true,
        rejectionReason: "",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("ownerUserId", "name email");

    if (!updated) return res.status(404).json({ msg: "Pharmacy not found" });
    res.json({ msg: "Approved", data: updated });
  } catch (e) {
    console.error("approve err", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/approvals/:id/reject
 * body: { reason?: string }
 */
router.post("/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = (req.body?.reason || "").slice(0, 300);

    const updated = await Pharmacy.findByIdAndUpdate(
      id,
      {
        approvalStatus: "rejected",
        isActive: false,
        rejectionReason: reason,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("ownerUserId", "name email");

    if (!updated) return res.status(404).json({ msg: "Pharmacy not found" });
    res.json({ msg: "Rejected", data: updated });
  } catch (e) {
    console.error("reject err", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/approvals/status/:ownerUserId
 * Pharmacy owner can check their approval status
 */
router.get("/status/:ownerUserId", requireAuth, async (req, res) => {
  try {
    const doc = await Pharmacy.findOne({ ownerUserId: req.params.ownerUserId });
    if (!doc) return res.status(404).json({ msg: "Pharmacy not found" });
    res.json({
      approvalStatus: doc.approvalStatus,
      rejectionReason: doc.rejectionReason || "",
    });
  } catch (e) {
    console.error("approval status", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
