"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";

interface CatalogProduct {
  id?: string;
  title?: string;
  niche?: string;
  price?: number;
  created_at?: string;
  metadata?: { provenance?: unknown };
}

interface ScoutOpp {
  source?: string;
  title?: string;
  url?: string;
  score?: number;
  rationale?: string;
  created_at?: string;
}

export default function IpMarketplacePage() {
  const { data, loading, error, lastUpdate, refresh } = useApiPoller<{
    catalog?: { products?: CatalogProduct[]; updated_at?: string };
    scout_opportunities?: ScoutOpp[];
    scout_db_path?: string | null;
    catalog_source?: string;
  }>("/api/forge-ip-marketplace", 45000);

  const products = data?.catalog?.products ?? [];
  const opps = data?.scout_opportunities ?? [];

  if (loading && !data) {
    return (
      <PageShell title="Forge IP Marketplace" subtitle="Loading…">
        <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
          Loading catalog and scout data…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Forge IP Marketplace"
      subtitle="Product Claws catalog + Scout opportunities (set SCOUT_DB_PATH on API server if DB is remote)"
      lastUpdate={lastUpdate}
      error={error ?? undefined}
    >
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <p className="font-mono text-xs text-[var(--text-muted)]">
          catalog: {data?.catalog_source} · scout db: {data?.scout_db_path ?? "none (empty list)"}
        </p>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Digital products (catalog)</h2>
          {products.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No products in catalog yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-[var(--text-muted)]">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Niche</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Provenance</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 80).map((p) => (
                    <tr
                      key={p.id ?? p.title}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="p-3 text-white/90">{p.title}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{p.niche}</td>
                      <td className="p-3">
                        ${typeof p.price === "number" ? p.price.toFixed(2) : "—"}
                      </td>
                      <td className="p-3 text-emerald-400/80">
                        {p.metadata?.provenance ? "yes" : "—"}
                      </td>
                      <td className="p-3 text-xs text-[var(--text-muted)]">{p.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Scout opportunities</h2>
          {opps.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No rows (run Scout on the VPS or point SCOUT_DB_PATH at apps/scout/data/scout.db).
            </p>
          ) : (
            <ul className="space-y-3">
              {opps.map((o, i) => (
                <li
                  key={`${o.url}-${i}`}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs tracking-wide text-amber-400/90 uppercase">
                      {o.source}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      score {typeof o.score === "number" ? o.score.toFixed(1) : "—"}
                    </span>
                  </div>
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    {o.title}
                  </a>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{o.rationale}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
