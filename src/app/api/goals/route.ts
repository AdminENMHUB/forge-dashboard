import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  revenue_targets: {
    aug_2026: { target: 15000, current: 257.57, label: "$15K/mo by Aug 2026" },
    eoy_2026: { target: 50000, current: 257.57, label: "$50K/mo by EOY 2026" },
  },
  swarm_targets: [
    {
      swarm: "TradeBot",
      target_daily: 200,
      target_monthly: 6000,
      current_daily: 0,
      status: "recovering",
    },
    {
      swarm: "EchoSwarm",
      target_daily: 150,
      target_monthly: 4500,
      current_daily: 0,
      status: "active",
    },
    { swarm: "SaaS Factory", target_monthly: 500, current_mrr: 0, status: "pre-revenue" },
    {
      swarm: "Signal Subs",
      target_subscribers: 10,
      current_subscribers: 1,
      revenue: 257.57,
      status: "active",
    },
  ],
  okr_hierarchy: {
    company: {
      objective: "Reach $50K/mo autonomous revenue by EOY 2026",
      progress: 0.005,
      key_results: [
        { kr: "Scale signal subscriptions to 10+ paying subs", progress: 0.1, owner: "Web3Swarm" },
        { kr: "First SaaS paying customer", progress: 0.0, owner: "SaaSFactory" },
        { kr: "TradeBot profitable ($200/day)", progress: 0.0, owner: "TradeBot" },
        { kr: "EchoSwarm profitable ($150/day)", progress: 0.0, owner: "EchoSwarm" },
      ],
    },
    departments: [
      {
        name: "Revenue Operations",
        objective: "Generate consistent daily revenue across all swarms",
        progress: 0.02,
        tasks: [
          {
            task: "Deploy trailing stops + 72h age filter",
            status: "completed",
            agent: "trade_executor",
          },
          { task: "Price guard 0.20-0.80 deployed", status: "completed", agent: "echo_scout" },
          { task: "Drive first SaaS paid subscriber", status: "in_progress", agent: "saas_growth" },
          { task: "Scale signal subscriber base", status: "in_progress", agent: "signal_terminal" },
        ],
      },
      {
        name: "Engineering",
        objective: "Maintain 99.5% uptime and system reliability",
        progress: 0.85,
        tasks: [
          { task: "Daily health checks automated", status: "completed", agent: "health_monitor" },
          { task: "Circuit breakers on all swarms", status: "completed", agent: "risk_manager" },
          { task: "Audit ledger integrity", status: "completed", agent: "audit_agent" },
          {
            task: "Multi-model consensus for capital",
            status: "completed",
            agent: "consensus_engine",
          },
        ],
      },
      {
        name: "Marketing",
        objective: "Build organic traffic and brand presence",
        progress: 0.35,
        tasks: [
          { task: "199 X posts published", status: "completed", agent: "x_poster" },
          { task: "51 blog posts published", status: "completed", agent: "blog_writer" },
          { task: "Newsletter pipeline live", status: "completed", agent: "newsletter_agent" },
          { task: "SEO optimization ongoing", status: "in_progress", agent: "seo_optimizer" },
        ],
      },
    ],
  },
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/goals`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
