"use client";

import { useState } from "react";
import { useApiPoller } from "@/lib/hooks";
import { timeAgo } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { MetricCard, SectionCard, Skeleton } from "@/components/ui";

interface AuditEntry {
  hash: string;
  prev_hash: string;
  event_type: string;
  timestamp: string;
  agent?: string;
  detail?: string;
  data?: Record<string, unknown>;
}

interface AuditData {
  chain_valid: boolean;
  total_entries: number;
  entries: AuditEntry[];
  event_types: string[];
}

const eventTypeColor: Record<string, { bg: string; text: string; dot: string }> = {
  decision: { bg: "border-cyan-500/20", text: "text-cyan-400", dot: "bg-cyan-400" },
  approval: { bg: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  override: { bg: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  error: { bg: "border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  cost: { bg: "border-purple-500/20", text: "text-purple-400", dot: "bg-purple-400" },
  heartbeat: { bg: "border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  escalation: { bg: "border-orange-500/20", text: "text-orange-400", dot: "bg-orange-400" },
  governance: { bg: "border-indigo-500/20", text: "text-indigo-400", dot: "bg-indigo-400" },
};

const DEFAULT_STYLE = { bg: "border-gray-700", text: "text-gray-400", dot: "bg-gray-400" };

export default function AuditPage() {
  const [filterType, setFilterType] = useState("");
  const [filterAgent, setFilterAgent] = useState("");

  const params = new URLSearchParams();
  if (filterType) params.set("event_type", filterType);
  if (filterAgent) params.set("agent", filterAgent);
  const qs = params.toString();

  const { data, loading, lastUpdate, error } = useApiPoller<AuditData>(
    `/api/audit${qs ? `?${qs}` : ""}`,
    30000,
  );

  if (loading) {
    return (
      <PageShell title="Audit Ledger" subtitle="SHA-256 hash chain — immutable event log">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4">
              <Skeleton className="mb-2 h-4 w-64" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  const entries = data?.entries || [];
  const eventTypes = data?.event_types || [];
  const chainValid = data?.chain_valid ?? true;
  const totalEntries = data?.total_entries ?? 0;

  const uniqueAgents = [...new Set(entries.map((e) => e.agent).filter(Boolean))].sort();

  return (
    <PageShell
      title="Audit Ledger"
      subtitle="SHA-256 hash chain — immutable event log"
      lastUpdate={lastUpdate}
      error={error}
    >
      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Chain Integrity"
          value={chainValid ? "VALID" : "BROKEN"}
          accent={chainValid ? "text-emerald-400" : "text-red-400"}
          glow={chainValid ? "emerald" : "red"}
        />
        <MetricCard label="Total Entries" value={totalEntries} glow="cyan" />
        <MetricCard label="Event Types" value={eventTypes.length} glow="purple" />
        <MetricCard
          label="Showing"
          value={entries.length}
          subtext={filterType || filterAgent ? "filtered" : "latest"}
        />
      </div>

      {/* Filters */}
      <SectionCard title="Filters">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
              Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-[var(--border-dim)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
            >
              <option value="">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
              Agent
            </label>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="rounded-lg border border-[var(--border-dim)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
            >
              <option value="">All agents</option>
              {uniqueAgents.map((a) => (
                <option key={a} value={a!}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {(filterType || filterAgent) && (
            <button
              onClick={() => {
                setFilterType("");
                setFilterAgent("");
              }}
              className="mt-auto rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
            >
              Clear
            </button>
          )}
        </div>
      </SectionCard>

      {/* Hash Chain Visualization */}
      <div className="mt-6">
        <SectionCard title="Hash Chain" subtitle={`${entries.length} entries`}>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No audit entries found. Events will appear as the system generates them.
            </p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, i) => {
                const style = eventTypeColor[entry.event_type] || DEFAULT_STYLE;
                const isFirst = i === 0;
                return (
                  <div key={entry.hash || i}>
                    {/* Connector line */}
                    {!isFirst && (
                      <div className="flex items-center gap-2 py-0.5 pl-[18px]">
                        <div className="h-4 w-px bg-[var(--border-dim)]" />
                        <span className="font-mono text-[9px] text-[var(--text-muted)]">
                          ← {entry.prev_hash?.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                    {/* Entry */}
                    <div
                      className={`flex items-start gap-3 rounded-lg border ${style.bg} bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]`}
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-semibold ${style.text}`}>
                            {entry.event_type.replace("_", " ").toUpperCase()}
                          </span>
                          {entry.agent && (
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                              {entry.agent}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {entry.timestamp ? timeAgo(entry.timestamp) : ""}
                          </span>
                        </div>
                        {entry.detail && (
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {entry.detail}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                          SHA-256: {entry.hash?.slice(0, 16)}...{entry.hash?.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Event Timeline (compact) */}
      <div className="mt-6">
        <SectionCard title="Event Timeline" subtitle="chronological">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--text-tertiary)]">No events.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-[10px] text-[var(--text-tertiary)] uppercase">
                    <th className="pr-3 pb-2 font-semibold">Time</th>
                    <th className="pr-3 pb-2 font-semibold">Type</th>
                    <th className="pr-3 pb-2 font-semibold">Agent</th>
                    <th className="pr-3 pb-2 font-semibold">Detail</th>
                    <th className="pb-2 font-semibold">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const style = eventTypeColor[entry.event_type] || DEFAULT_STYLE;
                    return (
                      <tr
                        key={entry.hash || i}
                        className="border-b border-[var(--border-dim)]/50 transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap text-[var(--text-tertiary)]">
                          {entry.timestamp ? timeAgo(entry.timestamp) : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`font-medium ${style.text}`}>
                            {entry.event_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-[var(--text-secondary)]">
                          {entry.agent || "—"}
                        </td>
                        <td className="max-w-xs truncate py-2 pr-3 text-[var(--text-secondary)]">
                          {entry.detail || "—"}
                        </td>
                        <td className="py-2 font-mono text-[10px] text-[var(--text-muted)]">
                          {entry.hash?.slice(0, 12)}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
