"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { MetricCard, StatusBadge } from "@/components/ui";

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
    contract_address?: string;
    opensea_url?: string;
    basescan_contract?: string;
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
  solana?: {
    address: string;
    network: string;
    sol_balance: number;
    usdc_balance: number;
    total_usd?: number;
    total_value: number;
    total_pnl: number;
    source: string;
  };
  gas_costs?: {
    total_eth: number;
    total_usd_est: number;
    daily: Record<string, Record<string, number>>;
  };
  transactions: Array<Record<string, unknown>>;
}

export default function Web3Page() {
  const { data, error, loading, lastUpdate, refresh } = useApiPoller<Web3Data>("/api/web3", 60000);

  if (error && !data) {
    return (
      <PageShell title="Web3 & DeFi" subtitle="Base + Polygon + Solana wallets, AAVE yield, NFTs">
        <div className="glass flex flex-col items-center justify-center rounded-xl border border-[var(--border-dim)] p-12 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-400">Connection Error</h2>
          <p className="text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </PageShell>
    );
  }

  if (loading && !data) {
    return (
      <PageShell title="Web3 & DeFi" subtitle="Base + Polygon + Solana wallets, AAVE yield, NFTs">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="text-[var(--text-secondary)]">Loading Web3 Status...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data?.available) {
    return (
      <PageShell title="Web3 & DeFi" subtitle="Base + Polygon + Solana wallets, AAVE yield, NFTs">
        <div className="glass rounded-xl border border-[var(--border-dim)] p-8 text-center">
          <p className="text-lg text-[var(--text-secondary)]">Web3 Swarm is currently offline</p>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            web3_state.json not available on VPS
          </p>
        </div>
      </PageShell>
    );
  }

  const w = data;
  const polyValue = w.polygon?.total_value ?? 0;
  const solanaValue = w.solana?.total_value ?? w.solana?.total_usd ?? 0;
  const totalWeb3Value = w.wallet.total_usd + polyValue + solanaValue;

  const subtitleContent = (
    <>
      {w.wallet.network} &middot;{" "}
      <a
        href={`https://basescan.org/address/${w.wallet.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-purple-400 hover:text-purple-300"
      >
        {w.wallet.address.slice(0, 8)}...{w.wallet.address.slice(-6)}
      </a>
      {w.polygon && (
        <>
          {" "}
          &middot; Polygon &middot;{" "}
          <a
            href={`https://polygonscan.com/address/${w.polygon.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-purple-400 hover:text-purple-300"
          >
            {w.polygon.address.slice(0, 8)}...{w.polygon.address.slice(-6)}
          </a>
        </>
      )}
      {w.solana && (
        <>
          {" "}
          &middot; Solana &middot;{" "}
          <a
            href={`https://solscan.io/account/${w.solana.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-green-400 hover:text-green-300"
          >
            {w.solana.address.slice(0, 8)}...{w.solana.address.slice(-4)}
          </a>
        </>
      )}
    </>
  );

  return (
    <PageShell
      title="Web3 & DeFi"
      subtitle="Base + Polygon + Solana wallets, AAVE yield, NFTs"
      lastUpdate={lastUpdate}
      error={error}
    >
      {/* Wallet addresses */}
      <p className="-mt-4 mb-6 text-sm text-[var(--text-tertiary)]">{subtitleContent}</p>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Web3 Value"
          value={formatUSD(totalWeb3Value)}
          subtext={`Base: ${formatUSD(w.wallet.total_usd)} · Polygon: ${formatUSD(polyValue)}${solanaValue > 0 ? ` · Solana: ${formatUSD(solanaValue)}` : ""}`}
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
          accent={(w.polygon?.total_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}
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
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Base Wallet Balance */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Base Wallet</h2>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
              BASE
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm">
                  $
                </span>
                <span className="font-medium">USDC</span>
              </div>
              <span className="font-mono text-lg">{formatUSD(w.wallet.usdc)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm">
                  E
                </span>
                <span className="font-medium">ETH</span>
              </div>
              <span className="font-mono text-lg">{(w.wallet.eth ?? 0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-dim)] pt-3">
              <span className="text-[var(--text-secondary)]">Total Received</span>
              <span className="font-mono text-emerald-400">
                {formatUSD(w.signals.total_usdc_received)}
              </span>
            </div>
          </div>
        </div>

        {/* Polygon Wallet (EchoSwarm / Polymarket) */}
        {w.polygon && (
          <div className="glass rounded-xl border border-purple-500/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Polygon Wallet</h2>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                USDC.e
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm">
                    $
                  </span>
                  <span className="font-medium">USDC.e (Cash)</span>
                </div>
                <span className="font-mono text-lg">{formatUSD(w.polygon.usdc_e_balance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm">
                    P
                  </span>
                  <span className="font-medium">Open Positions</span>
                </div>
                <span className="font-mono text-lg">
                  {formatUSD(w.polygon.open_position_value)}
                  <span className="ml-1 text-xs text-[var(--text-tertiary)]">
                    ({w.polygon.open_positions})
                  </span>
                </span>
              </div>
              <div className="border-t border-[var(--border-dim)] pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Total Value</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {formatUSD(w.polygon.total_value)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Win Rate</span>
                  <span className="font-mono">{(w.polygon.win_rate * 100).toFixed(1)}%</span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{w.polygon.source}</p>
              </div>
            </div>
          </div>
        )}

        {/* AAVE Position */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aave DeFi</h2>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
              YIELD
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Deposited</span>
              <span className="font-mono">{formatUSD(w.aave.deposited)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Current Balance</span>
              <span className="font-mono">{formatUSD(w.aave.current_balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Yield Earned</span>
              <span className="font-mono text-emerald-400">+{formatUSD(w.aave.yield_earned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Current APY</span>
              <span className="font-mono text-blue-400">{w.aave.apy_pct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Solana Wallet (ForgeDefi) */}
        {w.solana && (
          <div className="glass rounded-xl border border-green-500/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Solana Wallet</h2>
              <span className="rounded-full border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                SOL
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-sm">
                    S
                  </span>
                  <span className="font-medium">SOL</span>
                </div>
                <span className="font-mono text-lg">{(w.solana.sol_balance ?? 0).toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm">
                    $
                  </span>
                  <span className="font-medium">USDC</span>
                </div>
                <span className="font-mono text-lg">{formatUSD(w.solana.usdc_balance ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-dim)] pt-3">
                <span className="text-[var(--text-secondary)]">Total Value</span>
                <span className="font-mono text-emerald-400">
                  {formatUSD(w.solana.total_value ?? w.solana.total_usd ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Source</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  {w.solana.source ?? "ForgeDefi"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gas Cost Tracking */}
      {w.gas_costs && (w.gas_costs.total_eth > 0 || w.gas_costs.total_usd_est > 0) && (
        <div className="glass mb-8 rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gas Costs</h2>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
              ON-CHAIN
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Gas (ETH)</p>
              <p className="font-mono text-lg">{w.gas_costs.total_eth.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Gas (USD)</p>
              <p className="font-mono text-lg text-orange-400">
                {formatUSD(w.gas_costs.total_usd_est)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Avg per TX</p>
              <p className="font-mono text-lg">
                {w.gas_costs.total_eth > 0
                  ? `${(w.gas_costs.total_usd_est / Math.max(Object.keys(w.gas_costs.daily).length, 1)).toFixed(2)}/day`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Days Tracked</p>
              <p className="font-mono text-lg">{Object.keys(w.gas_costs.daily).length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Two-column: NFTs + Subscribers */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* NFT Inventory */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">NFT Inventory</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              ERC-1155
            </span>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{w.nfts.total_minted}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Total Minted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{w.nfts.live}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Live</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-tertiary)]">{w.nfts.dry_run}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Dry Run</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-[var(--border-dim)] pt-3">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Signals Delivered</span>
              <span className="font-mono">{w.signals.total_delivered}</span>
            </div>
            {w.nfts.contract_address && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Contract</span>
                <div className="flex items-center gap-2">
                  <a
                    href={
                      w.nfts.basescan_contract ||
                      `https://basescan.org/address/${w.nfts.contract_address}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-400 hover:text-blue-300"
                  >
                    {w.nfts.contract_address.slice(0, 8)}...{w.nfts.contract_address.slice(-6)}
                  </a>
                  {w.nfts.opensea_url && (
                    <a
                      href={w.nfts.opensea_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      OpenSea &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">On-Chain Subscribers</h2>
            <span className="text-xs text-[var(--text-tertiary)]">
              {w.subscribers.count} active
            </span>
          </div>
          {w.subscribers.active.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No active subscribers</p>
          ) : (
            <div className="space-y-2">
              {w.subscribers.active.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
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
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Expires: {new Date(sub.expiry).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status="active" />
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      ${w.subscribers.price_per_sub}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {w.subscribers.expired.length > 0 && (
            <div className="mt-4 border-t border-[var(--border-dim)] pt-3">
              <p className="mb-2 text-xs text-[var(--text-tertiary)]">Recently Expired</p>
              {w.subscribers.expired.map((sub, i) => (
                <div key={i} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-mono text-xs text-[var(--text-tertiary)]">
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
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {w.transactions
              .slice()
              .reverse()
              .map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-[var(--text-secondary)]">
                      {(tx.type as string) || (tx.action as string) || "tx"}
                    </span>
                    {typeof tx.hash === "string" && (
                      <a
                        href={`https://polygonscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 font-mono text-xs text-purple-400 hover:text-purple-300"
                      >
                        {tx.hash.slice(0, 10)}...
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    {typeof tx.amount === "number" && (
                      <span className="font-mono text-emerald-400">{formatUSD(tx.amount)}</span>
                    )}
                    {typeof tx.timestamp === "string" && (
                      <p className="text-xs text-[var(--text-tertiary)]">{timeAgo(tx.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-[var(--border-dim)] pt-6 text-center text-xs text-[var(--text-muted)]">
        Web3 Department | Base + Polygon + Solana Networks | Auto-refreshes every 60s
      </footer>
    </PageShell>
  );
}
