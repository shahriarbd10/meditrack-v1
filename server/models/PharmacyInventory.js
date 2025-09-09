// server/models/PharmacyInventory.js
const mongoose = require("mongoose");

const PharmacyInventorySchema = new mongoose.Schema(
  {
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchNo: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    vat: { type: Number, default: 0 }, // %
    expiryDate: { type: Date },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Optional unique combo: one row per (pharmacy, medicine, batch). Comment if you want duplicates.
// PharmacyInventorySchema.index({ pharmacyId: 1, medicineId: 1, batchNo: 1 }, { unique: true });

module.exports = mongoose.model("PharmacyInventory", PharmacyInventorySchema);
