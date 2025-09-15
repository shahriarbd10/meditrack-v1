// src/pages/pharmacy/components/InventoryTab.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateInput, NumInput, TextInput } from "./Inputs";

export default function InventoryTab({
  invLoading,
  invMsg,
  inventory,
  setInvSearch,
  invSearch,
  onDelete,
  onUpdate,
  openAddModal,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={invSearch}
          onChange={(e) => setInvSearch(e.target.value)}
          placeholder="Search by name / generic / category…"
          className="input input-bordered w-full md:w-96"
        />
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add from DB
        </button>
      </div>

      {invMsg && <div className="alert alert-info">{invMsg}</div>}

      {invLoading ? (
        <div className="py-10 text-center">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center text-base-content/70 py-12">
          No items in your inventory yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.map((row) => (
            <InvCard key={row._id} row={row} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </section>
  );
}

function InvCard({ row, onDelete, onUpdate }) {
  const m = row.medicineId || {};
  const img = m.imageUrl
    ? /^https?:\/\//i.test(m.imageUrl)
      ? m.imageUrl
      : `http://localhost:5000${m.imageUrl}`
    : "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp";

  const [edit, setEdit] = useState({
    stock: row.stock ?? 0,
    minStock: row.minStock ?? 10,
    sellingPrice: row.sellingPrice ?? 0,
    purchasePrice: row.purchasePrice ?? 0,
    vat: row.vat ?? 0,
    expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : "",
    batchNo: row.batchNo || "",
    notes: row.notes || "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await onUpdate(row._id, {
      ...edit,
      stock: Number(edit.stock || 0),
      minStock: Number(edit.minStock || 10),
      sellingPrice: Number(edit.sellingPrice || 0),
      purchasePrice: Number(edit.purchasePrice || 0),
      vat: Number(edit.vat || 0),
    });
    setBusy(false);
  };

  const badge = (() => {
    if (!edit.expiryDate) return null;
    const d = new Date(edit.expiryDate);
    const days = Math.floor((d - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="badge badge-error">Expired</span>;
    if (days <= 7) return <span className="badge badge-error">Expires in {days}d</span>;
    if (days <= 30) return <span className="badge badge-warning">Expires in {days}d</span>;
    return <span className="badge badge-success">OK</span>;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-white shadow-md rounded-xl overflow-hidden"
    >
      <figure className="relative h-28 bg-base-200">
        <img src={img} alt={m.name} className="h-28 w-full object-cover" />
        <div className="absolute left-2 top-2 flex gap-2">
          {badge}
          {m.category && <span className="badge badge-neutral">{m.category}</span>}
        </div>
      </figure>
      <div className="card-body p-4">
        <h3 className="font-semibold line-clamp-1" title={m.name}>
          {m.name || "Unnamed"}
        </h3>
        <div className="text-xs text-base-content/60 line-clamp-1">{m.genericName}</div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <NumInput label="Stock" value={edit.stock} onChange={(v) => setEdit((e) => ({ ...e, stock: v }))} />
          <NumInput label="Min Stock" value={edit.minStock} onChange={(v) => setEdit((e) => ({ ...e, minStock: v }))} />
          <NumInput label="Sell Price" value={edit.sellingPrice} onChange={(v) => setEdit((e) => ({ ...e, sellingPrice: v }))} />
          <NumInput label="Buy Price" value={edit.purchasePrice} onChange={(v) => setEdit((e) => ({ ...e, purchasePrice: v }))} />
          <NumInput label="VAT %" value={edit.vat} onChange={(v) => setEdit((e) => ({ ...e, vat: v }))} />
          <TextInput label="Batch No" value={edit.batchNo} onChange={(v) => setEdit((e) => ({ ...e, batchNo: v }))} />
          <DateInput label="Expiry" value={edit.expiryDate} onChange={(v) => setEdit((e) => ({ ...e, expiryDate: v }))} />
          <TextInput label="Notes" value={edit.notes} onChange={(v) => setEdit((e) => ({ ...e, notes: v }))} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button className="btn btn-error btn-sm" onClick={() => onDelete(row._id)}>
            Delete
          </button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-xs" /> : "Save"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
