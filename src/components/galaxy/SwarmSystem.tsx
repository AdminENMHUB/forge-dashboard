"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import type { SwarmData } from "@/types/empire";
import type { SwarmMeta, ZoomLevel } from "./constants";
import { HEALTH_COLORS, REGIME_COLORS } from "./constants";
import { AgentPlanet } from "./AgentPlanet";
import { computeAgentPositions } from "./layout";
import type { AgentScorecard, ActivityData } from "./useGalaxyData";

interface Props {
  meta: SwarmMeta;
  position: [number, number, number];
  size: number;
  swarmData: SwarmData | null;
  agents: AgentScorecard[];
  activity: ActivityData | null;
  isSelected: boolean;
  zoomLevel: ZoomLevel;
  onSelect: (key: string) => void;
  onSelectAgent: (name: string) => void;
  selectedAgent: string | null;
}

function createGlowSprite(): THREE.Texture {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.5)");
  g.addColorStop(0.3, "rgba(255,255,255,0.15)");
  g.addColorStop(0.6, "rgba(255,255,255,0.03)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

let _glowTex: THREE.Texture | null = null;
function getGlowTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  if (!_glowTex) _glowTex = createGlowSprite();
  return _glowTex;
}

function formatPnl(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function formatPortfolio(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function statusLabel(s: string | undefined): string {
  if (!s) return "OFFLINE";
  return s.toUpperCase();
}

export function SwarmSystem({
  meta,
  position,
  size,
  swarmData,
  agents,
  activity,
  isSelected,
  zoomLevel,
  onSelect,
  onSelectAgent,
  selectedAgent,
}: Props) {
  const starRef = useRef<THREE.Mesh>(null);
  const corona1Ref = useRef<THREE.Sprite>(null);
  const corona2Ref = useRef<THREE.Sprite>(null);
  const riskHaloRef = useRef<THREE.Mesh>(null);
  const regimeRingRef = useRef<THREE.Mesh>(null);
  const accretionRef = useRef<THREE.Mesh>(null);

  const status = swarmData?.status ?? "unknown";
  const starColor = useMemo(() => {
    if (status === "healthy" || status === "running" || status === "online") return meta.color;
    if (status === "degraded" || status === "halted") return HEALTH_COLORS.degraded;
    return HEALTH_COLORS.unknown;
  }, [status, meta.color]);

  const agentPositions = useMemo(() => computeAgentPositions(meta.key, agents), [meta.key, agents]);
  const showAgents = zoomLevel === "system" && isSelected;
  const showDataLabels = zoomLevel === "galaxy";
  const glowTex = useMemo(() => getGlowTexture(), []);

  const isCircuitBreakerActive = !!(swarmData as unknown as Record<string, unknown>)
    ?.circuit_breaker;
  const regime = (swarmData as unknown as Record<string, unknown>)?.regime as string | undefined;
  const isTradeBot = meta.key === "EganTradeBot";
  const regimeColor = useMemo(() => {
    if (!regime) return null;
    const lower = regime.toLowerCase();
    if (lower.includes("bull")) return REGIME_COLORS.bull;
    if (lower.includes("bear")) return REGIME_COLORS.bear;
    return REGIME_COLORS.range;
  }, [regime]);

  const portfolioValue = swarmData?.portfolio_value ?? 0;
  const accretionOpacity = useMemo(
    () => Math.min(0.25, Math.log10(Math.max(portfolioValue, 1)) * 0.05),
    [portfolioValue],
  );

  const pnlValue = swarmData?.daily_pnl ?? 0;
  const pnlColor = pnlValue >= 0 ? "#10b981" : "#ef4444";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (starRef.current) {
      starRef.current.rotation.y = t * 0.12;
      const pulse = 1 + Math.sin(t * 2 + meta.angle) * 0.06;
      starRef.current.scale.setScalar(size * pulse);
    }

    if (corona1Ref.current) {
      const s1 = size * 2.5 * (1 + Math.sin(t * 1.3 + meta.angle) * 0.06);
      corona1Ref.current.scale.set(s1, s1, 1);
      corona1Ref.current.material.opacity = 0.12 + Math.sin(t * 1.5) * 0.04;
    }
    if (corona2Ref.current) {
      const s2 = size * 3.8 * (1 + Math.sin(t * 0.9 + meta.angle + 1) * 0.05);
      corona2Ref.current.scale.set(s2, s2, 1);
      corona2Ref.current.material.opacity = 0.06 + Math.sin(t * 1.1 + 0.5) * 0.02;
    }

    if (riskHaloRef.current) {
      if (isCircuitBreakerActive) {
        riskHaloRef.current.visible = true;
        const strobe = Math.sin(t * 6) * 0.5 + 0.5;
        (riskHaloRef.current.material as THREE.MeshBasicMaterial).opacity = strobe * 0.5;
        (riskHaloRef.current.material as THREE.MeshBasicMaterial).color = HEALTH_COLORS.critical;
      } else if (status === "degraded" || status === "halted") {
        riskHaloRef.current.visible = true;
        const pulse = Math.sin(t * 2) * 0.3 + 0.3;
        (riskHaloRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.3;
        (riskHaloRef.current.material as THREE.MeshBasicMaterial).color = HEALTH_COLORS.degraded;
      } else {
        riskHaloRef.current.visible = false;
      }
    }

    if (regimeRingRef.current && regimeColor) {
      regimeRingRef.current.visible = true;
      regimeRingRef.current.rotation.z = t * 0.2;
      const tiltAngle = regime?.toLowerCase().includes("bull")
        ? -0.3
        : regime?.toLowerCase().includes("bear")
          ? 0.3
          : 0;
      regimeRingRef.current.rotation.x = Math.PI * 0.5 + tiltAngle;
      (regimeRingRef.current.material as THREE.MeshBasicMaterial).color = regimeColor;
    } else if (regimeRingRef.current) {
      regimeRingRef.current.visible = false;
    }

    if (accretionRef.current) {
      accretionRef.current.rotation.z = t * 0.08;
    }
  });

  const handleClick = (e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(meta.key);
  };

  return (
    <group position={position}>
      {/* Star core */}
      <mesh ref={starRef} onClick={handleClick} scale={size}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={3.5}
          roughness={0.15}
          metalness={0.7}
          toneMapped={false}
        />
      </mesh>

      {/* Corona glow layers */}
      {glowTex && (
        <>
          <sprite ref={corona1Ref} scale={[size * 2.5, size * 2.5, 1]}>
            <spriteMaterial
              map={glowTex}
              color={starColor}
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <sprite ref={corona2Ref} scale={[size * 3.8, size * 3.8, 1]}>
            <spriteMaterial
              map={glowTex}
              color={starColor}
              transparent
              opacity={0.06}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </>
      )}

      {/* Accretion ring (portfolio-scaled) */}
      <mesh ref={accretionRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[size * 2.0, size * 0.15, 16, 64]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={accretionOpacity}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Risk halo (circuit breaker / degraded) */}
      <mesh ref={riskHaloRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[size * 2.8, size * 0.06, 8, 48]} />
        <meshBasicMaterial
          color={HEALTH_COLORS.critical}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Regime indicator ring (TradeBot-specific) */}
      {isTradeBot && (
        <mesh ref={regimeRingRef} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[size * 2.4, 0.03, 16, 64]} />
          <meshBasicMaterial
            color={regimeColor ?? HEALTH_COLORS.unknown}
            transparent
            opacity={0.5}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Point light */}
      <pointLight
        color={starColor}
        intensity={isSelected ? 8 : 4}
        distance={isSelected ? 30 : 16}
        decay={2}
      />

      {/* Label */}
      <Float speed={0.8} rotationIntensity={0} floatIntensity={0.3}>
        <Text
          position={[0, size + 0.9, 0]}
          fontSize={0.48}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.025}
          outlineColor="#000000"
          characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .&$+-|/"
        >
          {meta.label}
        </Text>
      </Float>

      {/* Data labels (galaxy zoom only) */}
      {showDataLabels && (
        <>
          <Text
            position={[0, size + 0.35, 0]}
            fontSize={0.3}
            color={pnlColor}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.015}
            outlineColor="#000000"
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .&$+-|/"
          >
            {formatPnl(pnlValue)}
          </Text>
          <Text
            position={[0, size - 0.05, 0]}
            fontSize={0.22}
            color="#ffffff80"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#000000"
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .&$+-|/KHEALTYDGRNOW"
          >
            {`${formatPortfolio(portfolioValue)} | ${statusLabel(swarmData?.status)}`}
          </Text>
          {isTradeBot && regime && (
            <Text
              position={[0, size - 0.35, 0]}
              fontSize={0.2}
              color={regimeColor ? `#${regimeColor.getHexString()}` : "#525d73"}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.01}
              outlineColor="#000000"
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ "
            >
              {regime.toUpperCase()}
            </Text>
          )}
        </>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[size * 2.6, 0.025, 16, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      )}

      {/* Agent planets (system zoom) */}
      {showAgents &&
        agentPositions.map((ap, i) => (
          <AgentPlanet
            key={ap.name}
            agent={agents[i]}
            activity={activity}
            position={ap}
            isSelected={selectedAgent === ap.name}
            onSelect={onSelectAgent}
          />
        ))}
    </group>
  );
}
