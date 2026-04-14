"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BusActivity } from "./useGalaxyData";
import type { SystemPosition } from "./layout";
import type { ZoomLevel } from "./constants";
import { SWARM_REGISTRY } from "./constants";

interface Props {
  bus: BusActivity | null;
  systemPositions: SystemPosition[];
  zoomLevel: ZoomLevel;
}

interface StreamPath {
  from: THREE.Vector3;
  to: THREE.Vector3;
  intensity: number;
  color: THREE.Color;
}

const PARTICLE_COUNT = 600;
const STREAM_COLOR = new THREE.Color("#22d3ee");

const initialProgress = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  initialProgress[i] = hashSeed(i) / 4294967296;
}

export function SignalStreams({ bus, systemPositions, zoomLevel }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef(new Float32Array(initialProgress));

  const geomRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!geomRef.current) return;
    const posAttr = new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geomRef.current.setAttribute("position", posAttr);

    const colAttr = new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    geomRef.current.setAttribute("color", colAttr);
  }, []);

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
          color: meta?.color ?? STREAM_COLOR,
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
          color: meta?.color ?? STREAM_COLOR,
        });
      }
    }

    return paths;
  }, [bus, systemPositions]);

  useFrame(({ clock }) => {
    if (zoomLevel === "agent" || streams.length === 0 || !geomRef.current) return;

    const posAttr = geomRef.current.getAttribute("position") as THREE.BufferAttribute | null;
    const colAttr = geomRef.current.getAttribute("color") as THREE.BufferAttribute | null;
    if (!posAttr || !colAttr) return;

    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;
    const progress = progressRef.current;
    const dt = 0.003;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const stream = streams[i % streams.length];
      progress[i] += dt * (0.5 + stream.intensity * 0.5);
      if (progress[i] > 1) progress[i] -= 1;

      const t = progress[i];
      const mid = new THREE.Vector3().lerpVectors(stream.from, stream.to, 0.5);
      mid.y += 2 + stream.intensity * 2;

      const p = quadraticBezier(stream.from, mid, stream.to, t);
      positions[i * 3] = p.x + Math.sin(clock.getElapsedTime() * 3 + i) * 0.05;
      positions[i * 3 + 1] = p.y + Math.cos(clock.getElapsedTime() * 2 + i) * 0.03;
      positions[i * 3 + 2] = p.z;

      const fade = Math.sin(t * Math.PI);
      colors[i * 3] = stream.color.r * fade;
      colors[i * 3 + 1] = stream.color.g * fade;
      colors[i * 3 + 2] = stream.color.b * fade;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (zoomLevel === "agent") return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
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

function hashSeed(n: number): number {
  let h = Math.imul(n, 2654435761);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  return Math.abs((h >>> 16) ^ h);
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
