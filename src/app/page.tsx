"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatUSD, formatPct, timeAgo } from "@/lib/formatters";
import { PnlAreaChart } from "@/components/charts";
import {
  MetricCardSkeleton,
  SwarmCardSkeleton,
  ChartSkeleton,
  ActivityFeedSkeleton,
  SaasGridSkeleton,
  Skeleton,
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
  { name: "CaptionCraft", url: "https://captioncraft.eganforge.com", icon: "CC", bg: "#F59E0B" },
  { name: "MailMint AI", url: "https://mailmint.eganforge.com", icon: "MM", bg: "#818CF8" },
  { name: "MeetSnap AI", url: "https://meetsnap.eganforge.com", icon: "MS", bg: "#34D399" },
  { name: "WriteMap AI", url: "https://writemap.eganforge.com", icon: "WM", bg: "#3B82F6" },
  { name: "LegalMind AI", url: "https://legalmind.eganforge.com", icon: "LM", bg: "#8B5CF6" },
  { name: "OutlineAI", url: "https://outlineai.eganforge.com", icon: "OA", bg: "#06B6D4" },
  { name: "IdeaSpark AI", url: "https://ideaspark.eganforge.com", icon: "IS", bg: "#FBBF24" },
  { name: "PostCraft AI", url: "https://postcraft.eganforge.com", icon: "PC", bg: "#EF4444" },
  { name: "PromptLab", url: "https://promptlab.eganforge.com", icon: "PL", bg: "#10B981" },
  { name: "TicketSort AI", url: "https://ticketsort.eganforge.com", icon: "TS", bg: "#F472B6" },
  { name: "PriceSpy AI", url: "https://pricespy.eganforge.com", icon: "PS", bg: "#14B8A6" },
  { name: "CodeDocs AI", url: "https://codedocs.eganforge.com", icon: "CD", bg: "#60A5FA" },
  { name: "Webhook Studio", url: "https://webhookstudio.eganforge.com", icon: "WS", bg: "#A78BFA" },
];

// ---------------------------------------------------------------------------
// Utility components
// ---------------------------------------------------------------------------

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    halted: "bg-red-500/20 text-red-400 border-red-500/30",
    degraded: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] || colors.unknown}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function PnlValue({ value }: { value: number }) {
  if (value > 0) return <span className="font-semibold text-emerald-400">+{formatUSD(value)}</span>;
  if (value < 0) return <span className="font-semibold text-red-400">{formatUSD(value)}</span>;
  return <span className="text-gray-400">{formatUSD(value)}</span>;
}

function borderColor(status: string, circuitBreaker?: boolean): string {
  if (circuitBreaker) return "border-l-red-500";
  if (status === "healthy") return "border-l-emerald-500";
  if (status === "degraded") return "border-l-amber-500";
  if (status === "halted") return "border-l-red-500";
  return "border-l-gray-600";
}

// ---------------------------------------------------------------------------
// Event type styling
// ---------------------------------------------------------------------------

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
// Section: Hero Stats Bar
// ---------------------------------------------------------------------------

function HeroStatsBar({
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
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
        <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">Portfolio Value</p>
        <p className="text-2xl font-bold tracking-tight">
          {formatUSD(empire.combined_portfolio_value)}
        </p>
        <p className="mt-1 text-xs text-gray-500">Peak: {formatUSD(empire.peak_portfolio)}</p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
        <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">Today&apos;s P&amp;L</p>
        <p className="text-2xl font-bold tracking-tight">
          <PnlValue value={empire.combined_daily_pnl} />
        </p>
        <p className="mt-1 text-xs text-gray-500">Peak day: {formatUSD(empire.peak_daily_pnl)}</p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
        <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">Monthly MRR</p>
        <p className="text-2xl font-bold tracking-tight text-blue-400">
          {formatUSD(empire.combined_mrr)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Stripe: {formatUSD(empire.stripe_mrr || 0)} | Crypto: {formatUSD(empire.web3_mrr || 0)}
        </p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
        <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">System Health</p>
        <p className={`text-2xl font-bold tracking-tight ${healthColor}`}>{healthPct}%</p>
        <p className="mt-1 text-xs text-gray-500">
          {healthyCount}/{totalSwarms} swarms healthy
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Swarm Cards
// ---------------------------------------------------------------------------

function TradeBotCard({
  swarm,
  tradebot,
}: {
  swarm: SwarmData;
  tradebot: StatusResponse["tradebot"];
}) {
  const status = tradebot.halted ? "halted" : swarm.status;
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(status, tradebot.halted)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">TradeBot</h3>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Daily P&amp;L</p>
          <PnlValue value={tradebot.daily_pnl_today} />
        </div>
        <div>
          <p className="text-gray-500">Portfolio</p>
          <p className="font-medium">{formatUSD(swarm.portfolio_value)}</p>
        </div>
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="font-medium">{formatPct(swarm.win_rate)}</p>
        </div>
        <div>
          <p className="text-gray-500">Trades Today</p>
          <p className="font-medium">{tradebot.trade_count_today}</p>
        </div>
        <div>
          <p className="text-gray-500">Regime</p>
          <p className="font-medium capitalize">{tradebot.market_regime || "\u2014"}</p>
        </div>
        <div>
          <p className="text-gray-500">Circuit Breaker</p>
          <p className={`font-medium ${tradebot.halted ? "text-red-400" : "text-emerald-400"}`}>
            {tradebot.halted ? "TRIGGERED" : "OK"}
          </p>
        </div>
      </div>
      {tradebot.positions.length > 0 && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <p className="mb-1 text-xs text-gray-500">Open Positions</p>
          <div className="flex flex-wrap gap-1.5">
            {tradebot.positions.map((p) => (
              <span key={p} className="rounded-md bg-gray-800 px-2 py-0.5 font-mono text-xs">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EchoSwarmCard({ swarm }: { swarm: SwarmData }) {
  const status = swarm.circuit_breaker ? "halted" : swarm.status;
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(status, swarm.circuit_breaker)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">EchoSwarm</h3>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Daily P&amp;L</p>
          <PnlValue value={swarm.daily_pnl} />
        </div>
        <div>
          <p className="text-gray-500">Open Positions</p>
          <p className="font-medium">{swarm.open_positions}</p>
        </div>
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="font-medium">{formatPct(swarm.win_rate)}</p>
        </div>
        <div>
          <p className="text-gray-500">Total P&amp;L</p>
          <PnlValue value={swarm.total_pnl} />
        </div>
        <div>
          <p className="text-gray-500">Trades Today</p>
          <p className="font-medium">{swarm.trades_today}</p>
        </div>
        <div>
          <p className="text-gray-500">Portfolio</p>
          <p className="font-medium">{formatUSD(swarm.portfolio_value)}</p>
        </div>
      </div>
    </div>
  );
}

function SaasFactoryCard({
  swarm,
  saas,
}: {
  swarm: SwarmData | undefined;
  saas: StatusResponse["saas"];
}) {
  const status = swarm?.status || "unknown";
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(status)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">SaaS Factory</h3>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">MRR</p>
          <p className="font-medium text-blue-400">{formatUSD(saas.total_mrr)}</p>
        </div>
        <div>
          <p className="text-gray-500">Live Apps</p>
          <p className="font-medium">{saas.live_products}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Products</p>
          <p className="font-medium">{saas.total_products}</p>
        </div>
        <div>
          <p className="text-gray-500">In Queue</p>
          <p className="font-medium text-purple-400">{saas.opportunity_queue}</p>
        </div>
      </div>
    </div>
  );
}

function Web3SwarmCard({ swarm }: { swarm: SwarmData }) {
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(swarm.status)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Web3 &amp; DeFi</h3>
        <StatusBadge status={swarm.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">MRR</p>
          <p className="font-medium text-blue-400">{formatUSD(swarm.mrr)}</p>
        </div>
        <div>
          <p className="text-gray-500">Portfolio</p>
          <p className="font-medium">{formatUSD(swarm.portfolio_value)}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Revenue</p>
          <PnlValue value={swarm.total_pnl} />
        </div>
        <div>
          <p className="text-gray-500">Subscribers</p>
          <p className="font-medium">{swarm.open_positions}</p>
        </div>
        <div>
          <p className="text-gray-500">Signals Sent</p>
          <p className="font-medium">{swarm.trades_today}</p>
        </div>
        <div>
          <p className="text-gray-500">Daily P&amp;L</p>
          <PnlValue value={swarm.daily_pnl} />
        </div>
      </div>
    </div>
  );
}

function GrowthEngineCard({ swarm }: { swarm: SwarmData }) {
  const isStale = swarm.trades_today === 0 && swarm.total_pnl === 0;
  const effectiveStatus = isStale ? "degraded" : swarm.status;
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(effectiveStatus)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Marketing &amp; Growth</h3>
        <StatusBadge status={effectiveStatus} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">X Posts</p>
          <p className="font-medium">{swarm.trades_today}</p>
        </div>
        <div>
          <p className="text-gray-500">Dir. Submissions</p>
          <p className="font-medium">{swarm.open_positions}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Last Active</p>
          <p className="text-xs font-medium">
            {swarm.sampled_at ? timeAgo(swarm.sampled_at) : "\u2014"}
          </p>
        </div>
      </div>
      {isStale && (
        <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <p className="text-xs text-amber-400">
            Growth engine appears stale — no recent marketing activity
          </p>
        </div>
      )}
    </div>
  );
}

function BinanceArbCard({ swarm }: { swarm: SwarmData }) {
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-800 ${borderColor(swarm.status)} bg-gray-900/80 p-5 backdrop-blur-sm`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Binance</h3>
        <StatusBadge status={swarm.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Portfolio</p>
          <p className="font-medium">{formatUSD(swarm.portfolio_value)}</p>
        </div>
        <div>
          <p className="text-gray-500">Cash %</p>
          <p className="font-medium">{formatPct(swarm.win_rate || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500">Positions</p>
          <p className="font-medium">{swarm.open_positions}</p>
        </div>
        <div>
          <p className="text-gray-500">Daily P&amp;L</p>
          <PnlValue value={swarm.daily_pnl} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Revenue Chart
// ---------------------------------------------------------------------------

function RevenueChart({ data }: { data: Array<{ date: string; pnl: number }> }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">30-Day P&amp;L</h2>
        <span className="text-xs text-gray-500">Daily combined revenue</span>
      </div>
      <PnlAreaChart data={data} />
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
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
      <h2 className="mb-4 text-base font-semibold">Recent Activity</h2>
      <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
        {events.length === 0 && <p className="text-sm text-gray-500">No recent events</p>}
        {events.slice(0, 10).map((ev, i) => {
          const { dot, label } = eventIcon(ev.type);
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-800/50"
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-200">{ev.message}</p>
                <p className="text-xs text-gray-500">
                  <span className="mr-2 font-medium">{label}</span>
                  {ev.timestamp ? timeAgo(ev.timestamp) : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: SaaS Products Grid
// ---------------------------------------------------------------------------

function SaasProductsGrid() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">SaaS Products</h2>
        <span className="text-xs text-gray-500">{SAAS_PRODUCTS.length} products</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {SAAS_PRODUCTS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-lg border border-gray-800 p-2.5 transition-all hover:border-gray-600 hover:bg-gray-800/50"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-black shadow-sm transition-transform group-hover:scale-105"
              style={{ background: p.bg }}
            >
              {p.icon}
            </span>
            <span className="truncate text-xs font-medium text-gray-200 group-hover:text-white">
              {p.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: System Health Indicators
// ---------------------------------------------------------------------------

function SystemHealthBar({ health }: { health: HealthResponse | null }) {
  const services: Array<{ name: string; status: string }> = [];

  if (health?.services) {
    for (const [name, svc] of Object.entries(health.services)) {
      services.push({
        name,
        status: (svc as { status: string }).status,
      });
    }
  }
  if (health?.docker) {
    for (const [name, svc] of Object.entries(health.docker)) {
      services.push({
        name: `docker:${name}`,
        status: (svc as { status: string }).status,
      });
    }
  }
  if (health?.pm2) {
    for (const [name, svc] of Object.entries(health.pm2)) {
      services.push({
        name: `pm2:${name}`,
        status: (svc as { status: string }).status,
      });
    }
  }

  if (services.length === 0) {
    const fallback = ["egan-trade", "egan-master", "egan-saas", "docker", "pm2"];
    for (const name of fallback) {
      services.push({ name, status: "unknown" });
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
      <h2 className="mb-3 text-base font-semibold">System Services</h2>
      <div className="flex flex-wrap gap-3">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="flex items-center gap-1.5 rounded-md bg-gray-800/60 px-2.5 py-1.5"
          >
            <StatusDot status={svc.status} />
            <span className="text-xs text-gray-300">{svc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Revenue Progress Bar
// ---------------------------------------------------------------------------

function RevenueProgressBar({ empire }: { empire: EmpireData }) {
  const runRate = empire.combined_mrr + empire.combined_daily_pnl * 30;
  const progressToGoal = Math.min(100, (runRate / 15000) * 100);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-300">$15K/mo Target</p>
        <p className="text-sm font-medium tabular-nums">{progressToGoal.toFixed(1)}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, progressToGoal)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Run rate: {formatUSD(runRate)}/mo (MRR: {formatUSD(empire.combined_mrr)} + Trading:{" "}
        {formatUSD(empire.combined_daily_pnl * 30)}/mo)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading State — full skeleton dashboard
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
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
    </div>
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold">Connection Error</h1>
          <p className="mb-4 text-gray-400">{error}</p>
          <button
            onClick={refresh}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Loading state with animated skeletons
  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const e = data.empire;
  const swarmEntries = Object.entries(data.swarms);
  const healthyCount = swarmEntries.filter(
    ([, s]) => s.status === "healthy" && !s.circuit_breaker,
  ).length;

  // Find specific swarms by known keys
  const tradeBotSwarm = data.swarms["EganTradeBot"] || data.swarms["TradeBot"];
  const echoSwarm = data.swarms["EchoSwarm"];
  const saasSwarm = data.swarms["EganSaasFactory"] || data.swarms["SaasFactory"];
  const web3Swarm = data.swarms["EganWeb3Swarm"];
  const growthSwarm = data.swarms["EganGrowthEngine"];
  const binanceSwarm = data.swarms["BinanceArb"];

  // Chart data and events from financials endpoint
  const chartData = financials?.daily_pnl_history || [];
  const recentEvents = financials?.recent_events || [];

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Egan Forge</h1>
          <p className="text-sm text-gray-500">
            CEO Command Center
            <span className="mx-2 text-gray-700">|</span>
            Cycle #{e.cycle_count}
            <span className="mx-2 text-gray-700">|</span>
            <span className="text-gray-500">{lastUpdate}</span>
            {error && <span className="ml-2 text-xs text-red-400">({error})</span>}
          </p>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/financials"
            className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Financials
          </Link>
          <Link
            href="/assets"
            className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Assets
          </Link>
          <Link
            href="/web3"
            className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Web3
          </Link>
          <Link
            href="/proposals"
            className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Proposals
          </Link>
        </nav>
      </header>

      {/* 1. Hero Stats Bar */}
      <HeroStatsBar empire={e} healthyCount={healthyCount} totalSwarms={swarmEntries.length} />

      {/* Revenue Progress */}
      <div className="mb-6">
        <RevenueProgressBar empire={e} />
      </div>

      {/* 2. Revenue Swarm Cards (top row — money makers) */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {tradeBotSwarm && <TradeBotCard swarm={tradeBotSwarm} tradebot={data.tradebot} />}
        {echoSwarm && <EchoSwarmCard swarm={echoSwarm} />}
        {web3Swarm && <Web3SwarmCard swarm={web3Swarm} />}
      </div>

      {/* 3. Operations Swarm Cards (bottom row — support systems) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SaasFactoryCard swarm={saasSwarm} saas={data.saas} />
        {growthSwarm && <GrowthEngineCard swarm={growthSwarm} />}
        {binanceSwarm && <BinanceArbCard swarm={binanceSwarm} />}
      </div>

      {/* 3. Revenue Chart + 4. Activity Feed */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
              <h2 className="mb-4 text-base font-semibold">30-Day P&amp;L</h2>
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">
                Chart data loading...
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed events={recentEvents} />
        </div>
      </div>

      {/* 5. SaaS Products Grid — all 13 */}
      <div className="mb-6">
        <SaasProductsGrid />
      </div>

      {/* 6. System Health Indicators */}
      <div className="mb-6">
        <SystemHealthBar health={health} />
      </div>

      {/* Milestones */}
      {e.milestones.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
          <h2 className="mb-3 text-base font-semibold">Milestones</h2>
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
      <footer className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
        Egan Forge v3.0 | CEO: Josh Egan | Claude Opus + GPT-4o + Grok 4 + Gemini | Auto-refreshes
        every 20s
      </footer>
    </div>
  );
}
