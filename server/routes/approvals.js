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
 * POST /api/approvals/resubmit
 * Resubmit (reset) the form for the owner so it goes for NEW approval.
 * - Accepts one of:
 *    - body.email
 *    - body.ownerUserId
 *    - else falls back to req.user.id (authenticated user)
 * - Overwrites fields for that owner's Pharmacy doc (or creates one if missing)
 * - Sets approvalStatus="pending", clears rejection data, sets isActive=false
 *
 * body:
 * {
 *   email?: string,
 *   ownerUserId?: string,
 *   pharmacyName?: string,
 *   pharmacyType?: string,
 *   licenseNo?: string,
 *   binVat?: string,
 *   staffCount?: number,
 *   openingHours?: string,
 *   website?: string,
 *   phone?: string,
 *   address?: { line1?, line2?, city?, state?, postcode?, country? }
 * }
 */
router.post("/resubmit", requireAuth, async (req, res) => {
  try {
    const {
      email,
      ownerUserId: ownerFromBody,
      pharmacyName,
      pharmacyType,
      licenseNo,
      binVat,
      staffCount,
      openingHours,
      website,
      phone,
      address,
    } = req.body || {};

    // 1) Resolve owner
    let ownerUserId = ownerFromBody;
    if (!ownerUserId && email) {
      const u = await User.findOne({ email: String(email).trim().toLowerCase() });
      if (!u) return res.status(404).json({ msg: "Owner (by email) not found" });
      ownerUserId = u._id;
    }
    if (!ownerUserId) {
      // default to the caller
      ownerUserId = req.user.id;
    }

    // AuthZ: if caller is not admin, they can only resubmit for themselves
    if (!req.user?.isAdmin && String(ownerUserId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    // 2) Upsert pharmacy for owner (single-record-per-owner pattern)
    const baseUpdates = {
      ownerUserId,
      pharmacyName: pharmacyName ?? "",
      pharmacyType: pharmacyType ?? "",
      licenseNo: licenseNo ?? "",
      binVat: binVat ?? "",
      staffCount: typeof staffCount === "number" ? staffCount : Number(staffCount || 0),
      openingHours: openingHours ?? "",
      website: website ?? "",
      phone: phone ?? "",
      address: {
        line1: address?.line1 ?? "",
        line2: address?.line2 ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        postcode: address?.postcode ?? "",
        country: address?.country ?? "",
      },
      // RESET approval state
      approvalStatus: "pending",
      isActive: false,
      rejectionReason: "",
      reviewedBy: null,
      reviewedAt: null,
    };

    // Try find existing record for this owner
    let existing = await Pharmacy.findOne({ ownerUserId });

    if (!existing) {
      // create new record
      const created = await Pharmacy.create(baseUpdates);
      return res.status(201).json({ msg: "Resubmitted (created new)", data: created });
    }

    // overwrite existing & reset approval flags
    existing.set(baseUpdates);
    const saved = await existing.save();

    return res.json({ msg: "Resubmitted (reset & pending)", data: saved });
  } catch (e) {
    console.error("resubmit reset err", e);
    return res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/approvals/status/:ownerUserId
 * Pharmacy owner can check their approval status
 * (If you keep a single record per owner, this is enough;
 * if you ever allow multiple submissions per owner, sort by newest.)
 */
router.get("/status/:ownerUserId", requireAuth, async (req, res) => {
  try {
    // If you ever support multiple records per owner, add `.sort({ createdAt: -1 })`
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
