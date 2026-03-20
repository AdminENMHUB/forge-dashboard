"use client";

import { formatUSD } from "@/lib/formatters";

/** Status badge with color coding */
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    halted: "bg-red-500/20 text-red-400 border-red-500/30",
    degraded: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] || colors.unknown}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

/** P&L value with green/red/gray coloring */
export function PnlText({ value }: { value: number }) {
  if (value > 0) return <span className="font-semibold text-emerald-400">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="font-semibold text-red-400">{formatUSD(value)}</span>;
  return <span className="text-gray-400">{formatUSD(value)}</span>;
}

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

/** Animated skeleton placeholder for loading states */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded-md bg-gray-800 ${className}`} style={style} />;
}

/** Full skeleton card matching MetricCard dimensions */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-1 h-7 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

/** Skeleton for swarm cards */
export function SwarmCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-1 h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the revenue chart area */
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="flex items-end gap-1" style={{ height: 200 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${20 + ((i * 37 + 13) % 80)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for activity feed items */
export function ActivityFeedSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the SaaS products grid */
export function SaasGridSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-800 p-2">
            <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
