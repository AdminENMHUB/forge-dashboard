"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ZoomLevel } from "./constants";
import { CAMERA_POSITIONS } from "./constants";
import type { SystemPosition } from "./layout";

interface Props {
  zoomLevel: ZoomLevel;
  selectedSystem: string | null;
  systemPositions: SystemPosition[];
}

export function CameraRig({ zoomLevel, selectedSystem, systemPositions }: Props) {
  const { camera } = useThree();
  const prevZoom = useRef<ZoomLevel>("galaxy");
  const prevSystem = useRef<string | null>(null);

  useEffect(() => {
    if (prevZoom.current === zoomLevel && prevSystem.current === selectedSystem) return;
    prevZoom.current = zoomLevel;
    prevSystem.current = selectedSystem;

    let targetPos: THREE.Vector3;
    let targetLook: THREE.Vector3;

    if (zoomLevel === "galaxy") {
      targetPos = new THREE.Vector3(...CAMERA_POSITIONS.galaxy.position);
      targetLook = new THREE.Vector3(...CAMERA_POSITIONS.galaxy.target);
    } else if (zoomLevel === "system" && selectedSystem) {
      const sys = systemPositions.find((s) => s.key === selectedSystem);
      if (!sys) return;
      targetPos = new THREE.Vector3(
        sys.x + 2,
        sys.y + CAMERA_POSITIONS.systemOffset.y,
        sys.z + CAMERA_POSITIONS.systemOffset.z,
      );
      targetLook = new THREE.Vector3(sys.x, sys.y, sys.z);
    } else if (zoomLevel === "agent" && selectedSystem) {
      const sys = systemPositions.find((s) => s.key === selectedSystem);
      if (!sys) return;
      targetPos = new THREE.Vector3(
        sys.x + 1.5,
        sys.y + CAMERA_POSITIONS.agentOffset.y,
        sys.z + CAMERA_POSITIONS.agentOffset.z,
      );
      targetLook = new THREE.Vector3(sys.x, sys.y, sys.z);
    } else {
      return;
    }

    animateCamera(camera, targetPos, targetLook);
  }, [zoomLevel, selectedSystem, systemPositions, camera]);

  return null;
}

function animateCamera(camera: THREE.Camera, targetPos: THREE.Vector3, targetLook: THREE.Vector3) {
  const startPos = camera.position.clone();
  const startTime = performance.now();
  const duration = 1200;

  const lookDir = new THREE.Vector3();
  camera.getWorldDirection(lookDir);
  const startLook = startPos.clone().add(lookDir.multiplyScalar(10));

  function step() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPos, targetPos, ease);

    const currentLook = new THREE.Vector3().lerpVectors(startLook, targetLook, ease);
    camera.lookAt(currentLook);

    if (t < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
