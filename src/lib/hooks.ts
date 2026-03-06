"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Shared polling hook — replaces copy-pasted useState+useEffect+setInterval
 * across all dashboard pages.
 */
export function useApiPoller<T>(url: string, intervalMs: number = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setError("");
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { data, error, loading, lastUpdate, refresh };
}
