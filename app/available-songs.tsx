/**
 * AvailableSongsScreen component — Displays a list of hymns that have associated audio.
 *
 * Responsibility:
 * - Filters the hymn collection to only show those with a valid `audioUrl`.
 * - Provides an interface for browsing and playing these hymns.
 * - Integrates native sharing/linking for audio playback.
 * - Uses a collapsible header pattern for a modern feel.
 *
 * @returns {React.JSX.Element} The rendered Available Songs screen.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { fonts } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';

import { useNowPlaying } from '../context/NowPlayingContext';
import { hasHymnAudio } from '../data/audioRegistry';
import { useLanguage } from '../context/LanguageContext';

// ─── Hymn shape (mirrors alabanzasPaginas.js) ────────────────────────────────
export interface Hymn {
  id: string;
  number: number | string;
  title: string;
  categories: string;
  author: string;
  reference: string;
  lyrics: string;
  audioUrl?: string;       // optional — not every hymn has audio
  audioCredit?: {
    name: string;
    url: string;
  };
}

// ─── Helper — checks the audioRegistry for bundled MP3s ─────────────────────
export const hasAudio = (hymn: any): boolean =>
  hasHymnAudio(String(hymn.id));

// Only hymns with a registered audio file appear on this page
const allHymns = [...hymnsData, ...estribillosData] as Hymn[];
const songsWithAudio = allHymns.filter(hasAudio);

// Sacred Ink burgundy (matches ACTIVE_COLOR in BottomNavBar)
const BURGUNDY = '#6e1619';

// ─── Tab config for the standalone bottom nav bar ────────────────────────────
// This screen lives outside (tabs), so we render our own nav bar that
// visually matches the platform-specific tab bar and navigates back.
type IconName = ComponentProps<typeof MaterialIcons>['name'];
const TAB_ITEMS: { label_es: string; label_en: string; icon: IconName; route: string }[] = [
  { label_es: 'Inicio',    label_en: 'Home',      icon: 'home',      route: '/home' },
  { label_es: 'Himnos',    label_en: 'Hymns',     icon: 'menu-book', route: '/hymns' },
  { label_es: 'Favoritos', label_en: 'Favorites', icon: 'bookmark',  route: '/favorites' },
  { label_es: 'Ajustes',   label_en: 'Settings',  icon: 'settings',  route: '/settings' },
];
const IS_IOS = Platform.OS === 'ios';
const PILL_RADIUS = 50;

export default function AvailableSongsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [headerH, setHeaderH] = useState(insets.top + 56);


  // ── Music Player via global context ────────────────────────────
  const { openPlayer, currentHymnId } = useNowPlaying();

  // ── Scroll arrow state ───────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollLastOffset = useRef(0);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  const handleScrollArrows = (currentOffset: number) => {
    const isFarDown = currentOffset > 300;
    const isScrollingUp = currentOffset < scrollLastOffset.current - 10;
    const isScrollingDown = currentOffset > scrollLastOffset.current + 10;

    if (isFarDown && isScrollingUp) {
      setShowScrollTop(true);
      setShowScrollBottom(false);
    } else if (isScrollingDown || !isFarDown) {
      setShowScrollTop(false);
    }

    const maxY = contentHeight.current - scrollViewHeight.current;
    const isNearBottom = maxY > 0 && currentOffset >= maxY - 50;
    if (isFarDown && isScrollingDown && !isNearBottom) {
      setShowScrollBottom(true);
      setShowScrollTop(false);
    } else if (isScrollingUp || isNearBottom) {
      setShowScrollBottom(false);
    }

    scrollLastOffset.current = currentOffset;
  };

  const handleScrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setShowScrollTop(false);
  };

  const handleScrollToBottom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const maxY = contentHeight.current - scrollViewHeight.current;
    if (maxY > 0) {
      scrollRef.current?.scrollTo({ y: maxY, animated: true });
    }
    setShowScrollBottom(false);
  };

  // ── Collapsible header ─────────────────────────────────────────────────────
  const headerTranslate = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerHidden = useRef(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;

    // Drive scroll arrows
    handleScrollArrows(y);

    if (y < 5 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      lastScrollY.current = y;
      return;
    }

    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 3) return;

    if (dy > 0 && !headerHidden.current && y > 10) {
      headerHidden.current = true;
      Animated.timing(headerTranslate, { toValue: -headerH, duration: 220, useNativeDriver: true }).start();
    } else if (dy < 0 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  };

  const handlePlay = (hymn: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openPlayer(String(hymn.id));
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* ─── Collapsible TopAppBar ─────────────────────────────── */}
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={theme.primary} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.primary }]}
            numberOfLines={1}
          >
            Himnario El Buen Pastor
          </Text>
          {/* spacer to balance back button */}
          <View style={{ width: 38 }} />
        </View>
      </Animated.View>

      {/* ── Status Bar Scrim ────────────────────────────────────────────── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)'  : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* ─── Scrollable Content ─────────────────────────────────── */}
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingTop: headerH + 20 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'ios'}
          onContentSizeChange={(_w, h) => { contentHeight.current = h; }}
          onLayout={(e) => { scrollViewHeight.current = e.nativeEvent.layout.height; }}
        >
          {/* ─── Page Header ────────────────────────────────────── */}
          <View style={styles.pageHeader}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primary + '12' }]}>
              <MaterialIcons name="music-note" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.pageTitle, { color: theme.primary }]}>
              {t.availableSongsTitle}
            </Text>
            <Text style={[styles.pageSubhead, { color: theme.onSurfaceVariant }]}>
              {t.availableSongsSubTitle}
            </Text>
          </View>

          {/* ─── Hymn List ──────────────────────────────────────── */}
          {songsWithAudio.length === 0 ? (
            /* ── Empty state ── */
            <View style={styles.emptyState}>
              <MaterialIcons
                name="music-off"
                size={64}
                color={theme.surfaceVariants.containerHighest}
                style={{ marginBottom: 24 }}
              />
              <Text style={[styles.emptyTitle, { color: theme.onSurfaceVariant }]}>
                {t.noSongsYet}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.outline }]}>
                {t.noSongsBody}
              </Text>
            </View>
          ) : (
            <View>
              {songsWithAudio.map((hymn) => (
                <React.Fragment key={hymn.id}>
                  <TouchableOpacity
                    style={styles.listItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/hymn/${hymn.id}`);
                    }}
                  >
                    {/* Number badge */}
                    <Text
                      style={[styles.listNum, { color: theme.primary }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {hymn.number}
                    </Text>

                    {/* Title + tags */}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listTitle, { color: theme.onSurface }]}>
                        {hymn.title}
                      </Text>
                      <Text style={[styles.listTags, { color: theme.onSurfaceVariant, opacity: 0.7 }]}>
                        {hymn.categories}
                      </Text>
                    </View>

                    {/* Play button — only shown when hasAudio is true (always true here) */}
                    <TouchableOpacity
                      style={[
                        styles.playBtn,
                        {
                          backgroundColor: isDarkMode ? '#2A2A2A' : BURGUNDY,
                          shadowColor: isDarkMode ? 'transparent' : BURGUNDY,
                          shadowOpacity: isDarkMode ? 0 : 0.35,
                        }
                      ]}
                      onPress={() => handlePlay(hymn)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Lightweight divider — avoids per-item LinearGradient for scroll perf */}
                  <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '1A' }]} />
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Bottom clearance so content doesn't hide behind the nav bar */}
          <View style={{ height: (IS_IOS ? insets.bottom + 80 : 140) + (currentHymnId ? 80 : 0) }} />
        </ScrollView>
      </SafeAreaView>

      {/* ─── Bottom Navigation Bar (Android only) ────────────────────── */}
      {/* iOS uses the native back gesture / back arrow — no fake tab bar
          needed, which avoids a jarring switch vs the real NativeTabs bar. */}
      {!IS_IOS && (
        <StandaloneNavBar
          router={router}
          theme={theme}
          isDarkMode={isDarkMode}
          t={t}
          insets={insets}
        />
      )}

      {/* ─── Scroll-to-Bottom (left) ─── */}
      {showScrollBottom && (
        <TouchableOpacity
          style={[
            styles.scrollTopBtn,
            {
              backgroundColor: theme.primary + 'D9',
              bottom: insets.bottom + (currentHymnId ? 100 : 20) + (IS_IOS ? 0 : 50),
              left: 20,
              right: undefined,
            }
          ]}
          onPress={handleScrollToBottom}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-down" size={30} color={theme.onPrimary} />
        </TouchableOpacity>
      )}

      {/* ─── Scroll-to-Top (right) ─── */}
      {showScrollTop && (
        <TouchableOpacity
          style={[
            styles.scrollTopBtn,
            {
              backgroundColor: theme.primary + 'D9',
              bottom: insets.bottom + (currentHymnId ? 100 : 20) + (IS_IOS ? 0 : 50),
            }
          ]}
          onPress={handleScrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={30} color={theme.onPrimary} />
        </TouchableOpacity>
      )}

    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// StandaloneNavBar — Platform-split bottom navigation for non-tab screens.
//
// iOS:     Native UITabBar replica (solid background, full-width, hairline border)
//          Matches the NativeTabs config from (tabs)/_layout.tsx.
// Android: Floating glassmorphism pill (matches FloatingPillBar).
//
// Since available-songs lives outside the (tabs) group, we render our own
// visually-identical nav bar and use router.replace() to navigate back.
// ═══════════════════════════════════════════════════════════════════════════════
function StandaloneNavBar({
  router,
  theme,
  isDarkMode,
  t,
  insets,
}: {
  router: any;
  theme: any;
  isDarkMode: boolean;
  t: any;
  insets: any;
}) {
  // All tabs are shown as inactive since this screen isn't one of the 4 tabs
  const INACTIVE_COLOR = isDarkMode ? 'rgba(243,240,234,0.55)' : 'rgba(28,28,24,0.45)';

  // Map translated labels to each tab
  const labels = [t.tabHome, t.tabHymns, t.tabFavorites, t.tabSettings];

  const handleTabPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(route);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // iOS: Native UITabBar replica
  // Matches NativeTabs config: solid background, tintColor, SF-style layout.
  // backgroundColor: '#ffffff' light / '#010101' dark
  // tintColor: theme.primary light / '#ffffff' dark
  // ──────────────────────────────────────────────────────────────────────────
  if (IS_IOS) {
    return (
      <View
        style={[
          navStyles.iosBar,
          {
            backgroundColor: isDarkMode ? '#010101' : '#ffffff',
            borderTopColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {TAB_ITEMS.map((tab, i) => (
          <TouchableOpacity
            key={tab.route}
            style={navStyles.iosTabItem}
            activeOpacity={0.7}
            onPress={() => handleTabPress(tab.route)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={labels[i]}
          >
            <MaterialIcons name={tab.icon} size={26} color={INACTIVE_COLOR} />
            <Text style={[navStyles.iosLabel, { color: INACTIVE_COLOR }]}>
              {labels[i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Android: Floating glassmorphism pill
  // Matches FloatingPillBar from (tabs)/_layout.tsx.
  // ──────────────────────────────────────────────────────────────────────────
  const glassTint = isDarkMode
    ? 'rgba(1,1,1,0.88)'
    : 'rgba(252,249,242,0.92)';
  const borderColor = isDarkMode
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(255,255,255,0.50)';
  const pillBottom = Math.max(insets.bottom, 22);

  return (
    <View style={navStyles.overlay} pointerEvents="box-none">
      <View
        style={[navStyles.pillShadow, { bottom: pillBottom }]}
        pointerEvents="auto"
      >
        <View style={[navStyles.pillClip, { borderColor }]}>
          {/* Glass tint background (Android has no blur, tint IS the bg) */}
          <View
            style={[
              StyleSheet.absoluteFill,
              navStyles.blurSelf,
              { backgroundColor: glassTint },
            ]}
          />
          {/* Tab row */}
          <View style={navStyles.tabRow}>
            {TAB_ITEMS.map((tab, i) => (
              <TouchableOpacity
                key={tab.route}
                style={navStyles.tabItem}
                activeOpacity={0.7}
                onPress={() => handleTabPress(tab.route)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={labels[i]}
              >
                <MaterialIcons name={tab.icon} size={28} color={INACTIVE_COLOR} />
                <Text
                  style={[navStyles.label, { color: INACTIVE_COLOR }]}
                  numberOfLines={1}
                >
                  {labels[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>{/* end pillClip */}
      </View>{/* end pillShadow */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },

  scroll: { paddingHorizontal: 16 },

  // Page header
  pageHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 30,
    marginBottom: 6,
  },
  pageSubhead: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
  },

  // List
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 20,
  },
  listNum: {
    fontFamily: fonts.bold,
    fontSize: 22,
    width: 56,
    textAlign: 'center',
  },
  listTitle: {
    fontFamily: fonts.regularItalic,
    fontSize: 19,
    marginBottom: 3,
    lineHeight: 25,
  },
  listTags: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: { height: 1, width: '100%' },

  // Play button
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // Subtle lift
    shadowColor: '#6e1619',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyBody: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollTopBtn: {
    position: 'absolute',
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',  
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
});

// ── Navigation bar styles (StandaloneNavBar) ───────────────────────────────────
const navStyles = StyleSheet.create({
  // ── iOS: Native UITabBar replica (full-width, solid background) ─────
  iosBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  iosTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iosLabel: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 10,
    letterSpacing: 0,
  },

  // ── Android: Floating glass pill ──────────────────────────────────────────
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pillShadow: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  pillClip: {
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  blurSelf: {
    borderRadius: PILL_RADIUS,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
