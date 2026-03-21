"use client";

import { useApiPoller } from "@/lib/hooks";
import { DashboardNav } from "@/components/nav";
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
  base: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
    label: "BASE",
  },
  polygon: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
    label: "POLYGON",
  },
  coinbase: {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    label: "COINBASE",
  },
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
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
}

function WalletCard({ wallet }: { wallet: WalletData }) {
  const hasDefi = wallet.defi_positions > 0;
  const hasTrades = wallet.trade_positions > 0;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{wallet.label}</h3>
          {wallet.address !== "coinbase" ? (
            <a
              href={wallet.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-gray-500 transition-colors hover:text-purple-400"
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
              <span className="ml-1 text-gray-500">({formatUSD(wallet.native_token_usd)})</span>
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

      <div className="mt-3 flex items-center justify-between border-t border-gray-800 pt-3">
        <span className="text-sm text-gray-400">Total</span>
        <span className="font-mono text-lg font-semibold">{formatUSD(wallet.total_usd)}</span>
      </div>

      {wallet.last_updated && (
        <p className="mt-2 text-xs text-gray-600">{timeAgo(wallet.last_updated)}</p>
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
  ].filter((s) => s.value > 0);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-lg font-semibold">Asset Allocation</h2>
      <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} h-full transition-all`}
            style={{ width: `${(seg.value / total) * 100}%` }}
            title={`${seg.label}: ${formatUSD(seg.value)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${seg.color}`} />
            <div>
              <p className="text-xs text-gray-400">{seg.label}</p>
              <p className="font-mono text-sm">
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
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-lg font-semibold">Chain Distribution</h2>
      <div className="space-y-3">
        {entries.map(([chain, value]) => {
          const pct = (value / total) * 100;
          const style = CHAIN_COLORS[chain] || CHAIN_COLORS.base;
          return (
            <div key={chain}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={`font-medium ${style.text}`}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </span>
                <span className="font-mono">
                  {formatUSD(value)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-800">
                <div
                  className={`h-2 rounded-full transition-all ${style.bg.replace("/20", "")}`}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: style.text.replace("text-", "").includes("blue")
                      ? "#3b82f6"
                      : style.text.includes("purple")
                        ? "#a855f7"
                        : "#6366f1",
                  }}
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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-semibold">Recent Fund Flows</h2>
        <p className="py-4 text-center text-sm text-gray-500">No fund flows recorded yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-lg font-semibold">Recent Fund Flows</h2>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {flows.map((flow, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium uppercase ${FLOW_TYPE_COLORS[flow.flow_type] || "text-gray-400"}`}
              >
                {flow.flow_type}
              </span>
              <span className="text-gray-400">
                {flow.from_wallet.split(":")[0]} &rarr; {flow.to_wallet.split(":")[0]}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-emerald-400">{formatUSD(flow.amount_usd)}</span>
              <span className="ml-2 text-xs text-gray-600">{flow.asset}</span>
              {flow.timestamp && <p className="text-xs text-gray-600">{timeAgo(flow.timestamp)}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { data, error, loading, lastUpdate, refresh } = useApiPoller<AssetsData>(
    "/api/assets",
    60000,
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
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-gray-400">Loading Asset Registry...</p>
        </div>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl p-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <DashboardNav />
        </header>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-lg text-gray-400">Asset registry not yet populated</p>
          <p className="mt-2 text-sm text-gray-500">
            {data?.error || "Waiting for next overseer cycle"}
          </p>
        </div>
      </div>
    );
  }

  const wallets = Object.values(data.wallets);
  const totalGas = data.gas.total_gas_usd;

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-6">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-sm text-gray-500">
            Unified view across {wallets.length} wallets &middot;{" "}
            {Object.keys(data.chain_totals).length} chains
            <span className="mx-2 text-gray-700">|</span>
            <span>{lastUpdate}</span>
            {error && <span className="ml-2 text-xs text-red-400">({error})</span>}
          </p>
        </div>
        <DashboardNav />
      </header>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
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
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AllocationBar totals={data.totals} />
        <ChainDistribution chainTotals={data.chain_totals} />
      </div>

      {/* Wallet Cards */}
      <h2 className="mb-4 text-xl font-bold">Wallets</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <WalletCard key={`${wallet.chain}:${wallet.address}`} wallet={wallet} />
        ))}
      </div>

      {/* Fund Flows */}
      <FundFlowTimeline flows={data.recent_flows} />

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
        Asset Registry | Base + Polygon + Coinbase | Zero LLM cost | Auto-refreshes every 60s
      </footer>
    </div>
  );
}
