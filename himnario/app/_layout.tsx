import {lyricsNavigation} from '../utils/playerPresentation';
/**
 * RootLayout component — The entry point for the application's routing and global providers.
 *
 * Responsibility:
 * - Loads custom fonts (Newsreader and Public Sans).
 * - Manages the native splash screen visibility.
 * - Wraps the application in global context providers (Theme, Language, Favorites, Recents).
 * - Defines the application's navigation stack with custom transitions.
 * - Tab screens live inside the (tabs) group with a NativeTabs (iOS) and interactive pager (Android).
 * - Non-tab screens (hymn detail, available songs) are rendered as Stack screens.
 *
 * @returns {React.JSX.Element | null} The application structure or a splash screen while loading.
 */
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
  Newsreader_700Bold_Italic,
} from '@expo-google-fonts/newsreader';
import {
  SourceSerif4_500Medium,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
} from '@expo-google-fonts/public-sans';
import { useEffect, useRef, useState } from 'react';
import { AppState, View, Image, StyleSheet, useColorScheme, Platform, Linking } from 'react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { PlaylistsProvider } from '../context/PlaylistsContext';
import { RecentHymnsProvider } from '../context/RecentHymnsContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NowPlayingProvider, useNowPlaying } from '../context/NowPlayingContext';
import { HymnFilterProvider } from '../context/HymnFilterContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { parseNotificationDestination } from '../utils/notifications';
import { useNotifications } from '../utils/notificationsStore';
import {
  ensureNotificationHandlerConfigured,
  subscribeNotificationResponses,
} from '../utils/pushNotifications';
import { AuthSheet } from '../components/AuthSheet';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import TrackPlayer from 'react-native-track-player';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Updates from 'expo-updates';
import MiniPlayer from '../components/MiniPlayer';
import { ANDROID_BOTTOM_BAR_HEIGHT, androidBottomInset } from '../components/androidBottomLayout';
import MusicPlayer from '../components/MusicPlayer';

// The background playback service is now registered in the root index.js

// Keep the native splash visible while fonts load.
// Hold the preventAutoHideAsync promise so hideAsync always waits for it to settle.
const splashPrevented: Promise<unknown> =
  Platform.OS !== 'web'
    ? SplashScreen.preventAutoHideAsync().catch(() => {})
    : Promise.resolve();

// JS-side splash — shown in Expo Go / fast-refresh while fonts are loading.
// Mirrors the native splash exactly: logo centered on Sacred Ink cream/dark bg.
function BrandedSplash() {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#010101' : '#FAF5EE';
  return (
    <View style={[styles.splash, { backgroundColor: bg }]}>
      <Image
        source={require('../assets/images/EBP-LOGO1.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
}

// ── iOS version helpers for blur compatibility ──────────────────────────
function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  return parseInt(Platform.Version as string, 10);
}
function isIOS26OrLater(): boolean {
  return getIOSVersion() >= 26;
}

// ── Inner navigator — reads live theme AFTER ThemeProvider is mounted ─
// This ensures the slide-transition background always matches the active
// dark/light mode colour (#1a1a16 dark, #fcf9f2 light) with no flash.
function ThemedStack() {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { syncPushToken, refreshIfStale: refreshNotifications } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const { showFullPlayer, closeFullPlayer, currentHymnId, isPlaying } = useNowPlaying();
  const insets = useSafeAreaInsets();
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const checkingUpdateRef = useRef(false);

  // Configure foreground banner handling and route tapped lock-screen notifications.
  useEffect(() => {
    ensureNotificationHandlerConfigured();
    return subscribeNotificationResponses((data) => {
      const dest = parseNotificationDestination(data);
      if (!dest) return;
      if (dest.kind === 'friends') {
        router.push('/my-profile?section=friends' as any);
      } else if (dest.kind === 'hymn') {
        router.push(`/hymn/${encodeURIComponent(dest.hymnId)}` as any);
      } else {
        router.navigate('/(tabs)/home' as any);
      }
    });
  }, [router]);

  // Silently refresh Expo push token & language for signed-in users who already granted OS permission.
  useEffect(() => {
    if (!user?.id) return;
    const lang = language === 'en' ? 'en' : 'es';
    void syncPushToken(lang, false);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncPushToken(lang, false);
        void refreshNotifications(15000);
      }
    });
    return () => sub.remove();
  }, [language, refreshNotifications, syncPushToken, user?.id]);

  const [miniPlayerHeight, setMiniPlayerHeight] = useState(Platform.OS === 'android' ? 74 : 57);
  const isIOS = Platform.OS === 'ios';
  const isPad = isIOS && Boolean((Platform as any).isPad);
  const isPlaylist = pathname.startsWith('/playlist/');
  const isChurches = pathname === '/churches';
  const isMember = pathname.startsWith('/member/');
  const isMyProfile = pathname === '/my-profile';
  const isHymn = pathname.startsWith('/hymn/');

  useEffect(() => {
    if (Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) return;

    const checkAndApplyUpdate = async () => {
      if (checkingUpdateRef.current) return;
      checkingUpdateRef.current = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          const fetched = await Updates.fetchUpdateAsync();
          // Apply immediately unless hymn audio is actively playing
          if (fetched.isNew && !isPlayingRef.current) {
            await Updates.reloadAsync();
          }
        }
      } catch {
        // Ignore transient offline or update check errors
      } finally {
        checkingUpdateRef.current = false;
      }
    };

    void checkAndApplyUpdate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkAndApplyUpdate();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const hideNavigation = () => { void NavigationBar.setVisibilityAsync('hidden').catch(error => console.warn('[NavigationBar]', error)); };
    hideNavigation();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') hideNavigation(); });
    return () => listener.remove();
  }, []);

  const pillBottom = isIOS ? Math.max(insets.bottom, 22) : androidBottomInset(insets.bottom);
  const pillHeight = isIOS ? 55 : ANDROID_BOTTOM_BAR_HEIGHT;

  let miniPlayerBottom: number;

  if (isPlaylist || isChurches || isMember || isMyProfile) {
    // Playlist, Churches & Profile pages have no bottom tab bar or tool bar at all
    miniPlayerBottom = pillBottom;
  } else if (isIOS && !isHymn) {
    // On iPhone, iOS tab bar retains its 49pt height at the bottom.
    // On iPadOS, NativeTabs renders as a top floating pill so bottom is clear.
    miniPlayerBottom = isPad ? pillBottom : 49 + insets.bottom;
  } else if (!isIOS && !isHymn) {
    // Flush Android tabs include the safe inset beneath their 64px icon row.
    miniPlayerBottom = insets.bottom + ANDROID_BOTTOM_BAR_HEIGHT;
  } else {
    // Android Tabs and all Hymn Lyrics pages use the floating pill bar
    miniPlayerBottom = pillBottom + pillHeight;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Status bar text colour tracks the APP's theme, not the system theme. */}
      <StatusBar
        style={showFullPlayer || isDarkMode ? 'light' : 'dark'}
        translucent
        backgroundColor="transparent"
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: {
            backgroundColor: isDarkMode ? '#010101' : '#fcf9f2',
          },
        }}
      >
        {/* ── Index / splash screen ─────────────────────────────────────── */}
        <Stack.Screen name="index" options={{ animation: 'none', gestureEnabled: false, fullScreenGestureEnabled: false }} />

        {/* ── Tab group — platform-specific tabs handle internal navigation ────────── */}
        <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false, fullScreenGestureEnabled: false }} />

        {/* ── Hymn detail — has its own sub-layout (hymn/_layout.tsx) ───── */}
        <Stack.Screen name="hymn" options={{ animation: 'fade_from_bottom', gestureEnabled: false, fullScreenGestureEnabled: false }} />

        {/* ── Verified Churches Map & Directory — native iOS push ────────── */}
        <Stack.Screen name="churches" options={{ animation: 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true }} />

        {/* ── Full-screen Member Profile — native iOS push ───────────────── */}
        <Stack.Screen name="member/[id]" options={{ animation: 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true }} />

        {/* ── Full-screen My Profile & Community/Moderation — native iOS push ── */}
        <Stack.Screen name="my-profile" options={{ animation: 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true }} />
      </Stack>

      {/* ── Mini Player — floats above all screens ──────────────────────── */}
      {currentHymnId && (
        <View
          pointerEvents={showFullPlayer ? 'none' : 'auto'}
          accessibilityElementsHidden={showFullPlayer}
          importantForAccessibility={showFullPlayer ? 'no-hide-descendants' : 'auto'}
          onLayout={event => setMiniPlayerHeight(event.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 0, right: 0, bottom: miniPlayerBottom, zIndex: 50, opacity: isIOS ? 1 : (showFullPlayer ? 0 : 1) }}
        >
          <MiniPlayer showWhileExpanded />
        </View>
      )}

      {/* ── Persistent Music Player Overlay ──────────────────────────────────── */}
      {currentHymnId && (
        <MusicPlayer
          visible={showFullPlayer}
          miniPlayerBottom={miniPlayerBottom}
          miniPlayerHeight={miniPlayerHeight}
          hymnId={currentHymnId}
          onClose={() => closeFullPlayer()}
          onViewLyrics={(id) => {
            const target = `/hymn/${id}` as const;
            const action = lyricsNavigation(pathname,id);
            if (action === 'replace') router.replace(target);
            else if (action === 'push') router.push(target);
          }}
        />
      )}

      {/* ── Global Auth & Unified Account/Menu Sheet ─────────────────────── */}
      <AuthSheet />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Newsreader_700Bold_Italic,
    SourceSerif4_500Medium,
    SourceSerif4_600SemiBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      console.error('[RootLayout] Font load error:', fontError);
    }
    if ((fontsLoaded || fontError) && Platform.OS !== 'web') {
      void splashPrevented.finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
    }
  }, [fontsLoaded, fontError]);

  // Handle TrackPlayer's automatic notification click deep link
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('notification.click')) {
        // Prevent Expo Router from navigating to an unmatched route.
        // We just absorb the event so the app comes to foreground.
      }
    });
    return () => subscription.remove();
  }, []);

  // Show branded splash while fonts load (visible on dev reloads & Expo Go)
  if (!fontsLoaded && !fontError) return <BrandedSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <FavoritesProvider>
              <PlaylistsProvider>
                <RecentHymnsProvider>
                  <AuthProvider>
                    <NowPlayingProvider>
                      <HymnFilterProvider>
                        <ThemedStack />
                      </HymnFilterProvider>
                    </NowPlayingProvider>
                  </AuthProvider>
                </RecentHymnsProvider>
              </PlaylistsProvider>
            </FavoritesProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 280,
    height: 280,
  },
});
