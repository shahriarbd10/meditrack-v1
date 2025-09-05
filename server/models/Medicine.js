const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    // left column
    barcode: { type: String, trim: true },                 // Bar Code/QR
    strength: { type: String, trim: true },                // Strength
    boxSize: { type: String, trim: true },                 // Leaf Setting value e.g. "3x10"
    shelf: { type: String, trim: true },                   // Shelf code

    category: { type: String, required: true, trim: true },
    type: { type: String, trim: true },                    // Medicine Type
    supplier: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },

    // right column
    name: { type: String, required: true, trim: true },    // Medicine Name
    genericName: { type: String, required: true, trim: true },
    details: { type: String, trim: true },                 // Medicine details/description
    price: { type: Number, required: true, default: 0 },   // Sale price
    supplierPrice: { type: Number, required: true, default: 0 },
    vat: { type: Number, default: 0 },                     // %
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    imageUrl: { type: String, trim: true },                // e.g. /uploads/medicines/abc.webp

    // NEW
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
