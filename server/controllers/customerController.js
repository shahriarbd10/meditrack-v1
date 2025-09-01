// server/controllers/customerController.js
const Customer = require("../models/Customer");

/**
 * CREATE customer
 * POST /api/customers
 */
exports.createCustomer = async (req, res) => {
  try {
    const d = req.body;

    if (!d.name || !d.mobile) {
      return res.status(400).json({ message: "Name and mobile are required" });
    }

    const customer = await Customer.create({
      name: d.name,
      mobile: d.mobile,
      email1: d.email1,
      email2: d.email2,
      phone: d.phone,
      contact: d.contact,
      address1: d.address1,
      address2: d.address2,
      city: d.city,
      state: d.state,
      zip: d.zip,
      country: d.country,
      fax: d.fax,
      previousBalance: d.previousBalance ? Number(d.previousBalance) : 0,
    });

    return res.status(201).json({ message: "Customer created", customer });
  } catch (err) {
    console.error("Create customer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * LIST all customers
 * GET /api/customers
 */
exports.listCustomers = async (_req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    return res.json({ customers });
  } catch (err) {
    console.error("List customers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET single customer
 * GET /api/customers/:id
 */
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.json(customer);
  } catch (err) {
    console.error("Get customer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE customer
 * PUT /api/customers/:id
 */
exports.updateCustomer = async (req, res) => {
  try {
    const updates = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({ message: "Customer updated", customer });
  } catch (err) {
    console.error("Update customer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE customer
 * DELETE /api/customers/:id
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error("Delete customer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
