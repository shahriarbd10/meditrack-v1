import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PharmacyDashboard() {
  const [pharmacy, setPharmacy] = useState(null); // Current logged in pharmacy user
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current pharmacy user info from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setPharmacy(user);

    // Fetch staff for this pharmacy (if linked by pharmacyId)
    async function fetchStaff() {
      try {
        const res = await axios.get("http://localhost:5000/api/staff"); // Adjust API to filter by pharmacy if needed
        setStaffList(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        pharmacyId: pharmacy?.id || pharmacy?._id, // Use your user ID key here
      };
      await axios.post("http://localhost:5000/api/staff", payload);
      setMessage("Staff user added successfully");
      setForm({ name: "", email: "", password: "" });
      // Refresh staff list
      const res = await axios.get("http://localhost:5000/api/staff");
      setStaffList(res.data);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Failed to add staff");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    try {
      await axios.delete(`http://localhost:5000/api/staff/${staffId}`);
      setStaffList(staffList.filter((staff) => staff._id !== staffId));
      setMessage("Staff deleted successfully");
    } catch (err) {
      setMessage("Failed to delete staff");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-4xl font-bold text-primary mb-4 md:mb-0">
          Welcome, {pharmacy?.name || "Pharmacy"}
        </h1>
        <div className="flex space-x-6">
          <div className="card bg-white p-6 rounded-lg shadow-md text-center flex-1">
            <h3 className="text-lg font-semibold mb-2">Total Staff</h3>
            <p className="text-3xl font-bold">{staffList.length}</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow-md text-center flex-1">
            <h3 className="text-lg font-semibold mb-2">Medicines</h3>
            <p className="text-3xl font-bold">--</p>
            <small>(Coming Soon)</small>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Staff List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Staff</h2>
          {staffList.length === 0 ? (
            <p>No staff added yet.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {staffList.map((staff) => (
                <li
                  key={staff._id}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-sm text-gray-600">{staff.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(staff._id)}
                    className="btn btn-sm btn-error"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Staff Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Add New Staff</h2>
          <form onSubmit={handleAddStaff} className="space-y-4 max-w-md">
            <input
              type="text"
              placeholder="Staff Name"
              className="input input-bordered w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Staff Email"
              className="input input-bordered w-full"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Staff Password"
              className="input input-bordered w-full"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary w-full">
              Add Staff
            </button>
          </form>
          {message && (
            <p className="mt-4 text-center text-green-600 font-medium">{message}</p>
          )}
        </div>
      </section>
    </div>
  );
}
