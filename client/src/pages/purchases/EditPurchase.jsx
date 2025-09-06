// src/pages/purchases/EditPurchase.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const API = {
  suppliers: "http://localhost:5000/api/suppliers",
  leaf: "http://localhost:5000/api/leaf-settings",
  medicines: "http://localhost:5000/api/medicines",
  purchasesBase: "http://localhost:5000/api/purchases",
};

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const today = () => new Date().toISOString().slice(0, 10);
const arr = (v) => (Array.isArray(v) ? v : v?.data && Array.isArray(v.data) ? v.data : []);
const fmt = (n) => Number(n || 0).toFixed(2);
const pickAvail = (m) => toNum(m?.totalUnits ?? m?.stock ?? m?.quantity ?? m?.availableQty ?? 0);

// latest rule (same as AddInvoice/AddPurchase new)
const effUnits = (qty, boxQty) => {
  const q = toNum(qty) || 1;
  const b = toNum(boxQty) || 1;
  return q * b;
};

function parseUnitsPerBox(pattern = "") {
  const nums = String(pattern)
    .toLowerCase()
    .split(/[^0-9]+/g)
    .filter(Boolean)
    .map(Number);
  if (!nums.length) return 1;
  return nums.reduce((a, b) => a * (isNaN(b) ? 1 : b), 1);
}

export default function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();

  // dropdowns
  const [suppliers, setSuppliers] = useState([]);
  const [leafs, setLeafs] = useState([]);
  const [meds, setMeds] = useState([]);

  // header
  const [head, setHead] = useState({
    supplierId: "",
    supplierName: "",
    invoiceNo: "",
    date: today(),
    paymentType: "Cash Payment",
    details: "",
    vatPercent: 0,
    discountPercent: 0,
    paidAmount: 0,
  });

  // rows
  const mkRow = () => ({
    medicineId: "",
    medicineName: "",
    batchId: "",
    expiryDate: "",
    availQty: 0, // display hint from Medicine.totalUnits
    boxPattern: "",
    unitsPerBox: 1,
    boxQty: 0,
    quantity: 0,
    supplierPrice: 0,
    boxMRP: 0,
  });
  const [rows, setRows] = useState([mkRow()]);
  const lastLeafRef = useRef("");

  /* ---------- load dropdowns ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [s, l, m] = await Promise.all([
          axios.get(API.suppliers),
          axios.get(API.leaf),
          axios.get(API.medicines),
        ]);
        setSuppliers(arr(s.data));
        setLeafs(arr(l.data));
        const medList = arr(m.data) || arr(m.data?.medicines);
        setMeds(medList);
      } catch (err) {
        console.error("Dropdown load error:", err);
        alert("Failed to load dropdowns.");
      }
    })();
  }, []);

  /* ---------- load purchase ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API.purchasesBase}/${id}`);
        const p = res.data?.data || res.data?.purchase || res.data;

        setHead((prev) => ({
          ...prev,
          supplierId: p?.supplierId || "",
          supplierName: p?.supplierName || "",
          invoiceNo: p?.invoiceNo || "",
          date: p?.date ? new Date(p.date).toISOString().slice(0, 10) : today(),
          paymentType: p?.paymentType || "Cash Payment",
          details: p?.details || "",
          vatPercent: toNum(p?.vatPercent),
          discountPercent: toNum(p?.discountPercent),
          paidAmount: toNum(p?.paidAmount),
        }));

        const items = p?.items || [];
        setRows(
          items.length
            ? items.map((r) => {
                // try to fetch current stock & default supplierPrice from medicine list by ID/name
                const match =
                  meds.find((m) => String(m._id) === String(r.medicineId)) ||
                  meds.find((m) => (m.name || "").toLowerCase().trim() === (r.medicineName || "").toLowerCase().trim());
                return {
                  medicineId: r.medicineId || match?._id || "",
                  medicineName: r.medicineName || match?.name || "",
                  batchId: r.batchId || "",
                  expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : "",
                  availQty: pickAvail(match),
                  boxPattern: r.boxPattern || "",
                  unitsPerBox: r.unitsPerBox || parseUnitsPerBox(r.boxPattern),
                  boxQty: toNum(r.boxQty),
                  quantity: toNum(r.quantity),
                  supplierPrice: toNum(r.supplierPrice ?? match?.supplierPrice ?? 0),
                  boxMRP: toNum(r.boxMRP),
                };
              })
            : [mkRow()]
        );
      } catch (err) {
        console.error("Load purchase error:", err);
        alert("Failed to load purchase.");
        navigate("/dashboard/admin/purchases/list");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meds.length]); // re-evaluate once medicines are loaded

  /* ---------- helpers ---------- */
  const setRow = (i, patch) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const applyMedToRow = (i, m) => {
    setRow(i, {
      medicineId: m._id,
      medicineName: m.name || rows[i].medicineName,
      availQty: pickAvail(m),
      supplierPrice: toNum(m.supplierPrice ?? m.purchasePrice ?? rows[i].supplierPrice),
    });
  };

  const onMedicineTyped = (i, name) => {
    const s = String(name || "").toLowerCase().trim();
    const m =
      meds.find((x) => (x.name || "").toLowerCase().trim() === s) ||
      meds.find((x) => (x.barcode || "").toLowerCase().trim() === s);
    if (m) applyMedToRow(i, m);
  };

  const addRow = () =>
    setRows((p) => [
      ...p,
      {
        ...mkRow(),
        boxPattern: lastLeafRef.current || "",
        unitsPerBox: parseUnitsPerBox(lastLeafRef.current || ""),
      },
    ]);
  const removeRow = (i) => setRows((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  /* ---------- suggester like AddPurchase ---------- */
  const [openSuggest, setOpenSuggest] = useState({ open: false, rowIndex: -1 });
  const suggestFilter = (q) => {
    const s = String(q || "").toLowerCase().trim();
    if (!s) return meds.slice(0, 10);
    return meds
      .filter(
        (m) =>
          (m.name || "").toLowerCase().includes(s) ||
          (m.genericName || "").toLowerCase().includes(s)
      )
      .slice(0, 12);
  };

  /* ---------- totals: multiplicative rule ---------- */
  const totals = useMemo(() => {
    const sub = rows.reduce((sum, r) => {
      const baseUnits = effUnits(r.quantity, r.boxQty);
      return sum + baseUnits * toNum(r.supplierPrice);
    }, 0);
    const vatAmt = (sub * toNum(head.vatPercent)) / 100;
    const discAmt = (sub * toNum(head.discountPercent)) / 100;
    const grand = sub + vatAmt - discAmt;
    const due = Math.max(0, grand - toNum(head.paidAmount));
    return { sub, vatAmt, discAmt, grand, due };
  }, [rows, head]);

  /* ---------- submit ---------- */
  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplierId: head.supplierId,
        supplierName: head.supplierName,
        invoiceNo: head.invoiceNo,
        date: head.date,
        paymentType: head.paymentType,
        details: head.details,
        vatPercent: toNum(head.vatPercent),
        discountPercent: toNum(head.discountPercent),
        paidAmount: toNum(head.paidAmount),
        items: rows.map((r) => ({
          medicineId: r.medicineId || null,
          medicineName: r.medicineName,
          batchId: r.batchId,
          expiryDate: r.expiryDate,
          stockQty: toNum(r.availQty), // optional: not used by server
          boxPattern: r.boxPattern,
          unitsPerBox: r.unitsPerBox || parseUnitsPerBox(r.boxPattern),
          boxQty: toNum(r.boxQty),
          quantity: toNum(r.quantity),
          supplierPrice: toNum(r.supplierPrice),
          boxMRP: toNum(r.boxMRP),
        })),
      };

      await axios.put(`${API.purchasesBase}/${id}`, payload);
      alert("✅ Purchase updated");
      navigate("/dashboard/admin/purchases/list");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update purchase.");
    }
  };

  /* ---------- mirror slider ---------- */
  const scrollerRef = useRef(null);
  const mirrorRef = useRef(null);
  const mirrorInnerRef = useRef(null);
  const [showMirror, setShowMirror] = useState(false);

  const syncWidthsAndToggle = () => {
    const sc = scrollerRef.current,
      mr = mirrorRef.current,
      inner = mirrorInnerRef.current;
    if (!sc || !mr || !inner) return;
    mr.style.width = `${sc.clientWidth}px`;
    inner.style.width = `${sc.scrollWidth}px`;
    setShowMirror(sc.scrollWidth > sc.clientWidth + 1);
  };
  const syncFromTable = () => {
    const sc = scrollerRef.current,
      mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(mr.scrollLeft - sc.scrollLeft) > 1) mr.scrollLeft = sc.scrollLeft;
  };
  const syncFromMirror = () => {
    const sc = scrollerRef.current,
      mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(sc.scrollLeft - mr.scrollLeft) > 1) sc.scrollLeft = mr.scrollLeft;
  };

  useEffect(() => {
    const sc = scrollerRef.current,
      mr = mirrorRef.current;
    if (!sc || !mr) return;
    const onResize = () => syncWidthsAndToggle();
    sc.addEventListener("scroll", syncFromTable, { passive: true });
    mr.addEventListener("scroll", syncFromMirror, { passive: true });
    window.addEventListener("resize", onResize);
    syncWidthsAndToggle();
    return () => {
      sc.removeEventListener("scroll", syncFromTable);
      mr.removeEventListener("scroll", syncFromMirror);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    syncWidthsAndToggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, meds.length, leafs.length, head.vatPercent, head.discountPercent, head.paidAmount]);

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      {/* keep page from having horizontal overflow */}
      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 min-w-0">
        <div className="mx-auto w-full max-w-full bg-white rounded-xl shadow-xl border border-base-300 overflow-x-hidden min-w-0">
          {/* header bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-base-300">
            <h1 className="text-xl md:text-2xl font-bold">Edit Purchase</h1>
            <Link to="/dashboard/admin/purchases/list" className="btn btn-success btn-sm">
              Purchase List
            </Link>
          </div>

          <form onSubmit={submit} className="px-4 sm:px-6 md:px-8 py-6 space-y-6 min-w-0">
            {/* TOP: two columns */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label font-semibold">
                  Supplier <span className="text-error">*</span> :
                </label>
                <select
                  className="select select-bordered w-full"
                  value={head.supplierId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const s = suppliers.find((x) => x._id === sid);
                    setHead((p) => ({
                      ...p,
                      supplierId: sid,
                      supplierName: s?.manufacturerName || "",
                    }));
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

              <div>
                <label className="label font-semibold">
                  Date <span className="text-error">*</span> :
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={head.date}
                  onChange={(e) => setHead((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">
                  Invoice No <span className="text-error">*</span> :
                </label>
                <input
                  className="input input-bordered w-full"
                  placeholder="Invoice No"
                  value={head.invoiceNo}
                  onChange={(e) => setHead((p) => ({ ...p, invoiceNo: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold">Details :</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="Details"
                  value={head.details}
                  onChange={(e) => setHead((p) => ({ ...p, details: e.target.value }))}
                />
              </div>

              <div>
                <label className="label font-semibold">
                  Payment Type <span className="text-error">*</span> :
                </label>
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
              <div className="hidden md:block" />
            </section>

            {/* TABLE (only this scrolls horizontally) */}
            <div
              ref={scrollerRef}
              className="overflow-x-auto rounded-lg border border-base-300 min-w-0
                         [&::-webkit-scrollbar]:h-2
                         [&::-webkit-scrollbar-thumb]:rounded-full
                         [&::-webkit-scrollbar-thumb]:bg-base-300
                         [&::-webkit-scrollbar-track]:bg-base-200"
            >
              <table className="table min-w-[1280px] w-full">
                <thead className="bg-base-200 text-[13px]">
                  <tr>
                    <th className="min-w-[220px]">Medicine Information<span className="text-error">*</span></th>
                    <th className="min-w-[120px]">Batch Id</th>
                    <th className="min-w-[130px]">Expiry Date<span className="text-error">*</span></th>
                    <th className="min-w-[100px] text-right">Stock (Units)</th>
                    <th className="min-w-[160px]">Leaf / Box Pattern<span className="text-error">*</span></th>
                    <th className="min-w-[110px] text-right">Box Qty<span className="text-error">*</span></th>
                    <th className="min-w-[110px] text-right">Quantity<span className="text-error">*</span></th>
                    <th className="min-w-[140px] text-right">Supplier Price<span className="text-error">*</span></th>
                    <th className="min-w-[140px] text-right">Box MRP<span className="text-error">*</span></th>
                    <th className="min-w-[160px] text-right">Line Total</th>
                    <th className="min-w-[80px] text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="text-[13px]">
                  {rows.map((r, i) => {
                    const baseUnits = effUnits(r.quantity, r.boxQty);
                    const lineTotal = baseUnits * toNum(r.supplierPrice);

                    const suggestions =
                      openSuggest.open && openSuggest.rowIndex === i
                        ? suggestFilter(r.medicineName)
                        : [];

                    return (
                      <tr key={i}>
                        {/* Medicine + suggester */}
                        <td className="relative">
                          <div className="relative">
                            <input
                              className="input input-bordered w-full"
                              placeholder="Type medicine name"
                              value={r.medicineName}
                              onFocus={() => setOpenSuggest({ open: true, rowIndex: i })}
                              onChange={(e) => {
                                setRow(i, { medicineName: e.target.value, medicineId: "" });
                                setOpenSuggest({ open: true, rowIndex: i });
                              }}
                              onBlur={() =>
                                setTimeout(() => setOpenSuggest({ open: false, rowIndex: -1 }), 150)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onMedicineTyped(i, r.medicineName);
                              }}
                              required
                            />
                            {suggestions.length > 0 && (
                              <ul
                                className="absolute z-20 mt-1 w-full bg-white border border-base-300 rounded-lg shadow-lg max-h-56 overflow-auto text-sm"
                                role="listbox"
                              >
                                {suggestions.map((m) => (
                                  <li
                                    key={m._id || m.id}
                                    className="px-3 py-2 hover:bg-base-200 cursor-pointer"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      applyMedToRow(i, m);
                                      setOpenSuggest({ open: false, rowIndex: -1 });
                                    }}
                                  >
                                    <div className="font-medium">
                                      {m.name}
                                      {m.strength ? ` — ${m.strength}` : ""}
                                    </div>
                                    <div className="text-xs opacity-75">
                                      {(m.genericName && `Generic: ${m.genericName} · `) || ""}
                                      Unit: {m.unit || "-"}
                                      {m.boxSize ? ` · Box: ${m.boxSize}` : ""}
                                      {` · Buy: ${fmt(m.supplierPrice ?? m.purchasePrice ?? 0)}`}
                                      {` · Stock: ${fmt(pickAvail(m))}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>

                        {/* Batch Id */}
                        <td>
                          <input
                            className="input input-bordered w-full"
                            placeholder="Batch Id"
                            value={r.batchId}
                            onChange={(e) => setRow(i, { batchId: e.target.value })}
                          />
                        </td>

                        {/* Expiry */}
                        <td>
                          <input
                            type="date"
                            className="input input-bordered w-full"
                            value={r.expiryDate}
                            onChange={(e) => setRow(i, { expiryDate: e.target.value })}
                            required
                          />
                        </td>

                        {/* Stock (readonly) */}
                        <td className="text-right">
                          <input
                            className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                            value={fmt(r.availQty)}
                            readOnly
                          />
                        </td>

                        {/* Leaf pattern */}
                        <td>
                          <select
                            className="select select-bordered w-full"
                            value={r.boxPattern}
                            onChange={(e) => {
                              const v = e.target.value;
                              lastLeafRef.current = v || lastLeafRef.current;
                              setRow(i, { boxPattern: v, unitsPerBox: parseUnitsPerBox(v) });
                            }}
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

                        {/* Box Qty */}
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.boxQty}
                            onChange={(e) => setRow(i, { boxQty: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Quantity */}
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.quantity}
                            onChange={(e) => setRow(i, { quantity: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Supplier Price */}
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.supplierPrice}
                            onChange={(e) => setRow(i, { supplierPrice: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Box MRP */}
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.boxMRP}
                            onChange={(e) => setRow(i, { boxMRP: toNum(e.target.value) })}
                            required
                          />
                        </td>

                        {/* Line Total */}
                        <td className="text-right">
                          <input
                            className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                            value={fmt(lineTotal)}
                            readOnly
                          />
                        </td>

                        {/* Action */}
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => removeRow(i)}
                            title="Delete row"
                            disabled={rows.length === 1}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm2 0v1h2V3h-2zM7 7v13h10V7H7zm3 3h2v8h-2v-8zm4 0h2v8h-2v-8z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* summary rows */}
                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-medium">Sub Total:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.sub)}
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={addRow}
                        title="Add Row"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2z"/>
                        </svg>
                      </button>
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-medium">VAT:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.vatAmt)}
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <PercentBox
                        value={head.vatPercent}
                        onChange={(v) => setHead((p) => ({ ...p, vatPercent: toNum(v) }))}
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-medium">Discount:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.discAmt)}
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <PercentBox
                        value={head.discountPercent}
                        onChange={(v) => setHead((p) => ({ ...p, discountPercent: toNum(v) }))}
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-semibold">Grand Total:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold"
                        value={fmt(totals.grand)}
                        readOnly
                      />
                    </td>
                    <td />
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-medium">Paid Amount:</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full text-right"
                        value={head.paidAmount}
                        onChange={(e) => setHead((p) => ({ ...p, paidAmount: toNum(e.target.value) }))}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-warning btn-xs"
                        onClick={() => setHead((p) => ({ ...p, paidAmount: Number(totals.grand.toFixed(2)) }))}
                        title="Fill with Grand Total"
                      >
                        Full Paid
                      </button>
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={7}></td>
                    <td className="text-right font-semibold">Due Amount:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold"
                        value={fmt(totals.due)}
                        readOnly
                      />
                    </td>
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* mirror slider */}
            {showMirror && (
              <div className="pt-2">
                <div
                  ref={mirrorRef}
                  className="h-4 overflow-x-auto rounded-md
                             [&::-webkit-scrollbar]:h-3
                             [&::-webkit-scrollbar-thumb]:rounded-full
                             [&::-webkit-scrollbar-thumb]:bg-base-300
                             [&::-webkit-scrollbar-track]:bg-base-200"
                  aria-label="Table horizontal slider"
                >
                  <div ref={mirrorInnerRef} className="h-1" />
                </div>
              </div>
            )}

            {/* actions */}
            <div className="flex justify-end gap-3">
              <button type="submit" className="btn btn-success">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function PercentBox({ value, onChange }) {
  return (
    <label className="input input-bordered input-xs flex items-center gap-1 w-20 mx-auto">
      <input
        type="number"
        step="0.01"
        className="w-full text-right outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="opacity-70 text-xs">%</span>
    </label>
  );
}
