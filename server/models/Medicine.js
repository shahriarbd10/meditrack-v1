const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  brandName: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  totalUnits: { type: Number, required: true },
  unitType: { type: String, enum: ["strip", "box"], required: true },
  buyingPrice: { type: Number, required: true },
  form: { type: String, enum: ["Tablet", "Syrup", "Capsule", "Other"], required: true },
  picture: { type: String, required: true },
  amount: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
