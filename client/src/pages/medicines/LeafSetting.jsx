import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = "http://localhost:5000/api/leaf-settings";

function Modal({ open, onClose, onSubmit, editing }) {
  const [form, setForm] = useState({ leafType: "", totalNumber: "" });

  useEffect(() => {
    if (editing) {
      setForm({
        leafType: editing.leafType ?? "",
        totalNumber: editing.totalNumber ?? "",
      });
    } else {
      setForm({ leafType: "", totalNumber: "" });
    }
  }, [editing, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.leafType.trim()) return alert("Leaf Type is required.");
    if (form.totalNumber === "" || isNaN(Number(form.totalNumber)))
      return alert("Total Number must be numeric.");
    onSubmit({
      leafType: form.leafType.trim(),
      totalNumber: Number(form.totalNumber),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold">Leaf Setting</h3>
        </div>

        <form onSubmit={submit} className="p-6">
          <div className="form-control mb-4">
            <label className="label font-semibold">
              <span>Leaf Type <span className="text-red-500">*</span></span>
            </label>
            <input
              name="leafType"
              value={form.leafType}
              onChange={handleChange}
              placeholder="Leaf Type"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control mb-6">
            <label className="label font-semibold">
              <span>Total Number <span className="text-red-500">*</span></span>
            </label>
            <input
              name="totalNumber"
              type="number"
              value={form.totalNumber}
              onChange={handleChange}
              placeholder="Total Number"
              className="input input-bordered w-full"
              required
              min={0}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-success">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeafSettingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // table helpers
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // or 'leafType' or 'totalNumber'
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API);
      setRows(data?.data || []);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to load leaf settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    let out = [...rows];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((r) =>
        (r.leafType || "").toLowerCase().includes(s) ||
        String(r.totalNumber ?? "").includes(s)
      );
    }
    out.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === "createdAt") { va = +new Date(va); vb = +new Date(vb); }
      else if (sortBy === "leafType") { va = (va || "").toLowerCase(); vb = (vb || "").toLowerCase(); }
      else if (sortBy === "totalNumber") { va = Number(va); vb = Number(vb); }
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

  // open modal for add
  const openAdd = () => { setEditing(null); setOpen(true); };
  // open modal for edit
  const openEdit = (row) => { setEditing(row); setOpen(true); };

  // submit from modal
  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        const { data } = await axios.put(`${API}/${editing._id}`, payload);
        setRows((prev) => prev.map((r) => (r._id === editing._id ? data.data : r)));
      } else {
        const { data } = await axios.post(API, payload);
        setRows((prev) => [data.data, ...prev]);
      }
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this leaf setting?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">🌿 Leaf Setting</h2>

            <div className="flex gap-2 items-center">
              <input
                className="input input-bordered w-56"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn btn-success" onClick={openAdd} title="Add">
                +
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-base-200">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">Sl</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("leafType")}>
                    Leaf Type {sortBy === "leafType" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="cursor-pointer w-40" onClick={() => toggleSort("totalNumber")}>
                    Total Number {sortBy === "totalNumber" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="w-40 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}><div className="py-10 text-center">Loading…</div></td></tr>
                ) : err ? (
                  <tr><td colSpan={4}><div className="py-10 text-center text-error">{err}</div></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={4}><div className="py-10 text-center">No entries.</div></td></tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r._id}>
                      <td>{(page - 1) * pageSize + i + 1}</td>
                      <td className="font-medium">{r.leafType}</td>
                      <td>{r.totalNumber}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-sm btn-success" title="Edit" onClick={() => openEdit(r)}>
                            ✎
                          </button>
                          <button className="btn btn-sm btn-error" title="Delete" onClick={() => handleDelete(r._id)}>
                            🗑
                          </button>
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
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="join">
              <button className="btn join-item" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>« Prev</button>
              <button className="btn join-item" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next »</button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        editing={editing}
      />
    </div>
  );
}
