import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  kpi: {
    products_created: 0,
    products_published: 0,
    total_revenue: 0,
    avg_quality_score: 0,
  },
  pipeline: {
    scout: { status: "idle", signals_collected: 0, signals_scored: 0, last_run: null },
    creator: { status: "idle", products_forged: 0, in_progress: 0, last_run: null },
    amplifier: { status: "idle", published: 0, pending: 0, last_run: null },
    cashier: { status: "idle", sales: 0, revenue: 0, last_run: null },
    brain: { status: "idle", feedback_loops: 0, optimizations: 0, last_run: null },
  },
  products: [],
  recent_activity: [],
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/products-pipeline`, {
      next: { revalidate: 15 },
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
