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

// ⬇️ Latest quantity rule to match frontend (and AddInvoice)
function effUnits(qty, boxQty) {
  const q = toNum(qty);
  const b = toNum(boxQty);
  return (q || 1) * (b || 1);
}

function normalizeItems(items = []) {
  return (items || []).map((it) => {
    const boxQty = toNum(it.boxQty);
    const quantity = toNum(it.quantity);
    const supplierPrice = toNum(it.supplierPrice);
    const totalUnits = effUnits(quantity, boxQty); // multiplicative rule
    const lineTotal = totalUnits * supplierPrice;

    return {
      medicineId: it.medicineId || null,
      medicineName: (it.medicineName || "").trim(),
      batchId: it.batchId || "",
      expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
      stockQty: toNum(it.stockQty),
      boxPattern: it.boxPattern || "",
      unitsPerBox: toNum(it.unitsPerBox) || unitsFromPattern(it.boxPattern), // kept for reference
      boxQty,
      quantity,
      supplierPrice,
      boxMRP: toNum(it.boxMRP),
      lineTotal,
    };
  });
}

function computeTotals(items = [], vatPercent = 0, discountPercent = 0, paidAmount = 0) {
  const subTotal = items.reduce((s, r) => s + toNum(r.lineTotal), 0);
  const vatPct = toNum(vatPercent);
  const discPct = toNum(discountPercent);

  const vatAmount = (subTotal * vatPct) / 100;
  const discountAmount = (subTotal * discPct) / 100;
  const grandTotal = subTotal + vatAmount - discountAmount;

  const paid = toNum(paidAmount);
  const dueAmount = Math.max(0, grandTotal - paid);

  return {
    subTotal,
    vatPercent: vatPct,
    vatAmount,
    discountPercent: discPct,
    discountAmount,
    grandTotal,
    paidAmount: paid,
    dueAmount,
  };
}

function aggregateUnitsByMedicine(items = []) {
  // returns Map(medicineIdStr -> unitsAdded) using multiplicative rule
  const map = new Map();
  for (const row of items) {
    if (!row.medicineId) continue;
    const key = String(row.medicineId);
    const units = effUnits(row.quantity, row.boxQty);
    map.set(key, (map.get(key) || 0) + units);
  }
  return map;
}

/* ---------- CREATE ---------- */
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

    const normalized = normalizeItems(items);
    const totals = computeTotals(normalized, vatPercent, discountPercent, paidAmount);

    const doc = await Purchase.create({
      purchaseId: newPurchaseId(),
      supplierId: supplierId || null,
      supplierName: supplierName.trim(),
      invoiceNo: invoiceNo || "",
      date: date ? new Date(date) : new Date(),
      paymentType: paymentType || "Cash Payment",
      details: details || "",
      items: normalized,
      ...totals,
    });

    // increment stock for each item (use totalUnits field, not 'stock')
    try {
      const incMap = aggregateUnitsByMedicine(normalized);
      for (const [medId, units] of incMap.entries()) {
        await Medicine.findByIdAndUpdate(medId, { $inc: { totalUnits: units } });
      }
    } catch (e) {
      console.warn("Stock increment warning:", e?.message);
    }

    res.status(201).json({ message: "Purchase created", data: doc });
  } catch (err) {
    console.error("Create purchase error:", err);
    res.status(500).json({ message: "Server error while adding purchase." });
  }
});

/* ---------- LIST ---------- */
router.get("/", async (_req, res) => {
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

/* ---------- UPDATE (PUT) ---------- */
// supports PUT /api/purchases/:id and PUT /api/purchases/update/:id
async function handleUpdate(req, res) {
  try {
    const id = req.params.id;

    // 1) load existing doc
    const existing = await Purchase.findById(id);
    if (!existing) return res.status(404).json({ message: "Purchase not found." });

    // 2) normalize incoming
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

    if (!supplierName || !String(supplierName).trim()) {
      return res.status(400).json({ message: "Supplier name is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required." });
    }

    const normalized = normalizeItems(items);
    const totals = computeTotals(normalized, vatPercent, discountPercent, paidAmount);

    // 3) compute stock delta (new - old) grouped by medicine
    const oldMap = aggregateUnitsByMedicine(existing.items);
    const newMap = aggregateUnitsByMedicine(normalized);

    const unionKeys = new Set([...oldMap.keys(), ...newMap.keys()]);
    const ops = [];
    for (const key of unionKeys) {
      const oldUnits = oldMap.get(key) || 0;
      const newUnits = newMap.get(key) || 0;
      const delta = newUnits - oldUnits; // + means add stock, - means remove stock
      if (delta !== 0) {
        ops.push({ medId: key, delta });
      }
    }

    // 4) persist the purchase
    existing.supplierId = supplierId || null;
    existing.supplierName = supplierName.trim();
    existing.invoiceNo = invoiceNo || "";
    existing.date = date ? new Date(date) : existing.date;
    existing.paymentType = paymentType || "Cash Payment";
    existing.details = details || "";
    existing.items = normalized;

    existing.subTotal = totals.subTotal;
    existing.vatPercent = totals.vatPercent;
    existing.vatAmount = totals.vatAmount;
    existing.discountPercent = totals.discountPercent;
    existing.discountAmount = totals.discountAmount;
    existing.grandTotal = totals.grandTotal;
    existing.paidAmount = totals.paidAmount;
    existing.dueAmount = totals.dueAmount;

    await existing.save();

    // 5) apply stock deltas (totalUnits)
    try {
      for (const { medId, delta } of ops) {
        await Medicine.findByIdAndUpdate(medId, { $inc: { totalUnits: delta } });
      }
    } catch (e) {
      console.warn("Stock delta warning:", e?.message);
    }

    res.json({ message: "Purchase updated", data: existing });
  } catch (err) {
    console.error("Update purchase error:", err);
    res.status(500).json({ message: "Server error while updating purchase." });
  }
}

router.put("/:id", handleUpdate);
router.put("/update/:id", handleUpdate);

/* ---------- DELETE ---------- */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Purchase.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Purchase not found." });

    // Roll back stock (remove previously added units) from totalUnits
    try {
      const oldMap = aggregateUnitsByMedicine(doc.items);
      for (const [medId, units] of oldMap.entries()) {
        await Medicine.findByIdAndUpdate(medId, { $inc: { totalUnits: -units } });
      }
    } catch (e) {
      console.warn("Stock rollback warning:", e?.message);
    }

    res.json({ message: "Purchase deleted", data: doc });
  } catch (err) {
    console.error("Delete purchase error:", err);
    res.status(500).json({ message: "Server error while deleting purchase." });
  }
});

module.exports = router;
