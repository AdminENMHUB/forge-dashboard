"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, the middleware lets us through — so a quick
  // preflight avoids showing the login form when the cookie is still fresh.
  useEffect(() => {
    let alive = true;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => {
        if (!alive) return;
        if (r.ok) router.replace(nextPath);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [nextPath, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(nextPath);
        return;
      }
      if (res.status === 401) {
        setError("Invalid password");
      } else if (res.status === 503) {
        setError("Auth is not configured on the server.");
      } else {
        setError(`Login failed (${res.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">EganForge</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">CEO Dashboard</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="glass rounded-xl border border-[var(--border-dim)] p-6"
        >
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full rounded-md border border-[var(--border-dim)] bg-white/[0.04] px-3 py-2 text-sm text-white transition outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
            placeholder="Enter dashboard password"
          />

          {error && (
            <p className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-4 w-full rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in\u2026" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-[10px] text-[var(--text-muted)]">
            Single-user access. Session persists 30 days.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // `useSearchParams` requires a Suspense boundary in Next 15+.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
