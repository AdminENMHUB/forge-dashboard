"use client";

import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import type { HealthResponse, EmpireData } from "@/types/empire";
import { HEALTH_COLORS } from "./constants";

const PLASMA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLASMA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uHealthRatio;
  varying vec2 vUv;
  varying vec3 vNormal;

  // simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = vec3(vUv * 4.0, uTime * 0.3);
    float n1 = snoise(pos) * 0.5 + 0.5;
    float n2 = snoise(pos * 2.0 + vec3(100.0)) * 0.5 + 0.5;
    float n3 = snoise(pos * 4.0 + vec3(200.0)) * 0.5 + 0.5;
    float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    vec3 hotColor = vec3(1.0, 1.0, 1.0);
    vec3 midColor = uColor * 1.5;
    vec3 baseColor = uColor * 0.6;

    vec3 surfaceColor = mix(baseColor, midColor, combined);
    surfaceColor = mix(surfaceColor, hotColor, pow(combined, 3.0) * 0.6);

    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    surfaceColor += uColor * fresnel * 0.5;

    float pulse = 0.85 + sin(uTime * 2.0) * 0.15;
    surfaceColor *= pulse;

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

const DISK_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    float ring = smoothstep(0.15, 0.2, dist) * smoothstep(0.5, 0.4, dist);
    float bands = sin(angle * 8.0 + uTime * 1.5 + dist * 20.0) * 0.5 + 0.5;
    bands = mix(0.3, 1.0, bands);

    float hotspot = sin(angle * 3.0 - uTime * 0.8) * 0.5 + 0.5;
    hotspot = pow(hotspot, 3.0);

    vec3 color = mix(uColor, vec3(1.0), hotspot * 0.4);
    float alpha = ring * bands * 0.35;
    alpha *= 1.0 - smoothstep(0.35, 0.48, dist);

    gl_FragColor = vec4(color, alpha);
  }
`;

class PlasmaShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: PLASMA_VERTEX,
      fragmentShader: PLASMA_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#22d3ee") },
        uHealthRatio: { value: 1.0 },
      },
      toneMapped: false,
    });
  }
}

class DiskShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: DISK_VERTEX,
      fragmentShader: DISK_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#22d3ee") },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
  }
}

extend({ PlasmaShaderMaterial, DiskShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    plasmaShaderMaterial: object;
    diskShaderMaterial: object;
  }
}

function createGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.6)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.2)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.05)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface Props {
  health: HealthResponse | null;
  empire: EmpireData | null;
}

export function GalacticCore({ health, empire }: Props) {
  const plasmaRef = useRef<THREE.ShaderMaterial>(null);
  const diskRef = useRef<THREE.ShaderMaterial>(null);
  const coronaRefs = useRef<THREE.Sprite[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const jet1Ref = useRef<THREE.Mesh>(null);
  const jet2Ref = useRef<THREE.Mesh>(null);

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

  const glowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createGlowTexture();
  }, []);

  const coronaScales = [3.5, 5.0, 7.0, 9.0];
  const coronaOpacities = [0.12, 0.08, 0.04, 0.02];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (plasmaRef.current) {
      plasmaRef.current.uniforms.uTime.value = t;
      plasmaRef.current.uniforms.uColor.value = coreColor;
      plasmaRef.current.uniforms.uHealthRatio.value = healthRatio;
    }

    if (diskRef.current) {
      diskRef.current.uniforms.uTime.value = t;
      diskRef.current.uniforms.uColor.value = coreColor;
    }

    coronaRefs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const breathe = 1 + Math.sin(t * (0.8 + i * 0.2)) * 0.08;
      const s = coronaScales[i] * breathe;
      sprite.scale.set(s, s, 1);
      sprite.material.opacity = coronaOpacities[i] * (0.8 + Math.sin(t * 1.2 + i) * 0.2);
    });

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
      ringRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t * 0.3) * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.1;
      ring2Ref.current.rotation.x = Math.PI * 0.35 + Math.cos(t * 0.25) * 0.08;
    }

    const showJets = healthRatio >= 0.9;
    if (jet1Ref.current) {
      jet1Ref.current.visible = showJets;
      if (showJets) {
        const jScale = 0.8 + Math.sin(t * pulseSpeed * 2) * 0.2;
        jet1Ref.current.scale.set(0.3, jScale * 3, 0.3);
        (jet1Ref.current.material as THREE.MeshBasicMaterial).opacity =
          0.15 + Math.sin(t * 3) * 0.05;
      }
    }
    if (jet2Ref.current) {
      jet2Ref.current.visible = showJets;
      if (showJets) {
        const jScale = 0.8 + Math.sin(t * pulseSpeed * 2 + Math.PI) * 0.2;
        jet2Ref.current.scale.set(0.3, jScale * 3, 0.3);
        (jet2Ref.current.material as THREE.MeshBasicMaterial).opacity =
          0.15 + Math.sin(t * 3 + Math.PI) * 0.05;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Plasma core sphere */}
      <mesh>
        <sphereGeometry args={[1.0, 64, 64]} />
        <plasmaShaderMaterial ref={plasmaRef} />
      </mesh>

      {/* Accretion disk */}
      <mesh rotation={[Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[8, 8, 1, 1]} />
        <diskShaderMaterial ref={diskRef} />
      </mesh>

      {/* Corona glow layers */}
      {glowTexture &&
        coronaScales.map((s, i) => (
          <sprite
            key={i}
            ref={(el: THREE.Sprite | null) => {
              if (el) coronaRefs.current[i] = el;
            }}
            scale={[s, s, 1]}
          >
            <spriteMaterial
              map={glowTexture}
              color={coreColor}
              transparent
              opacity={coronaOpacities[i]}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}

      {/* Orbital ring 1 */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[2.8, 0.025, 16, 100]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Orbital ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI * 0.3, Math.PI * 0.2, 0]}>
        <torusGeometry args={[3.5, 0.018, 16, 100]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.2} toneMapped={false} />
      </mesh>

      {/* Energy jet (top) */}
      <mesh ref={jet1Ref} position={[0, 2.5, 0]}>
        <coneGeometry args={[0.3, 3, 12, 1, true]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Energy jet (bottom) */}
      <mesh ref={jet2Ref} position={[0, -2.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 3, 12, 1, true]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Point light emanation */}
      <pointLight color={coreColor} intensity={10} distance={35} decay={2} />
      <pointLight color="#ffffff" intensity={1.5} distance={12} decay={2} />
    </group>
  );
}
