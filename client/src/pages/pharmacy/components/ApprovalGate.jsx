// src/pages/pharmacy/components/ApprovalGate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const STATUS_API = (ownerId) =>
  `http://localhost:5000/api/approvals/status/${ownerId}`;

export default function ApprovalGate({ children }) {
  const [state, setState] = useState({ loading: true, status: null, reason: "" });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) return setState({ loading: false, status: "no-user", reason: "" });

    // Non-pharmacy roles should pass through.
    if (u.role && u.role !== "pharmacy") {
      return setState({ loading: false, status: "approved", reason: "" });
    }

    // Pharmacy -> check status from backend
    (async () => {
      try {
        const res = await axios.get(STATUS_API(u.id || u._id));
        const status = res?.data?.approvalStatus || "pending";
        const reason = res?.data?.rejectionReason || "";
        setState({ loading: false, status, reason });
      } catch (e) {
        // If we can't read status, fail closed (pending) instead of letting them in.
        console.error("ApprovalGate status fetch error:", e);
        setState({ loading: false, status: "pending", reason: "" });
      }
    })();
  }, []);

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

  if (state.status === "approved") {
    return children;
  }

  // Pending / Rejected screens
  if (state.status === "pending") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-white shadow-lg rounded-2xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold">Registration Submitted</h2>
          <p className="text-sm text-base-content/70 mt-2">
            Your pharmacy account is <span className="font-semibold">pending admin approval</span>.
            You’ll be able to access the dashboard once it’s approved.
          </p>
          <div className="mt-4">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => (window.location.href = "/")}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "rejected") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-white shadow-lg rounded-2xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-error">Registration Rejected</h2>
          {state.reason ? (
            <p className="text-sm text-base-content/70 mt-2">Reason: {state.reason}</p>
          ) : null}
          <div className="mt-4 flex justify-center gap-2">
            <a className="btn btn-ghost btn-sm" href="/register/pharmacy">Resubmit</a>
            <button className="btn btn-primary btn-sm" onClick={() => (window.location.href = "/")}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user (or unknown) -> block
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-sm text-base-content/70">
        Please log in to continue.
      </div>
    </div>
  );
}
