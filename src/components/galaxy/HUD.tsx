"use client";

import { useMemo } from "react";
import { formatUSD } from "@/lib/formatters";
import type { SwarmMeta, ZoomLevel } from "./constants";
import type { GalaxyData, AgentScorecard } from "./useGalaxyData";

interface Props {
  data: GalaxyData;
  zoomLevel: ZoomLevel;
  selectedSystem: SwarmMeta | null;
  selectedAgent: AgentScorecard | null;
  onBack: () => void;
  onHome: () => void;
  proposalCount: number;
}

function PnlSparkline({ history }: { history: Array<{ date: string; pnl: number }> }) {
  if (!history || history.length < 2) return null;
  const values = history.slice(-7).map((h) => h.pnl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 36;
  const h = 16;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const lastPnl = values[values.length - 1];
  const color = lastPnl >= 0 ? "#10b981" : "#ef4444";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ml-1 inline-block align-middle">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HUD({
  data,
  zoomLevel,
  selectedSystem,
  selectedAgent,
  onBack,
  onHome,
  proposalCount,
}: Props) {
  const empire = data.status?.empire;
  const swarmCount = data.status?.swarms ? Object.keys(data.status.swarms).length : 0;
  const agentCount = data.scorecards?.agents?.length ?? 0;

  const healthPct = useMemo(() => {
    if (!data.health?.services) return 100;
    const entries = Object.values(data.health.services);
    if (entries.length === 0) return 100;
    const up = entries.filter(
      (s) => s.status === "running" || s.status === "healthy" || s.status === "online",
    ).length;
    return Math.round((up / entries.length) * 100);
  }, [data.health]);

  const tradebot = data.status?.swarms?.EganTradeBot as Record<string, unknown> | undefined;
  const regime = tradebot?.regime as string | undefined;
  const regimeColor = regime?.toLowerCase().includes("bull")
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : regime?.toLowerCase().includes("bear")
      ? "text-red-400 border-red-500/30 bg-red-500/10"
      : "text-blue-400 border-blue-500/30 bg-blue-500/10";

  const pnlHistory = (data.financials as Record<string, unknown>)?.daily_pnl_history as
    | Array<{ date: string; pnl: number }>
    | undefined;

  return (
    <>
      {/* Top KPI bar */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20">
        <div className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-3">
          {/* Logo + Health */}
          <div className="mr-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
              <span className="text-sm font-black text-cyan-400">EF</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white">Galaxy Map</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[9px] text-cyan-400/60">EGAN FORGE</p>
                <span
                  className={`text-[9px] font-semibold ${healthPct >= 90 ? "text-emerald-400" : healthPct >= 60 ? "text-amber-400" : "text-red-400"}`}
                >
                  {healthPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <KPIChip
              label="Portfolio"
              value={formatUSD(empire?.combined_portfolio_value ?? 0)}
              color="cyan"
            />
            <div className="flex items-center">
              <KPIChip
                label="Daily P&L"
                value={formatUSD(empire?.combined_daily_pnl ?? 0)}
                color={(empire?.combined_daily_pnl ?? 0) >= 0 ? "emerald" : "red"}
              />
              {pnlHistory && pnlHistory.length > 1 && <PnlSparkline history={pnlHistory} />}
            </div>
            <KPIChip label="MRR" value={formatUSD(empire?.combined_mrr ?? 0)} color="blue" />
            <KPIChip label="Swarms" value={String(swarmCount)} color="purple" />
            <KPIChip label="Agents" value={String(agentCount)} color="amber" />

            {/* Regime badge */}
            {regime && (
              <div
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${regimeColor}`}
              >
                {regime}
              </div>
            )}

            {proposalCount > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold text-amber-400">
                  {proposalCount} PROPOSAL{proposalCount > 1 ? "S" : ""}
                </span>
              </div>
            )}
          </div>

          {data.lastUpdate && (
            <span className="hidden text-[9px] text-white/30 lg:block">{data.lastUpdate}</span>
          )}
        </div>
      </div>

      {/* Zoom breadcrumb + back nav */}
      {zoomLevel !== "galaxy" && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 p-4">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={onHome}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur transition hover:border-cyan-500/30 hover:text-cyan-400"
            >
              Galaxy
            </button>
            {zoomLevel === "system" && selectedSystem && (
              <>
                <span className="text-white/20">/</span>
                <span
                  className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold backdrop-blur"
                  style={{
                    borderColor: `${selectedSystem.color.getStyle()}40`,
                    color: selectedSystem.color.getStyle(),
                    backgroundColor: `${selectedSystem.color.getStyle()}15`,
                  }}
                >
                  {selectedSystem.label}
                </span>
              </>
            )}
            {zoomLevel === "agent" && selectedAgent && (
              <>
                <span className="text-white/20">/</span>
                <button
                  onClick={onBack}
                  className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur transition hover:border-cyan-500/30 hover:text-cyan-400"
                >
                  {selectedSystem?.label}
                </button>
                <span className="text-white/20">/</span>
                <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                  {selectedAgent.name.replace(/_/g, " ")}
                </span>
              </>
            )}

            <button
              onClick={onBack}
              className="ml-2 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur transition hover:border-white/20 hover:text-white"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Interaction hint */}
      {zoomLevel === "galaxy" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <p className="text-[10px] tracking-widest text-white/20 uppercase">
            Click a star to explore · Scroll to zoom · Drag to orbit
          </p>
        </div>
      )}

      {/* Error strip */}
      {data.errors.length > 0 && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-20 max-w-xs">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-medium text-red-400">
              {data.errors.length} API error{data.errors.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {data.loading && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
            <p className="text-xs tracking-widest text-cyan-400/60 uppercase">Scanning Empire</p>
          </div>
        </div>
      )}
    </>
  );
}

function KPIChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "cyan" | "emerald" | "blue" | "purple" | "amber" | "red";
}) {
  const colorMap: Record<string, string> = {
    cyan: "border-cyan-500/20 text-cyan-400",
    emerald: "border-emerald-500/20 text-emerald-400",
    blue: "border-blue-500/20 text-blue-400",
    purple: "border-purple-500/20 text-purple-400",
    amber: "border-amber-500/20 text-amber-400",
    red: "border-red-500/20 text-red-400",
  };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border bg-black/40 px-2.5 py-1 backdrop-blur ${colorMap[color]}`}
    >
      <span className="text-[9px] tracking-wider text-white/40 uppercase">{label}</span>
      <span className="text-[11px] font-bold">{value}</span>
    </div>
  );
}
