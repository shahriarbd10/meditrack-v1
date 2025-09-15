// src/pages/admin/PharmacyApprovals.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

/* =======================
   API Endpoints
======================= */
const API = {
  approvalsList: (status = "pending") =>
    `http://localhost:5000/api/approvals?status=${encodeURIComponent(status)}`,
  approve: (id) => `http://localhost:5000/api/approvals/${id}/approve`,
  reject: (id) => `http://localhost:5000/api/approvals/${id}/reject`,
};

/* =======================
   Helpers
======================= */
const norm = (s = "") => String(s || "").toLowerCase();
const em = "—";
const fmtDate = (val) => (val ? new Date(val).toISOString().slice(0, 10) : em);
const addrToString = (address) =>
  address
    ? [address.street, address.upazila, address.district, address.division]
        .filter(Boolean)
        .join(", ")
    : "";

export default function PharmacyApprovals({ defaultTab = "pending" }) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /* ---- UI/State ---- */
  const [tab, setTab] = useState(defaultTab); // "pending" | "approved" | "rejected"
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  /* ---- Effects ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [p, a, r] = await Promise.all([
          axios.get(API.approvalsList("pending"), { headers }),
          axios.get(API.approvalsList("approved"), { headers }),
          axios.get(API.approvalsList("rejected"), { headers }),
        ]);
        if (cancelled) return;

        const toList = (res) => (Array.isArray(res?.data?.data) ? res.data.data : []);
        const P = toList(p);
        const A = toList(a);
        const R = toList(r);

        setCounts({ pending: P.length, approved: A.length, rejected: R.length });
        setRows(tab === "pending" ? P : tab === "approved" ? A : R);
        setMsg("");
      } catch (e) {
        console.error("approvals load", e);
        setMsg("Failed to load registrations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ---- Derived: filter by search ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = norm(search);
    return rows.filter((row) => {
      const owner = row.owner || {};
      const addr = addrToString(row.address || {});
      return (
        norm(row.pharmacyName || "").includes(q) ||
        norm(row.pharmacyType || "").includes(q) ||
        norm(row.licenseNo || "").includes(q) ||
        norm(row.phone || "").includes(q) ||
        norm(row.website || "").includes(q) ||
        norm(addr).includes(q) ||
        norm(owner.name || "").includes(q) ||
        norm(owner.email || "").includes(q)
      );
    });
  }, [rows, search]);

  /* ---- Actions ---- */
  const refreshActive = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(API.approvalsList(tab), { headers });
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);

      const [p, a, r] = await Promise.all([
        axios.get(API.approvalsList("pending"), { headers }),
        axios.get(API.approvalsList("approved"), { headers }),
        axios.get(API.approvalsList("rejected"), { headers }),
      ]);
      const toList = (res2) => (Array.isArray(res2?.data?.data) ? res2.data.data : []);
      setCounts({ pending: toList(p).length, approved: toList(a).length, rejected: toList(r).length });
      setMsg("");
    } catch (e) {
      console.error("refresh", e);
      setMsg("Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (id) => {
    const yes = window.confirm("Approve this pharmacy registration?");
    if (!yes) return;
    try {
      await axios.post(API.approve(id), {}, { headers });
      await refreshActive();
    } catch (e) {
      console.error("approve", e);
      setMsg("Failed to approve.");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason (optional):", "");
    if (reason === null) return;
    try {
      await axios.post(API.reject(id), { reason: reason || "" }, { headers });
      await refreshActive();
    } catch (e) {
      console.error("reject", e);
      setMsg("Failed to reject.");
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="min-h-screen flex bg-base-200">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 p-4 md:p-6">
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/60 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Pharmacy Registrations</h1>
              <p className="text-sm text-base-content/60">Review and manage new pharmacy account requests.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="tabs tabs-boxed">
                <button
                  className={`tab ${tab === "pending" ? "tab-active" : ""}`}
                  onClick={() => setTab("pending")}
                >
                  Pending <span className="ml-2 badge badge-sm">{counts.pending}</span>
                </button>
                <button
                  className={`tab ${tab === "approved" ? "tab-active" : ""}`}
                  onClick={() => setTab("approved")}
                >
                  Approved <span className="ml-2 badge badge-sm badge-success">{counts.approved}</span>
                </button>
                <button
                  className={`tab ${tab === "rejected" ? "tab-active" : ""}`}
                  onClick={() => setTab("rejected")}
                >
                  Rejected <span className="ml-2 badge badge-sm badge-error">{counts.rejected}</span>
                </button>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={refreshActive}
                disabled={refreshing}
                title="Refresh"
              >
                {refreshing ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-1" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 max-w-xl">
            <label className="input input-bordered flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-3.9-3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                type="text"
                className="grow"
                placeholder="Search by pharmacy, owner, license, contact, address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Content */}
        <section className="mt-4">
          {msg && <div className="alert alert-warning mb-3">{msg}</div>}

          {loading ? (
            <div className="py-10 text-center">
              <span className="loading loading-dots loading-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-base-content/70 text-sm">
              No {tab} registrations found{search ? " for your search." : "."}
            </div>
          ) : (
            <>
              {/* Mobile stacked cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((row) => (
                  <MobileRegCard
                    key={row._id}
                    row={row}
                    tab={tab}
                    onApprove={() => handleApprove(row._id)}
                    onReject={() => handleReject(row._id)}
                  />
                ))}
              </div>

              {/* Desktop table with borders & hover reveal */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-zebra table-pin-rows min-w-[1100px]">
                  <thead>
                    <tr>
                      <th className="w-56 border-b">Pharmacy</th>
                      <th className="w-56 border-b">Owner</th>
                      <th className="w-40 border-b">License</th>
                      <th className="w-48 border-b">Contact</th>
                      <th className="w-[28rem] border-b">Address</th>
                      <th className="w-28 border-b">Submitted</th>
                      <th className="w-44 text-right border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const owner = row.owner || {};
                      const addressStr = addrToString(row.address || {});
                      const submitted = fmtDate(row.createdAt);
                      const isExpanded = expandedRow === row._id;

                      return (
                        <React.Fragment key={row._id}>
                          <tr
                            className="cursor-pointer hover"
                            onMouseEnter={() => setExpandedRow(row._id)}
                            onMouseLeave={() => setExpandedRow(null)}
                          >
                            <td className="align-top border-t">
                              <div className="font-medium truncate" title={row.pharmacyName || em}>
                                {row.pharmacyName || em}
                              </div>
                              <div className="text-xs text-base-content/60 truncate">
                                {row.pharmacyType || em}
                              </div>
                            </td>
                            <td className="align-top border-t">
                              <div className="font-medium truncate" title={owner.name || em}>
                                {owner.name || em}
                              </div>
                              <div className="text-xs text-base-content/60 break-all">
                                {owner.email || em}
                              </div>
                            </td>
                            <td className="align-top border-t break-all">{row.licenseNo || em}</td>
                            <td className="align-top border-t text-sm">
                              <div className="break-all">{row.phone || owner.phone || em}</div>
                              {row.website ? (
                                <div className="text-xs">
                                  <a className="link break-all" href={row.website} target="_blank" rel="noreferrer">
                                    website
                                  </a>
                                </div>
                              ) : null}
                            </td>
                            <td className="align-top border-t text-xs whitespace-normal break-words">
                              {addressStr || em}
                            </td>
                            <td className="align-top border-t text-xs">{submitted}</td>
                            <td className="align-top border-t">
                              <div className="flex items-center justify-end gap-2">
                                {tab === "pending" ? (
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
                                ) : tab === "approved" ? (
                                  <span className="badge badge-success">Approved</span>
                                ) : (
                                  <span
                                    className="badge badge-error"
                                    title={row.rejectionReason || ""}
                                  >
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Hover expansion row */}
                          <tr>
                            <td colSpan={7} className="!p-0">
                              <div
                                className={`transition-[max-height,opacity] duration-300 ease-out overflow-hidden bg-base-100/70 border-t ${
                                  isExpanded ? "opacity-100 max-h-40" : "opacity-0 max-h-0"
                                }`}
                              >
                                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                  <InfoBlock
                                    label="Pharmacy"
                                    value={
                                      <>
                                        <div className="font-medium">{row.pharmacyName || em}</div>
                                        <div className="text-xs text-base-content/60">{row.pharmacyType || em}</div>
                                      </>
                                    }
                                  />
                                  <InfoBlock label="License" value={<div className="break-all">{row.licenseNo || em}</div>} />
                                  <InfoBlock
                                    label="Contact"
                                    value={
                                      <>
                                        <div className="break-all">{row.phone || owner.phone || em}</div>
                                        {row.website ? (
                                          <a className="link break-all" href={row.website} target="_blank" rel="noreferrer">
                                            {row.website}
                                          </a>
                                        ) : null}
                                      </>
                                    }
                                  />
                                  <InfoBlock
                                    label="Address"
                                    value={<div className="break-words">{addressStr || em}</div>}
                                  />
                                  {tab === "rejected" && row.rejectionReason ? (
                                    <div className="md:col-span-4">
                                      <div className="text-xs uppercase tracking-wide text-base-content/50">
                                        Rejection Reason
                                      </div>
                                      <div className="mt-1 text-sm whitespace-pre-wrap">
                                        {row.rejectionReason}
                                      </div>
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
      </main>
    </div>
  );
}

/* =======================
   Subcomponents
======================= */
function InfoBlock({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-base-content/50">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function MobileRegCard({ row, tab, onApprove, onReject }) {
  const owner = row.owner || {};
  const addressStr = addrToString(row.address || {});
  const submitted = fmtDate(row.createdAt);

  return (
    <div className="border rounded-xl p-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-base break-words">
            {row.pharmacyName || em}
          </div>
          <div className="text-[11px] text-base-content/60">{row.pharmacyType || em}</div>
        </div>
        <div>
          {tab === "pending" ? (
            <div className="flex items-center gap-2">
              <button className="btn btn-success btn-xs" onClick={onApprove}>
                Approve
              </button>
              <button className="btn btn-error btn-xs" onClick={onReject}>
                Reject
              </button>
            </div>
          ) : tab === "rejected" ? (
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
            <span className="font-medium">{owner.name || em}</span>
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
          <span className="break-all">{row.licenseNo || em}</span>
        </div>
        <div className="flex gap-2">
          <span className="shrink-0 text-base-content/60">Contact:</span>
          <span className="break-all">
            {row.phone || owner.phone || em}
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
          <span className="break-words">{addressStr || em}</span>
        </div>
        <div className="flex gap-2">
          <span className="shrink-0 text-base-content/60">Submitted:</span>
          <span>{submitted}</span>
        </div>

        {tab === "rejected" && row.rejectionReason ? (
          <div className="flex gap-2">
            <span className="shrink-0 text-base-content/60">Reason:</span>
            <span className="break-words">{row.rejectionReason}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
