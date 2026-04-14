/**
 * Shared empire / API shapes for dashboard pages (status, constellation, revenue).
 */

export interface SwarmData {
  status: string;
  daily_pnl: number;
  total_pnl: number;
  portfolio_value: number;
  mrr: number;
  open_positions?: number;
  trades_today?: number;
  win_rate: number;
  circuit_breaker?: boolean;
  sampled_at?: string;
  agents?: number;
  active_agents?: number;
}

export interface EmpireData {
  combined_daily_pnl: number;
  combined_total_pnl: number;
  combined_portfolio_value: number;
  combined_mrr: number;
  combined_arr?: number;
  stripe_mrr?: number;
  web3_mrr?: number;
  peak_daily_pnl?: number;
  peak_portfolio?: number;
  cycle_count?: number;
  milestones?: string[];
  total_agents?: number;
  active_agents?: number;
  top_performers?: number;
  on_pdp?: number;
}

export interface StatusResponse {
  timestamp?: string;
  empire?: EmpireData;
  swarms?: Record<string, SwarmData>;
  tradebot?: {
    halted: boolean;
    halt_reason: string | null;
    positions?: string[];
    daily_pnl_today?: number;
    total_pnl?: number;
    trade_count_today?: number;
    market_regime?: string;
  };
  saas?: {
    total_mrr: number;
    total_products: number;
    live_products: number;
    opportunity_queue: number;
  };
}

export interface HealthResponse {
  status?: string;
  timestamp?: string;
  services?: Record<string, { status: string; uptime?: string }>;
  docker?: Record<string, { status: string }>;
  pm2?: Record<string, { status: string }>;
  developer_signal_api?: {
    public_url?: string;
    health_http_local?: number;
    systemd?: string;
    truth_snapshot?: Record<string, unknown> | null;
  };
}

/** Parsed organization.yaml (subset). */
export interface OrgAgent {
  name: string;
  role?: string;
  supervisor?: string;
  budget_daily_usd?: number;
  autonomy_level?: string;
  description?: string;
}

export interface OrgDepartment {
  name: string;
  head?: string;
  swarm: string;
  vps_path?: string;
  service?: string;
  budget_monthly_usd?: number;
  agents: OrgAgent[];
}

export interface OrgOversight {
  name: string;
  head?: string;
  vps_path?: string;
  service?: string;
  budget_monthly_usd?: number;
  agents: OrgAgent[];
}

export interface OrganizationDocument {
  company: { name: string; mission?: string; ceo?: string };
  departments: Record<string, OrgDepartment>;
  oversight: OrgOversight;
}

export interface ReflectionSummary {
  summary?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductCatalogResponse {
  products?: Array<{
    id?: string;
    title?: string;
    niche?: string;
    created_at?: string;
    [key: string]: unknown;
  }>;
  error?: string;
}

export interface OrchestratorSummary {
  orchestrator?: {
    registered_agents: number;
    active_teams: number;
    completed_teams_total: number;
    recent_success_rate: number;
    timestamp: string;
  };
  pool?: { max_concurrent: number; active: number; queued: number; completed_total: number };
  tools?: { total_tools: number; total_calls: number; error_rate: number };
  error?: string;
}

export interface SignalHealthResponse {
  status?: string;
  systems?: Record<string, string>;
  gateway?: string;
  error?: string;
}

/** Maps YAML department keys to master_state swarm names. */
export const DEPT_TO_SWARM: Record<string, string> = {
  trading: "EganTradeBot",
  predictions: "EchoSwarm",
  products: "EganSaasFactory",
  signals: "EganWeb3Swarm",
  oversight: "EganMasterSwarm",
};

/** Activity feed swarm filter hints (best-effort). */
export const DEPT_TO_ACTIVITY_SWARM: Record<string, string> = {
  trading: "trade",
  predictions: "echo",
  products: "saas",
  signals: "web3",
  oversight: "master",
  claws: "products",
};
