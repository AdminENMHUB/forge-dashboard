"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import type * as THREE from "three";

export function AmbientStarField() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.003;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.001) * 0.02;
    }
  });

  return (
    <group ref={ref}>
      <Stars radius={80} depth={100} count={6000} factor={3} saturation={0.1} fade speed={0.3} />
    </group>
  );
}
