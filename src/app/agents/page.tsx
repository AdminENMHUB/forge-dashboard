"use client";

import { useApiPoller } from "@/lib/hooks";
import { DashboardNav } from "@/components/nav";
import { MetricCard, PnlText, StatusBadge } from "@/components/ui";

interface Scorecard {
  agent: string;
  department: string;
  role: string;
  rating: number;
  label: string;
  pillars: {
    results: number;
    reliability: number;
    initiative: number;
    efficiency: number;
    growth: number;
  };
  pnl_attributed: number;
  llm_cost_30d: number;
  pdp_active: boolean;
}

function ratingStars(n: number) {
  return "\u2605".repeat(n) + "\u2606".repeat(5 - n);
}

function ratingColor(n: number) {
  if (n >= 4) return "text-emerald-400";
  if (n === 3) return "text-gray-300";
  return "text-red-400";
}

export default function AgentsPage() {
  const { data: scorecards, loading } = useApiPoller<Record<string, Scorecard>>(
    "/api/scorecards",
    30000,
  );
  const { data: talent } = useApiPoller<{
    pipeline: Record<string, string>[];
    compound_score: { score: number }[];
  }>("/api/talent", 60000);

  if (loading && !scorecards) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-gray-400">Loading Agent Roster...</p>
        </div>
      </div>
    );
  }

  const cards = scorecards ? Object.values(scorecards) : [];
  const sorted = [...cards].sort(
    (a, b) => b.rating - a.rating || b.pnl_attributed - a.pnl_attributed,
  );
  const topPerformers = sorted.filter((c) => c.rating >= 4);
  const underperformers = sorted.filter((c) => c.rating <= 2);

  const compoundScores = talent?.compound_score ?? [];
  const latestCompound = Array.isArray(compoundScores)
    ? compoundScores[compoundScores.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <DashboardNav />
      <h1 className="mb-6 text-2xl font-bold">Agent Roster &amp; Performance</h1>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricCard label="Total Agents" value={cards.length} />
        <MetricCard
          label="Top Performers"
          value={<span className="text-emerald-400">{topPerformers.length}</span>}
        />
        <MetricCard
          label="On PDP"
          value={<span className="text-red-400">{underperformers.length}</span>}
        />
        <MetricCard label="Compound Score" value={latestCompound?.score?.toFixed(1) ?? "\u2014"} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400">Agent</th>
              <th className="px-4 py-3 text-left text-gray-400">Department</th>
              <th className="px-4 py-3 text-left text-gray-400">Rating</th>
              <th className="px-4 py-3 text-right text-gray-400">P&amp;L Attributed</th>
              <th className="px-4 py-3 text-right text-gray-400">LLM Cost (30d)</th>
              <th className="px-4 py-3 text-left text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => (
              <tr key={card.agent} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-mono">{card.agent}</td>
                <td className="px-4 py-3 text-gray-400">{card.department}</td>
                <td className={`px-4 py-3 ${ratingColor(card.rating)}`}>
                  {ratingStars(card.rating)}{" "}
                  <span className="ml-1 text-xs text-gray-500">{card.label}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <PnlText value={card.pnl_attributed} />
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  ${card.llm_cost_30d.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {card.pdp_active ? (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                      PDP Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {talent?.pipeline && talent.pipeline.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Talent Pipeline</h2>
          <div className="grid gap-3">
            {talent.pipeline.map((candidate: Record<string, string>, i: number) => (
              <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400">{candidate.role}</span>
                  <StatusBadge status={candidate.status} />
                </div>
                <p className="mt-1 text-sm text-gray-400">{candidate.business_case}</p>
                <p className="mt-1 text-xs text-gray-500">Expected: {candidate.expected_revenue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
