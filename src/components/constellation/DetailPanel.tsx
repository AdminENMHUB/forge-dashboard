"use client";

import type { Node } from "@xyflow/react";

import { useApiPoller } from "@/lib/hooks";
import { timeAgo } from "@/lib/formatters";

import type { EmpireNodeData } from "./buildGraph";

function restartHint(service?: string): string | undefined {
  if (!service) return undefined;
  const unit = service.replace(".service", "").trim();
  return `sudo systemctl restart ${unit}`;
}

interface ActivityEvent {
  type?: string;
  message?: string;
  timestamp?: string;
  ts?: string;
}

export function ConstellationDetailPanel({
  node,
  onClose,
}: {
  node: Node<EmpireNodeData> | null;
  onClose: () => void;
}) {
  const filter = node?.data?.activitySwarmFilter ?? "";
  const url = filter
    ? `/api/activity?swarm=${encodeURIComponent(filter)}&limit=14`
    : "/api/activity?limit=10";

  const {
    data: raw,
    loading,
    lastUpdate,
  } = useApiPoller<ActivityEvent[] | { events?: ActivityEvent[]; recent_events?: ActivityEvent[] }>(
    url,
    15000,
  );

  const events: ActivityEvent[] = Array.isArray(raw)
    ? raw
    : raw?.events || raw?.recent_events || [];

  if (!node) {
    return (
      <aside className="glass w-full shrink-0 rounded-xl border border-[var(--border-dim)] p-4 lg:w-[320px]">
        <p className="text-sm text-[var(--text-tertiary)]">
          Select a node to see swarm metrics, agents, and a live activity slice.
        </p>
      </aside>
    );
  }

  const d = node.data;
  const agents = d.agentNames ?? [];

  return (
    <aside className="glass w-full shrink-0 rounded-xl border border-[var(--border-dim)] p-4 lg:w-[340px]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">{d.label}</h2>
          {d.swarmName && (
            <p className="font-mono text-xs text-[var(--text-muted)]">{d.swarmName}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
        >
          Clear
        </button>
      </div>

      {d.kind === "center" && (
        <div className="mb-3 space-y-2 text-sm text-[var(--text-secondary)]">
          {d.reflectionSnippet && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                Reflection
              </p>
              <p className="mt-1 text-[13px] leading-snug">{d.reflectionSnippet}</p>
            </div>
          )}
          {d.orchestratorSnippet && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-purple-400 uppercase">
                Orchestrator
              </p>
              <p className="mt-1 font-mono text-xs">{d.orchestratorSnippet}</p>
            </div>
          )}
        </div>
      )}

      {d.kind !== "center" && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/[0.04] p-2">
            <p className="text-[var(--text-muted)]">Total P&amp;L</p>
            <p className="font-mono text-white">${(d.totalPnl ?? 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2">
            <p className="text-[var(--text-muted)]">MRR</p>
            <p className="font-mono text-white">${(d.mrr ?? 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      {agents.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Agents (org.yaml)
          </p>
          <ul className="max-h-28 overflow-y-auto text-[11px] text-[var(--text-tertiary)]">
            {agents.map((a) => (
              <li key={a} className="font-mono">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {restartHint(d.service) && (
        <div className="mb-3 rounded-lg border border-[var(--border-dim)] bg-black/20 p-2">
          <p className="text-[10px] text-[var(--text-muted)] uppercase">Ops (on VPS)</p>
          <code className="mt-1 block text-[10px] break-all text-cyan-300/90">
            {restartHint(d.service)}
          </code>
          <p className="mt-1 text-[9px] text-[var(--text-muted)]">
            SSH target is not embedded here — use your configured host.
          </p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Activity {filter ? `· ${filter}` : ""}
          </p>
          {lastUpdate && <span className="text-[9px] text-[var(--text-muted)]">{lastUpdate}</span>}
        </div>
        {loading && events.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No recent events.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-[11px]">
            {events.map((ev, i) => {
              const ts = ev.timestamp ?? ev.ts ?? "";
              return (
                <li
                  key={`${ts}-${i}`}
                  className="border-b border-[var(--border-dim)]/60 pb-2 last:border-0"
                >
                  <span className="text-[var(--text-muted)]">{ts ? timeAgo(ts) : "—"}</span>
                  <span className="ml-2 rounded bg-white/5 px-1 font-mono text-[10px] text-cyan-400/90">
                    {ev.type ?? "event"}
                  </span>
                  <p className="mt-0.5 text-[var(--text-secondary)]">{ev.message ?? "—"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
