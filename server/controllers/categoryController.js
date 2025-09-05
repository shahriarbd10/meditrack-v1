// server/controllers/categoryController.js
const Category = require("../models/Category");

// POST /api/categories
exports.createCategory = async (req, res) => {
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
    console.error("createCategory error:", err);
    return res.status(500).json({ message: "Server error while adding category." });
  }
};

// GET /api/categories
exports.listCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.json({ data: categories });
  } catch (err) {
    console.error("listCategories error:", err);
    return res.status(500).json({ message: "Server error while listing categories." });
  }
};

// GET /api/categories/:id
exports.getCategory = async (req, res) => {
  try {
    const doc = await Category.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Category not found." });
    return res.json({ data: doc });
  } catch (err) {
    console.error("getCategory error:", err);
    return res.status(500).json({ message: "Server error while fetching category." });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (status) updates.status = status === "inactive" ? "inactive" : "active";

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Category not found." });
    return res.json({ message: "Category updated", data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category name already in use." });
    }
    console.error("updateCategory error:", err);
    return res.status(500).json({ message: "Server error while updating category." });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found." });
    return res.json({ message: "Category deleted", data: deleted });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ message: "Server error while deleting category." });
  }
};
