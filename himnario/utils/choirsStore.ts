import { useCallback, useEffect, useMemo, useState } from 'react';
import { AUTH_SYNC_API_URL } from '../context/AuthContext';
import { CHOIRS, choirDisplayName } from '../data/communityRules';

export interface ApprovedChoir {
  slug: string;
  nameEs: string;
  nameEn: string;
}

const DEFAULT_CHOIRS: ApprovedChoir[] = Object.entries(CHOIRS)
  .filter(([slug]) => slug !== 'otro')
  .map(([slug, [nameEs, nameEn]]) => ({ slug, nameEs, nameEn }));

let cachedChoirs: ApprovedChoir[] = DEFAULT_CHOIRS;
let lastFetchedAt = 0;
let inflight: Promise<ApprovedChoir[]> | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const fn of listeners) fn();
};

function mergeChoirs(remote: unknown): ApprovedChoir[] {
  const map = new Map<string, ApprovedChoir>();
  for (const c of DEFAULT_CHOIRS) map.set(c.slug, c);
  if (Array.isArray(remote)) {
    for (const row of remote) {
      if (
        row &&
        typeof row === 'object' &&
        typeof (row as any).slug === 'string' &&
        typeof (row as any).nameEs === 'string' &&
        typeof (row as any).nameEn === 'string'
      ) {
        const slug = String((row as any).slug).trim();
        if (slug && slug !== 'otro') {
          map.set(slug, {
            slug,
            nameEs: String((row as any).nameEs).trim(),
            nameEn: String((row as any).nameEn).trim(),
          });
        }
      }
    }
  }
  return Array.from(map.values());
}

export async function fetchApprovedChoirs(force = false): Promise<ApprovedChoir[]> {
  if (!force && lastFetchedAt > 0 && Date.now() - lastFetchedAt < 90_000) {
    return cachedChoirs;
  }
  if (inflight && !force) return inflight;
  inflight = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}/choirs`, {
        signal: controller.signal,
      });
      if (!res.ok) return cachedChoirs;
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.choirs)) {
        cachedChoirs = mergeChoirs(data.choirs);
        lastFetchedAt = Date.now();
        notify();
      }
      return cachedChoirs;
    } catch {
      return cachedChoirs;
    } finally {
      clearTimeout(timer);
      inflight = null;
    }
  })();
  return inflight;
}

export function getCachedChoirMap(): Record<string, ApprovedChoir> {
  const out: Record<string, ApprovedChoir> = {};
  for (const c of cachedChoirs) out[c.slug] = c;
  return out;
}

export function resolveChoirName(slug: string | null | undefined, es: boolean): string {
  return choirDisplayName(slug, es, getCachedChoirMap());
}

export function useApprovedChoirs() {
  const [choirs, setChoirs] = useState<ApprovedChoir[]>(() => cachedChoirs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onUpdate = () => setChoirs(cachedChoirs);
    listeners.add(onUpdate);
    onUpdate();
    void fetchApprovedChoirs(false);
    return () => {
      listeners.delete(onUpdate);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchApprovedChoirs(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const bySlug = useMemo(() => {
    const out: Record<string, ApprovedChoir> = {};
    for (const c of choirs) out[c.slug] = c;
    return out;
  }, [choirs]);

  return { choirs, bySlug, loading, refresh };
}
