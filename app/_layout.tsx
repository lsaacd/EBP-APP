/**
 * RootLayout component — The entry point for the application's routing and global providers.
 *
 * Responsibility:
 * - Loads custom fonts (Newsreader and Public Sans).
 * - Manages the native splash screen visibility.
 * - Wraps the application in global context providers (Theme, Language, Favorites, Recents).
 * - Defines the application's navigation stack with custom transitions.
 * - Tab screens live inside the (tabs) group with NativeTabs (iOS liquid glass).
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
  Newsreader_700Bold,
  Newsreader_700Bold_Italic,
} from '@expo-google-fonts/newsreader';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useEffect } from 'react';
import { View, Image, StyleSheet, useColorScheme, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { PlaylistsProvider } from '../context/PlaylistsContext';
import { RecentHymnsProvider } from '../context/RecentHymnsContext';
import { NowPlayingProvider, useNowPlaying } from '../context/NowPlayingContext';
import { LanguageProvider } from '../context/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import MiniPlayer from '../components/MiniPlayer';
import MusicPlayer from '../components/MusicPlayer';

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
  const { showFullPlayer, closeFullPlayer, currentHymnId } = useNowPlaying();

  // On iOS, adjust mini-player bottom to close the gap based on the active screen
  let miniPlayerBottom = 90;
  if (Platform.OS === 'ios') {
    if (pathname === '/available-songs') {
      miniPlayerBottom = 20;
    } else if (pathname.startsWith('/hymn/')) {
      // floatPill top is 32 + 56 = 88. miniPlayer paddingBottom is 8.
      // So 82 + 8 = 90. 2px gap to floatPill.
      miniPlayerBottom = 82;
    } else {
      // For tabs, native tab bar is ~83.
      // 75 + 8 = 83. 0px gap to TabBar.
      miniPlayerBottom = 75;
    }
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

        {/* ── Tab group — NativeTabs handles internal navigation ────────── */}
        <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false, fullScreenGestureEnabled: false }} />

        {/* ── Hymn detail — has its own sub-layout (hymn/_layout.tsx) ───── */}
        <Stack.Screen name="hymn" options={{ animation: 'fade_from_bottom', gestureEnabled: false, fullScreenGestureEnabled: false }} />
        <Stack.Screen name="available-songs" options={{ animation: 'fade_from_bottom', gestureEnabled: false, fullScreenGestureEnabled: false }} />
      </Stack>

      {/* ── Mini Player — floats above all screens ──────────────────────── */}
      {currentHymnId && !showFullPlayer && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: miniPlayerBottom, zIndex: 50 }}>
          <MiniPlayer />
        </View>
      )}

      {/* ── Global Music Player Modal ──────────────────────────────────── */}
      {currentHymnId && showFullPlayer && (
        <MusicPlayer
          visible={true}
          hymnId={currentHymnId}
          onClose={() => closeFullPlayer()}
          onViewLyrics={(id) => router.push(`/hymn/${id}`)}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_700Bold,
    Newsreader_700Bold_Italic,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

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
                  <ThemedStack />
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
