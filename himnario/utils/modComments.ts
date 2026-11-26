/**
 * Helpers for displaying Admin Moderation comment targets (Hymns, Choruses,
 * and Daily Verses) and compact relative timestamps across iOS & Android.
 */
import { DAILY_VERSES } from '../data/dailyVerses';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getLocalizedHymn } from '../data/alabanzasEnglish';

export type CommentTargetInfo = {
  kind: 'hymn' | 'verse';
  hymnId: string | null;
  label: string;
};

const dailyVerseById = new Map<string, { esRef: string; enRef: string }>();
for (const v of DAILY_VERSES) {
  dailyVerseById.set(v.id.toLowerCase(), {
    esRef: v.es.ref,
    enRef: v.en.ref,
  });
}

function buildHymnLookup(displayLang: 'es' | 'en') {
  const bySlug = new Map<string, { id: string; number: string; title: string; isChorus: boolean }>();
  for (const raw of [...hymnsData, ...estribillosData]) {
    const id = String((raw as any).id || '').trim();
    const localized = getLocalizedHymn(raw as any, displayLang) as any;
    const isChorus = id.toUpperCase().startsWith('E');
    bySlug.set(id.toLowerCase(), {
      id,
      number: String(localized.number ?? id),
      title: String(localized.title ?? ''),
      isChorus,
    });
  }
  return bySlug;
}

const hymnLookupEs = buildHymnLookup('es');
const hymnLookupEn = buildHymnLookup('en');

/**
 * Resolves a `verse_comments.verse_id` (e.g. `hymn-439`, `hymn-e12`, `mateo-18-20`)
 * into a human-readable target label and optional navigable hymn ID.
 */
export function describeCommentTarget(
  rawVerseId: string | null | undefined,
  lang: 'es' | 'en',
  dailyVersePrefix: string,
): CommentTargetInfo {
  const id = String(rawVerseId ?? '').trim();
  const lower = id.toLowerCase();

  if (lower.startsWith('hymn-')) {
    const slug = lower.slice(5);
    const map = lang === 'en' ? hymnLookupEn : hymnLookupEs;
    const match = map.get(slug);
    if (match) {
      const kindWord = match.isChorus
        ? lang === 'en'
          ? 'Chorus'
          : 'Estribillo'
        : lang === 'en'
          ? 'Hymn'
          : 'Himno';
      return {
        kind: 'hymn',
        hymnId: match.id,
        label: `${kindWord} ${match.number} · ${match.title}`,
      };
    }
    const fallbackId = id.slice(5).toUpperCase();
    return {
      kind: 'hymn',
      hymnId: fallbackId || null,
      label: `${lang === 'en' ? 'Hymn' : 'Himno'} #${fallbackId || slug}`,
    };
  }

  const verse = dailyVerseById.get(lower);
  if (verse) {
    return {
      kind: 'verse',
      hymnId: null,
      label: `${dailyVersePrefix} · ${lang === 'en' ? verse.enRef : verse.esRef}`,
    };
  }

  const prettySlug = id
    .split('-')
    .filter(Boolean)
    .map((part, idx) => (idx === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');

  return {
    kind: 'verse',
    hymnId: null,
    label: prettySlug ? `${dailyVersePrefix} · ${prettySlug}` : dailyVersePrefix,
  };
}

export function formatModRelativeTime(ms: number | null | undefined, es: boolean, now = Date.now()): string {
  if (!ms || !Number.isFinite(ms)) return '';
  const diffSec = Math.max(0, Math.floor((now - ms) / 1000));
  if (diffSec < 60) return es ? 'ahora' : 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return es ? `${diffDays}d` : `${diffDays}d`;
  try {
    return new Date(ms).toLocaleDateString(es ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
