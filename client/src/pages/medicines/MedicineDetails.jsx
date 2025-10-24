import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}/medicines`;

export default function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/${id}`);
        setMedicine(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        console.error(err);
        setError("Failed to load medicine details");
      }
    })();
  }, [id]);

  const imgSrc = useMemo(() => {
    if (!medicine) return "";
    if (medicine.imageUrl) {
      if (/^https?:\/\//i.test(medicine.imageUrl)) return medicine.imageUrl;
      return `http://localhost:5000${medicine.imageUrl}`;
    }
    if (medicine.picture) return medicine.picture;
    return "";
  }, [medicine]);

  const fmtMoney = (v) =>
    (Number(v) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

  if (error) return <div className="text-center text-error mt-6">{error}</div>;
  if (!medicine) return <div className="text-center mt-6">Loading…</div>;

  const {
    name,
    genericName,
    brandName,
    details,
    price,
    supplierPrice,
    vat = 0,
    status = "active",
    expiryDate,
    category,
    supplier,
    unit,
    type,
    strength,
    boxSize,
    shelf,
    barcode,
  } = medicine;

  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
  const priceWithVat = Number(price || 0) * (1 + Number(vat || 0) / 100);

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl overflow-hidden border border-base-300">
        {/* Header + Actions */}
        <div className="px-6 md:px-8 py-6 border-b border-base-300 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              {name || "—"}
            </h1>
            {genericName && (
              <div className="text-sm text-base-content/60 mt-1">
                Generic: <span className="font-medium">{genericName}</span>
              </div>
            )}
            {brandName && (
              <div className="text-sm text-base-content/60">
                Brand: <span className="font-medium">{brandName}</span>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`badge ${
                  status === "inactive" ? "badge-outline" : "badge-success"
                }`}
              >
                {status === "inactive" ? "Inactive" : "Active"}
              </span>
              {type && <span className="badge badge-neutral">{type}</span>}
              {unit && <span className="badge badge-outline">{unit}</span>}
              {expiryDate && (
                <span
                  className={`badge ${
                    isExpired ? "badge-error" : "badge-warning"
                  }`}
                >
                  {isExpired ? "Expired" : "Expiry"}: {fmtDate(expiryDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/edit-medicine/${medicine._id}`}
              className="btn btn-primary btn-sm md:btn-md"
            >
              Edit
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm md:btn-md"
            >
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
                <img
                  src={imgSrc}
                  alt={name || "Medicine"}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-base-content/50">
                  No Image
                </div>
              )}
            </div>

            <div className="rounded-lg border border-base-300 p-4 bg-base-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70">Price</div>
                {Number(vat) > 0 && (
                  <span className="badge badge-outline">
                    VAT {Number(vat).toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold">${fmtMoney(price)}</div>
              <div className="mt-2 text-xs text-base-content/70 flex items-center justify-between">
                <span>With VAT</span>
                <span className="font-semibold">
                  ${fmtMoney(priceWithVat)}
                </span>
              </div>
              <div className="mt-2 text-xs text-base-content/70 flex items-center justify-between">
                <span>Supplier Price</span>
                <span className="font-semibold">
                  ${fmtMoney(supplierPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category" value={category} />
              <Field label="Supplier" value={supplier} />
              <Field label="Strength" value={strength} />
              <Field label="Box Size" value={boxSize} />
              <Field label="Shelf" value={shelf} />
              <Field label="Barcode" value={barcode} />
              <Field label="Unit" value={unit} />
              <Field label="Type" value={type} />
              <Field label="Expiry Date" value={fmtDate(expiryDate)} />
            </div>

            {details && (
              <div className="mt-6">
                <div className="text-sm uppercase tracking-wide text-base-content/60">
                  Details
                </div>
                <div className="mt-1 bg-base-100 rounded-lg border border-base-300 p-4 leading-relaxed shadow-sm">
                  {details}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-6 border-t border-base-300 flex gap-2 justify-end">
          <Link
            to={`/medicine-details/${medicine._id}`}
            className="btn btn-info btn-sm md:btn-md"
          >
            Refresh
          </Link>
          <Link
            to="/dashboard/admin/medicines/list"
            className="btn btn-ghost btn-sm md:btn-md"
          >
            Medicine List
          </Link>
          <Link to="/dashboard/admin" className="btn btn-outline btn-sm md:btn-md">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-base-content/60">
        {label}
      </div>
      <div className="mt-1 font-medium break-words">{value || "—"}</div>
    </div>
  );
}
