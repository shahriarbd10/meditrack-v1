// src/pages/staff/StaffDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* =======================
   Demo fallback (used if fetch fails)
======================= */
const demo = {
  summary: {
    date: new Date().toISOString(),
    salesToday: 12850,
    invoicesToday: 19,
    itemsSold: 73,
    lowStockCount: 6,
  },
  invoices: [
    { id: "INV-1042", customer: "Rahim Pharmacy", total: 1250, status: "Paid", createdAt: "2025-09-09T10:22:00" },
    { id: "INV-1041", customer: "Ayesha Clinic", total: 980, status: "Due", createdAt: "2025-09-09T09:41:00" },
    { id: "INV-1040", customer: "City Med", total: 2110, status: "Paid", createdAt: "2025-09-09T09:17:00" },
    { id: "INV-1039", customer: "Green Care", total: 760, status: "Due", createdAt: "2025-09-09T08:55:00" },
  ],
  lowStock: [
    { sku: "AMOX-500", name: "Amoxicillin 500mg", inStock: 8, min: 20 },
    { sku: "PNTO-40", name: "Pantoprazole 40mg", inStock: 12, min: 25 },
    { sku: "PARA-500", name: "Paracetamol 500mg", inStock: 15, min: 30 },
  ],
  expiring: [
    { sku: "CEFA-1G", name: "Ceftriaxone 1g", batch: "B23X", expires: "2025-10-05" },
    { sku: "ORS-20", name: "ORS Sachet", batch: "O24B", expires: "2025-10-18" },
  ],
};

/* =======================
   Config — point to your API
======================= */
const API = {
  summary: "/api/staff/summary",
  invoices: "/api/invoices?limit=10&sort=-createdAt",
  lowStock: "/api/medicines?filter=lowStock&limit=10",
  expiring: "/api/medicines?filter=expiringSoon&limit=10",
};

/* =======================
   Helpers
======================= */
const money = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(n || 0));
const fmtDateTime = (d) => new Date(d).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString();

/* =======================
   Small UI atoms (keep in-file for portability)
======================= */
function StatCard({ title, value, hint, icon }) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-gray-800/70 shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
          {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-2xl bg-white/70 dark:bg-gray-800/70 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </td>
      ))}
    </tr>
  );
}

/* =======================
   Fetch hook with graceful demo fallback
======================= */
function useFetchOrDemo(url, key) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    (async () => {
      try {
        setPending(true);
        setErr("");
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!active) return;
        setData(json?.data ?? json);
      } catch (e) {
        // fallback to demo
        if (!active) return;
        setData(demo[key]);
        setErr("Demo data shown (API unavailable).");
      } finally {
        if (active) setPending(false);
      }
    })();
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [url, key]);

  return { data, pending, err };
}

/* =======================
   Staff Dashboard
======================= */
export default function StaffDashboard() {
  const navigate = useNavigate();

  const { data: summary, pending: loadingSummary, err: errSummary } = useFetchOrDemo(API.summary, "summary");
  const { data: invoices, pending: loadingInv, err: errInv } = useFetchOrDemo(API.invoices, "invoices");
  const { data: lowStock, pending: loadingLow, err: errLow } = useFetchOrDemo(API.lowStock, "lowStock");
  const { data: expiring, pending: loadingExp, err: errExp } = useFetchOrDemo(API.expiring, "expiring");

  const today = useMemo(() => fmtDate(summary?.date || Date.now()), [summary]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Welcome, Staff
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview for {today}</p>
          {(errSummary || errInv || errLow || errExp) && (
            <p className="text-xs text-amber-600 mt-2">Live information, Nahar Pharma</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/invoices/add"
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.99] transition"
          >
            + New Invoice
          </Link>
          <Link
            to="/customers/add"
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition"
          >
            + Add Customer
          </Link>
          <Link
            to="/purchases/add"
            className="px-3 sm:px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Receive Purchase
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {loadingSummary ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-24 bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Sales Today"
              value={money(summary?.salesToday)}
              hint="Total billed amount"
              icon={<span className="font-semibold text-blue-600">৳</span>}
            />
            <StatCard
              title="Invoices"
              value={summary?.invoicesToday ?? 0}
              hint="Issued today"
              icon={<span className="font-semibold text-blue-600">#</span>}
            />
            <StatCard
              title="Items Sold"
              value={summary?.itemsSold ?? 0}
              hint="Units today"
              icon={<span className="font-semibold text-blue-600">∑</span>}
            />
            <StatCard
              title="Low Stock"
              value={summary?.lowStockCount ?? 0}
              hint="Needs restock"
              icon={<span className="font-semibold text-blue-600">!</span>}
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent invoices */}
        <div className="xl:col-span-2">
          <Section
            title="Recent Invoices"
            action={
              <Link
                to="/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium text-right">Total</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loadingInv ? (
                    <>
                      <SkeletonRow cols={5} />
                      <SkeletonRow cols={5} />
                      <SkeletonRow cols={5} />
                    </>
                  ) : (invoices || []).map((iv) => (
                    <tr key={iv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/invoices/${iv.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                          title="Open invoice"
                        >
                          {iv.id}
                        </button>
                      </td>
                      <td className="px-3 py-3">{iv.customer}</td>
                      <td className="px-3 py-3">{fmtDateTime(iv.createdAt)}</td>
                      <td className="px-3 py-3 text-right">{money(iv.total)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            iv.status === "Paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}
                        >
                          {iv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loadingInv && (invoices || []).length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={5}>
                        No invoices yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Side column: Low stock + expiring */}
        <div className="flex flex-col gap-4">
          <Section
            title="Low Stock"
            action={
              <Link to="/medicines?filter=lowStock" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage →
              </Link>
            }
          >
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {loadingLow ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="py-3 animate-pulse">
                    <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                  </li>
                ))
              ) : (lowStock || []).map((m) => (
                <li key={m.sku} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{m.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {m.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-rose-600">{m.inStock} in stock</div>
                    <div className="text-xs text-gray-400">Min {m.min}</div>
                  </div>
                </li>
              ))}
              {!loadingLow && (lowStock || []).length === 0 && (
                <li className="py-6 text-center text-gray-500 dark:text-gray-400">All good here!</li>
              )}
            </ul>
          </Section>

          <Section
            title="Expiring Soon (≤30 days)"
            action={<Link to="/medicines?filter=expiring" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Review →</Link>}
          >
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {loadingExp ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <li key={i} className="py-3 animate-pulse">
                    <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                  </li>
                ))
              ) : (expiring || []).map((e) => (
                <li key={`${e.sku}-${e.batch}`} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{e.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Batch {e.batch} • SKU {e.sku}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {fmtDate(e.expires)}
                  </span>
                </li>
              ))}
              {!loadingExp && (expiring || []).length === 0 && (
                <li className="py-6 text-center text-gray-500 dark:text-gray-400">No near-expiry items.</li>
              )}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
