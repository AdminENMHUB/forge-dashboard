import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  available: false,
  usdc_deployed: 0,
  win_rate: 0,
  active_positions: 0,
  daily_pnl: 0,
  total_pnl: 0,
  bets: [],
  containers: [],
  consensus: [],
  risk_engine: {
    circuit_breaker: false,
    daily_loss: 0,
    daily_loss_limit: 30,
    consecutive_losses: 0,
    max_consecutive: 4,
    weekly_drawdown: 0,
    weekly_kill_switch: 10,
    cooldown_active: false,
  },
  last_updated: "",
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/echoswarm`, {
      next: { revalidate: 15 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
