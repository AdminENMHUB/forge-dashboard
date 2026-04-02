"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatUSD, formatPct, timeAgo } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { PnlAreaChart } from "@/components/charts";
import {
  MetricCardSkeleton,
  SwarmCardSkeleton,
  ChartSkeleton,
  ActivityFeedSkeleton,
  SaasGridSkeleton,
  Skeleton,
  StatusBadge,
  SectionCard,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface HealthResponse {
  services?: Record<string, { status: string; uptime?: string }>;
  docker?: Record<string, { status: string }>;
  pm2?: Record<string, { status: string }>;
  [key: string]: unknown;
}

interface FinancialsResponse {
  daily_pnl_history?: Array<{ date: string; pnl: number }>;
  recent_events?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = "";

const SAAS_PRODUCTS = [
  {
    name: "CaptionCraft",
    url: "https://eganforge.com/products/captioncraft",
    icon: "CC",
    bg: "#F59E0B",
  },
  {
    name: "MailMint AI",
    url: "https://eganforge.com/products/mailmint",
    icon: "MM",
    bg: "#818CF8",
  },
  {
    name: "MeetSnap AI",
    url: "https://eganforge.com/products/meetsnap",
    icon: "MS",
    bg: "#34D399",
  },
  {
    name: "WriteMap AI",
    url: "https://eganforge.com/products/writemap",
    icon: "WM",
    bg: "#3B82F6",
  },
  {
    name: "LegalMind AI",
    url: "https://eganforge.com/products/legalmind",
    icon: "LM",
    bg: "#8B5CF6",
  },
  { name: "OutlineAI", url: "https://eganforge.com/products/outlineai", icon: "OA", bg: "#06B6D4" },
  {
    name: "IdeaSpark AI",
    url: "https://eganforge.com/products/ideaspark",
    icon: "IS",
    bg: "#FBBF24",
  },
  {
    name: "PostCraft AI",
    url: "https://eganforge.com/products/postcraft",
    icon: "PC",
    bg: "#EF4444",
  },
  { name: "PromptLab", url: "https://eganforge.com/products/promptlab", icon: "PL", bg: "#10B981" },
  {
    name: "TicketSort AI",
    url: "https://eganforge.com/products/ticketsort",
    icon: "TS",
    bg: "#F472B6",
  },
  {
    name: "PriceSpy AI",
    url: "https://eganforge.com/products/pricespy",
    icon: "PS",
    bg: "#14B8A6",
  },
  {
    name: "CodeDocs AI",
    url: "https://eganforge.com/products/codedocs",
    icon: "CD",
    bg: "#60A5FA",
  },
  {
    name: "Webhook Studio",
    url: "https://eganforge.com/products/webhook-studio",
    icon: "WS",
    bg: "#A78BFA",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function PnlValue({ value }: { value: number }) {
  if (value > 0) return <span className="font-semibold text-emerald-400">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="font-semibold text-red-400">{formatUSD(value)}</span>;
  return <span className="text-[var(--text-tertiary)]">{formatUSD(value)}</span>;
}

function borderAccent(status: string, circuitBreaker?: boolean): string {
  if (circuitBreaker) return "border-l-red-500 glow-red";
  if (status === "healthy") return "border-l-emerald-500 glow-emerald";
  if (status === "degraded") return "border-l-amber-500 glow-amber";
  if (status === "halted") return "border-l-red-500 glow-red";
  return "border-l-gray-600";
}

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    healthy: "bg-emerald-400",
    running: "bg-emerald-400",
    online: "bg-emerald-400",
    halted: "bg-red-400",
    stopped: "bg-red-400",
    errored: "bg-red-400",
    degraded: "bg-amber-400",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color[status] || "bg-gray-500"}`}
      title={status}
    />
  );
}

function eventIcon(type: string): { dot: string; label: string } {
  switch (type) {
    case "trade":
      return { dot: "bg-emerald-400", label: "Trade" };
    case "alert":
      return { dot: "bg-red-400", label: "Alert" };
    case "deploy":
      return { dot: "bg-blue-400", label: "Deploy" };
    case "saas":
      return { dot: "bg-purple-400", label: "SaaS" };
    case "web3":
      return { dot: "bg-cyan-400", label: "Web3" };
    case "report":
      return { dot: "bg-blue-400", label: "Report" };
    case "llm_call":
      return { dot: "bg-purple-400", label: "AI" };
    case "outcome":
      return { dot: "bg-emerald-400", label: "Outcome" };
    case "decision":
      return { dot: "bg-amber-400", label: "Decision" };
    case "error":
      return { dot: "bg-red-400", label: "Error" };
    default:
      return { dot: "bg-gray-400", label: type || "Event" };
  }
}

// ---------------------------------------------------------------------------
// Hook: multi-endpoint poller
// ---------------------------------------------------------------------------

function useMultiPoller(intervalMs: number = 20000) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [financials, setFinancials] = useState<FinancialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const [statusRes, healthRes, financialsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/status`, { signal }),
        fetch(`${API_BASE}/api/health`, { signal }),
        fetch(`${API_BASE}/api/financials`, { signal }),
      ]);

      if (statusRes.status === "fulfilled" && statusRes.value.ok) {
        setStatus(await statusRes.value.json());
      }
      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
      }
      if (financialsRes.status === "fulfilled" && financialsRes.value.ok) {
        setFinancials(await financialsRes.value.json());
      }

      if (
        statusRes.status === "rejected" ||
        (statusRes.status === "fulfilled" && !statusRes.value.ok)
      ) {
        const msg =
          statusRes.status === "rejected"
            ? (statusRes.reason as Error).message
            : `API returned ${statusRes.value.status}`;
        setError(msg);
      } else {
        setError("");
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { status, health, financials, loading, error, lastUpdate, refresh };
}

// ---------------------------------------------------------------------------
// Section: Hero KPI Row
// ---------------------------------------------------------------------------

function HeroKPIs({
  empire,
  healthyCount,
  totalSwarms,
}: {
  empire: EmpireData;
  healthyCount: number;
  totalSwarms: number;
}) {
  const healthPct = totalSwarms > 0 ? Math.round((healthyCount / totalSwarms) * 100) : 0;
  const healthColor =
    healthPct === 100 ? "text-emerald-400" : healthPct >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="glass glow-cyan rounded-xl p-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
          Portfolio Value
        </p>
        <p className="animate-in text-2xl font-bold tracking-tight text-white">
          {formatUSD(empire.combined_portfolio_value)}
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          Peak: {formatUSD(empire.peak_portfolio)}
        </p>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
          Today&apos;s P&amp;L
        </p>
        <p className="animate-in text-2xl font-bold tracking-tight">
          <PnlValue value={empire.combined_daily_pnl} />
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          Peak day: {formatUSD(empire.peak_daily_pnl)}
        </p>
      </div>

      <div className="glass glow-blue rounded-xl p-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
          Monthly MRR
        </p>
        <p className="animate-in text-2xl font-bold tracking-tight text-blue-400">
          {formatUSD(empire.combined_mrr)}
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          Stripe: {formatUSD(empire.stripe_mrr || 0)} | Crypto: {formatUSD(empire.web3_mrr || 0)}
        </p>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)] uppercase">
          System Health
        </p>
        <p className={`animate-in text-2xl font-bold tracking-tight ${healthColor}`}>
          {healthPct}%
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          {healthyCount}/{totalSwarms} swarms healthy
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Revenue Progress
// ---------------------------------------------------------------------------

function RevenueProgressBar({ empire }: { empire: EmpireData }) {
  const runRate = empire.combined_mrr + empire.combined_daily_pnl * 30;
  const progressToGoal = Math.min(100, (runRate / 15000) * 100);

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">$15K/mo Target</span>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
            {progressToGoal.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)]">Run rate: {formatUSD(runRate)}/mo</p>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="progress-glow h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(100, progressToGoal)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>MRR: {formatUSD(empire.combined_mrr)}</span>
        <span>Trading: {formatUSD(empire.combined_daily_pnl * 30)}/mo</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Swarm Cards
// ---------------------------------------------------------------------------

function SwarmCard({
  title,
  status,
  circuitBreaker,
  metrics,
  footer,
}: {
  title: string;
  status: string;
  circuitBreaker?: boolean;
  metrics: Array<{ label: string; value: React.ReactNode }>;
  footer?: React.ReactNode;
}) {
  const effectiveStatus = circuitBreaker ? "halted" : status;
  return (
    <div
      className={`glass rounded-xl border-l-[3px] p-5 ${borderAccent(effectiveStatus, circuitBreaker)}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <StatusBadge status={effectiveStatus} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] text-[var(--text-tertiary)]">{m.label}</p>
            <p className="font-medium text-[var(--text-primary)]">{m.value}</p>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Activity Feed
// ---------------------------------------------------------------------------

function ActivityFeed({
  events,
}: {
  events: Array<{ type: string; message: string; timestamp: string }>;
}) {
  return (
    <SectionCard title="Recent Activity" glow="purple">
      <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No recent events</p>
        )}
        {events.slice(0, 12).map((ev, i) => {
          const { dot, label } = eventIcon(ev.type);
          return (
            <div
              key={i}
              className="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.02]"
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[var(--text-primary)] group-hover:text-white">
                  {ev.message}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  <span className="mr-2 font-medium text-[var(--text-tertiary)]">{label}</span>
                  {ev.timestamp ? timeAgo(ev.timestamp) : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: SaaS Products Grid
// ---------------------------------------------------------------------------

function SaasProductsGrid() {
  return (
    <SectionCard title="SaaS Products" subtitle={`${SAAS_PRODUCTS.length} products`} glow="amber">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {SAAS_PRODUCTS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-lg border border-[var(--border-dim)] p-2.5 transition-all duration-150 hover:border-[var(--border-bright)] hover:bg-white/[0.02]"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-black shadow-sm transition-transform duration-150 group-hover:scale-110"
              style={{ background: p.bg }}
            >
              {p.icon}
            </span>
            <span className="truncate text-xs font-medium text-[var(--text-secondary)] group-hover:text-white">
              {p.name}
            </span>
          </a>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: System Health
// ---------------------------------------------------------------------------

function SystemHealthBar({ health }: { health: HealthResponse | null }) {
  const services: Array<{ name: string; status: string }> = [];

  if (health?.services) {
    for (const [name, svc] of Object.entries(health.services)) {
      services.push({ name, status: (svc as { status: string }).status });
    }
  }
  if (health?.docker) {
    for (const [name, svc] of Object.entries(health.docker)) {
      services.push({ name: `docker:${name}`, status: (svc as { status: string }).status });
    }
  }
  if (health?.pm2) {
    for (const [name, svc] of Object.entries(health.pm2)) {
      services.push({ name: `pm2:${name}`, status: (svc as { status: string }).status });
    }
  }

  if (services.length === 0) {
    for (const name of ["egan-trade", "egan-master", "egan-saas", "egan-web3", "docker", "pm2"]) {
      services.push({ name, status: "unknown" });
    }
  }

  return (
    <SectionCard title="System Services" glow="cyan">
      <div className="flex flex-wrap gap-2">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-dim)] bg-white/[0.02] px-3 py-1.5"
          >
            <StatusDot status={svc.status} />
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{svc.name}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <PageShell title="Egan Forge" subtitle="Loading empire data...">
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="mb-6">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SwarmCardSkeleton key={i} />
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeedSkeleton />
        </div>
      </div>
      <SaasGridSkeleton />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const {
    status: data,
    health,
    financials,
    loading,
    error,
    lastUpdate,
    refresh,
  } = useMultiPoller(20000);

  // Error state with no data loaded yet
  if (error && !data) {
    return (
      <PageShell title="Egan Forge" subtitle="CEO Command Center">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <span className="text-2xl">⚠</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Connection Error</h2>
            <p className="mb-6 text-sm text-[var(--text-tertiary)]">{error}</p>
            <button
              onClick={refresh}
              className="rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-semibold text-cyan-400 transition-all duration-150 hover:bg-cyan-500/30"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const e = data.empire;
  const swarmEntries = Object.entries(data.swarms);
  const healthyCount = swarmEntries.filter(
    ([, s]) => s.status === "healthy" && !s.circuit_breaker,
  ).length;

  const tradeBotSwarm = data.swarms["EganTradeBot"] || data.swarms["TradeBot"];
  const echoSwarm = data.swarms["EchoSwarm"];
  const saasSwarm = data.swarms["EganSaasFactory"] || data.swarms["SaasFactory"];
  const web3Swarm = data.swarms["EganWeb3Swarm"];
  const growthSwarm = data.swarms["EganGrowthEngine"];
  const forgeDefiSwarm = data.swarms["ForgeDefi"];

  const chartData = financials?.daily_pnl_history || [];
  const recentEvents = financials?.recent_events || [];

  return (
    <PageShell
      title="Egan Forge"
      subtitle={`CEO Command Center  ·  Cycle #${e.cycle_count}`}
      lastUpdate={lastUpdate}
      error={error}
    >
      {/* 1. Hero KPIs */}
      <HeroKPIs empire={e} healthyCount={healthyCount} totalSwarms={swarmEntries.length} />

      {/* 2. Revenue Progress */}
      <div className="mb-6">
        <RevenueProgressBar empire={e} />
      </div>

      {/* 3. Revenue Swarm Cards (top row) */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {tradeBotSwarm && (
          <SwarmCard
            title="TradeBot"
            status={data.tradebot.halted ? "halted" : tradeBotSwarm.status}
            circuitBreaker={data.tradebot.halted}
            metrics={[
              { label: "Daily P&L", value: <PnlValue value={data.tradebot.daily_pnl_today} /> },
              { label: "Portfolio", value: formatUSD(tradeBotSwarm.portfolio_value) },
              { label: "Win Rate", value: formatPct(tradeBotSwarm.win_rate) },
              { label: "Trades Today", value: data.tradebot.trade_count_today },
              {
                label: "Regime",
                value: (
                  <span className="capitalize">{data.tradebot.market_regime || "\u2014"}</span>
                ),
              },
              {
                label: "Circuit Breaker",
                value: (
                  <span className={data.tradebot.halted ? "text-red-400" : "text-emerald-400"}>
                    {data.tradebot.halted ? "TRIGGERED" : "OK"}
                  </span>
                ),
              },
            ]}
            footer={
              data.tradebot.positions.length > 0 ? (
                <div className="mt-3 border-t border-[var(--border-dim)] pt-3">
                  <p className="mb-1 text-[11px] text-[var(--text-tertiary)]">Open Positions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.tradebot.positions.map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ) : undefined
            }
          />
        )}

        {echoSwarm && (
          <SwarmCard
            title="EchoSwarm"
            status={echoSwarm.status}
            circuitBreaker={echoSwarm.circuit_breaker}
            metrics={[
              { label: "Daily P&L", value: <PnlValue value={echoSwarm.daily_pnl} /> },
              { label: "Open Positions", value: echoSwarm.open_positions },
              { label: "Win Rate", value: formatPct(echoSwarm.win_rate) },
              { label: "Total P&L", value: <PnlValue value={echoSwarm.total_pnl} /> },
              { label: "Trades Today", value: echoSwarm.trades_today },
              { label: "Portfolio", value: formatUSD(echoSwarm.portfolio_value) },
            ]}
          />
        )}

        {web3Swarm && (
          <SwarmCard
            title="Web3 & DeFi"
            status={web3Swarm.status}
            metrics={[
              {
                label: "MRR",
                value: <span className="text-blue-400">{formatUSD(web3Swarm.mrr)}</span>,
              },
              { label: "Portfolio", value: formatUSD(web3Swarm.portfolio_value) },
              { label: "Total Revenue", value: <PnlValue value={web3Swarm.total_pnl} /> },
              { label: "Subscribers", value: web3Swarm.open_positions },
              { label: "Signals Sent", value: web3Swarm.trades_today },
              { label: "Daily P&L", value: <PnlValue value={web3Swarm.daily_pnl} /> },
            ]}
          />
        )}
      </div>

      {/* 4. Operations Swarm Cards (bottom row) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SwarmCard
          title="SaaS Factory"
          status={saasSwarm?.status || "unknown"}
          metrics={[
            {
              label: "MRR",
              value: <span className="text-blue-400">{formatUSD(data.saas.total_mrr)}</span>,
            },
            { label: "Live Apps", value: data.saas.live_products },
            { label: "Total Products", value: data.saas.total_products },
            {
              label: "In Queue",
              value: <span className="text-purple-400">{data.saas.opportunity_queue}</span>,
            },
          ]}
        />

        {growthSwarm && (
          <SwarmCard
            title="Marketing & Growth"
            status={
              growthSwarm.trades_today === 0 && growthSwarm.total_pnl === 0
                ? "degraded"
                : growthSwarm.status
            }
            metrics={[
              { label: "X Posts", value: growthSwarm.trades_today },
              { label: "Dir. Submissions", value: growthSwarm.open_positions },
              {
                label: "Last Active",
                value: growthSwarm.sampled_at ? timeAgo(growthSwarm.sampled_at) : "\u2014",
              },
            ]}
            footer={
              growthSwarm.trades_today === 0 && growthSwarm.total_pnl === 0 ? (
                <div className="mt-3 rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                  <p className="text-[11px] text-amber-400">
                    Growth engine appears stale — no recent marketing activity
                  </p>
                </div>
              ) : undefined
            }
          />
        )}

        {forgeDefiSwarm && (
          <SwarmCard
            title="ForgeDefi"
            status={forgeDefiSwarm.status}
            metrics={[
              { label: "Portfolio", value: formatUSD(forgeDefiSwarm.portfolio_value) },
              { label: "Win Rate", value: formatPct(forgeDefiSwarm.win_rate || 0) },
              { label: "Positions", value: forgeDefiSwarm.open_positions },
              { label: "Daily P&L", value: <PnlValue value={forgeDefiSwarm.daily_pnl} /> },
            ]}
          />
        )}
      </div>

      {/* 5. Chart + Activity */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="30-Day P&L" subtitle="Daily combined revenue" glow="emerald">
            {chartData.length > 0 ? (
              <PnlAreaChart data={chartData} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-tertiary)]">
                Chart data loading...
              </div>
            )}
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed events={recentEvents} />
        </div>
      </div>

      {/* 6. SaaS Products */}
      <div className="mb-6">
        <SaasProductsGrid />
      </div>

      {/* 7. System Health */}
      <div className="mb-6">
        <SystemHealthBar health={health} />
      </div>

      {/* 8. Milestones */}
      {e.milestones.length > 0 && (
        <SectionCard title="Milestones" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {e.milestones.map((m) => (
              <span
                key={m}
                className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-[13px] text-emerald-400"
              >
                {m}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border-dim)] pt-6 text-center text-[11px] text-[var(--text-muted)]">
        Egan Forge v3.0 · CEO: Josh Egan · Claude Opus + GPT-4o + Grok 4 + Gemini · Auto-refreshes
        every 20s
      </footer>
    </PageShell>
  );
}
