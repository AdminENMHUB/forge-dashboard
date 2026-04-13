"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { StatusBadge } from "@/components/ui";
import { formatUSD } from "@/lib/formatters";

import type { EmpireNodeData } from "./buildGraph";

type EmpireCenterRf = Node<EmpireNodeData, "empireCenter">;
type EmpireDeptRf = Node<EmpireNodeData, "empireDept">;

/** Maps API health strings to StatusBadge keys in ui.tsx */
export function mapBadgeStatus(raw?: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("healthy") || s === "active" || s === "online") return "healthy";
  if (s.includes("degraded")) return "degraded";
  if (s.includes("stop") || s.includes("fail") || s === "offline" || s.includes("halt"))
    return "halted";
  if (s === "unknown" || s.length === 0) return "unknown";
  return "running";
}

function EmpireCenterNode({ data }: NodeProps<EmpireCenterRf>) {
  return (
    <div className="glass w-[min(100vw-2rem,320px)] max-w-[320px] rounded-2xl border border-cyan-500/25 bg-[var(--surface-2)]/95 p-4 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-cyan-400"
      />
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-tight text-white">{data.label}</p>
        <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 uppercase">
          Empire
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
        <div>
          <p className="text-[var(--text-muted)] uppercase">MRR</p>
          <p className="font-mono text-white">{formatUSD(data.mrr ?? 0)}</p>
        </div>
        <div>
          <p className="text-[var(--text-muted)] uppercase">Portfolio</p>
          <p className="font-mono text-white">{formatUSD(data.portfolio ?? 0)}</p>
        </div>
        <div>
          <p className="text-[var(--text-muted)] uppercase">Total P&amp;L</p>
          <p
            className={`font-mono ${(data.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatUSD(data.totalPnl ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[var(--text-muted)] uppercase">Daily</p>
          <p
            className={`font-mono ${(data.dailyPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatUSD(data.dailyPnl ?? 0)}
          </p>
        </div>
      </div>
      {data.reflectionSnippet && (
        <p className="mt-3 line-clamp-3 border-t border-[var(--border-dim)] pt-2 text-[11px] leading-snug text-[var(--text-tertiary)]">
          <span className="font-semibold text-cyan-400/90">Reflection · </span>
          {data.reflectionSnippet}
        </p>
      )}
      {data.orchestratorSnippet && (
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">{data.orchestratorSnippet}</p>
      )}
    </div>
  );
}

function EmpireDeptNode({ data }: NodeProps<EmpireDeptRf>) {
  const isClaws = data.kind === "claws";
  const badgeStatus = mapBadgeStatus(data.status ?? data.serviceHealth);

  return (
    <div className="glass w-[200px] rounded-xl border border-[var(--border-dim)] bg-[var(--surface-2)]/95 p-3 shadow-lg">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-cyan-400/80"
      />
      <div className="mb-1 flex items-start justify-between gap-1">
        <p className="text-[12px] leading-tight font-semibold text-white">{data.label}</p>
        {(data.status || data.serviceHealth) && <StatusBadge status={badgeStatus} />}
      </div>
      {isClaws ? (
        <div className="text-[11px] text-[var(--text-tertiary)]">
          <p>
            <span className="text-[var(--text-muted)]">Catalog · </span>
            {data.productCount ?? 0} products
          </p>
          {data.latestProducts && data.latestProducts.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-[10px] text-[var(--text-muted)]">
              {data.latestProducts.slice(0, 3).map((t) => (
                <li key={t} className="truncate">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-0.5 text-[10px] text-[var(--text-tertiary)]">
          {data.swarmName && (
            <p className="truncate font-mono text-[var(--text-muted)]">{data.swarmName}</p>
          )}
          <div className="flex justify-between gap-2">
            <span>P&amp;L</span>
            <span className={(data.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
              {formatUSD(data.totalPnl ?? 0)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>MRR</span>
            <span className="text-[var(--text-secondary)]">{formatUSD(data.mrr ?? 0)}</span>
          </div>
          {data.agents != null && (
            <div className="flex justify-between gap-2">
              <span>Agents</span>
              <span>{data.agents}</span>
            </div>
          )}
          {data.budgetMonthly != null && (
            <div className="flex justify-between gap-2 border-t border-[var(--border-dim)] pt-1">
              <span>Budget / mo</span>
              <span>${data.budgetMonthly.toFixed(0)}</span>
            </div>
          )}
        </div>
      )}
      {data.signalSystems && Object.keys(data.signalSystems).length > 0 && (
        <div className="mt-2 border-t border-[var(--border-dim)] pt-1 text-[9px] text-[var(--text-muted)]">
          {Object.entries(data.signalSystems).map(([k, v]) => (
            <span key={k} className="mr-2">
              {k}: {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const empireNodeTypes = {
  empireCenter: EmpireCenterNode,
  empireDept: EmpireDeptNode,
};
