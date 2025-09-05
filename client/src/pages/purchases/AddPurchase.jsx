import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API = {
  suppliers: "http://localhost:5000/api/suppliers",
  leaf: "http://localhost:5000/api/leaf-settings",
  medicines: "http://localhost:5000/api/medicines",
  purchases: "http://localhost:5000/api/purchases/add", // backend accepts / and /add
};

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const today = () => new Date().toISOString().slice(0, 10);

function parseUnitsPerBox(pattern = "") {
  // "3 x 10", "2*15", "1" => 30, 30, 1
  const nums = String(pattern)
    .toLowerCase()
    .split(/[^0-9]+/g)
    .filter(Boolean)
    .map(Number);
  if (!nums.length) return 1;
  return nums.reduce((a, b) => a * (isNaN(b) ? 1 : b), 1);
}

export default function AddPurchase() {
  const navigate = useNavigate();

  /* ---------- dropdown data ---------- */
  const [suppliers, setSuppliers] = useState([]);
  const [leafs, setLeafs] = useState([]);
  const [meds, setMeds] = useState([]);

  /* ---------- header ---------- */
  const [head, setHead] = useState({
    supplierId: "",
    supplierName: "",
    invoiceNo: "",
    date: today(),
    paymentType: "Cash Payment",
    details: "",
    vatPercent: 0, // %
    discountPercent: 0, // %
    paidAmount: 0,
  });

  /* ---------- rows ---------- */
  const mkRow = useMemo(
    () => ({
      medicineId: "",
      medicineName: "",
      batchId: "",
      expiryDate: "",
      stockQty: 0,
      boxPattern: "",
      unitsPerBox: 1,
      boxQty: 0,
      quantity: 0,
      supplierPrice: 0,
      boxMRP: 0,
    }),
    []
  );
  const [rows, setRows] = useState([mkRow]);

  useEffect(() => {
    (async () => {
      try {
        const [s, l, m] = await Promise.all([
          axios.get(API.suppliers),
          axios.get(API.leaf),
          axios.get(API.medicines),
        ]);
        setSuppliers(s.data?.data || []);
        setLeafs(l.data?.data || []);
        setMeds(m.data?.data || m.data?.medicines || []); // both shapes supported
      } catch (e) {
        console.error(e);
        alert("Failed to load dropdowns.");
      }
    })();
  }, []);

  /* ---------- totals ---------- */
  const totals = useMemo(() => {
    const sub = rows.reduce((sum, r) => {
      const upb = r.unitsPerBox || parseUnitsPerBox(r.boxPattern);
      const totalUnits = toNum(r.boxQty) * upb + toNum(r.quantity);
      return sum + totalUnits * toNum(r.supplierPrice);
    }, 0);
    const vatAmt = (sub * toNum(head.vatPercent)) / 100;
    const discAmt = (sub * toNum(head.discountPercent)) / 100;
    const grand = sub + vatAmt - discAmt;
    const due = Math.max(0, grand - toNum(head.paidAmount));
    return { sub, vatAmt, discAmt, grand, due };
  }, [rows, head]);

  /* ---------- helpers ---------- */
  const setRow = (i, patch) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const onMedicineSelect = (i, id) => {
    const m = meds.find((x) => x._id === id);
    setRow(i, {
      medicineId: id,
      medicineName: m?.name || "",
      stockQty: m?.stock ?? 0,
      supplierPrice: m?.supplierPrice ?? 0,
    });
  };

  const addRow = () => setRows((p) => [...p, mkRow]);
  const removeRow = (i) => setRows((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...head,
        items: rows.map((r) => ({
          ...r,
          unitsPerBox: r.unitsPerBox || parseUnitsPerBox(r.boxPattern),
        })),
      };
      await axios.post(API.purchases, payload);
      alert("✅ Purchase saved");
      navigate("/dashboard/admin/purchases/list");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to save purchase.");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-xl border border-base-300">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-base-300">
            <h1 className="text-xl md:text-2xl font-bold">Add Purchase</h1>
            <Link to="/dashboard/admin/purchases/list" className="btn btn-success btn-sm">
              Purchase List
            </Link>
          </div>

          <form onSubmit={submit} className="px-5 md:px-8 py-6 space-y-6">
            {/* Top grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Supplier */}
              <div className="form-control">
                <label className="label font-semibold">Supplier *</label>
                <select
                  className="select select-bordered w-full"
                  value={head.supplierId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const s = suppliers.find((x) => x._id === id);
                    setHead((p) => ({ ...p, supplierId: id, supplierName: s?.manufacturerName || "" }));
                  }}
                  required
                >
                  <option value="">Select Manufacturer</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.manufacturerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label font-semibold">Invoice No</label>
                <input
                  className="input input-bordered w-full"
                  value={head.invoiceNo}
                  onChange={(e) => setHead((p) => ({ ...p, invoiceNo: e.target.value }))}
                  placeholder="Invoice No"
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold">Date *</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={head.date}
                  onChange={(e) => setHead((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold">Payment Type *</label>
                <select
                  className="select select-bordered w-full"
                  value={head.paymentType}
                  onChange={(e) => setHead((p) => ({ ...p, paymentType: e.target.value }))}
                >
                  <option>Cash Payment</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Mobile Payment</option>
                </select>
              </div>

              <div className="form-control lg:col-span-2">
                <label className="label font-semibold">Details</label>
                <input
                  className="input input-bordered w-full"
                  value={head.details}
                  onChange={(e) => setHead((p) => ({ ...p, details: e.target.value }))}
                  placeholder="Details"
                />
              </div>
            </section>

            {/* Items table */}
            <section className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra w-[1200px] lg:w-full">
                <thead className="bg-base-200 text-[13px]">
                  <tr>
                    <th className="whitespace-nowrap">Medicine *</th>
                    <th className="whitespace-nowrap">Batch Id</th>
                    <th className="whitespace-nowrap">Expiry Date *</th>
                    <th className="whitespace-nowrap text-right">Stock Qty</th>
                    <th className="whitespace-nowrap">Box Pattern *</th>
                    <th className="whitespace-nowrap text-right">Box Qty *</th>
                    <th className="whitespace-nowrap text-right">Quantity *</th>
                    <th className="whitespace-nowrap text-right">Supplier Price *</th>
                    <th className="whitespace-nowrap text-right">Box MRP *</th>
                    <th className="whitespace-nowrap text-right">Total</th>
                    <th className="whitespace-nowrap">Action</th>
                  </tr>
                </thead>

                <tbody className="text-[13px]">
                  {rows.map((r, i) => {
                    const unitsPerBox = r.unitsPerBox || parseUnitsPerBox(r.boxPattern);
                    const totalUnits = toNum(r.boxQty) * unitsPerBox + toNum(r.quantity);
                    const lineTotal = totalUnits * toNum(r.supplierPrice);

                    return (
                      <tr key={i}>
                        {/* Medicine */}
                        <td className="min-w-[230px]">
                          <select
                            className="select select-bordered w-full"
                            value={r.medicineId}
                            onChange={(e) => onMedicineSelect(i, e.target.value)}
                            required
                          >
                            <option value="">Medicine Name</option>
                            {meds.map((m) => (
                              <option key={m._id} value={m._id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Batch */}
                        <td className="min-w-[120px]">
                          <input
                            className="input input-bordered w-full"
                            value={r.batchId}
                            onChange={(e) => setRow(i, { batchId: e.target.value })}
                            placeholder="Batch Id"
                          />
                        </td>

                        {/* Expiry */}
                        <td className="min-w-[140px]">
                          <input
                            type="date"
                            className="input input-bordered w-full"
                            value={r.expiryDate}
                            onChange={(e) => setRow(i, { expiryDate: e.target.value })}
                            required
                          />
                        </td>

                        {/* Stock */}
                        <td className="text-right min-w-[100px]">
                          <input className="input input-bordered w-full text-right" value={r.stockQty} readOnly />
                        </td>

                        {/* Box pattern */}
                        <td className="min-w-[170px]">
                          <select
                            className="select select-bordered w-full"
                            value={r.boxPattern}
                            onChange={(e) =>
                              setRow(i, {
                                boxPattern: e.target.value,
                                unitsPerBox: parseUnitsPerBox(e.target.value),
                              })
                            }
                            required
                          >
                            <option value="">Select Leaf Type</option>
                            {leafs.map((l) => (
                              <option key={l._id} value={l.leafType}>
                                {l.leafType}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Box qty */}
                        <td className="text-right min-w-[100px]">
                          <input
                            type="number"
                            className="input input-bordered w-full text-right"
                            value={r.boxQty}
                            onChange={(e) => setRow(i, { boxQty: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Quantity */}
                        <td className="text-right min-w-[100px]">
                          <input
                            type="number"
                            className="input input-bordered w-full text-right"
                            value={r.quantity}
                            onChange={(e) => setRow(i, { quantity: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Supplier Price */}
                        <td className="text-right min-w-[130px]">
                          <input
                            type="number"
                            step="0.01"
                            className="input input-bordered w-full text-right"
                            value={r.supplierPrice}
                            onChange={(e) => setRow(i, { supplierPrice: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Box MRP */}
                        <td className="text-right min-w-[130px]">
                          <input
                            type="number"
                            step="0.01"
                            className="input input-bordered w-full text-right"
                            value={r.boxMRP}
                            onChange={(e) => setRow(i, { boxMRP: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Total */}
                        <td className="text-right font-semibold min-w-[120px]">{lineTotal.toFixed(2)}</td>

                        {/* Action */}
                        <td className="min-w-[80px]">
                          <button
                            type="button"
                            className="btn btn-error btn-xs"
                            onClick={() => removeRow(i)}
                            disabled={rows.length === 1}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <div className="flex justify-between items-center">
              <button type="button" className="btn btn-outline btn-sm" onClick={addRow}>
                + Add Row
              </button>
            </div>

            {/* Summary Panel */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2" />
              <div className="bg-base-100 rounded-lg border border-base-300 p-4 space-y-3">
                <SummaryRow label="Sub Total:" value={totals.sub} />

                <SummaryRow
                  label="Vat:"
                  value={totals.vatAmt}
                  right={
                    <PercentBox
                      value={head.vatPercent}
                      onChange={(v) => setHead((p) => ({ ...p, vatPercent: toNum(v) }))}
                    />
                  }
                />

                <SummaryRow
                  label="Discount:"
                  value={totals.discAmt}
                  right={
                    <PercentBox
                      value={head.discountPercent}
                      onChange={(v) => setHead((p) => ({ ...p, discountPercent: toNum(v) }))}
                    />
                  }
                />

                <SummaryRow label="Grand Total:" value={totals.grand} bold />

                <SummaryRow
                  label="Paid Amount:"
                  value={head.paidAmount}
                  editable
                  onChange={(v) => setHead((p) => ({ ...p, paidAmount: toNum(v) }))}
                />

                <SummaryRow label="Due Amount:" value={totals.due} bold />
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                className="btn"
                onClick={() => setHead((p) => ({ ...p, paidAmount: totals.grand }))}
              >
                Full Paid
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function PercentBox({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        className="input input-bordered w-28 text-right"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="opacity-70">%</span>
    </div>
  );
}

function SummaryRow({ label, value, bold, editable, onChange, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-3">
        {right}
        {editable ? (
          <input
            type="number"
            step="0.01"
            className="input input-bordered w-36 text-right"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <div className={`w-36 text-right ${bold ? "font-bold" : ""}`}>
            {Number(value).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
