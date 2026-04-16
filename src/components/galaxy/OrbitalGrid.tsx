"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TIER_RADIUS } from "./constants";
import type { ZoomLevel } from "./constants";

interface Props {
  zoomLevel: ZoomLevel;
}

function createRingPoints(radius: number, segments: number = 128): Float32Array {
  const pts = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    pts[i * 3] = Math.cos(angle) * radius;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(angle) * radius;
  }
  return pts;
}

export function OrbitalGrid({ zoomLevel }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const tier1Ring = useMemo(() => createRingPoints(TIER_RADIUS[1]), []);
  const tier2Ring = useMemo(() => createRingPoints(TIER_RADIUS[2]), []);
  const midRing = useMemo(() => createRingPoints((TIER_RADIUS[1] + TIER_RADIUS[2]) / 2, 96), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const dist = camera.position.length();
    const fade = THREE.MathUtils.clamp((dist - 8) / 25, 0, 1);
    groupRef.current.visible = zoomLevel !== "agent" && fade > 0.01;
    if (groupRef.current.visible) {
      groupRef.current.children.forEach((child) => {
        const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
        if (mat?.opacity !== undefined) {
          mat.opacity = mat.userData.baseOpacity * fade;
        }
      });
    }
  });

  const makeLine = (
    key: string | number,
    positions: Float32Array,
    opacity: number,
    color: string = "#22d3ee",
  ) => {
    return (
      <line key={key} ref={undefined}>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          toneMapped={false}
          userData={{ baseOpacity: opacity }}
        />
      </line>
    );
  };

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      {makeLine("tier1", tier1Ring, 0.08, "#22d3ee")}
      {makeLine("tier2", tier2Ring, 0.06, "#22d3ee")}
      {makeLine("mid", midRing, 0.03, "#3b82f6")}
      {/* Radial spokes as individual segments */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const pts = new Float32Array([
          cos * 0.5,
          0,
          sin * 0.5,
          cos * (TIER_RADIUS[2] + 2),
          0,
          sin * (TIER_RADIUS[2] + 2),
        ]);
        return makeLine(`spoke-${i}`, pts, 0.025, "#525d73");
      })}
    </group>
  );
}
