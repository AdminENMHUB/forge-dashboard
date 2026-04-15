"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html, Edges } from "@react-three/drei";
import * as THREE from "three";
import type { AgentScorecard, ActivityData } from "./useGalaxyData";
import type { AgentPosition } from "./layout";

interface Props {
  agent: AgentScorecard;
  activity: ActivityData | null;
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

function createErrorGlowTex(): THREE.Texture {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(239,68,68,0.4)");
  g.addColorStop(0.4, "rgba(239,68,68,0.1)");
  g.addColorStop(1, "rgba(239,68,68,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

let _errTex: THREE.Texture | null = null;
function getErrorTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  if (!_errTex) _errTex = createErrorGlowTex();
  return _errTex;
}

export function AgentPlanet({ agent, activity, position, isSelected, onSelect }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const errorSpriteRef = useRef<THREE.Sprite>(null);
  const pdpMoonRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const tier = ratingToTier(agent.rating);
  const planetColor = PILLAR_COLORS[tier] ?? PILLAR_COLORS.average;
  const errorTex = useMemo(() => getErrorTexture(), []);

  const hasHighError = (agent.error_rate ?? 0) > 0.05;
  const errorIntensity = Math.min((agent.error_rate ?? 0) / 0.15, 1);
  const hasPdp = agent.pdp?.active ?? false;

  const isRecentlyActive = useMemo(() => {
    if (!activity?.events) return false;
    const agentLower = agent.name.toLowerCase();
    return activity.events.some(
      (e) =>
        e.agent?.toLowerCase().includes(agentLower) ||
        e.message?.toLowerCase().includes(agentLower),
    );
  }, [activity, agent.name]);

  const ringThickness = useMemo(() => {
    const cost = agent.cost_daily ?? 0.05;
    return Math.max(0.006, Math.min(0.025, cost * 0.05));
  }, [agent.cost_daily]);

  const autonomyRings =
    agent.autonomy_level === "full" ? 3 : agent.autonomy_level === "high" ? 2 : 1;

  const lastAction = useMemo(() => {
    if (!activity?.events) return null;
    const agentLower = agent.name.toLowerCase();
    return (
      activity.events.find(
        (e) =>
          e.agent?.toLowerCase().includes(agentLower) ||
          e.message?.toLowerCase().includes(agentLower),
      ) ?? null
    );
  }, [activity, agent.name]);

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
      const baseIntensity = isSelected ? 2.5 : 1.2;
      const shimmerSpeed = isRecentlyActive ? 8 : 2;
      const shimmer = baseIntensity + Math.sin(t * shimmerSpeed) * (isRecentlyActive ? 0.8 : 0.2);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = shimmer;
    }

    if (errorSpriteRef.current) {
      if (hasHighError) {
        errorSpriteRef.current.visible = true;
        const pulse = 0.8 + Math.sin(t * 4) * 0.2;
        const s = position.size * 3 * errorIntensity * pulse;
        errorSpriteRef.current.scale.set(s, s, 1);
        errorSpriteRef.current.material.opacity = 0.15 + errorIntensity * 0.3;
      } else {
        errorSpriteRef.current.visible = false;
      }
    }

    if (pdpMoonRef.current && hasPdp) {
      const moonAngle = t * 1.5;
      const moonR = position.size * 2;
      pdpMoonRef.current.position.x = Math.cos(moonAngle) * moonR;
      pdpMoonRef.current.position.y = Math.sin(moonAngle) * moonR * 0.5;
      pdpMoonRef.current.position.z = Math.sin(moonAngle) * moonR;
    }
  });

  const handleClick = (e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(agent.name);
  };

  return (
    <group ref={groupRef}>
      {/* Planet core with wireframe edges */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        scale={position.size}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={planetColor}
          emissive={planetColor}
          emissiveIntensity={isSelected ? 2.5 : 1.2}
          roughness={0.35}
          metalness={0.6}
          toneMapped={false}
        />
        <Edges threshold={15} color={planetColor} scale={1.001} linewidth={0.5} />
      </mesh>

      {/* Error rate halo */}
      {errorTex && (
        <sprite ref={errorSpriteRef} scale={[0, 0, 1]}>
          <spriteMaterial
            map={errorTex}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      )}

      {/* Autonomy rings (cost-scaled thickness) */}
      {Array.from({ length: autonomyRings }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI * 0.5 + i * 0.3, i * 0.4, 0]} scale={position.size}>
          <torusGeometry args={[1.4 + i * 0.25, ringThickness, 8, 48]} />
          <meshBasicMaterial
            color={planetColor}
            transparent
            opacity={0.35 - i * 0.08}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* PDP moon (amber orbiting dot) */}
      {hasPdp && (
        <mesh ref={pdpMoonRef} scale={position.size * 0.2}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#f59e0b" toneMapped={false} />
        </mesh>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[Math.PI * 0.5, 0, 0]} scale={position.size}>
          <torusGeometry args={[1.8, 0.03, 16, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, position.size + 0.4, 0]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.012}
        outlineColor="#000000"
        maxWidth={3.5}
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_- .&$"
      >
        {agent.name.replace(/_/g, " ")}
      </Text>

      <pointLight
        color={planetColor}
        intensity={isSelected ? 2.5 : hovered ? 1.5 : 0.5}
        distance={4}
        decay={2}
      />

      {/* Hover tooltip via Html overlay */}
      {hovered && !isSelected && (
        <Html
          position={[0, position.size + 1.2, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div className="w-44 rounded-xl border border-white/10 bg-[#0a0e1a]/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <p className="text-[11px] font-bold text-white">{agent.name.replace(/_/g, " ")}</p>
            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
              {agent.rating && (
                <span
                  className={`font-semibold ${
                    agent.rating >= 4
                      ? "text-emerald-400"
                      : agent.rating >= 3
                        ? "text-cyan-400"
                        : "text-amber-400"
                  }`}
                >
                  {agent.rating.toFixed(1)} ★
                </span>
              )}
              {agent.autonomy_level && (
                <span className="text-white/40 capitalize">{agent.autonomy_level}</span>
              )}
            </div>
            {lastAction && (
              <p className="mt-1 truncate text-[9px] text-white/50">
                {lastAction.message ?? lastAction.type}
              </p>
            )}
            <div className="mt-1.5 flex gap-3 text-[9px] text-white/40">
              {agent.error_rate !== undefined && (
                <span className={agent.error_rate > 0.05 ? "text-red-400" : ""}>
                  Err: {(agent.error_rate * 100).toFixed(1)}%
                </span>
              )}
              {agent.cost_daily !== undefined && <span>${agent.cost_daily.toFixed(2)}/d</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
