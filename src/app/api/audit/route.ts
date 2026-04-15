import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  chain_valid: true,
  total_entries: 0,
  entries: [],
  event_types: ["trade", "proposal", "capital_move", "deploy", "escalation", "config_change"],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_type = searchParams.get("event_type") || "";
    const agent = searchParams.get("agent") || "";
    const limit = searchParams.get("limit") || "50";

    const params = new URLSearchParams({ event_type, agent, limit });
    const res = await fetch(`${getHetznerApi()}/api/audit?${params}`, {
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
