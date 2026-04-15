"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { NEBULA_COLORS } from "./constants";

interface NebulaConfig {
  position: [number, number, number];
  scale: number;
  color: THREE.Color;
  opacity: number;
  rotSpeed: number;
  driftSpeed: number;
  phase: number;
}

function createNebulaTexture(color: THREE.Color): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const hex = `#${color.getHexString()}`;
  gradient.addColorStop(0, hex + "40");
  gradient.addColorStop(0.3, hex + "20");
  gradient.addColorStop(0.6, hex + "0a");
  gradient.addColorStop(1, hex + "00");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.7;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const sr = 2 + Math.random() * 8;
    const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    g2.addColorStop(0, hex + "18");
    g2.addColorStop(1, hex + "00");
    ctx.fillStyle = g2;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function hashFloat(seed: number): number {
  let h = Math.imul(seed, 2654435761);
  h = Math.imul((h >>> 16) ^ h, 0x45d9f3b);
  return Math.abs(((h >>> 16) ^ h) >>> 0) / 4294967296;
}

export function AmbientStarField() {
  const starsRef = useRef<THREE.Group>(null);
  const nebulaRefs = useRef<THREE.Sprite[]>([]);

  const nebulae = useMemo<NebulaConfig[]>(() => {
    const configs: NebulaConfig[] = [];
    for (let i = 0; i < 10; i++) {
      const colorIdx = i % NEBULA_COLORS.length;
      const angle = hashFloat(i * 37) * Math.PI * 2;
      const dist = 30 + hashFloat(i * 73) * 50;
      const zDepth = -40 - hashFloat(i * 91) * 40;

      configs.push({
        position: [Math.cos(angle) * dist, (hashFloat(i * 53) - 0.5) * 20, zDepth],
        scale: 12 + hashFloat(i * 17) * 20,
        color: NEBULA_COLORS[colorIdx],
        opacity: 0.03 + hashFloat(i * 29) * 0.05,
        rotSpeed: (hashFloat(i * 41) - 0.5) * 0.002,
        driftSpeed: 0.001 + hashFloat(i * 61) * 0.003,
        phase: hashFloat(i * 83) * Math.PI * 2,
      });
    }
    return configs;
  }, []);

  const nebulaTextures = useMemo(() => {
    if (typeof document === "undefined") return [];
    return nebulae.map((n) => createNebulaTexture(n.color));
  }, [nebulae]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (starsRef.current) {
      starsRef.current.rotation.y = t * 0.003;
      starsRef.current.rotation.x = Math.sin(t * 0.001) * 0.02;
    }

    nebulaRefs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const cfg = nebulae[i];
      sprite.material.rotation = t * cfg.rotSpeed + cfg.phase;
      sprite.position.x = cfg.position[0] + Math.sin(t * cfg.driftSpeed + cfg.phase) * 2;
      sprite.position.y = cfg.position[1] + Math.cos(t * cfg.driftSpeed * 0.7 + cfg.phase) * 1.5;
    });
  });

  return (
    <group>
      {/* Layer 1: Point stars with subtle color */}
      <group ref={starsRef}>
        <Stars radius={80} depth={100} count={4000} factor={3} saturation={0.1} fade speed={0.3} />
        <Stars radius={60} depth={80} count={2000} factor={2} saturation={0.4} fade speed={0.15} />
      </group>

      {/* Layer 2: Nebula cloud sprites */}
      {nebulaTextures.length > 0 &&
        nebulae.map((cfg, i) => (
          <sprite
            key={i}
            ref={(el: THREE.Sprite | null) => {
              if (el) nebulaRefs.current[i] = el;
            }}
            position={cfg.position}
            scale={[cfg.scale, cfg.scale, 1]}
          >
            <spriteMaterial
              map={nebulaTextures[i]}
              transparent
              opacity={cfg.opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}
    </group>
  );
}
