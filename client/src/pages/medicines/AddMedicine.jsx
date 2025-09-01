// src/pages/medicines/AddMedicine.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

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
      navigate("/dashboard/admin/medicines/list");
    } catch (err) {
      console.error("Error adding medicine", err);
      alert("❌ Failed to add medicine. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-2">
            💊 Add New Medicine
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Medicine Name */}
            <div>
              <label className="label font-semibold">Medicine Name *</label>
              <input
                name="name"
                value={medicine.name}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. Paracetamol"
                required
              />
            </div>

            {/* Generic Name */}
            <div>
              <label className="label font-semibold">Generic Name *</label>
              <input
                name="genericName"
                value={medicine.genericName}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. Acetaminophen"
                required
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="label font-semibold">Brand Name *</label>
              <input
                name="brandName"
                value={medicine.brandName}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. Tylenol"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="label font-semibold">Price *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                value={medicine.price}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. 10.50"
                required
              />
            </div>

            {/* Discount */}
            <div>
              <label className="label font-semibold">Discount</label>
              <input
                name="discount"
                type="number"
                step="0.01"
                value={medicine.discount}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. 2.50"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="label font-semibold">Expiry Date *</label>
              <input
                name="expiryDate"
                type="date"
                value={medicine.expiryDate}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Total Units */}
            <div>
              <label className="label font-semibold">Total Units *</label>
              <input
                name="totalUnits"
                type="number"
                value={medicine.totalUnits}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. 500"
                required
              />
            </div>

            {/* Unit Type */}
            <div>
              <label className="label font-semibold">Unit Type *</label>
              <select
                name="unitType"
                value={medicine.unitType}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="strip">Strip</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
              </select>
            </div>

            {/* Buying Price */}
            <div>
              <label className="label font-semibold">Buying Price *</label>
              <input
                name="buyingPrice"
                type="number"
                step="0.01"
                value={medicine.buyingPrice}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="For admin only"
                required
              />
            </div>

            {/* Form */}
            <div>
              <label className="label font-semibold">Form *</label>
              <select
                name="form"
                value={medicine.form}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Picture URL */}
            <div>
              <label className="label font-semibold">Picture URL *</label>
              <input
                name="picture"
                type="url"
                value={medicine.picture}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Upload to Cloudinary and paste link"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="label font-semibold">Amount (mg/ml) *</label>
              <input
                name="amount"
                value={medicine.amount}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="e.g. 500mg"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="label font-semibold">Description *</label>
              <textarea
                name="description"
                value={medicine.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                rows={4}
                placeholder="Brief description of the medicine"
                required
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary w-full">
                ✅ Save Medicine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
