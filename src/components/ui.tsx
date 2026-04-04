"use client";

import { formatUSD } from "@/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE — glassmorphic pill with color coding
   ═══════════════════════════════════════════════════════════════════ */

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
    running:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
    online:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
    halted: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.08)]",
    stopped: "bg-red-500/10 text-red-400 border-red-500/20",
    degraded:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.08)]",
    unknown: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${styles[status] || styles.unknown}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "healthy" || status === "running" || status === "online"
            ? "pulse-dot bg-emerald-400"
            : status === "halted" || status === "stopped"
              ? "bg-red-400"
              : status === "degraded"
                ? "bg-amber-400"
                : "bg-gray-400"
        }`}
      />
      {status.toUpperCase()}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   P&L TEXT — green/red/gray with +/- sign
   ═══════════════════════════════════════════════════════════════════ */

export function PnlText({ value }: { value: number }) {
  if (value > 0) return <span className="font-semibold text-emerald-400">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="font-semibold text-red-400">{formatUSD(value)}</span>;
  return <span className="text-[var(--text-tertiary)]">{formatUSD(value)}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   METRIC CARD — glassmorphic KPI card with optional glow
   ═══════════════════════════════════════════════════════════════════ */

export function MetricCard({
  label,
  value,
  subtext,
  accent,
  glow,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  accent?: string;
  glow?: "cyan" | "emerald" | "blue" | "red" | "purple" | "amber";
}) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div className={`glass rounded-xl p-4 ${glowClass}`}>
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${accent || "text-white"}`}>{value}</p>
      {subtext && <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{subtext}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON COMPONENTS — shimmer loading states
   ═══════════════════════════════════════════════════════════════════ */

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-md bg-white/[0.04] ${className}`}
      style={{
        ...style,
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-1.5 h-7 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function SwarmCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5">
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

// Pre-computed stable heights for chart skeleton bars
const CHART_SKELETON_HEIGHTS = Array.from({ length: 30 }, (_, i) => 20 + ((i * 37 + 13) % 80));

export function ChartSkeleton() {
  return (
    <div className="glass rounded-xl p-5">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="flex items-end gap-1" style={{ height: 200 }}>
        {CHART_SKELETON_HEIGHTS.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="glass rounded-xl p-5">
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

export function SaasGridSkeleton() {
  return (
    <div className="glass rounded-xl p-5">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-dim)] p-2"
          >
            <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION CARD — glass container for dashboard sections
   ═══════════════════════════════════════════════════════════════════ */

export function SectionCard({
  title,
  subtitle,
  glow,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  glow?: "cyan" | "emerald" | "blue" | "red" | "purple" | "amber";
  className?: string;
  children: React.ReactNode;
}) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div className={`glass rounded-xl p-5 ${glowClass} ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <span className="text-[11px] text-[var(--text-tertiary)]">{subtitle}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
