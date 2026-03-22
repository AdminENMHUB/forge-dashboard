"use client";

import { useApiPoller } from "@/lib/hooks";
import { DashboardNav } from "@/components/nav";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const actions = [...((briefing?.executive_actions as Record<string, string>[]) ?? [])].reverse();

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <DashboardNav />
      <h1 className="mb-6 text-2xl font-bold">Executive Decision Trail</h1>
      <p className="mb-4 text-sm text-gray-500">
        Real actions taken by executive agents. No filler &mdash; results or silence.
      </p>

      <div className="space-y-3">
        {actions.length === 0 && (
          <p className="text-gray-500 italic">
            No executive actions recorded yet. Agents will write here after their first cycle.
          </p>
        )}
        {actions.map((action: Record<string, string>, i: number) => (
          <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{outcomeIcon(action.outcome)}</span>
                <span className="font-mono text-cyan-400">{action.agent}</span>
                <span className="text-xs text-gray-500">
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
            <p className="mt-1 text-sm text-gray-400">{action.reasoning}</p>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>Expected: {action.expected_outcome}</span>
              {action.measurement && <span>Measure: {action.measurement}</span>}
            </div>
            {action.outcome && (
              <p className="mt-2 text-sm text-emerald-400">Outcome: {action.outcome}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
