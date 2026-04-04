"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/nav";

interface TeamData {
  active_teams: Record<
    string,
    {
      id: string;
      name: string;
      objective: string;
      status: string;
      agents: string[];
      max_concurrent: number;
      swarm: string;
      tags: string[];
    }
  >;
  recent_results: {
    team: string;
    success: boolean;
    started_at: string;
    completed_at: string;
    tasks_succeeded: number;
    tasks_failed: number;
    latency_ms: number;
    error: string;
  }[];
  error?: string;
}

const TEAM_PRESETS = [
  {
    name: "self_healing",
    description: "10 zero-LLM-cost agents monitoring SaaS, infra, trading, costs",
    cadence: "Every hour",
    agents: 10,
    color: "emerald",
  },
  {
    name: "revenue_optimization",
    description: "CFO, allocator, strategist — cross-swarm capital decisions",
    cadence: "Daily",
    agents: 6,
    color: "cyan",
  },
  {
    name: "growth",
    description: "CRO, marketing, content publishing, conversion funnels",
    cadence: "Every hour",
    agents: 6,
    color: "violet",
  },
  {
    name: "innovation",
    description: "AI research, competitive intel, strategy lab, spawner",
    cadence: "Weekly",
    agents: 5,
    color: "amber",
  },
];

export default function TeamsPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teams");
        setData(await res.json());
        setTs(new Date().toLocaleTimeString());
      } catch {
        setData({ active_teams: {}, recent_results: [], error: "Failed to reach API" });
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, []);

  const activeTeams = data?.active_teams ? Object.values(data.active_teams) : [];
  const results = data?.recent_results ?? [];

  return (
    <PageShell title="Teams" subtitle="Dynamic Agent Teams — OpenMultiAgent" lastUpdate={ts}>
      {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {data?.error && <p className="text-sm text-red-400">{data.error}</p>}

      {/* ── Pre-built Team Compositions ───────────────────────── */}
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
        Team Compositions
      </h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {TEAM_PRESETS.map((preset) => {
          const lastRun = results.find((r) => r.team === preset.name);
          const borderColor =
            preset.color === "emerald"
              ? "border-emerald-500/20"
              : preset.color === "cyan"
                ? "border-cyan-500/20"
                : preset.color === "violet"
                  ? "border-violet-500/20"
                  : "border-amber-500/20";
          const badgeColor =
            preset.color === "emerald"
              ? "bg-emerald-500/10 text-emerald-400"
              : preset.color === "cyan"
                ? "bg-cyan-500/10 text-cyan-400"
                : preset.color === "violet"
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-amber-500/10 text-amber-400";

          return (
            <div key={preset.name} className={`glass-card border ${borderColor} p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{preset.name.replace(/_/g, " ")}</h3>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                    {preset.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
                >
                  {preset.cadence}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px]">
                <span className="text-[var(--text-muted)]">{preset.agents} agents</span>
                {lastRun && (
                  <>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className={lastRun.success ? "text-emerald-400" : "text-red-400"}>
                      Last: {lastRun.success ? "✓" : "✗"} {lastRun.tasks_succeeded}/
                      {lastRun.tasks_succeeded + lastRun.tasks_failed} tasks
                    </span>
                    <span className="text-[var(--text-muted)]">{lastRun.latency_ms}ms</span>
                  </>
                )}
                {!lastRun && <span className="text-[var(--text-muted)]">· No runs yet</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Teams ─────────────────────────────────────── */}
      {activeTeams.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Active Teams ({activeTeams.length})
          </h2>
          <div className="mb-6 space-y-2">
            {activeTeams.map((team) => (
              <div key={team.id} className="glass-card border border-cyan-500/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="pulse-dot h-2 w-2 rounded-full bg-cyan-400" />
                  <h3 className="text-sm font-bold text-white">{team.name}</h3>
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
                    {team.status}
                  </span>
                </div>
                {team.objective && (
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{team.objective}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {team.agents.map((agent) => (
                    <span
                      key={agent}
                      className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Execution History ────────────────────────────────── */}
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
        Execution History
      </h2>
      {results.length > 0 ? (
        <div className="space-y-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                r.success
                  ? "border-emerald-500/10 bg-emerald-500/[0.03]"
                  : "border-red-500/10 bg-red-500/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={r.success ? "text-emerald-400" : "text-red-400"}>
                  {r.success ? "✓" : "✗"}
                </span>
                <span className="font-semibold text-white">{r.team}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <span>
                  {r.tasks_succeeded}/{r.tasks_succeeded + r.tasks_failed} tasks
                </span>
                <span>{r.latency_ms}ms</span>
                {r.started_at && <span>{new Date(r.started_at).toLocaleTimeString()}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          Team execution history will appear after the overseer runs its next cycle with the new
          orchestrator.
        </p>
      )}
    </PageShell>
  );
}
