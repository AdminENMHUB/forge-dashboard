import { describe, expect, it } from "vitest";

import { buildEmpireFlowGraph } from "./buildGraph";
import type { OrganizationDocument } from "@/types/empire";

const minimalOrg: OrganizationDocument = {
  company: { name: "Test Co", mission: "x" },
  departments: {
    trading: {
      name: "Trading",
      swarm: "EganTradeBot",
      service: "egan-trade.service",
      budget_monthly_usd: 10,
      agents: [{ name: "execution_agent", role: "x" }],
    },
  },
  oversight: {
    name: "Oversight",
    swarm: "EganMasterSwarm",
    service: "egan-master.service",
    budget_monthly_usd: 5,
    agents: [{ name: "overseer", role: "x" }],
  },
};

describe("buildEmpireFlowGraph", () => {
  it("returns only center when org is null", () => {
    const { nodes, edges } = buildEmpireFlowGraph(null, null, null, null, null, null, null);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.id).toBe("node-center");
    expect(edges).toHaveLength(0);
  });

  it("includes center, departments, oversight, claws, and edges", () => {
    const { nodes, edges } = buildEmpireFlowGraph(
      minimalOrg,
      {
        swarms: {
          EganTradeBot: {
            status: "healthy",
            daily_pnl: 1,
            total_pnl: 2,
            portfolio_value: 100,
            mrr: 0,
            win_rate: 0.5,
          },
        },
      },
      { services: { "egan-trade": { status: "healthy" } } },
      { products: [{ title: "A" }, { title: "B" }] },
      { summary: "hello" },
      {
        orchestrator: {
          registered_agents: 10,
          active_teams: 1,
          completed_teams_total: 2,
          recent_success_rate: 0.9,
          timestamp: "t",
        },
        pool: { max_concurrent: 5, active: 1, queued: 0, completed_total: 9 },
        tools: { total_tools: 12, total_calls: 100, error_rate: 0 },
      },
      { status: "ok", systems: { tradebot: "online" } },
    );
    expect(nodes.some((n) => n.id === "node-center")).toBe(true);
    expect(nodes.some((n) => n.id === "node-trading")).toBe(true);
    expect(nodes.some((n) => n.id === "node-oversight")).toBe(true);
    expect(nodes.some((n) => n.id === "node-claws")).toBe(true);
    expect(edges.length).toBeGreaterThan(0);
    const claws = nodes.find((n) => n.id === "node-claws");
    expect(claws?.data.productCount).toBe(2);
  });
});
