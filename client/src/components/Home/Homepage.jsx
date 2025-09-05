// src/components/Home/Homepage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api/medicines";
const PAGE_SIZE = 24;

export default function Homepage() {
  const [allMeds, setAllMeds] = useState([]); // full list (if server doesn't paginate)
  const [pageMeds, setPageMeds] = useState([]); // current page items (if server paginates)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // Attempt server pagination first; fallback to client pagination seamlessly
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        // Try calling with page/limit (in case server supports it)
        const res = await axios.get(`${API}?page=${page}&limit=${PAGE_SIZE}`);

        // Support newer server shape: { data: [...] }
        const maybeDataArr = res?.data?.data;
        const maybeLegacyArr = res?.data?.medicines;
        const maybeTotal = res?.data?.totalPages;

        if (Array.isArray(maybeDataArr) && typeof maybeTotal === "number") {
          if (!cancelled) {
            setPageMeds(maybeDataArr);
            setAllMeds([]); // using server paging
            setTotalPages(Math.max(1, maybeTotal));
          }
        } else if (Array.isArray(maybeLegacyArr) && typeof maybeTotal === "number") {
          if (!cancelled) {
            setPageMeds(maybeLegacyArr);
            setAllMeds([]);
            setTotalPages(Math.max(1, maybeTotal));
          }
        } else {
          // No server pagination. Fetch all and paginate client-side.
          const resAll = await axios.get(API);
          const list = resAll?.data?.data ?? resAll?.data?.medicines ?? [];
          if (!Array.isArray(list)) throw new Error("Invalid medicines payload");

          if (!cancelled) {
            setAllMeds(list);
            setTotalPages(Math.max(1, Math.ceil(list.length / PAGE_SIZE)));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Failed to load medicines");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page]);

  // Client-side filtering + pagination (only if allMeds is in use)
  const filteredAll = useMemo(() => {
    if (!q.trim()) return allMeds;
    const s = q.toLowerCase();
    return allMeds.filter((m) => {
      const fields = [
        m.name,
        m.genericName,
        m.category,
        m.supplier,
        m.type,
        m.unit,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [allMeds, q]);

  const currentClientPage = useMemo(() => {
    if (pageMeds.length > 0) return pageMeds; // server pagination in effect
    // client-side slice
    const start = (page - 1) * PAGE_SIZE;
    return filteredAll.slice(start, start + PAGE_SIZE);
  }, [pageMeds, filteredAll, page]);

  useEffect(() => {
    // if using client paging, recompute total pages on filter
    if (allMeds.length > 0) {
      const pages = Math.max(1, Math.ceil(filteredAll.length / PAGE_SIZE));
      setTotalPages(pages);
      setPage((p) => Math.min(p, pages));
    }
  }, [filteredAll.length, allMeds.length]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-sm px-6">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            MediTrack
          </Link>
        </div>
        <div className="flex-none space-x-2">
          <Link to="/register?role=pharmacy" className="btn btn-outline btn-sm">
            Register
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero min-h-[300px] bg-base-200 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
          Welcome to MediTrack Pharmacy Builder
        </h1>
        <p className="max-w-2xl text-base md:text-lg mb-6 text-base-content/80">
          Manage your pharmacy with ease — add medicines, track inventory, assign staff,
          and monitor sales all in one platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/register?role=pharmacy" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Login
          </Link>
        </div>
      </section>

      {/* Toolbar (search) */}
      <div className="bg-base-100">
        <div className="max-w-[1280px] mx-auto px-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="form-control w-full md:w-96">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search medicines, generics, category…"
                className="input input-bordered w-full"
              />
            </div>
            <div className="text-sm text-base-content/60">
              Showing page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medicines Grid */}
      <main className="flex-grow p-6 bg-base-100 max-w-[1280px] mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
          Available Medicines
        </h2>

        {loading ? (
          <div className="py-12 text-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : err ? (
          <p className="text-center text-error">{err}</p>
        ) : currentClientPage.length === 0 ? (
          <p className="text-center text-base-content/70">No medicines found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentClientPage.map((med) => (
                <MiniMedicineCard key={med._id} med={med} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="btn btn-outline btn-sm"
              >
                « Prev
              </button>
              <span className="btn btn-disabled cursor-default btn-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPages}
                className="btn btn-outline btn-sm"
              >
                Next »
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-base-200 text-base-content">
        <div>
          <p>© {new Date().getFullYear()} MediTrack Pharmacy Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ===========================
   Small presentational card
=========================== */
function MiniMedicineCard({ med }) {
  const imgSrc = useMemo(() => {
    // prefer new imageUrl; fallback to legacy picture or placeholder
    if (med?.imageUrl) {
      if (/^https?:\/\//i.test(med.imageUrl)) return med.imageUrl;
      return `http://localhost:5000${med.imageUrl}`;
    }
    if (med?.picture) return med.picture;
    return "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp";
  }, [med]);

  const name = med?.name || "—";
  const generic = med?.genericName || "—";
  const unit = med?.unit || "";
  const strength = med?.strength || med?.amount || ""; // legacy fallback for "amount"
  const price = Number(med?.price) || 0;
  const vat = Number(med?.vat) || 0;
  const expiryStr = med?.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : "";
  const isExpired = med?.expiryDate ? new Date(med.expiryDate) < new Date() : false;

  return (
    <div className="card bg-base-100 shadow-sm w-full max-w-[200px] border border-base-200">
      <figure className="relative">
        <img
          src={imgSrc}
          alt={name}
          className="h-28 w-full object-cover rounded-t-md"
          loading="lazy"
        />
        <div className="absolute left-2 top-2">
          {unit && <span className="badge badge-neutral">{unit}</span>}
        </div>
        {med?.expiryDate && (
          <div className="absolute right-2 top-2">
            <span className={`badge ${isExpired ? "badge-error" : "badge-warning"}`}>
              {isExpired ? "Expired" : "Expiry"}: {expiryStr}
            </span>
          </div>
        )}
      </figure>
      <div className="card-body p-3">
        <h2 className="card-title text-sm leading-tight truncate" title={name}>
          {name}
        </h2>
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
    </div>
  );
}
