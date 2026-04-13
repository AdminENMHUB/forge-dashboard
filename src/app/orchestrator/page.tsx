"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/nav";

interface OrchestratorData {
  orchestrator?: {
    registered_agents: number;
    active_teams: number;
    completed_teams_total: number;
    recent_success_rate: number;
    timestamp: string;
  };
  active_teams?: Record<
    string,
    { name: string; objective: string; status: string; agents: string[] }
  >;
  recent_results?: {
    team: string;
    success: boolean;
    started_at: string;
    completed_at: string;
    tasks_succeeded: number;
    tasks_failed: number;
    latency_ms: number;
    error: string;
  }[];
  pool?: { max_concurrent: number; active: number; queued: number; completed_total: number };
  tools?: {
    total_tools: number;
    total_calls: number;
    total_errors: number;
    error_rate: number;
    estimated_cost_usd: number;
    calls_by_category: Record<string, number>;
    top_tools: { name: string; calls: number; avg_ms: number }[];
  };
  error?: string;
}

interface ToolsData {
  stats?: OrchestratorData["tools"];
  tools?: { name: string; description: string; category: string; swarm: string }[];
  recent_invocations?: {
    tool: string;
    caller: string;
    success: boolean;
    latency_ms: number;
    timestamp: string;
    error: string;
  }[];
}

interface BusActivityData {
  total_messages?: number;
  by_status?: Record<string, number>;
  by_priority?: Record<string, number>;
  by_type?: Record<string, number>;
  inboxes?: Record<string, number>;
  recent_log?: {
    type?: string;
    sender?: string;
    recipient?: string;
    subject?: string;
    _log_ts?: string;
    created_at?: string;
  }[];
  error?: string;
}

export default function OrchestratorPage() {
  const [data, setData] = useState<OrchestratorData | null>(null);
  const [tools, setTools] = useState<ToolsData | null>(null);
  const [bus, setBus] = useState<BusActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [orchRes, toolRes, busRes] = await Promise.all([
          fetch("/api/orchestrator").then((r) => r.json()),
          fetch("/api/tools").then((r) => r.json()),
          fetch("/api/bus/activity").then((r) => r.json()),
        ]);
        setData(orchRes);
        setTools(toolRes);
        setBus(busRes);
        setTs(new Date().toLocaleTimeString());
      } catch {
        setData({ error: "Failed to reach API" });
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, []);

  const o = data?.orchestrator;
  const p = data?.pool;
  const t = data?.tools || tools?.stats;

  return (
    <PageShell title="Orchestrator" subtitle="OpenMultiAgent Architecture" lastUpdate={ts}>
      {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {data?.error && <p className="text-sm text-red-400">{data.error}</p>}
      {bus?.error && <p className="text-sm text-red-400">Bus: {bus.error}</p>}

      {/* ── KPI Row ─────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Registered Agents" value={o?.registered_agents ?? "—"} />
        <Kpi label="Active Teams" value={o?.active_teams ?? 0} />
        <Kpi
          label="Success Rate"
          value={o ? `${(o.recent_success_rate * 100).toFixed(0)}%` : "—"}
          color={o && o.recent_success_rate >= 0.9 ? "text-emerald-400" : "text-amber-400"}
        />
        <Kpi label="Total Tools" value={t?.total_tools ?? "—"} />
        <Kpi label="A2A Msgs" value={bus?.total_messages ?? "—"} color="text-violet-400" />
      </div>

      {/* ── Agent Pool ──────────────────────────────────────────── */}
      <div className="glass-card mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">
          Agent Pool
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Max Concurrent" value={p?.max_concurrent ?? "—"} small />
          <Kpi label="Active Now" value={p?.active ?? 0} small color="text-cyan-400" />
          <Kpi label="Queued" value={p?.queued ?? 0} small />
          <Kpi label="Completed" value={p?.completed_total ?? 0} small />
        </div>
        {p && p.max_concurrent > 0 && (
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-white/5">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                style={{ width: `${Math.min(((p.active ?? 0) / p.max_concurrent) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {p.active}/{p.max_concurrent} slots in use
            </p>
          </div>
        )}
      </div>

      {/* ── A2A Bus ─────────────────────────────────────────────── */}
      {(bus?.inboxes && Object.keys(bus.inboxes).length > 0) ||
      (bus?.recent_log && bus.recent_log.length > 0) ? (
        <div className="glass-card mb-6 p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">A2A Bus</h2>
          {bus.inboxes && Object.keys(bus.inboxes).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.entries(bus.inboxes).map(([name, count]) => (
                <span
                  key={name}
                  className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300"
                >
                  {name}: {count}
                </span>
              ))}
            </div>
          )}
          {bus.by_type && Object.keys(bus.by_type).length > 0 && (
            <p className="mb-2 text-[10px] text-[var(--text-muted)]">
              Types:{" "}
              {Object.entries(bus.by_type)
                .map(([k, v]) => `${k} ${v}`)
                .join(" · ")}
            </p>
          )}
          {bus.recent_log && bus.recent_log.length > 0 && (
            <div className="max-h-52 space-y-1 overflow-y-auto border-t border-white/5 pt-3">
              <p className="mb-1 text-[10px] font-medium tracking-wide text-[var(--text-muted)] uppercase">
                Recent log
              </p>
              {bus.recent_log
                .slice()
                .reverse()
                .map((row, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono text-[10px]"
                  >
                    <span className="text-violet-400/90">{row.type ?? "?"}</span>
                    <span className="text-white/90">
                      {row.sender ?? "?"}
                      {row.recipient ? ` → ${row.recipient}` : ""}
                    </span>
                    <span className="truncate text-[var(--text-secondary)]">{row.subject}</span>
                    <span className="text-[var(--text-muted)]">
                      {row._log_ts?.slice(11, 19) ?? row.created_at?.slice(11, 19) ?? ""}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Tool Registry ────────────────────────────────────── */}
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">
            Tool Registry ({t?.total_tools ?? 0} tools)
          </h2>
          {t?.calls_by_category && (
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.entries(t.calls_by_category).map(([cat, calls]) => (
                <span
                  key={cat}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
                >
                  {cat}: {calls}
                </span>
              ))}
            </div>
          )}
          {t?.top_tools && t.top_tools.length > 0 && (
            <div className="space-y-1.5">
              {t.top_tools.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[var(--text-secondary)]">{tool.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {tool.calls} calls · {tool.avg_ms}ms avg
                  </span>
                </div>
              ))}
            </div>
          )}
          {tools?.tools && tools.tools.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-medium text-cyan-400">
                All {tools.tools.length} registered tools
              </summary>
              <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                {tools.tools.map((tl) => (
                  <div key={tl.name} className="rounded-lg bg-white/[0.02] p-2 text-[11px]">
                    <span className="font-mono font-semibold text-white">{tl.name}</span>
                    <span className="ml-2 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
                      {tl.swarm}
                    </span>
                    <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                      {tl.category}
                    </span>
                    <p className="mt-0.5 text-[var(--text-tertiary)]">{tl.description}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* ── Recent Team Results ──────────────────────────────── */}
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">
            Recent Team Executions
          </h2>
          {data?.recent_results && data.recent_results.length > 0 ? (
            <div className="space-y-2">
              {data.recent_results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-xs ${
                    r.success
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{r.team}</span>
                    <span className={r.success ? "text-emerald-400" : "text-red-400"}>
                      {r.success ? "✓ OK" : "✗ FAILED"}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[var(--text-muted)]">
                    <span>{r.tasks_succeeded} passed</span>
                    {r.tasks_failed > 0 && (
                      <span className="text-red-400">{r.tasks_failed} failed</span>
                    )}
                    <span>{r.latency_ms}ms</span>
                  </div>
                  {r.error && <p className="mt-1 text-red-400">{r.error}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              No team executions yet. Teams will appear after the next overseer cycle.
            </p>
          )}
        </div>
      </div>

      {/* ── Recent Tool Invocations ─────────────────────────────── */}
      {tools?.recent_invocations && tools.recent_invocations.length > 0 && (
        <div className="glass-card mt-6 p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">
            Recent Tool Invocations
          </h2>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {tools.recent_invocations.map((inv, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px]">
                <span className={inv.success ? "text-emerald-400" : "text-red-400"}>
                  {inv.success ? "●" : "●"}
                </span>
                <span className="w-40 truncate font-mono text-white">{inv.tool}</span>
                <span className="w-28 truncate text-[var(--text-tertiary)]">{inv.caller}</span>
                <span className="text-[var(--text-muted)]">{inv.latency_ms}ms</span>
                {inv.error && <span className="truncate text-red-400">{inv.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Kpi({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="glass-card p-3 text-center">
      <p className={`${small ? "text-lg" : "text-2xl"} font-bold ${color ?? "text-white"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
        {label}
      </p>
    </div>
  );
}
