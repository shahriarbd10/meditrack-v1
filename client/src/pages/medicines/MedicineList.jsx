import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = `${import.meta.env.VITE_API_URL}/medicines`;

export default function MedicineList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | price | expiryDate
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
      setErr(e?.response?.data?.message || "Failed to load medicines");
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
        (r.name || "").toLowerCase().includes(s) ||
        (r.genericName || "").toLowerCase().includes(s) ||
        (r.category || "").toLowerCase().includes(s) ||
        (r.supplier || "").toLowerCase().includes(s)
      );
    }
    out.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === "createdAt" || sortBy === "expiryDate") {
        va = va ? +new Date(va) : 0;
        vb = vb ? +new Date(vb) : 0;
      } else if (sortBy === "price") {
        va = Number(va) || 0; vb = Number(vb) || 0;
      } else {
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
      }
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

  const handleDelete = async (id) => {
    if (!confirm("Delete this medicine?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete");
    }
  };

  const fullImage = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:5000${imageUrl}`;
  };

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString() : "—";

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Medicine List</h2>
            <div className="flex items-center gap-2">
              <input
                className="input input-bordered w-64"
                placeholder="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Link to="/dashboard/admin/medicines/add" className="btn btn-success btn-sm md:btn-md">
                + Add Medicine
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-base-200">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-12">SL</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("name")}>
                    Medicine Name {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>Generic Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Shelf</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("price")}>
                    Price {sortBy === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>Supplier Price</th>
                  <th>Strength</th>
                  <th className="cursor-pointer" onClick={() => toggleSort("expiryDate")}>
                    Expiry {sortBy === "expiryDate" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>Images</th>
                  <th className="w-56 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12}><div className="py-10 text-center">Loading…</div></td></tr>
                ) : err ? (
                  <tr><td colSpan={12}><div className="py-10 text-center text-error">{err}</div></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={12}><div className="py-10 text-center">No medicines found.</div></td></tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r._id}>
                      <td>{(page - 1) * pageSize + i + 1}</td>
                      <td className="font-medium">{r.name}</td>
                      <td>{r.genericName}</td>
                      <td>{r.category}</td>
                      <td>{r.supplier}</td>
                      <td>{r.shelf || ""}</td>
                      <td>{Number(r.price || 0).toFixed(2)}</td>
                      <td>{Number(r.supplierPrice || 0).toFixed(2)}</td>
                      <td>{r.strength || ""}</td>
                      <td>{fmtDate(r.expiryDate)}</td>
                      <td>
                        {r.imageUrl ? (
                          <img
                            src={fullImage(r.imageUrl)}
                            className="w-10 h-10 object-cover rounded-md"
                            alt="med"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link className="btn btn-sm" to={`/edit-medicine/${r._id}`}>Edit</Link>
                          <Link className="btn btn-sm btn-info" to={`/medicine-details/${r._id}`}>Details</Link>
                          <button className="btn btn-sm btn-error" onClick={() => handleDelete(r._id)}>Delete</button>
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
              <button className="btn join-item" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                « Prev
              </button>
              <button className="btn join-item" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next »
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
