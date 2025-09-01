import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddMedicine() {
  const [medicine, setMedicine] = useState({
    name: "",
    genericName: "",
    brandName: "",
    price: "",
    discount: "",
    expiryDate: "",
    totalUnits: "",
    unitType: "strip",
    buyingPrice: "",
    form: "Tablet",
    picture: "",
    amount: "",
    description: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setMedicine({ ...medicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/medicines/add", medicine);
      navigate("/dashboard/admin");
    } catch (err) {
      console.error("Error adding medicine", err);
      alert("Failed to add medicine");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-base-100 rounded-md shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-6">Add New Medicine</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={medicine.name}
          onChange={handleChange}
          placeholder="Medicine Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="genericName"
          value={medicine.genericName}
          onChange={handleChange}
          placeholder="Generic Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="brandName"
          value={medicine.brandName}
          onChange={handleChange}
          placeholder="Brand Name"
          className="input input-bordered w-full"
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          value={medicine.price}
          onChange={handleChange}
          placeholder="Price"
          className="input input-bordered w-full"
          required
        />
        <input
          name="discount"
          type="number"
          step="0.01"
          value={medicine.discount}
          onChange={handleChange}
          placeholder="Discount (optional)"
          className="input input-bordered w-full"
        />
        <input
          name="expiryDate"
          type="date"
          value={medicine.expiryDate}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        />
        <input
          name="totalUnits"
          type="number"
          value={medicine.totalUnits}
          onChange={handleChange}
          placeholder="Total Available Units"
          className="input input-bordered w-full"
          required
        />
        <select
          name="unitType"
          value={medicine.unitType}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        >
          <option value="strip">Strip</option>
          <option value="box">Box</option>
        </select>
        <input
          name="buyingPrice"
          type="number"
          step="0.01"
          value={medicine.buyingPrice}
          onChange={handleChange}
          placeholder="Buying Price (Admin only)"
          className="input input-bordered w-full"
          required
        />
        <select
          name="form"
          value={medicine.form}
          onChange={handleChange}
          className="input input-bordered w-full"
          required
        >
          <option value="Tablet">Tablet</option>
          <option value="Syrup">Syrup</option>
          <option value="Capsule">Capsule</option>
          <option value="Other">Other</option>
        </select>
        <input
          name="picture"
          type="url"
          value={medicine.picture}
          onChange={handleChange}
          placeholder="Picture URL (Cloudinary)"
          className="input input-bordered w-full"
          required
        />
        <input
          name="amount"
          value={medicine.amount}
          onChange={handleChange}
          placeholder="Amount (mg/ml)"
          className="input input-bordered w-full"
          required
        />
        <textarea
          name="description"
          value={medicine.description}
          onChange={handleChange}
          placeholder="Description"
          className="input input-bordered w-full"
          rows={4}
          required
        />
        <button type="submit" className="btn btn-primary w-full">
          Add Medicine
        </button>
      </form>
    </div>
  );
}
