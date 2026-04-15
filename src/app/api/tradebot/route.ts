import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  available: false,
  portfolio_value: 0,
  total_pnl: 0,
  win_rate: 0,
  trades_today: 0,
  regime: "UNKNOWN",
  fear_greed: { value: 0, label: "N/A" },
  circuit_breaker: { halted: false, daily_loss: 0, limit: 30 },
  strategies: [],
  open_positions: [],
  recent_trades: [],
  last_updated: "",
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/tradebot`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
