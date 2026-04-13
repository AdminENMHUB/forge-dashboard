"use client";

import { PageShell } from "@/components/nav";

const SITE = "https://eganforge.com";

export default function SeoHubPage() {
  return (
    <PageShell title="SEO Program" subtitle="Organic growth checklist and public site links">
      <div className="mx-auto max-w-3xl space-y-8 pb-12">
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Search Console &amp; Bing</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            <li>
              Verify domain ownership in{" "}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Google Search Console
              </a>{" "}
              (DNS or HTML file).
            </li>
            <li>
              Submit the sitemap:{" "}
              <a
                href={`${SITE}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                {SITE}/sitemap.xml
              </a>
            </li>
            <li>
              Add the site in{" "}
              <a
                href="https://www.bing.com/webmasters"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Bing Webmaster Tools
              </a>{" "}
              and import GSC or verify separately.
            </li>
          </ol>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Analytics</h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Production uses Plausible at{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/90">
              analytics.eganforge.com
            </code>{" "}
            and GA4 (see site env). Use the same property for landing-page experiments and content
            attribution.
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Structured data (JSON-LD)</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            The marketing site emits Organization, WebSite, Article, BreadcrumbList, and WebPage
            schema via{" "}
            <code className="rounded bg-white/10 px-1.5 text-xs">
              eganforge-site/lib/seo-jsonld.ts
            </code>
            .
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Validate with Rich Results Test after deploy.</li>
            <li>Keep canonical URLs aligned with metadata on each route.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Content clusters</h2>
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            Pillar pages and internal links (edit in the marketing repo):
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            <a className="text-cyan-400 hover:text-cyan-300" href={`${SITE}/products`}>
              Products hub →
            </a>
            <a className="text-cyan-400 hover:text-cyan-300" href={`${SITE}/blog`}>
              Blog →
            </a>
            <a className="text-cyan-400 hover:text-cyan-300" href={`${SITE}/signals`}>
              Signals / subscription →
            </a>
            <a
              className="text-cyan-400 hover:text-cyan-300"
              href={`${SITE}/compare/captioncraft-vs-jasper`}
            >
              Sample comparison page →
            </a>
          </ul>
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="mb-2 text-lg font-semibold text-amber-200/90">API automation (later)</h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Search Console URL Inspection and query data can feed this dashboard once OAuth and a
            secure token store are wired on the VPS. Until then, use GSC/Bing UIs and paste notable
            queries into executive notes.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
