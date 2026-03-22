"use client";

import { useApiPoller } from "@/lib/hooks";
import { DashboardNav } from "@/components/nav";
import { MetricCard, PnlText } from "@/components/ui";

export default function RevenuePage() {
  const { data: briefing, loading } = useApiPoller<Record<string, unknown>>(
    "/api/executive-briefing",
    30000,
  );
  const { data: attribution } = useApiPoller<Record<string, unknown>>(
    "/api/revenue-attribution",
    60000,
  );

  if (loading && !briefing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const snapshot = (briefing?.empire_snapshot ?? {}) as Record<string, number>;
  const agentPnl = (attribution?.agent_pnl ?? {}) as Record<string, Record<string, number>>;
  const deptPnl = (attribution?.department_pnl ?? {}) as Record<string, Record<string, number>>;
  const dtp = briefing?.days_to_profitability as number | undefined;
  const phase = (briefing?.phase ?? {}) as Record<string, string>;

  const agentEntries = Object.entries(agentPnl).sort(([, a], [, b]) => (b.net ?? 0) - (a.net ?? 0));

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <DashboardNav />
      <h1 className="mb-6 text-2xl font-bold">Revenue Attribution</h1>

      <div className="mb-6 grid grid-cols-5 gap-4">
        <MetricCard label="Total MRR" value={`$${(snapshot.combined_mrr ?? 0).toFixed(2)}`} />
        <MetricCard
          label="Total P&amp;L"
          value={<PnlText value={snapshot.combined_total_pnl ?? 0} />}
        />
        <MetricCard
          label="Portfolio"
          value={`$${(snapshot.combined_portfolio_value ?? 0).toFixed(2)}`}
        />
        <MetricCard
          label="Days to Profit"
          value={dtp != null ? dtp.toFixed(0) : "\u221E"}
          subtext={dtp === 0 ? "PROFITABLE" : ""}
        />
        <MetricCard
          label="Phase"
          value={phase.current ?? "\u2014"}
          subtext={phase.exit_criteria ?? ""}
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Department P&amp;L</h2>
      <div className="mb-6 grid grid-cols-4 gap-4">
        {Object.entries(deptPnl).map(([dept, data]) => (
          <div key={dept} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs tracking-wider text-gray-500 uppercase">{dept}</p>
            <p className="text-xl font-bold">
              <PnlText value={data.net ?? 0} />
            </p>
            <p className="text-xs text-gray-500">
              Rev: ${(data.revenue ?? 0).toFixed(2)} | Cost: ${(data.cost ?? 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Agent P&amp;L Leaderboard</h2>
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400">Agent</th>
              <th className="px-4 py-3 text-right text-gray-400">Revenue</th>
              <th className="px-4 py-3 text-right text-gray-400">Cost</th>
              <th className="px-4 py-3 text-right text-gray-400">Net</th>
              <th className="px-4 py-3 text-right text-gray-400">Events</th>
            </tr>
          </thead>
          <tbody>
            {agentEntries.map(([agent, data]) => (
              <tr key={agent} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-mono">{agent}</td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  ${(data.revenue_attributed ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-red-400">
                  ${(data.cost ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <PnlText value={data.net ?? 0} />
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{data.events ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
