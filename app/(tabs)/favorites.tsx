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
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNowPlaying } from '../../context/NowPlayingContext';

const IS_IOS = Platform.OS === 'ios';

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { currentHymnId } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const { playlists } = usePlaylists();

  // Resolve full hymn objects for saved IDs
  const allHymns = [...hymnsData, ...estribillosData];
  const favoriteHymns = allHymns.filter((h) => favoriteIds.includes(String(h.id)));

  // ── Scroll state ─────────────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const iosScrollRef = useRef<any>(null);

  const handleScrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    iosScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      if (navigation.isFocused()) {
        handleScrollToTop();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // ── Android / web: collapsible header ─────────────────────────────────────
  const [headerH, setHeaderH] = useState(0);
  const headerTranslate = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerHidden = useRef(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;

    if (y < 5 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      lastScrollY.current = y;
      return;
    }

    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 3) return;

    if (dy > 0 && !headerHidden.current && y > 10) {
      headerHidden.current = true;
      Animated.timing(headerTranslate, {
        toValue: -headerH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else if (dy < 0 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  };

  // ── iOS: scroll-driven fade-out ───────────────────────────────────────────
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
      {/* Sub Tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity 
          style={[styles.subTabItem, activeTab === 'favorites' && styles.subTabActive]} 
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.subTabText, { color: activeTab === 'favorites' ? theme.primary : theme.onSurfaceVariant }]}>
            {t.myFavorites}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.subTabItem, activeTab === 'playlists' && styles.subTabActive]} 
          onPress={() => setActiveTab('playlists')}
        >
          <Text style={[styles.subTabText, { color: activeTab === 'playlists' ? theme.primary : theme.onSurfaceVariant }]}>
            {t.playlistsTitle}
          </Text>
        </TouchableOpacity>
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
                    router.push(`/playlist/${playlist.id}`);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.primary + '1A', width: 44, height: 44, borderRadius: 10, marginRight: 8 }]}>
                    <MaterialIcons name="queue-music" size={24} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.onSurface, fontFamily: 'PublicSans_600SemiBold', fontSize: 17 }]}>
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

      <View style={{ height: bottomClearance }} />
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // iOS LAYOUT — fade-out title + Animated.ScrollView
  // ══════════════════════════════════════════════════════════════════════════
  if (IS_IOS) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        {/* Fade-out header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + 16,
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
            isDarkMode ? 'rgba(1,1,1,0.0)'  : 'rgba(250,245,238,0.0)',
          ]}
          style={[styles.statusBarScrim, { height: insets.top + 28 }]}
          pointerEvents="none"
        />

        <Animated.ScrollView
          ref={(ref: any) => { iosScrollRef.current = ref?.getNode?.() ?? ref; }}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {scrollContent}
        </Animated.ScrollView>

      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANDROID / WEB LAYOUT — collapsible header
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* Collapsible TopAppBar */}
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text
            style={[styles.headerTitle, { color: theme.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            Himnario El Buen Pastor
          </Text>
        </View>
      </Animated.View>

      {/* ── Status Bar Scrim ──────────────────────────────────── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)'  : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingTop: headerH + 8 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {scrollContent}
        </ScrollView>
      </SafeAreaView>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
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
    borderBottomWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  subTabActive: {
    borderColor: '#6e1619',
  },
  subTabText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
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
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: 8,
  },
  pageSubhead: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
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
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: fonts.bold,
    fontSize: 22,
    width: 56,
    textAlign: 'center',
  },
  listTitle: {
    fontFamily: fonts.regularItalic,
    fontSize: 19,
    marginBottom: 2,
  },
  listTags: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
