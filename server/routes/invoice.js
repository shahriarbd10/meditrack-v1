// server/routes/invoice.js
const express = require("express");
const router = express.Router();

const Invoice  = require("../models/Invoice");
const Counter  = require("../models/Counter");
const Medicine = require("../models/Medicine"); // assumed existing

/* =======================
   Helpers
======================= */
const num = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

/**
 * Recompute totals on the server from raw payload.
 * Returns sanitized items + all totals.
 */
function recomputeTotals(payload = {}) {
  const srcItems = Array.isArray(payload.items) ? payload.items : [];

  let subTotal = 0;
  let itemsDiscount = 0;
  let totalVat = 0;

  const items = srcItems.map((r) => {
    const qty        = num(r.qty);
    const boxQty     = num(r.boxQty);
    const price      = num(r.price);
    const discountPct= num(r.discountPct);
    const vatPct     = num(r.vatPct);

    const qtyEff     = qty + boxQty;
    const base       = qtyEff * price;
    const itemDisc   = (base * discountPct) / 100;
    const itemVat    = (base * vatPct) / 100;
    const lineTotal  = +(base - itemDisc).toFixed(2);

    subTotal       += base;
    itemsDiscount  += itemDisc;
    totalVat       += itemVat;

    return {
      medicineName: r.medicineName || "",
      batch: r.batch || "",
      expiryDate: r.expiryDate ? new Date(r.expiryDate) : undefined,
      unit: r.unit || "None",
      qty,
      boxQty,
      price,
      discountPct,
      vatPct,
      lineTotal,
    };
  });

  const invoiceDiscount = num(payload.invoiceDiscount);
  const previousDue     = num(payload.previousDue);
  const paidAmount      = num(payload.paidAmount);

  const grandTotal = subTotal - itemsDiscount - invoiceDiscount + totalVat;
  const netTotal   = grandTotal + previousDue;

  const dueAmount  = Math.max(0, +(netTotal - paidAmount).toFixed(2));
  const change     = Math.max(0, +(paidAmount - netTotal).toFixed(2));
  const totalDiscount = itemsDiscount + invoiceDiscount;

  return {
    items,
    subTotal:       +subTotal.toFixed(2),
    totalVat:       +totalVat.toFixed(2),
    invoiceDiscount:+invoiceDiscount.toFixed(2),
    totalDiscount:  +totalDiscount.toFixed(2),
    grandTotal:     +grandTotal.toFixed(2),
    netTotal:       +netTotal.toFixed(2),
    paidAmount:     +paidAmount.toFixed(2),
    dueAmount,
    change,
  };
}

/* =======================
   POST /add
======================= */
router.post("/add", async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.customerName) {
      return res.status(400).json({ message: "customerName is required" });
    }
    if (!body.date) {
      return res.status(400).json({ message: "date is required" });
    }

    // Auto-generate invoice number if missing
    let invoiceNo = body.invoiceNo;
    if (!invoiceNo) {
      const next = await Counter.next("invoice");
      invoiceNo = String(next);
    }

    // Recompute server-side
    const totals = recomputeTotals(body);

    // Stock checks & decrement (match by name; allow manual lines)
    for (const it of totals.items) {
      if (!it.medicineName) continue;
      const m = await Medicine.findOne({ name: it.medicineName });
      if (!m) continue;

      const consume = num(it.qty) + num(it.boxQty);
      const available = num(m.totalUnits);
      if (available < consume) {
        return res.status(400).json({
          message: `Insufficient stock for ${m.name}. Available: ${available}, required: ${consume}`,
        });
      }
    }
    for (const it of totals.items) {
      if (!it.medicineName) continue;
      const m = await Medicine.findOne({ name: it.medicineName });
      if (!m) continue;
      const consume = num(it.qty) + num(it.boxQty);
      m.totalUnits = num(m.totalUnits) - consume;
      await m.save();
    }

    const doc = await Invoice.create({
      invoiceNo,
      date: new Date(body.date),
      details: body.details || "",
      paymentType: body.paymentType || "Cash Payment",
      customerName: body.customerName,
      previousDue: num(body.previousDue),

      items: totals.items,

      subTotal: totals.subTotal,
      invoiceDiscount: totals.invoiceDiscount,
      totalDiscount: totals.totalDiscount,
      totalVat: totals.totalVat,
      grandTotal: totals.grandTotal,
      netTotal: totals.netTotal,

      paidAmount: totals.paidAmount,
      dueAmount: totals.dueAmount,
      change: totals.change,
    });

    return res.status(201).json({ message: "Invoice created", data: doc });
  } catch (err) {
    console.error("POST /api/invoices/add error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET /
======================= */
router.get("/", async (_req, res) => {
  try {
    const list = await Invoice.find().sort({ createdAt: -1 });
    return res.json({ data: list });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET /:id
======================= */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Invoice not found" });
    return res.json({ data: doc });
  } catch (err) {
    console.error("GET /api/invoices/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   PUT /:id
   (Note: stock reconciliation is not handled here)
======================= */
router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const totals = recomputeTotals(body);

    const update = {
      invoiceNo: body.invoiceNo,
      date: body.date ? new Date(body.date) : undefined,
      details: body.details,
      paymentType: body.paymentType,
      customerName: body.customerName,
      previousDue: num(body.previousDue),

      items: totals.items,

      subTotal: totals.subTotal,
      invoiceDiscount: totals.invoiceDiscount,
      totalDiscount: totals.totalDiscount,
      totalVat: totals.totalVat,
      grandTotal: totals.grandTotal,
      netTotal: totals.netTotal,

      paidAmount: totals.paidAmount,
      dueAmount: totals.dueAmount,
      change: totals.change,
    };

    const doc = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Invoice not found" });
    return res.json({ message: "Invoice updated", data: doc });
  } catch (err) {
    console.error("PUT /api/invoices/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   DELETE /:id
   (Restore stock for the deleted invoice)
======================= */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Invoice not found" });

    // restore stock
    for (const it of doc.items) {
      if (!it.medicineName) continue;
      const m = await Medicine.findOne({ name: it.medicineName });
      if (!m) continue;
      const restore = num(it.qty) + num(it.boxQty);
      m.totalUnits = num(m.totalUnits) + restore;
      await m.save();
    }

    await doc.deleteOne();
    return res.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("DELETE /api/invoices/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
