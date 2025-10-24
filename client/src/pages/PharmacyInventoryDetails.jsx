// src/pages/PharmacyInventoryDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}/pharmacy-inventory`;

export default function PharmacyInventoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/${id}`);
        setRow(res?.data?.data ?? null);
      } catch (err) {
        console.error(err);
        setError("Failed to load pharmacy inventory details");
      }
    })();
  }, [id]);

  const medicine = row?.medicine || {};
  const pharmacy = row?.pharmacy || {};

  const imgSrc = useMemo(() => {
    const v = medicine?.imageUrl;
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `http://localhost:5000${v}`;
  }, [medicine?.imageUrl]);

  const fmtBDT = (v) =>
    `৳${(Number(v) || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

  if (error) return <div className="text-center text-error mt-6">{error}</div>;
  if (!row) return <div className="text-center mt-6">Loading…</div>;

  const {
    status = "active",
    vat = 0,
    sellingPrice = 0,
    purchasePrice = 0,
    stock = 0,
    minStock = 0,
    batchNo = "",
    expiryDate,
    notes = "",
  } = row;

  const name = medicine?.name || "—";
  const genericName = medicine?.genericName || "";
  const priceWithVat = Number(sellingPrice || 0) * (1 + Number(vat || 0) / 100);
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl overflow-hidden border border-base-300">
        {/* Header + Actions */}
        <div className="px-6 md:px-8 py-6 border-b border-base-300 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              {name}
            </h1>
            {genericName && (
              <div className="text-sm text-base-content/60 mt-1">
                Generic: <span className="font-medium">{genericName}</span>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`badge ${status === "inactive" ? "badge-outline" : "badge-success"}`}>
                {status === "inactive" ? "Inactive" : "Active"}
              </span>
              {medicine?.type && <span className="badge badge-neutral">{medicine.type}</span>}
              {medicine?.unit && <span className="badge badge-outline">{medicine.unit}</span>}
              {expiryDate && (
                <span className={`badge ${isExpired ? "badge-error" : "badge-warning"}`}>
                  {isExpired ? "Expired" : "Expiry"}: {fmtDate(expiryDate)}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm md:btn-md">
              Back
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image + Price card */}
          <div className="space-y-6">
            <div className="rounded-lg overflow-hidden border border-base-300 bg-base-100 shadow-sm">
              {imgSrc ? (
                <img src={imgSrc} alt={name} className="w-full h-64 object-cover" />
              ) : (
                <div className="h-64 flex items-center justify-center text-base-content/50">
                  No Image
                </div>
              )}
            </div>

            {/* Price card (BDT) */}
            <div className="rounded-lg border border-base-300 p-4 bg-base-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70">Price</div>
                {Number(vat) > 0 && (
                  <span className="badge badge-outline">VAT {Number(vat).toFixed(2)}%</span>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold">{fmtBDT(sellingPrice)}</div>

              <div className="mt-2 text-xs text-base-content/70 flex items-center justify-between">
                <span>With VAT</span>
                <span className="font-semibold">{fmtBDT(priceWithVat)}</span>
              </div>

              <div className="mt-2 text-xs text-base-content/70 flex items-center justify-between">
                <span>Purchase Price</span>
                <span className="font-semibold">{fmtBDT(purchasePrice)}</span>
              </div>
            </div>

            {/* Stock / Batch */}
            <div className="rounded-lg border border-base-300 p-4 bg-base-100 shadow-sm">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Stock" value={stock} />
                <Field label="Min Stock" value={minStock} />
                <Field label="Batch No." value={batchNo || "—"} />
                <Field label="Expiry" value={fmtDate(expiryDate)} />
              </div>
              {notes && (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wide text-base-content/60">Notes</div>
                  <div className="mt-1">{notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Details grid (medicine + pharmacy) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category" value={medicine?.category} />
              <Field label="Supplier" value={medicine?.supplier} />
              <Field label="Strength" value={medicine?.strength} />
              <Field label="Box Size" value={medicine?.boxSize} />
              <Field label="Shelf" value={medicine?.shelf} />
              <Field label="Barcode" value={medicine?.barcode} />
              <Field label="Unit" value={medicine?.unit} />
              <Field label="Type" value={medicine?.type} />
            </div>

            {/* Pharmacy Card */}
            <div className="mt-6 rounded-lg border border-base-300 p-4 bg-base-100 shadow-sm">
              <div className="text-sm uppercase tracking-wide text-base-content/60">Pharmacy</div>
              <div className="mt-1 text-lg font-semibold">{pharmacy?.pharmacyName || "—"}</div>
              <div className="text-sm text-base-content/70">
                {[
                  pharmacy?.address?.street,
                  pharmacy?.address?.upazila,
                  pharmacy?.address?.district,
                  pharmacy?.address?.division,
                  pharmacy?.address?.postcode,
                ].filter(Boolean).join(", ") || "—"}
              </div>
              {pharmacy?.phone && (
                <div className="mt-1 text-sm text-base-content/70">Phone: {pharmacy.phone}</div>
              )}
            </div>

            {medicine?.details && (
              <div className="mt-6">
                <div className="text-sm uppercase tracking-wide text-base-content/60">
                  Details
                </div>
                <div className="mt-1 bg-base-100 rounded-lg border border-base-300 p-4 leading-relaxed shadow-sm">
                  {medicine.details}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-6 border-t border-base-300 flex gap-2 justify-end">
          <Link to={`/pharmacy-inventory/${id}`} className="btn btn-info btn-sm md:btn-md">
            Refresh
          </Link>
          <Link to="/" className="btn btn-ghost btn-sm md:btn-md">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-base-content/60">{label}</div>
      <div className="mt-1 font-medium break-words">{value ?? "—"}</div>
    </div>
  );
}
