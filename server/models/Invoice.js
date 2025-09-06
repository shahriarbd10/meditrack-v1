// server/models/Invoice.js
const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    medicineName: { type: String, required: true },
    batch: { type: String, default: "" },
    expiryDate: { type: Date },
    unit: { type: String, default: "None" },
    qty: { type: Number, default: 0 },
    boxQty: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    vatPct: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 }, // base - itemDiscount
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, index: true }, // auto if not provided
    date: { type: Date, required: true },
    details: { type: String, default: "" },
    paymentType: { type: String, default: "Cash Payment" },

    customerName: { type: String, required: true },
    previousDue: { type: Number, default: 0 },

    items: { type: [InvoiceItemSchema], default: [] },

    subTotal: { type: Number, default: 0 },
    invoiceDiscount: { type: Number, default: 0 }, // absolute amount
    totalDiscount: { type: Number, default: 0 },  // item + invoice-level
    totalVat: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },     // sub - totalDiscount + totalVat
    netTotal: { type: Number, default: 0 },       // grand + previousDue

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
