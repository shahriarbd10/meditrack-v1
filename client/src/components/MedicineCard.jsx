// src/components/MedicineCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function MedicineCard({ medicine, onDelete }) {
  // build image src (supports /uploads path or absolute urls)
  const imgSrc = useMemo(() => {
    if (!medicine?.imageUrl) return "";
    if (/^https?:\/\//i.test(medicine.imageUrl)) return medicine.imageUrl;
    // served by server/app.js -> app.use("/uploads", express.static("uploads"))
    return `http://localhost:5000${medicine.imageUrl}`;
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
    <div className="card bg-base-100 w-80 shadow-md hover:shadow-lg transition-shadow border border-base-200">
      {/* Image */}
      <figure className="relative h-40 w-full overflow-hidden bg-base-200">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={medicine?.name || "Medicine"}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-40 w-full flex items-center justify-center text-base-content/50 text-sm">
            No Image
          </div>
        )}

        {/* status chip */}
        <div className="absolute left-3 top-3">
          <span
            className={`badge ${
              status === "active" ? "badge-success" : "badge-ghost"
            }`}
          >
            {status === "active" ? "Active" : "Inactive"}
          </span>
        </div>

        {/* expiry chip */}
        {expiryDate && (
          <div className="absolute right-3 top-3">
            <span
              className={`badge ${
                isExpired ? "badge-error" : "badge-warning"
              }`}
              title={`Expiry: ${expiryStr}`}
            >
              {isExpired ? "Expired" : "Expiry"}: {expiryStr}
            </span>
          </div>
        )}
      </figure>

      {/* Body */}
      <div className="card-body p-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title leading-tight">
            {medicine?.name || "—"}
          </h2>
          {medicine?.unit && (
            <span className="badge badge-neutral">{medicine.unit}</span>
          )}
        </div>
        {medicine?.genericName && (
          <div className="text-sm text-base-content/70 -mt-1">
            Generic: <span className="font-medium">{medicine.genericName}</span>
          </div>
        )}

        {/* Facts grid */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Fact label="Category" value={medicine?.category} />
          <Fact label="Supplier" value={medicine?.supplier} />
          <Fact label="Strength" value={medicine?.strength} />
          <Fact label="Box Size" value={medicine?.boxSize} />
          <Fact label="Shelf" value={medicine?.shelf} />
          <Fact label="Barcode" value={medicine?.barcode} />
        </div>

        {/* Price block */}
        <div className="mt-4 rounded-lg border border-base-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-base-content/70">Price</div>
            {vat > 0 && (
              <span className="badge badge-outline" title="VAT percentage">
                VAT {vat.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="mt-1 text-xl font-semibold">
            ${fmtMoney(medicine?.price)}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-base-content/70">
            <span>Supplier Price</span>
            <span className="font-medium">${fmtMoney(medicine?.supplierPrice)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions mt-4 justify-between">
          <Link
            to={`/medicine-details/${medicine?._id}`}
            className="btn btn-sm btn-info"
            title="View details"
          >
            Details
          </Link>
          <div className="flex gap-2">
            <Link
              to={`/edit-medicine/${medicine?._id}`}
              className="btn btn-sm btn-primary"
              title="Edit medicine"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete?.(medicine?._id)}
              className="btn btn-sm btn-error"
              title="Delete medicine"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helper to keep rows tidy */
function Fact({ label, value }) {
  if (!value) return <div className="opacity-60">{label}: —</div>;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-base-content/60">
        {label}
      </div>
      <div className="font-medium truncate" title={String(value)}>
        {value}
      </div>
    </div>
  );
}
