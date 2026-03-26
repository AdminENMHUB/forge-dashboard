"use client";

import { useApiPoller } from "@/lib/hooks";
import { timeAgo } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { Skeleton } from "@/components/ui";

interface ActivityEvent {
  type: string;
  message?: string;
  detail?: string;
  timestamp?: string;
  ts?: string;
  source?: string;
  details?: string;
  category?: string;
}

function eventStyle(type: string): { dot: string; label: string; bg: string } {
  switch (type) {
    case "trade":
      return { dot: "bg-emerald-400", label: "Trade", bg: "border-emerald-500/20" };
    case "alert":
      return { dot: "bg-red-400", label: "Alert", bg: "border-red-500/20" };
    case "deploy":
      return { dot: "bg-blue-400", label: "Deploy", bg: "border-blue-500/20" };
    case "saas":
      return { dot: "bg-purple-400", label: "SaaS", bg: "border-purple-500/20" };
    case "proposal":
      return { dot: "bg-amber-400", label: "Proposal", bg: "border-amber-500/20" };
    case "web3":
      return { dot: "bg-cyan-400", label: "Web3", bg: "border-cyan-500/20" };
    case "report":
      return { dot: "bg-blue-400", label: "Report", bg: "border-blue-500/20" };
    case "llm_call":
      return { dot: "bg-purple-400", label: "AI", bg: "border-purple-500/20" };
    case "outcome":
      return { dot: "bg-emerald-400", label: "Outcome", bg: "border-emerald-500/20" };
    case "decision":
      return { dot: "bg-amber-400", label: "Decision", bg: "border-amber-500/20" };
    case "error":
      return { dot: "bg-red-400", label: "Error", bg: "border-red-500/20" };
    default:
      return { dot: "bg-gray-400", label: type || "Event", bg: "border-gray-700" };
  }
}

export default function ActivityPage() {
  const { data, loading, lastUpdate, refresh } = useApiPoller<
    ActivityEvent[] | { events?: ActivityEvent[]; recent_events?: ActivityEvent[] }
  >("/api/activity", 15000);

  // Normalize data shape — API may return array or object with events key
  const events: ActivityEvent[] = Array.isArray(data)
    ? data
    : data?.events || data?.recent_events || [];

  if (loading) {
    return (
      <PageShell title="Activity Feed" subtitle="Real-time empire events and actions">
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="glass flex items-center gap-3 rounded-lg border border-[var(--border-dim)] p-4"
            >
              <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Activity Feed"
      subtitle="Real-time empire events and actions"
      lastUpdate={lastUpdate}
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass rounded-xl border border-[var(--border-dim)] p-4">
          <p className="text-xs tracking-wider text-[var(--text-tertiary)] uppercase">
            Total Events
          </p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="glass rounded-xl border border-[var(--border-dim)] p-4">
          <p className="text-xs tracking-wider text-[var(--text-tertiary)] uppercase">Trades</p>
          <p className="text-2xl font-bold text-emerald-400">
            {events.filter((e) => e.type === "trade").length}
          </p>
        </div>
        <div className="glass rounded-xl border border-[var(--border-dim)] p-4">
          <p className="text-xs tracking-wider text-[var(--text-tertiary)] uppercase">Alerts</p>
          <p className="text-2xl font-bold text-red-400">
            {events.filter((e) => e.type === "alert").length}
          </p>
        </div>
        <div className="glass rounded-xl border border-[var(--border-dim)] p-4">
          <p className="text-xs tracking-wider text-[var(--text-tertiary)] uppercase">Deploys</p>
          <p className="text-2xl font-bold text-blue-400">
            {events.filter((e) => e.type === "deploy").length}
          </p>
        </div>
      </div>

      {/* Event List */}
      <div className="glass rounded-xl border border-[var(--border-dim)] p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Events Timeline</h2>
          <button
            onClick={refresh}
            className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
          >
            Refresh
          </button>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">
            No activity events available. Events will appear as the system generates them.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => {
              const { dot, label, bg } = eventStyle(ev.type);
              return (
                <div
                  key={`${ev.timestamp || ev.ts}-${i}`}
                  className={`flex items-start gap-3 rounded-lg border ${bg} bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.06]`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--text-primary)]">{ev.detail || ev.message}</p>
                    {ev.details && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{ev.details}</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      <span className="mr-2 font-medium">{label}</span>
                      {ev.source && (
                        <span className="mr-2 text-[var(--text-muted)]">{ev.source}</span>
                      )}
                      {ev.category && (
                        <span className="mr-2 text-[var(--text-muted)]">{ev.category}</span>
                      )}
                      {ev.timestamp || ev.ts ? timeAgo((ev.timestamp || ev.ts)!) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
