"use client";

import { useApiPoller } from "@/lib/hooks";
import type {
  StatusResponse,
  HealthResponse,
  OrchestratorSummary,
  ProductCatalogResponse,
} from "@/types/empire";
import { POLL_INTERVALS } from "./constants";

export interface BusActivity {
  recent_log?: Array<{
    sender?: string;
    recipient?: string;
    type?: string;
    ts?: string;
    [k: string]: unknown;
  }>;
  message_count?: number;
  error?: string;
}

export interface FinancialsData {
  empire?: {
    total_revenue?: number;
    total_costs?: number;
    net_profit?: number;
    stripe_mrr?: number;
    web3_revenue?: number;
  };
  swarms?: Record<string, { pnl?: number; costs?: number; revenue?: number }>;
  error?: string;
}

export interface ActivityEvent {
  id?: string;
  type?: string;
  swarm?: string;
  agent?: string;
  message?: string;
  ts?: string;
  [k: string]: unknown;
}

export interface ActivityData {
  events?: ActivityEvent[];
  error?: string;
}

export interface AgentScorecard {
  name: string;
  department?: string;
  swarm?: string;
  rating?: number;
  pillars?: Record<string, number>;
  pdp?: { active: boolean; plan?: string };
  autonomy_level?: string;
  cost_daily?: number;
  error_rate?: number;
  [k: string]: unknown;
}

export interface ScorecardsData {
  agents?: AgentScorecard[];
  error?: string;
}

export interface TelemetryData {
  costs?: { total_daily?: number; by_provider?: Record<string, number> };
  tools?: { total_calls?: number; error_rate?: number };
  prediction_guard?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  error?: string;
}

export interface ProposalsData {
  proposals?: Array<{
    id?: string;
    title?: string;
    status?: string;
    swarm?: string;
    priority?: string;
    created_at?: string;
  }>;
  pending_count?: number;
  error?: string;
}

export interface GalaxyData {
  status: StatusResponse | null;
  health: HealthResponse | null;
  financials: FinancialsData | null;
  activity: ActivityData | null;
  scorecards: ScorecardsData | null;
  orchestrator: OrchestratorSummary | null;
  bus: BusActivity | null;
  telemetry: TelemetryData | null;
  productCatalog: ProductCatalogResponse | null;
  proposals: ProposalsData | null;
  loading: boolean;
  errors: string[];
  lastUpdate: string;
}

export function useGalaxyData(): GalaxyData {
  const status = useApiPoller<StatusResponse>("/api/status", POLL_INTERVALS.status);
  const health = useApiPoller<HealthResponse>("/api/health", POLL_INTERVALS.health);
  const financials = useApiPoller<FinancialsData>("/api/financials", POLL_INTERVALS.financials);
  const activity = useApiPoller<ActivityData>("/api/activity", POLL_INTERVALS.activity);
  const scorecards = useApiPoller<ScorecardsData>("/api/scorecards", POLL_INTERVALS.scorecards);
  const orchestrator = useApiPoller<OrchestratorSummary>(
    "/api/orchestrator",
    POLL_INTERVALS.orchestrator,
  );
  const bus = useApiPoller<BusActivity>("/api/bus/activity", POLL_INTERVALS.bus);
  const telemetry = useApiPoller<TelemetryData>("/api/telemetry", POLL_INTERVALS.telemetry);
  const productCatalog = useApiPoller<ProductCatalogResponse>(
    "/api/product-catalog",
    POLL_INTERVALS.productCatalog,
  );
  const proposals = useApiPoller<ProposalsData>("/api/proposals", POLL_INTERVALS.proposals);

  const errors = [
    status.error,
    health.error,
    financials.error,
    activity.error,
    scorecards.error,
    orchestrator.error,
    bus.error,
    telemetry.error,
    productCatalog.error,
    proposals.error,
  ].filter(Boolean) as string[];

  const loading = status.loading && health.loading && financials.loading && scorecards.loading;

  const lastUpdate = status.lastUpdate || health.lastUpdate || financials.lastUpdate || "";

  return {
    status: status.data,
    health: health.data,
    financials: financials.data,
    activity: activity.data,
    scorecards: scorecards.data,
    orchestrator: orchestrator.data,
    bus: bus.data,
    telemetry: telemetry.data,
    productCatalog: productCatalog.data,
    proposals: proposals.data,
    loading,
    errors,
    lastUpdate,
  };
}
