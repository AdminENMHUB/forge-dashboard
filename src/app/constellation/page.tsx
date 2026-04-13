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
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-h-0 min-w-0 flex-1">
          <ConstellationErrorBoundary>
            <OrgChart nodes={nodes} edges={edges} selectedId={selectedId} onSelect={onSelect} />
          </ConstellationErrorBoundary>
        </div>
        <ConstellationDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
        Drag to pan · Scroll to zoom · Click a node for detail · Click background to clear
      </p>
    </PageShell>
  );
}
