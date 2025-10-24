// src/pages/medicines/EditMedicine.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = {
  base: `${import.meta.env.VITE_API_URL}/medicines`,
  categories: `${import.meta.env.VITE_API_URL}/categories`,
  types: `${import.meta.env.VITE_API_URL}/types`,
  units: `${import.meta.env.VITE_API_URL}/units`,
  suppliers: `${import.meta.env.VITE_API_URL}/suppliers`,
  leaf: `${import.meta.env.VITE_API_URL}/leaf-settings`,
};


export default function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();

  // dropdown data
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [leafs, setLeafs] = useState([]);

  // form state
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // image
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // load dropdowns
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

        // load medicine
        const res = await axios.get(`${API.base}/${id}`);
        const med = res?.data?.data ?? res?.data ?? null;
        if (!med) throw new Error("Not found");

        setForm({
          barcode: med.barcode || "",
          strength: med.strength || "",
          boxSize: med.boxSize || "",
          shelf: med.shelf || "",
          category: med.category || "",
          type: med.type || "",
          supplier: med.supplier || "",
          unit: med.unit || "",
          name: med.name || "",
          genericName: med.genericName || "",
          details: med.details || "",
          price: med.price ?? "",
          supplierPrice: med.supplierPrice ?? "",
          vat: med.vat ?? "0",
          status: med.status || "active",
          expiryDate: med.expiryDate ? med.expiryDate.split("T")[0] : "",
          imageUrl: med.imageUrl || med.picture || "", // legacy fallback
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load medicine.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const currentImage = useMemo(() => {
    if (!form?.imageUrl) return "";
    if (/^https?:\/\//i.test(form.imageUrl)) return form.imageUrl;
    return `http://localhost:5000${form.imageUrl}`;
  }, [form?.imageUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      const fd = new FormData();
      // append all editable fields
      Object.entries({
        barcode: form.barcode,
        strength: form.strength,
        boxSize: form.boxSize,
        shelf: form.shelf,
        category: form.category,
        type: form.type,
        supplier: form.supplier,
        unit: form.unit,
        name: form.name,
        genericName: form.genericName,
        details: form.details,
        price: form.price,
        supplierPrice: form.supplierPrice,
        vat: form.vat,
        status: form.status,
        expiryDate: form.expiryDate,
      }).forEach(([k, v]) => fd.append(k, v ?? ""));

      if (file) fd.append("image", file);

      await axios.put(`${API.base}/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Medicine updated successfully!");
      navigate("/dashboard/admin/medicines/list");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update medicine.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Medicine not found.</div>;

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">✏️ Edit Medicine</h2>
            <div className="flex gap-2">
              <Link to="/dashboard/admin/medicines/list" className="btn btn-ghost btn-sm md:btn-md">
                Back to List
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT column */}
            <div className="space-y-4">
              <div>
                <label className="label font-semibold">Bar Code/QR Code</label>
                <input name="barcode" className="input input-bordered w-full" value={form.barcode} onChange={handleChange} />
              </div>

              <div>
                <label className="label font-semibold">Strength</label>
                <input name="strength" className="input input-bordered w-full" value={form.strength} onChange={handleChange} />
              </div>

              <div>
                <label className="label font-semibold">Box Size *</label>
                <select name="boxSize" className="select select-bordered w-full" value={form.boxSize} onChange={handleChange}>
                  <option value="">Select Leaf Pattern</option>
                  {leafs.map((x) => (
                    <option key={x._id} value={x.leafType}>
                      {x.leafType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Shelf</label>
                <input name="shelf" className="input input-bordered w-full" value={form.shelf} onChange={handleChange} />
              </div>

              <div>
                <label className="label font-semibold">Category *</label>
                <select name="category" className="select select-bordered w-full" value={form.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Medicine Type</label>
                <select name="type" className="select select-bordered w-full" value={form.type} onChange={handleChange}>
                  <option value="">Select Type</option>
                  {types.map((t) => (
                    <option key={t._id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Supplier *</label>
                <select name="supplier" className="select select-bordered w-full" value={form.supplier} onChange={handleChange} required>
                  <option value="">Select Manufacturer</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s.manufacturerName}>
                      {s.manufacturerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">VAT %</label>
                <div className="flex items-center gap-2">
                  <input
                    name="vat"
                    type="number"
                    step="0.01"
                    className="input input-bordered w-full"
                    value={form.vat}
                    onChange={handleChange}
                  />
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
            </div>

            {/* RIGHT column */}
            <div className="space-y-4">
              <div>
                <label className="label font-semibold">Medicine Name *</label>
                <input name="name" className="input input-bordered w-full" value={form.name} onChange={handleChange} required />
              </div>

              <div>
                <label className="label font-semibold">Generic Name *</label>
                <input name="genericName" className="input input-bordered w-full" value={form.genericName} onChange={handleChange} required />
              </div>

              <div>
                <label className="label font-semibold">Unit *</label>
                <select name="unit" className="select select-bordered w-full" value={form.unit} onChange={handleChange} required>
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u._id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-semibold">Medicine Details</label>
                <input name="details" className="input input-bordered w-full" value={form.details} onChange={handleChange} placeholder="Medicine details" />
              </div>

              <div>
                <label className="label font-semibold">Price *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Supplier Price *</label>
                <input
                  name="supplierPrice"
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={form.supplierPrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Replace Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleFile} className="file-input file-input-bordered w-full" />
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold">Current:</span>
                {currentImage ? (
                  <img src={currentImage} className="w-16 h-16 object-cover rounded-md border" alt="current" />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold">New:</span>
                {preview ? (
                  <img src={preview} className="w-16 h-16 object-cover rounded-md border" alt="preview" />
                ) : (
                  <span className="text-gray-400">No file chosen</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button type="submit" className={`btn btn-primary w-40 ${busy ? "btn-disabled" : ""}`} disabled={busy}>
                {busy ? "Updating…" : "Update"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
