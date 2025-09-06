// src/pages/invoices/EditInvoice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

/* =======================
   API Endpoints
======================= */
const API = {
  customers: "http://localhost:5000/api/customers",
  medicines: "http://localhost:5000/api/medicines",
  invoices:  "http://localhost:5000/api/invoices",
};

/* =======================
   Helpers
======================= */
const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const today = () => new Date().toISOString().slice(0, 10);
const arr = (v) => (Array.isArray(v) ? v : v?.data && Array.isArray(v.data) ? v.data : []);
const pickAvail = (m) => toNum(m?.totalUnits ?? m?.stock ?? m?.quantity ?? m?.availableQty ?? 0);
const fmt = (n) => Number(n || 0).toFixed(2);

/** Must match server rule exactly: (qty||1) * (boxQty||1) */
const effUnits = (qty, boxQty) => {
  const q = toNum(qty) || 1;
  const b = toNum(boxQty) || 1;
  return q * b;
};

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  // dropdowns
  const [customers, setCustomers] = useState([]);
  const [meds, setMeds] = useState([]);

  // header
  const [head, setHead] = useState({
    customerName: "Walking Customer",
    invoiceNo: "",
    date: today(),
    paymentType: "Cash Payment",
    details: "",
    previousDue: 0,        // from invoice or matching customer
    invoiceDiscount: 0,    // absolute
    paidAmount: 0,
  });

  // rows
  const mkRow = () => ({
    medicineName: "",
    batch: "",
    expiryDate: "",
    unit: "None",
    availQty: 0, // hint (from Medicine.totalUnits)
    qty: 0,
    boxQty: 0,
    price: 0,
    discountPct: 0,
    vatPct: 0,
  });
  const [rows, setRows] = useState([mkRow()]);

  /* ---------- load dropdowns ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([axios.get(API.customers), axios.get(API.medicines)]);
        setCustomers(arr(c.data));
        setMeds(arr(m.data) || arr(m.data?.medicines));
      } catch (e) {
        console.error(e);
        alert("Failed to load customers/medicines.");
      }
    })();
  }, []);

  /* ---------- load invoice ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API.invoices}/${id}`);
        const inv = res.data?.data || res.data?.invoice || res.data;
        if (!inv) throw new Error("Invoice not found");

        setHead((p) => ({
          ...p,
          customerName: inv.customerName || "Walking Customer",
          invoiceNo: inv.invoiceNo || "",
          date: inv.date || today(),
          paymentType: inv.paymentType || "Cash Payment",
          details: inv.details || "",
          previousDue: toNum(inv.previousDue),
          invoiceDiscount: toNum(inv.invoiceDiscount),
          paidAmount: toNum(inv.paidAmount),
        }));

        // Map items to UI rows and attach latest availQty from medicines list
        const toRow = (it) => {
          const med = meds.find(
            (x) => (x.name || "").toLowerCase().trim() === (it.medicineName || "").toLowerCase().trim()
          );
          return {
            medicineName: it.medicineName || "",
            batch: it.batch || "",
            expiryDate: it.expiryDate || "",
            unit: it.unit || "None",
            availQty: med ? pickAvail(med) : 0,
            qty: toNum(it.qty),
            boxQty: toNum(it.boxQty),
            price: toNum(it.price),
            discountPct: toNum(it.discountPct),
            vatPct: toNum(it.vatPct),
          };
        };

        setRows(inv.items?.length ? inv.items.map(toRow) : [mkRow()]);
      } catch (e) {
        console.error(e);
        alert("Failed to load invoice.");
        navigate("/dashboard/admin/invoices/list");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meds.length]);

  /* ---------- auto previous due (if customer changes) ---------- */
  useEffect(() => {
    const c = customers.find(
      (x) =>
        (x.name || x.customerName || "").toLowerCase().trim() ===
        head.customerName.toLowerCase().trim()
    );
    if (c) setHead((p) => ({ ...p, previousDue: toNum(c?.previousDue || 0) }));
  }, [head.customerName, customers]);

  /* ---------- row helpers ---------- */
  const setRow = (i, patch) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () => setRows((p) => [...p, mkRow()]);
  const removeRow = (i) => setRows((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  /** fill row fields when medicine recognized */
  const applyMedToRow = (i, m) => {
    setRow(i, {
      medicineName: m.name || rows[i].medicineName,
      unit: m.unit || "None",
      price: toNum(m.price || 0),
      vatPct: toNum(m.vat || 0),
      expiryDate: m.expiryDate ? new Date(m.expiryDate).toISOString().slice(0, 10) : rows[i].expiryDate,
      availQty: pickAvail(m),
    });
  };

  const onMedicineTyped = (i, name) => {
    const s = String(name || "").toLowerCase().trim();
    const m =
      meds.find((x) => (x.name || "").toLowerCase().trim() === s) ||
      meds.find((x) => (x.barcode || "").toLowerCase().trim() === s);
    if (m) applyMedToRow(i, m);
    else setRow(i, { medicineName: name }); // manual item name
  };

  /* ---------- custom medicine suggester ---------- */
  const [openSuggest, setOpenSuggest] = useState({ open: false, rowIndex: -1 });
  const suggestFilter = (q) => {
    const s = String(q || "").toLowerCase().trim();
    if (!s) return meds.slice(0, 10);
    return meds
      .filter((m) => (m.name || "").toLowerCase().includes(s) || (m.genericName || "").toLowerCase().includes(s))
      .slice(0, 12);
  };

  /* ---------- totals ---------- */
  const totals = useMemo(() => {
    let sub = 0, itemDisc = 0, itemVat = 0;

    rows.forEach((r) => {
      const base = effUnits(r.qty, r.boxQty) * toNum(r.price);
      const d = (base * toNum(r.discountPct)) / 100;
      const v = (base * toNum(r.vatPct)) / 100;
      sub += base;
      itemDisc += d;
      itemVat += v;
    });

    const invDisc = toNum(head.invoiceDiscount);
    const grand = sub - (itemDisc + invDisc) + itemVat;
    const net = grand + toNum(head.previousDue);
    const paid = toNum(head.paidAmount);
    const due = Math.max(0, net - paid);
    const change = Math.max(0, paid - net);

    return {
      sub,
      itemDisc,
      itemVat,
      totalDiscount: itemDisc + invDisc,
      invDisc,
      grand,
      net,
      due,
      change,
    };
  }, [rows, head.invoiceDiscount, head.previousDue, head.paidAmount]);

  /* ---------- mirror slider (wide table) ---------- */
  const scrollerRef = useRef(null);
  const mirrorRef = useRef(null);
  const mirrorInnerRef = useRef(null);
  const [showMirror, setShowMirror] = useState(false);

  const syncWidthsAndToggle = () => {
    const sc = scrollerRef.current, mr = mirrorRef.current, inner = mirrorInnerRef.current;
    if (!sc || !mr || !inner) return;
    mr.style.width = `${sc.clientWidth}px`;
    inner.style.width = `${sc.scrollWidth}px`;
    setShowMirror(sc.scrollWidth > sc.clientWidth + 1);
  };
  const syncFromTable = () => {
    const sc = scrollerRef.current, mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(mr.scrollLeft - sc.scrollLeft) > 1) mr.scrollLeft = sc.scrollLeft;
  };
  const syncFromMirror = () => {
    const sc = scrollerRef.current, mr = mirrorRef.current;
    if (!sc || !mr) return;
    if (Math.abs(sc.scrollLeft - mr.scrollLeft) > 1) sc.scrollLeft = mr.scrollLeft;
  };

  useEffect(() => {
    const sc = scrollerRef.current, mr = mirrorRef.current;
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

  useEffect(() => { syncWidthsAndToggle(); },
    [rows.length, head.invoiceDiscount, head.previousDue, head.paidAmount]);

  /* ---------- submit ---------- */
  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: head.date,
        details: head.details,
        invoiceNo: head.invoiceNo,
        paymentType: head.paymentType,
        customerName: head.customerName,
        previousDue: toNum(head.previousDue),

        items: rows.map((r) => ({
          medicineName: r.medicineName,
          batch: r.batch,
          expiryDate: r.expiryDate,  // keep yyyy-mm-dd string
          unit: r.unit,
          qty: toNum(r.qty),
          boxQty: toNum(r.boxQty),
          price: toNum(r.price),
          discountPct: toNum(r.discountPct),
          vatPct: toNum(r.vatPct),
        })),

        subTotal: Number(totals.sub.toFixed(2)),
        invoiceDiscount: Number(totals.invDisc.toFixed(2)),
        totalDiscount: Number(totals.totalDiscount.toFixed(2)),
        totalVat: Number(totals.itemVat.toFixed(2)),
        grandTotal: Number(totals.grand.toFixed(2)),
        netTotal: Number(totals.net.toFixed(2)),
        paidAmount: Number(toNum(head.paidAmount).toFixed(2)),
        dueAmount: Number(totals.due.toFixed(2)),
        change: Number(totals.change.toFixed(2)),
      };

      if (!payload.customerName?.trim()) throw new Error("Customer is required.");
      if (!payload.date) throw new Error("Date is required.");
      if (!payload.items.length || !payload.items[0].medicineName?.trim())
        throw new Error("At least one item is required.");

      await axios.put(`${API.invoices}/${id}`, payload);
      alert("✅ Invoice updated");
      navigate("/dashboard/admin/invoices/list");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to update invoice.");
    }
  };

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      {/* keep page from having horizontal overflow */}
      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 min-w-0">
        <div className="mx-auto w-full max-w-full bg-white rounded-xl shadow-xl border border-base-300 overflow-x-hidden min-w-0">
          {/* header bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-base-300">
            <h1 className="text-xl md:text-2xl font-bold">Edit Invoice</h1>
            <Link to="/dashboard/admin/invoices/list" className="btn btn-success btn-sm">
              Invoice List
            </Link>
          </div>

          <form onSubmit={submit} className="px-4 sm:px-6 md:px-8 py-6 space-y-6 min-w-0">
            {/* TOP: two columns */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label font-semibold">
                  Customer <span className="text-error">*</span> :
                </label>
                <input
                  list="customers-list"
                  className="input input-bordered w-full"
                  placeholder="Select or type customer"
                  value={head.customerName}
                  onChange={(e) => setHead((p) => ({ ...p, customerName: e.target.value }))}
                  required
                />
                <datalist id="customers-list">
                  {customers.map((c) => (
                    <option
                      key={c._id || c.id || (c.name || c.customerName)}
                      value={c.name || c.customerName}
                    />
                  ))}
                </datalist>
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
                <label className="label font-semibold">Invoice No :</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="Auto/Manual"
                  value={head.invoiceNo}
                  onChange={(e) => setHead((p) => ({ ...p, invoiceNo: e.target.value }))}
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
                  <option>Mobile Banking</option>
                  <option>Due</option>
                </select>
              </div>

              <div className="hidden md:block" />
            </section>

            {/* TABLE (scrolls horizontally) */}
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
                    <th className="min-w-[270px]">
                      Medicine Information<span className="text-error">*</span>
                    </th>
                    <th className="min-w-[120px]">Batch</th>
                    <th className="min-w-[130px]">Expiry Date</th>
                    <th className="min-w-[100px] text-right">Avail Qty</th>
                    <th className="min-w-[100px]">Unit</th>
                    <th className="min-w-[110px] text-right">Quantity</th>
                    <th className="min-w-[110px] text-right">Box Qty</th>
                    <th className="min-w-[130px] text-right">Price</th>
                    <th className="min-w-[120px] text-right">Discount %</th>
                    <th className="min-w-[120px] text-right">VAT %</th>
                    <th className="min-w-[140px] text-right">Line Total</th>
                    <th className="min-w-[80px] text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="text-[13px]">
                  {rows.map((r, i) => {
                    const base = effUnits(r.qty, r.boxQty) * toNum(r.price);
                    const lineDisc = (base * toNum(r.discountPct)) / 100;
                    const lineTotal = base - lineDisc; // VAT added in totals

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
                                setRow(i, { medicineName: e.target.value });
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
                            {/* Suggestion dropdown */}
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
                                      {` · Price: ${fmt(m.price)}`}
                                      {` · Stock: ${fmt(pickAvail(m))}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>

                        {/* Batch */}
                        <td>
                          <input
                            className="input input-bordered w-full"
                            placeholder="Batch"
                            value={r.batch}
                            onChange={(e) => setRow(i, { batch: e.target.value })}
                          />
                        </td>

                        {/* Expiry */}
                        <td>
                          <input
                            type="date"
                            className="input input-bordered w-full"
                            value={r.expiryDate}
                            onChange={(e) => setRow(i, { expiryDate: e.target.value })}
                          />
                        </td>

                        {/* Avail Qty (readonly) */}
                        <td className="text-right">
                          <input
                            className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                            value={fmt(r.availQty)}
                            readOnly
                          />
                        </td>

                        {/* Unit (readonly) */}
                        <td>
                          <input
                            className="input input-bordered w-full text-left bg-base-200 pointer-events-none"
                            value={r.unit}
                            readOnly
                          />
                        </td>

                        {/* Quantity */}
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.qty}
                            onChange={(e) => setRow(i, { qty: toNum(e.target.value) })}
                          />
                        </td>

                        {/* Box Qty */}
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.boxQty}
                            onChange={(e) => setRow(i, { boxQty: toNum(e.target.value) })}
                          />
                        </td>

                        {/* Price */}
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.price}
                            onChange={(e) => setRow(i, { price: toNum(e.target.value) })}
                          />
                        </td>

                        {/* Discount % */}
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.discountPct}
                            onChange={(e) => setRow(i, { discountPct: toNum(e.target.value) })}
                          />
                        </td>

                        {/* VAT % */}
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="input input-bordered w-full text-right"
                            value={r.vatPct}
                            onChange={(e) => setRow(i, { vatPct: toNum(e.target.value) })}
                          />
                        </td>

                        {/* Line Total (no VAT here) */}
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
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-error"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm2 0v1h2V3h-2zM7 7v13h10V7H7zm3 3h2v8h-2v-8zm4 0h2v8h-2v-8z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* summary block — shifted one column to the right (colSpan=9) */}
                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Invoice Discount:</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full text-right"
                        value={head.invoiceDiscount}
                        onChange={(e) =>
                          setHead((p) => ({ ...p, invoiceDiscount: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={addRow}
                        title="Add Row"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-info"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M11 11V6h2v5h5v2h-5v5h-2v-5H6v-2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Total Discount:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.totalDiscount)}
                        readOnly
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Total VAT:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.itemVat)}
                        readOnly
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-semibold">Grand Total:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold"
                        value={fmt(totals.grand)}
                        readOnly
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Previous:</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full text-right"
                        value={head.previousDue}
                        onChange={(e) =>
                          setHead((p) => ({ ...p, previousDue: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-semibold">Net Total:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none font-semibold"
                        value={fmt(totals.net)}
                        readOnly
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Paid Amount:</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full text-right"
                        value={head.paidAmount}
                        onChange={(e) =>
                          setHead((p) => ({ ...p, paidAmount: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Due Amount:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.due)}
                        readOnly
                      />
                    </td>
                    <td />
                  </tr>

                  <tr>
                    <td colSpan={9}></td>
                    <td className="text-right font-medium">Change:</td>
                    <td>
                      <input
                        className="input input-bordered w-full text-right bg-base-200 pointer-events-none"
                        value={fmt(totals.change)}
                        readOnly
                      />
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
            <div className="flex justify-start gap-3">
              <button
                type="button"
                className="btn btn-warning"
                onClick={() =>
                  setHead((p) => ({ ...p, paidAmount: Number(totals.net.toFixed(2)) }))
                }
                title="Fill paid with Net Total"
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
