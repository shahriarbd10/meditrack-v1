// server/routes/invoice.js
const express  = require("express");
const mongoose = require("mongoose");
const router   = express.Router();

const Invoice  = require("../models/Invoice");
const Counter  = require("../models/Counter");
const Medicine = require("../models/Medicine");

/* =======================
   Helpers
======================= */
const n = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const effUnits = (qty, boxQty) => (n(qty) || 1) * (n(boxQty) || 1); // STRICT MULTIPLICATION

function toDateStr(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/**
 * Recompute totals on the server from raw payload.
 * Returns sanitized items + all totals.
 * NOTE: Keeps expiryDate as yyyy-mm-dd STRING.
 */
function recomputeTotals(payload = {}) {
  const srcItems = Array.isArray(payload.items) ? payload.items : [];

  let subTotal = 0;
  let itemsDiscount = 0;
  let totalVat = 0;

  const items = srcItems.map((r) => {
    const qty         = n(r.qty);
    const boxQty      = n(r.boxQty);
    const price       = n(r.price);
    const discountPct = n(r.discountPct);
    const vatPct      = n(r.vatPct);

    const qtyEff    = effUnits(qty, boxQty);
    const base      = qtyEff * price;
    const itemDisc  = (base * discountPct) / 100;
    const itemVat   = (base * vatPct) / 100;
    const lineTotal = +(base - itemDisc).toFixed(2);

    subTotal      += base;
    itemsDiscount += itemDisc;
    totalVat      += itemVat;

    return {
      medicineName: r.medicineName || "",
      batch: r.batch || "",
      expiryDate: toDateStr(r.expiryDate), // keep string
      unit: r.unit || "None",
      qty,
      boxQty,
      price,
      discountPct,
      vatPct,
      lineTotal,
    };
  });

  const invoiceDiscount = n(payload.invoiceDiscount);
  const previousDue     = n(payload.previousDue);
  const paidAmount      = n(payload.paidAmount);

  const grandTotal    = subTotal - itemsDiscount - invoiceDiscount + totalVat;
  const netTotal      = grandTotal + previousDue;
  const dueAmount     = Math.max(0, +(netTotal - paidAmount).toFixed(2));
  const change        = Math.max(0, +(paidAmount - netTotal).toFixed(2));
  const totalDiscount = itemsDiscount + invoiceDiscount;

  return {
    items,
    subTotal:        +subTotal.toFixed(2),
    totalVat:        +totalVat.toFixed(2),
    invoiceDiscount: +invoiceDiscount.toFixed(2),
    totalDiscount:   +totalDiscount.toFixed(2),
    grandTotal:      +grandTotal.toFixed(2),
    netTotal:        +netTotal.toFixed(2),
    paidAmount:      +paidAmount.toFixed(2),
    dueAmount,
    change,
  };
}

/* =======================
   POST /add
======================= */
router.post("/add", async (req, res) => {
  const session = await mongoose.startSession();
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

    // Recompute server-side with the strict multiply rule
    const totals = recomputeTotals(body);

    await session.withTransaction(async () => {
      // Stock checks (only for lines that match an existing medicine by name)
      for (const it of totals.items) {
        if (!it.medicineName) continue;
        const med = await Medicine.findOne({ name: it.medicineName }).session(session);
        if (!med) continue; // manual item is allowed

        const consume = effUnits(it.qty, it.boxQty);
        const available = n(med.totalUnits);
        if (available < consume) {
          throw new Error(
            `Insufficient stock for ${med.name}. Available: ${available}, required: ${consume}`
          );
        }
      }

      // Decrement stock
      for (const it of totals.items) {
        if (!it.medicineName) continue;
        const med = await Medicine.findOne({ name: it.medicineName }).session(session);
        if (!med) continue;
        const consume = effUnits(it.qty, it.boxQty);
        med.totalUnits = n(med.totalUnits) - consume;
        await med.save({ session });
      }

      // Save invoice (keep date string)
      const inv = await Invoice.create(
        [
          {
            invoiceNo,
            date: toDateStr(body.date),
            details: body.details || "",
            paymentType: body.paymentType || "Cash Payment",
            customerName: body.customerName,
            previousDue: n(body.previousDue),

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
          },
        ],
        { session }
      );

      res.status(201).json({ message: "Invoice created", data: inv[0] });
    });
  } catch (err) {
    console.error("POST /api/invoices/add error:", err);
    const msg = err?.message || "Server error";
    res.status(400).json({ message: msg });
  } finally {
    session.endSession();
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
   PUT /:id — with stock reconciliation
======================= */
router.put("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const body = req.body || {};
    const totals = recomputeTotals(body);

    await session.withTransaction(async () => {
      const existing = await Invoice.findById(req.params.id).session(session);
      if (!existing) {
        res.status(404).json({ message: "Invoice not found" });
        return;
      }

      // Build name -> units maps (old & new)
      const toMap = (items = []) => {
        const m = new Map();
        for (const it of items) {
          const name = (it.medicineName || "").trim().toLowerCase();
          if (!name) continue;
          const units = effUnits(it.qty, it.boxQty);
          m.set(name, (m.get(name) || 0) + units);
        }
        return m;
      };

      const oldMap = toMap(existing.items);
      const newMap = toMap(totals.items);

      // Compute delta (new - old)
      const keys = new Set([...oldMap.keys(), ...newMap.keys()]);
      for (const k of keys) {
        const oldU = oldMap.get(k) || 0;
        const newU = newMap.get(k) || 0;
        const delta = newU - oldU; // + more sold now (decrement), - fewer sold (add back)
        if (delta === 0) continue;

        const med = await Medicine.findOne({ name: new RegExp(`^${k}$`, "i") }).session(session);
        if (!med) continue; // manual item; skip stock ops

        // Sales consume stock: decrement by delta; if delta < 0, increments (adds back)
        med.totalUnits = n(med.totalUnits) - delta;
        if (med.totalUnits < 0) med.totalUnits = 0; // guardrail
        await med.save({ session });
      }

      // Persist the invoice with recomputed totals (keep date as string)
      existing.invoiceNo = body.invoiceNo || "";
      existing.date = toDateStr(body.date) || existing.date;
      existing.details = body.details || "";
      existing.paymentType = body.paymentType || "Cash Payment";
      existing.customerName = body.customerName || existing.customerName;
      existing.previousDue = n(body.previousDue);

      existing.items = totals.items;

      existing.subTotal = totals.subTotal;
      existing.invoiceDiscount = totals.invoiceDiscount;
      existing.totalDiscount = totals.totalDiscount;
      existing.totalVat = totals.totalVat;
      existing.grandTotal = totals.grandTotal;
      existing.netTotal = totals.netTotal;
      existing.paidAmount = totals.paidAmount;
      existing.dueAmount = totals.dueAmount;
      existing.change = totals.change;

      await existing.save({ session });

      res.json({ message: "Invoice updated", data: existing });
    });
  } catch (err) {
    console.error("PUT /api/invoices/:id error:", err);
    res.status(500).json({ message: err?.message || "Server error" });
  } finally {
    session.endSession();
  }
});

/* =======================
   DELETE /:id (Restore stock)
======================= */
router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const doc = await Invoice.findById(req.params.id).session(session);
      if (!doc) {
        res.status(404).json({ message: "Invoice not found" });
        return;
      }

      // restore stock with the same multiply rule
      for (const it of doc.items) {
        if (!it.medicineName) continue;
        const med = await Medicine.findOne({ name: it.medicineName }).session(session);
        if (!med) continue;
        const restore = effUnits(it.qty, it.boxQty);
        med.totalUnits = n(med.totalUnits) + restore;
        await med.save({ session });
      }

      await doc.deleteOne({ session });
      res.json({ message: "Invoice deleted" });
    });
  } catch (err) {
    console.error("DELETE /api/invoices/:id error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

module.exports = router;
