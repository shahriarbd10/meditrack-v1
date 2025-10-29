// src/components/Home/Homepage.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_PUBLIC_INV = `${import.meta.env.VITE_API_URL}/pharmacy-inventory/public`;
const PAGE_SIZE = 24;

export default function Homepage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | price | expiryDate
  const [sortDir, setSortDir] = useState("desc");
  const [menuOpen, setMenuOpen] = useState(false);

  const qRef = useRef(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  // Smooth-scroll helper (targets have scroll-mt)
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const closeMenu = () => setMenuOpen(false);

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
        if (!cancelled)
          setErr(e?.response?.data?.message || "Failed to load inventory");
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
      data-theme="meditrack"
      className="min-h-screen flex flex-col bg-base-100 text-base-content"
    >
      {/* Background: mesh + noise */}
      <div aria-hidden="true" className="fixed inset-0 -z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_650px_at_80%_-10%,rgba(124,58,237,0.10),transparent_60%),radial-gradient(900px_500px_at_10%_10%,rgba(14,165,233,0.12),transparent_55%),linear-gradient(to_bottom,#ffffff,rgba(246,249,252,1))]" />
        <div className="absolute inset-0 mix-blend-soft-light opacity-[0.12] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 48 48%22><path d=%22M0 48L48 0M-12 36L36 -12M12 60L60 12%22 stroke=%22%23b0b7c3%22 stroke-width=%220.5%22 opacity=%220.4%22/></svg>')] bg-repeat" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22256%22 height=%22256%22 filter=%22url(%23n)%22/></svg>')]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-base-300/60 bg-base-100/75 backdrop-blur supports-[backdrop-filter]:bg-base-100/60">
        <nav
          className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between"
          role="navigation"
          aria-label="Primary"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="font-black text-xl tracking-tight text-primary hover:opacity-90 focus:outline-none focus-visible:ring ring-primary/40 rounded"
              onClick={closeMenu}
            >
              MediTrack
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5 ml-4 text-sm">
              <button
                className="link link-hover text-base-content/80"
                onClick={() => scrollToId("features")}
              >
                Features
              </button>
              <button
                className="link link-hover text-base-content/80"
                onClick={() => scrollToId("inventory")}
              >
                Inventory
              </button>
              <button
                className="link link-hover text-base-content/80"
                onClick={() => scrollToId("contact")}
              >
                Contact
              </button>
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/register?role=pharmacy" className="btn btn-ghost btn-sm">
              Register
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden btn btn-ghost btn-sm"
            aria-label="Toggle menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="md:hidden border-t border-base-300 bg-base-100"
            >
              <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-col gap-2">
                <button
                  className="btn btn-ghost justify-start"
                  onClick={() => {
                    scrollToId("features");
                    closeMenu();
                  }}
                >
                  Features
                </button>
                <button
                  className="btn btn-ghost justify-start"
                  onClick={() => {
                    scrollToId("inventory");
                    closeMenu();
                  }}
                >
                  Inventory
                </button>
                <button
                  className="btn btn-ghost justify-start"
                  onClick={() => {
                    scrollToId("contact");
                    closeMenu();
                  }}
                >
                  Contact
                </button>
                <div className="divider my-2" />
                <div className="flex gap-2">
                  <NavLink
                    to="/register?role=pharmacy"
                    className="btn btn-ghost flex-1"
                    onClick={closeMenu}
                  >
                    Register
                  </NavLink>
                  <NavLink
                    to="/login"
                    className="btn btn-primary flex-1"
                    onClick={closeMenu}
                  >
                    Login
                  </NavLink>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-5xl"
          >
            <div className="rounded-2xl border border-base-300/70 bg-base-100/85 backdrop-blur p-8 md:p-12 text-center shadow-[0_10px_30px_rgba(79,70,229,0.10),0_4px_18px_rgba(14,165,233,0.10)]">
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-base-300 bg-base-200/60">
                <SparkleIcon /> Modern SaaS experience for Pharmacies
              </span>

              <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
                Pharmacy Management,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Simplified
                </span>
              </h1>

              <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-base-content/70">
                Add medicines, track inventory, manage staff, and monitor sales
                — in one secure, modern dashboard.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register?role=pharmacy" className="btn btn-primary btn-lg">
                  <PlusIcon /> Create Your Pharmacy
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  <LoginIcon /> Login
                </Link>
              </div>

              {/* Trust chips – responsive, no overflow */}
              <div className="mt-8 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <TrustStat
                  icon={<ClockIcon />}
                  title="99.9%"
                  subtitle="Uptime"
                />
                <TrustStat
                  icon={<ShieldSmallIcon />}
                  title="Role-based"
                  subtitle="Access"
                />
                <TrustStat
                  icon={<SearchSmallIcon />}
                  title="Fast"
                  subtitle="Search"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-24 bg-base-200/60 border-y border-base-300"
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature icon={<MedicalIcon />} title="Healthcare-ready">
            GMP-compliant flow, expiry badges, and clear stock units.
          </Feature>
          <Feature icon={<BoxIcon />} title="Inventory Control">
            Live stock overview, search & sort by price, name, or expiry.
          </Feature>
          <Feature icon={<LockIcon />} title="Secure by Design">
            Optimized UI, role-based access, and responsive by default.
          </Feature>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="bg-base-100">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
          <div className="rounded-xl border border-base-300/70 bg-base-100/80 p-3 md:p-4 shadow-[0_6px_20px_rgba(20,40,80,0.05)]">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
              <div className="form-control w-full md:flex-1">
                <label
                  className="input input-bordered flex items-center gap-2"
                  htmlFor="search-meds"
                >
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
                  title={`Sort ${
                    sortDir === "asc" ? "ascending" : "descending"
                  }`}
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
        </div>
      </section>

      {/* INVENTORY GRID */}
      <main id="inventory" className="scroll-mt-24 flex-grow bg-base-100">
        <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Available Medicines
            </h2>
            <span className="hidden sm:inline text-xs text-base-content/60">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <GridSkeleton />
          ) : err ? (
            <div
              role="alert"
              className="alert alert-error justify-between flex-col sm:flex-row gap-3"
            >
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
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              >
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

              <nav
                className="flex justify-center mt-8 gap-2"
                role="navigation"
                aria-label="Pagination"
              >
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className="btn btn-outline btn-sm"
                >
                  « Prev
                </button>
                <span
                  aria-live="polite"
                  className="btn btn-disabled btn-sm"
                  title={`Page ${page} of ${totalPages}`}
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages}
                  className="btn btn-outline btn-sm"
                >
                  Next »
                </button>
              </nav>
            </>
          )}
        </section>
      </main>

      {/* CTA BANNER */}
      <section className="bg-gradient-to-r from-base-200/80 to-base-100/80 border-y border-base-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold">
            Ready to streamline your pharmacy?
          </h3>
          <p className="text-base-content/70 mt-2">
            Start free today. Add products, invite staff, and get selling in
            minutes.
          </p>
          <div className="mt-5">
            <Link to="/register?role=pharmacy" className="btn btn-primary btn-md">
              <RocketIcon /> Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contact"
        className="scroll-mt-24 border-t border-base-300 bg-base-100/90 backdrop-blur"
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="font-black text-xl text-primary">
              MediTrack
            </Link>
            <p className="mt-3 text-sm text-base-content/70">
              A modern pharmacy management platform for inventory, teams, and
              sales — built for reliability and speed.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  className="link link-hover"
                  onClick={() => scrollToId("features")}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  className="link link-hover"
                  onClick={() => scrollToId("inventory")}
                >
                  Inventory
                </button>
              </li>
              <li>
                <Link to="/login" className="link link-hover">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register?role=pharmacy" className="link link-hover">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="link link-hover">Docs (coming soon)</span>
              </li>
              <li>
                <span className="link link-hover">Status</span>
              </li>
              <li>
                <span className="link link-hover">Support</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="link link-hover">hello@meditrack.app</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPinIcon /> Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <ShieldIcon /> Role-based Access
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a aria-label="Twitter" className="btn btn-ghost btn-sm px-2">
                <TwitterIcon />
              </a>
              <a aria-label="LinkedIn" className="btn btn-ghost btn-sm px-2">
                <LinkedInIcon />
              </a>
              <a aria-label="GitHub" className="btn btn-ghost btn-sm px-2">
                <GitHubIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-base-300">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-base-content/70">
              © {new Date().getFullYear()} MediTrack. All rights reserved.
            </p>
            <div className="text-xs text-base-content/60 flex items-center gap-3">
              <a className="link link-hover">Privacy</a>
              <span>•</span>
              <a className="link link-hover">Terms</a>
              <span>•</span>
              <a className="link link-hover">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Reusable "trust chip" card ---------- */
function TrustStat({ icon, title, subtitle }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100/95 shadow-[0_8px_22px_rgba(14,165,233,0.06),0_4px_14px_rgba(79,70,229,0.06)] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-base-content/70">{icon}</span>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="font-semibold">{title}</div>
          {subtitle ? (
            <div className="text-xs text-base-content/60">{subtitle}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Subcomponents & Helpers
--------------------------- */
function Feature({ icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35 }}
      className="card rounded-xl bg-gradient-to-br from-base-100 via-base-100 to-base-200/50 border border-base-300 shadow-[0_10px_26px_rgba(79,70,229,0.06),0_6px_18px_rgba(14,165,233,0.06)]"
    >
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <div className="text-primary/80">{icon}</div>
          <h4 className="font-semibold">{title}</h4>
        </div>
        <p className="text-sm text-base-content/70 mt-2">{children}</p>
      </div>
    </motion.div>
  );
}

/* Icons */
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
function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="inline-block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="inline-block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4.5 8-10a8 8 0 0 0-16 0c0 5.5 8 10 8 10z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.2-.7.4-1.6.8-2.4 1-1.4-1.5-3.9-1-4.9.8-.6 1.1-.5 2.4.2 3.3-2.8-.1-5.3-1.5-7-3.7-1 1.8-.5 4 1.3 5.1-.6 0-1.2-.2-1.7-.5 0 1.9 1.4 3.6 3.3 4-.6.2-1.2.2-1.8.1.5 1.7 2.1 2.9 3.9 3-1.5 1.2-3.3 1.8-5.1 1.8H3c1.9 1.2 4.1 1.8 6.3 1.8 7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.4-1.3 1.9-2.1z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.1c.5-1 1.7-2.2 3.6-2.2 3.8 0 4.5 2.5 4.5 5.7V24h-4v-5.8c0-1.4 0-3.3-2-3.3-2 0-2.3 1.5-2.3 3.2V24h-4V8.5z" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9 7.6 10.5.6.1.8-.3.8-.6v-2c-3.1.7-3.7-1.3-3.7-1.3-.5-1.1-1.3-1.5-1.3-1.5-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 .1.7 1.9 2.8 1.3.1-.8.4-1.3.8-1.6-2.5-.3-5.1-1.3-5.1-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.9 11.9 0 0 1 6.2 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.3 3 .2 3.3.8.9 1.2 2 1.2 3.3 0 4.6-2.6 5.6-5.1 5.9.4.3.9 1 .9 2.1v3.1c0 .3.2.7.8.6 4.5-1.5 7.6-5.6 7.6-10.5C23.1 5.3 18.3.5 12 .5z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function LoginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C8 6 7 9 7 12c0 3 2 5 5 5s5-2 5-5c0-3-1-6-5-10z" />
      <path d="M5 19l2-2M19 19l-2-2" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
function MedicalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12l8.73-5.04" />
      <path d="M12 22V12" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.7 4.7L18 8.3l-4.3 1.6L12 14l-1.7-4.1L6 8.3l4.3-1.6L12 2z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function ShieldSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function SearchSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/* Skeletons & Empty state */
function GridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      aria-label="Loading products"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="card bg-base-100/95 border border-base-200 shadow-[0_8px_22px_rgba(14,165,233,0.06),0_4px_14px_rgba(79,70,229,0.06)]"
          aria-hidden="true"
        >
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

/* Currency */
function fmtBDT(n) {
  const num = Number(n) || 0;
  return `৳${num.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* Product card (homepage mini) */
function MiniMedicineCard({ row }) {
  const m = row?.medicine || {};
  const p = row?.pharmacy || {};

  const makeAbsolute = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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

  const expiryStr = row?.expiryDate
    ? new Date(row.expiryDate).toLocaleDateString()
    : "";
  const isExpired = row?.expiryDate
    ? new Date(row.expiryDate) < new Date()
    : false;

  const pharmacyName = p?.pharmacyName || "Pharmacy";
  const pharmacyLoc =
    p?.address?.district || p?.address?.division
      ? [p?.address?.district, p?.address?.division].filter(Boolean).join(", ")
      : "";

  return (
    <article
      className="group card bg-base-100/95 w-full max-w-[250px] border border-base-200 rounded-xl overflow-hidden shadow-[0_10px_26px_rgba(79,70,229,0.06),0_6px_18px_rgba(14,165,233,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(79,70,229,0.10),0_10px_26px_rgba(14,165,233,0.10)] focus-within:shadow-[0_14px_30px_rgba(79,70,229,0.10),0_10px_26px_rgba(14,165,233,0.10)]"
      title={name}
    >
      <figure className="relative overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* top-left: Unit/Type */}
        {unit && (
          <span className="badge badge-neutral absolute left-2 top-2">
            {unit}
          </span>
        )}

        {/* top-right: Expiry */}
        {row?.expiryDate && (
          <span
            className={`badge absolute right-2 top-2 ${
              isExpired ? "badge-error" : "badge-warning"
            }`}
            title={`Expiry: ${expiryStr}`}
          >
            {isExpired ? "Expired" : "Expiry"}: {expiryStr}
          </span>
        )}
      </figure>

      <div className="card-body p-3">
        <h3 className="card-title text-sm leading-tight truncate">{name}</h3>
        <div className="text-xs text-base-content/70 truncate">{generic}</div>

        {/* Pharmacy line */}
        <div
          className="mt-2 text-[11px] text-base-content/70 truncate"
          title={pharmacyName}
        >
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

        {/* Selling price */}
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
