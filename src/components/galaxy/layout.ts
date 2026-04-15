import { SWARM_REGISTRY, TIER_RADIUS, SYSTEM_SIZE_SCALE, AGENT_SIZE_SCALE } from "./constants";
import type { SwarmData } from "@/types/empire";

export interface SystemPosition {
  key: string;
  x: number;
  y: number;
  z: number;
  size: number;
}

export interface AgentPosition {
  name: string;
  x: number;
  y: number;
  z: number;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
}

export function computeSystemPositions(
  swarms: Record<string, SwarmData> | undefined,
): SystemPosition[] {
  return SWARM_REGISTRY.map((meta) => {
    const radius = TIER_RADIUS[meta.tier] ?? 18;
    const angle = meta.angle;
    const swarm = swarms?.[meta.key];
    const portfolio = swarm?.portfolio_value ?? 0;
    const size = mapRange(
      Math.log10(Math.max(portfolio, 1)),
      0,
      5,
      SYSTEM_SIZE_SCALE.min,
      SYSTEM_SIZE_SCALE.max,
    );

    const yOffset = ((hashCode(meta.key) % 100) / 100 - 0.5) * 2.0;
    return {
      key: meta.key,
      x: Math.cos(angle) * radius,
      y: yOffset,
      z: Math.sin(angle) * radius,
      size,
    };
  });
}

export function computeAgentPositions(
  systemKey: string,
  agents: Array<{ name?: string; agent?: string; rating?: number }>,
): AgentPosition[] {
  const count = agents.length;
  if (count === 0) return [];

  const baseOrbit = 3.0;
  const ringGap = 1.2;
  const agentsPerRing = 8;

  return agents.map((agent, i) => {
    const ring = Math.floor(i / agentsPerRing);
    const posInRing = i % agentsPerRing;
    const ringCount = Math.min(agentsPerRing, count - ring * agentsPerRing);
    const orbitRadius = baseOrbit + ring * ringGap;
    const phase = (posInRing / ringCount) * Math.PI * 2;
    const rating = agent.rating ?? 3;
    const size = mapRange(rating, 1, 5, AGENT_SIZE_SCALE.min, AGENT_SIZE_SCALE.max);
    const displayName = ((agent.name ?? agent.agent) || "agent").trim() || "agent";
    const speed = 0.12 + (hashCode(displayName) % 100) / 600;

    const ratingNormalized = mapRange(rating, 1, 5, -0.4, 0.6);
    const yPos = ratingNormalized + Math.sin(phase * 2.3) * 0.2;

    return {
      name: displayName,
      x: Math.cos(phase) * orbitRadius,
      y: yPos,
      z: Math.sin(phase) * orbitRadius,
      size,
      orbitRadius,
      orbitSpeed: speed,
      orbitPhase: phase,
    };
  });
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
