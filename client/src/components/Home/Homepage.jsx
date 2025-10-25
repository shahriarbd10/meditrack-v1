// src/components/Home/Homepage.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_PUBLIC_INV = `${import.meta.env.VITE_API_URL}/pharmacy-inventory/public`;
const PAGE_SIZE = 24;

/**
 * High-end, medical-light UI:
 * - Locked theme via data-theme="meditrack" (prevents auto dark)
 * - Soft radial gradient background + subtle blobs
 * - Clean spacing, a11y labels, refined motion
 * - All functionality preserved
 */
export default function Homepage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | price | expiryDate
  const [sortDir, setSortDir] = useState("desc");

  const qRef = useRef(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce search typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch public inventory (server paging + sorting)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const url =
          `${API_PUBLIC_INV}?page=${page}&limit=${PAGE_SIZE}` +
          `&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}` +
          (debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : "");
        const res = await axios.get(url);
        if (!cancelled) {
          setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
          setTotalPages(Math.max(1, Number(res?.data?.totalPages) || 1));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, sortBy, sortDir]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div
      data-theme="meditrack" // ensures light/medical theme regardless of system dark
      className="min-h-screen flex flex-col bg-base-100 text-base-content"
    >
      {/* Global background */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        {/* soft radial gradient canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_480px_at_10%_10%,rgba(14,165,168,0.16),transparent_55%),linear-gradient(to_bottom,#fff,rgba(246,249,252,1))]" />
        {/* subtle blobs */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* 1) NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-base-300/60 bg-base-100/70 backdrop-blur supports-[backdrop-filter]:bg-base-100/60">
        <nav
          className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between"
          role="navigation"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="font-black text-xl tracking-tight text-primary hover:opacity-90 focus:outline-none focus-visible:ring ring-primary/40 rounded"
          >
            MediTrack
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/register?role=pharmacy" className="btn btn-ghost btn-sm">
              Register
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* 2) HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Pharmacy Management,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Simplified
              </span>
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-base-content/70">
              Add medicines, track inventory, manage staff, and monitor sales — in one secure, modern dashboard.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register?role=pharmacy" className="btn btn-primary btn-lg">
                Create Your Pharmacy
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Login
              </Link>
            </div>

            {/* trust chips */}
            <div className="mt-8 grid grid-cols-3 max-w-md mx-auto gap-3 text-sm text-base-content/70">
              <div className="rounded-box border border-base-300 bg-base-100 px-3 py-2">
                <span className="font-semibold text-base-content">99.9%</span> Uptime
              </div>
              <div className="rounded-box border border-base-300 bg-base-100 px-3 py-2">
                <span className="font-semibold text-base-content">Role-based</span> Access
              </div>
              <div className="rounded-box border border-base-300 bg-base-100 px-3 py-2">
                <span className="font-semibold text-base-content">Fast</span> Search
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3) HIGHLIGHTS */}
      <section className="bg-base-200/60 border-y border-base-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature icon="⚕️" title="Healthcare-ready">
            GMP-compliant flow, expiry badges, and clear stock units.
          </Feature>
          <Feature icon="📦" title="Inventory Control">
            Live stock overview, search & sort by price, name, or expiry.
          </Feature>
          <Feature icon="🔐" title="Secure by Design">
            Optimized UI, role-based access, and responsive by default.
          </Feature>
        </div>
      </section>

      {/* 4) SEARCH + SORT TOOLBAR */}
      <section className="bg-base-100">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
            <div className="form-control w-full md:flex-1">
              <label className="input input-bordered flex items-center gap-2" htmlFor="search-meds">
                <SearchIcon />
                <input
                  id="search-meds"
                  ref={qRef}
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search medicines, generics, category…"
                  className="grow"
                  aria-label="Search medicines"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      setPage(1);
                      qRef.current?.focus();
                    }}
                    className="btn btn-ghost btn-xs"
                    aria-label="Clear search"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="tooltip tooltip-bottom" data-tip="Sort by field">
                <select
                  className="select select-bordered select-sm"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Sort by"
                >
                  <option value="createdAt">Newest</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="expiryDate">Expiry date</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  setPage(1);
                }}
                aria-label="Toggle sort direction"
                title={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
              >
                {sortDir === "asc" ? (
                  <span className="flex items-center gap-1">
                    Asc <ArrowUpIcon />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Desc <ArrowDownIcon />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5) MEDICINES GRID */}
      <main className="flex-grow bg-base-100">
        <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold">Available Medicines</h2>
            <span className="hidden sm:inline text-xs text-base-content/60">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <GridSkeleton />
          ) : err ? (
            <div role="alert" className="alert alert-error justify-between flex-col sm:flex-row gap-3">
              <span>{err}</span>
              <div className="flex gap-2">
                <button className="btn btn-sm" onClick={() => setPage((p) => p)}>
                  Retry
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setQ("");
                    setSortBy("createdAt");
                    setSortDir("desc");
                    setPage(1);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              onReset={() => {
                setQ("");
                setPage(1);
              }}
            />
          ) : (
            <>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <AnimatePresence initial={false}>
                  {rows.map((row) => (
                    <motion.div
                      layout
                      key={row._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                    >
                      <MiniMedicineCard row={row} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              <nav className="flex justify-center mt-8 gap-2" role="navigation" aria-label="Pagination">
                <button onClick={handlePrev} disabled={page === 1} className="btn btn-outline btn-sm">
                  « Prev
                </button>
                <span aria-live="polite" className="btn btn-disabled btn-sm" title={`Page ${page} of ${totalPages}`}>
                  Page {page} of {totalPages}
                </span>
                <button onClick={handleNext} disabled={page === totalPages} className="btn btn-outline btn-sm">
                  Next »
                </button>
              </nav>
            </>
          )}
        </section>
      </main>

      {/* 6) CTA BANNER */}
      <section className="bg-base-200 border-t border-base-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold">Ready to streamline your pharmacy?</h3>
          <p className="text-base-content/70 mt-2">
            Start free today. Add products, invite staff, and get selling in minutes.
          </p>
          <div className="mt-5">
            <Link to="/register?role=pharmacy" className="btn btn-primary btn-md">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* 7) FOOTER */}
      <footer className="footer footer-center p-6 bg-base-300 text-base-content">
        <div>
          <p>© {new Date().getFullYear()} MediTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------
   Subcomponents & Helpers
--------------------------- */
function Feature({ icon, title, children }) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <h4 className="font-semibold">{title}</h4>
        </div>
        <p className="text-sm text-base-content/70 mt-2">{children}</p>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-base-content/60"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className="inline-block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className="inline-block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 9-7 7-7-7" />
    </svg>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" aria-label="Loading products">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card bg-base-100 border border-base-200 shadow-sm" aria-hidden="true">
          <div className="h-28 w-full bg-base-200 animate-pulse rounded-t-md" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-2/3 bg-base-200 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-base-200 animate-pulse rounded" />
            <div className="h-3 w-1/3 bg-base-200 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 rounded-full bg-base-200 flex items-center justify-center">
        <span className="text-3xl">💊</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">No medicines found</h3>
      <p className="text-sm text-base-content/70 max-w-md mx-auto">
        Try clearing the search or adjusting your spelling.
      </p>
      <button onClick={onReset} className="btn btn-outline btn-sm mt-4">
        Clear search
      </button>
    </div>
  );
}

function fmtBDT(n) {
  const num = Number(n) || 0;
  return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function MiniMedicineCard({ row }) {
  const m = row?.medicine || {};
  const p = row?.pharmacy || {};

  const makeAbsolute = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const imgSrc =
    makeAbsolute(m?.imageUrl) ||
    "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp";

  const name = m?.name || "—";
  const generic = m?.genericName || "—";
  const unit = m?.unit || "";
  const strength = m?.strength || m?.amount || "";
  const vat = Number(row?.vat ?? m?.vat ?? 0) || 0;

  const expiryStr = row?.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "";
  const isExpired = row?.expiryDate ? new Date(row.expiryDate) < new Date() : false;

  const pharmacyName = p?.pharmacyName || "Pharmacy";
  const pharmacyLoc =
    p?.address?.district || p?.address?.division
      ? [p?.address?.district, p?.address?.division].filter(Boolean).join(", ")
      : "";

  return (
    <article className="group card bg-base-100 shadow-sm w-full max-w-[250px] border border-base-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus-within:shadow-lg">
      <figure className="relative overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          className="h-32 w-full object-cover rounded-t-md transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {unit && <span className="badge badge-neutral absolute left-2 top-2">{unit}</span>}
        {row?.expiryDate && (
          <span className={`badge absolute right-2 top-2 ${isExpired ? "badge-error" : "badge-warning"}`}>
            {isExpired ? "Expired" : "Expiry"}: {expiryStr}
          </span>
        )}
      </figure>
      <div className="card-body p-3">
        <h3 className="card-title text-sm leading-tight truncate" title={name}>
          {name}
        </h3>
        <div className="text-xs text-base-content/70 truncate" title={`Generic: ${generic}`}>
          {generic}
        </div>

        {/* Pharmacy line */}
        <div className="mt-2 text-[11px] text-base-content/70 truncate" title={pharmacyName}>
          🏪 <span className="font-medium">{pharmacyName}</span>
          {pharmacyLoc ? <span className="opacity-70"> • {pharmacyLoc}</span> : null}
        </div>

        {/* Strength + VAT */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-base-content/60">{strength || "—"}</span>
          {vat > 0 && (
            <span className="badge badge-outline" title={`VAT ${vat.toFixed(0)}%`}>
              VAT {vat.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Selling price (BDT) */}
        <div className="mt-1 text-sm font-semibold">{fmtBDT(row?.sellingPrice)}</div>

        <div className="card-actions justify-end mt-2">
          <Link
            to={`/pharmacy-inventory/${row._id}`}
            className="btn btn-primary btn-xs px-3 py-1"
            aria-label={`View details of ${name}`}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
