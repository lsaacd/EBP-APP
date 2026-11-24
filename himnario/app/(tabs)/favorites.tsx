/**
 * FavoritesScreen — Apple Music–inspired Liquid Glass Favorites & Playlists hub.
 *
 * - Spring-sliding iOS Liquid Glass segmented control (Mis Favoritos / Listas)
 * - Top-right Liquid Glass action capsule (Search, Sort MenuView, + New Playlist)
 * - 1-tap Play & Shuffle hero pills wired to the active Favorites playback queue
 * - Tapping any favorite opens its lyrics with `source: 'favorites'` so skipping
 *   audio and flipping pages both stay inside Favorites
 * - Create New Playlist bottom sheet with Glorify backdrop swipe-down
 */
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuView } from '@react-native-menu/menu';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { hasHymnAudio } from '../../data/audioRegistry';
import { fonts } from '../../theme/theme';
import * as Haptics from '../../utils/haptics';
import { useNowPlaying } from '../../context/NowPlayingContext';
import TabSwipeWrapper from '../../components/TabSwipeWrapper';
import GlassSurface from '../../components/GlassSurface';
import AppMenuIcon from '../../components/AppMenuIcon';
import SheetGrabber from '../../components/SheetGrabber';
import { buildSheetBackdropGesture, buildSheetPanGesture } from '../../utils/useSheetBackdropGesture';

const IS_IOS = Platform.OS === 'ios';
const IS_IPAD = IS_IOS && Boolean((Platform as any).isPad);

type FavSort = 'recent' | 'number' | 'alpha';
type PlaylistSort = 'recent' | 'alpha' | 'count';

function numericOrder(id: string): number {
  const clean = String(id);
  const isChorus = clean.startsWith('E');
  const num = parseInt(clean.replace(/[^\d]/g, ''), 10) || 0;
  return (isChorus ? 10000 : 0) + num;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { playlists, createPlaylist } = usePlaylists();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const { currentHymnId, isPlaying, openPlayer } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 150 : 90);

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [favSort, setFavSort] = useState<FavSort>('recent');
  const [playlistSort, setPlaylistSort] = useState<PlaylistSort>('recent');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Playlist sheet state
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const createTravel = Math.max(260, Math.round(screenHeight * 0.42));
  const createProgress = useSharedValue(1);
  const createDragOrigin = useSharedValue(0);

  const finishCloseCreateSheet = useCallback(() => {
    setCreateOpen(false);
    setNewPlaylistName('');
  }, []);

  const closeCreateSheet = useCallback(() => {
    createProgress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    setTimeout(finishCloseCreateSheet, 220);
  }, [createProgress, finishCloseCreateSheet]);

  const openCreateSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewPlaylistName('');
    createProgress.value = 1;
    setCreateOpen(true);
    requestAnimationFrame(() => {
      createProgress.value = withSpring(0, { damping: 28, stiffness: 250, mass: 0.9, overshootClamping: true });
    });
  }, [createProgress]);

  const createBackdropPan = useMemo(
    () =>
      buildSheetBackdropGesture({
        progress: createProgress,
        dragOrigin: createDragOrigin,
        travel: createTravel,
        enabled: createOpen,
        onTapClose: closeCreateSheet,
        onFinishDismiss: finishCloseCreateSheet,
      }),
    [createProgress, createDragOrigin, createTravel, createOpen, closeCreateSheet, finishCloseCreateSheet],
  );
  const createHeaderPan = useMemo(
    () =>
      buildSheetPanGesture({
        progress: createProgress,
        dragOrigin: createDragOrigin,
        travel: createTravel,
        enabled: createOpen,
        onFinishDismiss: finishCloseCreateSheet,
      }),
    [createProgress, createDragOrigin, createTravel, createOpen, finishCloseCreateSheet],
  );
  const createBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(createProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));
  const createSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: createProgress.value * createTravel }],
  }));

  const handleCreatePlaylist = useCallback(() => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPlaylist(trimmed);
    closeCreateSheet();
  }, [newPlaylistName, createPlaylist, closeCreateSheet]);

  // ── Sliding Liquid Glass segmented control state ──────────────────────────
  const [segWidth, setSegWidth] = useState(0);
  const segIndex = useSharedValue(0);
  useEffect(() => {
    segIndex.value = withSpring(activeTab === 'favorites' ? 0 : 1, {
      damping: 22,
      stiffness: 260,
      mass: 0.72,
    });
  }, [activeTab, segIndex]);

  const segThumbStyle = useAnimatedStyle(() => {
    const pad = 4;
    const thumbW = segWidth > 0 ? (segWidth - pad * 2) / 2 : 0;
    return {
      width: thumbW,
      transform: [{ translateX: segIndex.value * thumbW }],
      opacity: thumbW > 0 ? 1 : 0,
    };
  }, [segWidth]);

  // ── Data resolution & sorting ─────────────────────────────────────────────
  const allHymnsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const h of hymnsData) map.set(String(h.id), h);
    for (const e of estribillosData) map.set(String(e.id), e);
    return map;
  }, []);

  const favoriteHymns = useMemo(() => {
    // Preserve favoriteIds order (newest added last → reverse for 'recent')
    const base = favoriteIds
      .map((id) => allHymnsMap.get(String(id)))
      .filter(Boolean)
      .map((h) => getLocalizedHymn(h, hymnLanguage));

    const sorted = [...base];
    if (favSort === 'recent') {
      sorted.reverse();
    } else if (favSort === 'number') {
      sorted.sort((a, b) => numericOrder(String(a.id)) - numericOrder(String(b.id)));
    } else if (favSort === 'alpha') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (h) =>
        String(h.number).toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q) ||
        (h.categories && h.categories.toLowerCase().includes(q)),
    );
  }, [favoriteIds, allHymnsMap, hymnLanguage, favSort, searchQuery]);

  const sortedFavoriteQueueIds = useMemo(
    () => favoriteHymns.map((h) => String(h.id)),
    [favoriteHymns],
  );

  const playableFavoriteIds = useMemo(
    () => sortedFavoriteQueueIds.filter(hasHymnAudio),
    [sortedFavoriteQueueIds],
  );

  const sortedPlaylists = useMemo(() => {
    const list = [...playlists];
    if (playlistSort === 'recent') {
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (playlistSort === 'alpha') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (playlistSort === 'count') {
      list.sort((a, b) => b.hymnIds.length - a.hymnIds.length);
    }
    return list;
  }, [playlists, playlistSort]);

  // ── 1-Tap Play / Shuffle Favorites ────────────────────────────────────────
  const handlePlayFavorites = useCallback(
    (shuffle: boolean) => {
      if (playableFavoriteIds.length === 0) {
        Alert.alert(t.myFavorites, t.favoritesNoAudioAlert);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const startId = shuffle
        ? playableFavoriteIds[Math.floor(Math.random() * playableFavoriteIds.length)]
        : playableFavoriteIds[0];
      openPlayer(startId, sortedFavoriteQueueIds, { label: t.myFavorites, shuffle });
    },
    [playableFavoriteIds, sortedFavoriteQueueIds, openPlayer, t.myFavorites, t.favoritesNoAudioAlert],
  );

  const handlePlaySingleFavorite = useCallback(
    (hymnId: string) => {
      if (!hasHymnAudio(hymnId)) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openPlayer(hymnId, sortedFavoriteQueueIds, { label: t.myFavorites, shuffle: false });
    },
    [sortedFavoriteQueueIds, openPlayer, t.myFavorites],
  );

  // ── Scroll state ──────────────────────────────────────────────────────────
  const scrollViewRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) handleScrollToTop();
    });
    return unsubscribe;
  }, [navigation]);

  const cardSurface = isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '45';
  const subtlePillBg = isDarkMode ? 'rgba(255,255,255,0.10)' : theme.primary + '12';

  const scrollContent = (
    <>
      {/* ── Top Title Row + Apple Music–style Liquid Glass Action Capsule ── */}
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.largeTitle, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {activeTab === 'favorites' ? t.myFavorites : t.playlistsTitle}
          </Text>
          <Text style={[styles.largeSubtitle, { color: theme.onSurfaceVariant }]}>
            {activeTab === 'favorites'
              ? favoriteIds.length > 0
                ? `${favoriteIds.length} ${favoriteIds.length !== 1 ? t.hymnsSaved_other : t.hymnsSaved_one}`
                : t.savedForQuickAccess
              : playlists.length > 0
                ? `${playlists.length} ${playlists.length !== 1 ? t.playlistsCount_other : t.playlistsCount_one}`
                : t.yourCustomPlaylists}
          </Text>
        </View>

        {/* Liquid Glass Action Capsule */}
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={56}
          style={[
            styles.actionCapsule,
            !IS_IOS && {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.09)' : theme.surfaceVariants.containerLow,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: cardBorder,
            },
          ]}
        >
          {activeTab === 'playlists' ? (
            <Pressable
              onPress={openCreateSheet}
              accessibilityRole="button"
              accessibilityLabel={t.playlistsNewTitle}
              style={({ pressed }) => [styles.capsuleBtn, pressed && { opacity: 0.65 }]}
            >
              <AppMenuIcon ios="plus" android="add" size={20} color={theme.primary} weight="semibold" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSearchOpen((prev) => {
                  if (prev) setSearchQuery('');
                  return !prev;
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={t.favoritesSearchPlaceholder}
              style={({ pressed }) => [styles.capsuleBtn, pressed && { opacity: 0.65 }]}
            >
              <AppMenuIcon
                ios={searchOpen ? 'xmark' : 'magnifyingglass'}
                android={searchOpen ? 'close' : 'search'}
                size={18}
                color={searchOpen ? theme.primary : theme.onSurface}
                weight="semibold"
              />
            </Pressable>
          )}

          <View
            style={[
              styles.capsuleDivider,
              { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(110,22,25,0.12)' },
            ]}
          />

          <MenuView
            title={t.favoritesSortTitle}
            themeVariant={isDarkMode ? 'dark' : 'light'}
            shouldOpenOnLongPress={false}
            actions={
              activeTab === 'favorites'
                ? [
                    {
                      id: 'recent',
                      title: t.favoritesSortRecent,
                      state: favSort === 'recent' ? 'on' : 'off',
                      image: IS_IOS ? 'clock' : undefined,
                    },
                    {
                      id: 'number',
                      title: t.favoritesSortNumber,
                      state: favSort === 'number' ? 'on' : 'off',
                      image: IS_IOS ? 'number' : undefined,
                    },
                    {
                      id: 'alpha',
                      title: t.favoritesSortAZ,
                      state: favSort === 'alpha' ? 'on' : 'off',
                      image: IS_IOS ? 'textformat.abc' : undefined,
                    },
                  ]
                : [
                    {
                      id: 'recent',
                      title: t.playlistsSortRecent,
                      state: playlistSort === 'recent' ? 'on' : 'off',
                      image: IS_IOS ? 'clock' : undefined,
                    },
                    {
                      id: 'alpha',
                      title: t.playlistsSortAZ,
                      state: playlistSort === 'alpha' ? 'on' : 'off',
                      image: IS_IOS ? 'textformat.abc' : undefined,
                    },
                    {
                      id: 'count',
                      title: t.playlistsSortCount,
                      state: playlistSort === 'count' ? 'on' : 'off',
                      image: IS_IOS ? 'list.number' : undefined,
                    },
                  ]
            }
            onPressAction={({ nativeEvent }) => {
              Haptics.selectionAsync();
              if (activeTab === 'favorites') {
                setFavSort(nativeEvent.event as FavSort);
              } else {
                setPlaylistSort(nativeEvent.event as PlaylistSort);
              }
            }}
          >
            <View style={styles.capsuleBtn} accessibilityRole="button" accessibilityLabel={t.favoritesSortTitle}>
              <AppMenuIcon ios="line.3.horizontal.decrease" android="sort" size={19} color={theme.onSurface} weight="semibold" />
            </View>
          </MenuView>
        </GlassSurface>
      </View>

      {/* ── Liquid Glass Sliding Segmented Control ── */}
      <GlassSurface
        glassEffectStyle="regular"
        intensity={42}
        style={[
          styles.segmentedTrack,
          {
            backgroundColor: IS_IOS
              ? isDarkMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(110,22,25,0.05)'
              : isDarkMode
                ? 'rgba(255,255,255,0.08)'
                : theme.surfaceVariants.containerLow,
            borderColor: cardBorder,
          },
        ]}
      >
        <View
          style={styles.segmentedInner}
          onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
        >
          <Reanimated.View
            pointerEvents="none"
            style={[
              styles.segmentedThumb,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.16)' : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(110,22,25,0.08)',
              },
              segThumbStyle,
            ]}
          />
          {(
            [
              { key: 'favorites', label: t.myFavorites, count: favoriteIds.length },
              { key: 'playlists', label: t.playlistsTabShort, count: playlists.length },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={styles.segmentedTab}
                onPress={() => {
                  if (activeTab === tab.key) return;
                  Haptics.selectionAsync();
                  setActiveTab(tab.key);
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedLabel,
                    { color: active ? theme.primary : theme.onSurfaceVariant },
                    active && fonts.sansBold,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.segmentedBadge,
                      {
                        backgroundColor: active
                          ? isDarkMode
                            ? 'rgba(240,168,168,0.2)'
                            : theme.primary + '16'
                          : isDarkMode
                            ? 'rgba(255,255,255,0.09)'
                            : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentedBadgeText,
                        { color: active ? theme.primary : theme.onSurfaceVariant },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>

      {/* ── Optional Inline Search Bar (Favorites) ── */}
      {activeTab === 'favorites' && searchOpen && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: cardSurface,
              borderColor: cardBorder,
            },
          ]}
        >
          <MaterialIcons name="search" size={19} color={theme.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.favoritesSearchPlaceholder}
            placeholderTextColor={theme.onSurfaceVariant + '99'}
            style={[styles.searchInput, { color: theme.onSurface }]}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && !IS_IOS && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      )}

      {/* ── TAB 1: MIS FAVORITOS ── */}
      {activeTab === 'favorites' ? (
        favoriteIds.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: subtlePillBg }]}>
              <MaterialIcons name="bookmark-border" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
              {t.noFavoritesYet}
            </Text>
            <TouchableOpacity
              style={[styles.primaryPillBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/hymns');
              }}
            >
              <Text style={[styles.primaryPillText, { color: '#FFFFFF' }]}>{t.exploreHymns}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Apple Music–style Play & Shuffle Hero Buttons */}
            <View style={styles.playShuffleRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.heroActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => handlePlayFavorites(false)}
              >
                <MaterialIcons name="play-arrow" size={22} color="#FFFFFF" />
                <Text style={[styles.heroActionText, { color: '#FFFFFF' }]}>{t.favoritesPlay}</Text>
              </TouchableOpacity>

              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={52}
                style={[
                  styles.heroActionGlass,
                  !IS_IOS && {
                    backgroundColor: subtlePillBg,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [styles.heroActionGlassInner, pressed && { opacity: 0.72 }]}
                  onPress={() => handlePlayFavorites(true)}
                >
                  <MaterialIcons name="shuffle" size={20} color={theme.primary} />
                  <Text style={[styles.heroActionText, { color: theme.primary }]}>
                    {t.favoritesShuffle}
                  </Text>
                </Pressable>
              </GlassSurface>
            </View>

            {/* Favorites List Card */}
            {favoriteHymns.length === 0 ? (
              <View style={styles.noMatchBox}>
                <Text style={[styles.emptyText, { color: theme.onSurfaceVariant, marginBottom: 0 }]}>
                  {t.hymnsNoResultsFound}
                </Text>
              </View>
            ) : (
              <View style={[styles.listCard, { backgroundColor: cardSurface, borderColor: cardBorder }]}>
                {favoriteHymns.map((hymn, index) => {
                  const idStr = String(hymn.id);
                  const isCurrent = currentHymnId === idStr;
                  const canPlay = hasHymnAudio(idStr);
                  return (
                    <View key={idStr}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.rowDivider,
                            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '35' },
                          ]}
                        />
                      )}
                      <TouchableOpacity
                        style={[
                          styles.favRow,
                          isCurrent && {
                            backgroundColor: isDarkMode
                              ? 'rgba(181,69,69,0.16)'
                              : theme.primary + '0B',
                          },
                        ]}
                        activeOpacity={0.78}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({
                            pathname: '/hymn/[id]',
                            params: { id: idStr, source: 'favorites' },
                          });
                        }}
                      >
                        <View
                          style={[
                            styles.numBadge,
                            {
                              backgroundColor: isCurrent
                                ? theme.primary
                                : isDarkMode
                                  ? 'rgba(255,255,255,0.07)'
                                  : theme.primary + '10',
                            },
                          ]}
                        >
                          {isCurrent && isPlaying ? (
                            <MaterialIcons name="graphic-eq" size={20} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={[
                                styles.numBadgeText,
                                { color: isCurrent ? '#FFFFFF' : theme.primary },
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.65}
                            >
                              {hymn.number}
                            </Text>
                          )}
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.rowTitle,
                              { color: isCurrent ? theme.primary : theme.onSurface },
                            ]}
                          >
                            {hymn.title}
                          </Text>
                          {hymn.categories ? (
                            <Text numberOfLines={1} style={[styles.rowSub, { color: theme.onSurfaceVariant }]}>
                              {translateCategories(hymn.categories, language)}
                            </Text>
                          ) : null}
                        </View>

                        {canPlay && (
                          <Pressable
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={t.favoritesPlay}
                            onPress={() => handlePlaySingleFavorite(idStr)}
                            style={({ pressed }) => [
                              styles.quickPlayBtn,
                              {
                                backgroundColor: isDarkMode
                                  ? 'rgba(255,255,255,0.08)'
                                  : theme.primary + '12',
                              },
                              pressed && { opacity: 0.6 },
                            ]}
                          >
                            <MaterialIcons
                              name={isCurrent && isPlaying ? 'equalizer' : 'play-arrow'}
                              size={18}
                              color={theme.primary}
                            />
                          </Pressable>
                        )}

                        <Pressable
                          hitSlop={8}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            toggleFavorite(idStr);
                          }}
                          style={({ pressed }) => [styles.bookmarkBtn, pressed && { opacity: 0.6 }]}
                        >
                          <MaterialIcons name="bookmark" size={21} color={theme.primary} />
                        </Pressable>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )
      ) : (
        /* ── TAB 2: LISTAS DE REPRODUCCIÓN (Apple Music Playlists Style) ── */
        <>
          {/* Quick "+ Nueva lista" row right at top when empty or always accessible */}
          <Pressable
            onPress={openCreateSheet}
            style={({ pressed }) => [
              styles.newPlaylistRow,
              {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              },
              pressed && { opacity: 0.78 },
            ]}
          >
            <View style={[styles.playlistThumb, { backgroundColor: subtlePillBg }]}>
              <MaterialIcons name="add" size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.playlistName, { color: theme.primary }]}>
                {t.playlistsNewTitle}
              </Text>
              <Text numberOfLines={1} style={[styles.playlistMeta, { color: theme.onSurfaceVariant }]}>
                {t.playlistsNewSubtitle}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
          </Pressable>

          {sortedPlaylists.length === 0 ? (
            <View style={[styles.emptyState, { marginTop: 28 }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: subtlePillBg }]}>
                <MaterialIcons name="library-music" size={38} color={theme.primary} />
              </View>
              <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
                {t.noPlaylistsYet}
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: cardSurface, borderColor: cardBorder, marginTop: 14 }]}>
              {sortedPlaylists.map((playlist, index) => (
                <View key={playlist.id}>
                  {index > 0 && (
                    <View
                      style={[
                        styles.rowDivider,
                        {
                          marginLeft: 82,
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '35',
                        },
                      ]}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.playlistRow}
                    activeOpacity={0.78}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } } as any);
                    }}
                  >
                    <LinearGradient
                      colors={
                        isDarkMode
                          ? ['#4a1418', '#24090b']
                          : ['#7c1a1e', '#4d0e11']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.playlistThumb}
                    >
                      <MaterialIcons name="queue-music" size={26} color="rgba(255,255,255,0.92)" />
                    </LinearGradient>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text numberOfLines={1} style={[styles.playlistName, { color: theme.onSurface }]}>
                        {playlist.name}
                      </Text>
                      <Text style={[styles.playlistMeta, { color: theme.onSurfaceVariant }]}>
                        {playlist.hymnIds.length}{' '}
                        {playlist.hymnIds.length === 1 ? t.songCount_one : t.songCount_other}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Scripture Quote ── */}
      <View style={styles.quoteBlock}>
        <MaterialIcons name="auto-awesome" size={32} color={theme.primary} style={{ marginBottom: 14 }} />
        <Text style={[styles.quoteText, { color: theme.onSurface }]}>{t.favoritesQuoteText}</Text>
        <Text style={[styles.quoteAuthor, { color: theme.outline }]}>{t.favoritesQuoteAuthor}</Text>
      </View>

      <View style={{ height: bottomClearance }} />
    </>
  );

  return (
    <TabSwipeWrapper currentTab="favorites" style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + ipadTopOffset + 24 }]}
        pointerEvents="none"
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + ipadTopOffset + 18 },
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

      {/* ── Create New Playlist Sheet (Glorify backdrop swipe-down) ── */}
      <Modal
        visible={createOpen}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeCreateSheet}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={IS_IOS ? 'padding' : undefined}
            style={styles.modalBackdropWrap}
          >
            <GestureDetector gesture={createBackdropPan}>
              <Reanimated.View style={[styles.modalScrim, createBackdropStyle]}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={closeCreateSheet}
                />
              </Reanimated.View>
            </GestureDetector>

            <Reanimated.View style={[styles.createSheetOuter, createSheetStyle]}>
              <GestureDetector gesture={createHeaderPan}>
                <View style={styles.grabberHitZone}>
                  <SheetGrabber inline interactive />
                </View>
              </GestureDetector>

              <View
                style={[
                  styles.createSheet,
                  {
                    backgroundColor: theme.surfaceVariants.containerLow,
                    paddingBottom: Math.max(insets.bottom, 22),
                  },
                ]}
              >
                <GestureDetector gesture={createHeaderPan}>
                  <View style={styles.createSheetHeader}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.createSheetTitle, { color: theme.onSurface }]}>
                        {t.playlistsNewTitle}
                      </Text>
                      <Text style={[styles.createSheetSub, { color: theme.onSurfaceVariant }]}>
                        {t.playlistsNewSubtitle}
                      </Text>
                    </View>
                    <GlassSurface
                      isInteractive
                      glassEffectStyle="regular"
                      intensity={56}
                      style={styles.closeGlass}
                    >
                      <Pressable
                        onPress={closeCreateSheet}
                        accessibilityRole="button"
                        accessibilityLabel={t.close}
                        style={styles.closeGlass}
                      >
                        <AppMenuIcon ios="xmark" android="close" color={theme.onSurface} size={17} weight="semibold" />
                      </Pressable>
                    </GlassSurface>
                  </View>
                </GestureDetector>

                <TextInput
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholder={t.playlistsNamePlaceholder}
                  placeholderTextColor={theme.onSurfaceVariant + '88'}
                  maxLength={80}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreatePlaylist}
                  style={[
                    styles.nameInput,
                    {
                      color: theme.onSurface,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
                      borderColor: cardBorder,
                    },
                  ]}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!newPlaylistName.trim()}
                  onPress={handleCreatePlaylist}
                  style={[
                    styles.createConfirmBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: newPlaylistName.trim() ? 1 : 0.45,
                    },
                  ]}
                >
                  <Text style={styles.createConfirmText}>{t.playlistsCreateButton}</Text>
                </TouchableOpacity>
              </View>
            </Reanimated.View>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  scroll: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  largeTitle: {
    ...fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  largeSubtitle: {
    ...fonts.sansRegular,
    fontSize: 14,
    marginTop: 2,
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  capsuleBtn: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
  },
  segmentedTrack: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
    overflow: 'hidden',
  },
  segmentedInner: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  segmentedThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  segmentedLabel: {
    ...fonts.sansSemiBold,
    fontSize: 14.5,
  },
  segmentedBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBadgeText: {
    ...fonts.sansBold,
    fontSize: 11.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15,
    paddingVertical: 6,
  },
  playShuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  heroActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroActionGlass: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroActionGlassInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroActionText: {
    ...fonts.sansSemiBold,
    fontSize: 15.5,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  numBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    ...fonts.bold,
    fontSize: 16,
  },
  rowTitle: {
    ...fonts.regularItalic,
    fontSize: 17.5,
    lineHeight: 22,
  },
  rowSub: {
    ...fonts.sansRegular,
    fontSize: 11.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  quickPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtn: {
    width: 30,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  playlistThumb: {
    width: 54,
    height: 54,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistName: {
    ...fonts.sansSemiBold,
    fontSize: 16.5,
  },
  playlistMeta: {
    ...fonts.sansRegular,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: 42,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 15.5,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
  },
  noMatchBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  primaryPillText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  quoteBlock: {
    alignItems: 'center',
    paddingVertical: 64,
    opacity: 0.34,
  },
  quoteText: {
    ...fonts.regularItalic,
    fontSize: 17,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
    lineHeight: 25,
  },
  quoteAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalBackdropWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  createSheetOuter: {
    width: '100%',
  },
  grabberHitZone: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  createSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  createSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  createSheetTitle: {
    ...fonts.bold,
    fontSize: 22,
  },
  createSheetSub: {
    ...fonts.sansRegular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  closeGlass: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    ...fonts.sansRegular,
    fontSize: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  createConfirmBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createConfirmText: {
    ...fonts.sansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
