import { NextResponse } from "next/server";
import { getHetznerApi } from "@/lib/api-config";

const FALLBACK = {
  available: false,
  x_posts: 0,
  blog_posts: 0,
  newsletter_subscribers: 0,
  directory_submissions: 0,
  channels: {
    x_twitter: { posts: 0, impressions: 0, clicks: 0, followers: 0 },
    blog: { posts: 0, views: 0, avg_read_time: "0m" },
    newsletter: { subscribers: 0, sent: 0, open_rate: 0 },
    telegram: { members: 0, messages: 0 },
    directories: { submitted: 0, approved: 0, pending: 0 },
  },
  recent_posts: [],
  growth: { weekly_posts: 0, weekly_impressions: 0, trend: "flat" },
  source: "fallback",
};

export async function GET() {
  try {
    const res = await fetch(`${getHetznerApi()}/api/marketing`, {
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
