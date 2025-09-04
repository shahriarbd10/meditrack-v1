// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import MedicineCard from "../../components/MedicineCard";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar"; // ⬅️ reusable sidebar

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalPharmacies: 0, totalStaff: 0, activeUsers: 0 });
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await axios.get("http://localhost:5000/api/admin/stats");
        const medicinesRes = await axios.get("http://localhost:5000/api/medicines");
        if (medicinesRes.data && Array.isArray(medicinesRes.data.medicines)) {
          setMedicines(medicinesRes.data.medicines);
        } else setError("Failed to load medicines data. Response is not an array.");
        setStats(statsRes.data);
      } catch {
        setError("Failed to load statistics or medicines.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/medicines/delete/${id}`);
      setMedicines((prev) => prev.filter((med) => med._id !== id));
    } catch (err) {
      alert("Failed to delete medicine");
      console.error(err);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar (reusable across all pages) */}
      <Sidebar onLogout={handleLogout} />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Admin Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-error btn-sm hidden md:inline-flex">
            Logout
          </button>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Total Pharmacies</h2>
            <p className="text-3xl font-bold text-secondary">{stats.totalPharmacies}</p>
          </div>
          <div className="card bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Total Staff</h2>
            <p className="text-3xl font-bold text-secondary">{stats.totalStaff}</p>
          </div>
          <div className="card bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Active Users</h2>
            <p className="text-3xl font-bold text-secondary">{stats.activeUsers}</p>
          </div>
        </section>

        {/* Medicines Section */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Medicines</h2>
            <Link to="/add-medicine" className="btn btn-success">
              Add New Medicine
            </Link>
          </div>
          {medicines.length === 0 ? (
            <p className="text-gray-600">No medicines found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {medicines.map((medicine) => (
                <MedicineCard key={medicine._id} medicine={medicine} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
