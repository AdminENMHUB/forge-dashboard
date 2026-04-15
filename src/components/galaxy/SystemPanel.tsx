"use client";

import { useMemo } from "react";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { StatusBadge, PnlText } from "@/components/ui";
import type { SwarmData } from "@/types/empire";
import type { SwarmMeta } from "./constants";
import type { AgentScorecard, ActivityData, FinancialsData, TelemetryData } from "./useGalaxyData";
import type { OrchestratorSummary } from "@/types/empire";

interface Props {
  systemKey: string;
  meta: SwarmMeta | null;
  swarmData: SwarmData | null;
  agents: AgentScorecard[];
  activity: ActivityData | null;
  financials: FinancialsData | null;
  telemetry: TelemetryData | null;
  orchestrator: OrchestratorSummary | null;
  onSelectAgent: (name: string) => void;
  onClose: () => void;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
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

export function SystemPanel({
  systemKey,
  meta,
  swarmData,
  agents,
  activity,
  financials,
  telemetry,
  orchestrator,
  onSelectAgent,
  onClose,
}: Props) {
  const accentColor = meta?.color.getStyle() ?? "#22d3ee";
  const swarmFinancials = financials?.swarms?.[systemKey];
  const extended = swarmData as Record<string, unknown> | null;
  const swarmType = swarmData?.swarm_type ?? "trading";
  const isTrading =
    swarmType === "trading" || swarmType === "prediction_market" || swarmType === "defi";
  const cn = swarmData?.config_notes as Record<string, unknown> | undefined;

  const topPerformer = useMemo(() => {
    if (agents.length === 0) return null;
    return agents.reduce((best, a) => ((a.rating ?? 0) > (best.rating ?? 0) ? a : best), agents[0]);
  }, [agents]);

  const recentEvents = (activity?.events ?? [])
    .filter((e) => {
      const swarmHint = e.swarm?.toLowerCase() ?? "";
      const keyLower = systemKey.toLowerCase();
      return swarmHint.includes(keyLower) || keyLower.includes(swarmHint);
    })
    .slice(0, 8);

  const riskInfo = useMemo(() => {
    if (!extended || !isTrading) return null;
    return {
      circuitBreaker: !!extended.circuit_breaker,
      regime: extended.regime as string | undefined,
      consecutiveLosses: extended.consecutive_losses as number | undefined,
      dailyLoss: extended.daily_loss as number | undefined,
      dailyLossLimit: extended.daily_loss_limit as number | undefined,
      weeklyDrawdown: extended.weekly_drawdown as number | undefined,
    };
  }, [extended, isTrading]);

  const dailyCost = telemetry?.costs?.total_daily ?? 0;

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
          {/* Status — universal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Status</p>
              <StatusBadge status={swarmData?.status ?? "unknown"} />
            </div>

            {/* Trading swarms: P&L, Portfolio, Win Rate */}
            {isTrading && (
              <>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Daily P&L
                  </p>
                  <PnlText value={swarmData?.daily_pnl ?? 0} />
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Portfolio
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatUSD(swarmData?.portfolio_value ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Win Rate
                  </p>
                  <p className="text-sm font-bold text-white">
                    {((swarmData?.win_rate ?? 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </>
            )}

            {/* SaaS swarms: MRR, Products, ARR */}
            {swarmType === "saas" && (
              <>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">MRR</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatUSD(swarmData?.mrr ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Products
                  </p>
                  <p className="text-sm font-bold text-white">{String(cn?.total_products ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">ARR</p>
                  <p className="text-sm font-bold text-white">
                    {formatUSD(Number(cn?.total_arr ?? 0))}
                  </p>
                </div>
              </>
            )}

            {/* Signals swarm: MRR, Subscribers, Yield */}
            {swarmType === "signals" && (
              <>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">MRR</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatUSD(swarmData?.mrr ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Subscribers
                  </p>
                  <p className="text-sm font-bold text-white">
                    {String(cn?.active_subscribers ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    AAVE Yield
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatUSD(Number(cn?.total_yield_earned ?? 0))}
                  </p>
                </div>
              </>
            )}

            {/* Growth swarm: MRR, Live Products, Launch Rate */}
            {swarmType === "growth" && (
              <>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">MRR</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatUSD(swarmData?.mrr ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Live Products
                  </p>
                  <p className="text-sm font-bold text-white">{String(cn?.live_products ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Queue</p>
                  <p className="text-sm font-bold text-white">
                    {String(cn?.opportunity_queue ?? 0)}
                  </p>
                </div>
              </>
            )}

            {/* Monitoring swarm: Apps status */}
            {swarmType === "monitoring" && (
              <>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Healthy Apps
                  </p>
                  <p className="text-sm font-bold text-emerald-400">
                    {String(cn?.apps_healthy ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">Down</p>
                  <p className="text-sm font-bold text-red-400">{String(cn?.apps_down ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="mb-1 text-[10px] tracking-wider text-white/30 uppercase">
                    Degraded
                  </p>
                  <p className="text-sm font-bold text-amber-400">
                    {String(cn?.apps_degraded ?? 0)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Extended metrics — trading swarms only */}
          <div className="grid grid-cols-3 gap-2">
            {isTrading && (swarmData?.open_positions ?? 0) > 0 && (
              <MiniMetric label="Positions" value={String(swarmData?.open_positions)} />
            )}
            {isTrading && (swarmData?.trades_today ?? 0) > 0 && (
              <MiniMetric label="Trades Today" value={String(swarmData?.trades_today)} />
            )}
            {swarmType === "signals" && Number(cn?.signals_delivered ?? 0) > 0 && (
              <MiniMetric label="Signals Sent" value={String(cn?.signals_delivered)} />
            )}
            {swarmType === "saas" && Number(cn?.campaigns_sent ?? 0) > 0 && (
              <MiniMetric label="Campaigns" value={String(cn?.campaigns_sent)} />
            )}
            {dailyCost > 0 && <MiniMetric label="LLM Cost" value={`$${dailyCost.toFixed(2)}/d`} />}
          </div>

          {/* Risk summary (TradeBot / EchoSwarm) */}
          {riskInfo && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] tracking-wider text-white/30 uppercase">Risk Engine</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {riskInfo.regime && (
                  <div>
                    <p className="text-white/30">Regime</p>
                    <p
                      className={`font-semibold ${riskInfo.regime.toLowerCase().includes("bull") ? "text-emerald-400" : riskInfo.regime.toLowerCase().includes("bear") ? "text-red-400" : "text-blue-400"}`}
                    >
                      {riskInfo.regime.toUpperCase()}
                    </p>
                  </div>
                )}
                {riskInfo.consecutiveLosses !== undefined && (
                  <div>
                    <p className="text-white/30">Consec. Losses</p>
                    <p
                      className={`font-semibold ${riskInfo.consecutiveLosses >= 3 ? "text-red-400" : "text-white"}`}
                    >
                      {riskInfo.consecutiveLosses}
                    </p>
                  </div>
                )}
                {riskInfo.dailyLoss !== undefined && riskInfo.dailyLossLimit !== undefined && (
                  <div className="col-span-2">
                    <p className="text-white/30">
                      Daily Loss: {formatUSD(riskInfo.dailyLoss)} /{" "}
                      {formatUSD(riskInfo.dailyLossLimit)}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((riskInfo.dailyLoss / riskInfo.dailyLossLimit) * 100, 100)}%`,
                          backgroundColor:
                            riskInfo.dailyLoss / riskInfo.dailyLossLimit > 0.75
                              ? "#ef4444"
                              : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                )}
                {riskInfo.circuitBreaker && (
                  <div className="col-span-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                    <p className="text-[10px] font-semibold text-red-400">CIRCUIT BREAKER ACTIVE</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Orchestrator data */}
          {orchestrator?.orchestrator && (
            <div className="grid grid-cols-3 gap-2">
              <MiniMetric
                label="Teams"
                value={String(orchestrator.orchestrator.active_teams ?? 0)}
              />
              <MiniMetric label="Queue" value={String(orchestrator.pool?.queued ?? 0)} />
              <MiniMetric
                label="Success"
                value={`${((orchestrator.orchestrator.recent_success_rate ?? 0) * 100).toFixed(0)}%`}
              />
            </div>
          )}

          {/* Agent roster */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] tracking-wider text-white/30 uppercase">
                Agents ({agents.length})
              </p>
              {topPerformer && topPerformer.rating && topPerformer.rating >= 4 && (
                <span className="text-[9px] text-emerald-400">
                  Top: {topPerformer.name.replace(/_/g, " ")} ({topPerformer.rating.toFixed(1)})
                </span>
              )}
            </div>
            <div className="space-y-1">
              {agents.slice(0, 15).map((a) => (
                <button
                  key={a.name}
                  onClick={() => onSelectAgent(a.name)}
                  className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <span className="text-xs text-white/80">{a.name.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    {a.error_rate !== undefined && a.error_rate > 0.05 && (
                      <span className="text-[9px] text-red-400">
                        {(a.error_rate * 100).toFixed(0)}% err
                      </span>
                    )}
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
