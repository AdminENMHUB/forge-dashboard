"use client";

import dynamic from "next/dynamic";

const GalaxyScene = dynamic(() => import("@/components/galaxy/GalaxyScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#020408]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
        <p className="text-sm tracking-widest text-cyan-400/40 uppercase">
          Initializing Galaxy Map
        </p>
      </div>
    </div>
  ),
});

export default function ConstellationPage() {
  return <GalaxyScene />;
}
