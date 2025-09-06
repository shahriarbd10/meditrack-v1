import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = "http://localhost:5000/api/invoices";
const toDate = (d) => new Date(d).toISOString().slice(0, 10);
const fmt = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));

export default function InvoiceList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API);
      const list = data?.data || data || [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filtered = useMemo(() => {
    let list = rows;

    if (start) {
      list = list.filter((r) => !r.date || toDate(r.date) >= start);
    }
    if (end) {
      list = list.filter((r) => !r.date || toDate(r.date) <= end);
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.invoiceNo || "").toLowerCase().includes(s) ||
          String(r.customerName || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [rows, q, start, end]);

  const totalAmount = useMemo(
    () => filtered.reduce((acc, r) => acc + (Number(r.grandTotal || 0)), 0),
    [filtered]
  );

  const paged = useMemo(() => {
    const st = (page - 1) * pageSize;
    return filtered.slice(st, st + pageSize);
  }, [filtered, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchRows();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h1 className="text-lg font-semibold">Invoice List</h1>
          <Link to="/dashboard/admin/invoices/add" className="btn btn-success btn-sm">
            + Add Invoice
          </Link>
        </div>

        <div className="p-4">
          <div className="bg-white border rounded-md p-4">
            {/* filters row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-gray-100 rounded-l border">Start Date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-gray-100 rounded-l border">End Date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              <button className="btn btn-success btn-sm" onClick={() => setPage(1)}>
                Find
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span>Search:</span>
                <input
                  className="input input-bordered"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Invoice no / Customer"
                />
              </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto mt-4">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th style={{ width: 60 }}>SL</th>
                    <th>Invoice No</th>
                    <th>Invoice Id</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th className="text-right">Total Amount</th>
                    <th className="text-center" style={{ width: 220 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8">Loading...</td>
                    </tr>
                  )}
                  {!loading && paged.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8">No data</td>
                    </tr>
                  )}
                  {!loading &&
                    paged.map((r, i) => (
                      <tr key={r._id || i}>
                        <td>{(page - 1) * pageSize + i + 1}</td>
                        <td>{r.invoiceNo || "-"}</td>
                        <td>{r._id || r.invoiceId || "-"}</td>
                        <td>{r.customerName || "Walking Customer"}</td>
                        <td>{r.date ? toDate(r.date) : "-"}</td>
                        <td className="text-right">{fmt(r.grandTotal)}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="btn btn-ghost btn-xs"
                              title="View"
                              onClick={() =>
                                navigate(`/dashboard/admin/invoices/view/${r._id || r.invoiceId}`)
                              }
                            >
                              👁️
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              title="Print"
                              onClick={() =>
                                navigate(`/dashboard/admin/invoices/view/${r._id || r.invoiceId}?print=1`)
                              }
                            >
                              🖨️
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-blue-600"
                              title="Edit"
                              onClick={() =>
                                navigate(`/dashboard/admin/invoices/edit/${r._id || r.invoiceId}`)
                              }
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-red-500"
                              title="Delete"
                              onClick={() => handleDelete(r._id || r.invoiceId)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
                {/* footer total */}
                {!loading && filtered.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-right font-semibold">Total:</td>
                      <td className="text-right font-semibold">{fmt(totalAmount)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
              </div>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: Math.ceil(filtered.length / pageSize) || 1 }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      className={`join-item btn btn-sm ${page === idx + 1 ? "btn-success" : ""}`}
                      onClick={() => setPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  )
                )}
                <button
                  className="join-item btn btn-sm"
                  disabled={page >= Math.ceil(filtered.length / pageSize)}
                  onClick={() =>
                    setPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
