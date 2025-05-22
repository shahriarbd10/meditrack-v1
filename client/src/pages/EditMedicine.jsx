import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMedicine() {
      try {
        const res = await axios.get(`http://localhost:5000/api/medicines/${id}`);
        setMedicine(res.data);
      } catch (err) {
        setError("Failed to load medicine for editing");
      }
    }
    fetchMedicine();
  }, [id]);

  const handleChange = (e) => {
    setMedicine({ ...medicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/medicines/edit/${id}`, medicine);
      navigate("/dashboard/admin");
    } catch (err) {
      alert("Failed to update medicine");
    }
  };

  if (error) return <div className="text-center mt-6 text-red-600">{error}</div>;
  if (!medicine) return <div className="text-center mt-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-base-100 rounded-md shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-6">Edit Medicine</h2>
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
          value={medicine.discount || ""}
          onChange={handleChange}
          placeholder="Discount (optional)"
          className="input input-bordered w-full"
        />
        <input
          name="expiryDate"
          type="date"
          value={medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : ""}
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
          Update Medicine
        </button>
      </form>
    </div>
  );
}
