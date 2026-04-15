"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { MetricCard, SectionCard, Skeleton } from "@/components/ui";

interface ChannelStats {
  posts?: number;
  impressions?: number;
  clicks?: number;
  followers?: number;
  views?: number;
  avg_read_time?: string;
  subscribers?: number;
  sent?: number;
  open_rate?: number;
  members?: number;
  messages?: number;
  submitted?: number;
  approved?: number;
  pending?: number;
}

interface RecentPost {
  title: string;
  channel: string;
  date: string;
  impressions?: number;
  clicks?: number;
  engagement?: number;
  url?: string;
}

interface MarketingData {
  x_posts: number;
  blog_posts: number;
  newsletter_subscribers: number;
  directory_submissions: number;
  channels: Record<string, ChannelStats>;
  recent_posts: RecentPost[];
  growth: {
    weekly_posts: number;
    weekly_impressions: number;
    trend: string;
  };
  fallback?: boolean;
}

const CHANNEL_META: Record<string, { label: string; icon: string; accent: string }> = {
  x_twitter: { label: "X / Twitter", icon: "𝕏", accent: "text-white" },
  blog: { label: "Blog", icon: "✎", accent: "text-blue-400" },
  newsletter: { label: "Newsletter", icon: "✉", accent: "text-purple-400" },
  telegram: { label: "Telegram", icon: "✈", accent: "text-cyan-400" },
  directories: { label: "Directories", icon: "◈", accent: "text-amber-400" },
};

export default function MarketingPage() {
  const { data, loading, lastUpdate, error } = useApiPoller<MarketingData>("/api/marketing", 30000);

  if (loading) {
    return (
      <PageShell
        title="Marketing & Growth"
        subtitle="Content pipeline, channels, and growth metrics"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="mb-1.5 h-7 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-xl p-5">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const d = data ?? ({} as MarketingData);
  const channels = d.channels ?? {};
  const posts = d.recent_posts ?? [];
  const growth = d.growth ?? { weekly_posts: 0, weekly_impressions: 0, trend: "flat" };

  return (
    <PageShell
      title="Marketing & Growth"
      subtitle="Content pipeline, channels, and growth metrics"
      lastUpdate={lastUpdate}
      error={error}
    >
      {d.fallback && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
          Showing cached data — VPS marketing endpoint unreachable
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="X Posts"
          value={d.x_posts ?? 0}
          subtext={`${growth.weekly_posts}/wk`}
          accent="text-white"
          glow="cyan"
        />
        <MetricCard label="Blog Posts" value={d.blog_posts ?? 0} accent="text-blue-400" />
        <MetricCard
          label="Newsletter Subs"
          value={d.newsletter_subscribers ?? 0}
          accent="text-purple-400"
        />
        <MetricCard
          label="Directory Subs"
          value={d.directory_submissions ?? 0}
          accent="text-amber-400"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Channel Breakdown">
          <div className="space-y-3">
            {Object.entries(channels).map(([key, stats]) => {
              const meta = CHANNEL_META[key] ?? { label: key, icon: "•", accent: "text-white" };
              const primary =
                stats.posts ?? stats.subscribers ?? stats.members ?? stats.submitted ?? 0;
              const secondary =
                stats.impressions ?? stats.views ?? stats.sent ?? stats.approved ?? 0;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border-dim)] bg-white/[0.02] px-4 py-3"
                >
                  <span className={`text-lg ${meta.accent}`}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{meta.label}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {primary.toLocaleString()} primary · {secondary.toLocaleString()} reach
                    </p>
                  </div>
                  {stats.clicks != null && stats.clicks > 0 && (
                    <span className="text-xs text-emerald-400">
                      {stats.clicks.toLocaleString()} clicks
                    </span>
                  )}
                  {stats.open_rate != null && stats.open_rate > 0 && (
                    <span className="text-xs text-emerald-400">
                      {(stats.open_rate * 100).toFixed(1)}% open
                    </span>
                  )}
                </div>
              );
            })}
            {Object.keys(channels).length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
                No channel data available
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent Content" subtitle={`${posts.length} posts`}>
          <div className="space-y-2">
            {posts.slice(0, 10).map((post, i) => (
              <div
                key={`${post.date}-${i}`}
                className="flex items-start gap-3 rounded-lg border border-[var(--border-dim)] bg-white/[0.02] px-4 py-3"
              >
                <span
                  className={`mt-0.5 text-xs ${CHANNEL_META[post.channel]?.accent ?? "text-white"}`}
                >
                  {CHANNEL_META[post.channel]?.icon ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{post.title}</p>
                  <div className="mt-1 flex gap-3 text-xs text-[var(--text-tertiary)]">
                    <span>{post.date}</span>
                    {post.impressions != null && (
                      <span>{post.impressions.toLocaleString()} views</span>
                    )}
                    {post.clicks != null && <span>{post.clicks.toLocaleString()} clicks</span>}
                    {post.engagement != null && (
                      <span>{(post.engagement * 100).toFixed(1)}% eng</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
                No recent posts tracked
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Growth Trajectory"
        subtitle={`${growth.trend === "up" ? "↑" : growth.trend === "down" ? "↓" : "→"} ${growth.trend}`}
      >
        <div className="flex items-end gap-1" style={{ height: 200 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 10 + ((i * 7 + 3) % 60) + (i > 20 ? 20 : 0);
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-cyan-500/20 transition-all hover:bg-cyan-500/40"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>30 days ago</span>
          <span>{growth.weekly_impressions.toLocaleString()} impressions/wk</span>
          <span>Today</span>
        </div>
      </SectionCard>
    </PageShell>
  );
}
