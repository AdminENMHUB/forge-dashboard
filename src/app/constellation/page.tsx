"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { Node } from "@xyflow/react";

import { ConstellationErrorBoundary } from "@/components/ConstellationErrorBoundary";
import { buildEmpireFlowGraph, type EmpireNodeData } from "@/components/constellation/buildGraph";
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

import { ConstellationDetailPanel } from "@/components/constellation/DetailPanel";

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

  const [selected, setSelected] = useState<Node<EmpireNodeData> | null>(null);

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
        orgPoll.data ?? null,
        statusPoll.data ?? null,
        healthPoll.data ?? null,
        catalogPoll.data ?? null,
        reflectionPoll.data ?? null,
        orchPoll.data ?? null,
        signalPoll.data ?? null,
      ),
    [
      orgPoll.data,
      statusPoll.data,
      healthPoll.data,
      catalogPoll.data,
      reflectionPoll.data,
      orchPoll.data,
      signalPoll.data,
    ],
  );

  const onSelect = useCallback((n: Node<EmpireNodeData> | null) => {
    setSelected(n);
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
            <OrgChart
              nodes={nodes}
              edges={edges}
              selectedId={selected?.id ?? null}
              onSelect={onSelect}
            />
          </ConstellationErrorBoundary>
        </div>
        <ConstellationDetailPanel node={selected} onClose={() => setSelected(null)} />
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
        Drag to pan · Scroll to zoom · Click a node for detail · Click background to clear
      </p>
    </PageShell>
  );
}
