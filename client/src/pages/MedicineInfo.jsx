// src/pages/MedicineInfo.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

export default function MedicineInfo() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMedicine() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/medicines/${id}`);
        setMedicine(res.data);
      } catch (err) {
        setError("Failed to load medicine details");
      }
    }
    fetchMedicine();
  }, [id]);

  if (error) return <div className="text-center text-red-600 mt-6">{error}</div>;
  if (!medicine) return <div className="text-center mt-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-base-100 rounded-md shadow-md mt-6">
      <h2 className="text-3xl font-bold mb-4">{medicine.name}</h2>
      <img
        src={medicine.picture}
        alt={medicine.name}
        className="w-full h-64 object-cover mb-4 rounded"
      />
      <p><strong>Generic Name:</strong> {medicine.genericName}</p>
      <p><strong>Brand Name:</strong> {medicine.brandName}</p>
      <p><strong>Form:</strong> {medicine.form}</p>
      <p><strong>Amount:</strong> {medicine.amount}</p>
      <p><strong>Price:</strong> ${medicine.price}</p>
      <p><strong>Discount:</strong> ${medicine.discount || 0}</p>
      <p><strong>Expiry Date:</strong> {new Date(medicine.expiryDate).toLocaleDateString()}</p>
      <p><strong>Total Units:</strong> {medicine.totalUnits} {medicine.unitType}</p>
      <p><strong>Buying Price (Admin Only):</strong> ${medicine.buyingPrice}</p>
      <p><strong>Description:</strong> {medicine.description}</p>
      <div className="mt-4 flex space-x-4">
        <Link to="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
