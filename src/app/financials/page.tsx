"use client";

import Link from "next/link";
import { useApiPoller } from "@/lib/hooks";
import { formatUSD } from "@/lib/formatters";
import { PnlAreaChart, SwarmCostChart, CostDonutChart } from "@/components/charts";

interface FinancialsData {
  daily_pnl_history: Record<string, number>;
  combined: {
    daily_pnl: number;
    total_pnl: number;
    portfolio_value: number;
    mrr: number;
    arr: number;
  };
  per_swarm: Record<
    string,
    {
      daily_pnl: number;
      total_pnl: number;
      portfolio_value: number;
      mrr: number;
    }
  >;
  saas_products: Array<{
    name: string;
    mrr: number;
    status: string;
  }>;
}

interface CostsData {
  today?: {
    cost?: number;
    calls?: number;
    by_swarm?: Record<string, { cost: number; calls: number }>;
  };
  week?: Record<string, { total_cost?: number; call_count?: number }>;
  month?: Record<string, { total_cost?: number }>;
  roi?: Record<
    string,
    { api_cost: number; revenue: number; net: number; roi_pct: number }
  >;
  budget?: {
    monthly_budget?: number;
    status?: string;
    alert?: string | null;
  };
  error?: string;
}

function MetricCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  accent?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent || ""}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function PnlText({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="text-emerald-400 font-semibold">
        +{formatUSD(value)}
      </span>
    );
  if (value < 0)
    return (
      <span className="text-red-400 font-semibold">{formatUSD(value)}</span>
    );
  return <span className="text-gray-400">{formatUSD(value)}</span>;
}

export default function FinancialsPage() {
  const {
    data: fin,
    error: finError,
    loading: finLoading,
    lastUpdate,
    refresh,
  } = useApiPoller<FinancialsData>("/api/financials", 60000);

  const { data: costs } = useApiPoller<CostsData>("/api/costs", 60000);

  // Loading state
  if (finLoading && !fin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading Financial Data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (finError && !fin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-gray-400">{finError}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!fin) return null;

  // Build chart data
  const pnlChartData = Object.entries(fin.daily_pnl_history)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({
      date,
      pnl: Math.round(pnl * 100) / 100,
    }));

  const swarmEntries = Object.entries(fin.per_swarm);

  // Build cost chart data (revenue vs cost per swarm)
  const costChartData = swarmEntries.map(([name, swarm]) => {
    const swarmCost =
      costs?.roi?.[name]?.api_cost ??
      (costs?.week?.[name] as { total_cost?: number })?.total_cost ??
      0;
    const revenue = swarm.daily_pnl * 30 + swarm.mrr;
    return {
      name: name.replace("Egan", "").replace("Swarm", ""),
      revenue: Math.max(0, revenue),
      cost: swarmCost,
    };
  });

  // Build cost donut data
  const costDonutData: Array<{ name: string; value: number }> = [];
  if (costs?.week) {
    for (const [swarm, data] of Object.entries(costs.week)) {
      if (typeof data === "object" && data && "total_cost" in data) {
        const cost = (data as { total_cost: number }).total_cost;
        if (cost > 0) {
          costDonutData.push({
            name: swarm.replace("Egan", "").replace("Swarm", ""),
            value: Math.round(cost * 100) / 100,
          });
        }
      }
    }
  }

  // Compute totals
  const todayCost = costs?.today?.cost ?? 0;
  const todayCalls = costs?.today?.calls ?? 0;
  const totalRevenue30d =
    Object.values(fin.daily_pnl_history).reduce((a, b) => a + b, 0) +
    fin.combined.mrr;
  const netProfit30d = totalRevenue30d - (todayCost * 30);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
            <p className="text-gray-500 text-sm">
              P&L, Revenue, Costs &amp; ROI Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/web3"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Web3
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">Updated: {lastUpdate}</p>
            {finError && <p className="text-xs text-red-400">{finError}</p>}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Portfolio Value"
          value={formatUSD(fin.combined.portfolio_value)}
        />
        <MetricCard
          label="30d Trading P&L"
          value={
            <PnlText
              value={Object.values(fin.daily_pnl_history).reduce(
                (a, b) => a + b,
                0
              )}
            />
          }
          subtext={`${Object.keys(fin.daily_pnl_history).length} days tracked`}
        />
        <MetricCard
          label="MRR"
          value={formatUSD(fin.combined.mrr)}
          subtext={`ARR: ${formatUSD(fin.combined.arr)}`}
          accent="text-blue-400"
        />
        <MetricCard
          label="Daily API Cost"
          value={formatUSD(todayCost)}
          subtext={`${todayCalls} calls today`}
          accent="text-orange-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* P&L History Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">
            Daily P&L History (30d)
          </h2>
          {pnlChartData.length > 0 ? (
            <PnlAreaChart data={pnlChartData} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No P&L history available
            </p>
          )}
        </div>

        {/* Revenue vs Cost by Swarm */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">Revenue vs Cost</h2>
          {costChartData.length > 0 ? (
            <SwarmCostChart data={costChartData} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No cost data available
            </p>
          )}
        </div>
      </div>

      {/* Cost Breakdown + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Cost by Swarm Donut */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">
            Weekly Cost Distribution
          </h2>
          {costDonutData.length > 0 ? (
            <CostDonutChart data={costDonutData} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No cost breakdown available
            </p>
          )}
        </div>

        {/* Budget Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">Budget Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Budget</span>
              <span className="font-mono">
                {formatUSD(costs?.budget?.monthly_budget ?? 50)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Spend</span>
              <span className="font-mono">{formatUSD(todayCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Projected Monthly</span>
              <span className="font-mono">
                {formatUSD(todayCost * 30)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span
                className={`font-medium ${
                  costs?.budget?.status === "within_budget"
                    ? "text-emerald-400"
                    : "text-yellow-400"
                }`}
              >
                {costs?.budget?.status?.replace(/_/g, " ").toUpperCase() ||
                  "UNKNOWN"}
              </span>
            </div>
            {costs?.budget?.alert && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                {costs.budget.alert}
              </div>
            )}
            <div className="border-t border-gray-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. 30d Net Profit</span>
                <PnlText value={netProfit30d} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Swarm Breakdown Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-lg mb-4">Department Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                <th className="text-left py-2 px-3">Department</th>
                <th className="text-right py-2 px-3">Portfolio</th>
                <th className="text-right py-2 px-3">Daily P&L</th>
                <th className="text-right py-2 px-3">Total P&L</th>
                <th className="text-right py-2 px-3">MRR</th>
                <th className="text-right py-2 px-3">API Cost/day</th>
              </tr>
            </thead>
            <tbody>
              {swarmEntries.map(([name, swarm]) => {
                const dailyCost =
                  costs?.roi?.[name]?.api_cost ??
                  0;
                return (
                  <tr
                    key={name}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30"
                  >
                    <td className="py-2 px-3 font-medium">
                      {name.replace("Egan", "").replace("Swarm", " Swarm")}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatUSD(swarm.portfolio_value)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <PnlText value={swarm.daily_pnl} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <PnlText value={swarm.total_pnl} />
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {swarm.mrr > 0 ? (
                        <span className="text-blue-400">
                          {formatUSD(swarm.mrr)}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-orange-400">
                      {dailyCost > 0 ? formatUSD(dailyCost) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700 font-semibold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3 text-right font-mono">
                  {formatUSD(fin.combined.portfolio_value)}
                </td>
                <td className="py-2 px-3 text-right">
                  <PnlText value={fin.combined.daily_pnl} />
                </td>
                <td className="py-2 px-3 text-right">
                  <PnlText value={fin.combined.total_pnl} />
                </td>
                <td className="py-2 px-3 text-right font-mono text-blue-400">
                  {formatUSD(fin.combined.mrr)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-orange-400">
                  {formatUSD(todayCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SaaS Products */}
      {fin.saas_products.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">SaaS Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {fin.saas_products.map((p) => (
              <div
                key={p.name}
                className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm capitalize">
                    {p.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.status || "unknown"}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm ${
                    p.mrr > 0 ? "text-emerald-400" : "text-gray-600"
                  }`}
                >
                  {p.mrr > 0 ? formatUSD(p.mrr) : "$0"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
        Financial Analytics | Real data from CostTracker &amp; State Files |
        Auto-refreshes every 60s
      </footer>
    </div>
  );
}
