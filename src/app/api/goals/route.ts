import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  available: false,
  source: "fallback",
  revenue_targets: {
    aug_2026: { target: 0, current: 0, label: "" },
    eoy_2026: { target: 0, current: 0, label: "" },
  },
  swarm_targets: [],
  okr_hierarchy: {
    company: {
      objective: "",
      progress: 0,
      key_results: [],
    },
    departments: [],
  },
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/goals`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
