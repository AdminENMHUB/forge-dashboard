"use client";

import { formatUSD, timeAgo } from "@/lib/formatters";
import { StatusBadge, PnlText } from "@/components/ui";
import type { SwarmData } from "@/types/empire";
import type { SwarmMeta } from "./constants";
import type { AgentScorecard, ActivityData, FinancialsData } from "./useGalaxyData";

interface Props {
  systemKey: string;
  meta: SwarmMeta | null;
  swarmData: SwarmData | null;
  agents: AgentScorecard[];
  activity: ActivityData | null;
  financials: FinancialsData | null;
  onSelectAgent: (name: string) => void;
  onClose: () => void;
}

export function SystemPanel({
  systemKey,
  meta,
  swarmData,
  agents,
  activity,
  financials,
  onSelectAgent,
  onClose,
}: Props) {
  const accentColor = meta?.color.getStyle() ?? "#22d3ee";
  const swarmFinancials = financials?.swarms?.[systemKey];

  const recentEvents = (activity?.events ?? [])
    .filter((e) => {
      const swarmHint = e.swarm?.toLowerCase() ?? "";
      const keyLower = systemKey.toLowerCase();
      return swarmHint.includes(keyLower) || keyLower.includes(swarmHint);
    })
    .slice(0, 8);

  return (
    <div className="animate-in absolute top-14 right-0 bottom-0 z-20 w-80 overflow-hidden border-l border-white/[0.06] lg:w-96">
      <div className="flex h-full flex-col bg-[#06080f]/90 backdrop-blur-xl">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: `${accentColor}20` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}60` }}
            />
            <h3 className="text-sm font-bold text-white">{meta?.label ?? systemKey}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Status + P&L */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Status</p>
              <StatusBadge status={swarmData?.status ?? "unknown"} />
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Daily P&L</p>
              <PnlText value={swarmData?.daily_pnl ?? 0} />
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Portfolio</p>
              <p className="text-sm font-bold text-white">
                {formatUSD(swarmData?.portfolio_value ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Win Rate</p>
              <p className="text-sm font-bold text-white">
                {((swarmData?.win_rate ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Extended metrics */}
          <div className="grid grid-cols-3 gap-2">
            {swarmData?.open_positions !== undefined && (
              <MiniMetric label="Positions" value={String(swarmData.open_positions)} />
            )}
            {swarmData?.trades_today !== undefined && (
              <MiniMetric label="Trades Today" value={String(swarmData.trades_today)} />
            )}
            {swarmData?.mrr !== undefined && swarmData.mrr > 0 && (
              <MiniMetric label="MRR" value={formatUSD(swarmData.mrr)} />
            )}
            {swarmData?.circuit_breaker && (
              <div className="col-span-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <p className="text-[10px] font-semibold text-red-400">CIRCUIT BREAKER ACTIVE</p>
              </div>
            )}
          </div>

          {/* Financials */}
          {swarmFinancials && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] tracking-wider text-white/30 uppercase">Financials</p>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-white/30">Revenue</p>
                  <p className="font-semibold text-emerald-400">
                    {formatUSD(swarmFinancials.revenue ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-white/30">Costs</p>
                  <p className="font-semibold text-red-400">
                    {formatUSD(swarmFinancials.costs ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-white/30">Net</p>
                  <PnlText value={swarmFinancials.pnl ?? 0} />
                </div>
              </div>
            </div>
          )}

          {/* Agent roster */}
          <div>
            <p className="mb-2 text-[10px] tracking-wider text-white/30 uppercase">
              Agents ({agents.length})
            </p>
            <div className="space-y-1">
              {agents.slice(0, 15).map((a) => (
                <button
                  key={a.name}
                  onClick={() => onSelectAgent(a.name)}
                  className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <span className="text-xs text-white/80">{a.name.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    {a.rating && (
                      <span
                        className={`text-[10px] font-bold ${
                          a.rating >= 4
                            ? "text-emerald-400"
                            : a.rating >= 3
                              ? "text-blue-400"
                              : "text-amber-400"
                        }`}
                      >
                        {a.rating.toFixed(1)}★
                      </span>
                    )}
                    {a.pdp?.active && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                        PDP
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {agents.length === 0 && (
                <p className="px-3 py-2 text-xs text-white/20">No agent scorecards available</p>
              )}
            </div>
          </div>

          {/* Activity feed */}
          {recentEvents.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] tracking-wider text-white/30 uppercase">
                Recent Activity
              </p>
              <div className="space-y-1.5">
                {recentEvents.map((evt, i) => (
                  <div key={evt.id ?? i} className="flex items-start gap-2 text-[11px]">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <p className="flex-1 text-white/60">{evt.message ?? evt.type}</p>
                    {evt.ts && <span className="shrink-0 text-white/20">{timeAgo(evt.ts)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center">
      <p className="text-[11px] font-bold text-white">{value}</p>
      <p className="text-[9px] text-white/30">{label}</p>
    </div>
  );
}
