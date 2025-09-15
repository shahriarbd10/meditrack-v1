// src/pages/pharmacy/components/OverviewTab.jsx
import React from "react";

export default function OverviewTab({
  totalStaff,
  totalItems,
  lowStockCount,
  expiringSoonCount,
  invLoading,
  staffLoading,
  openAddModal,
}) {
  const Card = ({ title, value, hint }) => (
    <div className="card bg-white shadow-md rounded-xl p-4">
      <div className="text-xs uppercase text-base-content/60">{title}</div>
      <div className="mt-1 text-3xl font-bold">
        {invLoading || staffLoading ? (
          <span className="loading loading-dots loading-md" />
        ) : (
          value
        )}
      </div>
      {hint && <div className="text-xs text-base-content/60 mt-1">{hint}</div>}
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Staff" value={totalStaff} />
        <Card title="Inventory Items" value={totalItems} />
        <Card title="Low Stock" value={lowStockCount} hint="Below Min Stock" />
        <Card title="Expiring (30d)" value={expiringSoonCount} />
      </div>

      <div className="card bg-white shadow-md rounded-xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-base-content/60">
              Add items from the main medicine database.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add from DB
          </button>
        </div>
      </div>
    </section>
  );
}
