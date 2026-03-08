"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUSD, formatPct } from "@/lib/formatters";

// Proxy through our own Next.js API routes to avoid HTTPS→HTTP mixed content
const API_BASE = "";

interface SwarmData {
  status: string;
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    halted: "bg-red-500/20 text-red-400 border-red-500/30",
    degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] || colors.unknown}`}>
      {status.toUpperCase()}
    </span>
  );
}

function PnlText({ value }: { value: number }) {
  if (value > 0) return <span className="text-emerald-400 font-semibold">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="text-red-400 font-semibold">{formatUSD(value)}</span>;
  return <span className="text-gray-400">{formatUSD(value)}</span>;
}

function MetricCard({ label, value, subtext }: { label: string; value: React.ReactNode; subtext?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function SwarmCard({ name, data }: { name: string; data: SwarmData }) {
  const icon: Record<string, string> = {
    EganTradeBot: "chart-line",
    EchoSwarm: "crystal-ball",
    EganSaasFactory: "rocket",
    EganWeb3Swarm: "cube",
    EganGrowthEngine: "trending-up",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{name.replace("Egan", "").replace("Swarm", " Swarm")}</h3>
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
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      setData(json);
      setError("");
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading Empire Status...</p>
        </div>
      </div>
    );
  }

  const e = data.empire;
  const swarmEntries = Object.entries(data.swarms);
  const healthyCount = swarmEntries.filter(([, s]) => s.status === "healthy" && !s.circuit_breaker).length;
  const progressToGoal = Math.min(100, ((e.combined_mrr + (e.combined_daily_pnl * 30)) / 15000) * 100);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EganForge</h1>
          <p className="text-gray-500 text-sm">CEO Command Center | Cycle #{e.cycle_count}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/financials"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Financials
          </Link>
          <Link
            href="/assets"
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors"
          >
            Assets
          </Link>
          <Link
            href="/web3"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Web3
          </Link>
          <Link
            href="/proposals"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        <MetricCard
          label="Total P&L"
          value={<PnlText value={e.combined_total_pnl} />}
        />
        <MetricCard
          label="MRR"
          value={formatUSD(e.combined_mrr)}
          subtext={`Stripe: ${formatUSD(e.stripe_mrr || 0)} · Crypto: ${formatUSD(e.web3_mrr || 0)} · ARR: ${formatUSD(e.combined_arr)}`}
        />
      </div>

      {/* Revenue Target Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">Progress to $15K/mo Target</p>
          <p className="text-sm text-gray-400">{progressToGoal.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressToGoal)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current run rate: {formatUSD(e.combined_mrr + (e.combined_daily_pnl * 30))}/mo
          (MRR: {formatUSD(e.combined_mrr)} + Trading: {formatUSD(e.combined_daily_pnl * 30)}/mo est.)
        </p>
      </div>

      {/* TradeBot Quick View */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">TradeBot Live</h2>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            data.tradebot.halted ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {data.tradebot.halted ? `HALTED: ${data.tradebot.halt_reason}` : `REGIME: ${data.tradebot.market_regime}`}
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-lg mb-3">SaaS Factory</h2>
        <div className="grid grid-cols-4 gap-4 text-sm text-center">
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
      <h2 className="text-xl font-bold mb-4">Swarms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {swarmEntries.map(([name, swarm]) => (
          <SwarmCard key={name} name={name} data={swarm} />
        ))}
      </div>

      {/* Milestones */}
      {e.milestones.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-3">Milestones Reached</h2>
          <div className="flex flex-wrap gap-2">
            {e.milestones.map((m) => (
              <span key={m} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
        EganForge v2.0 | CEO: Josh Egan | Powered by Claude Opus, GPT-4o, Grok-3, Gemini | Auto-refreshes every 30s
      </footer>
    </div>
  );
}
