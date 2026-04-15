"use client";

import { useApiPoller } from "@/lib/hooks";
import { formatUSD } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { MetricCard, StatusBadge, SectionCard, Skeleton } from "@/components/ui";

interface RevenueTarget {
  target: number;
  current: number;
  label: string;
}

interface SwarmTarget {
  swarm: string;
  target_daily?: number;
  target_monthly?: number;
  current_daily?: number;
  current_mrr?: number;
  target_subscribers?: number;
  current_subscribers?: number;
  revenue?: number;
  status: string;
}

interface Task {
  task: string;
  status: string;
  agent: string;
}

interface Department {
  name: string;
  objective: string;
  progress: number;
  tasks: Task[];
}

interface KeyResult {
  kr: string;
  progress: number;
  owner: string;
}

interface GoalsData {
  revenue_targets: {
    aug_2026: RevenueTarget;
    eoy_2026: RevenueTarget;
  };
  swarm_targets: SwarmTarget[];
  okr_hierarchy: {
    company: {
      objective: string;
      progress: number;
      key_results: KeyResult[];
    };
    departments: Department[];
  };
}

function ProgressBar({
  value,
  max,
  color = "bg-cyan-500",
  label,
  subtext,
}: {
  value: number;
  max: number;
  color?: string;
  label: string;
  subtext?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {formatUSD(value)} / {formatUSD(max)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {subtext && <p className="mt-1 text-[10px] text-[var(--text-muted)]">{subtext}</p>}
    </div>
  );
}

function OkrProgressBar({ progress, size = "md" }: { progress: number; size?: "sm" | "md" }) {
  const pct = Math.min(progress * 100, 100);
  const h = size === "sm" ? "h-1.5" : "h-2";
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`${h} overflow-hidden rounded-full bg-white/[0.06]`}>
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const taskStatusStyle: Record<string, { dot: string; text: string }> = {
  completed: { dot: "bg-emerald-400", text: "text-emerald-400" },
  in_progress: { dot: "bg-cyan-400 pulse-dot", text: "text-cyan-400" },
  pending: { dot: "bg-gray-400", text: "text-gray-400" },
  blocked: { dot: "bg-red-400", text: "text-red-400" },
};

export default function GoalsPage() {
  const { data, loading, lastUpdate, error } = useApiPoller<GoalsData>("/api/goals", 60000);

  if (loading) {
    return (
      <PageShell title="Goal Cascade" subtitle="OKR hierarchy & revenue targets">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <Skeleton className="mb-3 h-5 w-48" />
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  const targets = data?.revenue_targets;
  const swarms = data?.swarm_targets || [];
  const okr = data?.okr_hierarchy;

  return (
    <PageShell
      title="Goal Cascade"
      subtitle="OKR hierarchy & revenue targets"
      lastUpdate={lastUpdate}
      error={error}
    >
      {/* Revenue Target Progress */}
      <SectionCard title="Revenue Targets" glow="cyan">
        <div className="space-y-4">
          {targets && (
            <>
              <ProgressBar
                value={targets.aug_2026.current}
                max={targets.aug_2026.target}
                color="bg-cyan-500"
                label={targets.aug_2026.label}
                subtext="Milestone 1 — signal subscriptions + SaaS MRR"
              />
              <ProgressBar
                value={targets.eoy_2026.current}
                max={targets.eoy_2026.target}
                color="bg-purple-500"
                label={targets.eoy_2026.label}
                subtext="Full autonomy — all 5 revenue streams contributing"
              />
            </>
          )}
        </div>
      </SectionCard>

      {/* Per-Swarm Targets */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {swarms.map((s) => {
          const targetLabel = s.target_daily
            ? `${formatUSD(s.target_daily)}/day`
            : s.target_monthly
              ? `${formatUSD(s.target_monthly)}/mo`
              : `${s.target_subscribers} subs`;
          const currentLabel =
            s.current_daily != null
              ? `${formatUSD(s.current_daily)}/day`
              : s.current_mrr != null
                ? `${formatUSD(s.current_mrr)} MRR`
                : `${s.current_subscribers ?? 0} subs`;
          return (
            <MetricCard
              key={s.swarm}
              label={s.swarm}
              value={currentLabel}
              subtext={`Target: ${targetLabel}`}
              accent={
                s.status === "active"
                  ? "text-emerald-400"
                  : s.status === "recovering"
                    ? "text-amber-400"
                    : "text-[var(--text-secondary)]"
              }
            />
          );
        })}
      </div>

      {/* Company OKR */}
      {okr && (
        <div className="mt-6">
          <SectionCard title="Company Objective" glow="purple">
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-white">{okr.company.objective}</p>
              <OkrProgressBar progress={okr.company.progress} />
              <p className="mt-1 text-right text-xs text-[var(--text-tertiary)]">
                {(okr.company.progress * 100).toFixed(1)}% complete
              </p>
            </div>

            <div className="space-y-3">
              {okr.company.key_results.map((kr, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border-dim)]/50 bg-white/[0.02] p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-sm text-[var(--text-primary)]">{kr.kr}</p>
                    <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{kr.owner}</span>
                  </div>
                  <OkrProgressBar progress={kr.progress} size="sm" />
                  <p className="mt-1 text-right text-[10px] text-[var(--text-muted)]">
                    {(kr.progress * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Department OKRs */}
      {okr?.departments && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {okr.departments.map((dept) => (
            <SectionCard key={dept.name} title={dept.name}>
              <p className="mb-3 text-xs text-[var(--text-tertiary)]">{dept.objective}</p>
              <OkrProgressBar progress={dept.progress} />
              <p className="mt-1 mb-3 text-right text-[10px] text-[var(--text-muted)]">
                {(dept.progress * 100).toFixed(0)}%
              </p>

              <div className="space-y-2">
                {dept.tasks.map((t, i) => {
                  const style = taskStatusStyle[t.status] || taskStatusStyle.pending;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md bg-white/[0.02] px-2.5 py-2"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--text-primary)]">{t.task}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{t.agent}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-medium ${style.text}`}>
                        {t.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
