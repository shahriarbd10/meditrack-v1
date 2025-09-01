// src/pages/customers/AddCustomer.jsx
import { useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/DashboardLayout";

function AddCustomer() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email1: "",
    email2: "",
    phone: "",
    contact: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    fax: "",
    previousBalance: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ stop auto-submit
    try {
      await axios.post("http://localhost:5000/api/customers", formData);
      alert("Customer added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add customer");
    }
  };

  return (
    <DashboardLayout showBack={true}>
      <h2 className="text-2xl font-bold mb-4">Add Customer</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-white p-6 rounded shadow"
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          name="email1"
          placeholder="Email 1"
          value={formData.email1}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="email"
          name="email2"
          placeholder="Email 2"
          value={formData.email2}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact Person"
          value={formData.contact}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="address1"
          placeholder="Address 1"
          value={formData.address1}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="address2"
          placeholder="Address 2"
          value={formData.address2}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="zip"
          placeholder="ZIP"
          value={formData.zip}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="fax"
          placeholder="Fax"
          value={formData.fax}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="previousBalance"
          placeholder="Previous Balance"
          value={formData.previousBalance}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </DashboardLayout>
  );
}

export default AddCustomer;
