import { normalize as normalizeSearch } from './search-engine';

export type HymnListSortMode = 'number' | 'az' | 'audio';

export interface ScrollerHymnItem {
  id: string | number;
  number?: string | number;
  title?: string;
}

function getSortLetter(title: string | undefined): string {
  const ch = normalizeSearch(title || '').trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

/**
 * Formats the compact side-scroller pill label for Himnos / Estribillos:
 * - `'number'`: current hymn number / last hymn number (e.g. `1/636`)
 * - `'az'`: current normalized starting letter / last letter (e.g. `A/Z`)
 * - `'audio'`: `1/total` across the audio-only filtered list (e.g. `1/609`, `1/48`)
 */
export function getHymnScrollerLabel(
  items: readonly ScrollerHymnItem[],
  currentIndex: number,
  sortMode: HymnListSortMode,
): string {
  const total = items.length;
  if (total === 0) return '0/0';
  const safeIdx = Math.max(0, Math.min(total - 1, currentIndex));

  if (sortMode === 'az') {
    const currentLetter = getSortLetter(items[safeIdx]?.title);
    const lastLetter = getSortLetter(items[total - 1]?.title);
    return `${currentLetter}/${lastLetter}`;
  }

  if (sortMode === 'audio') {
    return `${safeIdx + 1}/${total}`;
  }

  const currentNum = items[safeIdx]?.number ?? safeIdx + 1;
  const lastNum = items[total - 1]?.number ?? total;
  return `${currentNum}/${lastNum}`;
}
