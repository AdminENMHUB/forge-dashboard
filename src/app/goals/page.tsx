"use client";

import { useApiPoller } from "@/lib/hooks";
import { formatUSD } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { MetricCard, SectionCard, Skeleton } from "@/components/ui";

interface RevenueTarget {
  target: number;
  current: number;
  label: string;
}

interface SwarmTarget {
  swarm: string;
  target: number;
  unit: string;
  current: number;
  progress: number;
  deadline?: string;
}

interface KeyResult {
  id: string;
  title: string;
  target_value?: number;
  unit?: string;
  current_value?: number;
  progress: number;
  deadline?: string;
  owner_agent?: string;
  owner_department?: string;
}

interface CompanyObjective {
  objective: string;
  description?: string;
  target_value?: number;
  unit?: string;
  deadline?: string;
  current_value?: number;
  progress: number;
  key_results: KeyResult[];
}

interface Department {
  id: string;
  department: string;
  owner_agent?: string;
  objective: string;
  description?: string;
  target_value?: number;
  unit?: string;
  current_value?: number;
  progress: number;
  deadline?: string;
  key_results: KeyResult[];
}

interface GoalsData {
  available?: boolean;
  revenue_targets?: {
    aug_2026?: RevenueTarget;
    eoy_2026?: RevenueTarget;
  };
  swarm_targets?: SwarmTarget[];
  okr_hierarchy?: {
    company?: CompanyObjective;
    departments?: Department[];
  };
}

// Progress values arrive on either a 0-1 decimal or a 0-100 percentage scale
// depending on whether the source goal has explicit progress_pct. Normalize to 0-1.
function toFraction(progress: number | undefined | null): number {
  if (!progress || Number.isNaN(progress)) return 0;
  const p = Number(progress);
  return p > 1 ? Math.min(p / 100, 1) : Math.max(0, Math.min(p, 1));
}

function formatTargetValue(value: number | undefined, unit: string | undefined): string {
  if (value == null) return "—";
  const u = (unit || "").toLowerCase();
  if (u.includes("usd")) return formatUSD(value);
  if (u === "percent" || u === "pct") return `${value}%`;
  return `${Number(value).toLocaleString()} ${unit ?? ""}`.trim();
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
  const frac = toFraction(progress);
  const pct = frac * 100;
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
  const swarms = data?.swarm_targets ?? [];
  const okr = data?.okr_hierarchy;
  const company = okr?.company;
  const departments = okr?.departments ?? [];

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
          {targets?.aug_2026 && (
            <ProgressBar
              value={targets.aug_2026.current ?? 0}
              max={targets.aug_2026.target ?? 0}
              color="bg-cyan-500"
              label={targets.aug_2026.label}
              subtext="Milestone 1 — signal subscriptions + SaaS MRR"
            />
          )}
          {targets?.eoy_2026 && (
            <ProgressBar
              value={targets.eoy_2026.current ?? 0}
              max={targets.eoy_2026.target ?? 0}
              color="bg-purple-500"
              label={targets.eoy_2026.label}
              subtext="Full autonomy — all revenue streams contributing"
            />
          )}
          {!targets && (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
              No revenue targets configured
            </p>
          )}
        </div>
      </SectionCard>

      {/* Per-Swarm Targets */}
      {swarms.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {swarms.map((s) => {
            const pct = toFraction(s.progress) * 100;
            const accent =
              pct >= 70 ? "text-emerald-400" : pct >= 30 ? "text-amber-400" : "text-cyan-300";
            return (
              <MetricCard
                key={s.swarm}
                label={s.swarm}
                value={formatTargetValue(s.current, s.unit)}
                subtext={`Target ${formatTargetValue(s.target, s.unit)} · ${pct.toFixed(1)}%`}
                accent={accent}
              />
            );
          })}
        </div>
      )}

      {/* Company OKR */}
      {company && company.objective && (
        <div className="mt-6">
          <SectionCard title="Company Objective" glow="purple">
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-white">{company.objective}</p>
              {company.description && (
                <p className="mb-3 text-xs text-[var(--text-tertiary)]">{company.description}</p>
              )}
              <OkrProgressBar progress={company.progress} />
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">
                  {formatTargetValue(company.current_value, company.unit)} /{" "}
                  {formatTargetValue(company.target_value, company.unit)}
                  {company.deadline ? ` · due ${company.deadline}` : ""}
                </span>
                <span className="text-[var(--text-tertiary)]">
                  {(toFraction(company.progress) * 100).toFixed(1)}% complete
                </span>
              </div>
            </div>

            {company.key_results.length > 0 && (
              <div className="space-y-3">
                {company.key_results.map((kr) => (
                  <div
                    key={kr.id}
                    className="rounded-lg border border-[var(--border-dim)]/50 bg-white/[0.02] p-3"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="text-sm text-[var(--text-primary)]">{kr.title}</p>
                      <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
                        {kr.owner_agent || kr.owner_department || ""}
                      </span>
                    </div>
                    <OkrProgressBar progress={kr.progress} size="sm" />
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">
                        {formatTargetValue(kr.current_value, kr.unit)} /{" "}
                        {formatTargetValue(kr.target_value, kr.unit)}
                        {kr.deadline ? ` · ${kr.deadline}` : ""}
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        {(toFraction(kr.progress) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Department OKRs */}
      {departments.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {departments.map((dept) => {
            const title = dept.department || dept.id;
            const childKrs = dept.key_results ?? [];
            return (
              <SectionCard key={dept.id} title={title}>
                <p className="mb-3 text-xs text-[var(--text-tertiary)]">{dept.objective}</p>
                <OkrProgressBar progress={dept.progress} />
                <div className="mt-1 mb-3 flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-muted)]">
                    {formatTargetValue(dept.current_value, dept.unit)} /{" "}
                    {formatTargetValue(dept.target_value, dept.unit)}
                  </span>
                  <span className="text-[var(--text-tertiary)]">
                    {(toFraction(dept.progress) * 100).toFixed(0)}%
                  </span>
                </div>

                {childKrs.length > 0 ? (
                  <div className="space-y-2">
                    {childKrs.map((kr) => (
                      <div key={kr.id} className="rounded-md bg-white/[0.02] px-2.5 py-2 text-xs">
                        <p className="mb-1 text-[var(--text-primary)]">{kr.title}</p>
                        <OkrProgressBar progress={kr.progress} size="sm" />
                        <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>
                            {formatTargetValue(kr.current_value, kr.unit)} /{" "}
                            {formatTargetValue(kr.target_value, kr.unit)}
                          </span>
                          <span>{(toFraction(kr.progress) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-center text-[10px] text-[var(--text-muted)]">
                    No key results defined for this objective
                  </p>
                )}

                {dept.owner_agent && (
                  <p className="mt-3 text-[10px] text-[var(--text-muted)]">
                    Owner: {dept.owner_agent}
                  </p>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
