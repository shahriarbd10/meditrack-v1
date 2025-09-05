// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MedicineCard from "../../components/MedicineCard";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API = {
  stats: "http://localhost:5000/api/admin/stats",
  medicines: "http://localhost:5000/api/medicines",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalStaff: 0,
    activeUsers: 0,
  });

  const [medicines, setMedicines] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // load stats
    (async () => {
      try {
        const res = await axios.get(API.stats);
        // be tolerant to different shapes
        const s = res?.data || {};
        setStats({
          totalPharmacies: Number(s.totalPharmacies) || 0,
          totalStaff: Number(s.totalStaff) || 0,
          activeUsers: Number(s.activeUsers) || 0,
        });
      } catch (e) {
        console.error(e);
        // keep defaults; show small inline error later if you want
      } finally {
        setLoadingStats(false);
      }
    })();

    // load medicines
    (async () => {
      try {
        const res = await axios.get(API.medicines);
        const list = res?.data?.data ?? res?.data?.medicines ?? [];
        if (Array.isArray(list)) setMedicines(list);
        else throw new Error("Invalid medicines payload");
      } catch (e) {
        console.error(e);
        setError("Failed to load medicines.");
      } finally {
        setLoadingMeds(false);
      }
    })();
  }, []);

  const totalActive = useMemo(
    () => medicines.filter((m) => (m.status || "active") === "active").length,
    [medicines]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    try {
      await axios.delete(`${API.medicines}/${id}`);
      setMedicines((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete medicine");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  const isLoading = loadingStats || loadingMeds;

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar (reusable) */}
      <Sidebar onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Admin Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-error btn-sm hidden md:inline-flex">
            Logout
          </button>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <StatCard
            title="Total Pharmacies"
            value={stats.totalPharmacies}
            loading={loadingStats}
          />
          <StatCard title="Total Staff" value={stats.totalStaff} loading={loadingStats} />
          <StatCard title="Active Users" value={stats.activeUsers} loading={loadingStats} />
          <StatCard title="Active Medicines" value={totalActive} loading={loadingMeds} />
        </section>

        {/* Medicines Section */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Medicines</h2>
            <Link to="/dashboard/admin/medicines/add" className="btn btn-success">
              + Add Medicine
            </Link>
          </div>

          {isLoading ? (
            <div className="py-10 text-center">Loading…</div>
          ) : error ? (
            <div className="py-10 text-center text-error">{error}</div>
          ) : medicines.length === 0 ? (
            <div className="py-10 text-center text-base-content/70">
              No medicines found. Click <span className="font-semibold">+ Add Medicine</span> to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {medicines.map((medicine) => (
                <MedicineCard key={medicine._id} medicine={medicine} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============ Small Presentational Card for Stats ============ */
function StatCard({ title, value, loading }) {
  return (
    <div className="card bg-white shadow-md rounded-lg p-5">
      <div className="text-sm uppercase tracking-wide text-base-content/60">{title}</div>
      <div className="mt-2 text-3xl font-bold text-secondary">
        {loading ? <span className="loading loading-dots loading-lg" /> : value}
      </div>
    </div>
  );
}
