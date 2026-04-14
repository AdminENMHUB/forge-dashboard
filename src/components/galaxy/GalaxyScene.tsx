"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense, useCallback, useMemo, useState } from "react";

import { useGalaxyData } from "./useGalaxyData";
import { computeSystemPositions } from "./layout";
import { GalacticCore } from "./GalacticCore";
import { AmbientStarField } from "./AmbientStarField";
import { SwarmSystem } from "./SwarmSystem";
import { SignalStreams } from "./SignalStreams";
import { HUD } from "./HUD";
import { SystemPanel } from "./SystemPanel";
import { AgentInspector } from "./AgentInspector";
import { CameraRig } from "./CameraRig";
import { BLOOM_PARAMS, SWARM_REGISTRY } from "./constants";
import type { ZoomLevel } from "./constants";

export default function GalaxyScene() {
  const data = useGalaxyData();
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("galaxy");
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const systemPositions = useMemo(
    () => computeSystemPositions(data.status?.swarms ?? undefined),
    [data.status?.swarms],
  );

  const bloomCfg = BLOOM_PARAMS[zoomLevel];

  const handleSelectSystem = useCallback((key: string) => {
    setSelectedSystem(key);
    setSelectedAgent(null);
    setZoomLevel("system");
  }, []);

  const handleSelectAgent = useCallback((name: string) => {
    setSelectedAgent(name);
    setZoomLevel("agent");
  }, []);

  const handleBack = useCallback(() => {
    if (zoomLevel === "agent") {
      setSelectedAgent(null);
      setZoomLevel("system");
    } else if (zoomLevel === "system") {
      setSelectedSystem(null);
      setZoomLevel("galaxy");
    }
  }, [zoomLevel]);

  const handleHome = useCallback(() => {
    setSelectedSystem(null);
    setSelectedAgent(null);
    setZoomLevel("galaxy");
  }, []);

  const selectedMeta = useMemo(
    () => SWARM_REGISTRY.find((s) => s.key === selectedSystem) ?? null,
    [selectedSystem],
  );

  const allAgents = data.scorecards?.agents;

  const swarmAgents = useMemo(() => {
    if (!selectedSystem || !allAgents) return [];
    return allAgents.filter((a) => a.swarm === selectedSystem || a.department === selectedSystem);
  }, [selectedSystem, allAgents]);

  const selectedAgentData = useMemo(
    () => allAgents?.find((a) => a.name === selectedAgent) ?? null,
    [selectedAgent, allAgents],
  );

  return (
    <div className="galaxy-container relative h-screen w-full overflow-hidden bg-[#020408]">
      <Canvas
        camera={{ position: [0, 22, 28], fov: 50, near: 0.1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#020408"]} />
        <fog attach="fog" args={["#020408", 60, 120]} />
        <ambientLight intensity={0.08} />

        <Suspense fallback={null}>
          <AmbientStarField />

          <GalacticCore health={data.health} empire={data.status?.empire ?? null} />

          {systemPositions.map((pos) => {
            const meta = SWARM_REGISTRY.find((s) => s.key === pos.key)!;
            const swarmData = data.status?.swarms?.[pos.key];
            const isSelected = selectedSystem === pos.key;
            return (
              <SwarmSystem
                key={pos.key}
                meta={meta}
                position={[pos.x, pos.y, pos.z]}
                size={pos.size}
                swarmData={swarmData ?? null}
                agents={swarmAgents}
                isSelected={isSelected}
                zoomLevel={zoomLevel}
                onSelect={handleSelectSystem}
                onSelectAgent={handleSelectAgent}
                selectedAgent={selectedAgent}
              />
            );
          })}

          <SignalStreams bus={data.bus} systemPositions={systemPositions} zoomLevel={zoomLevel} />

          <Preload all />
        </Suspense>

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={bloomCfg.intensity}
            luminanceThreshold={bloomCfg.luminanceThreshold}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.7} />
        </EffectComposer>

        <CameraRig
          zoomLevel={zoomLevel}
          selectedSystem={selectedSystem}
          systemPositions={systemPositions}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={80}
          maxPolarAngle={Math.PI * 0.85}
          zoomSpeed={0.8}
          rotateSpeed={0.5}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>

      <HUD
        data={data}
        zoomLevel={zoomLevel}
        selectedSystem={selectedMeta}
        selectedAgent={selectedAgentData}
        onBack={handleBack}
        onHome={handleHome}
        proposalCount={data.proposals?.pending_count ?? 0}
      />

      {zoomLevel === "system" && selectedSystem && (
        <SystemPanel
          systemKey={selectedSystem}
          meta={selectedMeta}
          swarmData={data.status?.swarms?.[selectedSystem] ?? null}
          agents={swarmAgents}
          activity={data.activity}
          financials={data.financials}
          onSelectAgent={handleSelectAgent}
          onClose={() => {
            setSelectedSystem(null);
            setZoomLevel("galaxy");
          }}
        />
      )}

      {zoomLevel === "agent" && selectedAgentData && (
        <AgentInspector
          agent={selectedAgentData}
          onClose={() => {
            setSelectedAgent(null);
            setZoomLevel("system");
          }}
        />
      )}
    </div>
  );
}
