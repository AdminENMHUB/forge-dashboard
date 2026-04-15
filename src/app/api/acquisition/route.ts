import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  funnel: {
    site_visitors: 0,
    signals_page_views: 0,
    telegram_joins: 0,
    payments: 2,
    active_subscribers: 1,
  },
  conversion_rates: {
    visitor_to_signals: 0,
    signals_to_telegram: 0,
    telegram_to_payment: 0,
    payment_to_active: 0.5,
  },
  channels: [],
  outreach: [],
  campaigns: [],
  totals: {
    total_revenue_usdc: 257.57,
    active_subscribers: 1,
    expired_subscribers: 1,
    lifetime_subscribers: 2,
  },
  fallback: true,
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/acquisition`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
