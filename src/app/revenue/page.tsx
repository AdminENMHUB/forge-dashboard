"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { MetricCard, PnlText } from "@/components/ui";
import type { StatusResponse } from "@/types/empire";

export default function RevenuePage() {
  const { data: status, loading } = useApiPoller<StatusResponse>("/api/status", 30000);
  const { data: attribution } = useApiPoller<Record<string, unknown>>(
    "/api/revenue-attribution",
    60000,
  );
  const { data: reflection } = useApiPoller<Record<string, unknown>>(
    "/api/reflection-summary",
    120000,
  );

  if (loading && !status) {
    return (
      <PageShell title="Revenue Intel" subtitle="Live revenue metrics across all swarms">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  const empire = status?.empire;
  const swarms = status?.swarms ?? {};

  const totalPnl = empire?.combined_total_pnl ?? 0;
  const totalMrr = empire?.combined_mrr ?? 0;
  const totalPortfolio = empire?.combined_portfolio_value ?? 0;
  const dailyPnl = empire?.combined_daily_pnl ?? 0;

  const monthlyBurnEstimate = 45;
  const monthsRunway = totalPortfolio > 0 ? totalPortfolio / monthlyBurnEstimate : 0;
  const profitabilityGap =
    totalMrr > 0 ? Math.max(0, monthlyBurnEstimate - totalMrr) : monthlyBurnEstimate;

  const agentPnl = (attribution?.agent_pnl ?? {}) as Record<string, Record<string, number>>;
  const agentEntries = Object.entries(agentPnl).sort(([, a], [, b]) => (b.net ?? 0) - (a.net ?? 0));

  const swarmEntries = Object.entries(swarms).sort(([, a], [, b]) => b.total_pnl - a.total_pnl);

  return (
    <PageShell title="Revenue Intel" subtitle="Live revenue metrics across all swarms">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Total MRR" value={`$${totalMrr.toFixed(2)}`} />
        <MetricCard label="Total P&L" value={<PnlText value={totalPnl} />} />
        <MetricCard label="Portfolio" value={`$${totalPortfolio.toFixed(2)}`} />
        <MetricCard
          label="Daily P&L"
          value={<PnlText value={dailyPnl} />}
          subtext={dailyPnl > 0 ? "Positive day" : dailyPnl < 0 ? "Drawdown" : "Flat"}
        />
        <MetricCard
          label="Gap to Profit"
          value={profitabilityGap > 0 ? `$${profitabilityGap.toFixed(0)}/mo` : "PROFITABLE"}
          subtext={`Runway: ${monthsRunway.toFixed(1)}mo`}
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Swarm Revenue Breakdown</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {swarmEntries.map(([name, data]) => (
          <div key={name} className="glass rounded-xl border border-[var(--border-dim)] p-4">
            <p className="text-xs font-medium tracking-wider text-[var(--text-tertiary)] uppercase">
              {name.replace("Egan", "").replace("Forge", "")}
            </p>
            <p className="text-xl font-bold">
              <PnlText value={data.total_pnl} />
            </p>
            <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>MRR: ${data.mrr.toFixed(2)}</span>
              <span>{data.agents} agents</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>Win rate: {(data.win_rate * 100).toFixed(1)}%</span>
              <span>Portfolio: ${data.portfolio_value.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>

      {reflection && typeof reflection.summary === "string" && reflection.summary.length > 0 && (
        <div className="glass mb-6 rounded-xl border border-[var(--border-dim)] p-4">
          <h2 className="mb-2 text-lg font-semibold">Reflection synthesizer</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {(reflection.summary as string) || "—"}
          </p>
          {reflection.updated_at != null && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Updated {String(reflection.updated_at)}
            </p>
          )}
        </div>
      )}

      {agentEntries.length > 0 && (
        <>
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
        </>
      )}
    </PageShell>
  );
}
