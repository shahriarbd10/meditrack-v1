// src/pages/suppliers/SupplierList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = "http://localhost:5000/api/suppliers";

/* ---------------- Modal for inline edit ---------------- */
function EditModal({ open, onClose, data, onSubmit }) {
  const [form, setForm] = useState(data || {});
  useEffect(() => setForm(data || {}), [data, open]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Supplier</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label font-semibold">Manufacturer Name *</label>
            <input
              name="manufacturerName"
              className="input input-bordered w-full"
              value={form.manufacturerName || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Address 1</label>
            <input
              name="address1"
              className="input input-bordered w-full"
              value={form.address1 || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Mobile No</label>
            <input
              name="phone"
              className="input input-bordered w-full"
              value={form.phone || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Email</label>
            <input
              type="email"
              name="email"
              className="input input-bordered w-full"
              value={form.email || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">City</label>
            <input
              name="city"
              className="input input-bordered w-full"
              value={form.city || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">State</label>
            <input
              name="state"
              className="input input-bordered w-full"
              value={form.state || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Zip</label>
            <input
              name="zip"
              className="input input-bordered w-full"
              value={form.zip || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Country</label>
            <input
              name="country"
              className="input input-bordered w-full"
              value={form.country || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label font-semibold">Balance</label>
            <input
              name="previousBalance"
              type="number"
              step="0.01"
              className="input input-bordered w-full"
              value={form.previousBalance ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-success" onClick={() => onSubmit(form)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- List page ---------------- */
export default function SupplierList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | manufacturerName | previousBalance
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API);
      setRows(data?.data || []);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    let out = [...rows];

    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter((r) =>
        (r.manufacturerName || "").toLowerCase().includes(s) ||
        (r.address1 || "").toLowerCase().includes(s) ||
        (r.phone || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s) ||
        (r.city || "").toLowerCase().includes(s) ||
        (r.state || "").toLowerCase().includes(s) ||
        (r.zip || "").toLowerCase().includes(s) ||
        (r.country || "").toLowerCase().includes(s)
      );
    }

    out.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === "createdAt") { va = +new Date(va); vb = +new Date(vb); }
      else if (sortBy === "previousBalance") { va = Number(va) || 0; vb = Number(vb) || 0; }
      else { va = (va || "").toString().toLowerCase(); vb = (vb || "").toString().toLowerCase(); }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return out;
  }, [rows, q, sortBy, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [q]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  };

  const openEdit = (row) => { setEditing(row); setOpen(true); };

  const saveEdit = async (payload) => {
    try {
      const { data } = await axios.put(`${API}/${editing._id}`, payload);
      setRows((prev) => prev.map((r) => (r._id === editing._id ? data.data : r)));
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete supplier");
    }
  };

  const fmtBalance = (v) => {
    const n = Number(v) || 0;
    const text = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
      <span className={n < 0 ? "text-red-600 font-medium" : ""}>
        {text}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Supplier List</h2>
            <div className="flex items-center gap-2">
              <input
                className="input input-bordered w-64"
                placeholder="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Link to="/dashboard/admin/suppliers/add" className="btn btn-success btn-sm md:btn-md">
                + Add Supplier
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-base-200">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">SL</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("manufacturerName")}>
                    Supplier Name {sortBy === "manufacturerName" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>Address 1</th>
                  <th>Mobile No</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Zip</th>
                  <th>Country</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("previousBalance")}>
                    Balance {sortBy === "previousBalance" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="w-40 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="py-10 text-center">Loading…</div>
                    </td>
                  </tr>
                ) : err ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="py-10 text-center text-error">{err}</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="py-10 text-center">No suppliers found.</div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r._id}>
                      <td>{(page - 1) * pageSize + i + 1}</td>
                      <td className="font-medium">{r.manufacturerName}</td>
                      <td>{r.address1 || ""}</td>
                      <td>{r.phone || ""}</td>
                      <td>{r.email || ""}</td>
                      <td>{r.city || ""}</td>
                      <td>{r.state || ""}</td>
                      <td>{r.zip || ""}</td>
                      <td>{r.country || ""}</td>
                      <td>{fmtBalance(r.previousBalance)}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-sm btn-success" onClick={() => openEdit(r)} title="Edit">✎</button>
                          <button className="btn btn-sm btn-error" onClick={() => handleDelete(r._id)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="join">
              <button className="btn join-item" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                « Previous
              </button>
              <button className="btn join-item" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next »
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <EditModal
        open={open}
        onClose={() => setOpen(false)}
        data={editing}
        onSubmit={saveEdit}
      />
    </div>
  );
}
