"use client";

import { useCallback, useEffect } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import type { EmpireNodeData } from "./buildGraph";
import { empireNodeTypes } from "./EmpireNodes";

import "@xyflow/react/dist/style.css";

interface OrgChartProps {
  nodes: Node<EmpireNodeData>[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (node: Node<EmpireNodeData> | null) => void;
}

function OrgChartInner({
  nodes: propNodes,
  edges: propEdges,
  selectedId,
  onSelect,
}: OrgChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges);

  useEffect(() => {
    setNodes(propNodes);
  }, [propNodes, setNodes]);

  useEffect(() => {
    setEdges(propEdges);
  }, [propEdges, setEdges]);

  useEffect(() => {
    if (selectedId === null) {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    }
  }, [selectedId, setNodes]);

  const onSelectionChange = useCallback(
    ({ nodes: sel }: OnSelectionChangeParams<Node<EmpireNodeData>>) => {
      onSelect(sel[0] ?? null);
    },
    [onSelect],
  );

  const onPaneClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <div className="h-[min(78vh,820px)] w-full rounded-xl border border-[var(--border-dim)] bg-[var(--surface-1)]/80">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={empireNodeTypes}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="rounded-xl"
      >
        <Background gap={20} size={1} color="rgba(255,255,255,0.04)" />
        <Controls className="!m-2 !border-[var(--border-dim)] !bg-[var(--surface-2)]/95 !text-white" />
        <MiniMap
          className="!m-2 !rounded-lg !border !border-[var(--border-dim)] !bg-[var(--surface-2)]/90"
          nodeStrokeWidth={2}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

export default function OrgChart(props: OrgChartProps) {
  return (
    <ReactFlowProvider>
      <OrgChartInner {...props} />
    </ReactFlowProvider>
  );
}
