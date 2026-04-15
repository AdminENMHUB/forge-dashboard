"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { MetricCard, StatusBadge, PnlText, SectionCard } from "@/components/ui";

interface Bet {
  market: string;
  direction: string;
  entry_price: number;
  current_price: number;
  edge_pct: number;
  pnl: number;
  confidence: number;
  agent: string;
}

interface Container {
  name: string;
  status: string;
  uptime: string;
  image: string;
}

interface ConsensusEntry {
  market: string;
  models: { name: string; signal: string; confidence: number }[];
  outcome: string;
  timestamp: string;
}

interface RiskEngine {
  circuit_breaker: boolean;
  daily_loss: number;
  daily_loss_limit: number;
  consecutive_losses: number;
  max_consecutive: number;
  weekly_drawdown: number;
  weekly_kill_switch: number;
  cooldown_active: boolean;
}

interface EchoSwarmData {
  available: boolean;
  usdc_deployed: number;
  win_rate: number;
  active_positions: number;
  daily_pnl: number;
  total_pnl: number;
  bets: Bet[];
  containers: Container[];
  consensus: ConsensusEntry[];
  risk_engine: RiskEngine;
  last_updated: string;
}

const CONTAINER_STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  exited: "bg-red-500/10 border-red-500/20 text-red-400",
  restarting: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  paused: "bg-gray-500/10 border-gray-500/20 text-gray-400",
};

function RiskPanel({ risk }: { risk: RiskEngine }) {
  const dailyPct =
    risk.daily_loss_limit > 0 ? (Math.abs(risk.daily_loss) / risk.daily_loss_limit) * 100 : 0;
  const weeklyPct =
    risk.weekly_kill_switch > 0
      ? (Math.abs(risk.weekly_drawdown) / risk.weekly_kill_switch) * 100
      : 0;
  const consecutivePct =
    risk.max_consecutive > 0 ? (risk.consecutive_losses / risk.max_consecutive) * 100 : 0;

  return (
    <SectionCard title="Risk Engine" glow={risk.circuit_breaker ? "red" : undefined}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Daily Loss</span>
            <span className="font-mono text-[var(--text-tertiary)]">
              {formatUSD(Math.abs(risk.daily_loss))} / {formatUSD(risk.daily_loss_limit)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-2 rounded-full transition-all ${dailyPct > 80 ? "bg-red-500" : dailyPct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(dailyPct, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Weekly Drawdown</span>
            <span className="font-mono text-[var(--text-tertiary)]">
              {Math.abs(risk.weekly_drawdown).toFixed(1)}% / {risk.weekly_kill_switch}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-2 rounded-full transition-all ${weeklyPct > 80 ? "bg-red-500" : weeklyPct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(weeklyPct, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Consecutive Losses</span>
            <span className="font-mono text-[var(--text-tertiary)]">
              {risk.consecutive_losses} / {risk.max_consecutive}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-2 rounded-full transition-all ${consecutivePct > 80 ? "bg-red-500" : consecutivePct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(consecutivePct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={risk.circuit_breaker ? "halted" : "running"} />
        {risk.cooldown_active && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            48H COOLDOWN
          </span>
        )}
      </div>
    </SectionCard>
  );
}

function ContainerGrid({ containers }: { containers: Container[] }) {
  if (containers.length === 0) {
    return (
      <SectionCard title="Docker Containers" subtitle="15 services">
        <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
          No container data available
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Docker Containers" subtitle={`${containers.length} services`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {containers.map((c) => {
          const style = CONTAINER_STATUS_COLORS[c.status] || CONTAINER_STATUS_COLORS.paused;
          return (
            <div key={c.name} className={`rounded-lg border p-2.5 ${style}`}>
              <p className="truncate text-xs font-semibold">{c.name}</p>
              <p className="mt-0.5 text-[10px] opacity-70">{c.uptime || c.status}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ConsensusLog({ entries }: { entries: ConsensusEntry[] }) {
  if (entries.length === 0) {
    return (
      <SectionCard title="Consensus Breakdown">
        <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
          No consensus data available
        </p>
      </SectionCard>
    );
  }

  const MODEL_COLORS: Record<string, string> = {
    claude: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "gpt-4o": "bg-green-500/20 text-green-400 border-green-500/30",
    grok: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gemini: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <SectionCard title="Consensus Breakdown" subtitle={`Last ${entries.length}`}>
      <div className="max-h-72 space-y-3 overflow-y-auto">
        {entries.map((e, i) => (
          <div key={`${e.timestamp}-${i}`} className="rounded-lg bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white">{e.market}</p>
              <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(e.timestamp)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {e.models.map((m) => {
                const key = m.name.toLowerCase();
                const matched = Object.keys(MODEL_COLORS).find((k) => key.includes(k));
                const style = matched
                  ? MODEL_COLORS[matched]
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30";
                return (
                  <span
                    key={m.name}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}
                  >
                    {m.name}
                    <span
                      className={
                        m.signal === "YES"
                          ? "text-emerald-400"
                          : m.signal === "NO"
                            ? "text-red-400"
                            : "text-gray-400"
                      }
                    >
                      {m.signal}
                    </span>
                    <span className="opacity-60">{m.confidence}%</span>
                  </span>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
              Outcome:{" "}
              <span className="font-semibold text-[var(--text-secondary)]">{e.outcome}</span>
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function EchoSwarmPage() {
  const { data, error, lastUpdate } = useApiPoller<EchoSwarmData>("/api/echoswarm", 20000);

  return (
    <PageShell
      title="EchoSwarm Deep Dive"
      subtitle="Polymarket prediction markets \u00b7 Docker containers"
      lastUpdate={lastUpdate}
      error={error}
    >
      {!data ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <MetricCard
              label="USDC Deployed"
              value={formatUSD(data.usdc_deployed)}
              accent="text-cyan-400"
              glow="cyan"
            />
            <MetricCard
              label="Win Rate"
              value={`${(data.win_rate * 100).toFixed(1)}%`}
              accent={data.win_rate >= 0.5 ? "text-emerald-400" : "text-red-400"}
            />
            <MetricCard
              label="Active Positions"
              value={data.active_positions}
              accent="text-white"
            />
            <MetricCard label="Daily P&L" value={<PnlText value={data.daily_pnl} />} />
            <MetricCard
              label="Total P&L"
              value={<PnlText value={data.total_pnl} />}
              glow={data.total_pnl > 0 ? "emerald" : data.total_pnl < 0 ? "red" : undefined}
            />
          </div>

          <RiskPanel risk={data.risk_engine} />

          <SectionCard title="Active Bets" subtitle={`${data.bets.length} positions`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                    <th className="pb-2 text-left">Market</th>
                    <th className="pb-2 text-center">Dir</th>
                    <th className="pb-2 text-right">Entry</th>
                    <th className="pb-2 text-right">Current</th>
                    <th className="pb-2 text-right">Edge</th>
                    <th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[var(--text-tertiary)]">
                        No active bets
                      </td>
                    </tr>
                  ) : (
                    data.bets.map((b, i) => (
                      <tr
                        key={`${b.market}-${i}`}
                        className="border-b border-[var(--border-dim)]/50"
                      >
                        <td className="max-w-[200px] truncate py-2.5 font-medium text-white lg:max-w-[300px]">
                          {b.market}
                          <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                            {b.agent}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.direction === "YES"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {b.direction}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-[var(--text-secondary)]">
                          {b.entry_price.toFixed(2)}¢
                        </td>
                        <td className="py-2.5 text-right font-mono text-white">
                          {b.current_price.toFixed(2)}¢
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono ${b.edge_pct >= 25 ? "text-emerald-400" : "text-amber-400"}`}
                        >
                          {b.edge_pct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right">
                          <PnlText value={b.pnl} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ContainerGrid containers={data.containers} />
            <ConsensusLog entries={data.consensus} />
          </div>

          <footer className="border-t border-[var(--border-dim)] pt-6 text-center text-xs text-[var(--text-muted)]">
            EchoSwarm | Polymarket | 12 Docker containers | Auto-refreshes every 20s
            {data.last_updated && (
              <span className="ml-2">| VPS data: {timeAgo(data.last_updated)}</span>
            )}
          </footer>
        </div>
      )}
    </PageShell>
  );
}
