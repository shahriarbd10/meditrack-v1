// server/models/Medicine.js
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    // left column
    barcode:  { type: String, trim: true },
    strength: { type: String, trim: true },
    boxSize:  { type: String, trim: true }, // e.g. "3x10" or "30"
    shelf:    { type: String, trim: true },

    category: { type: String, required: true, trim: true },
    type:     { type: String, trim: true },
    supplier: { type: String, required: true, trim: true },
    unit:     { type: String, required: true, trim: true },

    // right column
    name:        { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    details:     { type: String, trim: true },
    price:         { type: Number, required: true, default: 0 },
    supplierPrice: { type: Number, required: true, default: 0 },
    vat:           { type: Number, default: 0 }, // %
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    imageUrl: { type: String, trim: true },

    // NEW
    expiryDate: { type: Date, default: null },
    totalUnits: { type: Number, required: true, default: 0 }, // ← stock used by AddInvoice
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
