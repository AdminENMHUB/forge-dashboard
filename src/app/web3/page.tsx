"use client";

import Link from "next/link";
import { useApiPoller } from "@/lib/hooks";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { MetricCard } from "@/components/ui";

interface Web3Data {
  available: boolean;
  sampled_at: string;
  wallet: {
    address: string;
    network: string;
    usdc: number;
    eth: number;
    total_usd: number;
  };
  polygon?: {
    address: string;
    network: string;
    usdc_e_balance: number;
    open_position_value: number;
    total_value: number;
    total_pnl: number;
    daily_pnl: number;
    open_positions: number;
    win_rate: number;
    source: string;
  };
  aave: {
    deposited: number;
    current_balance: number;
    yield_earned: number;
    apy_pct: number;
  };
  nfts: {
    total_minted: number;
    dry_run: number;
    live: number;
    recent: Array<Record<string, unknown>>;
  };
  subscribers: {
    active: Array<{
      address: string;
      full_address: string;
      expiry: string;
      tier: string;
    }>;
    expired: Array<{
      address: string;
      full_address: string;
      expiry: string;
      tier: string;
    }>;
    count: number;
    mrr: number;
    price_per_sub: number;
  };
  signals: {
    total_delivered: number;
    total_usdc_received: number;
  };
  transactions: Array<Record<string, unknown>>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    offline: "bg-red-500/20 text-red-400 border-red-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] || colors.offline}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default function Web3Page() {
  const { data, error, loading, lastUpdate, refresh } =
    useApiPoller<Web3Data>("/api/web3", 60000);

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
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
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading Web3 Status...</p>
        </div>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Web3 Department</h1>
        </header>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg">
            Web3 Swarm is currently offline
          </p>
          <p className="text-gray-500 text-sm mt-2">
            web3_state.json not available on VPS
          </p>
        </div>
      </div>
    );
  }

  const w = data;
  const polyValue = w.polygon?.total_value ?? 0;
  const totalWeb3Value = w.wallet.total_usd + polyValue;

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Web3 Department
            </h1>
            <p className="text-gray-500 text-sm">
              {w.wallet.network} &middot;{" "}
              <a
                href={`https://basescan.org/address/${w.wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-mono"
              >
                {w.wallet.address.slice(0, 8)}...{w.wallet.address.slice(-6)}
              </a>
              {w.polygon && (
                <>
                  {" "}&middot; Polygon &middot;{" "}
                  <a
                    href={`https://polygonscan.com/address/${w.polygon.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-mono"
                  >
                    {w.polygon.address.slice(0, 8)}...{w.polygon.address.slice(-6)}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/financials"
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Financials
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">Updated: {lastUpdate}</p>
            {w.sampled_at && (
              <p className="text-xs text-gray-500">
                Data: {timeAgo(w.sampled_at)}
              </p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Web3 Value"
          value={formatUSD(totalWeb3Value)}
          subtext={`Base: ${formatUSD(w.wallet.total_usd)} · Polygon: ${formatUSD(polyValue)}`}
          accent="text-emerald-400"
        />
        <MetricCard
          label="Polygon P&L"
          value={
            (w.polygon?.total_pnl ?? 0) >= 0
              ? `+${formatUSD(w.polygon?.total_pnl ?? 0)}`
              : formatUSD(w.polygon?.total_pnl ?? 0)
          }
          subtext={`Today: ${(w.polygon?.daily_pnl ?? 0) >= 0 ? "+" : ""}${formatUSD(w.polygon?.daily_pnl ?? 0)}`}
          accent={
            (w.polygon?.total_pnl ?? 0) >= 0
              ? "text-emerald-400"
              : "text-red-400"
          }
        />
        <MetricCard
          label="Subscribers"
          value={w.subscribers.count}
          subtext={`@ $${w.subscribers.price_per_sub}/mo each`}
        />
        <MetricCard
          label="Crypto MRR"
          value={formatUSD(w.subscribers.mrr)}
          subtext={`ARR: ${formatUSD(w.subscribers.mrr * 12)}`}
          accent="text-purple-400"
        />
      </div>

      {/* Three-column: Base Wallet + Polygon Wallet + AAVE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Base Wallet Balance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Base Wallet</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              BASE
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-sm">
                  $
                </span>
                <span className="font-medium">USDC</span>
              </div>
              <span className="font-mono text-lg">
                {formatUSD(w.wallet.usdc)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-sm">
                  E
                </span>
                <span className="font-medium">ETH</span>
              </div>
              <span className="font-mono text-lg">
                {w.wallet.eth.toFixed(6)}
              </span>
            </div>
            <div className="border-t border-gray-800 pt-3 flex justify-between">
              <span className="text-gray-400">Total Received</span>
              <span className="font-mono text-emerald-400">
                {formatUSD(w.signals.total_usdc_received)}
              </span>
            </div>
          </div>
        </div>

        {/* Polygon Wallet (EchoSwarm / Polymarket) */}
        {w.polygon && (
          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Polygon Wallet</h2>
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                USDC.e
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-sm">
                    $
                  </span>
                  <span className="font-medium">USDC.e (Cash)</span>
                </div>
                <span className="font-mono text-lg">
                  {formatUSD(w.polygon.usdc_e_balance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-sm">
                    P
                  </span>
                  <span className="font-medium">Open Positions</span>
                </div>
                <span className="font-mono text-lg">
                  {formatUSD(w.polygon.open_position_value)}
                  <span className="text-xs text-gray-500 ml-1">({w.polygon.open_positions})</span>
                </span>
              </div>
              <div className="border-t border-gray-800 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Value</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {formatUSD(w.polygon.total_value)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="font-mono">
                    {(w.polygon.win_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">{w.polygon.source}</p>
              </div>
            </div>
          </div>
        )}

        {/* AAVE Position */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Aave DeFi</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              YIELD
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Deposited</span>
              <span className="font-mono">{formatUSD(w.aave.deposited)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Balance</span>
              <span className="font-mono">
                {formatUSD(w.aave.current_balance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yield Earned</span>
              <span className="font-mono text-emerald-400">
                +{formatUSD(w.aave.yield_earned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current APY</span>
              <span className="font-mono text-blue-400">
                {w.aave.apy_pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: NFTs + Subscribers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* NFT Inventory */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">NFT Inventory</h2>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl font-bold">{w.nfts.total_minted}</p>
              <p className="text-xs text-gray-500">Total Minted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {w.nfts.live}
              </p>
              <p className="text-xs text-gray-500">Live</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">
                {w.nfts.dry_run}
              </p>
              <p className="text-xs text-gray-500">Dry Run</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Signals Delivered</span>
              <span className="font-mono">{w.signals.total_delivered}</span>
            </div>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">On-Chain Subscribers</h2>
            <span className="text-xs text-gray-500">
              {w.subscribers.count} active
            </span>
          </div>
          {w.subscribers.active.length === 0 ? (
            <p className="text-gray-500 text-sm">No active subscribers</p>
          ) : (
            <div className="space-y-2">
              {w.subscribers.active.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
                >
                  <div>
                    <a
                      href={`https://basescan.org/address/${sub.full_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-purple-400 hover:text-purple-300"
                    >
                      {sub.address}
                    </a>
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(sub.expiry).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status="active" />
                    <p className="text-xs text-gray-500 mt-1">
                      ${w.subscribers.price_per_sub}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {w.subscribers.expired.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 mb-2">Recently Expired</p>
              {w.subscribers.expired.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="font-mono text-gray-500 text-xs">
                    {sub.address}
                  </span>
                  <StatusBadge status="expired" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Log */}
      {w.transactions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">Recent Transactions</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {w.transactions
              .slice()
              .reverse()
              .map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-gray-400">
                      {(tx.type as string) || (tx.action as string) || "tx"}
                    </span>
                    {typeof tx.hash === "string" && (
                      <a
                        href={`https://polygonscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-purple-400 hover:text-purple-300 font-mono text-xs"
                      >
                        {tx.hash.slice(0, 10)}...
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    {typeof tx.amount === "number" && (
                      <span className="font-mono text-emerald-400">
                        {formatUSD(tx.amount)}
                      </span>
                    )}
                    {typeof tx.timestamp === "string" && (
                      <p className="text-xs text-gray-500">
                        {timeAgo(tx.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
        Web3 Department | Base + Polygon Networks | Auto-refreshes every 60s
      </footer>
    </div>
  );
}
