"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { MetricCard, SectionCard, Skeleton } from "@/components/ui";
import { formatUSD } from "@/lib/formatters";

interface FunnelData {
  site_visitors: number;
  signals_page_views: number;
  telegram_joins: number;
  payments: number;
  active_subscribers: number;
}

interface ConversionRates {
  visitor_to_signals: number;
  signals_to_telegram: number;
  telegram_to_payment: number;
  payment_to_active: number;
}

interface ChannelAttribution {
  channel: string;
  outreach_count: number;
  // Optional legacy fields — kept so the renderer survives richer future payloads.
  visitors?: number;
  conversions?: number;
  revenue?: number;
}

interface OutreachEntry {
  timestamp?: string;
  product?: string;
  channel?: string;
  title?: string;
  status?: string;
  // Legacy fields, still rendered if present.
  target?: string;
  date?: string;
  notes?: string;
}

interface Campaign {
  name: string;
  channel: string;
  status: string;
  start_date?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  revenue?: number;
}

interface AcquisitionTotals {
  total_revenue_usdc?: number;
  active_subscribers?: number;
  expired_subscribers?: number;
  lifetime_subscribers?: number;
}

interface AcquisitionData {
  available?: boolean;
  funnel?: FunnelData;
  conversion_rates?: ConversionRates;
  channels?: ChannelAttribution[];
  outreach?: OutreachEntry[];
  campaigns?: Campaign[];
  totals?: AcquisitionTotals;
  bottleneck?: string | null;
  focus_products?: string[];
  email_leads?: number;
  mrr?: number;
  history_points?: number;
  fallback?: boolean;
}

const FUNNEL_STEPS: { key: keyof FunnelData; label: string; color: string }[] = [
  { key: "site_visitors", label: "Site Visitors", color: "bg-blue-500" },
  { key: "signals_page_views", label: "Signals Page Views", color: "bg-cyan-500" },
  { key: "telegram_joins", label: "Telegram Joins", color: "bg-purple-500" },
  { key: "payments", label: "Payments", color: "bg-emerald-500" },
  { key: "active_subscribers", label: "Active Subscribers", color: "bg-amber-500" },
];

function statusColor(status: string) {
  switch (status) {
    case "active":
    case "converted":
    case "completed":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "pending":
    case "running":
    case "generated":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "replied":
    case "interested":
    case "sent":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    case "no_response":
    case "failed":
    case "cancelled":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

// Rates may arrive as decimals (0-1) or percents (0-100). Normalize to percent.
function ratePercent(rate: number | undefined | null): number {
  if (!rate || Number.isNaN(rate)) return 0;
  const r = Number(rate);
  return r > 1 ? r : r * 100;
}

function shortTimestamp(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function AcquisitionPage() {
  const { data, loading, lastUpdate, error } = useApiPoller<AcquisitionData>(
    "/api/acquisition",
    30000,
  );

  if (loading) {
    return (
      <PageShell title="Customer Acquisition" subtitle="Funnel metrics, attribution, and outreach">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="mb-1.5 h-7 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="glass mt-6 rounded-xl p-5">
          <Skeleton className="mb-4 h-5 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const d = data ?? ({} as AcquisitionData);
  const funnel: FunnelData = d.funnel ?? {
    site_visitors: 0,
    signals_page_views: 0,
    telegram_joins: 0,
    payments: 0,
    active_subscribers: 0,
  };
  const rates: ConversionRates = d.conversion_rates ?? {
    visitor_to_signals: 0,
    signals_to_telegram: 0,
    telegram_to_payment: 0,
    payment_to_active: 0,
  };
  const channels = d.channels ?? [];
  const outreach = d.outreach ?? [];
  const campaigns = d.campaigns ?? [];
  const totals = d.totals ?? {};
  const totalRevenue = Number(totals.total_revenue_usdc ?? 0);
  const activeSubs = Number(totals.active_subscribers ?? funnel.active_subscribers ?? 0);
  const lifetimeSubs = Number(totals.lifetime_subscribers ?? 0);
  const expiredSubs = Number(totals.expired_subscribers ?? 0);

  const maxFunnel = Math.max(...FUNNEL_STEPS.map((s) => funnel[s.key] || 0), 1);
  const totalOutreach = channels.reduce((sum, c) => sum + (c.outreach_count ?? 0), 0);

  return (
    <PageShell
      title="Customer Acquisition"
      subtitle="Funnel metrics, attribution, and outreach"
      lastUpdate={lastUpdate}
      error={error}
    >
      {d.fallback && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
          Showing cached data — VPS acquisition endpoint unreachable
        </div>
      )}

      {d.bottleneck && (
        <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs text-cyan-300">
          Current bottleneck: <span className="font-semibold">{d.bottleneck}</span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatUSD(totalRevenue)}
          subtext="USDC lifetime"
          accent="text-emerald-400"
          glow="emerald"
        />
        <MetricCard
          label="Active Subs"
          value={activeSubs}
          subtext={`${lifetimeSubs} lifetime`}
          accent="text-cyan-400"
          glow="cyan"
        />
        <MetricCard
          label="Expired"
          value={expiredSubs}
          subtext={
            d.email_leads != null && d.email_leads > 0 ? `${d.email_leads} email leads` : undefined
          }
          accent="text-red-400"
        />
        <MetricCard
          label="Payment → Active"
          value={
            rates.payment_to_active > 0
              ? `${ratePercent(rates.payment_to_active).toFixed(0)}%`
              : "—"
          }
          subtext={d.mrr != null && d.mrr > 0 ? `MRR ${formatUSD(d.mrr)}` : "Conversion"}
          accent="text-purple-400"
        />
      </div>

      <SectionCard title="Acquisition Funnel" className="mb-6">
        <div className="space-y-3">
          {FUNNEL_STEPS.map((step, i) => {
            const count = funnel[step.key] || 0;
            const pct = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0;
            const rateKeys: (keyof ConversionRates)[] = [
              "visitor_to_signals",
              "signals_to_telegram",
              "telegram_to_payment",
              "payment_to_active",
            ];
            const rate = i > 0 ? rates[rateKeys[i - 1]] : null;
            return (
              <div key={step.key}>
                {i > 0 && rate != null && (
                  <div className="flex items-center gap-2 py-1 pl-4">
                    <span className="text-xs text-[var(--text-muted)]">↓</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {rate > 0 ? `${ratePercent(rate).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-40 shrink-0 text-right">
                    <span className="text-sm text-[var(--text-secondary)]">{step.label}</span>
                  </div>
                  <div className="relative h-10 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg ${step.color}/30 transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg ${step.color}/60`}
                      style={{ width: `${Math.max(pct * 0.7, 1)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-sm font-semibold text-white drop-shadow-sm">
                        {Number(count).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Channel Attribution" subtitle={`${channels.length} sources`}>
          {channels.length > 0 ? (
            <div className="space-y-2">
              {channels.map((ch, i) => {
                const count = ch.outreach_count ?? ch.visitors ?? 0;
                const share = totalOutreach > 0 ? Math.round((count / totalOutreach) * 100) : 0;
                return (
                  <div
                    key={`${ch.channel}-${i}`}
                    className="rounded-lg border border-[var(--border-dim)] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{ch.channel || "unknown"}</p>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {count.toLocaleString()} outreach · {share}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-cyan-500/70 transition-all duration-700"
                        style={{ width: `${Math.max(share, 2)}%` }}
                      />
                    </div>
                    {(ch.conversions != null || ch.revenue != null) && (
                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {ch.conversions != null ? `${ch.conversions} conversions · ` : ""}
                        {ch.revenue != null ? formatUSD(ch.revenue) : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
              No attribution data yet — tracking will populate as traffic flows
            </p>
          )}
        </SectionCard>

        <SectionCard title="Outreach History" subtitle={`${outreach.length} contacts`}>
          {outreach.length > 0 ? (
            <div className="space-y-2">
              {outreach.slice(0, 10).map((entry, i) => {
                const title =
                  entry.title || entry.target || entry.product || entry.channel || "outreach";
                const when = entry.timestamp || entry.date;
                const status = (entry.status || "").toLowerCase();
                return (
                  <div
                    key={`${title}-${i}`}
                    className="rounded-lg border border-[var(--border-dim)] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium text-white">{title}</p>
                      {status && (
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(status)}`}
                        >
                          {status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-[var(--text-tertiary)]">
                      {entry.channel && <span>{entry.channel}</span>}
                      {entry.product && entry.product !== entry.title && (
                        <span>{entry.product}</span>
                      )}
                      {when && <span>{shortTimestamp(when)}</span>}
                    </div>
                    {entry.notes && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
              No outreach records — customer_acquisition agent data will appear here
            </p>
          )}
        </SectionCard>
      </div>

      {d.focus_products && d.focus_products.length > 0 && (
        <SectionCard title="Focus Products" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {d.focus_products.map((p) => (
              <span
                key={p}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-300"
              >
                {p}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {campaigns.length > 0 ? (
        <SectionCard title="Campaign Results" subtitle={`${campaigns.length} campaigns`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border-dim)] bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Campaign</th>
                  <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Channel</th>
                  <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Impressions</th>
                  <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Clicks</th>
                  <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Conv.</th>
                  <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr
                    key={`${c.name}-${i}`}
                    className="border-b border-[var(--border-dim)]/50 hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{c.channel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(c.status)}`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                      {c.impressions?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                      {c.clicks?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                      {c.conversions ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {c.revenue != null ? formatUSD(c.revenue) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Campaign Results">
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
            No campaigns tracked yet — results will populate as marketing campaigns run
          </p>
        </SectionCard>
      )}
    </PageShell>
  );
}
