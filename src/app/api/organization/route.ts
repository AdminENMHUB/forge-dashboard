import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";
import { parse } from "yaml";

import type { OrganizationDocument } from "@/types/empire";

export async function GET() {
  try {
    const path = join(process.cwd(), "src/data/organization.yaml");
    const text = readFileSync(path, "utf8");
    const doc = parse(text) as OrganizationDocument;
    return NextResponse.json(doc, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "parse error";
    return NextResponse.json({ error: `organization: ${msg}` }, { status: 500 });
  }
}
