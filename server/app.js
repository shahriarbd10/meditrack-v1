// server/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

/* =======================
   Route imports (mounted)
======================= */
const medicineRoutes     = require("./routes/medicine");
const authRoutes         = require("./routes/auth");
const adminStatsRoutes   = require("./routes/adminStats");
const staffRoutes        = require("./routes/staff");
const authGoogleRoutes   = require("./routes/authGoogle");
const customerRoutes     = require("./routes/customerRoutes");
const purchaseRoutes     = require("./routes/purchases");
const invoiceRoutes      = require("./routes/invoice");   
const reportsRoutes = require("./routes/reports");
/* =======================
   Models for inline CRUD
======================= */
const Category     = require("./models/Category");
const Type         = require("./models/Type");
const Unit         = require("./models/Unit");
const LeafSetting  = require("./models/LeafSetting");
const Supplier     = require("./models/Supplier");

dotenv.config();
const app = express();

/* =======================
   Middleware
======================= */
app.use(
  cors({
    origin: ["http://localhost:5173"], // Vite dev server
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// Serve uploaded images (thumbnails, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* =======================
   Mounted routes
======================= */
app.use("/api/medicines",  medicineRoutes); // handles multipart + image compression, expiryDate, etc.
app.use("/api/auth",       authRoutes);
app.use("/api/auth",       authGoogleRoutes);
app.use("/api/admin",      adminStatsRoutes);
app.use("/api/staff",      staffRoutes);
app.use("/api/customers",  customerRoutes);
app.use("/api/purchases",  purchaseRoutes);
app.use("/api/invoices",   invoiceRoutes);  
app.use("/api/reports", reportsRoutes);
/* =======================
   Categories (INLINE CRUD)
   Base: /api/categories
======================= */
// CREATE
app.post("/api/categories", async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required." });
    }
    const created = await Category.create({
      name: name.trim(),
      status: status === "inactive" ? "inactive" : "active",
    });
    return res.status(201).json({ message: "Category created", data: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category already exists." });
    }
    console.error("Create category error:", err);
    return res.status(500).json({ message: "Server error while adding category." });
  }
});
// LIST
app.get("/api/categories", async (_req, res) => {
  try {
    const items = await Category.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error("List categories error:", err);
    res.status(500).json({ message: "Server error while listing categories." });
  }
});
// UPDATE
app.put("/api/categories/:id", async (req, res) => {
  try {
    const { name, status } = req.body;
    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof status === "string") {
      updates.status = status === "inactive" ? "inactive" : "active";
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category updated", data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category name already in use." });
    }
    console.error("Update category error:", err);
    res.status(500).json({ message: "Server error while updating category." });
  }
});
// DELETE
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category deleted", data: deleted });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ message: "Server error while deleting category." });
  }
});

/* =======================
   Types (INLINE CRUD)
   Base: /api/types
======================= */
// CREATE
app.post("/api/types", async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Type name is required." });
    }
    const created = await Type.create({
      name: name.trim(),
      status: status === "inactive" ? "inactive" : "active",
    });
    res.status(201).json({ message: "Type created", data: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Type already exists." });
    }
    console.error("Create type error:", err);
    res.status(500).json({ message: "Server error while adding type." });
  }
});
// LIST
app.get("/api/types", async (_req, res) => {
  try {
    const items = await Type.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error("List types error:", err);
    res.status(500).json({ message: "Server error while listing types." });
  }
});
// UPDATE
app.put("/api/types/:id", async (req, res) => {
  try {
    const { name, status } = req.body;
    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof status === "string") updates.status = status === "inactive" ? "inactive" : "active";
    const updated = await Type.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Type not found." });
    res.json({ message: "Type updated", data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Type name already in use." });
    }
    console.error("Update type error:", err);
    res.status(500).json({ message: "Server error while updating type." });
  }
});
// DELETE
app.delete("/api/types/:id", async (req, res) => {
  try {
    const deleted = await Type.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Type not found." });
    res.json({ message: "Type deleted", data: deleted });
  } catch (err) {
    console.error("Delete type error:", err);
    res.status(500).json({ message: "Server error while deleting type." });
  }
});

/* =======================
   Units (INLINE CRUD)
   Base: /api/units
======================= */
// CREATE
app.post("/api/units", async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Unit name is required." });
    }
    const created = await Unit.create({
      name: name.trim(),
      status: status === "inactive" ? "inactive" : "active",
    });
    res.status(201).json({ message: "Unit created", data: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Unit already exists." });
    }
    console.error("Create unit error:", err);
    res.status(500).json({ message: "Server error while adding unit." });
  }
});
// LIST
app.get("/api/units", async (_req, res) => {
  try {
    const items = await Unit.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error("List units error:", err);
    res.status(500).json({ message: "Server error while listing units." });
  }
});
// UPDATE
app.put("/api/units/:id", async (req, res) => {
  try {
    const { name, status } = req.body;
    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof status === "string") updates.status = status === "inactive" ? "inactive" : "active";
    const updated = await Unit.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Unit not found." });
    res.json({ message: "Unit updated", data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Unit name already in use." });
    }
    console.error("Update unit error:", err);
    res.status(500).json({ message: "Server error while updating unit." });
  }
});
// DELETE
app.delete("/api/units/:id", async (req, res) => {
  try {
    const deleted = await Unit.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Unit not found." });
    res.json({ message: "Unit deleted", data: deleted });
  } catch (err) {
    console.error("Delete unit error:", err);
    res.status(500).json({ message: "Server error while deleting unit." });
  }
});

/* =======================
   Leaf Settings (INLINE CRUD)
   Base: /api/leaf-settings
======================= */
// CREATE
app.post("/api/leaf-settings", async (req, res) => {
  try {
    const { leafType, totalNumber } = req.body;
    if (!leafType || !leafType.trim()) {
      return res.status(400).json({ message: "Leaf Type is required." });
    }
    if (totalNumber === undefined || totalNumber === null || isNaN(Number(totalNumber))) {
      return res.status(400).json({ message: "Total Number must be a number." });
    }
    const created = await LeafSetting.create({
      leafType: leafType.trim(),
      totalNumber: Number(totalNumber),
    });
    res.status(201).json({ message: "Leaf setting created", data: created });
  } catch (err) {
    console.error("Create leaf-setting error:", err);
    res.status(500).json({ message: "Server error while adding leaf-setting." });
  }
});
// LIST
app.get("/api/leaf-settings", async (_req, res) => {
  try {
    const items = await LeafSetting.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error("List leaf-settings error:", err);
    res.status(500).json({ message: "Server error while listing leaf-settings." });
  }
});
// UPDATE
app.put("/api/leaf-settings/:id", async (req, res) => {
  try {
    const { leafType, totalNumber } = req.body;
    const updates = {};
    if (typeof leafType === "string" && leafType.trim()) updates.leafType = leafType.trim();
    if (totalNumber !== undefined) {
      if (isNaN(Number(totalNumber))) {
        return res.status(400).json({ message: "Total Number must be numeric." });
      }
      updates.totalNumber = Number(totalNumber);
    }
    const updated = await LeafSetting.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Leaf setting not found." });
    res.json({ message: "Leaf setting updated", data: updated });
  } catch (err) {
    console.error("Update leaf-setting error:", err);
    res.status(500).json({ message: "Server error while updating leaf-setting." });
  }
});
// DELETE
app.delete("/api/leaf-settings/:id", async (req, res) => {
  try {
    const deleted = await LeafSetting.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Leaf setting not found." });
    res.json({ message: "Leaf setting deleted", data: deleted });
  } catch (err) {
    console.error("Delete leaf-setting error:", err);
    res.status(500).json({ message: "Server error while deleting leaf-setting." });
  }
});

/* =======================
   Suppliers (INLINE CRUD)
   Base: /api/suppliers
======================= */
// CREATE
app.post("/api/suppliers", async (req, res) => {
  try {
    const {
      manufacturerName, contactName, phone, email,
      address1, address2, city, state, zip, country,
      status, previousBalance
    } = req.body;

    if (!manufacturerName || !manufacturerName.trim()) {
      return res.status(400).json({ message: "Manufacturer name is required." });
    }

    const created = await Supplier.create({
      manufacturerName: manufacturerName.trim(),
      contactName, phone, email,
      address1, address2, city, state, zip, country,
      status: status === "inactive" ? "inactive" : "active",
      previousBalance: Number(previousBalance) || 0,
    });

    res.status(201).json({ message: "Supplier created", data: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Supplier already exists." });
    }
    console.error("Create supplier error:", err);
    res.status(500).json({ message: "Server error while adding supplier." });
  }
});
// LIST
app.get("/api/suppliers", async (_req, res) => {
  try {
    const items = await Supplier.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error("List suppliers error:", err);
    res.status(500).json({ message: "Server error while listing suppliers." });
  }
});
// UPDATE
app.put("/api/suppliers/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (typeof updates.manufacturerName === "string") {
      updates.manufacturerName = updates.manufacturerName.trim();
    }
    if (typeof updates.status === "string") {
      updates.status = updates.status === "inactive" ? "inactive" : "active";
    }
    if (updates.previousBalance !== undefined) {
      updates.previousBalance = Number(updates.previousBalance) || 0;
    }
    const updated = await Supplier.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Supplier not found." });
    res.json({ message: "Supplier updated", data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Manufacturer name already in use." });
    }
    console.error("Update supplier error:", err);
    res.status(500).json({ message: "Server error while updating supplier." });
  }
});
// DELETE
app.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Supplier not found." });
    res.json({ message: "Supplier deleted", data: deleted });
  } catch (err) {
    console.error("Delete supplier error:", err);
    res.status(500).json({ message: "Server error while deleting supplier." });
  }
});

/* =======================
   Health + 404
======================= */
app.get("/", (_req, res) => res.send("API running"));

// Keep this LAST
app.use((req, res) => {
  console.log("⚠️  404:", req.method, req.originalUrl);
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

/* =======================
   Mongo + Server
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
