// server/controllers/approvalController.js
const Approval = require("../models/Approval");
const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");

// GET /api/approvals?status=pending|approved|rejected (default: pending)
exports.list = async (req, res) => {
  try {
    const status = (req.query.status || "pending").toLowerCase();
    const rows = await Approval.find({ status })
      .sort({ createdAt: -1 })
      .populate({ path: "pharmacyId", model: "Pharmacy" })
      .populate({ path: "ownerUserId", model: "User" });

    // Normalize shape for the frontend
    const data = rows.map((r) => ({
      _id: r._id,
      status: r.status,
      createdAt: r.createdAt,
      reason: r.reason || "",
      pharmacy: r.pharmacyId
        ? {
            _id: r.pharmacyId._id,
            pharmacyName: r.pharmacyId.pharmacyName,
            pharmacyType: r.pharmacyId.pharmacyType,
            licenseNo: r.pharmacyId.licenseNo,
            website: r.pharmacyId.website,
            phone: r.pharmacyId.phone,
            address: r.pharmacyId.address || {},
          }
        : null,
      owner: r.ownerUserId
        ? {
            _id: r.ownerUserId._id,
            name: r.ownerUserId.name,
            email: r.ownerUserId.email,
            phone: r.pharmacyId?.phone || "", // prefer pharmacy phone if provided
          }
        : null,
    }));

    res.json({ data });
  } catch (err) {
    console.error("Approvals list error:", err);
    res.status(500).json({ message: "Server error while fetching approvals" });
  }
};

// POST /api/approvals/:id/approve
exports.approve = async (req, res) => {
  try {
    const id = req.params.id;
    const approverId = req.user?.id || null; // if you have auth middleware; otherwise null

    const ap = await Approval.findById(id);
    if (!ap) return res.status(404).json({ message: "Approval not found" });
    if (ap.status !== "pending")
      return res.status(400).json({ message: "Only pending approvals can be approved" });

    // Activate the pharmacy
    const ph = await Pharmacy.findById(ap.pharmacyId);
    if (!ph) return res.status(404).json({ message: "Pharmacy not found" });
    ph.isActive = true;
    await ph.save();

    // Optionally ensure user role is pharmacy (if you want to gate by role)
    const user = await User.findById(ap.ownerUserId);
    if (user && user.role !== "pharmacy") {
      user.role = "pharmacy";
      await user.save();
    }

    ap.status = "approved";
    ap.reviewedBy = approverId;
    ap.reviewedAt = new Date();
    await ap.save();

    res.json({ message: "Approved", data: { id: ap._id } });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ message: "Server error while approving" });
  }
};

// POST /api/approvals/:id/reject { reason? }
exports.reject = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason = "" } = req.body || {};
    const approverId = req.user?.id || null;

    const ap = await Approval.findById(id);
    if (!ap) return res.status(404).json({ message: "Approval not found" });
    if (ap.status !== "pending")
      return res.status(400).json({ message: "Only pending approvals can be rejected" });

    // Keep pharmacy inactive on rejection
    const ph = await Pharmacy.findById(ap.pharmacyId);
    if (!ph) return res.status(404).json({ message: "Pharmacy not found" });
    ph.isActive = false;
    await ph.save();

    ap.status = "rejected";
    ap.reason = reason;
    ap.reviewedBy = approverId;
    ap.reviewedAt = new Date();
    await ap.save();

    res.json({ message: "Rejected", data: { id: ap._id } });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ message: "Server error while rejecting" });
  }
};
