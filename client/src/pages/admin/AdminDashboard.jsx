// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import MedicineCard from "../../components/MedicineCard";
import { Link, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalStaff: 0,
    activeUsers: 0,
  });
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await axios.get("http://localhost:5000/api/admin/stats");
        const medicinesRes = await axios.get("http://localhost:5000/api/medicines");

        if (medicinesRes.data && Array.isArray(medicinesRes.data.medicines)) {
          setMedicines(medicinesRes.data.medicines);
        } else {
          setError("Failed to load medicines data. Response is not an array.");
        }

        setStats(statsRes.data);
      } catch (err) {
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
      // Adjust to your auth storage
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 bg-gray-800 md:block min-h-screen">
        <div className="py-3 text-2xl uppercase text-center tracking-widest bg-gray-900 border-b-2 border-gray-800 mb-8">
          <Link to="/" className="text-white">Logo</Link>
        </div>

        <nav className="text-sm text-gray-300">
          <ul className="flex flex-col">
            <li className="px-4 cursor-pointer bg-gray-500 text-gray-800 hover:bg-gray-700 hover:text-white">
              <Link className="py-3 flex items-center" to="/admin">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                Dashboard
              </Link>
            </li>

            <li className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
              User Management
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link className="py-3 flex items-center" to="/admin/users">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                Users
              </Link>
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link className="py-3 flex items-center" to="/admin/roles">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Roles
              </Link>
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link className="py-3 flex items-center" to="/admin/permissions">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Permissions
              </Link>
            </li>

            <li className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
              Product Management
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link className="py-3 flex items-center" to="/admin/categories">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
                Categories
              </Link>
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link className="py-3 flex items-center" to="/admin/products">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                Products
              </Link>
            </li>

            <li className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
              Ecommerce
            </li>

            <li className="px-4 hover:bg-gray-700">
              <Link to="/admin/orders" className="py-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                Orders
              </Link>
            </li>

            <li className="px-4 hover:bg-gray-700">
              <Link to="/admin/payments" className="py-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
                Payments
              </Link>
            </li>

            <li className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
              Information Management
            </li>

            <li className="px-4 hover:bg-gray-700">
              <Link to="/admin/reports" className="py-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                Reports
              </Link>
            </li>

            <li className="px-4 py-2 mt-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
              Apps
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link to="/admin/messages" className="py-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
                </svg>
                Messages
                <span className="ml-auto text-xs bg-gray-500 px-2 py-1 rounded-sm">16</span>
              </Link>
            </li>

            <li className="px-4 cursor-pointer hover:bg-gray-700">
              <Link to="/admin/calendar" className="py-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth="1.5" stroke="currentColor" className="w-4 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
                Calendar
              </Link>
            </li>

            {/* Logout at the bottom (desktop) */}
            <li className="mt-auto px-4 py-4">
              <button
                onClick={handleLogout}
                className="w-full btn btn-error btn-sm"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-gray-800 min-h-full">
            <div className="py-3 text-2xl uppercase text-center tracking-widest bg-gray-900 border-b-2 border-gray-800 mb-8">
              <Link to="/" className="text-white" onClick={() => setIsSidebarOpen(false)}>
                Logo
              </Link>
            </div>
            {/* Reuse a minimal subset for mobile or the same list as above */}
            <nav className="text-sm text-gray-300">
              <ul className="flex flex-col">
                <li className="px-4 cursor-pointer bg-gray-500 text-gray-800 hover:bg-gray-700 hover:text-white">
                  <Link className="py-3 flex items-center" to="/admin" onClick={() => setIsSidebarOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                <li className="px-4 cursor-pointer hover:bg-gray-700">
                  <Link className="py-3 flex items-center" to="/admin/users" onClick={() => setIsSidebarOpen(false)}>
                    Users
                  </Link>
                </li>
                <li className="px-4 cursor-pointer hover:bg-gray-700">
                  <Link className="py-3 flex items-center" to="/admin/products" onClick={() => setIsSidebarOpen(false)}>
                    Products
                  </Link>
                </li>
                <li className="px-4 py-4">
                  <button onClick={handleLogout} className="w-full btn btn-error btn-sm">
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          {/* backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            className="md:hidden btn btn-outline btn-sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            Menu
          </button>

          <h1 className="text-2xl md:text-4xl font-bold text-primary text-center md:text-left">
            Admin Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="hidden md:inline-flex btn btn-error btn-sm"
          >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {medicines.map((medicine) => (
              <MedicineCard
                key={medicine._id}
                medicine={medicine}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
