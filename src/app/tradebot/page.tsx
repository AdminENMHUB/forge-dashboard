"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { MetricCard, StatusBadge, PnlText, SectionCard } from "@/components/ui";

interface Strategy {
  name: string;
  win_rate: number;
  pnl: number;
  weight: number;
}

interface Position {
  symbol: string;
  entry_price: number;
  current_price: number;
  pnl_pct: number;
  age: string;
  strategy: string;
}

interface Trade {
  timestamp: string;
  symbol: string;
  side: string;
  price: number;
  size: number;
  strategy: string;
  pnl: number;
}

interface TradeBotData {
  available: boolean;
  portfolio_value: number;
  total_pnl: number;
  win_rate: number;
  trades_today: number;
  regime: string;
  fear_greed: { value: number; label: string };
  circuit_breaker: { halted: boolean; daily_loss: number; limit: number };
  strategies: Strategy[];
  open_positions: Position[];
  recent_trades: Trade[];
  last_updated: string;
}

const REGIME_COLORS: Record<string, string> = {
  BULL: "text-emerald-400",
  BEAR: "text-red-400",
  RANGE: "text-amber-400",
};

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct <= 25
      ? "text-red-400"
      : pct <= 45
        ? "text-orange-400"
        : pct <= 55
          ? "text-amber-400"
          : pct <= 75
            ? "text-emerald-400"
            : "text-green-400";
  const barColor =
    pct <= 25
      ? "bg-red-500"
      : pct <= 45
        ? "bg-orange-500"
        : pct <= 55
          ? "bg-amber-500"
          : pct <= 75
            ? "bg-emerald-500"
            : "bg-green-500";

  return (
    <div className="glass rounded-xl p-4">
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
        Fear & Greed Index
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${color}`}>{pct}</span>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className={`h-1.5 rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>Extreme Fear</span>
        <span>Extreme Greed</span>
      </div>
    </div>
  );
}

function CircuitBreakerCard({ cb }: { cb: TradeBotData["circuit_breaker"] }) {
  const pct = cb.limit > 0 ? (Math.abs(cb.daily_loss) / cb.limit) * 100 : 0;
  return (
    <div className={`glass rounded-xl p-4 ${cb.halted ? "border border-red-500/30" : ""}`}>
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
        Circuit Breaker
      </p>
      <div className="flex items-center gap-2">
        <StatusBadge status={cb.halted ? "halted" : "running"} />
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className={`h-1.5 rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
        {formatUSD(Math.abs(cb.daily_loss))} / {formatUSD(cb.limit)} daily limit
      </p>
    </div>
  );
}

export default function TradeBotPage() {
  const { data, error, lastUpdate } = useApiPoller<TradeBotData>("/api/tradebot", 15000);

  return (
    <PageShell
      title="TradeBot Deep Dive"
      subtitle="Binance crypto trading \u00b7 5-min cycles"
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
              label="Portfolio Value"
              value={formatUSD(data.portfolio_value)}
              accent="text-cyan-400"
              glow="cyan"
            />
            <MetricCard label="Total P&L" value={<PnlText value={data.total_pnl} />} />
            <MetricCard
              label="Win Rate"
              value={`${(data.win_rate * 100).toFixed(1)}%`}
              accent={data.win_rate >= 0.5 ? "text-emerald-400" : "text-red-400"}
            />
            <MetricCard label="Trades Today" value={data.trades_today} accent="text-white" />
            <MetricCard
              label="Market Regime"
              value={data.regime}
              accent={REGIME_COLORS[data.regime] || "text-gray-400"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FearGreedGauge value={data.fear_greed.value} label={data.fear_greed.label} />
            <CircuitBreakerCard cb={data.circuit_breaker} />
          </div>

          <SectionCard
            title="Strategy Performance"
            subtitle={`${data.strategies.length} strategies`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                    <th className="pb-2 text-left">Strategy</th>
                    <th className="pb-2 text-right">Win Rate</th>
                    <th className="pb-2 text-right">P&L</th>
                    <th className="pb-2 text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {data.strategies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[var(--text-tertiary)]">
                        No strategy data available
                      </td>
                    </tr>
                  ) : (
                    data.strategies.map((s) => (
                      <tr key={s.name} className="border-b border-[var(--border-dim)]/50">
                        <td className="py-2.5 font-medium text-white">{s.name}</td>
                        <td
                          className={`py-2.5 text-right font-mono ${s.win_rate >= 0.5 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {(s.win_rate * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right">
                          <PnlText value={s.pnl} />
                        </td>
                        <td className="py-2.5 text-right font-mono text-[var(--text-secondary)]">
                          {(s.weight * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Open Positions" subtitle={`${data.open_positions.length} active`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                    <th className="pb-2 text-left">Symbol</th>
                    <th className="pb-2 text-right">Entry</th>
                    <th className="pb-2 text-right">Current</th>
                    <th className="pb-2 text-right">P&L %</th>
                    <th className="pb-2 text-right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {data.open_positions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--text-tertiary)]">
                        No open positions
                      </td>
                    </tr>
                  ) : (
                    data.open_positions.map((p, i) => (
                      <tr
                        key={`${p.symbol}-${i}`}
                        className="border-b border-[var(--border-dim)]/50"
                      >
                        <td className="py-2.5">
                          <span className="font-medium text-white">{p.symbol}</span>
                          <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                            {p.strategy}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-[var(--text-secondary)]">
                          {formatUSD(p.entry_price)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-white">
                          {formatUSD(p.current_price)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-semibold ${p.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {p.pnl_pct >= 0 ? "+" : ""}
                          {(p.pnl_pct * 100).toFixed(2)}%
                        </td>
                        <td className="py-2.5 text-right text-[var(--text-tertiary)]">{p.age}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Recent Trades" subtitle={`Last ${data.recent_trades.length}`}>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--surface-1)]">
                  <tr className="border-b border-[var(--border-dim)] text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                    <th className="pb-2 text-left">Time</th>
                    <th className="pb-2 text-left">Symbol</th>
                    <th className="pb-2 text-center">Side</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Size</th>
                    <th className="pb-2 text-left">Strategy</th>
                    <th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_trades.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[var(--text-tertiary)]">
                        No recent trades
                      </td>
                    </tr>
                  ) : (
                    data.recent_trades.map((t, i) => (
                      <tr
                        key={`${t.timestamp}-${i}`}
                        className="border-b border-[var(--border-dim)]/50"
                      >
                        <td className="py-2 text-[var(--text-tertiary)]">{timeAgo(t.timestamp)}</td>
                        <td className="py-2 font-medium text-white">{t.symbol}</td>
                        <td className="py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              t.side === "BUY"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono text-[var(--text-secondary)]">
                          {formatUSD(t.price)}
                        </td>
                        <td className="py-2 text-right font-mono text-[var(--text-secondary)]">
                          {t.size.toFixed(4)}
                        </td>
                        <td className="py-2 text-[var(--text-tertiary)]">{t.strategy}</td>
                        <td className="py-2 text-right">
                          <PnlText value={t.pnl} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <footer className="border-t border-[var(--border-dim)] pt-6 text-center text-xs text-[var(--text-muted)]">
            TradeBot | Binance Spot | 5-min cycles | Auto-refreshes every 15s
            {data.last_updated && (
              <span className="ml-2">| VPS data: {timeAgo(data.last_updated)}</span>
            )}
          </footer>
        </div>
      )}
    </PageShell>
  );
}
