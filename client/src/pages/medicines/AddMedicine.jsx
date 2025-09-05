import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API = {
  add: "http://localhost:5000/api/medicines", // multipart endpoint
  categories: "http://localhost:5000/api/categories",
  types: "http://localhost:5000/api/types",
  units: "http://localhost:5000/api/units",
  suppliers: "http://localhost:5000/api/suppliers",
  leaf: "http://localhost:5000/api/leaf-settings",
};

export default function AddMedicine() {
  const navigate = useNavigate();

  // dropdown data
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [leafs, setLeafs] = useState([]);

  // form state
  const [form, setForm] = useState({
    barcode: "",
    name: "",
    genericName: "",
    strength: "",
    unit: "",
    boxSize: "",
    shelf: "",
    category: "",
    type: "",
    supplier: "",
    details: "",
    price: "",
    supplierPrice: "",
    vat: "0",
    status: "active",
    expiryDate: "", // ← NEW
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [c, t, u, s, l] = await Promise.all([
          axios.get(API.categories),
          axios.get(API.types),
          axios.get(API.units),
          axios.get(API.suppliers),
          axios.get(API.leaf),
        ]);
        setCategories(c.data?.data || []);
        setTypes(t.data?.data || []);
        setUnits(u.data?.data || []);
        setSuppliers(s.data?.data || []);
        setLeafs(l.data?.data || []);
      } catch (err) {
        console.error("Dropdown load error:", err);
        alert("Failed to load dropdowns");
      }
    })();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Medicine name is required");
    if (!form.genericName.trim()) return alert("Generic name is required");
    if (!form.category || !form.unit || !form.supplier) return alert("Select Category, Unit and Supplier");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (file) fd.append("image", file);

      await axios.post(API.add, fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/dashboard/admin/medicines/list");
    } catch (err) {
      console.error("Add medicine error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Failed to add medicine");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Add Medicine</h2>
            <div className="flex gap-2">
              <Link to="/dashboard/admin/medicines/list" className="btn btn-success btn-sm md:btn-md">
                Medicine List
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT side */}
            <div className="space-y-4">
              <div>
                <label className="label font-semibold">Bar Code/QR Code</label>
                <input name="barcode" className="input input-bordered w-full" value={form.barcode} onChange={handleChange} placeholder="Bar Code/QR Code" />
              </div>

              <div>
                <label className="label font-semibold">Strength</label>
                <input name="strength" className="input input-bordered w-full" value={form.strength} onChange={handleChange} placeholder="Strength" />
              </div>

              <div>
                <label className="label font-semibold">Box Size *</label>
                <select name="boxSize" className="select select-bordered w-full" value={form.boxSize} onChange={handleChange}>
                  <option value="">Select Leaf Pattern</option>
                  {leafs.map((x) => (
                    <option key={x._id} value={x.leafType}>{x.leafType}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Shelf</label>
                <input name="shelf" className="input input-bordered w-full" value={form.shelf} onChange={handleChange} placeholder="Shelf" />
              </div>

              <div>
                <label className="label font-semibold">Category *</label>
                <select name="category" className="select select-bordered w-full" value={form.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Medicine Type</label>
                <select name="type" className="select select-bordered w-full" value={form.type} onChange={handleChange}>
                  <option value="">Select Type</option>
                  {types.map((t) => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Supplier *</label>
                <select name="supplier" className="select select-bordered w-full" value={form.supplier} onChange={handleChange} required>
                  <option value="">Select Manufacturer</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s.manufacturerName}>{s.manufacturerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">VAT %</label>
                <div className="flex items-center gap-2">
                  <input name="vat" type="number" step="0.01" className="input input-bordered w-full" value={form.vat} onChange={handleChange} placeholder="e.g. 15.00" />
                  <span className="text-lime-600 font-semibold">%</span>
                </div>
              </div>

              <div>
                <label className="label font-semibold">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  className="input input-bordered w-full"
                  value={form.expiryDate}
                  onChange={handleChange}
                />
              </div>

              <div>
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
            </div>

            {/* RIGHT side */}
            <div className="space-y-4">
              <div>
                <label className="label font-semibold">Medicine Name *</label>
                <input name="name" className="input input-bordered w-full" value={form.name} onChange={handleChange} placeholder="Medicine Name" required />
              </div>

              <div>
                <label className="label font-semibold">Generic Name *</label>
                <input name="genericName" className="input input-bordered w-full" value={form.genericName} onChange={handleChange} placeholder="Generic Name" required />
              </div>

              <div>
                <label className="label font-semibold">Unit *</label>
                <select name="unit" className="select select-bordered w-full" value={form.unit} onChange={handleChange} required>
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u._id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Medicine Details</label>
                <input name="details" className="input input-bordered w-full" value={form.details} onChange={handleChange} placeholder="Medicine Details" />
              </div>

              <div>
                <label className="label font-semibold">Price *</label>
                <input name="price" type="number" step="0.01" className="input input-bordered w-full" value={form.price} onChange={handleChange} placeholder="Price" required />
              </div>

              <div>
                <label className="label font-semibold">Supplier Price *</label>
                <input name="supplierPrice" type="number" step="0.01" className="input input-bordered w-full" value={form.supplierPrice} onChange={handleChange} placeholder="Supplier Price" required />
              </div>

              <div>
                <label className="label font-semibold">Image</label>
                <input type="file" accept="image/*" onChange={handleFile} className="file-input file-input-bordered w-full" />
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold">Preview:</span>
                {preview ? (
                  <img src={preview} alt="preview" className="w-16 h-16 object-cover rounded-md border" />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary w-40">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
