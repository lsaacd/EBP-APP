/**
 * Pure helpers for the "Más gustados" ranking (no React, no storage), so they
 * can be tested directly. The hook that fetches the data is in topHymns.ts.
 */
export type LikesBySlug = Record<string, number>;

/** Same normalisation the like buttons use: "315 A" → "315-a", "E12" → "e12". */
export function hymnSlug(rawId: string | number): string {
  return String(rawId ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Reads the server payload defensively: anything malformed is dropped. */
export function parseTopHymns(payload: unknown): LikesBySlug {
  const out: LikesBySlug = {};
  const rows = (payload as { hymns?: unknown })?.hymns;
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const id = (row as { hymnId?: unknown })?.hymnId;
    const likes = (row as { likesCount?: unknown })?.likesCount;
    if (typeof id === 'string' && typeof likes === 'number' && Number.isFinite(likes) && likes > 0) {
      out[id] = Math.floor(likes);
    }
  }
  return out;
}

/**
 * Keeps only liked hymns and orders them most-liked first. Ties keep their
 * incoming order, so hymnal order (or search relevance) breaks them.
 */
export function rankByLikes<T extends { hymn: { id: string | number } }>(
  results: T[],
  likes: LikesBySlug,
): (T & { likes: number })[] {
  return results
    .map((result, index) => ({ result, index, likes: likes[hymnSlug(result.hymn.id)] ?? 0 }))
    .filter((entry) => entry.likes > 0)
    .sort((a, b) => b.likes - a.likes || a.index - b.index)
    .map((entry) => ({ ...entry.result, likes: entry.likes }));
}
