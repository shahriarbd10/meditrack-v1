// src/pages/customers/CustomerCredit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const CUSTOMER_ROUTES = {
  add: "/dashboard/admin/customers/add",
  list: "/dashboard/admin/customers/list",
  credit: "/dashboard/admin/customers/credit",
  paid: "/dashboard/admin/customers/paid",
  edit: (id) => `/edit-customer/${id}`,
};

function Arrow({ dir }) {
  if (!dir) return null;
  return (
    <svg
      className={`ml-1 inline-block h-3 w-3 ${dir === "asc" ? "" : "rotate-180"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M10 3l6 8H4l6-8z" />
    </svg>
  );
}

export default function CustomerCredit() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/customers");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        if (!cancelled) setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = (s) => (s ?? "").toString().toLowerCase().trim();
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // 1) Only balances > 0 (credit customers)
  const creditOnly = useMemo(
    () => customers.filter((c) => num(c.previousBalance) > 0),
    [customers]
  );

  // 2) Search within the credit subset
  const searched = useMemo(() => {
    if (!query) return creditOnly;
    const q = normalized(query);
    return creditOnly.filter((c) => {
      const fields = [
        c.name,
        c.mobile,
        c.email1,
        c.email2,
        c.phone,
        c.contact,
        c.address1,
        c.address2,
        c.city,
        c.state,
        c.zip,
        c.country,
        c.fax,
      ];
      return fields.some((f) => normalized(f).includes(q));
    });
  }, [creditOnly, query]);

  // 3) Sort
  const sorted = useMemo(() => {
    if (!sort.key) return searched;
    const copy = [...searched];
    copy.sort((a, b) => {
      const av = (a?.[sort.key] ?? "").toString().toLowerCase();
      const bv = (b?.[sort.key] ?? "").toString().toLowerCase();
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [searched, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key) => {
    setPage(1);
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key, dir: "asc" };
    });
  };

  const confirmDelete = async (id) => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer");
    }
  };

  const exportCSV = () => {
    const headers = [
      "SL",
      "Name",
      "Address 1",
      "Mobile",
      "Email",
      "City",
      "State",
      "Zip",
      "Country",
      "Balance",
    ];
    const rows = sorted.map((c, idx) => [
      idx + 1,
      c.name ?? "",
      c.address1 ?? "",
      c.mobile ?? "",
      c.email1 ?? "",
      c.city ?? "",
      c.state ?? "",
      c.zip ?? "",
      c.country ?? "",
      c.previousBalance ?? 0,
    ]);
    const csv =
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credit_customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const numberFmt = (v) => {
    const n = Number(v ?? 0);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const goToAddCustomer = () => navigate(CUSTOMER_ROUTES.add);
  const goToEditCustomer = (id) => navigate(CUSTOMER_ROUTES.edit(id));

  // total outstanding for quick glance
  const totalOutstanding = useMemo(
    () => creditOnly.reduce((sum, c) => sum + num(c.previousBalance), 0),
    [creditOnly]
  );

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <div className="flex-1 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary">Credit Customers</h2>
            <p className="text-sm text-gray-500">
              Showing customers with balance &gt; 0. Total outstanding:{" "}
              <span className="font-semibold">{numberFmt(totalOutstanding)}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              title="Export CSV"
              type="button"
            >
              Export CSV
            </button>

            <button
              onClick={goToAddCustomer}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
              type="button"
            >
              + Add Customer
            </button>

            <button
              type="button"
              className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white shadow hover:bg-gray-800"
              onClick={() => navigate(CUSTOMER_ROUTES.list)}
            >
              All Customers
            </button>
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
              onClick={() => navigate(CUSTOMER_ROUTES.paid)}
            >
              ✓ Paid Customer
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Show</span>
            <select
              className="rounded border px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 hidden sm:inline">entries</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-600 hidden sm:inline">Search:</span>
            <input
              type="text"
              placeholder="Name, mobile, email, city…"
              className="flex-1 sm:w-64 rounded border px-3 py-2 text-sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {loading && (
            <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
              Loading customers…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-lg border bg-white p-4 text-center text-red-600 shadow-sm">
              {error}
            </div>
          )}
          {!loading && !error && pageData.length === 0 && (
            <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
              No credit customers found.
            </div>
          )}

          {!loading &&
            !error &&
            pageData.map((c, idx) => (
              <div
                key={c._id}
                className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {(page - 1) * pageSize + idx + 1}. {c.name || "—"}
                  </h3>
                  <span className="text-xs rounded bg-gray-100 px-2 py-1">
                    {c.city || "—"}
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="text-gray-500">Mobile:</span> {c.mobile || "—"}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span> {c.email1 || "—"}
                  </p>
                  <p className="line-clamp-2">
                    <span className="text-gray-500">Address:</span> {c.address1 || "—"}
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-500">Balance:</span>
                    <span className="font-medium">{numberFmt(c.previousBalance)}</span>
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => goToEditCustomer(c._id)}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-100"
                    title="Edit"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(c._id)}
                    className="rounded-md border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    title="Delete"
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Desktop/tablet table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="w-16 px-3 py-3">SL</th>
                <th className="cursor-pointer px-3 py-3" onClick={() => toggleSort("name")}>
                  Customer Name <Arrow dir={sort.key === "name" ? sort.dir : null} />
                </th>
                <th className="px-3 py-3">Address 1</th>
                <th className="cursor-pointer px-3 py-3" onClick={() => toggleSort("mobile")}>
                  Mobile <Arrow dir={sort.key === "mobile" ? sort.dir : null} />
                </th>
                <th className="px-3 py-3">Email</th>
                <th className="cursor-pointer px-3 py-3" onClick={() => toggleSort("city")}>
                  City <Arrow dir={sort.key === "city" ? sort.dir : null} />
                </th>
                <th className="px-3 py-3">State</th>
                <th className="px-3 py-3">Zip</th>
                <th className="px-3 py-3">Country</th>
                <th className="px-3 py-3 text-right">Balance</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center" colSpan={11}>
                    Loading customers…
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-red-600" colSpan={11}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && pageData.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center" colSpan={11}>
                    No credit customers found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                pageData.map((c, idx) => (
                  <tr key={c._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{c.name}</td>
                    <td className="px-3 py-2">{c.address1 || "-"}</td>
                    <td className="px-3 py-2">{c.mobile || "-"}</td>
                    <td className="px-3 py-2">{c.email1 || "-"}</td>
                    <td className="px-3 py-2">{c.city || "-"}</td>
                    <td className="px-3 py-2">{c.state || "-"}</td>
                    <td className="px-3 py-2">{c.zip || "-"}</td>
                    <td className="px-3 py-2">{c.country || "-"}</td>
                    <td className="px-3 py-2 text-right">{numberFmt(c.previousBalance)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => goToEditCustomer(c._id)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-100"
                          title="Edit"
                          type="button"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a2 2 0 01-.878.507l-3.11.777a.5.5 0 01-.606-.606l.777-3.11a2 2 0 01.507-.878l9.9-9.9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(c._id)}
                          className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          title="Delete"
                          type="button"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 6h8l-.867 10.142A2 2 0 0111.142 18H8.858a2 2 0 01-1.991-1.858L6 6zM8 4h4l1 2H7l1-2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">
              {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, sorted.length)}
            </span>{" "}
            of <span className="font-medium">{sorted.length}</span> entries
          </p>
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </span>
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
