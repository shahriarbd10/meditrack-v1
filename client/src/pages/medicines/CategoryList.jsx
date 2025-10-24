// src/pages/medicines/CategoryList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = `${import.meta.env.VITE_API_URL}/categories`;

function StatusBadge({ value }) {
  const isActive = value === "active";
  return (
    <span className={`badge ${isActive ? "badge-success" : "badge-ghost"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function CategoryList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive

  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch list
  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API);
      setRows(data?.data || []);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // Derived list (search + filter + sort)
  const filtered = useMemo(() => {
    let out = [...rows];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((r) => r.name?.toLowerCase().includes(s));
    }
    if (status !== "all") {
      out = out.filter((r) => r.status === status);
    }

    out.sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === "createdAt") {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      } else {
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return out;
  }, [rows, q, status, sortBy, sortDir]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Actions
  const handleToggle = async (id, current) => {
    const next = current === "active" ? "inactive" : "active";
    try {
      await axios.put(`${API}/${id}`, { status: next });
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: next } : r)));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">📚 Category List</h2>
            <div className="flex gap-2">
              <Link to="/dashboard/admin/medicines/category/add" className="btn btn-primary btn-sm md:btn-md">
                + Add Category
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              className="input input-bordered w-full"
              placeholder="Search by name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="join w-full">
              <button
                type="button"
                className={`btn join-item ${sortBy === "createdAt" ? "btn-active" : ""}`}
                onClick={() => toggleSort("createdAt")}
                title="Sort by Created"
              >
                Created {sortBy === "createdAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button
                type="button"
                className={`btn join-item ${sortBy === "name" ? "btn-active" : ""}`}
                onClick={() => toggleSort("name")}
                title="Sort by Name"
              >
                Name {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-base-200">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Name</th>
                  <th className="w-32">Status</th>
                  <th className="w-40">Created</th>
                  <th className="w-48 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center">Loading…</div>
                    </td>
                  </tr>
                ) : err ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center text-error">{err}</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center">No categories found.</div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r._id}>
                      <td>{(page - 1) * pageSize + i + 1}</td>
                      <td className="font-medium">{r.name}</td>
                      <td><StatusBadge value={r.status} /></td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn btn-sm"
                            onClick={() => handleToggle(r._id, r.status)}
                            title={r.status === "active" ? "Set Inactive" : "Set Active"}
                          >
                            {r.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn btn-sm btn-error" onClick={() => handleDelete(r._id)}>
                            Delete
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
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="join">
              <button
                className="btn join-item"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                « Prev
              </button>
              <button
                className="btn join-item"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next »
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
