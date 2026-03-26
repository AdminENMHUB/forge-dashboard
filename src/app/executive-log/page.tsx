"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";

function outcomeIcon(outcome: string | null) {
  if (outcome === null) return "\uD83D\uDD50";
  if (outcome && !outcome.toLowerCase().includes("fail")) return "\u2705";
  return "\uD83D\uDD34";
}

export default function ExecutiveLogPage() {
  const { data: briefing, loading } = useApiPoller<Record<string, unknown>>(
    "/api/executive-briefing",
    15000,
  );

  if (loading && !briefing) {
    return (
      <PageShell title="Executive Log" subtitle="AI decision audit trail">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const actions = [...((briefing?.executive_actions as Record<string, string>[]) ?? [])].reverse();

  return (
    <PageShell title="Executive Log" subtitle="AI decision audit trail">
      <div className="space-y-3">
        {actions.length === 0 && (
          <p className="text-[var(--text-tertiary)] italic">
            No executive actions recorded yet. Agents will write here after their first cycle.
          </p>
        )}
        {actions.map((action: Record<string, string>, i: number) => (
          <div key={i} className="glass rounded-lg border border-[var(--border-dim)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{outcomeIcon(action.outcome)}</span>
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
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{action.reasoning}</p>
            <div className="mt-2 flex gap-4 text-xs text-[var(--text-tertiary)]">
              <span>Expected: {action.expected_outcome}</span>
              {action.measurement && <span>Measure: {action.measurement}</span>}
            </div>
            {action.outcome && (
              <p className="mt-2 text-sm text-emerald-400">Outcome: {action.outcome}</p>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
