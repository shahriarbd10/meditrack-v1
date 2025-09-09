// server/models/Pharmacy.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  division: { type: String },
  district: { type: String },
  upazila: { type: String },
  street: { type: String },
  postcode: { type: String },
});

const PharmacySchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pharmacyName: { type: String, required: true },
    pharmacyType: { type: String, enum: ["Retail", "Hospital", "Wholesale"], default: "Retail" },
    licenseNo: { type: String, required: true },
    binVat: { type: String },
    establishedYear: { type: Number },
    staffCount: { type: Number, default: 1 },
    openingHours: { type: String }, // e.g. "Sat–Thu 9:00–21:00"
    website: { type: String },
    phone: { type: String },
    address: AddressSchema,
    logoUrl: { type: String }, // e.g. "/uploads/xyz.png"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pharmacy", PharmacySchema);
