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
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useEffect, useRef, useState } from 'react';
import { AppState, View, Image, StyleSheet, useColorScheme, Platform, Linking } from 'react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { PlaylistsProvider } from '../context/PlaylistsContext';
import { RecentHymnsProvider } from '../context/RecentHymnsContext';
import { NowPlayingProvider, useNowPlaying } from '../context/NowPlayingContext';
import { HymnFilterProvider } from '../context/HymnFilterContext';
import { LanguageProvider } from '../context/LanguageContext';
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
// Track success so we only call hideAsync when it's safe.
let splashReady = false;
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync()
    .then(() => { splashReady = true; })
    .catch(() => { });
}

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
  const router = useRouter();
  const pathname = usePathname();
  const { showFullPlayer, closeFullPlayer, currentHymnId, isPlaying } = useNowPlaying();
  const insets = useSafeAreaInsets();
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const checkingUpdateRef = useRef(false);

  const [miniPlayerHeight, setMiniPlayerHeight] = useState(Platform.OS === 'android' ? 74 : 57);
  const isIOS = Platform.OS === 'ios';
  const isPad = isIOS && Boolean((Platform as any).isPad);
  const isPlaylist = pathname.startsWith('/playlist/');
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

  if (isPlaylist) {
    // Playlist page has no bottom tab bar or tool bar at all
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
        style={isDarkMode ? 'light' : 'dark'}
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
      </Stack>

      {/* ── Mini Player — floats above all screens ──────────────────────── */}
      {currentHymnId && (!showFullPlayer || !isIOS) && (
        <View
          pointerEvents={showFullPlayer ? 'none' : 'auto'}
          accessibilityElementsHidden={showFullPlayer}
          importantForAccessibility={showFullPlayer ? 'no-hide-descendants' : 'auto'}
          onLayout={event => setMiniPlayerHeight(event.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 0, right: 0, bottom: miniPlayerBottom, zIndex: 50, opacity: isIOS ? 1 : (showFullPlayer ? 0 : 1) }}
        >
          <MiniPlayer showWhileExpanded={!isIOS} />
        </View>
      )}

      {/* ── Global Music Player Modal ──────────────────────────────────── */}
      {currentHymnId && showFullPlayer && (
        <MusicPlayer
          visible={true}
          miniPlayerBottom={miniPlayerBottom}
          miniPlayerHeight={miniPlayerHeight}
          hymnId={currentHymnId}
          onClose={() => closeFullPlayer()}
          onViewLyrics={(id) => router.push(`/hymn/${id}`)}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === 'ios'
      ? {
          Newsreader_400Regular: require('../assets/fonts/ios/NewYork-Regular.ttf'),
          Newsreader_400Regular_Italic: require('../assets/fonts/ios/NewYork-RegularItalic.ttf'),
          Newsreader_500Medium: require('../assets/fonts/ios/NewYork-Medium.ttf'),
          Newsreader_600SemiBold: require('../assets/fonts/ios/NewYork-Semibold.ttf'),
          Newsreader_700Bold: require('../assets/fonts/ios/NewYork-Bold.ttf'),
          Newsreader_700Bold_Italic: require('../assets/fonts/ios/NewYork-BoldItalic.ttf'),
          PublicSans_400Regular: require('../assets/fonts/ios/SFProText-Regular.otf'),
          PublicSans_500Medium: require('../assets/fonts/ios/SFProText-Medium.otf'),
          PublicSans_600SemiBold: require('../assets/fonts/ios/SFProText-Semibold.otf'),
          PublicSans_700Bold: require('../assets/fonts/ios/SFProText-Bold.otf'),
        }
      : {
          Newsreader_400Regular,
          Newsreader_400Regular_Italic,
          Newsreader_500Medium,
          Newsreader_600SemiBold,
          Newsreader_700Bold,
          Newsreader_700Bold_Italic,
          PublicSans_400Regular,
          PublicSans_500Medium,
          PublicSans_600SemiBold,
          PublicSans_700Bold,
        }
  );

  useEffect(() => {
    if (fontError) {
      console.error('[RootLayout] Font load error:', fontError);
      if (splashReady) {
        SplashScreen.hideAsync().catch(() => { });
      }
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && splashReady) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

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
                  <NowPlayingProvider>
                    <HymnFilterProvider>
                      <ThemedStack />
                    </HymnFilterProvider>
                  </NowPlayingProvider>
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
