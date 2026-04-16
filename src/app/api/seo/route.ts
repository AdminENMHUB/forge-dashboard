import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  available: false,
  pages_indexed: 0,
  blog_posts: 0,
  product_pages: 0,
  comparison_pages: 0,
  sitemap_urls: 0,
  structured_data_types: [],
  crawl_errors: 0,
  last_crawl: "",
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/seo`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
