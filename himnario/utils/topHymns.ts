/**
 * "Más gustados": the public ranking of hymns by likes.
 *
 * The server returns only hymns that have at least one like, most-liked first,
 * and never dislike counts. The list is cached on the device so the filter
 * shows something at once and still works offline.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_SYNC_API_URL } from '../context/AuthContext';

/** The value the Himnos filter chips use for this ranking. */
export const TOP_HYMNS_FILTER = '__mas_gustados__';

const STORAGE_KEY = '@himnario_top_hymns_v1';
const FRESH_FOR_MS = 2 * 60 * 1000;

import { parseTopHymns, type LikesBySlug } from './hymnRanking';

export { rankByLikes, hymnSlug, type LikesBySlug } from './hymnRanking';

let memory: { likes: LikesBySlug; at: number } | null = null;

export function useTopHymns(enabled: boolean) {
  const [likes, setLikes] = useState<LikesBySlug>(() => memory?.likes ?? {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      // Show the saved ranking straight away, then refresh if it is stale.
      if (!memory) {
        try {
          const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || 'null');
          if (saved && typeof saved === 'object' && saved.likes) {
            memory = { likes: saved.likes as LikesBySlug, at: Number(saved.at) || 0 };
            if (!cancelled) setLikes(memory.likes);
          }
        } catch {
          // A corrupt cache is the same as none.
        }
      }
      if (memory && Date.now() - memory.at < FRESH_FOR_MS) return;

      if (!cancelled) setLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${AUTH_SYNC_API_URL}/hymns/top`, { signal: controller.signal });
        if (!response.ok) return;
        const next = parseTopHymns(await response.json());
        memory = { likes: next, at: Date.now() };
        if (!cancelled) setLikes(next);
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory)).catch(() => {});
      } catch {
        // Offline or timed out: keep whatever is already shown.
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { likes, loading };
}
