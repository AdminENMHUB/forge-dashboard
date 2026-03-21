"use client";

import { useApiPoller } from "@/lib/hooks";
import { timeAgo } from "@/lib/formatters";
import { DashboardNav } from "@/components/nav";
import { Skeleton } from "@/components/ui";

interface ActivityEvent {
  type: string;
  message: string;
  timestamp: string;
  source?: string;
  details?: string;
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
      <div className="mx-auto min-h-screen max-w-5xl p-4 md:p-6">
        <header className="mb-6">
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </header>
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4"
            >
              <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-sm text-gray-500">
            Real-time events across all systems
            {lastUpdate && (
              <>
                <span className="mx-2 text-gray-700">|</span>
                <span>{lastUpdate}</span>
              </>
            )}
          </p>
        </div>
        <DashboardNav />
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
          <p className="text-xs tracking-wider text-gray-500 uppercase">Total Events</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
          <p className="text-xs tracking-wider text-gray-500 uppercase">Trades</p>
          <p className="text-2xl font-bold text-emerald-400">
            {events.filter((e) => e.type === "trade").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
          <p className="text-xs tracking-wider text-gray-500 uppercase">Alerts</p>
          <p className="text-2xl font-bold text-red-400">
            {events.filter((e) => e.type === "alert").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
          <p className="text-xs tracking-wider text-gray-500 uppercase">Deploys</p>
          <p className="text-2xl font-bold text-blue-400">
            {events.filter((e) => e.type === "deploy").length}
          </p>
        </div>
      </div>

      {/* Event List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Events Timeline</h2>
          <button
            onClick={refresh}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No activity events available. Events will appear as the system generates them.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => {
              const { dot, label, bg } = eventStyle(ev.type);
              return (
                <div
                  key={`${ev.timestamp}-${i}`}
                  className={`flex items-start gap-3 rounded-lg border ${bg} bg-gray-800/30 px-4 py-3 transition-colors hover:bg-gray-800/50`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200">{ev.message}</p>
                    {ev.details && <p className="mt-1 text-xs text-gray-500">{ev.details}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="mr-2 font-medium">{label}</span>
                      {ev.source && <span className="mr-2 text-gray-600">{ev.source}</span>}
                      {ev.timestamp ? timeAgo(ev.timestamp) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
