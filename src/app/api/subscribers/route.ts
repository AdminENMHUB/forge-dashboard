import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK_DATA = {
  available: true,
  sampled_at: new Date().toISOString(),
  subscribers: [
    {
      wallet: "0xD661...b829A",
      full_address: "0xD6618691cCce095ff6dED49b3068E5144b2241c1",
      tier: "elite",
      status: "active",
      expiry: "2027-03-15T00:00:00Z",
      telegram_connected: true,
      usdc_paid: 199.99,
      subscribed_at: "2026-03-15T00:00:00Z",
    },
    {
      wallet: "0x7a3F...9e21B",
      full_address: "0x7a3F000000000000000000000000000000009e21B",
      tier: "echo",
      status: "expired",
      expiry: "2026-02-01T00:00:00Z",
      telegram_connected: false,
      usdc_paid: 57.58,
      subscribed_at: "2025-12-01T00:00:00Z",
    },
  ],
  kpis: {
    total: 2,
    active: 1,
    mrr_usdc: 19.99,
    churn_rate: 0.5,
  },
  funnel: {
    site_visits: 0,
    signals_page: 0,
    telegram_bot: 0,
    payment: 2,
    active_subscriber: 1,
  },
  retention: {
    avg_lifetime_days: 180,
    renewal_rate: 0.5,
    ltv_usdc: 128.79,
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
