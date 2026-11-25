/**
 * appIntentsSync — Publishes the hymnal catalog (637 hymns + 124 choruses) to
 * iOS Siri, Shortcuts, and Spotlight via `expo-app-intents`.
 *
 * Safe no-op on Android, web, Expo Go, and older iOS binaries without `expo-app-intents`.
 */
import { Platform } from 'react-native';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getLocalizedHymn } from '../data/alabanzasEnglish';
import type { Language } from '../context/LanguageContext';

export interface CompactHymnEntity {
  id: string;
  title: string;
  subtitle?: string;
  synonyms?: string[];
}

/**
 * Builds deterministic, unique `AppIntentEntity` records for all 761 hymns and choruses.
 * Prioritizes favorites & recently viewed hymns at the front so Siri's suggestedEntities()
 * highlights the user's most meaningful hymns first.
 */
export function buildHymnIntentCatalog(
  language: Language,
  favoriteIds: readonly string[] = [],
  recentIds: readonly string[] = [],
): CompactHymnEntity[] {
  const es = language !== 'en';
  const all = [...hymnsData, ...estribillosData];
  const byId = new Map<string, (typeof all)[number]>();
  for (const h of all) {
    byId.set(String(h.id), h);
  }

  const ordered: (typeof all)[number][] = [];
  const seen = new Set<string>();

  const pushId = (rawId: string) => {
    const id = String(rawId || '').trim();
    if (!id || seen.has(id)) return;
    const found = byId.get(id);
    if (found) {
      seen.add(id);
      ordered.push(found);
    }
  };

  for (const fid of favoriteIds) pushId(fid);
  for (const rid of recentIds) pushId(rid);
  for (const h of all) pushId(String(h.id));

  return ordered.map((h) => {
    const id = String(h.id);
    const localized = getLocalizedHymn(h as any, es ? 'es' : 'en');
    const esTitle = String(h.title || '').trim();
    const enTitle = String(localized.title || '').trim();
    const displayTitle = (es ? esTitle : enTitle) || esTitle || enTitle || id;
    const isChorus = id.toUpperCase().startsWith('E');
    const numLabel = isChorus ? id : String(h.number ?? id);

    const title = `#${numLabel} · ${displayTitle}`;
    const subtitle = isChorus
      ? (es ? 'Estribillo · Himnario El Buen Pastor' : 'Chorus · El Buen Pastor Hymnal')
      : (es ? `Himno ${numLabel} · El Buen Pastor` : `Hymn ${numLabel} · El Buen Pastor`);

    const synonyms = Array.from(
      new Set(
        [
          numLabel,
          isChorus ? `Estribillo ${numLabel}` : `Himno ${numLabel}`,
          isChorus ? `Chorus ${numLabel}` : `Hymn ${numLabel}`,
          displayTitle,
          esTitle !== displayTitle ? esTitle : '',
          enTitle !== displayTitle ? enTitle : '',
        ].filter((s) => Boolean(s && s.trim())),
      ),
    );

    return {
      id,
      title,
      subtitle,
      synonyms,
    };
  });
}

let inFlightSync: Promise<void> | null = null;

export function syncHymnAppIntentsCatalog(
  language: Language,
  favoriteIds: readonly string[] = [],
  recentIds: readonly string[] = [],
): void {
  if (Platform.OS !== 'ios') return;

  const run = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AppIntents = require('expo-app-intents') as typeof import('expo-app-intents');
      if (!AppIntents?.isAvailable?.()) return;
      const entities = buildHymnIntentCatalog(language, favoriteIds, recentIds);
      await AppIntents.setEntityCatalogAsync('hymn', entities);
    } catch {
      // Best-effort Siri/Spotlight sync must never interrupt app launch
    }
  };

  inFlightSync = (inFlightSync ? inFlightSync.then(run, run) : run()).catch(() => {});
}
