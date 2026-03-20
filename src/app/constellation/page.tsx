"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatUSD } from "@/lib/formatters";

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
  angle: number;
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
  gridLine: "#0B1526",
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
// DEPARTMENT & AGENT DEFINITIONS
// ============================================================================

const DEPARTMENTS: DepartmentDef[] = [
  {
    id: "oversight",
    name: "OVERSIGHT",
    subtitle: "Master Swarm",
    swarmKey: null,
    serviceKey: "egan-master", // pragma: allowlist secret
    angle: -Math.PI / 2,
    color: "#00D4FF",
    agents: [
      { id: "overseer", name: "Overseer", role: "Master Orchestrator" },
      { id: "cfo", name: "CFO", role: "P&L Attribution" },
      { id: "health_monitor", name: "Health Monitor", role: "Proactive Health" },
      { id: "truth_verifier", name: "Truth Verifier", role: "Ground Truth" },
      { id: "cross_strategist", name: "Strategist", role: "Cross-Swarm Signals" },
      { id: "optimizer", name: "Optimizer", role: "Parameter Tuning" },
      { id: "daily_briefing", name: "Briefing", role: "7am CEO Report" },
      { id: "infra_sre", name: "Infra SRE", role: "VPS Infrastructure" },
      { id: "cost_controller", name: "Cost Ctrl", role: "Budget Guard" },
      { id: "strategic_analyst", name: "CSO", role: "Strategic Analysis" },
    ],
  },
  {
    id: "trading",
    name: "TRADING",
    subtitle: "TradeBot",
    swarmKey: "EganTradeBot",
    serviceKey: "egan-trade", // pragma: allowlist secret
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
    color: "#10B981",
    agents: [
      { id: "orchestrator", name: "Orchestrator", role: "Cycle Router" },
      { id: "market_analyst", name: "Analyst", role: "Technical Analysis" },
      { id: "risk_manager", name: "Risk Mgr", role: "VETO Gate" },
      { id: "execution", name: "Executor", role: "Order Placement" },
      { id: "portfolio", name: "Portfolio", role: "Rebalancing" },
      { id: "sentiment", name: "Sentiment", role: "Fear & Greed" },
      { id: "learning", name: "Learning", role: "Adaptive Params" },
    ],
  },
  {
    id: "predictions",
    name: "PREDICTIONS",
    subtitle: "EchoSwarm",
    swarmKey: "EchoSwarm",
    serviceKey: null,
    angle: -Math.PI / 2 + (2 * Math.PI * 2) / 5,
    color: "#8B5CF6",
    agents: [
      { id: "momentum", name: "Momentum", role: "Price Momentum", active: true },
      { id: "sentiment_echo", name: "Sentiment", role: "Social Signals", active: true },
      { id: "orderbook", name: "Orderbook", role: "Book Imbalance", active: true },
      { id: "arbitrage", name: "Arbitrage", role: "Cross-Market", active: false },
      { id: "misprice", name: "Misprice", role: "Stat Mispricing", active: false },
      { id: "news", name: "News", role: "News-Driven", active: false },
    ],
  },
  {
    id: "signals",
    name: "SIGNALS",
    subtitle: "Web3 Swarm",
    swarmKey: "EganWeb3Swarm",
    serviceKey: "egan-web3", // pragma: allowlist secret
    angle: -Math.PI / 2 + (2 * Math.PI * 3) / 5,
    color: "#FFB800",
    agents: [
      { id: "wallet_monitor", name: "Wallet Mon", role: "Payment Watch" },
      { id: "signal_terminal", name: "Signal Term", role: "Signal Gen" },
      { id: "scorecard", name: "Scorecard", role: "Win Rate Track" },
      { id: "renewal", name: "Renewal", role: "Sub Reminders" },
      { id: "defi_yield", name: "DeFi Yield", role: "AAVE Mgmt" },
      { id: "nft_minter", name: "NFT Minter", role: "Pass Minting" },
    ],
  },
  {
    id: "products",
    name: "PRODUCTS",
    subtitle: "SaaS Factory",
    swarmKey: "EganSaasFactory",
    serviceKey: "egan-saas", // pragma: allowlist secret
    angle: -Math.PI / 2 + (2 * Math.PI * 4) / 5,
    color: "#3B82F6",
    agents: [
      { id: "builder", name: "Builder", role: "Product Builder" },
      { id: "marketer", name: "Marketer", role: "Growth Marketing" },
      { id: "design_dir", name: "Design Dir", role: "Brand Design" },
    ],
  },
];

// ============================================================================
// LAYOUT CALCULATION
// ============================================================================

function calculateLayout(w: number, h: number): { nodes: CNode[]; connections: Connection[] } {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h);
  const deptR = scale * 0.26;
  const agentR = scale * 0.13;

  const nodes: CNode[] = [];
  const connections: Connection[] = [];

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
    radius: Math.max(24, scale * 0.028),
    pulsePhase: 0,
    metrics: {},
  });

  DEPARTMENTS.forEach((dept, di) => {
    const dx = cx + Math.cos(dept.angle) * deptR;
    const dy = cy + Math.sin(dept.angle) * deptR;

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
      radius: Math.max(16, scale * 0.018),
      pulsePhase: di * 1.3,
      metrics: {},
    });
    connections.push({ fromId: "center", toId: dept.id, color: dept.color });

    const outAngle = Math.atan2(dy - cy, dx - cx);
    const count = dept.agents.length;
    const spread = Math.min(Math.PI * 0.8, count * 0.32);
    const start = outAngle - spread / 2;

    dept.agents.forEach((agent, ai) => {
      const a = count === 1 ? outAngle : start + (spread * ai) / (count - 1);
      const ax = dx + Math.cos(a) * agentR;
      const ay = dy + Math.sin(a) * agentR;

      nodes.push({
        id: `${dept.id}.${agent.id}`,
        name: agent.name,
        type: "agent",
        departmentId: dept.id,
        role: agent.role,
        color: dept.color,
        status: agent.active === false ? "disabled" : "unknown",
        x: ax,
        y: ay,
        radius: Math.max(5, scale * 0.006),
        pulsePhase: di * 1.3 + ai * 0.4,
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
  private mouseX = 0;
  private mouseY = 0;

  nodes: CNode[] = [];
  connections: Connection[] = [];
  particles: Particle[] = [];
  hoveredNode: CNode | null = null;
  selectedNode: CNode | null = null;

  private stars: {
    x: number;
    y: number;
    s: number;
    b: number;
    sp: number;
  }[] = [];

  onHover: (node: CNode | null, x: number, y: number) => void = () => {};
  onSelect: (node: CNode | null) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.dpr = window.devicePixelRatio || 1;
    this.stars = Array.from({ length: 350 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.5 + 0.3,
      b: Math.random() * 0.4 + 0.15,
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

    const layout = calculateLayout(width, height);
    // Preserve existing status/metrics
    layout.nodes.forEach((n) => {
      const old = this.nodes.find((o) => o.id === n.id);
      if (old) {
        n.status = old.status;
        n.metrics = old.metrics;
      }
    });
    this.nodes = layout.nodes;
    this.connections = layout.connections;
    this.rebuildParticles();
  }

  private rebuildParticles() {
    this.particles = [];
    this.connections.forEach((conn) => {
      const isTrunk = conn.fromId === "center";
      const count = isTrunk ? 6 : 3;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          fromId: conn.fromId,
          toId: conn.toId,
          progress: Math.random(),
          speed: 0.001 + Math.random() * 0.003,
          size: isTrunk ? 2.5 : 1.5,
          color: conn.color,
          reverse: Math.random() > 0.85,
        });
      }
    });
  }

  updateData(status: StatusResponse | null, health: HealthResponse | null) {
    // Center node
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

      // Swarm data
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

      // Service health
      if (dept.serviceKey && health?.services) {
        const svc = health.services[dept.serviceKey];
        if (svc) {
          if (svc.status !== "active" && svc.status !== "running") {
            node.status = "error";
          } else if (node.status === "unknown") {
            node.status = "active";
          }
          if (svc.uptime) node.metrics.uptime = svc.uptime;
        }
      }

      // Docker health for EchoSwarm
      if (dept.id === "predictions" && health?.docker) {
        const scout = health.docker["echo-scout"];
        if (scout) {
          if (
            scout.status !== "running" &&
            scout.status !== "Up" &&
            !String(scout.status).startsWith("Up")
          ) {
            node.status = "error";
          } else if (node.status === "unknown") {
            node.status = "active";
          }
        }
      }

      // Oversight doesn't appear in swarms — derive from service health
      if (
        dept.id === "oversight" &&
        node.status === "unknown" &&
        health?.services?.["egan-master"]
      ) {
        const svc = health.services["egan-master"];
        node.status = svc.status === "active" || svc.status === "running" ? "active" : "error";
      }

      // TradeBot extras
      if (dept.id === "trading" && status?.tradebot) {
        if (status.tradebot.halted) node.status = "halted";
        node.metrics.regime = status.tradebot.market_regime;
        node.metrics.haltReason = status.tradebot.halt_reason;
      }

      // SaaS extras
      if (dept.id === "products" && status?.saas) {
        node.metrics.mrr = status.saas.total_mrr;
        node.metrics.liveProducts = status.saas.live_products;
        node.metrics.totalProducts = status.saas.total_products;
        node.metrics.queue = status.saas.opportunity_queue;
      }

      // Propagate status to agents
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private update(_dt: number) {
    this.particles.forEach((p) => {
      const from = this.nodes.find((n) => n.id === p.fromId);
      const to = this.nodes.find((n) => n.id === p.toId);
      if (!from || !to) return;
      // Speed up particles for active connections
      const toNode = to;
      const speedMult = toNode.status === "active" || toNode.status === "healthy" ? 1.5 : 0.5;
      p.progress += (p.reverse ? -p.speed : p.speed) * speedMult * 60;
      if (p.progress > 1) p.progress -= 1;
      if (p.progress < 0) p.progress += 1;
    });
  }

  private render() {
    const { ctx, w, h } = this;
    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Radial gradient center glow
    const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
    cg.addColorStop(0, "rgba(0, 212, 255, 0.03)");
    cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);

    this.drawStars();
    this.drawGrid();
    this.drawRadarSweep();
    this.drawConnections();
    this.drawParticles();
    this.drawNodes();
  }

  private drawStars() {
    const { ctx, w, h, time } = this;
    this.stars.forEach((s) => {
      const twinkle = 0.5 + 0.5 * Math.sin(time * s.sp + s.x * 100);
      const alpha = s.b * twinkle;
      ctx.fillStyle = `rgba(180, 210, 255, ${alpha})`;
      ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
    });
  }

  private drawGrid() {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 0.5;

    // Concentric circles
    const rings = [0.15, 0.28, 0.42];
    const scale = Math.min(w, h);
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial lines
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
      ctx.lineTo(cx + Math.cos(a) * scale * 0.48, cy + Math.sin(a) * scale * 0.48);
      ctx.stroke();
    }
  }

  private drawRadarSweep() {
    const { ctx, w, h, time } = this;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.45;
    const angle = time * 0.4;

    const grad = ctx.createConicGradient(angle, cx, cy);
    grad.addColorStop(0, "rgba(0, 212, 255, 0.06)");
    grad.addColorStop(0.08, "rgba(0, 212, 255, 0.0)");
    grad.addColorStop(1, "rgba(0, 212, 255, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawConnections() {
    const { ctx } = this;
    this.connections.forEach((conn) => {
      const from = this.nodes.find((n) => n.id === conn.fromId);
      const to = this.nodes.find((n) => n.id === conn.toId);
      if (!from || !to) return;

      const isTrunk = conn.fromId === "center";
      const toStatus = to.status;
      const alpha =
        toStatus === "disabled"
          ? 0.08
          : toStatus === "error" || toStatus === "halted"
            ? 0.25
            : isTrunk
              ? 0.2
              : 0.12;

      ctx.strokeStyle =
        toStatus === "error" || toStatus === "halted"
          ? `rgba(255, 51, 68, ${alpha})`
          : `${conn.color}${Math.round(alpha * 255)
              .toString(16)
              .padStart(2, "0")}`;
      ctx.lineWidth = isTrunk ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  }

  private drawParticles() {
    const { ctx } = this;
    this.particles.forEach((p) => {
      const from = this.nodes.find((n) => n.id === p.fromId);
      const to = this.nodes.find((n) => n.id === p.toId);
      if (!from || !to) return;

      // Don't draw particles for disabled connections
      if (to.status === "disabled") return;

      const x = from.x + (to.x - from.x) * p.progress;
      const y = from.y + (to.y - from.y) * p.progress;

      const statusColor = STATUS_COLOR[to.status] || p.color;

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `${statusColor}18`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${statusColor}BB`;
      ctx.fill();
    });
  }

  private drawNodes() {
    const { ctx, time } = this;

    // Draw agents first (behind departments)
    const agents = this.nodes.filter((n) => n.type === "agent");
    const depts = this.nodes.filter((n) => n.type === "department");
    const center = this.nodes.find((n) => n.type === "center");

    [...agents, ...depts, ...(center ? [center] : [])].forEach((node) => {
      const sc = STATUS_COLOR[node.status] || C.disabled;
      const pulse = Math.sin(time * 1.5 + node.pulsePhase) * 0.3 + 0.7;
      const isHovered = this.hoveredNode?.id === node.id;
      const isSelected = this.selectedNode?.id === node.id;
      const highlight = isHovered || isSelected;

      // Outer glow
      const glowR =
        node.type === "center"
          ? node.radius * 2.5
          : node.type === "department"
            ? node.radius * 2.2
            : node.radius * 2;
      const glowAlpha = node.status === "disabled" ? 0.05 : 0.12 * pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR * (highlight ? 1.3 : 1), 0, Math.PI * 2);
      ctx.fillStyle = `${sc}${Math.round(glowAlpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fill();

      // Middle glow
      if (node.status !== "disabled") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 1.6 * (highlight ? 1.15 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `${sc}${Math.round(0.08 * pulse * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();
      }

      // Core circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * (highlight ? 1.1 : 1), 0, Math.PI * 2);
      ctx.fillStyle = node.status === "disabled" ? "#0A0F1A" : "#0D1321";
      ctx.fill();
      ctx.strokeStyle = node.status === "disabled" ? `${sc}44` : `${sc}${highlight ? "DD" : "88"}`;
      ctx.lineWidth = node.type === "center" ? 2.5 : node.type === "department" ? 2 : 1.2;
      ctx.stroke();

      // Inner dot for active nodes
      if (node.status === "active" || node.status === "healthy") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.35 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${sc}88`;
        ctx.fill();
      }

      // Error pulse ring
      if (node.status === "error" || node.status === "halted") {
        const errorPulse = Math.sin(time * 3 + node.pulsePhase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (1.5 + errorPulse * 0.8), 0, Math.PI * 2);
        ctx.strokeStyle = `${C.error}${Math.round(errorPulse * 80)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Labels
      if (node.type === "center") {
        ctx.font = `bold ${Math.max(11, node.radius * 0.5)}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = C.accent;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.radius + 18);
        ctx.font = `${Math.max(8, node.radius * 0.32)}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = C.textDim;
        ctx.fillText(node.subtitle || "", node.x, node.y + node.radius + 32);
      } else if (node.type === "department") {
        ctx.font = `bold ${Math.max(9, node.radius * 0.55)}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = highlight ? C.text : node.color;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.radius + 14);
        ctx.font = `${Math.max(7, node.radius * 0.4)}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = C.textDim;
        ctx.fillText(node.subtitle || "", node.x, node.y + node.radius + 25);

        // Status indicator text
        if (node.status !== "unknown") {
          ctx.font = `${Math.max(7, node.radius * 0.35)}px var(--font-geist-mono), monospace`;
          ctx.fillStyle = sc;
          ctx.fillText(node.status.toUpperCase(), node.x, node.y - node.radius - 8);
        }
      } else if (node.type === "agent") {
        ctx.font = `${Math.max(7, node.radius * 0.9)}px var(--font-geist-mono), monospace`;
        ctx.fillStyle =
          node.status === "disabled" ? `${C.textDim}88` : highlight ? C.text : C.textDim;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.radius + 11);
      }
    });
  }

  hitTest(x: number, y: number): CNode | null {
    // Check in reverse order (top-drawn nodes first)
    const ordered = [
      ...this.nodes.filter((n) => n.type === "center"),
      ...this.nodes.filter((n) => n.type === "department"),
      ...this.nodes.filter((n) => n.type === "agent"),
    ].reverse();

    for (const node of ordered) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitR = Math.max(node.radius + 10, 14);
      if (dist < hitR) return node;
    }
    return null;
  }

  handleMouseMove(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    const node = this.hitTest(x, y);
    if (node !== this.hoveredNode) {
      this.hoveredNode = node;
      this.onHover(node, x, y);
    }
    this.canvas.style.cursor = node ? "pointer" : "default";
  }

  handleClick(x: number, y: number) {
    const node = this.hitTest(x, y);
    this.selectedNode = node;
    this.onSelect(node);
  }
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

function Tooltip({ node, x, y }: { node: CNode; x: number; y: number }) {
  const sc = STATUS_COLOR[node.status];
  // Position tooltip to avoid going off-screen
  const tipX = x + 20;
  const tipY = y - 10;

  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[180px] rounded-lg border px-3 py-2 font-mono text-xs backdrop-blur-md"
      style={{
        left: Math.min(tipX, window.innerWidth - 220),
        top: Math.min(tipY, window.innerHeight - 120),
        background: C.panelBg,
        borderColor: `${node.color}44`,
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="font-bold" style={{ color: node.color }}>
          {node.name}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            color: sc,
            background: `${sc}18`,
          }}
        >
          {node.status.toUpperCase()}
        </span>
      </div>
      {node.role && (
        <div style={{ color: C.textDim }} className="mb-1">
          {node.role}
        </div>
      )}
      {node.subtitle && node.type !== "agent" && (
        <div style={{ color: C.textDim }}>{node.subtitle}</div>
      )}
      {node.metrics.dailyPnl !== undefined && (
        <div
          className="mt-1"
          style={{ color: (node.metrics.dailyPnl as number) >= 0 ? C.healthy : C.error }}
        >
          Daily P&L: {formatUSD(node.metrics.dailyPnl as number)}
        </div>
      )}
      {node.metrics.mrr !== undefined && (node.metrics.mrr as number) > 0 && (
        <div style={{ color: C.revenue }}>MRR: {formatUSD(node.metrics.mrr as number)}</div>
      )}
      {node.type === "agent" && (
        <div className="mt-1 text-[10px]" style={{ color: C.textDim }}>
          Click for details
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DETAIL PANEL COMPONENT
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
  const sc = STATUS_COLOR[node.status];
  const isDept = node.type === "department";
  const isCenter = node.type === "center";

  // Get child agents if this is a department
  const childAgents = isDept ? nodes.filter((n) => n.departmentId === node.id) : [];

  // Get department info if this is an agent
  const parentDept = node.departmentId ? nodes.find((n) => n.id === node.departmentId) : null;

  return (
    <div
      className="fixed top-0 right-0 z-40 flex h-full w-[340px] flex-col overflow-y-auto border-l font-mono text-xs backdrop-blur-xl"
      style={{
        background: C.panelBg,
        borderColor: C.panelBorder,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: `${node.color}22` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{
              background: sc,
              boxShadow: `0 0 8px ${sc}88`,
            }}
          />
          <span className="font-bold tracking-wider" style={{ color: node.color }}>
            {node.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          ESC
        </button>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span style={{ color: C.textDim }}>STATUS</span>
          <span
            className="rounded px-2 py-0.5 font-semibold"
            style={{ color: sc, background: `${sc}18` }}
          >
            {node.status.toUpperCase()}
          </span>
        </div>

        {node.subtitle && (
          <div className="flex items-center justify-between">
            <span style={{ color: C.textDim }}>SYSTEM</span>
            <span style={{ color: C.text }}>{node.subtitle}</span>
          </div>
        )}

        {node.role && (
          <div className="flex items-center justify-between">
            <span style={{ color: C.textDim }}>ROLE</span>
            <span style={{ color: C.text }}>{node.role}</span>
          </div>
        )}

        {parentDept && (
          <div className="flex items-center justify-between">
            <span style={{ color: C.textDim }}>DEPARTMENT</span>
            <span style={{ color: parentDept.color }}>{parentDept.name}</span>
          </div>
        )}

        {/* Metrics */}
        {Object.keys(node.metrics).length > 0 && (
          <>
            <div className="border-t pt-3" style={{ borderColor: `${node.color}15` }}>
              <div className="mb-2 font-bold tracking-wider" style={{ color: node.color }}>
                METRICS
              </div>
              <div className="space-y-2">
                {node.metrics.dailyPnl !== undefined && (
                  <MetricRow
                    label="DAILY P&L"
                    value={formatUSD(node.metrics.dailyPnl as number)}
                    color={(node.metrics.dailyPnl as number) >= 0 ? C.healthy : C.error}
                  />
                )}
                {node.metrics.totalPnl !== undefined && (
                  <MetricRow
                    label="TOTAL P&L"
                    value={formatUSD(node.metrics.totalPnl as number)}
                    color={(node.metrics.totalPnl as number) >= 0 ? C.healthy : C.error}
                  />
                )}
                {node.metrics.portfolio !== undefined && (
                  <MetricRow
                    label="PORTFOLIO"
                    value={formatUSD(node.metrics.portfolio as number)}
                    color={C.text}
                  />
                )}
                {node.metrics.mrr !== undefined && (node.metrics.mrr as number) >= 0 && (
                  <MetricRow
                    label="MRR"
                    value={formatUSD(node.metrics.mrr as number)}
                    color={C.revenue}
                  />
                )}
                {node.metrics.arr !== undefined && (
                  <MetricRow
                    label="ARR"
                    value={formatUSD(node.metrics.arr as number)}
                    color={C.revenue}
                  />
                )}
                {node.metrics.winRate !== undefined && (
                  <MetricRow
                    label="WIN RATE"
                    value={`${((node.metrics.winRate as number) * 100).toFixed(1)}%`}
                    color={(node.metrics.winRate as number) >= 0.5 ? C.healthy : C.degraded}
                  />
                )}
                {node.metrics.positions !== undefined && (
                  <MetricRow
                    label="POSITIONS"
                    value={String(node.metrics.positions)}
                    color={C.text}
                  />
                )}
                {node.metrics.tradesToday !== undefined && (
                  <MetricRow
                    label="TRADES TODAY"
                    value={String(node.metrics.tradesToday)}
                    color={C.text}
                  />
                )}
                {node.metrics.circuitBreaker !== undefined && (
                  <MetricRow
                    label="CIRCUIT BREAKER"
                    value={node.metrics.circuitBreaker ? "TRIPPED" : "NORMAL"}
                    color={node.metrics.circuitBreaker ? C.error : C.healthy}
                  />
                )}
                {node.metrics.regime !== undefined && node.metrics.regime !== null && (
                  <MetricRow
                    label="MARKET REGIME"
                    value={String(node.metrics.regime)}
                    color={C.text}
                  />
                )}
                {node.metrics.liveProducts !== undefined && (
                  <MetricRow
                    label="LIVE PRODUCTS"
                    value={`${node.metrics.liveProducts}/${node.metrics.totalProducts}`}
                    color={C.text}
                  />
                )}
                {node.metrics.queue !== undefined && (
                  <MetricRow label="OPP. QUEUE" value={String(node.metrics.queue)} color={C.text} />
                )}
                {node.metrics.cycles !== undefined && (
                  <MetricRow label="CYCLES" value={String(node.metrics.cycles)} color={C.text} />
                )}
                {node.metrics.uptime !== undefined && (
                  <MetricRow label="UPTIME" value={String(node.metrics.uptime)} color={C.text} />
                )}
                {node.metrics.haltReason !== undefined && node.metrics.haltReason !== null && (
                  <MetricRow
                    label="HALT REASON"
                    value={String(node.metrics.haltReason)}
                    color={C.error}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Child agents for departments */}
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

        {/* Empire overview for center node */}
        {isCenter && (
          <div className="border-t pt-3" style={{ borderColor: `${C.accent}15` }}>
            <div className="mb-2 font-bold tracking-wider" style={{ color: C.accent }}>
              DEPARTMENTS (5)
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
                          style={{
                            background: dsc,
                            boxShadow: `0 0 4px ${dsc}66`,
                          }}
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
      </div>

      {/* Footer */}
      <div
        className="border-t px-4 py-2 text-[10px]"
        style={{ borderColor: C.panelBorder, color: C.textDim }}
      >
        EGAN FORGE CONSTELLATION v1.0
      </div>
    </div>
  );
}

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

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ConstellationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConstellationEngine | null>(null);

  const [tooltip, setTooltip] = useState<{
    node: CNode;
    x: number;
    y: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<CNode | null>(null);
  const [allNodes, setAllNodes] = useState<CNode[]>([]);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  // Fetch data
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
        setAllNodes([...engineRef.current.nodes]);
      }

      setConnected(!!status || !!health);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    const doFetch = () => {
      fetchData();
    };
    doFetch();
    const interval = setInterval(doFetch, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Init canvas engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ConstellationEngine(canvas);
    engineRef.current = engine;

    engine.onHover = (node, x, y) => {
      setTooltip(node ? { node, x, y } : null);
    };
    engine.onSelect = (node) => {
      setSelectedNode(node);
      if (engine.nodes) setAllNodes([...engine.nodes]);
    };

    const handleResize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
      setAllNodes([...engine.nodes]);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const onMove = (e: MouseEvent) => engine.handleMouseMove(e.clientX, e.clientY);
    const onClick = (e: MouseEvent) => engine.handleClick(e.clientX, e.clientY);
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

  // Sync data to engine when status updates
  useEffect(() => {
    if (engineRef.current && statusData) {
      setAllNodes([...engineRef.current.nodes]);
    }
  }, [statusData]);

  // Keyboard: ESC to close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedNode(null);
        if (engineRef.current) engineRef.current.selectedNode = null;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Count statuses for HUD
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

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: C.bg }}>
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ── HUD TOP BAR ────────────────────────────────────── */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10">
        <div className="flex items-center justify-between px-5 pt-4">
          {/* Left: nav + title */}
          <div className="pointer-events-auto flex items-center gap-4">
            <Link
              href="/"
              className="rounded border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors"
              style={{
                borderColor: `${C.accent}33`,
                color: C.textDim,
              }}
            >
              DASHBOARD
            </Link>
            <h1
              className="font-mono text-sm font-bold tracking-[0.25em]"
              style={{ color: C.accent }}
            >
              CONSTELLATION
            </h1>
          </div>

          {/* Right: connection + time */}
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
      </div>

      {/* ── HUD STATUS PILLS ────────────────────────────────── */}
      <div className="pointer-events-none absolute top-12 right-0 left-0 z-10 flex justify-center">
        <div
          className="flex items-center gap-3 rounded-full border px-4 py-1.5 font-mono text-[10px] backdrop-blur-sm"
          style={{
            background: `${C.bg}CC`,
            borderColor: C.panelBorder,
          }}
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
          className="flex items-center justify-center gap-8 border-t px-6 py-3 font-mono text-xs backdrop-blur-md"
          style={{
            background: `${C.bg}DD`,
            borderColor: C.panelBorder,
          }}
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
  );
}

// ============================================================================
// SMALL HUD COMPONENTS
// ============================================================================

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
