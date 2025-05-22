import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalStaff: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
        setError("Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading stats...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-center text-primary">Admin Dashboard</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Recent Activities</h2>
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pharmacy A</td>
                <td>Added new medicine</td>
                <td>2025-05-22</td>
              </tr>
              <tr>
                <td>Staff B</td>
                <td>Updated stock</td>
                <td>2025-05-21</td>
              </tr>
              <tr>
                <td>Admin C</td>
                <td>Created user account</td>
                <td>2025-05-20</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
