// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

/* =======================
   API Endpoints
======================= */
const API = {
  stats: `${import.meta.env.VITE_API_URL}/admin/stats`,
  medicines: `${import.meta.env.VITE_API_URL}/medicines`,

  // --- Approvals (admin) ---
  approvalsList: (status = "pending") =>
    `${import.meta.env.VITE_API_URL}/approvals?status=${encodeURIComponent(status)}`,
  approve: (approvalId) =>
    `${import.meta.env.VITE_API_URL}/approvals/${approvalId}/approve`,
  reject: (approvalId) =>
    `${import.meta.env.VITE_API_URL}/approvals/${approvalId}/reject`,
};

/* =======================
   Helpers
======================= */
const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const norm = (s = "") => String(s || "").toLowerCase();
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
const daysFromNow = (d) => {
  const now = new Date();
  const ms = d - now;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};
const formatBDT = (n = 0) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

/** Make a readable address from various possible shapes */
function toAddressString(addr = {}) {
  // Common shapes we’ve seen in your app
  const parts = [
    addr.line1,
    addr.line2,
    addr.street,
    addr.area,
    addr.upazila,
    addr.city,
    addr.district,
    addr.state,
    addr.division,
    addr.postcode || addr.zip,
    addr.country,
  ]
    .map((x) => (x || "").trim())
    .filter(Boolean);
  return parts.join(", ");
}

/* =======================
   Main
======================= */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ---- Data ---- */
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalStaff: 0,
    activeUsers: 0,
  });
  const [medicines, setMedicines] = useState([]);

  // Approvals
  const [pendingRegs, setPendingRegs] = useState([]);
  const [approvedRegs, setApprovedRegs] = useState([]);
  const [rejectedRegs, setRejectedRegs] = useState([]);

  /* ---- UI/State ---- */
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [errMeds, setErrMeds] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | name | stock | price
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // approvals UI
  const [approvalsTab, setApprovalsTab] = useState("pending"); // pending | approved | rejected
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalsMsg, setApprovalsMsg] = useState("");
  const [approvalsSearch, setApprovalsSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null); // for smooth row expansion

  /* ---- Effects ---- */
  useEffect(() => {
    // Load stats
    (async () => {
      try {
        const res = await axios.get(API.stats);
        const s = res?.data || {};
        setStats({
          totalPharmacies: safeNum(s.totalPharmacies),
          totalStaff: safeNum(s.totalStaff),
          activeUsers: safeNum(s.activeUsers),
        });
      } catch (_) {
        // keep defaults
      } finally {
        setLoadingStats(false);
      }
    })();

    // Load medicines
    (async () => {
      try {
        const res = await axios.get(API.medicines);
        const list = res?.data?.data ?? res?.data?.medicines ?? [];
        if (!Array.isArray(list)) throw new Error("Invalid medicines payload");
        setMedicines(list);
        setErrMeds("");
      } catch (e) {
        console.error(e);
        setErrMeds("Failed to load medicines.");
      } finally {
        setLoadingMeds(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Load approvals lists
    (async () => {
      try {
        setLoadingApprovals(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [p, a, r] = await Promise.all([
          axios.get(API.approvalsList("pending"), { headers }),
          axios.get(API.approvalsList("approved"), { headers }),
          axios.get(API.approvalsList("rejected"), { headers }),
        ]);

        // The /api/approvals returns flat fields (pharmacyName, licenseNo, phone, address, etc.)
        const take = (res) => (Array.isArray(res?.data?.data) ? res.data.data : res?.data || []);

        setPendingRegs(take(p));
        setApprovedRegs(take(a));
        setRejectedRegs(take(r));
        setApprovalsMsg("");
      } catch (e) {
        console.error("approvals load", e);
        setApprovalsMsg("Failed to load registrations.");
      } finally {
        setLoadingApprovals(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  /* ---- Derived (medicines) ---- */
  const totalActiveMeds = useMemo(
    () => medicines.filter((m) => (m.status || "active") === "active").length,
    [medicines]
  );

  const filteredMeds = useMemo(() => {
    let rows = [...medicines];

    // Status filter
    if (statusFilter !== "all") {
      rows = rows.filter(
        (m) => (m.status || "active").toLowerCase() === statusFilter
      );
    }

    // Search by name/company/category/brand/generic
    if (search.trim()) {
      const q = norm(search);
      rows = rows.filter((m) => {
        const name = norm(m.name);
        const company = norm(m.company || m.manufacturer);
        const category = norm(m.category);
        const generic = norm(m.generic || m.genericName);
        const brand = norm(m.brandName || m.brand);
        return (
          name.includes(q) ||
          company.includes(q) ||
          category.includes(q) ||
          generic.includes(q) ||
          brand.includes(q)
        );
      });
    }

    // Sort
    rows.sort((a, b) => {
      let av, bv;
      switch (sortBy) {
        case "name":
          av = norm(a.name);
          bv = norm(b.name);
          break;
        case "stock":
          av = safeNum(a.totalUnits ?? a.stock ?? a.availableQty);
          bv = safeNum(b.totalUnits ?? b.stock ?? b.availableQty);
          break;
        case "price":
          av = safeNum(a.price ?? a.unitPrice ?? a.sellingPrice);
          bv = safeNum(b.price ?? b.unitPrice ?? b.sellingPrice);
          break;
        default:
          av = new Date(a.createdAt || 0).getTime();
          bv = new Date(b.createdAt || 0).getTime();
      }
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [medicines, search, statusFilter, sortBy, sortDir]);

  const recentMeds = useMemo(() => filteredMeds.slice(0, 8), [filteredMeds]);

  const lowStockMeds = useMemo(() => {
    const take = (m) => safeNum(m.totalUnits ?? m.stock ?? m.availableQty);
    const thr = (m) => safeNum(m.minStock, 10);
    return [...medicines]
      .filter((m) => take(m) <= thr(m))
      .sort((a, b) => take(a) - take(b))
      .slice(0, 8);
  }, [medicines]);

  // Expiring soon (next 30 days)
  const EXPIRY_WINDOW_DAYS = 30;
  const expiringSoonList = useMemo(() => {
    return medicines
      .map((m) => {
        const d =
          parseDate(m.expiryDate) ||
          parseDate(m.expiry_date) ||
          parseDate(m.expiry) ||
          null;
        return { ...m, expiryD: d, daysLeft: d ? daysFromNow(d) : null };
      })
      .filter(
        (m) =>
          m.expiryD &&
          m.daysLeft !== null &&
          m.daysLeft >= 0 &&
          m.daysLeft <= EXPIRY_WINDOW_DAYS
      )
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8);
  }, [medicines]);
  const expiringSoonCount = expiringSoonList.length;

  /* ---- Approvals (tab & search) ---- */
  const approvalsRows =
    approvalsTab === "approved" ? approvedRegs : approvalsTab === "rejected" ? rejectedRegs : pendingRegs;

  const approvalsFiltered = useMemo(() => {
    if (!approvalsSearch.trim()) return approvalsRows;
    const q = norm(approvalsSearch);
    return approvalsRows.filter((row) => {
      const owner = row.owner || {};
      const addressStr = toAddressString(row.address || {});
      return (
        norm(row.pharmacyName || "").includes(q) ||
        norm(row.pharmacyType || "").includes(q) ||
        norm(row.licenseNo || "").includes(q) ||
        norm(row.phone || "").includes(q) ||
        norm(row.website || "").includes(q) ||
        norm(owner.name || "").includes(q) ||
        norm(owner.email || "").includes(q) ||
        norm(owner.phone || "").includes(q) ||
        norm(addressStr).includes(q)
      );
    });
  }, [approvalsRows, approvalsSearch]);

  /* ---- Actions ---- */
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    navigate("/login");
  };

  const refreshApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [p, a, r] = await Promise.all([
        axios.get(API.approvalsList("pending"), { headers }),
        axios.get(API.approvalsList("approved"), { headers }),
        axios.get(API.approvalsList("rejected"), { headers }),
      ]);
      const take = (res) => (Array.isArray(res?.data?.data) ? res.data.data : res?.data || []);
      setPendingRegs(take(p));
      setApprovedRegs(take(a));
      setRejectedRegs(take(r));
      setApprovalsMsg("");
    } catch (e) {
      console.error(e);
      setApprovalsMsg("Failed to refresh registrations.");
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(API.approve(approvalId), {}, { headers });
      await refreshApprovals();
    } catch (e) {
      console.error("approve", e);
      setApprovalsMsg(
        e?.response?.data?.message || e?.response?.data?.msg || "Failed to approve"
      );
    }
  };

  const handleReject = async (approvalId) => {
    try {
      const reason = window.prompt("Enter rejection reason (optional):", "");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        API.reject(approvalId),
        { reason: reason || "" },
        { headers }
      );
      await refreshApprovals();
    } catch (e) {
      console.error("reject", e);
      setApprovalsMsg(
        e?.response?.data?.message || e?.response?.data?.msg || "Failed to reject"
      );
    }
  };

  /* ---- Flags ---- */
  const isLoading = loadingStats || loadingMeds;

  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main */}
      <main className="flex-1 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-base-content/60 mt-1">
              Overview of your pharmacy operations at a glance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard/admin/medicines/add" className="btn btn-primary btn-sm">
              + Add Medicine
            </Link>
            <button onClick={handleLogout} className="btn btn-error btn-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Top Row: Stats + Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              title="Total Pharmacies"
              value={stats.totalPharmacies}
              loading={loadingStats}
              icon={<BuildingIcon />}
            />
            <StatCard
              title="Total Staff"
              value={stats.totalStaff}
              loading={loadingStats}
              icon={<UsersIcon />}
            />
            <StatCard
              title="Expiry Alerts (30d)"
              value={expiringSoonCount}
              loading={loadingMeds}
              icon={<CalendarTiny />}
            />
            <StatCard
              title="Active Medicines"
              value={totalActiveMeds}
              loading={loadingMeds}
              icon={<PillIcon />}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingRegs.length}
              loading={loadingApprovals}
              icon={<ClipboardCheckIcon />}
            />
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-4">
            <div className="card bg-white shadow-md rounded-xl p-4 h-full">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction to="/dashboard/admin/medicines/list" label="All Medicines" icon={<ListIcon />} />
                <QuickAction to="/dashboard/admin/customers/list" label="Customers" icon={<UserIcon />} />
                <QuickAction to="/dashboard/admin/purchases/add" label="New Purchase" icon={<CartInIcon />} />
                <QuickAction to="/dashboard/admin/invoices/add" label="New Invoice" icon={<CartOutIcon />} />
              </div>
              <div className="mt-4">
                <Link
                  to="/dashboard/admin/reports"
                  className="btn btn-outline btn-sm w-full"
                >
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ======= Approvals: Pharmacy Registrations ======= */}
        <section className="card bg-white shadow-md rounded-xl p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold">Pharmacy Registrations</h2>
              <div className="tabs tabs-boxed">
                {["pending", "approved", "rejected"].map((t) => (
                  <a
                    key={t}
                    role="tab"
                    className={`tab ${approvalsTab === t ? "tab-active" : ""}`}
                    onClick={() => setApprovalsTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </a>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={refreshApprovals}
                title="Refresh"
              >
                <RefreshIcon />
              </button>
            </div>

            {/* Search for registrations */}
            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={approvalsSearch}
                  onChange={(e) => setApprovalsSearch(e.target.value)}
                  placeholder="Search by name, email, license, address…"
                  className="input input-bordered w-full pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                  <SearchIcon />
                </span>
              </div>
            </div>
          </div>

          {approvalsMsg && <div className="alert alert-info my-3">{approvalsMsg}</div>}

          {loadingApprovals ? (
            <div className="py-10 text-center">
              <span className="loading loading-dots loading-lg" />
            </div>
          ) : approvalsFiltered.length === 0 ? (
            <div className="py-6 text-base-content/70 text-sm">
              No {approvalsTab} registrations.
            </div>
          ) : (
            <>
              {/* Mobile-friendly stacked cards */}
              <div className="md:hidden space-y-3 mt-3">
                {approvalsFiltered.map((row) => {
                  const owner = row.owner || {};
                  const submitted = row.createdAt
                    ? new Date(row.createdAt).toISOString().slice(0, 10)
                    : "—";
                  const addressStr = toAddressString(row.address || {});
                  return (
                    <div
                      key={row._id}
                      className="border rounded-xl p-3 bg-base-50/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-base break-words">
                            {row.pharmacyName || "—"}
                          </div>
                          <div className="text-[11px] text-base-content/60">
                            {row.pharmacyType || "—"}
                          </div>
                        </div>
                        <div>
                          {approvalsTab === "pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => handleApprove(row._id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-error btn-xs"
                                onClick={() => handleReject(row._id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : approvalsTab === "rejected" ? (
                            <span className="badge badge-error" title={row.rejectionReason || ""}>
                              Rejected
                            </span>
                          ) : (
                            <span className="badge badge-success">Approved</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                        <div className="flex gap-2">
                          <span className="shrink-0 text-base-content/60">Owner:</span>
                          <span className="break-words">
                            <span className="font-medium">{owner.name || "—"}</span>
                            {owner.email ? (
                              <>
                                {" • "}
                                <span className="break-all">{owner.email}</span>
                              </>
                            ) : null}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="shrink-0 text-base-content/60">License:</span>
                          <span className="break-all">{row.licenseNo || "—"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="shrink-0 text-base-content/60">Contact:</span>
                          <span className="break-all">
                            {row.phone || owner.phone || "—"}
                            {row.website ? (
                              <>
                                {" • "}
                                <a className="link break-all" href={row.website} target="_blank" rel="noreferrer">
                                  website
                                </a>
                              </>
                            ) : null}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="shrink-0 text-base-content/60">Address:</span>
                          <span className="break-words">{addressStr || "—"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="shrink-0 text-base-content/60">Submitted:</span>
                          <span>{submitted}</span>
                        </div>
                        {approvalsTab === "rejected" && row.rejectionReason ? (
                          <div className="flex gap-2">
                            <span className="shrink-0 text-base-content/60">Reason:</span>
                            <span className="break-words">{row.rejectionReason}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop/tablet table with hover expansion */}
              <div className="hidden md:block overflow-x-auto mt-3">
                <table className="table table-zebra table-pin-rows table-fixed min-w-[1000px]">
                  <thead>
                    <tr>
                      <th className="w-56">Pharmacy</th>
                      <th className="w-56">Owner</th>
                      <th className="w-36">License</th>
                      <th className="w-44">Contact</th>
                      <th className="w-[28rem]">Address</th>
                      <th className="w-28">Submitted</th>
                      <th className="w-40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsFiltered.map((row) => {
                      const owner = row.owner || {};
                      const submitted = row.createdAt
                        ? new Date(row.createdAt).toISOString().slice(0, 10)
                        : "—";
                      const addressStr = toAddressString(row.address || {});

                      return (
                        <React.Fragment key={row._id}>
                          <tr
                            className="group"
                            onMouseEnter={() => setHoveredRow(row._id)}
                            onMouseLeave={() => setHoveredRow((id) => (id === row._id ? null : id))}
                          >
                            <td className="align-top">
                              <div className="font-medium truncate" title={row.pharmacyName || "—"}>
                                {row.pharmacyName || "—"}
                              </div>
                              <div className="text-xs text-base-content/60 truncate" title={row.pharmacyType || "—"}>
                                {row.pharmacyType || "—"}
                              </div>
                            </td>
                            <td className="align-top">
                              <div className="font-medium truncate" title={owner.name || "—"}>
                                {owner.name || "—"}
                              </div>
                              <div className="text-xs text-base-content/60 break-all">
                                {owner.email || "—"}
                              </div>
                            </td>
                            <td className="align-top">
                              <span className="break-all">{row.licenseNo || "—"}</span>
                            </td>
                            <td className="align-top text-sm">
                              <div className="break-all">{row.phone || owner.phone || "—"}</div>
                              {row.website ? (
                                <div className="text-xs">
                                  <a className="link break-all" href={row.website} target="_blank" rel="noreferrer">
                                    website
                                  </a>
                                </div>
                              ) : null}
                            </td>
                            <td className="align-top text-xs">
                              <div className="whitespace-normal break-words">{addressStr || "—"}</div>
                            </td>
                            <td className="align-top text-xs">{submitted}</td>
                            <td className="align-top">
                              <div className="flex items-center justify-end gap-2">
                                {approvalsTab === "pending" ? (
                                  <>
                                    <button
                                      className="btn btn-success btn-xs"
                                      onClick={() => handleApprove(row._id)}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-error btn-xs"
                                      onClick={() => handleReject(row._id)}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : approvalsTab === "rejected" ? (
                                  <span className="badge badge-error" title={row.rejectionReason || ""}>
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="badge badge-success">Approved</span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Smooth expansion row */}
                          <tr>
                            <td colSpan={7} className="!p-0">
                              <div
                                className={`transition-all duration-200 ease-out overflow-hidden border-t ${
                                  hoveredRow === row._id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                                }`}
                              >
                                <div className="px-4 py-3 bg-base-100 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <div className="text-base-content/60">Owner</div>
                                    <div className="mt-1 break-words">
                                      {owner.name || "—"}
                                      {owner.email ? ` • ${owner.email}` : ""}
                                      {owner.phone ? ` • ${owner.phone}` : ""}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-base-content/60">Website</div>
                                    <div className="mt-1 break-all">
                                      {row.website ? (
                                        <a className="link" href={row.website} target="_blank" rel="noreferrer">
                                          {row.website}
                                        </a>
                                      ) : (
                                        "—"
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-base-content/60">Full Address</div>
                                    <div className="mt-1 break-words">{addressStr || "—"}</div>
                                  </div>
                                  {approvalsTab === "rejected" && row.rejectionReason ? (
                                    <div className="md:col-span-3">
                                      <div className="text-base-content/60">Rejection Reason</div>
                                      <div className="mt-1 break-words">{row.rejectionReason}</div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Controls (Medicines) */}
        <section className="card bg-white shadow-md rounded-xl p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicines by name, company, category, brand, or generic…"
                  className="input input-bordered w-full pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                  <SearchIcon />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="select select-bordered select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Sort: Newest</option>
                <option value="name">Sort: Name</option>
                <option value="stock">Sort: Stock</option>
                <option value="price">Sort: Price</option>
              </select>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title="Toggle sort direction"
              >
                {sortDir === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </button>
            </div>
          </div>
        </section>

        {/* Medicines: Recent + Alerts */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
          {/* Recent Medicines */}
          <div className="xl:col-span-8 card bg-white shadow-md rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg md:text-xl font-semibold">Recent Medicines</h2>
              <Link to="/dashboard/admin/medicines/list" className="btn btn-link btn-sm">
                View all
              </Link>
            </div>

            {isLoading ? (
              <SkeletonGrid count={8} />
            ) : errMeds ? (
              <InlineError text={errMeds} />
            ) : recentMeds.length === 0 ? (
              <EmptyState
                title="No medicines found"
                subtitle="Add your first medicine to get started."
                ctaText="+ Add Medicine"
                to="/dashboard/admin/medicines/add"
              />
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentMeds.map((m) => (
                  <MedicineTile key={m._id || m.id} med={m} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Low Stock + Expiring Soon */}
          <div className="xl:col-span-4 space-y-6">
            {/* Low Stock Alerts */}
            <div className="card bg-white shadow-md rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg md:text-xl font-semibold">Low Stock Alerts</h2>
                <Link to="/dashboard/admin/medicines/list" className="btn btn-link btn-sm">
                  Manage
                </Link>
              </div>

              {loadingMeds ? (
                <div className="py-6 flex items-center justify-center">
                  <span className="loading loading-dots loading-lg" />
                </div>
              ) : lowStockMeds.length === 0 ? (
                <div className="text-base-content/70 text-sm">All good! No low stock right now.</div>
              ) : (
                <ul className="divide-y">
                  {lowStockMeds.map((m) => {
                    const stock = safeNum(m.totalUnits ?? m.stock ?? m.availableQty);
                    const minS = safeNum(m.minStock, 10);
                    const percent = Math.max(
                      0,
                      Math.min(100, Math.round((stock / Math.max(1, minS)) * 100))
                    );
                    return (
                      <li key={m._id || m.id} className="py-3 flex items-start gap-3">
                        <div className="mt-1"><PillTiny /></div>
                        <div className="flex-1">
                          <div className="font-medium">{m.name || "Unnamed"}</div>
                          <div className="text-xs text-base-content/60">
                            {stock} in stock • Min {minS}
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-error transition-all"
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/edit-medicine/${m._id || m.id}`}
                          className="btn btn-ghost btn-xs"
                          title="Edit"
                        >
                          Edit
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Expiring Soon */}
            <div className="card bg-white shadow-md rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg md:text-xl font-semibold">Expiring Soon (30d)</h2>
                <Link to="/dashboard/admin/medicines/list" className="btn btn-link btn-sm">
                  Manage
                </Link>
              </div>

              {loadingMeds ? (
                <div className="py-6 flex items-center justify-center">
                  <span className="loading loading-dots loading-lg" />
                </div>
              ) : expiringSoonList.length === 0 ? (
                <div className="text-base-content/70 text-sm">No upcoming expiries in the next 30 days.</div>
              ) : (
                <ul className="divide-y">
                  {expiringSoonList.map((m) => (
                    <li key={m._id || m.id} className="py-3 flex items-start gap-3">
                      <div className="mt-1"><CalendarTiny /></div>
                      <div className="flex-1">
                        <div className="font-medium">{m.name || "Unnamed"}</div>
                        <div className="text-xs text-base-content/60">
                          {m.expiryD?.toISOString().slice(0, 10)} • {m.daysLeft} days left
                        </div>
                      </div>
                      <Link
                        to={`/edit-medicine/${m._id || m.id}`}
                        className="btn btn-ghost btn-xs"
                        title="Edit"
                      >
                        Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =======================
   Presentational Parts
======================= */
function StatCard({ title, value, loading, icon }) {
  return (
    <div className="card bg-white shadow-md rounded-xl p-4 md:p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-base-content/60">{title}</div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? <span className="loading loading-dots loading-md" /> : value}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-3 rounded-lg border hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <span className="text-base-content/70">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

/* ======= Enhanced Medicine Card ======= */
function MedicineTile({ med }) {
  const id = med._id || med.id;
  const stock = safeNum(med.totalUnits ?? med.stock ?? med.availableQty);
  const price = safeNum(med.price ?? med.unitPrice ?? med.sellingPrice);
  const status = (med.status || "active").toLowerCase();
  const form = med.form || med.dosageForm || med.type || "";
  const company = med.company || med.manufacturer || "";
  const generic = med.genericName || med.generic || "";
  const brand = med.brandName || med.brand || "";
  const category = med.category || "General";
  const expiryD =
    parseDate(med.expiryDate) ||
    parseDate(med.expiry_date) ||
    parseDate(med.expiry) ||
    null;
  const daysLeft = expiryD ? daysFromNow(expiryD) : null;

  const expiryTone =
    daysLeft == null
      ? "bg-base-200 text-base-content/60 border-base-200"
      : daysLeft <= 7
      ? "bg-error/10 text-error border-error/20"
      : daysLeft <= 30
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-success/10 text-success border-success/20";

  return (
    <div className="group border rounded-xl p-3 hover:shadow-lg transition-all hover:-translate-y-0.5 hover:border-primary/30 bg-gradient-to-b from-white to-base-100">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`text-[11px] px-2 py-0.5 rounded-full border ${
            status === "active"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          }`}
          title={`Status: ${status}`}
        >
          {status === "active" ? "Active" : "Inactive"}
        </div>

        <div className="flex items-center gap-2">
          {form && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              {form}
            </span>
          )}
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            {category}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="text-base md:text-lg font-semibold text-base-content line-clamp-1">
        {med.name || brand || "Unnamed Medicine"}
      </div>

      {/* brand / generic / company */}
      <div className="text-xs text-base-content/70 line-clamp-1">
        {brand && <span className="font-medium">{brand}</span>}
        {brand && generic ? " • " : ""}
        {generic && <span>{generic}</span>}
      </div>
      {company && (
        <div className="text-[11px] text-base-content/60 line-clamp-1">{company}</div>
      )}

      {/* Price / Stock / Expiry */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{formatBDT(price)}</div>
        <div className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Stock: {stock}
        </div>
      </div>

      <div className="mt-2 text-[11px] text-base-content/60">
        Expiry:{" "}
        <span className={`px-1.5 py-0.5 rounded border ${expiryTone}`}>
          {expiryD ? expiryD.toISOString().slice(0, 10) : "—"}
          {daysLeft != null ? ` • ${daysLeft}d` : ""}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <Link to={`/medicine-details/${id}`} className="btn btn-ghost btn-xs">
          Details
        </Link>
        <Link to={`/edit-medicine/${id}`} className="btn btn-primary btn-xs">
          Edit
        </Link>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-xl p-3 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="w-16 h-5 bg-base-200 rounded" />
            <div className="w-10 h-4 bg-base-200 rounded" />
          </div>
          <div className="h-5 bg-base-200 rounded mb-2" />
          <div className="h-4 bg-base-200 rounded w-2/3" />
          <div className="mt-3 flex items-center justify-between">
            <div className="w-20 h-4 bg-base-200 rounded" />
            <div className="w-16 h-4 bg-base-200 rounded" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="w-16 h-7 bg-base-200 rounded" />
            <div className="w-12 h-7 bg-base-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineError({ text = "Something went wrong." }) {
  return <div className="py-6 text-center text-error">{text}</div>;
}

function EmptyState({ title, subtitle, ctaText, to }) {
  return (
    <div className="py-10 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-base-content/60 mt-1">{subtitle}</div>
      {to && (
        <div className="mt-4">
          <Link to={to} className="btn btn-primary btn-sm">
            {ctaText}
          </Link>
        </div>
      )}
    </div>
  );
}

/* =======================
   Tiny Inline Icons (SVG)
======================= */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 21l-3.9-3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5l7 7H5l7-7z" fill="currentColor" />
    </svg>
  );
}
function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19l-7-7h14l-7 7z" fill="currentColor" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 22h16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v18z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 22v-6h6v6" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h1M8 12h1M15 8h1M15 12h1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M2 22c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M11 22c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function PillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CartInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6h15l-1.5 9H8L6 2H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CartOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6h15l-1.5 9H8L6 2H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PillTiny() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CalendarTiny() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function ClipboardCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 3h6a2 2 0 012 2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h1V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12a9 9 0 10-3.5 7.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
