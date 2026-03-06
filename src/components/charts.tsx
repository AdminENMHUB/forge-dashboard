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
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "#9ca3af" },
};

const AXIS_TICK = { fontSize: 10, fill: "#6b7280" };

/** 30-day P&L area chart — green above zero, red below */
export function PnlAreaChart({
  data,
}: {
  data: Array<{ date: string; pnl: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "P&L"]}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="#10b981"
          fill="url(#pnlGreen)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Per-swarm revenue vs cost bar chart */
export function SwarmCostChart({
  data,
}: {
  data: Array<{ name: string; revenue: number; cost: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}`} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar
          dataKey="revenue"
          fill="#10b981"
          name="Revenue"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="cost"
          fill="#ef4444"
          name="API Cost"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

/** Cost breakdown donut chart by provider/swarm */
export function CostDonutChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
