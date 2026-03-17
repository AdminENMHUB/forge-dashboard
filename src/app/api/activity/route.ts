import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/activity`, {
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
