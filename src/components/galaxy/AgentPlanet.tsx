"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { AgentScorecard } from "./useGalaxyData";
import type { AgentPosition } from "./layout";

interface Props {
  agent: AgentScorecard;
  position: AgentPosition;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

const PILLAR_COLORS: Record<string, THREE.Color> = {
  top: new THREE.Color("#10b981"),
  good: new THREE.Color("#22d3ee"),
  average: new THREE.Color("#3b82f6"),
  pdp: new THREE.Color("#f59e0b"),
  struggling: new THREE.Color("#ef4444"),
};

function ratingToTier(rating: number | undefined): string {
  if (!rating) return "average";
  if (rating >= 4.5) return "top";
  if (rating >= 3.5) return "good";
  if (rating >= 2.5) return "average";
  if (rating >= 1.5) return "pdp";
  return "struggling";
}

export function AgentPlanet({ agent, position, isSelected, onSelect }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const tier = ratingToTier(agent.rating);
  const planetColor = PILLAR_COLORS[tier] ?? PILLAR_COLORS.average;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const angle = position.orbitPhase + t * position.orbitSpeed;
      groupRef.current.position.x = Math.cos(angle) * position.orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * position.orbitRadius;
      groupRef.current.position.y = position.y + Math.sin(t * 0.5 + position.orbitPhase) * 0.15;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
    }
  });

  const handleClick = (e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(agent.name);
  };

  const autonomyRings =
    agent.autonomy_level === "full" ? 3 : agent.autonomy_level === "high" ? 2 : 1;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} onClick={handleClick} scale={position.size}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={planetColor}
          emissive={planetColor}
          emissiveIntensity={isSelected ? 2.5 : 1.2}
          roughness={0.4}
          metalness={0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Autonomy rings */}
      {Array.from({ length: autonomyRings }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI * 0.5 + i * 0.3, i * 0.4, 0]} scale={position.size}>
          <torusGeometry args={[1.4 + i * 0.25, 0.008, 8, 48]} />
          <meshBasicMaterial
            color={planetColor}
            transparent
            opacity={0.3 - i * 0.08}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[Math.PI * 0.5, 0, 0]} scale={position.size}>
          <torusGeometry args={[1.8, 0.025, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, position.size + 0.35, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
        maxWidth={3}
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_- .&$"
      >
        {agent.name.replace(/_/g, " ")}
      </Text>

      <pointLight color={planetColor} intensity={isSelected ? 2 : 0.5} distance={4} decay={2} />
    </group>
  );
}
