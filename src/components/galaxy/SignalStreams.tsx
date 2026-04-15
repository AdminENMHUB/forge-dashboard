"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BusActivity, FinancialsData } from "./useGalaxyData";
import type { SystemPosition } from "./layout";
import type { ZoomLevel } from "./constants";
import { SWARM_REGISTRY, REVENUE_COLOR } from "./constants";

interface Props {
  bus: BusActivity | null;
  financials: FinancialsData | null;
  systemPositions: SystemPosition[];
  zoomLevel: ZoomLevel;
}

interface StreamPath {
  from: THREE.Vector3;
  to: THREE.Vector3;
  intensity: number;
  color: THREE.Color;
}

const BASE_PARTICLES = 200;
const MAX_PARTICLES = 1500;
const TRAIL_LENGTH = 3;

const REVENUE_SWARMS = ["EganTradeBot", "EchoSwarm", "EganSaasFactory", "EganWeb3Swarm"];
const MAX_REVENUE_PARTICLES = 300;

function hashSeed(n: number): number {
  let h = Math.imul(n, 2654435761);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  return Math.abs((h >>> 16) ^ h);
}

function quadraticBezier(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  t: number,
): THREE.Vector3 {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
}

function findSystem(name: string, positions: SystemPosition[]): SystemPosition | undefined {
  const lower = name.toLowerCase();
  return positions.find((p) => {
    const meta = SWARM_REGISTRY.find((s) => s.key === p.key);
    return (
      p.key.toLowerCase().includes(lower) ||
      meta?.label.toLowerCase().includes(lower) ||
      lower.includes(p.key.toLowerCase())
    );
  });
}

export function SignalStreams({ bus, financials, systemPositions, zoomLevel }: Props) {
  const signalPointsRef = useRef<THREE.Points>(null);
  const trailPointsRef = useRef<THREE.Points>(null);
  const revenuePointsRef = useRef<THREE.Points>(null);

  const signalGeomRef = useRef<THREE.BufferGeometry>(null);
  const trailGeomRef = useRef<THREE.BufferGeometry>(null);
  const revenueGeomRef = useRef<THREE.BufferGeometry>(null);

  const streams = useMemo<StreamPath[]>(() => {
    if (!bus?.recent_log || systemPositions.length === 0) return [];

    const pairCount = new Map<string, number>();
    for (const msg of bus.recent_log.slice(-50)) {
      const sender = msg.sender ?? msg.type ?? "";
      const recipient = msg.recipient ?? "";
      if (!sender || !recipient) continue;
      const key = `${sender}|${recipient}`;
      pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    }

    const paths: StreamPath[] = [];
    for (const [key, count] of pairCount) {
      const [senderName, recipientName] = key.split("|");
      const fromSys = findSystem(senderName, systemPositions);
      const toSys = findSystem(recipientName, systemPositions);
      if (fromSys && toSys && fromSys.key !== toSys.key) {
        const meta = SWARM_REGISTRY.find((s) => s.key === fromSys.key);
        paths.push({
          from: new THREE.Vector3(fromSys.x, fromSys.y, fromSys.z),
          to: new THREE.Vector3(toSys.x, toSys.y, toSys.z),
          intensity: Math.min(count / 5, 1),
          color: meta?.color ?? new THREE.Color("#22d3ee"),
        });
      }
    }

    if (paths.length === 0) {
      for (let i = 0; i < systemPositions.length - 1; i++) {
        const a = systemPositions[i];
        const b = systemPositions[(i + 1) % systemPositions.length];
        const meta = SWARM_REGISTRY.find((s) => s.key === a.key);
        paths.push({
          from: new THREE.Vector3(a.x, a.y, a.z),
          to: new THREE.Vector3(b.x, b.y, b.z),
          intensity: 0.3,
          color: meta?.color ?? new THREE.Color("#22d3ee"),
        });
      }
    }

    return paths;
  }, [bus, systemPositions]);

  const particleCount = useMemo(() => {
    const msgCount = bus?.message_count ?? 0;
    return Math.min(BASE_PARTICLES + msgCount * 10, MAX_PARTICLES);
  }, [bus?.message_count]);

  const progressRef = useRef<Float32Array>(new Float32Array(0));
  const sizesRef = useRef<Float32Array>(new Float32Array(0));
  const trailHistoryRef = useRef<Float32Array[]>([]);

  useEffect(() => {
    const prog = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      prog[i] = hashSeed(i) / 4294967296;
      sizes[i] = i % 20 === 0 ? 0.14 : 0.04 + (hashSeed(i + 1000) / 4294967296) * 0.08;
    }
    progressRef.current = prog;
    sizesRef.current = sizes;
    trailHistoryRef.current = Array.from(
      { length: TRAIL_LENGTH - 1 },
      () => new Float32Array(particleCount * 3),
    );
  }, [particleCount]);

  useEffect(() => {
    if (!signalGeomRef.current) return;
    const posAttr = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    signalGeomRef.current.setAttribute("position", posAttr);
    const colAttr = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    signalGeomRef.current.setAttribute("color", colAttr);
    const sizeAttr = new THREE.BufferAttribute(new Float32Array(particleCount), 1);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    signalGeomRef.current.setAttribute("size", sizeAttr);
  }, [particleCount]);

  useEffect(() => {
    if (!trailGeomRef.current) return;
    const trailCount = particleCount * (TRAIL_LENGTH - 1);
    const posAttr = new THREE.BufferAttribute(new Float32Array(trailCount * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    trailGeomRef.current.setAttribute("position", posAttr);
    const colAttr = new THREE.BufferAttribute(new Float32Array(trailCount * 3), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    trailGeomRef.current.setAttribute("color", colAttr);
  }, [particleCount]);

  const revenueStreams = useMemo<StreamPath[]>(() => {
    if (!financials?.swarms || systemPositions.length === 0) return [];
    const center = new THREE.Vector3(0, 0, 0);
    const paths: StreamPath[] = [];

    for (const key of REVENUE_SWARMS) {
      const swarmFin = financials.swarms[key];
      const pnl = swarmFin?.pnl ?? 0;
      if (pnl <= 0) continue;
      const sys = systemPositions.find((s) => s.key === key);
      if (!sys) continue;
      paths.push({
        from: new THREE.Vector3(sys.x, sys.y, sys.z),
        to: center,
        intensity: Math.min(pnl / 50, 1),
        color: REVENUE_COLOR,
      });
    }
    return paths;
  }, [financials, systemPositions]);

  const revenueParticleCount = useMemo(() => {
    const total = revenueStreams.reduce((s, r) => s + r.intensity, 0);
    return Math.min(Math.floor(total * 80) + 20, MAX_REVENUE_PARTICLES);
  }, [revenueStreams]);

  const revenueProgressRef = useRef<Float32Array>(new Float32Array(0));

  useEffect(() => {
    const prog = new Float32Array(revenueParticleCount);
    for (let i = 0; i < revenueParticleCount; i++) {
      prog[i] = hashSeed(i + 50000) / 4294967296;
    }
    revenueProgressRef.current = prog;

    if (!revenueGeomRef.current) return;
    const posAttr = new THREE.BufferAttribute(new Float32Array(revenueParticleCount * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    revenueGeomRef.current.setAttribute("position", posAttr);
    const colAttr = new THREE.BufferAttribute(new Float32Array(revenueParticleCount * 3), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    revenueGeomRef.current.setAttribute("color", colAttr);
  }, [revenueParticleCount]);

  useFrame(({ clock }) => {
    if (zoomLevel === "agent") return;
    const elapsed = clock.getElapsedTime();

    // Signal particles
    if (streams.length > 0 && signalGeomRef.current) {
      const posAttr = signalGeomRef.current.getAttribute(
        "position",
      ) as THREE.BufferAttribute | null;
      const colAttr = signalGeomRef.current.getAttribute("color") as THREE.BufferAttribute | null;
      if (posAttr && colAttr) {
        const positions = posAttr.array as Float32Array;
        const colors = colAttr.array as Float32Array;
        const progress = progressRef.current;

        for (let t = trailHistoryRef.current.length - 1; t > 0; t--) {
          trailHistoryRef.current[t].set(trailHistoryRef.current[t - 1]);
        }
        if (trailHistoryRef.current.length > 0) {
          trailHistoryRef.current[0].set(positions);
        }

        for (let i = 0; i < particleCount; i++) {
          const stream = streams[i % streams.length];
          const speedMul = 0.5 + stream.intensity * 1.5;
          progress[i] += 0.003 * speedMul;
          if (progress[i] > 1) progress[i] -= 1;

          const t = progress[i];
          const mid = new THREE.Vector3().lerpVectors(stream.from, stream.to, 0.5);
          mid.y += 2.5 + stream.intensity * 3;

          const p = quadraticBezier(stream.from, mid, stream.to, t);
          positions[i * 3] = p.x + Math.sin(elapsed * 3 + i) * 0.04;
          positions[i * 3 + 1] = p.y + Math.cos(elapsed * 2 + i) * 0.03;
          positions[i * 3 + 2] = p.z;

          const fade = Math.sin(t * Math.PI);
          const brightness = 0.6 + stream.intensity * 0.4;
          colors[i * 3] = stream.color.r * fade * brightness;
          colors[i * 3 + 1] = stream.color.g * fade * brightness;
          colors[i * 3 + 2] = stream.color.b * fade * brightness;
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }
    }

    // Trail particles
    if (trailGeomRef.current && trailHistoryRef.current.length > 0) {
      const trailPos = trailGeomRef.current.getAttribute(
        "position",
      ) as THREE.BufferAttribute | null;
      const trailCol = trailGeomRef.current.getAttribute("color") as THREE.BufferAttribute | null;
      if (trailPos && trailCol) {
        const tPositions = trailPos.array as Float32Array;
        const tColors = trailCol.array as Float32Array;

        for (let t = 0; t < TRAIL_LENGTH - 1; t++) {
          const history = trailHistoryRef.current[t];
          const fadeFactor = 1 - (t + 1) / TRAIL_LENGTH;
          for (let i = 0; i < particleCount; i++) {
            const idx = (t * particleCount + i) * 3;
            if (history && i * 3 + 2 < history.length) {
              tPositions[idx] = history[i * 3];
              tPositions[idx + 1] = history[i * 3 + 1];
              tPositions[idx + 2] = history[i * 3 + 2];
              const stream = streams[i % streams.length];
              if (stream) {
                tColors[idx] = stream.color.r * fadeFactor * 0.3;
                tColors[idx + 1] = stream.color.g * fadeFactor * 0.3;
                tColors[idx + 2] = stream.color.b * fadeFactor * 0.3;
              }
            }
          }
        }
        trailPos.needsUpdate = true;
        trailCol.needsUpdate = true;
      }
    }

    // Revenue flow particles
    if (revenueStreams.length > 0 && revenueGeomRef.current) {
      const posAttr = revenueGeomRef.current.getAttribute(
        "position",
      ) as THREE.BufferAttribute | null;
      const colAttr = revenueGeomRef.current.getAttribute("color") as THREE.BufferAttribute | null;
      if (posAttr && colAttr) {
        const positions = posAttr.array as Float32Array;
        const colors = colAttr.array as Float32Array;
        const progress = revenueProgressRef.current;

        for (let i = 0; i < revenueParticleCount; i++) {
          const stream = revenueStreams[i % revenueStreams.length];
          progress[i] += 0.002 * (0.8 + stream.intensity * 0.5);
          if (progress[i] > 1) progress[i] -= 1;

          const t = progress[i];
          const mid = new THREE.Vector3().lerpVectors(stream.from, stream.to, 0.5);
          mid.y -= 1.5;

          const p = quadraticBezier(stream.from, mid, stream.to, t);
          positions[i * 3] = p.x + Math.sin(elapsed * 2 + i * 0.5) * 0.06;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z + Math.cos(elapsed * 1.5 + i * 0.5) * 0.06;

          const fade = Math.sin(t * Math.PI);
          const sparkle = 0.7 + Math.sin(elapsed * 5 + i) * 0.3;
          colors[i * 3] = REVENUE_COLOR.r * fade * sparkle;
          colors[i * 3 + 1] = REVENUE_COLOR.g * fade * sparkle;
          colors[i * 3 + 2] = REVENUE_COLOR.b * fade * sparkle;
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }
    }
  });

  if (zoomLevel === "agent") return null;

  return (
    <group>
      {/* Signal stream particles */}
      <points ref={signalPointsRef}>
        <bufferGeometry ref={signalGeomRef} />
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.85}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Trail particles (faded, smaller) */}
      <points ref={trailPointsRef}>
        <bufferGeometry ref={trailGeomRef} />
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.4}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Revenue flow particles (gold, toward center) */}
      {revenueStreams.length > 0 && (
        <points ref={revenuePointsRef}>
          <bufferGeometry ref={revenueGeomRef} />
          <pointsMaterial
            size={0.1}
            vertexColors
            transparent
            opacity={0.9}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}
