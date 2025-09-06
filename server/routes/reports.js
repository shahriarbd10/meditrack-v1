// server/routes/reports.js
const express = require("express");
const router = express.Router();

// Adjust model paths/names to yours if different:
const Invoice = require("../models/Invoice");
const Purchase = require("../models/Purchase");
const Medicine = require("../models/Medicine");

// last N days helper
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

router.get("/overview", async (req, res) => {
  try {
    const since = daysAgo(30);

    // Sales by day (Invoices)
    const salesByDay = await Invoice.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $addFields: {
          amount: {
            $ifNull: ["$grandTotal", { $ifNull: ["$totalAmount", { $ifNull: ["$total", 0] }] }],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Purchases by day
    const purchasesByDay = await Purchase.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $addFields: {
          amount: {
            $ifNull: ["$grandTotal", { $ifNull: ["$totalAmount", { $ifNull: ["$total", 0] }] }],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Stock by category (Medicines)
    const stockByCategory = await Medicine.aggregate([
      {
        $addFields: {
          stock: {
            $ifNull: ["$totalUnits", { $ifNull: ["$stock", { $ifNull: ["$availableQty", 0] }] }],
          },
          categoryName: { $ifNull: ["$category", "Uncategorized"] },
        },
      },
      {
        $group: {
          _id: "$categoryName",
          stock: { $sum: "$stock" },
          items: { $sum: 1 },
        },
      },
      { $project: { _id: 0, category: "$_id", stock: 1, items: 1 } },
      { $sort: { stock: -1 } },
    ]);

    // Expiry summary (next 30d & already expired)
    const now = new Date();
    const soon = daysAgo(-30); // 30 days ahead
    const meds = await Medicine.find(
      {},
      { expiryDate: 1, expiry: 1, expiry_date: 1 }
    ).lean();

    const parseAny = (m) => {
      const d =
        (m.expiryDate && new Date(m.expiryDate)) ||
        (m.expiry_date && new Date(m.expiry_date)) ||
        (m.expiry && new Date(m.expiry)) ||
        null;
      return d && !isNaN(d.getTime()) ? d : null;
    };

    let expiringSoon = 0,
      expired = 0,
      total = meds.length;

    for (const m of meds) {
      const d = parseAny(m);
      if (!d) continue;
      if (d < now) expired++;
      else if (d <= soon) expiringSoon++;
    }

    res.json({
      salesByDay: salesByDay.map((r) => ({ date: r._id, total: r.total, count: r.count })),
      purchasesByDay: purchasesByDay.map((r) => ({ date: r._id, total: r.total, count: r.count })),
      stockByCategory,
      expirySummary: { expiringSoon, expired, total },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to generate report." });
  }
});

module.exports = router;
