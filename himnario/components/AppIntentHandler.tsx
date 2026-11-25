/**
 * AppIntentHandler — Single root consumer for Apple App Intents (Siri, Shortcuts, Spotlight).
 *
 * Mounts inside RootLayout below navigation & context providers. Syncs the hymnal catalog
 * into Siri/Spotlight and routes pending & live invocations (`openHymn`, `showDailyVerse`,
 * `openChurches`) safely via Expo Router, dequeuing each invocation after handling.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as AppIntents from 'expo-app-intents';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useRecentHymns } from '../context/RecentHymnsContext';
import { syncHymnAppIntentsCatalog } from '../utils/appIntentsSync';

export default function AppIntentHandler() {
  const router = useRouter();
  const { language } = useLanguage();
  const { favoriteIds } = useFavorites();
  const { recentIds } = useRecentHymns();

  // Keep Siri & Spotlight catalog in sync with user language, favorites, and recents.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    syncHymnAppIntentsCatalog(language, favoriteIds, recentIds);
  }, [favoriteIds, language, recentIds]);

  AppIntents.useAppIntents(async (pendingIntents) => {
    for (const invocation of pendingIntents) {
      try {
        if (invocation.name === 'openHymn') {
          const rawId = invocation.params?.hymnId;
          const hymnId = typeof rawId === 'string' ? rawId.trim() : '';
          if (hymnId) {
            router.push(`/hymn/${encodeURIComponent(hymnId)}` as any);
          } else {
            router.navigate('/(tabs)/hymns' as any);
          }
          await AppIntents.removePendingInvocationAsync(invocation.id);
        } else if (invocation.name === 'showDailyVerse') {
          router.navigate('/(tabs)/home' as any);
          await AppIntents.removePendingInvocationAsync(invocation.id);
        } else if (invocation.name === 'openChurches') {
          router.push('/churches' as any);
          await AppIntents.removePendingInvocationAsync(invocation.id);
        }
      } catch (error) {
        console.warn('[AppIntentHandler] failed to handle invocation:', invocation.id, error);
      }
    }
  });

  return null;
}
