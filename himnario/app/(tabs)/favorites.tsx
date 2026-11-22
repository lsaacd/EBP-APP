/**
 * FavoritesScreen component — Manages and displays the user's bookmarked hymns.
 *
 * Responsibility:
 * - Retrieves favorite hymn IDs from the FavoritesContext.
 * - Resolves IDs to full hymn objects for display.
 * - Provides an interface for browsing and removing favorites.
 * - Handles empty states with a call-to-action to explore hymns.
 *
 * @returns {React.JSX.Element} The rendered Favorites screen.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNowPlaying } from '../../context/NowPlayingContext';
import TabSwipeWrapper from '../../components/TabSwipeWrapper';

const IS_IPAD = Platform.OS === 'ios' && Boolean((Platform as any).isPad);
const SYSTEM_FONT = Platform.OS === 'ios' ? undefined : 'sans-serif';

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const { currentHymnId } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const { playlists } = usePlaylists();

  // Resolve full hymn objects for saved IDs
  const allHymns = [...hymnsData, ...estribillosData];
  const favoriteHymns = allHymns
    .filter((h) => favoriteIds.includes(String(h.id)))
    .map((h) => getLocalizedHymn(h, hymnLanguage));

  // ── Scroll state ─────────────────────────────────────────────────────────
  const scrollViewRef = useRef<any>(null);

  const handleScrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) {
        handleScrollToTop();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // ── Shared iOS & Android scroll-driven fade-out header (matches Settings & Home) ──
  const scrollY = useRef(new Animated.Value(0)).current;

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, -1],
    extrapolate: 'clamp',
  });

  // ── Shared scroll content ─────────────────────────────────────────────────
  const scrollContent = (
    <>
      {/* Sub Tabs (matching Himnos / Estribillos / Índice underlined tab style with native SF Pro / Roboto) */}
      <View style={styles.subTabBar}>
        {(
          [
            { key: 'favorites', label: t.myFavorites },
            { key: 'playlists', label: t.playlistsTitle },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.subTabItem}
              onPress={() => {
                if (activeTab === tab.key) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  active && styles.subTabActiveText,
                  { color: active ? theme.primary : theme.onSurfaceVariant },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {tab.label}
              </Text>
              {active && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Title */}
      <View style={styles.pageHeader}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '0D' }]}>
          <MaterialIcons name={activeTab === 'favorites' ? "bookmark" : "library-music"} size={32} color={theme.primary} />
        </View>
        <Text style={[styles.pageTitle, { color: theme.primary }]}>
          {activeTab === 'favorites' ? t.myFavorites : t.playlistsTitle}
        </Text>
        <Text style={[styles.pageSubhead, { color: theme.onSurfaceVariant }]}>
          {activeTab === 'favorites'
            ? (favoriteHymns.length > 0
                ? `${favoriteHymns.length} ${favoriteHymns.length !== 1 ? t.hymnsSaved_other : t.hymnsSaved_one}`
                : t.savedForQuickAccess)
            : (playlists.length > 0
                ? `${playlists.length} ${playlists.length !== 1 ? t.playlistsCount_other : t.playlistsCount_one}`
                : t.yourCustomPlaylists)}
        </Text>
      </View>

      {activeTab === 'favorites' ? (
        favoriteHymns.length === 0 ? (
          /* ─── Empty State Favorites ─────────────────────────────────────────────── */
          <View style={styles.emptyState}>
            <MaterialIcons
              name="bookmark-border"
              size={64}
              color={theme.surfaceVariants.containerHighest}
              style={{ marginBottom: 24 }}
            />
            <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
              {t.noFavoritesYet}
            </Text>
            <TouchableOpacity
              style={[styles.goBtn, { backgroundColor: theme.surfaceVariants.containerLow }]}
              onPress={() => router.push('/hymns')}
            >
              <Text style={[styles.goBtnText, { color: theme.primary }]}>
                {t.exploreHymns}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── Favorites List ──────────────────────────────────────────── */
          <View>
            {favoriteHymns.map((hymn) => (
              <View key={hymn.id}>
                <TouchableOpacity
                  style={styles.listItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/hymn/${hymn.id}`);
                  }}
                >
                  <Text
                    style={[styles.listNum, { color: theme.primary, opacity: 0.45 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {hymn.number}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.onSurface }]}>
                      {hymn.title}
                    </Text>
                    {hymn.categories ? (
                      <Text style={[styles.listTags, { color: theme.outline }]}>
                        {translateCategories(hymn.categories, language)}
                      </Text>
                    ) : null}
                  </View>
                  {/* Remove from favorites */}
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleFavorite(String(hymn.id));
                    }}
                  >
                    <MaterialIcons name="bookmark" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '30' }]} />
              </View>
            ))}
          </View>
        )
      ) : (
        playlists.length === 0 ? (
          /* ─── Empty State Playlists ─────────────────────────────────────────────── */
          <View style={styles.emptyState}>
            <MaterialIcons
              name="library-music"
              size={64}
              color={theme.surfaceVariants.containerHighest}
              style={{ marginBottom: 24 }}
            />
            <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
              {t.noPlaylistsYet}
            </Text>
          </View>
        ) : (
          /* ─── Playlists List ──────────────────────────────────────────── */
          <View>
            {playlists.map((playlist) => (
              <View key={playlist.id}>
                <TouchableOpacity
                  style={styles.listItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // @ts-ignore
                    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } });
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.primary + '1A', width: 44, height: 44, borderRadius: 10, marginRight: 8 }]}>
                    <MaterialIcons name="queue-music" size={24} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.onSurface, ...fonts.sansSemiBold, fontSize: 17 }]}>
                      {playlist.name}
                    </Text>
                    <Text style={[styles.listTags, { color: theme.outline, textTransform: 'none' }]}>
                      {playlist.hymnIds.length} {playlist.hymnIds.length === 1 ? t.songCount_one : t.songCount_other}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.outline} />
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '30' }]} />
              </View>
            ))}
          </View>
        )
      )}

      {/* ── Scripture Quote ────────────────────────────────────── */}
      <View style={styles.quoteBlock}>
        <MaterialIcons name="auto-awesome" size={36} color={theme.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.quoteText, { color: theme.onSurface }]}>
          {t.favoritesQuoteText}
        </Text>
        <Text style={[styles.quoteAuthor, { color: theme.outline }]}>
          {t.favoritesQuoteAuthor}
        </Text>
      </View>

      <View style={{ height: bottomClearance }} />
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED LAYOUT — transparent fade-out title + Animated.ScrollView
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <TabSwipeWrapper currentTab="favorites" style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Fade-out header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + ipadTopOffset + 16,
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[styles.headerTitle, { color: theme.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          Himnario El Buen Pastor
        </Text>
      </Animated.View>

      {/* ── Status Bar Scrim ──────────────────────────────────── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + ipadTopOffset + 28 }]}
        pointerEvents="none"
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + ipadTopOffset + 64 },
          IS_IPAD && styles.tabletCenter,
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        indicatorStyle={isDarkMode ? 'white' : 'black'}
      >
        {scrollContent}
      </Animated.ScrollView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  tabletCenter: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    ...fonts.bold,
    fontSize: 31,
    lineHeight: 40,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  subTabBar: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#0000001A',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  subTabText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '500',
    fontSize: 15.5,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subTabActiveText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 3,
  },
  pageHeader: {
    marginBottom: 48,
    alignItems: 'center',
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
    ...fonts.bold,
    fontSize: 34,
    marginBottom: 8,
  },
  pageSubhead: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '400',
    fontSize: 15.5,
    letterSpacing: -0.15,
    textAlign: 'center',
    opacity: 0.8,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  goBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 20,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listNum: {
    ...fonts.bold,
    fontSize: 22,
    width: 56,
    textAlign: 'center',
  },
  listTitle: {
    ...fonts.regularItalic,
    fontSize: 19,
    marginBottom: 2,
  },
  listTags: {
    ...fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  quoteBlock: {
    alignItems: 'center',
    paddingVertical: 80,
    opacity: 0.3,
  },
  quoteText: {
    ...fonts.regularItalic,
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
    lineHeight: 26,
  },
  quoteAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
