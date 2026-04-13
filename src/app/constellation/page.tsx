"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { Node } from "@xyflow/react";

import { ConstellationErrorBoundary } from "@/components/ConstellationErrorBoundary";
import { buildEmpireFlowGraph, type EmpireNodeData } from "@/components/constellation/buildGraph";
import { ConstellationDetailPanel } from "@/components/constellation/DetailPanel";
import { PageShell } from "@/components/nav";
import { Skeleton } from "@/components/ui";
import { useApiPoller } from "@/lib/hooks";
import type {
  HealthResponse,
  OrganizationDocument,
  OrchestratorSummary,
  ProductCatalogResponse,
  ReflectionSummary,
  SignalHealthResponse,
  StatusResponse,
} from "@/types/empire";

/** Reject error JSON bodies and malformed payloads from /api/organization */
function parseOrganizationPayload(data: unknown): OrganizationDocument | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.error === "string") return null;
  if (typeof o.company !== "object" || o.company === null) return null;
  if (typeof o.departments !== "object" || o.departments === null) return null;
  return data as OrganizationDocument;
}

const OrgChart = dynamic(() => import("@/components/constellation/OrgChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(78vh,820px)] items-center justify-center rounded-xl border border-[var(--border-dim)] bg-[var(--surface-1)]/80">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  ),
});

export default function ConstellationPage() {
  const orgPoll = useApiPoller<OrganizationDocument>("/api/organization", 3_600_000);
  const statusPoll = useApiPoller<StatusResponse>("/api/status", 15_000);
  const healthPoll = useApiPoller<HealthResponse>("/api/health", 15_000);
  const catalogPoll = useApiPoller<ProductCatalogResponse>("/api/product-catalog", 60_000);
  const reflectionPoll = useApiPoller<ReflectionSummary>("/api/reflection-summary", 60_000);
  const orchPoll = useApiPoller<OrchestratorSummary>("/api/orchestrator", 15_000);
  const signalPoll = useApiPoller<SignalHealthResponse>("/api/forge-signal/health", 30_000);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "cards">("cards");
  const [query, setQuery] = useState("");

  const orgDoc = useMemo(() => parseOrganizationPayload(orgPoll.data), [orgPoll.data]);
  const orgLoadError =
    orgPoll.error ||
    (orgPoll.data && typeof orgPoll.data === "object" && "error" in orgPoll.data
      ? String((orgPoll.data as { error?: string }).error ?? "")
      : null);

  const mergedError = [
    orgPoll.error,
    statusPoll.error,
    healthPoll.error,
    catalogPoll.error,
    reflectionPoll.error,
    orchPoll.error,
    signalPoll.error,
  ]
    .filter(Boolean)
    .join(" · ");

  const { nodes, edges } = useMemo(
    () =>
      buildEmpireFlowGraph(
        orgDoc,
        orgLoadError && !orgDoc ? orgLoadError : null,
        statusPoll.data ?? null,
        healthPoll.data ?? null,
        catalogPoll.data ?? null,
        reflectionPoll.data ?? null,
        orchPoll.data ?? null,
        signalPoll.data ?? null,
      ),
    [
      orgDoc,
      orgLoadError,
      statusPoll.data,
      healthPoll.data,
      catalogPoll.data,
      reflectionPoll.data,
      orchPoll.data,
      signalPoll.data,
    ],
  );

  const selectedNode = useMemo(
    () => (selectedId ? (nodes.find((n) => n.id === selectedId) ?? null) : null),
    [nodes, selectedId],
  );
  const departmentNodes = useMemo(() => nodes.filter((n) => n.data.kind !== "center"), [nodes]);
  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departmentNodes;
    return departmentNodes.filter((n) => {
      const d = n.data;
      const tags = [d.label, d.swarmName, d.status, d.serviceHealth]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tags.includes(q);
    });
  }, [departmentNodes, query]);

  const onSelect = useCallback((n: Node<EmpireNodeData> | null) => {
    setSelectedId(n?.id ?? null);
  }, []);

  const lastUpdate = statusPoll.lastUpdate || healthPoll.lastUpdate;

  return (
    <PageShell
      title="Constellation"
      subtitle="Live org chart from organization.yaml + empire telemetry"
      lastUpdate={lastUpdate}
      error={mergedError || undefined}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-dim)] bg-[var(--surface-1)]/80 p-3">
        <button
          type="button"
          onClick={() => setView("cards")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            view === "cards"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-white/5 text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          Cards
        </button>
        <button
          type="button"
          onClick={() => setView("graph")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            view === "graph"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-white/5 text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          Graph
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search swarms, status, health..."
          className="ml-auto w-full rounded-lg border border-[var(--border-dim)] bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-[var(--text-muted)] md:w-64"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MiniStat label="Departments" value={departmentNodes.length} />
        <MiniStat
          label="Healthy/Active"
          value={
            departmentNodes.filter((n) => {
              const s = `${n.data.status ?? ""} ${n.data.serviceHealth ?? ""}`.toLowerCase();
              return s.includes("healthy") || s.includes("active");
            }).length
          }
        />
        <MiniStat
          label="Needs Attention"
          value={
            departmentNodes.filter((n) => {
              const s = `${n.data.status ?? ""} ${n.data.serviceHealth ?? ""}`.toLowerCase();
              return s.includes("degraded") || s.includes("fail") || s.includes("halt");
            }).length
          }
        />
        <MiniStat label="Visible" value={filteredNodes.length} />
      </div>

      {view === "graph" ? (
        <>
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="min-h-0 min-w-0 flex-1">
              <ConstellationErrorBoundary>
                <OrgChart nodes={nodes} edges={edges} selectedId={selectedId} onSelect={onSelect} />
              </ConstellationErrorBoundary>
            </div>
            <ConstellationDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
          </div>
          <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
            Drag to pan · Scroll to zoom · Click a node for detail
          </p>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNodes.map((n) => {
              const d = n.data;
              const status = d.status ?? d.serviceHealth ?? "unknown";
              const pnl = Number(d.totalPnl ?? 0);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={`glass-card rounded-xl border p-3 text-left transition ${
                    selectedId === n.id
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-[var(--border-dim)] hover:border-white/20"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{d.label}</p>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                      {status}
                    </span>
                  </div>
                  {d.swarmName && (
                    <p className="mb-2 truncate font-mono text-[10px] text-[var(--text-muted)]">
                      {d.swarmName}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-[var(--text-muted)]">P&L</p>
                      <p className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                        ${pnl.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">MRR</p>
                      <p className="text-[var(--text-secondary)]">
                        ${Number(d.mrr ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredNodes.length === 0 && (
              <div className="glass-card col-span-full rounded-xl border border-[var(--border-dim)] p-4 text-sm text-[var(--text-muted)]">
                No results for that filter.
              </div>
            )}
          </div>
          <ConstellationDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </PageShell>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-lg border border-[var(--border-dim)] p-2 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
    </div>
  );
}
