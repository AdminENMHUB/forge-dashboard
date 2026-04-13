"use client";

import { useApiPoller } from "@/lib/hooks";
import { PageShell } from "@/components/nav";

interface Block {
  source?: string;
  empty?: boolean;
  updated_at?: string;
  summary?: string;
  checklist?: Array<{ id?: string; item?: string; priority?: string }>;
  items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function IpEmpirePage() {
  const { data, loading, error, lastUpdate, refresh } = useApiPoller<{
    updated_at?: string | null;
    ip_guardian?: Block;
    patent_strategist?: Block;
    seo_director?: Block;
  }>("/api/ip-empire", 60000);

  if (loading && !data) {
    return (
      <PageShell title="Forge IP Empire" subtitle="Loading…">
        <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
          Loading IP empire data…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Forge IP Empire"
      subtitle="IP hygiene, patent hypotheses, SEO priorities — from master swarm data files"
      lastUpdate={lastUpdate}
      error={error ?? undefined}
    >
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          Last merged update: <span className="text-white/90">{data?.updated_at ?? "—"}</span>
        </p>

        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-emerald-200/90">IP Guardian</h2>
          <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">
            {data?.ip_guardian?.source as string}
          </p>
          {(data?.ip_guardian?.empty as boolean) && (
            <p className="text-sm text-amber-400/90">
              No file yet — runs after innovation team (reflection → ip_guardian).
            </p>
          )}
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {(data?.ip_guardian?.checklist as Block["checklist"])?.map((c) => (
              <li key={c.id ?? c.item}>
                <span className="text-white/70">[{c.priority}]</span> {c.item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-violet-200/90">Patent Strategist</h2>
          <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">
            {data?.patent_strategist?.source as string}
          </p>
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            {(data?.patent_strategist?.summary as string) || "—"}
          </p>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {((data?.patent_strategist?.items as Array<Record<string, unknown>>) ?? []).map(
              (it, i) => (
                <li key={i} className="rounded-lg border border-white/5 bg-black/20 p-3">
                  <p className="font-medium text-white/90">{String(it.title ?? "")}</p>
                  <p className="mt-1 text-xs">{String(it.rationale ?? "")}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    risk={String(it.risk ?? "")} · {String(it.next_step ?? "")}
                  </p>
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-cyan-200/90">SEO Director</h2>
          <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">
            {data?.seo_director?.source as string}
          </p>
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            {(data?.seo_director?.summary as string) || "—"}
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {((data?.seo_director?.items as Array<Record<string, unknown>>) ?? []).map((it, i) => (
              <li key={i}>
                · {String(it.title ?? "")}{" "}
                <span className="text-[var(--text-muted)]">
                  ({String(it.effort ?? "")}/{String(it.impact ?? "")})
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Not legal advice. Patent items are hypotheses for qualified counsel. Product Claws ship{" "}
          <code className="rounded bg-white/10 px-1">provenance.json</code> in each bundle.
        </p>
      </div>
    </PageShell>
  );
}
