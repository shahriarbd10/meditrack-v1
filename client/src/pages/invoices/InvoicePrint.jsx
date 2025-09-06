import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";

const API = "http://localhost:5000/api/invoices";
const toDate = (d) => new Date(d).toISOString().slice(0, 10);
const fmt = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));

export default function InvoicePrint() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const printOnLoad = new URLSearchParams(location.search).get("print") === "1";

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOne = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/${id}`);
      const obj = data?.data || data;
      setDoc(obj);
    } catch (e) {
      console.error(e);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
  }, [id]);

  useEffect(() => {
    if (!loading && doc && printOnLoad) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, doc, printOnLoad]);

  const subTotal = useMemo(
    () =>
      (doc?.items || []).reduce(
        (acc, it) => acc + Number(it.qty + it.boxQty) * Number(it.price || 0),
        0
      ),
    [doc]
  );

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">Loading...</main>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">Invoice not found.</main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 min-h-screen">
        {/* Action bar (not printed) */}
        <div className="p-4 border-b bg-white flex items-center justify-between print:hidden">
          <div className="text-sm">
            <div className="text-gray-500">PAYMENTS</div>
            <div className="text-lg font-semibold">Invoice No: {doc.invoiceNo || "-"}</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dashboard/admin/invoices/list"
              className="btn btn-success btn-sm"
            >
              Invoice List
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              Print Invoice
            </button>
          </div>
        </div>

        <div className="p-4 print:p-0">
          {/* Printable card */}
          <div className="bg-white border rounded-md p-6 print:border-0 print:rounded-none print:p-8">
            {/* Header brand */}
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-full border flex items-center justify-center">
                {/* simple leaf icon */}
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M12 2C7 3 3 7 2 12c1 5 5 9 10 10 5-1 9-5 10-10C21 7 17 3 12 2zm2 15c-4 1-7-2-6-6 4-1 7 2 6 6z"/>
                </svg>
              </div>
              <div className="text-2xl font-semibold mt-2">MediTrack</div>
              <div className="text-gray-500">Dynamic Admin Panel</div>
              <div className="text-gray-400 text-sm">Invoice: {doc.invoiceNo || "-"}</div>
            </div>

            {/* Two columns: billing info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-green-700 font-semibold">BILLING FROM</div>
                <div className="mt-2">
                  <div className="font-medium">Dynamic Admin Panel.</div>
                  <div className="text-gray-600 text-sm">
                    123/A, Street, State-12345, Demo
                    <br />
                    info@meditrack.app
                    <br />
                    P: 0129348341
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <div className="text-gray-500">INVOICE NO</div>
                  <div className="font-medium">{doc.invoiceNo || "-"}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-green-700 font-semibold">BILLING TO</div>
                <div className="mt-2">
                  <div className="font-medium">{doc.customerName || "Walking Customer"}</div>
                  {/* Add phone/email if you store them */}
                </div>
                <div className="mt-4 text-sm">
                  <div className="text-gray-500">DATE</div>
                  <div className="font-medium">{doc.date ? toDate(doc.date) : "-"}</div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left w-16">SL</th>
                    <th className="py-2 text-left">Medicine Name</th>
                    <th className="py-2 text-right w-24">Quantity</th>
                    <th className="py-2 text-right w-28">Price</th>
                    <th className="py-2 text-right w-32">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(doc.items || []).map((it, idx) => {
                    const effectiveQty = Number(it.qty || 0) + Number(it.boxQty || 0);
                    const base = effectiveQty * Number(it.price || 0);
                    const disc = (base * Number(it.discountPct || 0)) / 100;
                    const lineTotal = base - disc;
                    return (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2">{it.medicineName || "-"}</td>
                        <td className="py-2 text-right">{fmt(effectiveQty)}</td>
                        <td className="py-2 text-right">{fmt(it.price)}</td>
                        <td className="py-2 text-right">{fmt(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals summary */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div />
              <div>
                <div className="flex items-center justify-between py-1">
                  <div className="text-gray-600">Sub Total</div>
                  <div>{fmt(subTotal)}</div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="text-gray-600">Total VAT</div>
                  <div>{fmt(doc.totalVat || 0)}</div>
                </div>
                <div className="flex items-center justify-between py-1 font-semibold">
                  <div>Grand Total</div>
                  <div>{fmt(doc.grandTotal || 0)}</div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="text-gray-600">Due Amount</div>
                  <div>{fmt(doc.dueAmount || 0)}</div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="mt-10">
              <div className="text-sm font-semibold">COMMENTS</div>
              <div className="text-gray-600">thank you</div>
            </div>
          </div>
        </div>
      </main>

      {/* print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          aside { display: none !important; }
          main { padding: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
