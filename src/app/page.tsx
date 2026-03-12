"use client";

import Link from "next/link";
import { useApiPoller } from "@/lib/hooks";
import { formatUSD, formatPct } from "@/lib/formatters";
import { MetricCard, StatusBadge, PnlText, type SwarmStatus } from "@/components/ui";

interface SwarmData {
  status: SwarmStatus;
  daily_pnl: number;
  total_pnl: number;
  portfolio_value: number;
  mrr: number;
  open_positions: number;
  trades_today: number;
  win_rate: number;
  circuit_breaker: boolean;
  sampled_at: string;
}

interface EmpireData {
  combined_daily_pnl: number;
  combined_total_pnl: number;
  combined_portfolio_value: number;
  combined_mrr: number;
  combined_arr: number;
  stripe_mrr: number;
  web3_mrr: number;
  peak_daily_pnl: number;
  peak_portfolio: number;
  cycle_count: number;
  milestones: string[];
}

interface StatusResponse {
  timestamp: string;
  empire: EmpireData;
  swarms: Record<string, SwarmData>;
  tradebot: {
    halted: boolean;
    halt_reason: string | null;
    positions: string[];
    daily_pnl_today: number;
    total_pnl: number;
    trade_count_today: number;
    market_regime: string;
  };
  saas: {
    total_mrr: number;
    total_products: number;
    live_products: number;
    opportunity_queue: number;
  };
}

function SwarmCard({ name, data }: { name: string; data: SwarmData }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {name.replace("Egan", "").replace("Swarm", " Swarm")}
        </h3>
        <StatusBadge status={data.circuit_breaker ? "halted" : data.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Portfolio</p>
          <p className="font-medium">{formatUSD(data.portfolio_value)}</p>
        </div>
        <div>
          <p className="text-gray-500">Daily P&L</p>
          <PnlText value={data.daily_pnl} />
        </div>
        <div>
          <p className="text-gray-500">Total P&L</p>
          <PnlText value={data.total_pnl} />
        </div>
        <div>
          <p className="text-gray-500">Positions</p>
          <p className="font-medium">{data.open_positions}</p>
        </div>
        <div>
          <p className="text-gray-500">Trades Today</p>
          <p className="font-medium">{data.trades_today}</p>
        </div>
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="font-medium">{formatPct(data.win_rate)}</p>
        </div>
        {data.mrr > 0 && (
          <div className="col-span-2">
            <p className="text-gray-500">MRR</p>
            <p className="font-medium text-blue-400">{formatUSD(data.mrr)}/mo</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading, lastUpdate, refresh } = useApiPoller<StatusResponse>(
    "/api/status",
    30000,
  );

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Connection Error</h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-gray-400">Loading Empire Status...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">No Data Available</h1>
          <p className="text-gray-400">Unable to load dashboard data.</p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const e = data.empire;
  const swarmEntries = Object.entries(data.swarms);
  const healthyCount = swarmEntries.filter(
    ([, s]) => s.status === "healthy" && !s.circuit_breaker,
  ).length;
  const progressToGoal = Math.min(
    100,
    ((e.combined_mrr + e.combined_daily_pnl * 30) / 15000) * 100,
  );

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EganForge</h1>
          <p className="text-sm text-gray-500">CEO Command Center | Cycle #{e.cycle_count}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/financials"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-emerald-700"
          >
            Financials
          </Link>
          <Link
            href="/assets"
            className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-cyan-700"
          >
            Assets
          </Link>
          <Link
            href="/web3"
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-purple-700"
          >
            Web3
          </Link>
          <Link
            href="/proposals"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
          >
            Proposals
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last update: {lastUpdate}</p>
            <p className="text-xs text-gray-500">
              {healthyCount}/{swarmEntries.length} swarms healthy
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      </header>

      {/* Empire KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Portfolio Value"
          value={formatUSD(e.combined_portfolio_value)}
          subtext={`Peak: ${formatUSD(e.peak_portfolio)}`}
        />
        <MetricCard
          label="Daily P&L"
          value={<PnlText value={e.combined_daily_pnl} />}
          subtext={`Peak: ${formatUSD(e.peak_daily_pnl)}`}
        />
        <MetricCard label="Total P&L" value={<PnlText value={e.combined_total_pnl} />} />
        <MetricCard
          label="MRR"
          value={formatUSD(e.combined_mrr)}
          subtext={`Stripe: ${formatUSD(e.stripe_mrr || 0)} · Crypto: ${formatUSD(e.web3_mrr || 0)} · ARR: ${formatUSD(e.combined_arr)}`}
        />
      </div>

      {/* Revenue Target Progress */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Progress to $15K/mo Target</p>
          <p className="text-sm text-gray-400">{progressToGoal.toFixed(1)}%</p>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-800">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progressToGoal)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Current run rate: {formatUSD(e.combined_mrr + e.combined_daily_pnl * 30)}/mo (MRR:{" "}
          {formatUSD(e.combined_mrr)} + Trading: {formatUSD(e.combined_daily_pnl * 30)}/mo est.)
        </p>
      </div>

      {/* TradeBot Quick View */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">TradeBot Live</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              data.tradebot.halted
                ? "bg-red-500/20 text-red-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {data.tradebot.halted
              ? `HALTED: ${data.tradebot.halt_reason}`
              : `REGIME: ${data.tradebot.market_regime}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-500">Positions: </span>
            <span className="font-mono">{data.tradebot.positions.join(", ") || "None"}</span>
          </div>
          <div>
            <span className="text-gray-500">Trades Today: </span>
            <span>{data.tradebot.trade_count_today}</span>
          </div>
        </div>
      </div>

      {/* SaaS Factory */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-lg font-semibold">SaaS Factory</h2>
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <p className="text-2xl font-bold text-blue-400">{data.saas.live_products}</p>
            <p className="text-gray-500">Live Products</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatUSD(data.saas.total_mrr)}</p>
            <p className="text-gray-500">MRR</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{data.saas.opportunity_queue}</p>
            <p className="text-gray-500">In Queue</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.saas.total_products}</p>
            <p className="text-gray-500">Total Products</p>
          </div>
        </div>
      </div>

      {/* Swarm Cards */}
      <h2 className="mb-4 text-xl font-bold">Swarms</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {swarmEntries.map(([name, swarm]) => (
          <SwarmCard key={name} name={name} data={swarm} />
        ))}
      </div>

      {/* Milestones */}
      {e.milestones.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-3 text-lg font-semibold">Milestones Reached</h2>
          <div className="flex flex-wrap gap-2">
            {e.milestones.map((m) => (
              <span
                key={m}
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
        EganForge v2.0 | CEO: Josh Egan | Powered by Claude Opus, GPT-4o, Grok-3, Gemini |
        Auto-refreshes every 30s
      </footer>
    </div>
  );
}
