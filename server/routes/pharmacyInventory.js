// server/routes/pharmacyInventory.js
const express = require("express");
const PharmacyInventory = require("../models/PharmacyInventory");
const Pharmacy = require("../models/Pharmacy");

const router = express.Router();

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const toDateOrNull = (v) => (v && !isNaN(Date.parse(v)) ? new Date(v) : null);

/**
 * GET /api/pharmacy-inventory/public
 * Public feed of active inventory across pharmacies.
 * Query:
 *   - q       : search over medicine name/generic/category
 *   - page    : page number (default 1)
 *   - limit   : page size (default 24)
 *   - sortBy  : createdAt | name | price | expiryDate (default createdAt)
 *   - sortDir : asc | desc (default desc)
 */
router.get("/public", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 24));
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const sortBy = ["createdAt", "name", "price", "expiryDate"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const dir = req.query.sortDir === "asc" ? 1 : -1;

    const pipeline = [
      { $match: { status: "active" } },

      // Join medicine
      {
        $lookup: {
          from: "medicines",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },

      // Optional search (case-insensitive)
      ...(q
        ? [{
            $match: {
              $or: [
                { "medicine.name":        { $regex: q, $options: "i" } },
                { "medicine.genericName": { $regex: q, $options: "i" } },
                { "medicine.category":    { $regex: q, $options: "i" } },
              ],
            },
          }]
        : []),

      // Join pharmacy by ownerUserId == pharmacyId
      {
        $lookup: {
          from: "pharmacies",
          let: { ownerUserId: "$pharmacyId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$ownerUserId", "$$ownerUserId"] } } },
            { $project: { pharmacyName: 1, address: 1, logoUrl: 1, pharmacyType: 1, phone: 1 } },
          ],
          as: "pharmacy",
        },
      },
      { $unwind: { path: "$pharmacy", preserveNullAndEmptyArrays: true } },

      // Normalized fields for stable, null-safe sorts
      {
        $addFields: {
          sortName:   { $toLower: { $ifNull: ["$medicine.name", ""] } },
          sortPrice:  { $ifNull: ["$sellingPrice", 0] },
          sortExpiry: {
            $cond: [
              { $ifNull: ["$expiryDate", false] },
              "$expiryDate",
              new Date("9999-12-31T23:59:59.999Z")
            ]
          },
          sortCreated: { $ifNull: ["$createdAt", new Date(0)] },
        }
      },

      // Choose sort
      {
        $sort: (() => {
          if (sortBy === "name")       return { sortName: dir,  _id: 1 };
          if (sortBy === "price")      return { sortPrice: dir, _id: 1 };
          if (sortBy === "expiryDate") return { sortExpiry: dir, _id: 1 };
          return { sortCreated: dir, _id: 1 }; // "createdAt"
        })()
      },

      // Project what UI needs (expose _id for card Details link)
      {
        $project: {
          _id: 1,

          // inventory
          status: 1, stock: 1, minStock: 1, purchasePrice: 1, sellingPrice: 1,
          vat: 1, batchNo: 1, expiryDate: 1, notes: 1, createdAt: 1,

          // medicine
          "medicine._id": 1,
          "medicine.name": 1,
          "medicine.genericName": 1,
          "medicine.category": 1,
          "medicine.imageUrl": 1,
          "medicine.unit": 1,
          "medicine.strength": 1,
          "medicine.price": 1,
          "medicine.vat": 1,

          // pharmacy
          "pharmacy.pharmacyName": 1,
          "pharmacy.address": 1,
          "pharmacy.logoUrl": 1,
        }
      },

      // Pagination
      {
        $facet: {
          data:  [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const out = await PharmacyInventory.aggregate(pipeline);
    const data = out?.[0]?.data ?? [];
    const total = out?.[0]?.total?.[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({ data, page, limit, totalItems: total, totalPages });
  } catch (err) {
    console.error("Public pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while listing public pharmacy inventory" });
  }
});

/**
 * GET /api/pharmacy-inventory/:id
 * Details for a specific pharmacy inventory item
 * Returns the inventory row + medicine + pharmacy profile (by ownerUserId = pharmacyId)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: require("mongoose").Types.ObjectId.createFromHexString(id) } },

      {
        $lookup: {
          from: "medicines",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },

      {
        $lookup: {
          from: "pharmacies",
          let: { ownerUserId: "$pharmacyId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$ownerUserId", "$$ownerUserId"] } } },
            { $project: { pharmacyName: 1, address: 1, logoUrl: 1, phone: 1, pharmacyType: 1 } },
          ],
          as: "pharmacy",
        },
      },
      { $unwind: { path: "$pharmacy", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          pharmacyId: 1,
          medicineId: 1,
          status: 1,
          stock: 1,
          minStock: 1,
          purchasePrice: 1,
          sellingPrice: 1,
          vat: 1,
          batchNo: 1,
          expiryDate: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1,

          medicine: {
            _id: "$medicine._id",
            name: "$medicine.name",
            genericName: "$medicine.genericName",
            category: "$medicine.category",
            imageUrl: "$medicine.imageUrl",
            unit: "$medicine.unit",
            strength: "$medicine.strength",
            price: "$medicine.price",
            vat: "$medicine.vat",
            details: "$medicine.details",
            supplier: "$medicine.supplier",
            boxSize: "$medicine.boxSize",
            shelf: "$medicine.shelf",
            type: "$medicine.type",
            barcode: "$medicine.barcode",
          },

          pharmacy: {
            pharmacyName: "$pharmacy.pharmacyName",
            address: "$pharmacy.address",
            logoUrl: "$pharmacy.logoUrl",
            phone: "$pharmacy.phone",
            pharmacyType: "$pharmacy.pharmacyType",
          }
        }
      }
    ];

    const rows = await PharmacyInventory.aggregate(pipeline);
    const doc = rows?.[0];
    if (!doc) return res.status(404).json({ message: "Inventory item not found" });

    res.json({ data: doc });
  } catch (err) {
    console.error("Get pharmacy inventory details error:", err);
    res.status(500).json({ message: "Server error while fetching inventory item" });
  }
});

/**
 * GET /api/pharmacy-inventory?pharmacyId=abc
 * Optional: &q=search (matches populated medicine name/generic)
 */
router.get("/", async (req, res) => {
  try {
    const { pharmacyId, q } = req.query;
    if (!pharmacyId) return res.status(400).json({ message: "pharmacyId is required" });

    const list = await PharmacyInventory.find({ pharmacyId })
      .populate({ path: "medicineId", select: "name genericName category imageUrl amount strength price vat" })
      .sort({ createdAt: -1 });

    if (!q || !q.trim()) return res.json({ data: list });

    const s = q.toLowerCase();
    const filtered = list.filter((row) => {
      const m = row.medicineId || {};
      const fields = [m.name, m.genericName, m.category].filter(Boolean).map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
    res.json({ data: filtered });
  } catch (err) {
    console.error("List pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while listing pharmacy inventory" });
  }
});

/**
 * POST /api/pharmacy-inventory
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body.pharmacyId || !body.medicineId) {
      return res.status(400).json({ message: "pharmacyId and medicineId are required" });
    }

    const payload = {
      pharmacyId: body.pharmacyId,
      medicineId: body.medicineId,
      batchNo: String(body.batchNo || ""),
      stock: toNum(body.stock),
      minStock: toNum(body.minStock ?? 10),
      purchasePrice: toNum(body.purchasePrice),
      sellingPrice: toNum(body.sellingPrice),
      vat: toNum(body.vat),
      expiryDate: toDateOrNull(body.expiryDate),
      notes: String(body.notes || ""),
      status: body.status === "inactive" ? "inactive" : "active",
    };

    const created = await PharmacyInventory.create(payload);
    const doc = await created.populate({
      path: "medicineId",
      select: "name genericName category imageUrl amount strength price vat",
    });
    res.status(201).json({ message: "Item added", data: doc });
  } catch (err) {
    console.error("Create pharmacy inventory error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "This medicine/batch already exists for this pharmacy." });
    }
    res.status(500).json({ message: "Server error while adding inventory item" });
  }
});

/**
 * PUT /api/pharmacy-inventory/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const b = req.body;
    const updates = {};
    if (b.stock !== undefined) updates.stock = toNum(b.stock);
    if (b.minStock !== undefined) updates.minStock = toNum(b.minStock);
    if (b.purchasePrice !== undefined) updates.purchasePrice = toNum(b.purchasePrice);
    if (b.sellingPrice !== undefined) updates.sellingPrice = toNum(b.sellingPrice);
    if (b.vat !== undefined) updates.vat = toNum(b.vat);
    if (b.batchNo !== undefined) updates.batchNo = String(b.batchNo || "");
    if (b.expiryDate !== undefined) updates.expiryDate = toDateOrNull(b.expiryDate);
    if (b.notes !== undefined) updates.notes = String(b.notes || "");
    if (b.status !== undefined) updates.status = b.status === "inactive" ? "inactive" : "active";

    const updated = await PharmacyInventory.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate({ path: "medicineId", select: "name genericName category imageUrl amount strength price vat" });

    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item updated", data: updated });
  } catch (err) {
    console.error("Update pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while updating inventory item" });
  }
});

/**
 * DELETE /api/pharmacy-inventory/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await PharmacyInventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted", data: deleted });
  } catch (err) {
    console.error("Delete pharmacy inventory error:", err);
    res.status(500).json({ message: "Server error while deleting inventory item" });
  }
});

module.exports = router;
