// src/pages/pharmacy/components/ApprovalGate.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* =======================
   API Endpoints
======================= */
const STATUS_API = (ownerId) =>
  `http://localhost:5000/api/approvals/status/${ownerId}`;
const PHARMACY_BY_OWNER_API = (ownerId) =>
  `http://localhost:5000/api/pharmacies/by-owner/${ownerId}`; // latest doc
const PHARMACY_RESUBMIT_API = `http://localhost:5000/api/pharmacies/resubmit`; // create-as-new (preferred)
const PHARMACY_CREATE_API = `http://localhost:5000/api/pharmacies`; // generic create (fallback)
const PHARMACY_UPDATE_API = (id) =>
  `http://localhost:5000/api/pharmacies/${id}`; // legacy edit (final fallback)

/* =======================
   Helpers
======================= */
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};
const getAuthHeaders = (u) => {
  const token =
    u?.token ||
    u?.accessToken ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const safe = (v) => (v == null ? "" : v);
const ownerIdFromUser = (u) => u?.id || u?._id || u?.userId || u?.ownerUserId;

/* =======================
   Component
======================= */
export default function ApprovalGate({ children }) {
  const [state, setState] = useState({
    loading: true,
    status: null, // "approved" | "pending" | "rejected" | "no-user" | "not-found"
    reason: "",
    error: null,
    checkedAt: null,
  });

  // Floating editor (rejected)
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showReason, setShowReason] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  const reasonLines = useMemo(() => {
    if (!state.reason) return [];
    return String(state.reason)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [state.reason]);

  const loadStatus = async () => {
    const u = readUser();
    if (!u) {
      setState({
        loading: false,
        status: "no-user",
        reason: "",
        error: null,
        checkedAt: new Date().toISOString(),
      });
      return;
    }
    if (u.role && u.role !== "pharmacy") {
      setState({
        loading: false,
        status: "approved",
        reason: "",
        error: null,
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const ownerId = ownerIdFromUser(u);
      const res = await axios.get(STATUS_API(ownerId), {
        headers: { ...getAuthHeaders(u) },
      });
      setState({
        loading: false,
        status: res?.data?.approvalStatus || "pending",
        reason: res?.data?.rejectionReason || "",
        error: null,
        checkedAt: new Date().toISOString(),
      });
    } catch (e) {
      const sc = e?.response?.status;
      if (sc === 401) {
        setState({
          loading: false,
          status: "no-user",
          reason: "",
          error:
            "Your session has expired or you are not authorized. Please sign in again.",
          checkedAt: new Date().toISOString(),
        });
        return;
      }
      if (sc === 404) {
        setState({
          loading: false,
          status: "not-found",
          reason: "",
          error:
            "No pharmacy application found for this account. Please submit your registration.",
          checkedAt: new Date().toISOString(),
        });
        return;
      }
      console.error("ApprovalGate status fetch error:", e);
      setState({
        loading: false,
        status: "pending",
        reason: "",
        error:
          e?.response?.data?.msg ||
          e?.message ||
          "Could not verify approval status. Please retry.",
        checkedAt: new Date().toISOString(),
      });
    }
  };

  // Prefill from latest
  const fetchDraft = async () => {
    setDraftLoading(true);
    setDraftError(null);
    const u = readUser();
    const ownerId = ownerIdFromUser(u);

    try {
      const { data } = await axios.get(PHARMACY_BY_OWNER_API(ownerId), {
        headers: { ...getAuthHeaders(u) },
      });

      const doc = data?.data ?? data;
      setDraft({
        prevId: doc?._id || null, // keep previous doc id for fallback update
        pharmacyName: safe(doc?.pharmacyName),
        pharmacyType: safe(doc?.pharmacyType),
        licenseNo: safe(doc?.licenseNo),
        binVat: safe(doc?.binVat),
        staffCount: doc?.staffCount ?? 0,
        openingHours: safe(doc?.openingHours),
        website: safe(doc?.website),
        phone: safe(doc?.phone),
        address: {
          line1: safe(doc?.address?.line1),
          line2: safe(doc?.address?.line2),
          city: safe(doc?.address?.city),
          state: safe(doc?.address?.state),
          postcode: safe(doc?.address?.postcode),
          country: safe(doc?.address?.country),
        },
      });
    } catch (e) {
      const sc = e?.response?.status;
      if (sc === 404) {
        setDraft({
          prevId: null,
          pharmacyName: "",
          pharmacyType: "Retail",
          licenseNo: "",
          binVat: "",
          staffCount: 0,
          openingHours: "",
          website: "",
          phone: "",
          address: {},
        });
        setDraftError(null);
      } else {
        console.error("Prefill fetch failed:", e);
        setDraftError(
          e?.response?.data?.message ||
            e?.response?.data?.msg ||
            e?.message ||
            "Could not load your existing details. You can still edit and submit."
        );
        setDraft({
          prevId: null,
          pharmacyName: "",
          pharmacyType: "Retail",
          licenseNo: "",
          binVat: "",
          staffCount: 0,
          openingHours: "",
          website: "",
          phone: "",
          address: {},
        });
      }
    } finally {
      setDraftLoading(false);
    }
  };

  const openEditor = async () => {
    setEditorOpen(true);
    setSaveMsg("");
    await fetchDraft();
  };

  const changeDraft = (path, value) => {
    setDraft((d) => {
      const next = { ...(d || {}) };
      const segs = path.split(".");
      let cur = next;
      for (let i = 0; i < segs.length - 1; i++) {
        cur[segs[i]] = cur[segs[i]] ?? {};
        cur = cur[segs[i]];
      }
      cur[segs[segs.length - 1]] = value;
      return next;
    });
  };

  // Submit as NEW, with robust fallbacks if create endpoints are missing
  const submitResubmit = async (ev) => {
    ev?.preventDefault?.();
    setSaving(true);
    setSaveMsg("");

    const u = readUser();
    const ownerUserId = ownerIdFromUser(u);

    const createBody = {
      ownerUserId,
      pharmacyName: draft.pharmacyName,
      pharmacyType: draft.pharmacyType,
      licenseNo: draft.licenseNo,
      binVat: draft.binVat,
      staffCount: Number(draft.staffCount || 0),
      openingHours: draft.openingHours,
      website: draft.website,
      phone: draft.phone,
      address: {
        line1: draft.address?.line1 || "",
        line2: draft.address?.line2 || "",
        city: draft.address?.city || "",
        state: draft.address?.state || "",
        postcode: draft.address?.postcode || "",
        country: draft.address?.country || "",
      },
      resubmissionOf: draft?.prevId || null,
      approvalStatus: "pending",
      isActive: false,
    };

    try {
      // Try preferred create-as-new route
      try {
        await axios.post(PHARMACY_RESUBMIT_API, createBody, {
          headers: { ...getAuthHeaders(u) },
        });
      } catch (err1) {
        // If 404/Not Found, try generic create
        if (err1?.response?.status === 404) {
          try {
            await axios.post(PHARMACY_CREATE_API, createBody, {
              headers: { ...getAuthHeaders(u) },
            });
          } catch (err2) {
            // Final fallback: update old doc (legacy flow)
            if (draft?.prevId) {
              await axios.put(
                PHARMACY_UPDATE_API(draft.prevId),
                { ...createBody, resubmit: true },
                { headers: { ...getAuthHeaders(u) } }
              );
            } else {
              throw err2; // nothing else to do
            }
          }
        } else {
          throw err1;
        }
      }

      setSaveMsg("Submitted for review. Your status is now pending.");
      setState((s) => ({ ...s, status: "pending", reason: "" }));
      setTimeout(() => setEditorOpen(false), 700);
    } catch (e) {
      console.error("Resubmission failed:", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.msg ||
        e?.response?.data?.error ||
        e?.message ||
        "Could not submit changes. Please check your inputs and try again.";
      setSaveMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- UI States ---------- */

  if (state.loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-dots loading-lg" />
          <div className="mt-2 text-sm text-base-content/60">Checking approval…</div>
        </div>
      </div>
    );
  }

  if (state.status === "no-user") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-white shadow-md rounded-2xl p-6 w-full max-w-md text-center">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="text-sm text-base-content/70 mt-2">
            {state.error || "Please log in to continue."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <a className="btn btn-primary btn-sm" href="/login">Go to Login</a>
            <button className="btn btn-ghost btn-sm" onClick={loadStatus}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
          <h2 className="text-xl font-bold">No Application Found</h2>
        <p className="text-sm text-base-content/70 mt-2">
            {state.error || "We couldn't find a pharmacy application for this account."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <a className="btn btn-primary btn-sm" href="/register/pharmacy">Submit Registration</a>
            <button className="btn btn-ghost btn-sm" onClick={loadStatus}>Refresh</button>
          </div>
          <div className="mt-3 text-[11px] text-base-content/50">
            Last checked: {new Date(state.checkedAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "approved") {
    return children;
  }

  if (state.status === "pending") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
          <h2 className="text-xl font-bold">Registration Submitted</h2>
          <p className="text-sm text-base-content/70 mt-2">
            Your pharmacy account is <span className="font-semibold">pending admin approval</span>.
            You’ll be able to access the dashboard once it’s approved.
          </p>

          {state.error ? (
            <div className="alert alert-warning mt-4 text-left">
              <span>{state.error}</span>
              <button className="btn btn-ghost btn-xs ml-auto" onClick={loadStatus}>Retry</button>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => (window.location.href = "/")}>
              Go Home
            </button>
            <button className="btn btn-ghost btn-sm" onClick={loadStatus}>Refresh Status</button>
          </div>

          <div className="mt-3 text-[11px] text-base-content/50">
            Last checked: {new Date(state.checkedAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  // ----- REJECTED with floating editor -----
  if (state.status === "rejected") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 relative">
        <div className="card bg-white shadow-lg rounded-2xl p-6 w-full max-w-lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-error">Registration Rejected</h2>
            <p className="text-sm text-base-content/70 mt-2">
              Your application was reviewed and <span className="font-semibold text-error">rejected</span>.
              Please review the cause below, correct it, and resubmit.
            </p>
          </div>

          <div className="mt-5">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReason((v) => !v)}>
              {showReason ? "Hide" : "Show"} Rejection Details
            </button>

            {showReason && (
              <div className="mt-3 border rounded-xl p-4 bg-base-100">
                <h3 className="font-semibold text-sm">Cause of Rejection</h3>
                {reasonLines.length > 1 ? (
                  <ul className="list-disc list-inside text-sm text-base-content/70 mt-2 space-y-1">
                    {reasonLines.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-base-content/70 mt-2 whitespace-pre-wrap">
                    {state.reason || "No specific reason provided."}
                  </p>
                )}
                <div className="mt-3 text-[11px] text-base-content/50">
                  Last checked: {new Date(state.checkedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button className="btn btn-ghost btn-sm" onClick={openEditor}>
              Edit & Resubmit
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => (window.location.href = "/")}
            >
              Go Home
            </button>
          </div>

          <div className="mt-3">
            <button className="btn btn-link btn-xs" onClick={loadStatus}>
              Refresh Status
            </button>
          </div>
        </div>

        {/* Floating Editor */}
        {editorOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => !saving && setEditorOpen(false)}
            />
            <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Submission</h3>
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={fetchDraft}
                    disabled={draftLoading || saving}
                  >
                    {draftLoading ? (
                      <>
                        <span className="loading loading-spinner loading-xs mr-1" />
                        Reload
                      </>
                    ) : (
                      "Reload"
                    )}
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => !saving && setEditorOpen(false)}
                    disabled={saving}
                  >
                    Close
                  </button>
                </div>
              </div>

              {draftError ? (
                <div className="alert alert-warning mt-3">
                  <span>{draftError}</span>
                </div>
              ) : null}

              {draftLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-base-content/70">
                  <span className="loading loading-dots loading-md" />
                  Loading your details…
                </div>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={submitResubmit}>
                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label"><span className="label-text">Pharmacy Name</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.pharmacyName || ""}
                        onChange={(e) => changeDraft("pharmacyName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Pharmacy Type</span></label>
                      <select
                        className="select select-bordered w-full"
                        value={draft?.pharmacyType || "Retail"}
                        onChange={(e) => changeDraft("pharmacyType", e.target.value)}
                      >
                        <option>Retail</option>
                        <option>Hospital</option>
                        <option>Wholesale</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label"><span className="label-text">License No</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.licenseNo || ""}
                        onChange={(e) => changeDraft("licenseNo", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">BIN/VAT</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.binVat || ""}
                        onChange={(e) => changeDraft("binVat", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Staff Count</span></label>
                      <input
                        type="number"
                        min="0"
                        className="input input-bordered w-full"
                        value={draft?.staffCount ?? 0}
                        onChange={(e) => changeDraft("staffCount", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Opening Hours</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.openingHours || ""}
                        onChange={(e) => changeDraft("openingHours", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Website</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.website || ""}
                        onChange={(e) => changeDraft("website", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Phone</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.phone || ""}
                        onChange={(e) => changeDraft("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label"><span className="label-text">Address Line 1</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.line1 || ""}
                        onChange={(e) => changeDraft("address.line1", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Address Line 2</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.line2 || ""}
                        onChange={(e) => changeDraft("address.line2", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">City</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.city || ""}
                        onChange={(e) => changeDraft("address.city", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">State</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.state || ""}
                        onChange={(e) => changeDraft("address.state", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Postcode</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.postcode || ""}
                        onChange={(e) => changeDraft("address.postcode", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label"><span className="label-text">Country</span></label>
                      <input
                        className="input input-bordered w-full"
                        value={draft?.address?.country || ""}
                        onChange={(e) => changeDraft("address.country", e.target.value)}
                      />
                    </div>
                  </div>

                  {saveMsg ? (
                    <div className="mt-2 text-sm">
                      <span className={saveMsg.includes("Submitted") ? "text-success" : "text-error"}>
                        {saveMsg}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditorOpen(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-xs mr-1" />
                          Submitting…
                        </>
                      ) : (
                        "Submit New Application"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
