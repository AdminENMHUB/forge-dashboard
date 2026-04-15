"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SWARM_REGISTRY, EVENT_FLASH_COLORS } from "./constants";
import type { ActivityEvent } from "./useGalaxyData";
import type { SystemPosition } from "./layout";
import type { ZoomLevel } from "./constants";

interface FlashInstance {
  id: string;
  swarmKey: string;
  position: [number, number, number];
  color: THREE.Color;
  startTime: number;
  duration: number;
}

interface Props {
  events: ActivityEvent[] | undefined;
  systemPositions: SystemPosition[];
  zoomLevel: ZoomLevel;
}

const MAX_FLASHES_PER_SWARM = 3;
const FLASH_DURATION = 1000;

function classifyEvent(type: string | undefined): string {
  if (!type) return "signal";
  const t = type.toLowerCase();
  if (t.includes("trade") || t.includes("buy") || t.includes("sell") || t.includes("position"))
    return "trade";
  if (t.includes("signal") || t.includes("dispatch") || t.includes("deliver")) return "signal";
  if (t.includes("proposal") || t.includes("approve") || t.includes("reject")) return "proposal";
  if (t.includes("error") || t.includes("fail") || t.includes("crash")) return "error";
  return "signal";
}

function findSwarmPosition(
  event: ActivityEvent,
  positions: SystemPosition[],
): SystemPosition | null {
  const hint = (
    event.swarm ??
    event.agent ??
    ((event as Record<string, unknown>).source as string) ??
    ""
  ).toLowerCase();
  if (!hint) return null;
  return (
    positions.find((p) => {
      const meta = SWARM_REGISTRY.find((s) => s.key === p.key);
      return (
        p.key.toLowerCase().includes(hint) ||
        hint.includes(p.key.toLowerCase()) ||
        meta?.label.toLowerCase().includes(hint)
      );
    }) ?? null
  );
}

export function LiveEventFlash({ events, systemPositions, zoomLevel }: Props) {
  const [flashes, setFlashes] = useState<FlashInstance[]>([]);
  const seenRef = useRef(new Set<string>());
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  const addFlash = useCallback(
    (event: ActivityEvent) => {
      const pos = findSwarmPosition(event, systemPositions);
      if (!pos) return;

      const eventType = classifyEvent(event.type);
      const color = EVENT_FLASH_COLORS[eventType] ?? EVENT_FLASH_COLORS.signal;

      setFlashes((prev) => {
        const swarmFlashes = prev.filter((f) => f.swarmKey === pos.key);
        let updated = [...prev];
        if (swarmFlashes.length >= MAX_FLASHES_PER_SWARM) {
          const oldest = swarmFlashes[0];
          updated = updated.filter((f) => f.id !== oldest.id);
        }
        updated.push({
          id: event.id ?? `${Date.now()}-${Math.random()}`,
          swarmKey: pos.key,
          position: [pos.x, pos.y, pos.z],
          color,
          startTime: performance.now(),
          duration: FLASH_DURATION,
        });
        return updated;
      });
    },
    [systemPositions],
  );

  useEffect(() => {
    if (!events || events.length === 0) return;
    const newEvents = events.filter((e) => {
      const key = e.id ?? `${e.type}-${e.ts}`;
      if (seenRef.current.has(key)) return false;
      seenRef.current.add(key);
      return true;
    });
    if (seenRef.current.size > 200) {
      const arr = Array.from(seenRef.current);
      seenRef.current = new Set(arr.slice(-100));
    }
    newEvents.slice(-3).forEach(addFlash);
  }, [events, addFlash]);

  useFrame(() => {
    const now = performance.now();
    let expired = false;

    flashes.forEach((flash) => {
      const mesh = meshRefs.current.get(flash.id);
      if (!mesh) return;

      const elapsed = now - flash.startTime;
      const t = Math.min(elapsed / flash.duration, 1);

      if (t >= 1) {
        mesh.visible = false;
        expired = true;
        return;
      }

      const ease = 1 - Math.pow(1 - t, 3);
      const scale = 1 + ease * 4;
      mesh.scale.setScalar(scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5;
      mesh.visible = true;
    });

    if (expired) {
      setFlashes((prev) => prev.filter((f) => performance.now() - f.startTime < f.duration));
    }
  });

  if (zoomLevel === "agent") return null;

  return (
    <group>
      {flashes.map((flash) => (
        <mesh
          key={flash.id}
          ref={(el: THREE.Mesh | null) => {
            if (el) meshRefs.current.set(flash.id, el);
            else meshRefs.current.delete(flash.id);
          }}
          position={flash.position}
          rotation={[Math.PI * 0.5, 0, 0]}
        >
          <torusGeometry args={[1, 0.04, 8, 48]} />
          <meshBasicMaterial
            color={flash.color}
            transparent
            opacity={0.5}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
