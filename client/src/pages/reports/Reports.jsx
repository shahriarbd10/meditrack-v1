// src/pages/reports/Reports.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";

const API = {
  overview: `${import.meta.env.VITE_API_URL}/reports/overview`,
};

/** ---- Palette (future-proof, balanced, WCAG-friendly) ----
 * We lean on soft blues/emeralds/indigos with neutral slate.
 * Recharts will also respect system dark mode (via DaisyUI) for grid lines/text.
 */
const PALETTE = {
  blue:   "#3b82f6",
  indigo: "#6366f1",
  teal:   "#14b8a6",
  emerald:"#10b981",
  amber:  "#f59e0b",
  rose:   "#f43f5e",
  slate:  "#64748b",
  gray:   "#9ca3af",
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(API.overview);
        setData(res.data);
        setErr("");
      } catch (e) {
        console.error(e);
        setErr("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive some KPIs from available time-series
  const kpis = useMemo(() => {
    if (!data) return { sales30: 0, purchases30: 0, net: 0, avgDailySales: 0 };
    const sales = (data.salesByDay || []).reduce((a, c) => a + (Number(c.total) || 0), 0);
    const purchases = (data.purchasesByDay || []).reduce((a, c) => a + (Number(c.total) || 0), 0);
    const days = Math.max(1, new Set((data.salesByDay || []).map(d => d.date)).size || 30);
    return {
      sales30: sales,
      purchases30: purchases,
      net: sales - purchases,
      avgDailySales: sales / days,
    };
  }, [data]);

  const expiryPie = useMemo(() => {
    if (!data) return [];
    const { expiringSoon = 0, expired = 0, total = 0 } = data.expirySummary || {};
    const ok = Math.max(0, total - expiringSoon - expired);
    return [
      { name: "Expired",       value: expired,      color: PALETTE.rose },
      { name: "Expiring Soon", value: expiringSoon, color: PALETTE.amber },
      { name: "OK",            value: ok,           color: PALETTE.emerald },
    ];
  }, [data]);

  // For a combined overlay chart
  const salesPurchases = useMemo(() => {
    // Merge by date (handles if one series misses a date)
    const map = new Map();
    (data?.salesByDay || []).forEach(d => map.set(d.date, { date: d.date, sales: d.total || 0, purchases: 0 }));
    (data?.purchasesByDay || []).forEach(d => {
      const v = map.get(d.date) || { date: d.date, sales: 0, purchases: 0 };
      v.purchases = d.total || 0;
      map.set(d.date, v);
    });
    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [data]);

  return (
    <div className="min-h-screen flex bg-base-200">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Reports</h1>
          <Link to="/dashboard/admin" className="btn btn-ghost btn-sm">Back to Dashboard</Link>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <span className="loading loading-dots loading-lg" />
          </div>
        ) : err ? (
          <div className="alert alert-error">{err}</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPI label="Sales (30d)" value={formatCurrency(kpis.sales30)} accent="text-primary" />
              <KPI label="Purchases (30d)" value={formatCurrency(kpis.purchases30)} accent="text-indigo-500" />
              <KPI label="Net (S - P)" value={formatCurrency(kpis.net)} accent={kpis.net >= 0 ? "text-emerald-500" : "text-rose-500"} />
              <KPI label="Avg Daily Sales" value={formatCurrency(kpis.avgDailySales)} accent="text-amber-500" />
            </div>

            {/* Sales & Purchases (Last 30 days) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <Card title="Sales (Last 30 days)">
                <ChartLine
                  data={data.salesByDay || []}
                  dataKey="total"
                  stroke={PALETTE.blue}
                  gradientId="gradSales"
                />
              </Card>

              <Card title="Purchases (Last 30 days)">
                <ChartArea
                  data={data.purchasesByDay || []}
                  dataKey="total"
                  stroke={PALETTE.indigo}
                  fillFrom={PALETTE.indigo}
                  gradientId="gradPurch"
                />
              </Card>
            </div>

            {/* Overlay comparison */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <Card title="Sales vs Purchases (Overlay)">
                <ChartOverlay
                  data={salesPurchases}
                  salesKey="sales"
                  purchasesKey="purchases"
                  salesColor={PALETTE.teal}
                  purchasesColor={PALETTE.slate}
                />
              </Card>
            </div>

            {/* Stock by Category + Expiry Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Stock by Category">
                <ChartBar
                  data={data.stockByCategory || []}
                  xKey="category"
                  yKey="stock"
                  fill={PALETTE.emerald}
                />
              </Card>
              <Card title="Expiry Summary">
                <ChartPie data={expiryPie} />
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* -------------------- UI bits -------------------- */

function KPI({ label, value, accent = "text-primary" }) {
  return (
    <div className="card bg-white shadow-md rounded-xl px-4 py-3 hover:shadow-lg transition-all">
      <div className="text-xs uppercase tracking-wide text-base-content/60">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  // fixed, consistent, responsive height to prevent stretch/squash
  return (
    <div className="card bg-white shadow-md rounded-xl p-4">
      <div className="mb-3 font-semibold">{title}</div>
      <div className="w-full h-72 md:h-80">{children}</div>
    </div>
  );
}

/* -------------------- Recharts wrappers -------------------- */

function ChartLine({ data, dataKey, stroke = PALETTE.blue, gradientId = "grad1" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          isAnimationActive
          animationDuration={700}
          activeDot={{ r: 4 }}
        />
        {/* Subtle area fill under line for depth */}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="none"
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={700}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartArea({ data, dataKey, stroke = PALETTE.indigo, fillFrom = PALETTE.indigo, gradientId = "gradA" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom} stopOpacity={0.35} />
            <stop offset="100%" stopColor={fillFrom} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartOverlay({ data, salesKey, purchasesKey, salesColor = PALETTE.teal, purchasesColor = PALETTE.slate }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradSalesOverlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={salesColor} stopOpacity={0.30} />
            <stop offset="100%" stopColor={salesColor} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gradPurchOverlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={purchasesColor} stopOpacity={0.30} />
            <stop offset="100%" stopColor={purchasesColor} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey={salesKey}
          name="Sales"
          stroke={salesColor}
          fill="url(#gradSalesOverlay)"
          strokeWidth={2}
          isAnimationActive
          animationDuration={700}
        />
        <Area
          type="monotone"
          dataKey={purchasesKey}
          name="Purchases"
          stroke={purchasesColor}
          fill="url(#gradPurchOverlay)"
          strokeWidth={2}
          isAnimationActive
          animationDuration={700}
        />
        <Legend verticalAlign="bottom" height={24} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartBar({ data, xKey, yKey, fill = PALETTE.emerald }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar
          dataKey={yKey}
          fill={fill}
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Legend verticalAlign="bottom" height={24} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="70%"
          innerRadius="45%"
          paddingAngle={2}
          isAnimationActive
          animationDuration={700}
        >
          {data.map((d, i) => (
            <Cell key={`pie-${i}`} fill={d.color || PALETTE.gray} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

/* -------------------- utils -------------------- */
function formatCurrency(n = 0) {
  const val = Number(n) || 0;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(val);
}
