"use client";

import { formatUSD } from "@/lib/formatters";

export function MetricCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">{label}</p>
      <p className={`text-2xl font-bold ${accent || ""}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}

export type SwarmStatus =
  | "healthy"
  | "active"
  | "halted"
  | "degraded"
  | "offline"
  | "expired"
  | "unknown";

const statusColors: Record<SwarmStatus, string> = {
  healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  halted: "bg-red-500/20 text-red-400 border-red-500/30",
  degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offline: "bg-red-500/20 text-red-400 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function StatusBadge({ status }: { status: SwarmStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.unknown}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function PnlText({ value }: { value: number }) {
  if (value > 0) return <span className="font-semibold text-emerald-400">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="font-semibold text-red-400">{formatUSD(value)}</span>;
  return <span className="text-gray-400">{formatUSD(value)}</span>;
}
