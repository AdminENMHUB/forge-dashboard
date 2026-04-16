"use client";

import { useApiPoller } from "@/lib/hooks";
import { timeAgo } from "@/lib/formatters";
import { PageShell } from "@/components/nav";
import { MetricCard, StatusBadge, SectionCard, Skeleton } from "@/components/ui";

const SITE = "https://eganforge.com";

interface SeoData {
  available: boolean;
  pages_indexed: number;
  blog_posts: number;
  product_pages: number;
  comparison_pages: number;
  sitemap_urls: number;
  structured_data_types: string[];
  crawl_errors: number;
  last_crawl: string;
}

export default function SeoHubPage() {
  const { data, loading, lastUpdate, error } = useApiPoller<SeoData>("/api/seo", 60000);

  if (loading) {
    return (
      <PageShell title="SEO Hub" subtitle="Search engine optimization — live sitemap analysis">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  const seo = data;
  if (!seo) {
    return (
      <PageShell
        title="SEO Hub"
        subtitle="Search engine optimization — live sitemap analysis"
        error={error}
      >
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-8 text-center text-sm text-red-300">
          Unable to reach VPS — SEO data unavailable. Check that the dashboard API is running on
          Hetzner.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="SEO Hub"
      subtitle="Search engine optimization — live sitemap analysis"
      lastUpdate={lastUpdate}
      error={error}
    >
      <div className="space-y-6 pb-12">
        {!seo.available && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-300">
            Sitemap crawl failed — showing last known data
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard label="Pages Indexed" value={seo.pages_indexed} glow="cyan" />
          <MetricCard label="Blog Posts" value={seo.blog_posts} glow="blue" />
          <MetricCard label="Product Pages" value={seo.product_pages} />
          <MetricCard label="Comparisons" value={seo.comparison_pages} />
          <MetricCard label="Sitemap URLs" value={seo.sitemap_urls} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Structured Data">
            <div className="mb-4 flex flex-wrap gap-2">
              {(seo.structured_data_types || []).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-400"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              JSON-LD schema emitted via{" "}
              <code className="rounded bg-white/10 px-1.5">eganforge-site/lib/seo-jsonld.ts</code>
            </p>
          </SectionCard>

          <SectionCard title="Crawl Health">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Crawl Errors</p>
                <p className="text-2xl font-bold text-white">{seo.crawl_errors}</p>
              </div>
              <StatusBadge status={seo.crawl_errors === 0 ? "healthy" : "degraded"} />
            </div>
            {seo.last_crawl && (
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Last crawl: {timeAgo(seo.last_crawl)}
              </p>
            )}
            <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <a
                href={`${SITE}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cyan-400 hover:text-cyan-300"
              >
                Sitemap: {SITE}/sitemap.xml
              </a>
              <a
                href={`${SITE}/robots.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cyan-400 hover:text-cyan-300"
              >
                Robots: {SITE}/robots.txt
              </a>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Content Clusters">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Products hub", href: `${SITE}/products`, count: seo.product_pages },
              { label: "Blog", href: `${SITE}/blog`, count: seo.blog_posts },
              { label: "Signals", href: `${SITE}/signals`, count: null },
              {
                label: "Comparisons",
                href: `${SITE}/compare/captioncraft-vs-jasper`,
                count: seo.comparison_pages,
              },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-sm transition hover:bg-white/[0.05]"
              >
                <span className="text-cyan-400">{c.label}</span>
                {c.count !== null && (
                  <span className="text-[var(--text-tertiary)]">{c.count} pages</span>
                )}
              </a>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Google Search Console", href: "https://search.google.com/search-console" },
              { label: "Bing Webmaster Tools", href: "https://www.bing.com/webmasters" },
              { label: "Rich Results Test", href: "https://search.google.com/test/rich-results" },
              {
                label: "PageSpeed Insights",
                href: `https://pagespeed.web.dev/analysis?url=${SITE}`,
              },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-center text-xs text-[var(--text-secondary)] transition hover:border-cyan-500/20 hover:text-cyan-400"
              >
                {a.label}
              </a>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
