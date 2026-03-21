import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const swarm = searchParams.get("swarm") || "";
    const agent = searchParams.get("agent") || "";
    const limit = searchParams.get("limit") || "20";

    const params = new URLSearchParams({ swarm, agent, limit });
    const res = await fetch(`${getHetznerApi()}/api/activity?${params}`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) {
      return NextResponse.json({ status: "error", upstream: res.status }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ status: "error", message: msg }, { status: 502 });
  }
}
