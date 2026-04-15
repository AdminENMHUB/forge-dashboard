"use client";

import { useMemo, useState, useEffect } from "react";
import { timeAgo } from "@/lib/formatters";
import type { AgentScorecard, ActivityData, TelemetryData } from "./useGalaxyData";

interface Props {
  agent: AgentScorecard;
  activity: ActivityData | null;
  telemetry: TelemetryData | null;
  onClose: () => void;
}

const PILLAR_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  reliability: "Reliability",
  cost_efficiency: "Cost Efficiency",
  innovation: "Innovation",
  collaboration: "Collaboration",
  speed: "Speed",
  quality: "Quality",
};

const PILLAR_COLORS: Record<string, string> = {
  accuracy: "#22d3ee",
  reliability: "#10b981",
  cost_efficiency: "#f59e0b",
  innovation: "#a855f7",
  collaboration: "#3b82f6",
  speed: "#ec4899",
  quality: "#06b6d4",
};

export function AgentInspector({ agent, activity, telemetry, onClose }: Props) {
  const pillars = agent.pillars ?? {};
  const pillarEntries = Object.entries(pillars);
  const [animScale, setAnimScale] = useState(0);

  useEffect(() => {
    setAnimScale(0);
    const raf = requestAnimationFrame(() => {
      const start = performance.now();
      const dur = 500;
      function step() {
        const t = Math.min((performance.now() - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setAnimScale(ease);
        if (t < 1) requestAnimationFrame(step);
      }
      step();
    });
    return () => cancelAnimationFrame(raf);
  }, [agent.name]);

  const radarPoints = useMemo(() => {
    if (pillarEntries.length === 0) return "";
    return pillarEntries
      .map(([, val], i) => {
        const angle = (i / pillarEntries.length) * Math.PI * 2 - Math.PI / 2;
        const normalized = ((val as number) / 5) * animScale;
        const x = 100 + Math.cos(angle) * 75 * normalized;
        const y = 100 + Math.sin(angle) * 75 * normalized;
        return `${x},${y}`;
      })
      .join(" ");
  }, [pillarEntries, animScale]);

  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const recentActions = useMemo(() => {
    if (!activity?.events) return [];
    const agentLower = agent.name.toLowerCase();
    return activity.events
      .filter(
        (e) =>
          e.agent?.toLowerCase().includes(agentLower) ||
          e.message?.toLowerCase().includes(agentLower),
      )
      .slice(0, 5);
  }, [activity, agent.name]);

  const toolStats = telemetry?.tools;

  return (
    <div className="animate-in absolute right-4 bottom-16 z-20 w-80 lg:w-[420px]">
      <div className="rounded-2xl border border-white/[0.08] bg-[#06080f]/90 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-white">{agent.name.replace(/_/g, " ")}</h3>
            <p className="text-[10px] text-white/40">{agent.department ?? agent.swarm ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            {agent.rating && (
              <div
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  agent.rating >= 4
                    ? "bg-emerald-500/15 text-emerald-400"
                    : agent.rating >= 3
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {agent.rating.toFixed(1)} ★
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          {/* Animated radar chart */}
          {pillarEntries.length > 0 && (
            <div className="flex justify-center">
              <svg viewBox="0 0 200 200" width={200} height={200}>
                {gridRings.map((scale) => (
                  <polygon
                    key={scale}
                    points={pillarEntries
                      .map((_: [string, number], i: number) => {
                        const angle = (i / pillarEntries.length) * Math.PI * 2 - Math.PI / 2;
                        const x = 100 + Math.cos(angle) * 75 * scale;
                        const y = 100 + Math.sin(angle) * 75 * scale;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={0.5}
                  />
                ))}

                {pillarEntries.map((_: [string, number], i: number) => {
                  const angle = (i / pillarEntries.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 100 + Math.cos(angle) * 75;
                  const y = 100 + Math.sin(angle) * 75;
                  return (
                    <line
                      key={i}
                      x1={100}
                      y1={100}
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={0.5}
                    />
                  );
                })}

                <polygon
                  points={radarPoints}
                  fill="rgba(34, 211, 238, 0.15)"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  style={{ transition: "none" }}
                />

                {pillarEntries.map(([key, val]: [string, number], i: number) => {
                  const angle = (i / pillarEntries.length) * Math.PI * 2 - Math.PI / 2;
                  const normalized = (val / 5) * animScale;
                  const x = 100 + Math.cos(angle) * 75 * normalized;
                  const y = 100 + Math.sin(angle) * 75 * normalized;
                  const color = PILLAR_COLORS[key] ?? "#22d3ee";
                  return <circle key={key} cx={x} cy={y} r={3} fill={color} />;
                })}

                {pillarEntries.map(([key]: [string, number], i: number) => {
                  const angle = (i / pillarEntries.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 100 + Math.cos(angle) * 95;
                  const y = 100 + Math.sin(angle) * 95;
                  return (
                    <text
                      key={key}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.5)"
                      fontSize={7}
                      fontFamily="var(--font-geist-sans), system-ui"
                    >
                      {PILLAR_LABELS[key] ?? key}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Pillar breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {pillarEntries.map(([key, val]: [string, number]) => {
              const color = PILLAR_COLORS[key] ?? "#22d3ee";
              const pct = (val / 5) * 100;
              return (
                <div
                  key={key}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-white/50">{PILLAR_LABELS[key] ?? key}</span>
                    <span className="text-[10px] font-bold" style={{ color }}>
                      {val.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct * animScale}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {agent.autonomy_level && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                <p className="text-white/30">Autonomy</p>
                <p className="font-semibold text-white capitalize">{agent.autonomy_level}</p>
              </div>
            )}
            {agent.cost_daily !== undefined && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                <p className="text-white/30">Daily Cost</p>
                <p className="font-semibold text-white">${agent.cost_daily.toFixed(2)}</p>
              </div>
            )}
            {agent.error_rate !== undefined && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                <p className="text-white/30">Error Rate</p>
                <p
                  className={`font-semibold ${agent.error_rate > 0.1 ? "text-red-400" : "text-emerald-400"}`}
                >
                  {(agent.error_rate * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Tool usage */}
          {toolStats && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                <p className="text-white/30">Tool Calls</p>
                <p className="font-semibold text-white">{toolStats.total_calls ?? 0}</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                <p className="text-white/30">Tool Error Rate</p>
                <p
                  className={`font-semibold ${(toolStats.error_rate ?? 0) > 0.05 ? "text-red-400" : "text-emerald-400"}`}
                >
                  {((toolStats.error_rate ?? 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Recent Actions timeline */}
          {recentActions.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] tracking-wider text-white/30 uppercase">
                Recent Actions
              </p>
              <div className="space-y-1.5">
                {recentActions.map((evt, i) => (
                  <div key={evt.id ?? i} className="flex items-start gap-2 text-[11px]">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[8px] text-cyan-400">
                      {i + 1}
                    </div>
                    <p className="flex-1 text-white/60">{evt.message ?? evt.type}</p>
                    {evt.ts && <span className="shrink-0 text-white/20">{timeAgo(evt.ts)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDP status */}
          {agent.pdp?.active && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                  Professional Development Plan
                </span>
              </div>
              {agent.pdp.plan && <p className="text-[11px] text-amber-400/70">{agent.pdp.plan}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
