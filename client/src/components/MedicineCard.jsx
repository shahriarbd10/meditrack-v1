// src/components/MedicineCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function MedicineCard({ medicine, onDelete }) {
  const imgSrc = useMemo(() => {
    if (!medicine?.imageUrl) return "";
    if (/^https?:\/\//i.test(medicine.imageUrl)) return medicine.imageUrl;
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${medicine.imageUrl}`;
  }, [medicine?.imageUrl]);

  const fmtMoney = (n) =>
    (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const status = medicine?.status === "inactive" ? "inactive" : "active";
  const vat = Number(medicine?.vat) || 0;

  const expiryDate = medicine?.expiryDate ? new Date(medicine.expiryDate) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const expiryStr = expiryDate ? expiryDate.toLocaleDateString() : "—";

  return (
    <article
      className="
        group card w-80 sm:w-72 md:w-80
        bg-base-100/95 border border-base-200 rounded-2xl overflow-hidden
        shadow-[0_12px_28px_rgba(79,70,229,0.06),0_8px_22px_rgba(14,165,233,0.06)]
        hover:shadow-[0_16px_36px_rgba(79,70,229,0.10),0_10px_28px_rgba(14,165,233,0.10)]
        transition-all duration-200
      "
    >
      <figure className="relative bg-base-200">
        <div className="w-full aspect-[16/10]">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={medicine?.name || "Medicine"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-base-content/50 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* overlay row: unit/status + expiry */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {medicine?.unit && <span className="badge badge-neutral shadow-sm">{medicine.unit}</span>}
            <span className={`badge ${status === "active" ? "badge-success" : "badge-ghost"} shadow-sm`}>
              {status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          {expiryDate && (
            <span className={`badge ${isExpired ? "badge-error" : "badge-warning"} shadow-sm pointer-events-auto`}>
              {isExpired ? "Expired" : "Expiry"}: {expiryStr}
            </span>
          )}
        </div>
      </figure>

      <div className="card-body p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title leading-tight text-base md:text-lg truncate">
            {medicine?.name || "—"}
          </h2>
          {medicine?.unit && <span className="badge badge-neutral">{medicine.unit}</span>}
        </div>

        {medicine?.genericName && (
          <div className="text-sm text-base-content/70 -mt-1 truncate">
            {medicine.genericName}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Fact label="Category" value={medicine?.category} />
          <Fact label="Supplier" value={medicine?.supplier} />
          <Fact label="Strength" value={medicine?.strength} />
          <Fact label="Box Size" value={medicine?.boxSize} />
          <Fact label="Shelf" value={medicine?.shelf} />
          <Fact label="Barcode" value={medicine?.barcode} />
        </div>

        <div className="mt-4 rounded-xl border border-base-200 p-3 shadow-[0_6px_18px_rgba(20,40,80,0.04)] bg-gradient-to-br from-base-100 via-base-100 to-base-200/40">
          <div className="flex items-center justify-between">
            <div className="text-sm text-base-content/70">Price</div>
            {vat > 0 && <span className="badge badge-outline">VAT {vat.toFixed(0)}%</span>}
          </div>
          <div className="mt-1 text-xl font-semibold">${fmtMoney(medicine?.price)}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-base-content/70">
            <span>Supplier Price</span>
            <span className="font-medium">${fmtMoney(medicine?.supplierPrice)}</span>
          </div>
        </div>

        <div className="card-actions mt-4 justify-between">
          <Link to={`/medicine-details/${medicine?._id}`} className="btn btn-sm btn-info">Details</Link>
          <div className="flex gap-2">
            <Link to={`/edit-medicine/${medicine?._id}`} className="btn btn-sm btn-primary">Edit</Link>
            <button onClick={() => onDelete?.(medicine?._id)} className="btn btn-sm btn-error">Delete</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }) {
  if (!value) {
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wide text-base-content/60">{label}</div>
        <div className="opacity-60">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-base-content/60">{label}</div>
      <div className="font-medium truncate" title={String(value)}>{value}</div>
    </div>
  );
}
