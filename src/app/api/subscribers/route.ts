import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK_DATA = {
  available: false,
  sampled_at: "",
  subscribers: [],
  kpis: {
    total: 0,
    active: 0,
    mrr_usdc: 0,
    churn_rate: 0,
  },
  funnel: {
    site_visits: 0,
    signals_page: 0,
    telegram_bot: 0,
    payment: 0,
    active_subscriber: 0,
  },
  retention: {
    avg_lifetime_days: 0,
    renewal_rate: 0,
    ltv_usdc: 0,
  },
  source: "fallback",
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/subscribers`, {
      next: { revalidate: 20 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK_DATA);
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(FALLBACK_DATA);
  }
}
