const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    medicineName: { type: String, required: true },

    batchId: { type: String, default: "" },
    expiryDate: { type: Date, default: null },

    stockQty: { type: Number, default: 0 },

    boxPattern: { type: String, default: "" }, // e.g. "3 x 10", "2*15", "1"
    unitsPerBox: { type: Number, default: 1 },

    boxQty: { type: Number, default: 0 },   // number of boxes
    quantity: { type: Number, default: 0 }, // loose units

    supplierPrice: { type: Number, default: 0 }, // price per unit
    boxMRP: { type: Number, default: 0 },

    lineTotal: { type: Number, default: 0 }, // computed
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, unique: true, index: true }, // human-friendly id
    invoiceNo: { type: String, default: "" },

    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, required: true },

    date: { type: Date, default: Date.now },
    paymentType: { type: String, default: "Cash Payment" },
    details: { type: String, default: "" },

    items: { type: [purchaseItemSchema], default: [] },

    subTotal: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
