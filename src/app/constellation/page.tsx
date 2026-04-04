"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatUSD } from "@/lib/formatters";
import { DashboardSidebar, DashboardNav } from "@/components/nav";

// ============================================================================
// TYPES
// ============================================================================

type NodeStatus = "active" | "healthy" | "degraded" | "error" | "halted" | "disabled" | "unknown";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  active?: boolean;
}

interface DepartmentDef {
  id: string;
  name: string;
  subtitle: string;
  swarmKey: string | null;
  serviceKey: string | null;
  color: string;
  agents: AgentDef[];
}

interface CNode {
  id: string;
  name: string;
  type: "center" | "department" | "agent";
  departmentId: string | null;
  subtitle?: string;
  role?: string;
  color: string;
  status: NodeStatus;
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
  metrics: Record<string, number | string | boolean | null>;
  active?: boolean;
}

interface Particle {
  fromId: string;
  toId: string;
  progress: number;
  speed: number;
  size: number;
  color: string;
  reverse: boolean;
  real: boolean;
}

interface Connection {
  fromId: string;
  toId: string;
  color: string;
}

interface StatusSwarm {
  status: string;
  daily_pnl: number;
  total_pnl: number;
  portfolio_value: number;
  mrr: number;
  open_positions: number;
  trades_today: number;
  win_rate: number;
  circuit_breaker: boolean;
  sampled_at: string;
}

interface StatusResponse {
  timestamp: string;
  empire: {
    combined_daily_pnl: number;
    combined_total_pnl: number;
    combined_portfolio_value: number;
    combined_mrr: number;
    combined_arr: number;
    stripe_mrr: number;
    web3_mrr: number;
    peak_daily_pnl: number;
    peak_portfolio: number;
    cycle_count: number;
    milestones: string[];
  };
  swarms: Record<string, StatusSwarm>;
  tradebot: {
    halted: boolean;
    halt_reason: string | null;
    positions: string[];
    daily_pnl_today: number;
    total_pnl: number;
    trade_count_today: number;
    market_regime: string;
  };
  saas: {
    total_mrr: number;
    total_products: number;
    live_products: number;
    opportunity_queue: number;
  };
}

interface HealthResponse {
  services?: Record<string, { status: string; uptime?: string }>;
  docker?: Record<string, { status: string }>;
  pm2?: Record<string, { status: string }>;
}

// ============================================================================
// COLORS & CONSTANTS
// ============================================================================

const C = {
  bg: "#050A14",
  accent: "#00D4FF",
  healthy: "#00FF88",
  revenue: "#FFB800",
  error: "#FF3344",
  degraded: "#FF8800",
  disabled: "#334155",
  text: "#E2E8F0",
  textDim: "#64748B",
  panelBg: "rgba(5, 10, 20, 0.92)",
  panelBorder: "rgba(0, 212, 255, 0.15)",
};

const STATUS_COLOR: Record<NodeStatus, string> = {
  active: C.healthy,
  healthy: C.healthy,
  degraded: C.degraded,
  error: C.error,
  halted: C.error,
  disabled: C.disabled,
  unknown: C.disabled,
};

// ============================================================================
// DEPARTMENT & AGENT DEFINITIONS (10 departments)
// ============================================================================

const DEPARTMENTS: DepartmentDef[] = [
  {
    id: "oversight",
    name: "OVERSIGHT",
    subtitle: "Master Swarm · 18 agents",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#00D4FF",
    agents: [
      { id: "health_monitor", name: "Health Monitor", role: "Proactive Health" },
      { id: "saas_sre", name: "SaaS SRE", role: "PM2 App Health" },
      { id: "product_doctor", name: "Product Doctor", role: "Landing Page QA" },
      { id: "revenue_guard", name: "Revenue Guard", role: "Revenue Pipeline" },
      { id: "revenue_intelligence", name: "Revenue Intel", role: "Stripe Analytics" },
      { id: "infra_sre", name: "Infra SRE", role: "VPS Infrastructure" },
      { id: "network_sentinel", name: "Net Sentinel", role: "API Uptime" },
      { id: "trading_ops_guard", name: "Trading Ops", role: "Exchange Guard" },
      { id: "prediction_guard", name: "Predict Guard", role: "Docker Monitor" },
      { id: "cost_controller", name: "Cost Ctrl", role: "Budget Guard" },
      { id: "log_janitor", name: "Log Janitor", role: "Disk Cleanup" },
      { id: "alert_triage", name: "Alert Triage", role: "Alert Router" },
      { id: "auto_triage", name: "Auto Triage", role: "Auto Remediation" },
      { id: "truth_verifier", name: "Truth Verifier", role: "Ground Truth" },
      { id: "qa_director", name: "QA Director", role: "Quality Assurance" },
      { id: "auto_dispatch", name: "Auto Dispatch", role: "Task Dispatch" },
      { id: "daily_briefing", name: "Briefing", role: "7am CEO Report" },
      { id: "weekly_report", name: "Weekly Report", role: "Weekly Summary" },
    ],
  },
  {
    id: "strategy",
    name: "STRATEGY",
    subtitle: "Intelligence · 12 agents",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#6366F1",
    agents: [
      { id: "cfo", name: "CFO", role: "P&L Attribution" },
      { id: "optimizer", name: "Optimizer", role: "Parameter Tuning" },
      { id: "cross_strategist", name: "Strategist", role: "Cross-Swarm Signals" },
      { id: "strategic_analyst", name: "CSO", role: "Strategic Analysis" },
      { id: "capital_allocator", name: "Allocator", role: "Capital Routing" },
      { id: "sharpe_allocator", name: "Sharpe Alloc", role: "Risk-Adj Returns" },
      { id: "strategy_lab", name: "Strategy Lab", role: "What-If Scenarios" },
      { id: "retrospective", name: "Retrospective", role: "Cycle Review" },
      { id: "hyper_agent", name: "Hyper Agent", role: "Self-Optimization" },
      { id: "improvement_engine", name: "Improve Engine", role: "Skill Upgrades" },
      { id: "ai_research_scout", name: "AI Research", role: "Alpha Discovery" },
      { id: "competitive_intel", name: "Comp Intel", role: "Market Intel" },
    ],
  },
  {
    id: "growth",
    name: "GROWTH",
    subtitle: "Growth Engine · 11 agents",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#F97316",
    agents: [
      { id: "cro_agent", name: "CRO", role: "Revenue Optimization" },
      { id: "coo_agent", name: "COO", role: "Operations Chief" },
      { id: "marketing_director", name: "Mktg Director", role: "Campaign Strategy" },
      { id: "content_publisher", name: "Publisher", role: "Content Deploy" },
      { id: "content_monetization", name: "Monetize", role: "Content Revenue" },
      { id: "conversion_funnel", name: "Conv Funnel", role: "Funnel Analysis" },
      { id: "social_engagement_tracker", name: "Social Track", role: "Engagement" },
      { id: "revenue_accelerator", name: "Rev Accel", role: "Revenue Sprint" },
      { id: "signal_audit", name: "Signal Audit", role: "Signal QA" },
      { id: "asset_reconciler", name: "Asset Recon", role: "Balance Verify" },
      { id: "promotion_evaluator", name: "Promo Eval", role: "Campaign ROI" },
    ],
  },
  {
    id: "evolution",
    name: "EVOLUTION",
    subtitle: "Self-Improvement · 6 agents",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#EC4899",
    agents: [
      { id: "spawner", name: "Spawner", role: "Agent Creator" },
      { id: "sub_agent_manager", name: "Sub-Agent Mgr", role: "Sub-Agent Coord" },
      { id: "saas_iteration", name: "SaaS Iteration", role: "Product Improve" },
      { id: "auto_apply", name: "Auto Apply", role: "Patch Deployer" },
      { id: "code_patch_agent", name: "Code Patch", role: "Code Fixes" },
      { id: "design_director", name: "Design Dir", role: "Brand Design" },
    ],
  },
  {
    id: "trading",
    name: "TRADING",
    subtitle: "TradeBot · 2 agents",
    swarmKey: "EganTradeBot",
    serviceKey: "egan-trade", // pragma: allowlist secret
    color: "#10B981",
    agents: [
      { id: "learning_agent", name: "Learning Agent", role: "Financial Advisor" },
      { id: "yield_agent", name: "Yield Agent", role: "Yield Optimization" },
    ],
  },
  {
    id: "predictions",
    name: "PREDICTIONS",
    subtitle: "EchoSwarm · 15 containers",
    swarmKey: "EchoSwarm",
    serviceKey: null,
    color: "#8B5CF6",
    agents: [
      { id: "misprice", name: "Misprice", role: "3-LLM Consensus" },
      { id: "momentum", name: "Momentum", role: "Price Trend" },
      { id: "event", name: "Event", role: "Volume Spikes" },
      { id: "arbitrage", name: "Arbitrage", role: "Cross-Market" },
      { id: "sentiment_echo", name: "Sentiment", role: "Grok Sentiment" },
      { id: "weather", name: "Weather", role: "Forecast Models" },
      { id: "news", name: "News", role: "RSS + Analysis" },
      { id: "orderbook", name: "Orderbook", role: "CLOB Microstructure" },
      { id: "crypto_market", name: "Crypto Mkt", role: "CoinGecko Data" },
      { id: "financial_event", name: "FOMC/CPI", role: "Macro Events" },
      { id: "market_maker", name: "Market Maker", role: "Spread Capture" },
      { id: "vol_harvester", name: "Vol Harvest", role: "Volatility Edge" },
      { id: "market_feed", name: "Market Feed", role: "Gamma Data" },
      { id: "arb_engine", name: "Arb Engine", role: "Latency Arb" },
      { id: "scout", name: "Scout", role: "Executor + Dashboard" },
    ],
  },
  {
    id: "products",
    name: "PRODUCTS",
    subtitle: "SaaS Factory · 15 agents",
    swarmKey: "EganSaasFactory",
    serviceKey: "egan-saas", // pragma: allowlist secret
    color: "#3B82F6",
    agents: [
      { id: "opportunity_scout", name: "Opp Scout", role: "Market Scan" },
      { id: "product_designer", name: "Designer", role: "Spec Generator" },
      { id: "builder", name: "Builder", role: "Product Builder" },
      { id: "monetization", name: "Monetize", role: "Stripe Setup" },
      { id: "launch_marketing", name: "Launch Mktg", role: "Multi-Channel" },
      { id: "email_nurture", name: "Email Nurture", role: "Drip Campaigns" },
      { id: "revenue_monitor_saas", name: "Rev Monitor", role: "MRR Tracking" },
      { id: "growth_agent", name: "Growth Agent", role: "Growth Proposals" },
      { id: "auto_growth", name: "Auto Growth", role: "Blog + Social" },
      { id: "social_proof", name: "Social Proof", role: "Testimonials" },
      { id: "content_marketing", name: "Content Mktg", role: "SEO Blog Posts" },
      { id: "customer_success", name: "Cust Success", role: "Retention" },
      { id: "seo_agent", name: "SEO Agent", role: "SEO Optimization" },
      { id: "social_media", name: "Social Media", role: "X + Reddit" },
      { id: "directory_submission", name: "Directory", role: "Listing Submit" },
    ],
  },
  {
    id: "signals",
    name: "SIGNALS",
    subtitle: "Web3 Swarm · 7 agents",
    swarmKey: "EganWeb3Swarm",
    serviceKey: "egan-web3", // pragma: allowlist secret
    color: "#FFB800",
    agents: [
      { id: "wallet_monitor", name: "Wallet Mon", role: "Payment Watch" },
      { id: "signal_terminal", name: "Signal Term", role: "Signal Gen" },
      { id: "signal_scorecard", name: "Scorecard", role: "Win Rate Track" },
      { id: "renewal_reminder", name: "Renewal", role: "Sub Reminders" },
      { id: "defi_yield", name: "DeFi Yield", role: "AAVE Mgmt" },
      { id: "nft_minter", name: "NFT Minter", role: "Pass Minting" },
      { id: "premium_signals", name: "Premium Sigs", role: "Signal Delivery" },
    ],
  },
  {
    id: "defi",
    name: "DEFI",
    subtitle: "ForgeDefi · 1 engine",
    swarmKey: "ForgeDefi",
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#84CC16",
    agents: [{ id: "arb_engine_defi", name: "Arb Engine", role: "DEX-CEX Arbitrage" }],
  },
  {
    id: "claws",
    name: "CLAWS",
    subtitle: "Product Pipeline · 5 stages",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    color: "#EF4444",
    agents: [
      { id: "claw_scout", name: "Scout", role: "Opportunity Scan" },
      { id: "claw_creator", name: "Creator", role: "Product Builder" },
      { id: "claw_amplifier", name: "Amplifier", role: "Marketing Push" },
      { id: "claw_cashier", name: "Cashier", role: "Payment API" },
      { id: "claw_brain", name: "Brain", role: "Analytics Report" },
    ],
  },
];

// ============================================================================
// LAYOUT — 2 rows of 5 for empire view, grid for department view
// ============================================================================

type ViewLevel = "empire" | "department";

interface LayoutResult {
  nodes: CNode[];
  connections: Connection[];
}

function calculateEmpireLayout(w: number, h: number): LayoutResult {
  const cx = w / 2;
  const cy = h / 2;
  const nodes: CNode[] = [];
  const connections: Connection[] = [];

  const centerR = Math.max(28, Math.min(w, h) * 0.032);
  nodes.push({
    id: "center",
    name: "EGAN FORGE",
    type: "center",
    departmentId: null,
    subtitle: "Empire Command",
    color: C.accent,
    status: "unknown",
    x: cx,
    y: cy,
    radius: centerR,
    pulsePhase: 0,
    metrics: {},
  });

  const colSpacing = w / 6;
  const rowGap = Math.min(h * 0.32, 200);
  const topY = cy - rowGap / 2;
  const botY = cy + rowGap / 2;
  const deptR = Math.max(38, Math.min(w, h) * 0.042);

  DEPARTMENTS.forEach((dept, i) => {
    const row = i < 5 ? 0 : 1;
    const col = i < 5 ? i : i - 5;
    const dx = colSpacing * (col + 1);
    const dy = row === 0 ? topY : botY;

    nodes.push({
      id: dept.id,
      name: dept.name,
      type: "department",
      departmentId: null,
      subtitle: dept.subtitle,
      color: dept.color,
      status: "unknown",
      x: dx,
      y: dy,
      radius: deptR,
      pulsePhase: i * 0.7,
      metrics: {},
    });
    connections.push({ fromId: "center", toId: dept.id, color: dept.color });

    dept.agents.forEach((agent, ai) => {
      nodes.push({
        id: `${dept.id}.${agent.id}`,
        name: agent.name,
        type: "agent",
        departmentId: dept.id,
        role: agent.role,
        color: dept.color,
        status: agent.active === false ? "disabled" : "active",
        x: dx,
        y: dy,
        radius: 15,
        pulsePhase: i * 0.7 + ai * 0.3,
        metrics: {},
        active: agent.active,
      });
      connections.push({
        fromId: dept.id,
        toId: `${dept.id}.${agent.id}`,
        color: dept.color,
      });
    });
  });

  return { nodes, connections };
}

function getDeptAgentPositions(
  dept: DepartmentDef,
  deptX: number,
  deptY: number,
  canvasW: number,
  canvasH: number,
): { x: number; y: number }[] {
  const cols = 2;
  const vSpacing = 70;
  const hSpacing = 200;
  const startX = deptX + Math.min(canvasW * 0.18, 220);
  const totalRows = Math.ceil(dept.agents.length / cols);
  const blockH = (totalRows - 1) * vSpacing;
  const startY = Math.max(60, Math.min(deptY - blockH / 2, canvasH - blockH - 60));

  return dept.agents.map((_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      x: startX + col * hSpacing,
      y: startY + row * vSpacing,
    };
  });
}

// ============================================================================
// CANVAS RENDERING ENGINE
// ============================================================================

class ConstellationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private time = 0;
  private animId = 0;
  private mouseX = -1000;
  private mouseY = -1000;

  nodes: CNode[] = [];
  connections: Connection[] = [];
  particles: Particle[] = [];
  hoveredNode: CNode | null = null;
  selectedNode: CNode | null = null;

  viewLevel: ViewLevel = "empire";
  focusedDeptId: string | null = null;
  private zoomProgress = 0;
  private empirePositions: Map<string, { x: number; y: number }> = new Map();
  private targetPositions: Map<string, { x: number; y: number }> = new Map();

  private stars: { x: number; y: number; s: number; b: number; sp: number }[] = [];
  private prevStatus: StatusResponse | null = null;

  onHover: (node: CNode | null, x: number, y: number) => void = () => {};
  onSelect: (node: CNode | null) => void = () => {};
  onViewChange: (level: ViewLevel, deptId: string | null) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.dpr = window.devicePixelRatio || 1;
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.2 + 0.3,
      b: Math.random() * 0.35 + 0.1,
      sp: Math.random() * 2 + 0.5,
    }));
  }

  resize(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const layout = calculateEmpireLayout(width, height);
    layout.nodes.forEach((n) => {
      const old = this.nodes.find((o) => o.id === n.id);
      if (old) {
        n.status = old.status;
        n.metrics = old.metrics;
      }
    });
    this.nodes = layout.nodes;
    this.connections = layout.connections;

    this.empirePositions.clear();
    this.nodes.forEach((n) => this.empirePositions.set(n.id, { x: n.x, y: n.y }));

    if (this.viewLevel === "department" && this.focusedDeptId) {
      this.computeDeptTargets(this.focusedDeptId);
      this.nodes.forEach((n) => {
        const t = this.targetPositions.get(n.id);
        if (t) {
          n.x = t.x;
          n.y = t.y;
        }
      });
    }

    this.rebuildParticles();
  }

  private rebuildParticles() {
    this.particles = [];
    this.connections.forEach((conn) => {
      if (conn.fromId !== "center") return;
      this.particles.push({
        fromId: conn.fromId,
        toId: conn.toId,
        progress: Math.random(),
        speed: 0.0003,
        size: 1.5,
        color: conn.color,
        reverse: false,
        real: false,
      });
    });
  }

  private computeDeptTargets(deptId: string) {
    this.targetPositions.clear();
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (!dept) return;

    const deptTargetX = this.w * 0.2;
    const deptTargetY = this.h * 0.5;

    this.targetPositions.set("center", { x: -100, y: -100 });

    DEPARTMENTS.forEach((d) => {
      if (d.id === deptId) {
        this.targetPositions.set(d.id, { x: deptTargetX, y: deptTargetY });
      } else {
        this.targetPositions.set(d.id, { x: -200, y: -200 });
      }
    });

    const agentPos = getDeptAgentPositions(dept, deptTargetX, deptTargetY, this.w, this.h);
    dept.agents.forEach((agent, i) => {
      this.targetPositions.set(`${deptId}.${agent.id}`, agentPos[i]);
    });

    DEPARTMENTS.forEach((d) => {
      if (d.id !== deptId) {
        d.agents.forEach((a) => {
          this.targetPositions.set(`${d.id}.${a.id}`, { x: -200, y: -200 });
        });
      }
    });
  }

  zoomToDepartment(deptId: string) {
    this.focusedDeptId = deptId;
    this.viewLevel = "department";
    this.computeDeptTargets(deptId);
    this.zoomProgress = 0;
    this.onViewChange("department", deptId);
  }

  zoomToEmpire() {
    this.viewLevel = "empire";
    this.focusedDeptId = null;
    this.targetPositions.clear();
    this.nodes.forEach((n) => {
      const ep = this.empirePositions.get(n.id);
      if (ep) this.targetPositions.set(n.id, ep);
    });
    this.zoomProgress = 0;
    this.onViewChange("empire", null);
  }

  updateData(status: StatusResponse | null, health: HealthResponse | null) {
    const center = this.nodes.find((n) => n.id === "center");
    if (center && status?.empire) {
      center.status = "active";
      center.metrics = {
        dailyPnl: status.empire.combined_daily_pnl,
        portfolio: status.empire.combined_portfolio_value,
        mrr: status.empire.combined_mrr,
        arr: status.empire.combined_arr,
        cycles: status.empire.cycle_count,
      };
    }

    DEPARTMENTS.forEach((dept) => {
      const node = this.nodes.find((n) => n.id === dept.id);
      if (!node) return;

      const swarm =
        dept.swarmKey && status?.swarms?.[dept.swarmKey] ? status.swarms[dept.swarmKey] : null;
      if (swarm) {
        node.status = swarm.circuit_breaker
          ? "halted"
          : swarm.status === "healthy"
            ? "healthy"
            : swarm.status === "degraded"
              ? "degraded"
              : "active";
        node.metrics = {
          dailyPnl: swarm.daily_pnl,
          totalPnl: swarm.total_pnl,
          winRate: swarm.win_rate,
          positions: swarm.open_positions,
          tradesToday: swarm.trades_today,
          circuitBreaker: swarm.circuit_breaker,
          portfolio: swarm.portfolio_value,
          mrr: swarm.mrr,
        };
      }

      if (dept.serviceKey && health?.services) {
        const svc = health.services[dept.serviceKey];
        if (svc) {
          const svcOk =
            svc.status === "active" || svc.status === "running" || svc.status === "healthy";
          if (!svcOk) node.status = "error";
          else if (node.status === "unknown") node.status = "active";
          if (svc.uptime) node.metrics.uptime = svc.uptime;
        }
      }

      if (dept.id === "predictions" && health?.docker) {
        const scout = health.docker["echo-scout"];
        if (scout) {
          const dockerOk =
            scout.status === "running" ||
            scout.status === "healthy" ||
            scout.status === "Up" ||
            String(scout.status).startsWith("Up");
          if (!dockerOk) node.status = "error";
          else if (node.status === "unknown") node.status = "active";
        }
      }

      if (
        dept.id === "oversight" &&
        node.status === "unknown" &&
        health?.services?.["egan-master"]
      ) {
        const svc = health.services["egan-master"];
        node.status =
          svc.status === "active" || svc.status === "running" || svc.status === "healthy"
            ? "active"
            : "error";
      }

      if (dept.id === "trading" && status?.tradebot) {
        if (status.tradebot.halted) node.status = "halted";
        node.metrics.regime = status.tradebot.market_regime;
        node.metrics.haltReason = status.tradebot.halt_reason;
      }

      if (dept.id === "products" && status?.saas) {
        node.metrics.mrr = status.saas.total_mrr;
        node.metrics.liveProducts = status.saas.live_products;
        node.metrics.totalProducts = status.saas.total_products;
        node.metrics.queue = status.saas.opportunity_queue;
      }

      dept.agents.forEach((agent) => {
        const an = this.nodes.find((n) => n.id === `${dept.id}.${agent.id}`);
        if (!an) return;
        if (agent.active === false) {
          an.status = "disabled";
        } else if (node.status === "halted") {
          an.status = "halted";
        } else if (node.status === "error") {
          an.status = "error";
        } else if (node.status === "healthy" || node.status === "active") {
          an.status = "active";
        } else if (node.status === "degraded") {
          an.status = "degraded";
        }
      });
    });
  }

  private spawnActivityPulse(fromId: string, toId: string, color: string, count: number = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        fromId,
        toId,
        progress: i * 0.15,
        speed: 0.003 + Math.random() * 0.002,
        size: 3,
        color,
        reverse: false,
        real: true,
      });
    }
  }

  detectActivity(status: StatusResponse | null) {
    if (!status || !this.prevStatus) {
      this.prevStatus = status;
      return;
    }
    const prev = this.prevStatus;

    if (status.empire.cycle_count !== prev.empire.cycle_count) {
      DEPARTMENTS.forEach((d) => this.spawnActivityPulse("center", d.id, C.accent, 1));
    }

    const pt = prev.tradebot;
    const ct = status.tradebot;
    if (ct && pt) {
      if (ct.trade_count_today !== pt.trade_count_today) {
        this.spawnActivityPulse("center", "trading", "#10B981", 3);
        this.spawnActivityPulse("trading", "trading.execution", "#10B981", 2);
      }
      if (ct.daily_pnl_today !== pt.daily_pnl_today) {
        this.spawnActivityPulse("trading", "center", "#10B981", 1);
      }
    }

    const pe = prev.swarms?.EchoSwarm;
    const ce = status.swarms?.EchoSwarm;
    if (ce && pe) {
      if (ce.trades_today !== pe.trades_today) {
        this.spawnActivityPulse("center", "predictions", "#8B5CF6", 3);
      }
      if (ce.total_pnl !== pe.total_pnl) {
        this.spawnActivityPulse("predictions", "center", "#8B5CF6", 1);
      }
    }

    const pw = prev.swarms?.EganWeb3Swarm;
    const cw = status.swarms?.EganWeb3Swarm;
    if (cw && pw && cw.trades_today !== pw.trades_today) {
      this.spawnActivityPulse("center", "signals", "#FFB800", 2);
    }

    const ps = prev.saas;
    const cs = status.saas;
    if (cs && ps) {
      if (cs.opportunity_queue !== ps.opportunity_queue || cs.live_products !== ps.live_products) {
        this.spawnActivityPulse("center", "products", "#3B82F6", 2);
      }
      if (cs.total_mrr !== ps.total_mrr) {
        this.spawnActivityPulse("products", "center", "#3B82F6", 2);
      }
    }

    this.prevStatus = status;
  }

  start() {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      this.time += dt;
      this.update(dt);
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animId);
  }

  private update(dt: number) {
    if (this.targetPositions.size > 0 && this.zoomProgress < 1) {
      this.zoomProgress = Math.min(1, this.zoomProgress + dt * 2.5);
      const ease = 1 - Math.pow(1 - this.zoomProgress, 3);

      this.nodes.forEach((n) => {
        const target = this.targetPositions.get(n.id);
        const source = this.empirePositions.get(n.id);
        if (target && source) {
          if (this.viewLevel === "empire") {
            n.x = n.x + (target.x - n.x) * ease;
            n.y = n.y + (target.y - n.y) * ease;
          } else {
            n.x = source.x + (target.x - source.x) * ease;
            n.y = source.y + (target.y - source.y) * ease;
          }
        }
      });

      if (this.zoomProgress >= 1) {
        this.nodes.forEach((n) => {
          const t = this.targetPositions.get(n.id);
          if (t) {
            n.x = t.x;
            n.y = t.y;
          }
        });
        if (this.viewLevel === "empire") {
          this.targetPositions.clear();
        }
      }
    }

    this.particles = this.particles.filter((p) => {
      p.progress += p.speed + dt * p.speed * 60;
      return p.progress < 1;
    });
    if (!this.particles.some((p) => !p.real)) {
      this.rebuildParticles();
    }
  }

  private render() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    this.renderStars(ctx);
    this.renderConnections(ctx);
    this.renderParticles(ctx);
    this.renderNodes(ctx);
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    this.stars.forEach((s) => {
      const brightness = s.b + Math.sin(this.time * s.sp) * 0.15;
      ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, brightness)})`;
      ctx.beginPath();
      ctx.arc(s.x * this.w, s.y * this.h, s.s, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderConnections(ctx: CanvasRenderingContext2D) {
    this.connections.forEach((conn) => {
      const from = this.nodes.find((n) => n.id === conn.fromId);
      const to = this.nodes.find((n) => n.id === conn.toId);
      if (!from || !to) return;
      if (from.x < -50 || to.x < -50) return;

      const isDeptConn = conn.fromId === "center";
      if (!isDeptConn && this.viewLevel === "empire") return;

      const isHovered =
        this.hoveredNode &&
        (this.hoveredNode.id === conn.toId || this.hoveredNode.id === conn.fromId);
      const alpha = isHovered ? 0.5 : 0.2;

      ctx.strokeStyle = conn.color + (isHovered ? "80" : "33");
      ctx.lineWidth = isDeptConn ? 2 : 1.5;
      ctx.beginPath();

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const cpOffset = Math.abs(to.y - from.y) * 0.3 + 20;

      if (isDeptConn) {
        const cpx = midX;
        const cpy = midY - cpOffset * 0.5;
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
      } else {
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
      }
      ctx.stroke();

      if (isHovered) {
        ctx.shadowColor = conn.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = conn.color + "22";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      void alpha;
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      const from = this.nodes.find((n) => n.id === p.fromId);
      const to = this.nodes.find((n) => n.id === p.toId);
      if (!from || !to) return;
      if (from.x < -50 || to.x < -50) return;

      const t = p.reverse ? 1 - p.progress : p.progress;

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const cpOffset = Math.abs(to.y - from.y) * 0.3 + 20;
      const cpx = midX;
      const cpy = midY - cpOffset * 0.5;

      const u = 1 - t;
      const x = u * u * from.x + 2 * u * t * cpx + t * t * to.x;
      const y = u * u * from.y + 2 * u * t * cpy + t * t * to.y;

      const fadeAlpha = Math.min(1, t * 5, (1 - t) * 5);
      ctx.fillStyle =
        p.color +
        Math.round(fadeAlpha * (p.real ? 200 : 100))
          .toString(16)
          .padStart(2, "0");
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.real) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  private renderNodes(ctx: CanvasRenderingContext2D) {
    this.nodes.forEach((node) => {
      if (node.x < -50 || node.y < -50) return;

      if (node.type === "center") {
        this.renderCenterNode(ctx, node);
      } else if (node.type === "department") {
        this.renderDeptNode(ctx, node);
      } else if (node.type === "agent" && this.viewLevel === "department") {
        this.renderAgentNode(ctx, node);
      }
    });
  }

  private renderCenterNode(ctx: CanvasRenderingContext2D, node: CNode) {
    if (this.viewLevel === "department") return;

    const pulse = Math.sin(this.time * 1.5) * 0.15 + 0.85;
    const r = node.radius;

    const outerGlow = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 2.5);
    outerGlow.addColorStop(0, `${C.accent}22`);
    outerGlow.addColorStop(0.5, `${C.accent}08`);
    outerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
    grad.addColorStop(0, `${C.accent}55`);
    grad.addColorStop(0.7, `${C.accent}22`);
    grad.addColorStop(1, `${C.accent}11`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${C.accent}${Math.round(pulse * 180)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = C.accent;
    ctx.font = `bold ${Math.max(10, r * 0.38)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EGAN", node.x, node.y - r * 0.15);
    ctx.fillText("FORGE", node.x, node.y + r * 0.25);
  }

  private renderDeptNode(ctx: CanvasRenderingContext2D, node: CNode) {
    const isHovered = this.hoveredNode?.id === node.id;
    const r = node.radius;
    const statusCol = STATUS_COLOR[node.status];
    const pulse = Math.sin(this.time * 1.2 + node.pulsePhase) * 0.1 + 0.9;
    const dept = DEPARTMENTS.find((d) => d.id === node.id);

    if (isHovered) {
      const glow = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 2);
      glow.addColorStop(0, `${node.color}18`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const innerGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
    innerGlow.addColorStop(0, `${node.color}18`);
    innerGlow.addColorStop(0.6, `${node.color}0A`);
    innerGlow.addColorStop(1, `${C.bg}CC`);
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${node.color}${Math.round(pulse * (isHovered ? 220 : 140))
      .toString(16)
      .padStart(2, "0")}`;
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = statusCol;
    ctx.beginPath();
    ctx.arc(node.x + r * 0.65, node.y - r * 0.65, 4, 0, Math.PI * 2);
    ctx.fill();

    const nameSize =
      this.viewLevel === "department" ? Math.max(11, r * 0.28) : Math.max(10, r * 0.26);
    ctx.fillStyle = node.color;
    ctx.font = `bold ${nameSize}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.name, node.x, node.y - nameSize * 0.45);

    if (node.subtitle) {
      ctx.fillStyle = `${C.text}88`;
      ctx.font = `${Math.max(9, nameSize * 0.75)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText(node.subtitle, node.x, node.y + nameSize * 0.45);
    }

    if (this.viewLevel === "empire" && dept) {
      ctx.fillStyle = `${node.color}AA`;
      ctx.font = `bold ${Math.max(9, nameSize * 0.7)}px ui-monospace, monospace`;

      const agentCount = dept.agents.length;
      ctx.fillText(`${agentCount} agents`, node.x, node.y + r + nameSize * 0.9);

      const pnl = node.metrics.dailyPnl;
      const mrr = node.metrics.mrr;
      if (typeof pnl === "number" && pnl !== 0) {
        const pnlColor = pnl >= 0 ? C.healthy : C.error;
        ctx.fillStyle = pnlColor;
        ctx.fillText(formatUSD(pnl), node.x, node.y + r + nameSize * 2.1);
      } else if (typeof mrr === "number" && mrr > 0) {
        ctx.fillStyle = C.revenue;
        ctx.fillText(`${formatUSD(mrr)}/mo`, node.x, node.y + r + nameSize * 2.1);
      }
    }
  }

  private renderAgentNode(ctx: CanvasRenderingContext2D, node: CNode) {
    const r = 12;
    const statusCol = STATUS_COLOR[node.status];
    const isHovered = this.hoveredNode?.id === node.id;

    if (isHovered) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle = node.status === "disabled" ? `${C.disabled}88` : `${node.color}44`;
    ctx.strokeStyle = node.status === "disabled" ? C.disabled : statusCol;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = node.status === "disabled" ? C.textDim : C.text;
    ctx.font = `${isHovered ? "bold " : ""}12px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(node.name, node.x + r + 10, node.y - 7);

    if (node.role) {
      ctx.fillStyle = C.textDim;
      ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(node.role, node.x + r + 10, node.y + 7);
    }

    ctx.fillStyle = statusCol;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  handleMouseMove(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;

    let found: CNode | null = null;
    for (const n of this.nodes) {
      if (n.x < -50) continue;
      if (n.type === "agent" && this.viewLevel === "empire") continue;
      const dist = Math.hypot(n.x - x, n.y - y);
      const hitR = n.type === "agent" ? 20 : n.radius + 10;
      if (dist < hitR) {
        found = n;
        break;
      }
    }

    this.hoveredNode = found;
    this.canvas.style.cursor = found ? "pointer" : "default";
    this.onHover(found, x, y);
  }

  handleClick(x: number, y: number) {
    for (const n of this.nodes) {
      if (n.x < -50) continue;
      if (n.type === "agent" && this.viewLevel === "empire") continue;
      const dist = Math.hypot(n.x - x, n.y - y);
      const hitR = n.type === "agent" ? 20 : n.radius + 10;
      if (dist < hitR) {
        if (n.type === "department" && this.viewLevel === "empire") {
          this.zoomToDepartment(n.id);
          return;
        }
        this.selectedNode = n;
        this.onSelect(n);
        return;
      }
    }
    if (this.viewLevel === "department") {
      this.zoomToEmpire();
    }
    this.selectedNode = null;
    this.onSelect(null);
  }
}

// ============================================================================
// DETAIL PANEL (slides in from right)
// ============================================================================

function DetailPanel({
  node,
  nodes,
  onClose,
}: {
  node: CNode;
  nodes: CNode[];
  onClose: () => void;
}) {
  const isDept = node.type === "department";
  const isCenter = node.type === "center";
  const statusCol = STATUS_COLOR[node.status];
  const childAgents = isDept
    ? nodes.filter((n) => n.type === "agent" && n.departmentId === node.id)
    : [];

  return (
    <div
      className="absolute top-0 right-0 z-30 flex h-full w-[340px] flex-col border-l"
      style={{
        background: C.panelBg,
        borderColor: C.panelBorder,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: statusCol, boxShadow: `0 0 8px ${statusCol}66` }}
            />
            <h2
              className="font-mono text-sm font-bold tracking-wider"
              style={{ color: node.color }}
            >
              {node.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-dim)] text-sm transition-colors hover:bg-white/[0.06]"
            style={{ color: C.textDim }}
          >
            ✕
          </button>
        </div>

        {(node.subtitle || node.role) && (
          <p className="mb-3 text-xs" style={{ color: C.textDim }}>
            {node.subtitle || node.role}
          </p>
        )}

        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
            style={{ background: `${statusCol}20`, color: statusCol }}
          >
            {node.status}
          </span>
          <span className="text-[10px]" style={{ color: C.textDim }}>
            {node.type}
          </span>
        </div>

        {Object.keys(node.metrics).length > 0 && (
          <div className="mb-4 space-y-2 text-xs">
            {typeof node.metrics.dailyPnl === "number" && (
              <MetricRow
                label="Daily P&L"
                value={formatUSD(node.metrics.dailyPnl as number)}
                color={(node.metrics.dailyPnl as number) >= 0 ? C.healthy : C.error}
              />
            )}
            {typeof node.metrics.totalPnl === "number" && (
              <MetricRow
                label="Total P&L"
                value={formatUSD(node.metrics.totalPnl as number)}
                color={(node.metrics.totalPnl as number) >= 0 ? C.healthy : C.error}
              />
            )}
            {typeof node.metrics.portfolio === "number" &&
              (node.metrics.portfolio as number) > 0 && (
                <MetricRow
                  label="Portfolio"
                  value={formatUSD(node.metrics.portfolio as number)}
                  color={C.text}
                />
              )}
            {typeof node.metrics.mrr === "number" && (node.metrics.mrr as number) > 0 && (
              <MetricRow
                label="MRR"
                value={formatUSD(node.metrics.mrr as number)}
                color={C.revenue}
              />
            )}
            {typeof node.metrics.winRate === "number" && (node.metrics.winRate as number) > 0 && (
              <MetricRow
                label="Win Rate"
                value={`${((node.metrics.winRate as number) * 100).toFixed(1)}%`}
                color={C.accent}
              />
            )}
            {typeof node.metrics.positions === "number" && (
              <MetricRow label="Positions" value={String(node.metrics.positions)} color={C.text} />
            )}
            {typeof node.metrics.tradesToday === "number" && (
              <MetricRow
                label="Trades Today"
                value={String(node.metrics.tradesToday)}
                color={C.text}
              />
            )}
            {node.metrics.circuitBreaker === true && (
              <MetricRow label="Circuit Breaker" value="HALTED" color={C.error} />
            )}
            {typeof node.metrics.regime === "string" && (
              <MetricRow
                label="Market Regime"
                value={node.metrics.regime as string}
                color={C.textDim}
              />
            )}
            {typeof node.metrics.liveProducts === "number" && (
              <MetricRow
                label="Live Products"
                value={String(node.metrics.liveProducts)}
                color={C.accent}
              />
            )}
            {typeof node.metrics.uptime === "string" && (
              <MetricRow label="Uptime" value={node.metrics.uptime as string} color={C.textDim} />
            )}
            {typeof node.metrics.cycles === "number" && (
              <MetricRow
                label="Master Cycles"
                value={String(node.metrics.cycles)}
                color={C.accent}
              />
            )}
          </div>
        )}

        {(isDept || isCenter) && (
          <div className="mb-3 flex gap-2">
            <button
              className="rounded border px-2 py-1 text-[10px] transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: `${node.color}44`, color: node.color }}
              onClick={() => {
                navigator.clipboard.writeText(
                  `ssh root@89.167.82.184 'systemctl restart ${
                    DEPARTMENTS.find((d) => d.id === node.id)?.serviceKey || "egan-master"
                  }'`,
                );
              }}
            >
              COPY RESTART CMD
            </button>
            <button
              className="rounded border px-2 py-1 text-[10px] transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: `${C.accent}44`, color: C.accent }}
              onClick={() => {
                navigator.clipboard.writeText(
                  `ssh root@89.167.82.184 'journalctl -u ${
                    DEPARTMENTS.find((d) => d.id === node.id)?.serviceKey || "egan-master"
                  } -n 50'`,
                );
              }}
            >
              COPY LOGS CMD
            </button>
          </div>
        )}

        {isDept && childAgents.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: `${node.color}15` }}>
            <div className="mb-2 font-bold tracking-wider" style={{ color: node.color }}>
              AGENTS ({childAgents.length})
            </div>
            <div className="space-y-1">
              {childAgents.map((agent) => {
                const asc = STATUS_COLOR[agent.status];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded px-2 py-1.5"
                    style={{ background: `${node.color}08` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: asc }} />
                      <span style={{ color: agent.status === "disabled" ? C.textDim : C.text }}>
                        {agent.name}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: asc }}>
                      {agent.status === "disabled" ? "OFF" : agent.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCenter && (
          <div className="border-t pt-3" style={{ borderColor: `${C.accent}15` }}>
            <div className="mb-2 font-bold tracking-wider" style={{ color: C.accent }}>
              DEPARTMENTS ({DEPARTMENTS.length})
            </div>
            <div className="space-y-1">
              {nodes
                .filter((n) => n.type === "department")
                .map((dept) => {
                  const dsc = STATUS_COLOR[dept.status];
                  return (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between rounded px-2 py-1.5"
                      style={{ background: `${dept.color}08` }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: dsc, boxShadow: `0 0 4px ${dsc}66` }}
                        />
                        <span style={{ color: dept.color }}>{dept.name}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: dsc }}>
                        {dept.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <ActivityTranscript node={node} />

        <div
          className="border-t pt-2 text-center text-[10px]"
          style={{ borderColor: C.panelBorder, color: C.textDim }}
        >
          EGAN FORGE CONSTELLATION v3.0
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVITY TRANSCRIPT
// ============================================================================

const DEPT_TO_SWARM: Record<string, string> = {
  oversight: "EganMasterSwarm",
  trading: "EganTradeBot",
  predictions: "EchoSwarm",
  signals: "EganWeb3Swarm",
  products: "EganSaasFactory",
};

const EVENT_COLORS: Record<string, string> = {
  llm_call: "#8B5CF6",
  report: "#06B6D4",
  decision: "#FFB800",
  outcome: "#10B981",
  cost: "#F59E0B",
  error: "#FF3344",
  heartbeat: "#334155",
};

function ActivityTranscript({ node }: { node: CNode }) {
  const [events, setEvents] = useState<
    { ts: string; source: string; type: string; detail: string; category: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const swarmFilter =
    node.type === "center" ? "" : DEPT_TO_SWARM[node.departmentId || node.id] || "";

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ swarm: swarmFilter, limit: "15" });
    fetch(`/api/activity?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setEvents(d.events || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [swarmFilter]);

  return (
    <div className="border-t pt-3" style={{ borderColor: `${node.color}15` }}>
      <div className="mb-2 font-bold tracking-wider" style={{ color: node.color }}>
        ACTIVITY LOG
      </div>
      {loading ? (
        <div className="py-4 text-center" style={{ color: C.textDim }}>
          Loading transcript...
        </div>
      ) : events.length === 0 ? (
        <div className="py-4 text-center" style={{ color: C.textDim }}>
          No recent activity
        </div>
      ) : (
        <div className="space-y-1.5">
          {events.map((ev, i) => (
            <div key={i} className="rounded px-2 py-1.5" style={{ background: `${node.color}06` }}>
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: EVENT_COLORS[ev.type] || C.textDim }}
                />
                <span
                  className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase"
                  style={{
                    color: EVENT_COLORS[ev.type] || C.textDim,
                    background: `${EVENT_COLORS[ev.type] || C.textDim}15`,
                  }}
                >
                  {ev.type}
                </span>
                <span className="text-[9px]" style={{ color: C.textDim }}>
                  {ev.ts?.slice(11) || ""}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.text }}>
                {ev.detail}
              </div>
              {ev.source && (
                <div className="mt-0.5 text-[9px]" style={{ color: C.textDim }}>
                  {ev.source}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TOOLTIP
// ============================================================================

function Tooltip({ node, x, y }: { node: CNode; x: number; y: number }) {
  const statusCol = STATUS_COLOR[node.status];
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border px-3 py-2"
      style={{
        left: x + 16,
        top: y - 10,
        background: C.panelBg,
        borderColor: `${node.color}33`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ background: statusCol }} />
        <span className="font-mono text-xs font-bold" style={{ color: node.color }}>
          {node.name}
        </span>
      </div>
      {(node.subtitle || node.role) && (
        <div className="mt-1 text-[10px]" style={{ color: C.textDim }}>
          {node.subtitle || node.role}
        </div>
      )}
      <div className="mt-1 text-[10px]" style={{ color: statusCol }}>
        {node.status.toUpperCase()}
      </div>
      {typeof node.metrics.dailyPnl === "number" && (
        <div
          className="mt-0.5 text-[10px]"
          style={{ color: (node.metrics.dailyPnl as number) >= 0 ? C.healthy : C.error }}
        >
          P&L: {formatUSD(node.metrics.dailyPnl as number)}
        </div>
      )}
      {node.type === "department" && (
        <div className="mt-1 text-[9px]" style={{ color: C.textDim }}>
          Click to zoom in
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SMALL HUD COMPONENTS
// ============================================================================

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: C.textDim }}>{label}</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span style={{ color }}>
        {count} {label}
      </span>
    </div>
  );
}

function HudMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-wider" style={{ color: C.textDim }}>
        {label}
      </span>
      <span className="font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ConstellationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConstellationEngine | null>(null);

  const [tooltip, setTooltip] = useState<{ node: CNode; x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<CNode | null>(null);
  const [allNodes, setAllNodes] = useState<CNode[]>([]);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("empire");
  const [focusedDeptId, setFocusedDeptId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, healthRes] = await Promise.allSettled([
        fetch("/api/status").then((r) => {
          if (!r.ok) throw new Error(`${r.status}`);
          return r.json() as Promise<StatusResponse>;
        }),
        fetch("/api/health").then((r) => {
          if (!r.ok) throw new Error(`${r.status}`);
          return r.json() as Promise<HealthResponse>;
        }),
      ]);

      const status = statusRes.status === "fulfilled" ? statusRes.value : null;
      const health = healthRes.status === "fulfilled" ? healthRes.value : null;

      if (status) setStatusData(status);

      if (engineRef.current) {
        engineRef.current.updateData(status, health);
        engineRef.current.detectActivity(status);
        setAllNodes([...engineRef.current.nodes]);
      }

      setConnected(!!status || !!health);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
    const interval = setInterval(() => void fetchData(), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ConstellationEngine(canvas);
    engineRef.current = engine;

    engine.onHover = (node, x, y) => setTooltip(node ? { node, x, y } : null);
    engine.onSelect = (node) => {
      setSelectedNode(node);
      if (engine.nodes) setAllNodes([...engine.nodes]);
    };
    engine.onViewChange = (level, deptId) => {
      setViewLevel(level);
      setFocusedDeptId(deptId);
    };

    const handleResize = () => {
      const sidebarWidth = window.innerWidth >= 1024 ? 224 : 0;
      const canvasWidth = window.innerWidth - sidebarWidth;
      engine.resize(canvasWidth, window.innerHeight);
      setAllNodes([...engine.nodes]);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const onMove = (e: MouseEvent) => engine.handleMouseMove(e.offsetX, e.offsetY);
    const onClick = (e: MouseEvent) => engine.handleClick(e.offsetX, e.offsetY);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);

    engine.start();

    return () => {
      engine.stop();
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && statusData) {
      setAllNodes([...engineRef.current.nodes]);
    }
  }, [statusData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedNode) {
          setSelectedNode(null);
          if (engineRef.current) engineRef.current.selectedNode = null;
        } else if (viewLevel === "department" && engineRef.current) {
          engineRef.current.zoomToEmpire();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNode, viewLevel]);

  const statusCounts = allNodes.reduce(
    (acc, n) => {
      if (n.type === "agent" || n.type === "department") {
        if (n.status === "active" || n.status === "healthy") acc.ok++;
        else if (n.status === "error" || n.status === "halted") acc.err++;
        else if (n.status === "degraded") acc.warn++;
        else if (n.status === "disabled") acc.off++;
        else acc.unknown++;
      }
      return acc;
    },
    { ok: 0, err: 0, warn: 0, off: 0, unknown: 0 },
  );

  const focusedDept = focusedDeptId ? DEPARTMENTS.find((d) => d.id === focusedDeptId) : null;

  return (
    <>
      <DashboardSidebar />

      <div className="relative h-screen overflow-hidden lg:pl-56" style={{ background: C.bg }}>
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* ── HUD TOP BAR ────────────────────────────────────── */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-10">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="pointer-events-auto flex items-center gap-3">
              {viewLevel === "department" && (
                <button
                  onClick={() => engineRef.current?.zoomToEmpire()}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border-dim)] px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors hover:bg-white/[0.06]"
                  style={{ color: C.accent, borderColor: `${C.accent}33` }}
                >
                  ← BACK
                </button>
              )}
              <h1
                className="font-mono text-sm font-bold tracking-[0.25em]"
                style={{ color: C.accent }}
              >
                {viewLevel === "empire" ? "CONSTELLATION" : ""}
              </h1>
              {viewLevel === "department" && focusedDept && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span style={{ color: C.textDim }}>EGAN FORGE</span>
                  <span style={{ color: C.textDim }}>›</span>
                  <span style={{ color: focusedDept.color }}>{focusedDept.name}</span>
                </div>
              )}
              {viewLevel === "empire" && (
                <span className="hidden text-xs text-[var(--text-tertiary)] sm:inline">
                  Click a department to explore
                </span>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-4 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: connected ? C.healthy : C.error,
                    boxShadow: `0 0 6px ${connected ? C.healthy : C.error}88`,
                  }}
                />
                <span style={{ color: connected ? C.healthy : C.error }}>
                  {connected ? "LIVE" : "OFFLINE"}
                </span>
              </div>
              {lastUpdate && <span style={{ color: C.textDim }}>{lastUpdate}</span>}
            </div>
          </div>

          <div className="pointer-events-auto mt-2 px-5 lg:hidden">
            <DashboardNav />
          </div>
        </div>

        {/* ── STATUS PILLS ────────────────────────────────────── */}
        <div className="pointer-events-none absolute top-12 right-0 left-0 z-10 flex justify-center lg:top-12">
          <div
            className="glass flex items-center gap-3 rounded-full border border-[var(--border-dim)] px-4 py-1.5 font-mono text-[10px]"
            style={{ background: `${C.bg}CC` }}
          >
            <StatusPill count={statusCounts.ok} label="ACTIVE" color={C.healthy} />
            <StatusPill count={statusCounts.err} label="ERROR" color={C.error} />
            <StatusPill count={statusCounts.warn} label="DEGRADED" color={C.degraded} />
            <StatusPill count={statusCounts.off} label="DISABLED" color={C.disabled} />
            {statusCounts.unknown > 0 && (
              <StatusPill count={statusCounts.unknown} label="PENDING" color={C.textDim} />
            )}
          </div>
        </div>

        {/* ── HUD BOTTOM BAR ────────────────────────────────── */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10">
          <div
            className="glass flex items-center justify-center gap-8 border-t border-[var(--border-dim)] px-6 py-3 font-mono text-xs"
            style={{ background: `${C.bg}DD` }}
          >
            {statusData?.empire ? (
              <>
                <HudMetric
                  label="DAILY P&L"
                  value={formatUSD(statusData.empire.combined_daily_pnl)}
                  color={statusData.empire.combined_daily_pnl >= 0 ? C.healthy : C.error}
                />
                <HudMetric
                  label="PORTFOLIO"
                  value={formatUSD(statusData.empire.combined_portfolio_value)}
                  color={C.text}
                />
                <HudMetric
                  label="MRR"
                  value={formatUSD(statusData.empire.combined_mrr)}
                  color={C.revenue}
                />
                <HudMetric
                  label="NODES"
                  value={`${allNodes.filter((n) => n.type !== "center").length}`}
                  color={C.accent}
                />
                <HudMetric
                  label="CYCLES"
                  value={String(statusData.empire.cycle_count || "—")}
                  color={C.textDim}
                />
              </>
            ) : (
              <span style={{ color: C.textDim }}>AWAITING TELEMETRY...</span>
            )}
          </div>
        </div>

        {/* ── TOOLTIP ────────────────────────────────────────── */}
        {tooltip && !selectedNode && <Tooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}

        {/* ── DETAIL PANEL ───────────────────────────────────── */}
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            nodes={allNodes}
            onClose={() => {
              setSelectedNode(null);
              if (engineRef.current) engineRef.current.selectedNode = null;
            }}
          />
        )}
      </div>
    </>
  );
}
