import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API_BASE = "http://localhost:5000/api/purchases";
const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function minExpiry(items = []) {
  // pick earliest valid expiry in the item list
  const times = (items || [])
    .map((it) => (it?.expiryDate ? new Date(it.expiryDate).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (!times.length) return "";
  return toDate(new Date(Math.min(...times)));
}

export default function PurchaseList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setList(res.data?.data || []); // backend shape: { data: [...] }
    } catch (err) {
      console.error(err);
      alert("Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let data = [...list];
    if (start) data = data.filter((x) => new Date(x.date) >= new Date(start));
    if (end) data = data.filter((x) => new Date(x.date) <= new Date(end));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (x) =>
          (x.invoiceNo || "").toLowerCase().includes(q) ||
          (x.purchaseId || "").toLowerCase().includes(q) ||
          (x.supplierName || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [list, start, end, search]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setList((p) => p.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete purchase.");
    }
  };

  const onEdit = (id) => navigate(`/dashboard/admin/purchases/edit/${id}`);

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      {/* keep page from horizontally scrolling */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="w-full mx-auto bg-white rounded-xl shadow-xl border border-base-300">
          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-base-300">
            <h1 className="text-xl md:text-2xl font-bold">Purchase List</h1>
            <Link to="/dashboard/admin/purchases/add" className="btn btn-success btn-sm">
              + Add Purchase
            </Link>
          </div>

          {/* Filters */}
          <div className="px-5 md:px-8 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <label className="form-control">
                <span className="label text-xs opacity-70">Start Date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>

              <label className="form-control">
                <span className="label text-xs opacity-70">End Date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>

              <label className="form-control sm:col-span-2 lg:col-span-2">
                <span className="label text-xs opacity-70">Search</span>
                <input
                  className="input input-bordered"
                  placeholder="Invoice / Purchase Id / Supplier"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <div className="flex sm:justify-end items-end">
                <button className="btn btn-outline w-full sm:w-auto" onClick={load}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Table (only this area scrolls horizontally) */}
          <div className="px-5 md:px-8 pb-6 pt-4 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-base-300">
            <table className="table min-w-[1120px] w-full">
              <thead className="bg-base-200 text-[13px] sticky top-0 z-10">
                <tr>
                  <th className="min-w-[60px]">SL</th>
                  <th className="min-w-[140px]">Invoice No</th>
                  <th className="min-w-[160px]">Purchase Id</th>
                  <th className="min-w-[220px]">Supplier Name</th>
                  <th className="min-w-[120px]">Date</th>
                  <th className="min-w-[140px]">Earliest Expiry</th>
                  <th className="min-w-[140px] text-right">Total Amount</th>
                  <th className="min-w-[160px]">Action</th>
                </tr>
              </thead>

              <tbody className="text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10">
                      <span className="loading loading-spinner" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 opacity-70">
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p._id}>
                      <td>{i + 1}</td>
                      <td>{p.invoiceNo || "—"}</td>
                      <td className="font-mono">{p.purchaseId}</td>
                      <td className="truncate max-w-[260px]">{p.supplierName}</td>
                      <td>{toDate(p.date)}</td>
                      <td>{minExpiry(p.items)}</td>
                      <td className="text-right font-semibold">
                        {Number(p.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="flex flex-wrap gap-2">
                        <button className="btn btn-info btn-xs" onClick={() => onEdit(p._id)}>
                          Edit
                        </button>
                        <button className="btn btn-error btn-xs" onClick={() => onDelete(p._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
