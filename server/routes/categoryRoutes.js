// server/routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Add auth middleware here if needed

router.post("/", createCategory);
router.get("/", listCategories);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
