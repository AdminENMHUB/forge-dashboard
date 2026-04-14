import * as THREE from "three";

export type ZoomLevel = "galaxy" | "system" | "agent";

export interface SwarmMeta {
  key: string;
  label: string;
  tier: number;
  angle: number;
  color: THREE.Color;
  emissive: THREE.Color;
}

export const SWARM_REGISTRY: SwarmMeta[] = [
  {
    key: "EganMasterSwarm",
    label: "Master Swarm",
    tier: 1,
    angle: 0,
    color: new THREE.Color("#22d3ee"),
    emissive: new THREE.Color("#22d3ee"),
  },
  {
    key: "EganTradeBot",
    label: "TradeBot",
    tier: 2,
    angle: 0.9,
    color: new THREE.Color("#10b981"),
    emissive: new THREE.Color("#10b981"),
  },
  {
    key: "EchoSwarm",
    label: "EchoSwarm",
    tier: 2,
    angle: 1.8,
    color: new THREE.Color("#a855f7"),
    emissive: new THREE.Color("#a855f7"),
  },
  {
    key: "EganSaasFactory",
    label: "SaaS Factory",
    tier: 2,
    angle: 2.7,
    color: new THREE.Color("#3b82f6"),
    emissive: new THREE.Color("#3b82f6"),
  },
  {
    key: "EganWeb3Swarm",
    label: "Web3 Swarm",
    tier: 2,
    angle: 3.6,
    color: new THREE.Color("#f59e0b"),
    emissive: new THREE.Color("#f59e0b"),
  },
  {
    key: "ForgeDefi",
    label: "DeFi Engine",
    tier: 2,
    angle: 4.5,
    color: new THREE.Color("#ec4899"),
    emissive: new THREE.Color("#ec4899"),
  },
  {
    key: "ForgeProducts",
    label: "Product Claws",
    tier: 2,
    angle: 5.4,
    color: new THREE.Color("#06b6d4"),
    emissive: new THREE.Color("#06b6d4"),
  },
];

export const TIER_RADIUS: Record<number, number> = {
  1: 6,
  2: 14,
};

export const HEALTH_COLORS = {
  healthy: new THREE.Color("#22d3ee"),
  degraded: new THREE.Color("#f59e0b"),
  critical: new THREE.Color("#ef4444"),
  unknown: new THREE.Color("#525d73"),
};

export const AGENT_SIZE_SCALE = { min: 0.15, max: 0.5 };
export const SYSTEM_SIZE_SCALE = { min: 0.6, max: 1.8 };

export const CAMERA_POSITIONS = {
  galaxy: {
    position: [0, 22, 28] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
  },
  systemOffset: { y: 6, z: 10 },
  agentOffset: { y: 2, z: 3 },
};

export const BLOOM_PARAMS = {
  galaxy: { intensity: 1.2, luminanceThreshold: 0.2 },
  system: { intensity: 0.8, luminanceThreshold: 0.3 },
  agent: { intensity: 0.4, luminanceThreshold: 0.4 },
};

export const POLL_INTERVALS = {
  status: 15_000,
  health: 15_000,
  financials: 30_000,
  activity: 10_000,
  scorecards: 30_000,
  orchestrator: 15_000,
  bus: 10_000,
  telemetry: 30_000,
  productCatalog: 60_000,
  proposals: 15_000,
};
