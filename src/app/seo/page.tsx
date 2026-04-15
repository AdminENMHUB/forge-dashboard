"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";
import { MetricCard, StatusBadge } from "@/components/ui";

const SITE = "https://eganforge.com";

interface SeoData {
  available: boolean;
  pages_indexed: number;
  blog_posts: number;
  product_pages: number;
  comparison_pages: number;
  sitemap_urls: number;
  structured_data_types: string[];
  top_keywords: Array<{ keyword: string; position: number; clicks: number }>;
  crawl_errors: number;
  last_crawl: string;
}

const FALLBACK: SeoData = {
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">{title}</h3>
      {children}
    </div>
  );
}

export default function SeoHubPage() {
  const { data } = useApiPoller<SeoData>("/api/seo", 60000);
  const seo = data ?? FALLBACK;

  return (
    <PageShell title="SEO Hub" subtitle="Search engine optimization metrics and content indexing">
      <div className="space-y-6 pb-12">
        {!seo.available && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-300">
            Showing cached data — VPS endpoint unreachable
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
          <SectionCard title="Keyword Rankings">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase">
                    <th className="pb-2">Keyword</th>
                    <th className="pb-2 text-right">Position</th>
                    <th className="pb-2 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {seo.top_keywords.map((kw) => (
                    <tr key={kw.keyword} className="border-b border-white/[0.03]">
                      <td className="py-2 text-[var(--text-secondary)]">{kw.keyword}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            kw.position <= 10
                              ? "font-semibold text-emerald-400"
                              : kw.position <= 30
                                ? "text-amber-400"
                                : "text-[var(--text-tertiary)]"
                          }
                        >
                          #{kw.position}
                        </span>
                      </td>
                      <td className="py-2 text-right text-[var(--text-secondary)]">{kw.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Structured Data">
            <div className="mb-4 flex flex-wrap gap-2">
              {seo.structured_data_types.map((t) => (
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
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Crawl Health">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Crawl Errors</p>
                <p className="text-2xl font-bold text-white">{seo.crawl_errors}</p>
              </div>
              <StatusBadge status={seo.crawl_errors === 0 ? "healthy" : "degraded"} />
            </div>
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

          <SectionCard title="Content Clusters">
            <div className="space-y-2">
              {[
                { label: "Products hub", href: `${SITE}/products`, count: seo.product_pages },
                { label: "Blog", href: `${SITE}/blog`, count: seo.blog_posts },
                { label: "Signals", href: `${SITE}/signals`, count: 3 },
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
                  <span className="text-[var(--text-tertiary)]">{c.count} pages</span>
                </a>
              ))}
            </div>
          </SectionCard>
        </div>

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
