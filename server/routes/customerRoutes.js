// server/routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

// Add auth middleware if needed
router.post("/", createCustomer);
router.get("/", listCustomers);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
