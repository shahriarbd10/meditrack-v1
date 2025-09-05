import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API = "http://localhost:5000/api/purchases";
const toDate = (d) => new Date(d).toISOString().slice(0, 10);

export default function PurchaseList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // lightweight client-side filters
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setList(res.data?.data || []);
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
      await axios.delete(`${API}/${id}`);
      setList((p) => p.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete purchase.");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-xl border border-base-300">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-base-300">
            <h1 className="text-xl md:text-2xl font-bold">Purchase List</h1>
            <Link to="/dashboard/admin/purchases/add" className="btn btn-success btn-sm">
              + Add Purchase
            </Link>
          </div>

          {/* Filters */}
          <div className="px-5 md:px-8 pt-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
              <div className="form-control">
                <label className="label text-xs opacity-70">Start Date</label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label text-xs opacity-70">End Date</label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              <div className="form-control flex-1 min-w-[220px]">
                <label className="label text-xs opacity-70">Search</label>
                <input
                  className="input input-bordered"
                  placeholder="Invoice / Purchase Id / Supplier"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button className="btn btn-outline" onClick={load}>
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="px-5 md:px-8 pb-6 pt-4 overflow-x-auto">
            <table className="table w-[1000px] lg:w-full">
              <thead className="bg-base-200 text-[13px]">
                <tr>
                  <th>SL</th>
                  <th>Invoice No</th>
                  <th>Purchase Id</th>
                  <th>Supplier Name</th>
                  <th>Date</th>
                  <th className="text-right">Total Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody className="text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10">
                      <span className="loading loading-spinner" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 opacity-70">
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p._id}>
                      <td>{i + 1}</td>
                      <td>{p.invoiceNo || "—"}</td>
                      <td className="font-mono">{p.purchaseId}</td>
                      <td>{p.supplierName}</td>
                      <td>{toDate(p.date)}</td>
                      <td className="text-right font-semibold">
                        {Number(p.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="flex gap-2">
                        {/* In future: view / edit buttons here */}
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
