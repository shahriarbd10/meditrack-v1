const express = require("express");
const router = express.Router();
const Purchase = require("../models/Purchase");
const Medicine = require("../models/Medicine");

/* ---------- helpers ---------- */
const toNum = (x) => (isNaN(Number(x)) ? 0 : Number(x));

function unitsFromPattern(pattern = "") {
  // "3 x 10", "2*15", "1" => 30, 30, 1
  const nums = String(pattern)
    .toLowerCase()
    .split(/[^0-9]+/g)
    .filter(Boolean)
    .map(Number);
  if (nums.length === 0) return 1;
  return nums.reduce((a, b) => a * (isNaN(b) ? 1 : b), 1);
}

function newPurchaseId() {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.floor(Math.random() * 1000)}`;
}

/* ---------- CREATE (simple, like AddMedicine) ---------- */
router.post(["/", "/add"], async (req, res) => {
  try {
    const {
      supplierId,
      supplierName,
      invoiceNo,
      date,
      paymentType,
      details,
      vatPercent,
      discountPercent,
      paidAmount,
      items = [],
    } = req.body;

    if (!supplierName || !supplierName.trim()) {
      return res.status(400).json({ message: "Supplier name is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required." });
    }

    const normalized = items.map((it) => {
      const unitsPerBox = toNum(it.unitsPerBox) || unitsFromPattern(it.boxPattern);
      const totalUnits = toNum(it.boxQty) * unitsPerBox + toNum(it.quantity);
      const lineTotal = totalUnits * toNum(it.supplierPrice);

      return {
        medicineId: it.medicineId || null,
        medicineName: (it.medicineName || "").trim(),
        batchId: it.batchId || "",
        expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
        stockQty: toNum(it.stockQty),
        boxPattern: it.boxPattern || "",
        unitsPerBox,
        boxQty: toNum(it.boxQty),
        quantity: toNum(it.quantity),
        supplierPrice: toNum(it.supplierPrice),
        boxMRP: toNum(it.boxMRP),
        lineTotal,
      };
    });

    const subTotal = normalized.reduce((s, r) => s + r.lineTotal, 0);
    const vatPct = toNum(vatPercent);
    const discPct = toNum(discountPercent);

    const vatAmount = (subTotal * vatPct) / 100;
    const discountAmount = (subTotal * discPct) / 100;
    const grandTotal = subTotal + vatAmount - discountAmount;

    const paid = toNum(paidAmount);
    const dueAmount = Math.max(0, grandTotal - paid);

    const doc = await Purchase.create({
      purchaseId: newPurchaseId(),
      supplierId: supplierId || null,
      supplierName: supplierName.trim(),
      invoiceNo: invoiceNo || "",
      date: date ? new Date(date) : new Date(),
      paymentType: paymentType || "Cash Payment",
      details: details || "",
      items: normalized,
      subTotal,
      vatPercent: vatPct,
      vatAmount,
      discountPercent: discPct,
      discountAmount,
      grandTotal,
      paidAmount: paid,
      dueAmount,
    });

    // OPTIONAL: increment stock on medicine
    for (const row of normalized) {
      if (!row.medicineId) continue;
      const totalUnits = row.boxQty * row.unitsPerBox + row.quantity;
      try {
        await Medicine.findByIdAndUpdate(row.medicineId, { $inc: { stock: totalUnits } });
      } catch {}
    }

    res.status(201).json({ message: "Purchase created", data: doc });
  } catch (err) {
    console.error("Create purchase error:", err);
    res.status(500).json({ message: "Server error while adding purchase." });
  }
});

/* ---------- LIST (simple) ---------- */
router.get("/", async (req, res) => {
  try {
    const list = await Purchase.find().sort({ date: -1, createdAt: -1 });
    res.json({ data: list });
  } catch (err) {
    console.error("List purchases error:", err);
    res.status(500).json({ message: "Server error while listing purchases." });
  }
});

/* ---------- GET ONE ---------- */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Purchase.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Purchase not found." });
    res.json({ data: doc });
  } catch (err) {
    console.error("Get purchase error:", err);
    res.status(500).json({ message: "Server error while fetching purchase." });
  }
});

/* ---------- DELETE ---------- */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Purchase.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Purchase not found." });
    res.json({ message: "Purchase deleted", data: doc });
  } catch (err) {
    console.error("Delete purchase error:", err);
    res.status(500).json({ message: "Server error while deleting purchase." });
  }
});

module.exports = router;
