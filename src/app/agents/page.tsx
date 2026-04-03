"use client";

import { useState } from "react";
import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { MetricCard, PnlText, StatusBadge } from "@/components/ui";

interface PillarScores {
  results: number;
  reliability: number;
  initiative: number;
  efficiency: number;
  growth: number;
}

interface Scorecard {
  agent: string;
  department: string;
  role: string;
  rating: number;
  label: string;
  pillars: PillarScores;
  pnl_attributed: number;
  llm_cost_30d: number;
  cycles_completed_30d: number;
  error_rate_30d: number;
  last_review: string;
  pdp_active: boolean;
}

interface PDPData {
  agent: string;
  rating: number;
  issued: string;
  review_date: string;
  deficiencies: { pillar: string; score: number }[];
  improvement_targets: {
    pillar: string;
    current_score: number;
    target_score: number;
    target_description: string;
    success_metric: string;
  }[];
  development_actions: string[];
  status: string;
  outcome: string | null;
}

function ratingStars(n: number) {
  return "\u2605".repeat(n) + "\u2606".repeat(5 - n);
}

function ratingColor(n: number) {
  if (n >= 4) return "text-emerald-400";
  if (n === 3) return "text-[var(--text-primary)]";
  if (n === 2) return "text-orange-400";
  return "text-red-400";
}

function pillarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-cyan-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function PillarBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-[var(--text-tertiary)] capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pillarColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-[var(--text-secondary)]">
        {score.toFixed(0)}
      </span>
    </div>
  );
}

function PDPDetail({ pdp }: { pdp: PDPData }) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-sm font-semibold text-red-400">
          Performance Development Plan
        </h4>
        <div className="flex gap-3 text-xs text-[var(--text-tertiary)]">
          <span>Issued: {pdp.issued}</span>
          <span>Review by: {pdp.review_date}</span>
        </div>
      </div>

      {pdp.improvement_targets.length > 0 && (
        <div>
          <h5 className="mb-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Improvement Targets
          </h5>
          <div className="space-y-2">
            {pdp.improvement_targets.map((t, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-dim)] bg-black/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium capitalize text-orange-400">
                    {t.pillar}: {t.current_score.toFixed(0)} → {t.target_score}
                  </span>
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.min((t.current_score / t.target_score) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{t.target_description}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)] font-mono">
                  Metric: {t.success_metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pdp.development_actions.length > 0 && (
        <div>
          <h5 className="mb-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Development Actions
          </h5>
          <div className="space-y-1">
            {pdp.development_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                <span className="text-orange-400 mt-0.5">▸</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pdp.deficiencies.length > 0 && pdp.improvement_targets.length === 0 && (
        <div>
          <h5 className="mb-1 text-xs font-medium text-[var(--text-secondary)]">Deficiencies</h5>
          <div className="flex gap-2 flex-wrap">
            {pdp.deficiencies.map((d, i) => (
              <span key={i} className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                {d.pillar}: {d.score.toFixed(0)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DEPT_LABELS: Record<string, string> = {
  all: "All",
  trading: "Trading",
  predictions: "Predictions",
  defi: "DeFi",
  signals: "Signals",
  saas: "SaaS",
  growth: "Growth",
  operations: "Operations",
  autonomous: "Autonomous",
  finance: "Finance",
  executive: "Executive",
  strategy: "Strategy",
  governance: "Governance",
};

export default function AgentsPage() {
  const { data: scorecards, loading } = useApiPoller<Record<string, Scorecard>>(
    "/api/scorecards",
    30000,
  );
  const { data: pdps } = useApiPoller<PDPData[]>("/api/pdps", 30000);
  const { data: talent } = useApiPoller<{
    pipeline: Record<string, string>[];
    compound_score: { score: number }[];
  }>("/api/talent", 60000);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("all");

  if (loading && !scorecards) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-[var(--text-secondary)]">Loading Agent Roster...</p>
        </div>
      </div>
    );
  }

  const cards = scorecards ? Object.values(scorecards) : [];
  const filtered =
    deptFilter === "all" ? cards : cards.filter((c) => c.department === deptFilter);
  const sorted = [...filtered].sort(
    (a, b) => b.rating - a.rating || b.pnl_attributed - a.pnl_attributed,
  );
  const topPerformers = cards.filter((c) => c.rating >= 4);
  const meetingExpectations = cards.filter((c) => c.rating === 3);
  const underperformers = cards.filter((c) => c.rating <= 2);

  const pdpMap = new Map<string, PDPData>();
  if (pdps) {
    for (const p of pdps) {
      pdpMap.set(p.agent, p);
    }
  }

  const compoundScores = talent?.compound_score ?? [];
  const latestCompound = Array.isArray(compoundScores)
    ? compoundScores[compoundScores.length - 1]
    : null;

  // Departments present in current data
  const activeDepts = new Set(cards.map((c) => c.department));
  const visibleDepts = ["all", ...Array.from(activeDepts).sort()];

  return (
    <PageShell title="Agent Roster" subtitle="Performance scorecards for all empire agents">
      {/* KPI Summary */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <MetricCard label="Total Agents" value={cards.length} />
        <MetricCard
          label="Top Performers"
          value={<span className="text-emerald-400">{topPerformers.length}</span>}
        />
        <MetricCard
          label="Meeting Expectations"
          value={<span className="text-cyan-400">{meetingExpectations.length}</span>}
        />
        <MetricCard
          label="On PDP"
          value={<span className="text-red-400">{underperformers.length}</span>}
        />
        <MetricCard label="Compound Score" value={latestCompound?.score?.toFixed(1) ?? "\u2014"} />
      </div>

      {/* Department Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {visibleDepts.map((dept) => {
          const count =
            dept === "all" ? cards.length : cards.filter((c) => c.department === dept).length;
          return (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                deptFilter === dept
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-white/5 text-[var(--text-tertiary)] hover:bg-white/10 border border-transparent"
              }`}
            >
              {DEPT_LABELS[dept] || dept} ({count})
            </button>
          );
        })}
      </div>

      {/* Agent Cards */}
      <div className="space-y-2">
        {sorted.map((card) => {
          const isExpanded = expanded === card.agent;
          const agentPdp = pdpMap.get(card.agent);

          return (
            <div
              key={card.agent}
              className={`glass rounded-xl border transition-colors ${
                card.rating <= 1
                  ? "border-red-500/40"
                  : card.pdp_active
                    ? "border-orange-500/30"
                    : "border-[var(--border-dim)]"
              }`}
            >
              {/* Main row — clickable */}
              <button
                onClick={() => setExpanded(isExpanded ? null : card.agent)}
                className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-white/5 rounded-xl transition-colors"
              >
                {/* Rating badge */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    card.rating >= 4
                      ? "bg-emerald-500/20 text-emerald-400"
                      : card.rating === 3
                        ? "bg-cyan-500/20 text-cyan-400"
                        : card.rating === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {card.rating}
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm truncate">{card.agent}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                      {card.department}
                    </span>
                    {card.pdp_active && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400">
                        PDP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{card.role}</p>
                </div>

                {/* Stars */}
                <span className={`hidden sm:block text-sm ${ratingColor(card.rating)}`}>
                  {ratingStars(card.rating)}
                </span>

                {/* PnL */}
                <div className="hidden sm:block text-right w-24">
                  <PnlText value={card.pnl_attributed} />
                </div>

                {/* Cost */}
                <span className="hidden sm:block w-20 text-right text-xs text-[var(--text-secondary)]">
                  ${card.llm_cost_30d.toFixed(2)}
                </span>

                {/* Expand arrow */}
                <span
                  className={`text-[var(--text-tertiary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-dim)]/50">
                  {/* Pillar bars */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                    {(
                      Object.entries(card.pillars) as [keyof PillarScores, number][]
                    ).map(([pillar, score]) => (
                      <PillarBar key={pillar} label={pillar} score={score} />
                    ))}
                  </div>

                  {/* Metrics row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-tertiary)]">
                    <span>Cycles (30d): {card.cycles_completed_30d ?? 0}</span>
                    <span>Error rate: {((card.error_rate_30d ?? 0) * 100).toFixed(1)}%</span>
                    <span>Last review: {card.last_review ? new Date(card.last_review).toLocaleDateString() : "\u2014"}</span>
                  </div>

                  {/* PDP detail */}
                  {card.pdp_active && agentPdp && <PDPDetail pdp={agentPdp} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Talent Pipeline */}
      {talent?.pipeline && Object.keys(talent.pipeline).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Talent Pipeline</h2>
          <div className="grid gap-3">
            {(Array.isArray(talent.pipeline)
              ? talent.pipeline
              : Object.values(talent.pipeline)
            ).map((candidate: Record<string, string>, i: number) => (
              <div key={i} className="glass rounded-lg border border-[var(--border-dim)] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400">{candidate.role}</span>
                  <StatusBadge status={candidate.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {candidate.business_case}
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Expected: {candidate.expected_revenue}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
