"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { HealthResponse, EmpireData } from "@/types/empire";
import { HEALTH_COLORS } from "./constants";

interface Props {
  health: HealthResponse | null;
  empire: EmpireData | null;
}

export function GalacticCore({ health, empire }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const pulseSpeed = empire?.cycle_count ? 1.2 + (empire.cycle_count % 10) * 0.05 : 1.5;

  const healthRatio = useMemo(() => {
    if (!health?.services) return 1;
    const entries = Object.values(health.services);
    if (entries.length === 0) return 1;
    const up = entries.filter(
      (s) => s.status === "running" || s.status === "healthy" || s.status === "online",
    ).length;
    return up / entries.length;
  }, [health]);

  const coreColor = useMemo(() => {
    if (healthRatio >= 0.9) return HEALTH_COLORS.healthy;
    if (healthRatio >= 0.6) return HEALTH_COLORS.degraded;
    return HEALTH_COLORS.critical;
  }, [healthRatio]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.05;
      const scale = 1 + Math.sin(t * pulseSpeed) * 0.04;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      const pulse = 0.7 + Math.sin(t * 1.2) * 0.3;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.35;
      const gs = 2.4 + Math.sin(t * 0.8) * 0.3;
      glowRef.current.scale.setScalar(gs);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
      ringRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.25}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[2.8, 0.02, 16, 100]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.4} toneMapped={false} />
      </mesh>

      {/* Second ring */}
      <mesh rotation={[Math.PI * 0.3, Math.PI * 0.2, 0]}>
        <torusGeometry args={[3.5, 0.015, 16, 100]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.15} toneMapped={false} />
      </mesh>

      {/* Point light emanation */}
      <pointLight color={coreColor} intensity={8} distance={30} decay={2} />
      <pointLight color="#ffffff" intensity={1} distance={10} decay={2} />
    </group>
  );
}
