"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { formatUSD, truncateAddress } from "@/lib/formatters";
import { MetricCard } from "@/components/ui";

interface Subscriber {
  wallet: string;
  full_address: string;
  tier: string;
  status: string;
  expiry: string;
  telegram_connected: boolean;
  usdc_paid: number;
  subscribed_at: string;
}

interface SubscriberData {
  available: boolean;
  sampled_at: string;
  subscribers: Subscriber[];
  kpis: {
    total: number;
    active: number;
    mrr_usdc: number;
    churn_rate: number;
  };
  funnel: {
    site_visits: number;
    signals_page: number;
    telegram_bot: number;
    payment: number;
    active_subscriber: number;
  };
  retention: {
    avg_lifetime_days: number;
    renewal_rate: number;
    ltv_usdc: number;
  };
  source?: string;
}

const TIER_COLORS: Record<string, string> = {
  echo: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  pro: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  elite: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  lifetime: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  expiring: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-400 pulse-dot",
  expired: "bg-red-400",
  expiring: "bg-amber-400 pulse-dot",
};

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_COLORS[tier] ?? "bg-gray-500/15 text-gray-400 border-gray-500/25";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${style}`}
    >
      {tier}
    </span>
  );
}

function SubStatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.expired;
  const dot = STATUS_DOT[status] ?? "bg-gray-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status.toUpperCase()}
    </span>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-right text-xs text-[var(--text-secondary)]">{label}</span>
      <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500/40 to-cyan-400/60 transition-all duration-700"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
          {value.toLocaleString()}
        </span>
      </div>
      {max > 0 && value < max && (
        <span className="w-12 text-right text-[11px] text-[var(--text-tertiary)]">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

export default function SubscribersPage() {
  const { data, error, loading, lastUpdate, refresh } = useApiPoller<SubscriberData>(
    "/api/subscribers",
    20000,
  );

  if (error && !data) {
    return (
      <PageShell title="Subscribers" subtitle="Signal subscription management">
        <div className="glass flex flex-col items-center justify-center rounded-xl border border-[var(--border-dim)] p-12 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-400">Connection Error</h2>
          <p className="text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 hover:bg-cyan-700"
          >
            Retry
          </button>
        </div>
      </PageShell>
    );
  }

  if (loading && !data) {
    return (
      <PageShell title="Subscribers" subtitle="Signal subscription management">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-[var(--text-secondary)]">Loading subscriber data...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const d = data!;
  const kpis = d.kpis;
  const funnel = d.funnel;
  const retention = d.retention;
  const funnelMax = Math.max(
    funnel.site_visits,
    funnel.signals_page,
    funnel.telegram_bot,
    funnel.payment,
    funnel.active_subscriber,
    1,
  );

  const expiringCount = d.subscribers.filter((s) => {
    if (s.status !== "active") return false;
    const daysLeft = (new Date(s.expiry).getTime() - Date.now()) / 86_400_000;
    return daysLeft <= 30;
  }).length;

  return (
    <PageShell
      title="Subscribers"
      subtitle="Signal subscription management"
      lastUpdate={lastUpdate}
      error={error}
    >
      {d.source === "fallback" && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          Upstream API unreachable — showing cached subscriber data
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Subscribers"
          value={kpis.total}
          subtext={`${kpis.active} active · ${kpis.total - kpis.active} expired`}
          glow="cyan"
        />
        <MetricCard
          label="Active"
          value={kpis.active}
          subtext={expiringCount > 0 ? `${expiringCount} expiring within 30d` : "All healthy"}
          accent="text-emerald-400"
          glow="emerald"
        />
        <MetricCard
          label="MRR (USDC)"
          value={formatUSD(kpis.mrr_usdc)}
          subtext={`ARR: ${formatUSD(kpis.mrr_usdc * 12)}`}
          accent="text-cyan-400"
        />
        <MetricCard
          label="Churn Rate"
          value={`${(kpis.churn_rate * 100).toFixed(0)}%`}
          subtext={kpis.churn_rate > 0.3 ? "Needs attention" : "Healthy"}
          accent={kpis.churn_rate > 0.3 ? "text-red-400" : "text-emerald-400"}
        />
      </div>

      {/* Subscriber Table */}
      <div className="glass mb-8 overflow-hidden rounded-xl border border-[var(--border-dim)]">
        <div className="flex items-center justify-between border-b border-[var(--border-dim)] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Subscriber Roster</h2>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {d.subscribers.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-dim)] bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Wallet</th>
                <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Tier</th>
                <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Status</th>
                <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Expiry</th>
                <th className="px-4 py-3 text-center text-[var(--text-secondary)]">Telegram</th>
                <th className="px-4 py-3 text-right text-[var(--text-secondary)]">USDC Paid</th>
              </tr>
            </thead>
            <tbody>
              {d.subscribers.map((sub) => {
                const daysLeft = (new Date(sub.expiry).getTime() - Date.now()) / 86_400_000;
                const effectiveStatus =
                  sub.status === "active" && daysLeft <= 30 ? "expiring" : sub.status;

                return (
                  <tr
                    key={sub.full_address}
                    className="border-b border-[var(--border-dim)]/50 hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`https://basescan.org/address/${sub.full_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        {truncateAddress(sub.full_address)}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={sub.tier} />
                    </td>
                    <td className="px-4 py-3">
                      <SubStatusBadge status={effectiveStatus} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {new Date(sub.expiry).toLocaleDateString()}
                      {sub.status === "active" && (
                        <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">
                          ({Math.floor(daysLeft)}d left)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub.telegram_connected ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">
                      {formatUSD(sub.usdc_paid)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-column: Funnel + Retention */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Conversion Funnel</h2>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-400">
              PIPELINE
            </span>
          </div>
          <div className="space-y-3">
            <FunnelBar label="Site Visits" value={funnel.site_visits} max={funnelMax} />
            <FunnelBar label="Signals Page" value={funnel.signals_page} max={funnelMax} />
            <FunnelBar label="Telegram Bot" value={funnel.telegram_bot} max={funnelMax} />
            <FunnelBar label="Payment" value={funnel.payment} max={funnelMax} />
            <FunnelBar label="Active Sub" value={funnel.active_subscriber} max={funnelMax} />
          </div>
          {funnel.site_visits > 0 && (
            <div className="mt-4 flex gap-4 border-t border-[var(--border-dim)] pt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-cyan-400">
                  {((funnel.active_subscriber / funnel.site_visits) * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Overall CVR</p>
              </div>
              {funnel.signals_page > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--text-secondary)]">
                    {((funnel.payment / funnel.signals_page) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Page → Paid</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Retention Metrics */}
        <div className="glass rounded-xl border border-[var(--border-dim)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Retention & LTV</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-400">
              ENGINE
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Avg Lifetime</span>
              <span className="font-mono text-lg text-white">{retention.avg_lifetime_days}d</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Renewal Rate</span>
              <span
                className={`font-mono text-lg ${retention.renewal_rate >= 0.7 ? "text-emerald-400" : retention.renewal_rate >= 0.4 ? "text-amber-400" : "text-red-400"}`}
              >
                {(retention.renewal_rate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">LTV (USDC)</span>
              <span className="font-mono text-lg text-cyan-400">
                {formatUSD(retention.ltv_usdc)}
              </span>
            </div>
            <div className="border-t border-[var(--border-dim)] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Total Revenue</span>
                <span className="font-mono text-lg text-emerald-400">
                  {formatUSD(d.subscribers.reduce((sum, s) => sum + s.usdc_paid, 0))}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                Across {d.subscribers.length} subscribers ({kpis.active} active)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-[var(--border-dim)] pt-6 text-center text-xs text-[var(--text-muted)]">
        Signal Subscription Management | @EganCryptoSignals | Auto-refreshes every 20s
      </footer>
    </PageShell>
  );
}
