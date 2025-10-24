import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API_ADD_UNIT = `${import.meta.env.VITE_API_URL}/units`;
const ROUTES = { list: "/dashboard/admin/medicines/unit/list" };

export default function AddUnit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", status: "active" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return alert("Please enter a unit name.");
    try {
      setSubmitting(true);
      await axios.post(API_ADD_UNIT, { name, status: form.status });
      navigate(ROUTES.list);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to add unit";
      console.error("AddUnit error:", err?.response?.status, err?.response?.data, err);
      alert("❌ " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">📦 Add Unit</h2>
            <Link to={ROUTES.list} className="btn btn-success btn-sm md:btn-md">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z" />
              </svg>
              Unit List
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl">
            <div className="form-control mb-6">
              <label className="label font-semibold">
                <span>Unit Name <span className="text-red-500">*</span></span>
              </label>
              <input
                name="name"
                className="input input-bordered w-full"
                placeholder="e.g. Strip, Box, Bottle, Tube"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control mb-8">
              <label className="label font-semibold">
                <span>Status <span className="text-red-500">*</span></span>
              </label>
              <div className="flex items-center gap-8">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    className="radio radio-primary"
                    checked={form.status === "active"}
                    onChange={handleChange}
                  />
                  <span className="label-text">Active</span>
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    className="radio"
                    checked={form.status === "inactive"}
                    onChange={handleChange}
                  />
                  <span className="label-text">Inactive</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-40" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
