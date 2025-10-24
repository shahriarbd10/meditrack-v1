// src/pages/medicines/AddCategory.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API_ADD_CATEGORY = `${import.meta.env.VITE_API_URL}/categories`; // server/app.js mounts /api/categories
const ROUTES = {
  list: "/dashboard/admin/medicines/category/list",
};

export default function AddCategory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    status: "active", // "active" | "inactive"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      alert("Please enter a category name.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(API_ADD_CATEGORY, {
        name,
        status: form.status, // backend accepts "active"/"inactive"
      });
      navigate(ROUTES.list);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || "Failed to add category";
      console.error("AddCategory error:", status, err?.response?.data, err);
      alert(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header + Back */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">📁 Add Category</h2>
            <Link to={ROUTES.list} className="btn btn-success btn-sm md:btn-md" title="Category List">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z" />
              </svg>
              Category List
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-3xl">
            {/* Name */}
            <div className="form-control mb-6">
              <label className="label font-semibold">
                <span>
                  Category Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Analgesic"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Status */}
            <div className="form-control mb-8">
              <label className="label font-semibold">
                <span>
                  Status <span className="text-red-500">*</span>
                </span>
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

            {/* Actions */}
            <button type="submit" className="btn btn-primary w-40" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
