"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   SHARED CHART STYLES
   ═══════════════════════════════════════════════════════════════════ */

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "rgba(12, 16, 23, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    fontSize: "12px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    padding: "8px 12px",
  },
  labelStyle: { color: "#8892a8", fontSize: "11px", marginBottom: "4px" },
  itemStyle: { color: "#eef0f6", fontSize: "12px" },
};

const AXIS_TICK = { fontSize: 10, fill: "#525d73" };
const GRID_STROKE = "rgba(255, 255, 255, 0.04)";

/* ═══════════════════════════════════════════════════════════════════
   P&L AREA CHART — gradient fill with glow
   ═══════════════════════════════════════════════════════════════════ */

export function PnlAreaChart({ data }: { data: Array<{ date: string; pnl: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pnlCyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          tickFormatter={(v) => v.slice(5)}
          axisLine={{ stroke: GRID_STROKE }}
          tickLine={false}
        />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`$${Number(v).toFixed(2)}`, "P&L"]} />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="url(#pnlCyan)"
          fill="url(#pnlGreen)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#22d3ee", stroke: "#06080f", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SWARM COST CHART — revenue vs cost bars with rounded corners
   ═══════════════════════════════════════════════════════════════════ */

export function SwarmCostChart({
  data,
}: {
  data: Array<{ name: string; revenue: number; cost: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} opacity={0.85} />
        <Bar dataKey="cost" fill="#ef4444" name="API Cost" radius={[4, 4, 0, 0]} opacity={0.65} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#8892a8" }}
          iconType="circle"
          iconSize={8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COST DONUT — premium gradient cells
   ═══════════════════════════════════════════════════════════════════ */

const PIE_COLORS = ["#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

export function CostDonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#8892a8" }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
