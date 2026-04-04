"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";

interface ActivityEvent {
  type: string;
  message: string;
  timestamp: string;
  source?: string;
  agent?: string;
}

interface ExecAction {
  timestamp?: string;
  agent?: string;
  action?: string;
  reasoning?: string;
  expected_outcome?: string;
  measurement?: string;
  profitability_filter?: string;
  outcome?: string | null;
}

function typeIcon(type: string, outcome: string | null | undefined) {
  if (type === "executive") {
    if (outcome === null || outcome === undefined) return "\uD83D\uDD50";
    if (outcome && !outcome.toLowerCase().includes("fail")) return "\u2705";
    return "\uD83D\uDD34";
  }
  if (type === "trade") return "\uD83D\uDCC8";
  if (type === "proposal") return "\uD83D\uDCCB";
  if (type === "alert" || type === "error" || type === "warning") return "\u26A0\uFE0F";
  return "\u26A1";
}

function typeBadge(type: string) {
  const colors: Record<string, string> = {
    executive: "bg-cyan-500/20 text-cyan-400",
    trade: "bg-emerald-500/20 text-emerald-400",
    proposal: "bg-purple-500/20 text-purple-400",
    alert: "bg-amber-500/20 text-amber-400",
    error: "bg-red-500/20 text-red-400",
  };
  return colors[type] || "bg-white/10 text-[var(--text-secondary)]";
}

export default function ExecutiveLogPage() {
  const { data: briefing, loading: loadingBriefing } = useApiPoller<Record<string, unknown>>(
    "/api/executive-briefing",
    15000,
  );
  const { data: activity, loading: loadingActivity } = useApiPoller<{
    events?: ActivityEvent[];
  }>("/api/activity", 15000);

  const loading = loadingBriefing && loadingActivity;

  if (loading && !briefing && !activity) {
    return (
      <PageShell title="Executive Log" subtitle="AI decision audit trail & live activity">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const execActions: ExecAction[] = [
    ...((briefing?.executive_actions as ExecAction[]) ?? []),
  ].reverse();

  const activityEvents = (activity?.events ?? []).slice(0, 50);

  const combined: Array<{ type: string; timestamp: string; data: ExecAction | ActivityEvent }> = [];

  for (const a of execActions) {
    combined.push({ type: "executive", timestamp: a.timestamp ?? "", data: a });
  }
  for (const e of activityEvents) {
    combined.push({ type: e.type ?? "activity", timestamp: e.timestamp ?? "", data: e });
  }
  combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <PageShell title="Executive Log" subtitle="AI decision audit trail & live activity">
      <div className="mb-4 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-cyan-500" /> Executive ({execActions.length})
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Trades
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-500" /> Proposals
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-white/30" /> Activity
        </span>
      </div>
      <div className="space-y-2">
        {combined.length === 0 && (
          <p className="text-[var(--text-tertiary)] italic">
            No activity recorded yet. Agents will appear here after their first cycle.
          </p>
        )}
        {combined.map((item, i) => {
          if (item.type === "executive") {
            const action = item.data as ExecAction;
            return (
              <div key={`exec-${i}`} className="glass rounded-lg border border-cyan-500/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeIcon("executive", action.outcome)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${typeBadge("executive")}`}>
                      EXEC
                    </span>
                    <span className="font-mono text-cyan-400">{action.agent}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {action.timestamp ? new Date(action.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                  {action.profitability_filter && (
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
                      {action.profitability_filter}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">{action.action}</p>
                {action.reasoning && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{action.reasoning}</p>
                )}
                <div className="mt-2 flex gap-4 text-xs text-[var(--text-tertiary)]">
                  {action.expected_outcome && <span>Expected: {action.expected_outcome}</span>}
                  {action.measurement && <span>Measure: {action.measurement}</span>}
                </div>
                {action.outcome && (
                  <p className="mt-2 text-sm text-emerald-400">Outcome: {action.outcome}</p>
                )}
              </div>
            );
          }

          const ev = item.data as ActivityEvent;
          return (
            <div
              key={`act-${i}`}
              className="glass rounded-lg border border-[var(--border-dim)] p-3"
            >
              <div className="flex items-center gap-2">
                <span>{typeIcon(item.type, undefined)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${typeBadge(item.type)}`}>
                  {item.type.toUpperCase()}
                </span>
                {ev.agent && <span className="font-mono text-xs text-cyan-400">{ev.agent}</span>}
                {ev.source && !ev.agent && (
                  <span className="text-xs text-[var(--text-tertiary)]">{ev.source}</span>
                )}
                <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                </span>
              </div>
              <p className="mt-1 text-sm">{ev.message}</p>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
