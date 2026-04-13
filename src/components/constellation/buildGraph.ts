import type { Edge, Node } from "@xyflow/react";

import {
  DEPT_TO_ACTIVITY_SWARM,
  DEPT_TO_SWARM,
  type HealthResponse,
  type OrganizationDocument,
  type OrchestratorSummary,
  type ProductCatalogResponse,
  type ReflectionSummary,
  type SignalHealthResponse,
  type StatusResponse,
} from "@/types/empire";

export type EmpireNodeKind = "center" | "department" | "claws";

export interface EmpireNodeData extends Record<string, unknown> {
  label: string;
  kind: EmpireNodeKind;
  deptKey?: string;
  swarmName?: string;
  activitySwarmFilter?: string;
  status?: string;
  dailyPnl?: number;
  totalPnl?: number;
  mrr?: number;
  portfolio?: number;
  agents?: number;
  agentNames?: string[];
  budgetMonthly?: number;
  service?: string;
  serviceHealth?: string;
  productCount?: number;
  latestProducts?: string[];
  reflectionSnippet?: string;
  orchestratorSnippet?: string;
  signalSystems?: Record<string, string>;
}

const LAYOUT = {
  cx: 520,
  cy: 380,
  r: 300,
  centerW: 300,
  centerH: 120,
  deptW: 200,
  deptH: 96,
};

function normServiceKey(s: string): string {
  return s.replace(".service", "").trim();
}

function healthForService(
  health: HealthResponse | null | undefined,
  service?: string,
): string | undefined {
  if (!health?.services || !service) return undefined;
  const key = normServiceKey(service);
  for (const [k, v] of Object.entries(health.services)) {
    if (k.includes(key) || key.includes(k)) {
      return v.status;
    }
  }
  return undefined;
}

/** Fixed ring layout: center + departments + synthetic claws. */
export function buildEmpireFlowGraph(
  org: OrganizationDocument | null,
  status: StatusResponse | null,
  health: HealthResponse | null,
  catalog: ProductCatalogResponse | null,
  reflection: ReflectionSummary | null,
  orchestrator: OrchestratorSummary | null,
  signalHealth: SignalHealthResponse | null,
): { nodes: Node<EmpireNodeData>[]; edges: Edge[] } {
  const centerId = "node-center";

  if (!org) {
    return {
      nodes: [
        {
          id: centerId,
          type: "empireCenter",
          position: {
            x: LAYOUT.cx - LAYOUT.centerW / 2,
            y: LAYOUT.cy - LAYOUT.centerH / 2,
          },
          data: {
            label: "Egan Forge",
            kind: "center",
            reflectionSnippet: "Loading organization from /api/organization…",
          },
        },
      ],
      edges: [],
    };
  }

  const swarms = status?.swarms ?? {};
  const empire = status?.empire;

  const products = Array.isArray(catalog?.products) ? catalog!.products! : [];
  const latestTitles = products
    .slice(-4)
    .map((p) => (typeof p.title === "string" ? p.title : ""))
    .filter(Boolean);

  const reflectionSnippet =
    typeof reflection?.summary === "string" && reflection.summary.length > 0
      ? reflection.summary.slice(0, 280) + (reflection.summary.length > 280 ? "…" : "")
      : undefined;

  const orch = orchestrator?.orchestrator;
  const orchestratorSnippet = orch
    ? `Teams ${orch.active_teams} · Pool ${orchestrator?.pool?.active ?? 0}/${orchestrator?.pool?.max_concurrent ?? 0} · Tools ${orchestrator?.tools?.total_tools ?? 0}`
    : undefined;

  const nodes: Node<EmpireNodeData>[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: centerId,
    type: "empireCenter",
    position: {
      x: LAYOUT.cx - LAYOUT.centerW / 2,
      y: LAYOUT.cy - LAYOUT.centerH / 2,
    },
    data: {
      label: org?.company?.name ?? "Egan Forge",
      kind: "center",
      reflectionSnippet,
      orchestratorSnippet,
      mrr: empire?.combined_mrr,
      totalPnl: empire?.combined_total_pnl,
      portfolio: empire?.combined_portfolio_value,
      dailyPnl: empire?.combined_daily_pnl,
    },
  });

  type Row = {
    key: string;
    dept: {
      name: string;
      swarm: string;
      service?: string;
      budget_monthly_usd?: number;
      agents: { name: string }[];
    };
  };

  const rows: Row[] = [];

  if (org?.departments) {
    for (const [key, dept] of Object.entries(org.departments)) {
      rows.push({ key, dept });
    }
  }
  if (org?.oversight) {
    rows.push({
      key: "oversight",
      dept: {
        name: org.oversight.name,
        swarm: "EganMasterSwarm",
        service: org.oversight.service,
        budget_monthly_usd: org.oversight.budget_monthly_usd,
        agents: org.oversight.agents ?? [],
      },
    });
  }

  rows.push({
    key: "claws",
    dept: {
      name: "ProductClaws",
      swarm: "",
      service: undefined,
      budget_monthly_usd: undefined,
      agents: [],
    },
  });

  const n = rows.length;
  for (let i = 0; i < n; i++) {
    const { key, dept } = rows[i]!;
    const id = `node-${key}`;
    const swarmName = key === "claws" ? "" : (DEPT_TO_SWARM[key] ?? dept.swarm);
    const snap = swarmName ? swarms[swarmName] : undefined;

    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const x = LAYOUT.cx + LAYOUT.r * Math.cos(angle) - LAYOUT.deptW / 2;
    const y = LAYOUT.cy + LAYOUT.r * Math.sin(angle) - LAYOUT.deptH / 2;

    const agentNames = dept.agents.map((a) => a.name).slice(0, 8);
    const activitySwarmFilter = DEPT_TO_ACTIVITY_SWARM[key] ?? "";

    const isClaws = key === "claws";
    const isSignals = key === "signals";

    nodes.push({
      id,
      type: "empireDept",
      position: { x, y },
      data: {
        label: dept.name,
        kind: isClaws ? "claws" : "department",
        deptKey: key,
        swarmName: swarmName || undefined,
        activitySwarmFilter,
        status: snap?.status,
        dailyPnl: snap?.daily_pnl,
        totalPnl: snap?.total_pnl,
        mrr: snap?.mrr,
        portfolio: snap?.portfolio_value,
        agents: snap?.agents,
        agentNames,
        budgetMonthly: dept.budget_monthly_usd,
        service: dept.service,
        serviceHealth: healthForService(health, dept.service),
        productCount: isClaws ? products.length : undefined,
        latestProducts: isClaws ? latestTitles : undefined,
        signalSystems:
          isSignals && signalHealth?.systems
            ? (signalHealth.systems as Record<string, string>)
            : undefined,
      },
    });

    edges.push({
      id: `e-${centerId}-${id}`,
      source: centerId,
      target: id,
      type: "smoothstep",
      animated: snap?.status === "active" || snap?.status === "healthy",
    });
  }

  return { nodes, edges };
}
