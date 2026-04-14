"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import type { SwarmData } from "@/types/empire";
import type { SwarmMeta, ZoomLevel } from "./constants";
import { HEALTH_COLORS } from "./constants";
import { AgentPlanet } from "./AgentPlanet";
import { computeAgentPositions } from "./layout";
import type { AgentScorecard } from "./useGalaxyData";

interface Props {
  meta: SwarmMeta;
  position: [number, number, number];
  size: number;
  swarmData: SwarmData | null;
  agents: AgentScorecard[];
  isSelected: boolean;
  zoomLevel: ZoomLevel;
  onSelect: (key: string) => void;
  onSelectAgent: (name: string) => void;
  selectedAgent: string | null;
}

export function SwarmSystem({
  meta,
  position,
  size,
  swarmData,
  agents,
  isSelected,
  zoomLevel,
  onSelect,
  onSelectAgent,
  selectedAgent,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const status = swarmData?.status ?? "unknown";
  const starColor = useMemo(() => {
    if (status === "healthy" || status === "running" || status === "online") return meta.color;
    if (status === "degraded" || status === "halted") return HEALTH_COLORS.degraded;
    return HEALTH_COLORS.unknown;
  }, [status, meta.color]);

  const agentPositions = useMemo(() => computeAgentPositions(meta.key, agents), [meta.key, agents]);

  const showAgents = zoomLevel === "system" && isSelected;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.1;
      const pulse = 1 + Math.sin(t * 2 + meta.angle) * 0.06;
      starRef.current.scale.setScalar(size * pulse);
    }
    if (glowRef.current) {
      const gp = 0.5 + Math.sin(t * 1.5 + meta.angle) * 0.2;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = gp;
    }
  });

  const handleClick = (e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(meta.key);
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Star core */}
      <mesh ref={starRef} onClick={handleClick} scale={size}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={3}
          roughness={0.2}
          metalness={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} scale={size * 2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        color={starColor}
        intensity={isSelected ? 6 : 3}
        distance={isSelected ? 25 : 12}
        decay={2}
      />

      {/* Label */}
      <Float speed={0.8} rotationIntensity={0} floatIntensity={0.3}>
        <Text
          position={[0, size + 0.8, 0]}
          fontSize={0.45}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
          characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .&$"
        >
          {meta.label}
        </Text>
      </Float>

      {/* Orbital ring (faint) */}
      <mesh rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[size * 1.8, 0.008, 8, 64]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={isSelected ? 0.4 : 0.12}
          toneMapped={false}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[size * 2.2, 0.02, 16, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      )}

      {/* Agent planets (only visible when system is selected) */}
      {showAgents &&
        agentPositions.map((ap, i) => (
          <AgentPlanet
            key={ap.name}
            agent={agents[i]}
            position={ap}
            isSelected={selectedAgent === ap.name}
            onSelect={onSelectAgent}
          />
        ))}
    </group>
  );
}
