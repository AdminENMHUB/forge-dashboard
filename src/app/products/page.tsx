"use client";

import { useApiPoller } from "@/lib/hooks";
import { formatUSD, timeAgo } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { MetricCard, StatusBadge, SectionCard, Skeleton } from "@/components/ui";

interface Product {
  title: string;
  niche: string;
  price: number;
  marketplace: string;
  status: string;
  quality_score: number;
  revenue: number;
}

interface ActivityItem {
  claw: string;
  action: string;
  timestamp: string;
  detail?: string;
}

interface ScoutClaw {
  status: string;
  last_run: string | null;
  signals_collected: number;
  signals_scored: number;
}

interface CreatorClaw {
  status: string;
  last_run: string | null;
  products_forged: number;
  in_progress: number;
}

interface AmplifierClaw {
  status: string;
  last_run: string | null;
  published: number;
  pending: number;
}

interface CashierClaw {
  status: string;
  last_run: string | null;
  sales: number;
  revenue: number;
}

interface BrainClaw {
  status: string;
  last_run: string | null;
  feedback_loops: number;
  optimizations: number;
}

interface PipelineData {
  kpi: {
    products_created: number;
    products_published: number;
    total_revenue: number;
    avg_quality_score: number;
  };
  pipeline: {
    scout: ScoutClaw;
    creator: CreatorClaw;
    amplifier: AmplifierClaw;
    cashier: CashierClaw;
    brain: BrainClaw;
  };
  products: Product[];
  recent_activity: ActivityItem[];
}

const CLAW_META: Record<string, { icon: string; label: string; accent: string }> = {
  scout: { icon: "🔍", label: "Scout", accent: "text-cyan-400" },
  creator: { icon: "🔨", label: "Creator", accent: "text-purple-400" },
  amplifier: { icon: "📡", label: "Amplifier", accent: "text-blue-400" },
  cashier: { icon: "💰", label: "Cashier", accent: "text-emerald-400" },
  brain: { icon: "🧠", label: "Brain", accent: "text-amber-400" },
};

const statusToDot: Record<string, string> = {
  running: "bg-emerald-400 pulse-dot",
  idle: "bg-gray-400",
  error: "bg-red-400",
  completed: "bg-blue-400",
};

export default function ProductsPage() {
  const { data, loading, lastUpdate, error } = useApiPoller<PipelineData>(
    "/api/products-pipeline",
    30000,
  );

  if (loading) {
    return (
      <PageShell
        title="Digital Products Pipeline"
        subtitle="The Claws — autonomous product factory"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  const kpi = data?.kpi;
  const pipeline = data?.pipeline;
  const products = data?.products || [];
  const activity = data?.recent_activity || [];

  function renderClaw<T extends { status: string; last_run: string | null }>(
    key: string,
    claw: T,
    stats: (c: T) => React.ReactNode,
  ) {
    const meta = CLAW_META[key];
    return (
      <div key={key} className="rounded-lg border border-[var(--border-dim)] bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {meta.icon} {meta.label}
          </span>
          <span className={`h-2 w-2 rounded-full ${statusToDot[claw.status] || "bg-gray-400"}`} />
        </div>
        <div className="space-y-1 text-xs text-[var(--text-tertiary)]">
          {stats(claw)}
          {claw.last_run && <p className="text-[var(--text-muted)]">{timeAgo(claw.last_run)}</p>}
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="Digital Products Pipeline"
      subtitle="The Claws — autonomous product factory"
      lastUpdate={lastUpdate}
      error={error}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Products Created" value={kpi?.products_created ?? 0} glow="purple" />
        <MetricCard label="Published" value={kpi?.products_published ?? 0} glow="blue" />
        <MetricCard
          label="Total Revenue"
          value={formatUSD(kpi?.total_revenue ?? 0)}
          accent="text-emerald-400"
          glow="emerald"
        />
        <MetricCard
          label="Avg Quality"
          value={`${((kpi?.avg_quality_score ?? 0) * 100).toFixed(0)}%`}
          glow="cyan"
        />
      </div>

      {/* Pipeline Status — The 5 Claws */}
      <SectionCard title="Pipeline Status" subtitle="5 autonomous claws">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pipeline && (
            <>
              {renderClaw("scout", pipeline.scout, (c: ScoutClaw) => (
                <>
                  <p>
                    Signals: <span className="text-white">{c.signals_collected}</span>
                  </p>
                  <p>
                    Scored: <span className="text-white">{c.signals_scored}</span>
                  </p>
                </>
              ))}
              {renderClaw("creator", pipeline.creator, (c: CreatorClaw) => (
                <>
                  <p>
                    Forged: <span className="text-white">{c.products_forged}</span>
                  </p>
                  <p>
                    In Progress: <span className="text-white">{c.in_progress}</span>
                  </p>
                </>
              ))}
              {renderClaw("amplifier", pipeline.amplifier, (c: AmplifierClaw) => (
                <>
                  <p>
                    Published: <span className="text-white">{c.published}</span>
                  </p>
                  <p>
                    Pending: <span className="text-white">{c.pending}</span>
                  </p>
                </>
              ))}
              {renderClaw("cashier", pipeline.cashier, (c: CashierClaw) => (
                <>
                  <p>
                    Sales: <span className="text-white">{c.sales}</span>
                  </p>
                  <p>
                    Revenue: <span className="text-emerald-400">{formatUSD(c.revenue)}</span>
                  </p>
                </>
              ))}
              {renderClaw("brain", pipeline.brain, (c: BrainClaw) => (
                <>
                  <p>
                    Feedback: <span className="text-white">{c.feedback_loops}</span>
                  </p>
                  <p>
                    Optimized: <span className="text-white">{c.optimizations}</span>
                  </p>
                </>
              ))}
            </>
          )}
        </div>
      </SectionCard>

      {/* Product Catalog */}
      <div className="mt-6">
        <SectionCard title="Product Catalog" subtitle={`${products.length} products`}>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No products yet. The Claws will create products as signals are discovered.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-xs text-[var(--text-tertiary)] uppercase">
                    <th className="pr-4 pb-2 font-semibold">Title</th>
                    <th className="pr-4 pb-2 font-semibold">Niche</th>
                    <th className="pr-4 pb-2 font-semibold">Price</th>
                    <th className="pr-4 pb-2 font-semibold">Marketplace</th>
                    <th className="pr-4 pb-2 font-semibold">Status</th>
                    <th className="pr-4 pb-2 font-semibold">Quality</th>
                    <th className="pb-2 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr
                      key={`${p.title}-${i}`}
                      className="border-b border-[var(--border-dim)]/50 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-4 font-medium text-white">{p.title}</td>
                      <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{p.niche}</td>
                      <td className="py-2.5 pr-4 text-cyan-400">{formatUSD(p.price)}</td>
                      <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{p.marketplace}</td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            p.quality_score >= 0.8
                              ? "text-emerald-400"
                              : p.quality_score >= 0.5
                                ? "text-amber-400"
                                : "text-red-400"
                          }
                        >
                          {(p.quality_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-emerald-400">{formatUSD(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <SectionCard title="Recent Activity" subtitle="across all claws">
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No recent activity. Pipeline events will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {activity.map((a, i) => {
                const meta = CLAW_META[a.claw] || {
                  icon: "⚙",
                  label: a.claw,
                  accent: "text-gray-400",
                };
                return (
                  <div
                    key={`${a.timestamp}-${i}`}
                    className="flex items-start gap-3 rounded-lg border border-[var(--border-dim)]/50 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="mt-0.5 text-sm">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)]">{a.action}</p>
                      {a.detail && (
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{a.detail}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-xs font-medium ${meta.accent}`}>{meta.label}</span>
                      {a.timestamp && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {timeAgo(a.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
