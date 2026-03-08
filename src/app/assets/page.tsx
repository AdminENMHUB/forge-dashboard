"use client";

import Link from "next/link";
import { useApiPoller } from "@/lib/hooks";
import { formatUSD, timeAgo, truncateAddress } from "@/lib/formatters";
import { MetricCard } from "@/components/ui";

interface WalletData {
  address: string;
  chain: string;
  label: string;
  stablecoins: number;
  native_token: number;
  native_token_usd: number;
  defi_positions: number;
  trade_positions: number;
  nft_count: number;
  total_usd: number;
  explorer_url: string;
  last_updated: string;
}

interface FundFlow {
  timestamp: string;
  from_wallet: string;
  to_wallet: string;
  amount_usd: number;
  asset: string;
  flow_type: string;
  description: string;
}

interface AssetsData {
  available: boolean;
  error?: string;
  wallets: Record<string, WalletData>;
  totals: {
    stablecoins: number;
    native_tokens_usd: number;
    defi: number;
    trade_positions: number;
    portfolio_usd: number;
    nfts: number;
  };
  chain_totals: Record<string, number>;
  gas: {
    total_gas_eth: number;
    total_gas_usd: number;
    daily_costs: Record<string, Record<string, number>>;
  };
  recent_flows: FundFlow[];
  last_updated: string;
}

const CHAIN_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  base: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", label: "BASE" },
  polygon: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "POLYGON" },
  coinbase: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30", label: "COINBASE" },
};

const FLOW_TYPE_COLORS: Record<string, string> = {
  transfer: "text-blue-400",
  deposit: "text-emerald-400",
  withdrawal: "text-amber-400",
  bridge: "text-purple-400",
  swap: "text-cyan-400",
};

function ChainBadge({ chain }: { chain: string }) {
  const style = CHAIN_COLORS[chain] || CHAIN_COLORS.base;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${style.bg} ${style.text} ${style.border}`}>
      {style.label}
    </span>
  );
}

function WalletCard({ wallet }: { wallet: WalletData }) {
  const hasDefi = wallet.defi_positions > 0;
  const hasTrades = wallet.trade_positions > 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{wallet.label}</h3>
          {wallet.address !== "coinbase" ? (
            <a
              href={wallet.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-500 hover:text-purple-400 transition-colors"
            >
              {truncateAddress(wallet.address)}
            </a>
          ) : (
            <span className="text-xs text-gray-500">Centralized Exchange</span>
          )}
        </div>
        <ChainBadge chain={wallet.chain} />
      </div>

      <div className="space-y-2 text-sm">
        {wallet.stablecoins > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Stablecoins</span>
            <span className="font-mono text-emerald-400">{formatUSD(wallet.stablecoins)}</span>
          </div>
        )}
        {wallet.native_token > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">
              {wallet.chain === "base" ? "ETH" : wallet.chain === "polygon" ? "MATIC" : "Native"}
            </span>
            <span className="font-mono">
              {wallet.native_token.toFixed(6)}
              <span className="text-gray-500 ml-1">({formatUSD(wallet.native_token_usd)})</span>
            </span>
          </div>
        )}
        {hasDefi && (
          <div className="flex justify-between">
            <span className="text-gray-400">DeFi Positions</span>
            <span className="font-mono text-cyan-400">{formatUSD(wallet.defi_positions)}</span>
          </div>
        )}
        {hasTrades && (
          <div className="flex justify-between">
            <span className="text-gray-400">Trade Positions</span>
            <span className="font-mono text-amber-400">{formatUSD(wallet.trade_positions)}</span>
          </div>
        )}
        {wallet.nft_count > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">NFTs</span>
            <span className="font-mono">{wallet.nft_count}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 mt-3 pt-3 flex justify-between items-center">
        <span className="text-gray-400 text-sm">Total</span>
        <span className="font-mono text-lg font-semibold">{formatUSD(wallet.total_usd)}</span>
      </div>

      {wallet.last_updated && (
        <p className="text-xs text-gray-600 mt-2">{timeAgo(wallet.last_updated)}</p>
      )}
    </div>
  );
}

function AllocationBar({ totals }: { totals: AssetsData["totals"] }) {
  const total = totals.portfolio_usd || 1;
  const segments = [
    { label: "Stablecoins", value: totals.stablecoins, color: "bg-emerald-500" },
    { label: "DeFi", value: totals.defi, color: "bg-cyan-500" },
    { label: "Trade Positions", value: totals.trade_positions, color: "bg-amber-500" },
    { label: "Native Tokens", value: totals.native_tokens_usd, color: "bg-purple-500" },
  ].filter(s => s.value > 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-semibold text-lg mb-4">Asset Allocation</h2>
      <div className="w-full rounded-full h-4 flex overflow-hidden mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} h-full transition-all`}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.label}: ${formatUSD(seg.value)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${seg.color}`} />
            <div>
              <p className="text-xs text-gray-400">{seg.label}</p>
              <p className="text-sm font-mono">
                {formatUSD(seg.value)} ({((seg.value / total) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChainDistribution({ chainTotals }: { chainTotals: Record<string, number> }) {
  const entries = Object.entries(chainTotals).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-semibold text-lg mb-4">Chain Distribution</h2>
      <div className="space-y-3">
        {entries.map(([chain, value]) => {
          const pct = (value / total) * 100;
          const style = CHAIN_COLORS[chain] || CHAIN_COLORS.base;
          return (
            <div key={chain}>
              <div className="flex justify-between text-sm mb-1">
                <span className={`font-medium ${style.text}`}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </span>
                <span className="font-mono">{formatUSD(value)} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${style.bg.replace("/20", "")}`}
                  style={{ width: `${pct}%`, backgroundColor: style.text.replace("text-", "").includes("blue") ? "#3b82f6" : style.text.includes("purple") ? "#a855f7" : "#6366f1" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FundFlowTimeline({ flows }: { flows: FundFlow[] }) {
  if (!flows || flows.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-lg mb-4">Recent Fund Flows</h2>
        <p className="text-gray-500 text-sm text-center py-4">No fund flows recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-semibold text-lg mb-4">Recent Fund Flows</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {flows.map((flow, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium uppercase ${FLOW_TYPE_COLORS[flow.flow_type] || "text-gray-400"}`}>
                {flow.flow_type}
              </span>
              <span className="text-gray-400">
                {flow.from_wallet.split(":")[0]} &rarr; {flow.to_wallet.split(":")[0]}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-emerald-400">{formatUSD(flow.amount_usd)}</span>
              <span className="text-xs text-gray-600 ml-2">{flow.asset}</span>
              {flow.timestamp && (
                <p className="text-xs text-gray-600">{timeAgo(flow.timestamp)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { data, error, loading, lastUpdate, refresh } =
    useApiPoller<AssetsData>("/api/assets", 60000);

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-gray-400">{error}</p>
          <button onClick={refresh} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading Asset Registry...</p>
        </div>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">&larr; Dashboard</Link>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        </header>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg">Asset registry not yet populated</p>
          <p className="text-gray-500 text-sm mt-2">{data?.error || "Waiting for next overseer cycle"}</p>
        </div>
      </div>
    );
  }

  const wallets = Object.values(data.wallets);
  const totalGas = data.gas.total_gas_usd;

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">&larr; Dashboard</Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
            <p className="text-gray-500 text-sm">
              Unified view across {wallets.length} wallets &middot; {Object.keys(data.chain_totals).length} chains
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/financials" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">
            Financials
          </Link>
          <Link href="/web3" className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
            Web3
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">Updated: {lastUpdate}</p>
            {data.last_updated && <p className="text-xs text-gray-500">Data: {timeAgo(data.last_updated)}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Total Portfolio"
          value={formatUSD(data.totals.portfolio_usd)}
          accent="text-emerald-400"
        />
        <MetricCard
          label="Stablecoins"
          value={formatUSD(data.totals.stablecoins)}
          subtext={`${((data.totals.stablecoins / Math.max(data.totals.portfolio_usd, 1)) * 100).toFixed(0)}% of portfolio`}
        />
        <MetricCard
          label="DeFi Positions"
          value={formatUSD(data.totals.defi)}
          accent="text-cyan-400"
        />
        <MetricCard
          label="Trade Positions"
          value={formatUSD(data.totals.trade_positions)}
          accent="text-amber-400"
        />
        <MetricCard
          label="Gas Costs"
          value={formatUSD(totalGas)}
          subtext={`${data.gas.total_gas_eth.toFixed(6)} ETH`}
          accent="text-orange-400"
        />
      </div>

      {/* Allocation + Chain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <AllocationBar totals={data.totals} />
        <ChainDistribution chainTotals={data.chain_totals} />
      </div>

      {/* Wallet Cards */}
      <h2 className="text-xl font-bold mb-4">Wallets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {wallets.map((wallet) => (
          <WalletCard key={`${wallet.chain}:${wallet.address}`} wallet={wallet} />
        ))}
      </div>

      {/* Fund Flows */}
      <FundFlowTimeline flows={data.recent_flows} />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
        Asset Registry | Base + Polygon + Coinbase | Zero LLM cost | Auto-refreshes every 60s
      </footer>
    </div>
  );
}
