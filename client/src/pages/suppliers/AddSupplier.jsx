import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = `${import.meta.env.VITE_API_URL}/suppliers`;
const ROUTES = { list: "/dashboard/admin/suppliers/list" };

export default function AddSupplier() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    manufacturerName: "",
    contactName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    status: "active",
    previousBalance: "",
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const manufacturerName = form.manufacturerName.trim();
    if (!manufacturerName) return alert("Manufacturer name is required.");
    try {
      setSubmitting(true);
      await axios.post(API, { ...form, manufacturerName });
      navigate(ROUTES.list);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to add supplier";
      console.error("AddSupplier error:", err?.response?.status, err?.response?.data, err);
      alert("❌ " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">🏭 Add Supplier</h2>
            <Link to={ROUTES.list} className="btn btn-success btn-sm md:btn-md">Supplier List</Link>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="md:col-span-2">
              <label className="label font-semibold">Manufacturer Name *</label>
              <input
                name="manufacturerName"
                className="input input-bordered w-full"
                value={form.manufacturerName}
                onChange={handleChange}
                placeholder="e.g., ACME Pharma Ltd."
                required
              />
            </div>

            <div>
              <label className="label font-semibold">Contact Person</label>
              <input name="contactName" className="input input-bordered w-full" value={form.contactName} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">Phone</label>
              <input name="phone" className="input input-bordered w-full" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">Email</label>
              <input type="email" name="email" className="input input-bordered w-full" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">Previous Balance</label>
              <input type="number" step="0.01" name="previousBalance" className="input input-bordered w-full" value={form.previousBalance} onChange={handleChange} />
            </div>

            <div className="md:col-span-2">
              <label className="label font-semibold">Address 1</label>
              <input name="address1" className="input input-bordered w-full" value={form.address1} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="label font-semibold">Address 2</label>
              <input name="address2" className="input input-bordered w-full" value={form.address2} onChange={handleChange} />
            </div>

            <div>
              <label className="label font-semibold">City</label>
              <input name="city" className="input input-bordered w-full" value={form.city} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">State</label>
              <input name="state" className="input input-bordered w-full" value={form.state} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">ZIP</label>
              <input name="zip" className="input input-bordered w-full" value={form.zip} onChange={handleChange} />
            </div>
            <div>
              <label className="label font-semibold">Country</label>
              <input name="country" className="input input-bordered w-full" value={form.country} onChange={handleChange} />
            </div>

            <div className="md:col-span-2">
              <label className="label font-semibold">Status *</label>
              <div className="flex items-center gap-8">
                <label className="label cursor-pointer gap-2">
                  <input type="radio" name="status" value="active" className="radio radio-primary" checked={form.status === "active"} onChange={handleChange} />
                  <span className="label-text">Active</span>
                </label>
                <label className="label cursor-pointer gap-2">
                  <input type="radio" name="status" value="inactive" className="radio" checked={form.status === "inactive"} onChange={handleChange} />
                  <span className="label-text">Inactive</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <button className="btn btn-primary w-40" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
