// src/components/Home/Homepage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:5000/api/medicines";
const PAGE_SIZE = 24;

/**
 * Homepage Structure
 * 1) Sticky Navbar
 * 2) Hero (healthcare gradient + CTA)
 * 3) Trust / Feature Highlights (icons)
 * 4) Search & Sort Toolbar
 * 5) Medicines Grid (cards with hover + badges)
 * 6) CTA Banner
 * 7) Footer
 */
export default function Homepage() {
  const [allMeds, setAllMeds] = useState([]);
  const [pageMeds, setPageMeds] = useState([]);
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

  // Fetch meds: prefer server paging; fallback to client paging
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await axios.get(`${API}?page=${page}&limit=${PAGE_SIZE}`);
        const maybeDataArr = res?.data?.data;
        const maybeLegacyArr = res?.data?.medicines;
        const maybeTotal = res?.data?.totalPages;

        if (Array.isArray(maybeDataArr) && typeof maybeTotal === "number") {
          if (!cancelled) {
            setPageMeds(maybeDataArr);
            setAllMeds([]);
            setTotalPages(Math.max(1, maybeTotal));
          }
        } else if (Array.isArray(maybeLegacyArr) && typeof maybeTotal === "number") {
          if (!cancelled) {
            setPageMeds(maybeLegacyArr);
            setAllMeds([]);
            setTotalPages(Math.max(1, maybeTotal));
          }
        } else {
          // Client paging fallback
          const resAll = await axios.get(API);
          const list = resAll?.data?.data ?? resAll?.data?.medicines ?? [];
          if (!Array.isArray(list)) throw new Error("Invalid medicines payload");
          if (!cancelled) {
            setPageMeds([]);
            setAllMeds(list);
            setTotalPages(Math.max(1, Math.ceil(list.length / PAGE_SIZE)));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load medicines");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Client filtering + sorting (only when client paging)
  const filteredAll = useMemo(() => {
    let list = allMeds;
    if (debouncedQ) {
      const s = debouncedQ.toLowerCase();
      list = list.filter((m) => {
        const fields = [m.name, m.genericName, m.category, m.supplier, m.type, m.unit]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());
        return fields.some((f) => f.includes(s));
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      if (sortBy === "name") return dir * String(a.name || "").localeCompare(String(b.name || ""));
      if (sortBy === "price") return dir * ((Number(a.price) || 0) - (Number(b.price) || 0));
      if (sortBy === "expiryDate") {
        const ad = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
        const bd = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
        return dir * (ad - bd);
      }
      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dir * (ac - bc);
    });
    return list;
  }, [allMeds, debouncedQ, sortBy, sortDir]);

  // Page slice
  const currentClientPage = useMemo(() => {
    if (pageMeds.length > 0) return pageMeds;
    const start = (page - 1) * PAGE_SIZE;
    return filteredAll.slice(start, start + PAGE_SIZE);
  }, [pageMeds, filteredAll, page]);

  // Recompute total pages when filtering in client mode
  useEffect(() => {
    if (allMeds.length > 0) {
      const pages = Math.max(1, Math.ceil(filteredAll.length / PAGE_SIZE));
      setTotalPages(pages);
      setPage((p) => Math.min(p, pages));
    }
  }, [filteredAll.length, allMeds.length]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* 1) NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-base-200 bg-base-100/80 backdrop-blur">
        <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-lg md:text-xl tracking-tight text-primary">
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
        {/* Healthcare-suited gradient blues/teals */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-100 via-base-100 to-emerald-50" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Pharmacy Management, <span className="text-primary">Simplified</span>
            </h1>
            <p className="max-w-2xl mx-auto mt-3 md:mt-4 text-base md:text-lg text-base-content/70">
              Add medicines, track inventory, manage staff, and monitor sales — in one secure, modern dashboard.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register?role=pharmacy" className="btn btn-primary btn-lg">
                Create Your Pharmacy
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3) HIGHLIGHTS */}
      <section className="bg-base-200/60 border-y border-base-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature icon="⚕️" title="Healthcare-ready">
            GMP-compliant flow, expiry badges, and clear stock units.
          </Feature>
          <Feature icon="📦" title="Inventory Control">
            Live stock overview, search & sort by price, name, or expiry.
          </Feature>
          <Feature icon="⚡" title="Fast & Secure">
            Optimized UI, role-based access, and responsive by default.
          </Feature>
        </div>
      </section>

      {/* 4) SEARCH + SORT TOOLBAR */}
      <section className="bg-base-100">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
            <div className="form-control w-full md:flex-1">
              <label className="input input-bordered flex items-center gap-2">
                <SearchIcon />
                <input
                  ref={qRef}
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search medicines, generics, category…"
                  className="grow"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort by"
              >
                <option value="createdAt">Newest</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="expiryDate">Expiry date</option>
              </select>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                aria-label="Toggle sort direction"
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5) MEDICINES GRID */}
      <main className="flex-grow bg-base-100">
        <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
            Available Medicines
          </h2>

          {loading ? (
            <GridSkeleton />
          ) : err ? (
            <div className="alert alert-error justify-center">{err}</div>
          ) : currentClientPage.length === 0 ? (
            <EmptyState onReset={() => setQ("")} />
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              >
                <AnimatePresence>
                  {currentClientPage.map((med) => (
                    <motion.div
                      layout
                      key={med._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <MiniMedicineCard med={med} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              <div className="flex justify-center mt-8 gap-2">
                <button onClick={handlePrev} disabled={page === 1} className="btn btn-outline btn-sm">
                  « Prev
                </button>
                <span className="btn btn-disabled btn-sm">Page {page} of {totalPages}</span>
                <button onClick={handleNext} disabled={page === totalPages} className="btn btn-outline btn-sm">
                  Next »
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {/* 6) CTA BANNER */}
      <section className="bg-base-200 border-t border-base-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold">Ready to streamline your pharmacy?</h3>
          <p className="text-base-content/70 mt-1">
            Start free today. Add products, invite staff, and get selling in minutes.
          </p>
          <div className="mt-4">
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
    <div className="card bg-base-100 border border-base-300 shadow-sm">
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
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-base-content/60">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card bg-base-100 border border-base-200 shadow">
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
      <button onClick={onReset} className="btn btn-outline btn-sm mt-4">Clear search</button>
    </div>
  );
}

function MiniMedicineCard({ med }) {
  const imgSrc = med?.imageUrl
    ? /^https?:\/\//i.test(med.imageUrl)
      ? med.imageUrl
      : `http://localhost:5000${med.imageUrl}`
    : med?.picture || "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp";

  const name = med?.name || "—";
  const generic = med?.genericName || "—";
  const unit = med?.unit || "";
  const strength = med?.strength || med?.amount || "";
  const price = Number(med?.price) || 0;
  const vat = Number(med?.vat) || 0;
  const expiryStr = med?.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : "";
  const isExpired = med?.expiryDate ? new Date(med.expiryDate) < new Date() : false;

  return (
    <article className="card bg-base-100 shadow-sm w-full max-w-[220px] border border-base-200 hover:shadow-md transition-transform hover:-translate-y-0.5">
      <figure className="relative overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          className="h-28 w-full object-cover rounded-t-md transition-transform duration-300 hover:scale-[1.03]"
          loading="lazy"
        />
        {unit && <span className="badge badge-neutral absolute left-2 top-2">{unit}</span>}
        {med?.expiryDate && (
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
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-base-content/60">{strength || "—"}</span>
          {vat > 0 && <span className="badge badge-outline">VAT {vat.toFixed(0)}%</span>}
        </div>
        <div className="mt-1 text-sm font-semibold">${price.toFixed(2)}</div>
        <div className="card-actions justify-end mt-2">
          <Link to={`/medicine-info/${med._id}`} className="btn btn-primary btn-xs px-3 py-1">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
