// src/pages/pharmacy/components/StaffTab.jsx
import React from "react";

export default function StaffTab({
  staffLoading,
  staffMsg,
  staffList,
  staffForm,
  setStaffForm,
  onAdd,
  onDelete,
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Your Staff</h2>
        {staffMsg && <div className="alert alert-info mb-3">{staffMsg}</div>}
        {staffLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-dots loading-lg" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-base-content/70">No staff added yet.</div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto">
            {staffList.map((st) => (
              <li key={st._id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{st.name}</div>
                  <div className="text-xs text-base-content/60">{st.email}</div>
                </div>
                <button className="btn btn-error btn-xs" onClick={() => onDelete(st._id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card bg-white shadow-md rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Add New Staff</h2>
        <form onSubmit={onAdd} className="space-y-3 max-w-md">
          <input
            className="input input-bordered w-full"
            placeholder="Full name"
            value={staffForm.name}
            onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email"
            value={staffForm.email}
            onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
            value={staffForm.password}
            onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <button className="btn btn-primary w-full">Add Staff</button>
        </form>
      </div>
    </section>
  );
}
