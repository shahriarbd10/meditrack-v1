// src/pages/medicines/EditMedicine.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

export default function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch medicine data
  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/medicines/${id}`);
        setMedicine(res.data);
      } catch (err) {
        console.error("Error fetching medicine:", err);
        alert("Failed to load medicine details.");
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleChange = (e) => {
    setMedicine({ ...medicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/medicines/edit/${id}`, medicine);
      alert("Medicine updated successfully!");
      navigate("/dashboard/admin/medicines/list");
    } catch (err) {
      console.error("Error updating medicine:", err);
      alert("Failed to update medicine.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!medicine) return <div className="p-6">Medicine not found.</div>;

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">✏️ Edit Medicine</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Medicine Name *</label>
              <input
                name="name"
                value={medicine.name}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">Generic Name *</label>
              <input
                name="genericName"
                value={medicine.genericName}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">Brand Name *</label>
              <input
                name="brandName"
                value={medicine.brandName}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">Price *</label>
              <input
                type="number"
                name="price"
                value={medicine.price}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                value={medicine.expiryDate?.split("T")[0] || ""}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description *</label>
              <textarea
                name="description"
                value={medicine.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                rows={4}
                required
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary w-full">
                Update Medicine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
