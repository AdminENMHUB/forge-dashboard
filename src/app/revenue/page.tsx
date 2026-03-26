"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
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
      <PageShell title="Revenue Intel" subtitle="Executive briefing & revenue attribution">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const snapshot = (briefing?.empire_snapshot ?? {}) as Record<string, number>;
  const agentPnl = (attribution?.agent_pnl ?? {}) as Record<string, Record<string, number>>;
  const deptPnl = (attribution?.department_pnl ?? {}) as Record<string, Record<string, number>>;
  const dtp = briefing?.days_to_profitability as number | undefined;
  const phase = (briefing?.phase ?? {}) as Record<string, string>;

  const agentEntries = Object.entries(agentPnl).sort(([, a], [, b]) => (b.net ?? 0) - (a.net ?? 0));

  return (
    <PageShell title="Revenue Intel" subtitle="Executive briefing & revenue attribution">
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
          <div key={dept} className="glass rounded-xl border border-[var(--border-dim)] p-4">
            <p className="text-xs tracking-wider text-[var(--text-tertiary)] uppercase">{dept}</p>
            <p className="text-xl font-bold">
              <PnlText value={data.net ?? 0} />
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Rev: ${(data.revenue ?? 0).toFixed(2)} | Cost: ${(data.cost ?? 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Agent P&amp;L Leaderboard</h2>
      <div className="glass overflow-hidden rounded-xl border border-[var(--border-dim)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border-dim)] bg-white/[0.04]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Agent</th>
              <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Revenue</th>
              <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Cost</th>
              <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Net</th>
              <th className="px-4 py-3 text-right text-[var(--text-secondary)]">Events</th>
            </tr>
          </thead>
          <tbody>
            {agentEntries.map(([agent, data]) => (
              <tr
                key={agent}
                className="border-b border-[var(--border-dim)]/50 hover:bg-white/[0.04]"
              >
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
                <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                  {data.events ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
