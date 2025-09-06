// server/models/Invoice.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true },
    batch: { type: String, default: "" },
    expiryDate: { type: String, default: "" }, // keep as string for simplicity
    unit: { type: String, default: "None" },
    qty: { type: Number, default: 0 },     // raw inputs
    boxQty: { type: Number, default: 0 },  // raw inputs
    price: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    vatPct: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, default: "" },
    customerName: { type: String, required: true },
    date: { type: String, required: true }, // yyyy-mm-dd
    paymentType: { type: String, default: "Cash Payment" },
    details: { type: String, default: "" },
    previousDue: { type: Number, default: 0 },

    items: { type: [itemSchema], default: [] },

    subTotal:       { type: Number, default: 0 },
    invoiceDiscount:{ type: Number, default: 0 },
    totalDiscount:  { type: Number, default: 0 },
    totalVat:       { type: Number, default: 0 },
    grandTotal:     { type: Number, default: 0 },
    netTotal:       { type: Number, default: 0 },
    paidAmount:     { type: Number, default: 0 },
    dueAmount:      { type: Number, default: 0 },
    change:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
