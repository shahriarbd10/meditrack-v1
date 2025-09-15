// server/models/Pharmacy.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  division: String,
  district: String,
  upazila: String,
  street: String,
  postcode: String,
});

const PharmacySchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // fast lookups by owner
      // If you want exactly one pharmacy per owner, uncomment the next line:
      // unique: true,
    },

    pharmacyName: { type: String, required: true, trim: true },
    pharmacyType: {
      type: String,
      enum: ["Retail", "Hospital", "Wholesale"],
      default: "Retail",
    },
    licenseNo: { type: String, required: true, trim: true },
    binVat: { type: String, default: "" },
    establishedYear: Number,
    staffCount: { type: Number, default: 1 },
    openingHours: { type: String, default: "" }, // e.g. "Sat–Thu 9:00–21:00"
    website: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: AddressSchema,
    logoUrl: { type: String, default: "" }, // "/uploads/xyz.png"

    // --- Approval pipeline ---
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    // operational toggle (mirrors approval in this flow)
    isActive: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Helpful compound index for admin views (optional)
PharmacySchema.index({ approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Pharmacy", PharmacySchema);
