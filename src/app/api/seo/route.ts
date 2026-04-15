import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

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

const FALLBACK = {
  available: false,
  pages_indexed: 36,
  blog_posts: 51,
  product_pages: 16,
  comparison_pages: 8,
  sitemap_urls: 85,
  structured_data_types: [
    "Organization",
    "WebSite",
    "Article",
    "BreadcrumbList",
    "WebPage",
    "Product",
  ],
  top_keywords: [
    { keyword: "AI trading bot", position: 42, clicks: 12 },
    { keyword: "crypto signals telegram", position: 28, clicks: 8 },
    { keyword: "caption generator AI", position: 15, clicks: 22 },
    { keyword: "egan forge", position: 1, clicks: 45 },
    { keyword: "AI SaaS tools", position: 31, clicks: 6 },
  ],
  crawl_errors: 0,
  last_crawl: "",
};
