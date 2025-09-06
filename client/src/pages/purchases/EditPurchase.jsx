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
    stockQty: 0,
    boxPattern: "",
    unitsPerBox: 1,
    boxQty: 0,
    quantity: 0,
    supplierPrice: 0,
    boxMRP: 0,
  });
  const [rows, setRows] = useState([mkRow()]);
  const lastLeafRef = useRef("");

  // load dropdowns + purchase
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
        setMeds(m.data?.data || m.data?.medicines || []);
      } catch (err) {
        console.error("Dropdown load error:", err);
        alert("Failed to load dropdowns.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API.purchasesBase}/${id}`);
        const p = res.data?.data || res.data?.purchase || res.data;

        // header defaults + fetched
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

        // rows/items
        const items = p?.items || [];
        setRows(
          items.length
            ? items.map((r) => ({
                medicineId: r.medicineId || "",
                medicineName: r.medicineName || "",
                batchId: r.batchId || "",
                expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : "",
                stockQty: toNum(r.stockQty),
                boxPattern: r.boxPattern || "",
                unitsPerBox: r.unitsPerBox || parseUnitsPerBox(r.boxPattern),
                boxQty: toNum(r.boxQty),
                quantity: toNum(r.quantity),
                supplierPrice: toNum(r.supplierPrice),
                boxMRP: toNum(r.boxMRP),
              }))
            : [mkRow()]
        );
      } catch (err) {
        console.error("Load purchase error:", err);
        alert("Failed to load purchase.");
        navigate("/dashboard/admin/purchases/list");
      }
    })();
  }, [id, navigate]);

  // totals
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

  // helpers
  const setRow = (i, patch) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const onMedicineTyped = (i, nameOrId) => {
    const byId = meds.find((x) => x._id === nameOrId);
    const byName =
      byId ||
      meds.find((x) => x.name?.toLowerCase() === String(nameOrId).trim().toLowerCase());
    if (byName) {
      setRow(i, {
        medicineId: byName._id,
        medicineName: byName.name || "",
        stockQty: byName?.stock ?? 0,
        supplierPrice: byName?.supplierPrice ?? 0,
      });
    } else {
      setRow(i, { medicineId: "", medicineName: nameOrId, stockQty: 0, supplierPrice: 0 });
    }
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
      // Update instead of add
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
    const sc = scrollerRef.current;
    const mr = mirrorRef.current;
    const inner = mirrorInnerRef.current;
    if (!sc || !mr || !inner) return;
    mr.style.width = `${sc.clientWidth}px`;
    inner.style.width = `${sc.scrollWidth}px`;
    setShowMirror(sc.scrollWidth > sc.clientWidth + 1);
  };
  const syncFromTable = () => {
    const sc = scrollerRef.current;
    const mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(mr.scrollLeft - sc.scrollLeft) > 1) mr.scrollLeft = sc.scrollLeft;
  };
  const syncFromMirror = () => {
    const sc = scrollerRef.current;
    const mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(sc.scrollLeft - mr.scrollLeft) > 1) sc.scrollLeft = mr.scrollLeft;
  };

  useEffect(() => {
    const sc = scrollerRef.current;
    const mr = mirrorRef.current;
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
            {/* TOP: two columns (like AddMedicine) */}
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
                    setHead((p) => ({ ...p, supplierId: sid, supplierName: s?.manufacturerName || "" }));
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
              <table className="table min-w-[1200px] w-full">
                <thead className="bg-base-200 text-[13px]">
                  <tr>
                    <th className="min-w-[210px]">Medicine Information<span className="text-error">*</span></th>
                    <th className="min-w-[120px]">Batch Id</th>
                    <th className="min-w-[140px]">Expiry Date<span className="text-error">*</span></th>
                    <th className="min-w-[110px] text-right">Stock Qty</th>
                    <th className="min-w-[160px]">Box Pattern<span className="text-error">*</span></th>
                    <th className="min-w-[110px] text-right">Box Qty<span className="text-error">*</span></th>
                    <th className="min-w-[110px] text-right">Quantity<span className="text-error">*</span></th>
                    <th className="min-w-[140px] text-right">Supplier Price<span className="text-error">*</span></th>
                    <th className="min-w-[140px] text-right">Box MRP<span className="text-error">*</span></th>
                    <th className="min-w-[160px] text-right">Total Purchase Price</th>
                    <th className="min-w-[80px] text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="text-[13px]">
                  {/* hidden datalist for type-to-select */}
                  <tr className="hidden">
                    <td>
                      <datalist id="meds-list">
                        {meds.map((m) => (
                          <option key={m._id} value={m.name} />
                        ))}
                        {meds.map((m) => (
                          <option key={`${m._id}-id`} value={m._id} />
                        ))}
                      </datalist>
                    </td>
                  </tr>

                  {rows.map((r, i) => {
                    const unitsPerBox = r.unitsPerBox || parseUnitsPerBox(r.boxPattern);
                    const totalUnits = toNum(r.boxQty) * unitsPerBox + toNum(r.quantity);
                    const lineTotal = totalUnits * toNum(r.supplierPrice);

                    return (
                      <tr key={i}>
                        <td>
                          <input
                            list="meds-list"
                            className="input input-bordered w-full"
                            placeholder="Medicine Name"
                            value={r.medicineName || r.micineId}
                            onChange={(e) => onMedicineTyped(i, e.target.value)}
                            onBlur={(e) => onMedicineTyped(i, e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="input input-bordered w-full"
                            placeholder="Batch Id"
                            value={r.batchId}
                            onChange={(e) => setRow(i, { batchId: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="input input-bordered w-full"
                            value={r.expiryDate}
                            onChange={(e) => setRow(i, { expiryDate: e.target.value })}
                            required
                          />
                        </td>
                        <td className="text-right">
                          <input
                            className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                            value={Number(r.stockQty || 0).toFixed(2)}
                            readOnly
                          />
                        </td>
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
                        <td className="text-right">
                          <input
                            type="number"
                            className="input input-bordered w-full text-right"
                            value={r.boxQty}
                            onChange={(e) => setRow(i, { boxQty: toNum(e.target.value) })}
                            required
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            className="input input-bordered w-full text-right"
                            value={r.quantity}
                            onChange={(e) => setRow(i, { quantity: toNum(e.target.value) })}
                            required
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="input input-bordered w-full text-right"
                            value={r.supplierPrice}
                            onChange={(e) => setRow(i, { supplierPrice: toNum(e.target.value) })}
                            required
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="input input-bordered w-full text-right"
                            value={r.boxMRP}
                            onChange={(e) => setRow(i, { boxMRP: toNum(e.target.value) })}
                            required
                          />
                        </td>
                        <td className="text-right">
                          <input
                            className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                            value={lineTotal.toFixed(2)}
                            readOnly
                          />
                        </td>
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
                    <td colSpan={8}></td>
                    <td className="text-right font-medium">Sub Total:</td>
                    <td>
                      <input className="input input-bordered w-full text-right bg-base-200 pointer-events-none" value={totals.sub.toFixed(2)} readOnly />
                    </td>
                    <td className="text-center">
                      <button type="button" className="btn btn-ghost btn-xs" onClick={addRow} title="Add Row">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={8}></td>
                    <td className="text-right font-medium">Vat:</td>
                    <td>
                      <input className="input input-bordered w-full text-right bg-base-200 pointer-events-none" value={totals.vatAmt.toFixed(2)} readOnly />
                    </td>
                    <td className="text-center">
                      <PercentBox value={head.vatPercent} onChange={(v) => setHead((p) => ({ ...p, vatPercent: toNum(v) }))} />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={8}></td>
                    <td className="text-right font-medium">Discount:</td>
                    <td>
                      <input className="input input-bordered w-full text-right bg-base-200 pointer-events-none" value={totals.discAmt.toFixed(2)} readOnly />
                    </td>
                    <td className="text-center">
                      <PercentBox value={head.discountPercent} onChange={(v) => setHead((p) => ({ ...p, discountPercent: toNum(v) }))} />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={8}></td>
                    <td className="text-right font-semibold">Grand Total:</td>
                    <td>
                      <input className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold" value={totals.grand.toFixed(2)} readOnly />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={8}></td>
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
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={8}></td>
                    <td className="text-right font-semibold">Due Amount:</td>
                    <td>
                      <input className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold" value={totals.due.toFixed(2)} readOnly />
                    </td>
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
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => setHead((p) => ({ ...p, paidAmount: totals.grand }))}
              >
                Full Paid
              </button>
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
