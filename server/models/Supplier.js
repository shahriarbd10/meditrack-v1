const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    manufacturerName: { type: String, required: true, trim: true, unique: true },
    contactName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    previousBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
