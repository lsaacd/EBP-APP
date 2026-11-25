/**
 * FavoritesScreen — Apple Music–inspired Liquid Glass Favorites & Playlists hub.
 *
 * - Native iOS 26 LiquidGlassSegmented control (Mis Favoritos / Listas)
 * - Apple Music–style Top Liquid Glass Search Takeover (pill search bar + X circle + scope bar)
 * - Top-right iOS 26 GlassContainer paired circular capsules (Search/+ & Sort MenuView with SF Symbols)
 * - Live Favorites sort-order sync with NowPlayingContext (`setQueue`) so Next/Prev immediately
 *   follows Recently added / By number / A–Z order
 * - Localized hymn titles following app language (`en` / `es`) with bilingual search
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
  Keyboard,
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
  FadeIn,
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
import GlassSurface, { GlassGroup } from '../../components/GlassSurface';
import LiquidGlassSegmented from '../../components/LiquidGlassSegmented';
import AppMenuIcon from '../../components/AppMenuIcon';
import SheetGrabber from '../../components/SheetGrabber';
import { buildSheetBackdropGesture, buildSheetPanGesture } from '../../utils/useSheetBackdropGesture';

const IS_IOS = Platform.OS === 'ios';
const IS_IPAD = IS_IOS && Boolean((Platform as any).isPad);

type FavSort = 'recent' | 'number' | 'alpha';
type PlaylistSort = 'recent' | 'alpha' | 'count';

export function compareHymnIdsByNumber(aId: string, bId: string): number {
  const aClean = String(aId).trim();
  const bClean = String(bId).trim();
  const aChorus = aClean.startsWith('E') ? 1 : 0;
  const bChorus = bClean.startsWith('E') ? 1 : 0;
  if (aChorus !== bChorus) return aChorus - bChorus;
  const aNum = parseInt(aClean.replace(/[^\d]/g, ''), 10) || 0;
  const bNum = parseInt(bClean.replace(/[^\d]/g, ''), 10) || 0;
  if (aNum !== bNum) return aNum - bNum;
  return aClean.localeCompare(bClean);
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
  const { currentHymnId, isPlaying, queueLabel, setQueue, openPlayer } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 150 : 90);

  // Follow app UI language ('en') automatically for hymn titles on Favorites/Playlists lists
  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [favSort, setFavSort] = useState<FavSort>('recent');
  const [playlistSort, setPlaylistSort] = useState<PlaylistSort>('recent');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

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

  const openSearchTakeover = useCallback(() => {
    Haptics.selectionAsync();
    setSearchQuery('');
    setSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
  }, []);

  const closeSearchTakeover = useCallback(() => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setSearchQuery('');
    setSearchOpen(false);
  }, []);

  // ── Data resolution & sorting ─────────────────────────────────────────────
  const allHymnsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const h of hymnsData) map.set(String(h.id), h);
    for (const e of estribillosData) map.set(String(e.id), e);
    return map;
  }, []);

  // Full sorted Favorites list (independent of search filter, used as canonical playback queue!)
  const sortedAllFavorites = useMemo(() => {
    const base = favoriteIds
      .map((id) => allHymnsMap.get(String(id)))
      .filter(Boolean)
      .map((raw) => ({
        raw,
        localized: getLocalizedHymn(raw, displayHymnLang),
        englishTitle: getLocalizedHymn(raw, 'en').title,
      }));

    const sorted = [...base];
    if (favSort === 'recent') {
      sorted.reverse();
    } else if (favSort === 'number') {
      sorted.sort((a, b) => compareHymnIdsByNumber(String(a.localized.id), String(b.localized.id)));
    } else if (favSort === 'alpha') {
      sorted.sort((a, b) => a.localized.title.localeCompare(b.localized.title));
    }
    return sorted;
  }, [favoriteIds, allHymnsMap, displayHymnLang, favSort]);

  const sortedFavoriteQueueIds = useMemo(
    () => sortedAllFavorites.map((entry) => String(entry.localized.id)),
    [sortedAllFavorites],
  );

  // Keep the active Favorites playback queue in sync whenever favSort or favoriteIds change!
  useEffect(() => {
    if (queueLabel === t.myFavorites && sortedFavoriteQueueIds.length > 0) {
      setQueue(sortedFavoriteQueueIds, t.myFavorites);
    }
  }, [queueLabel, sortedFavoriteQueueIds, setQueue, t.myFavorites]);

  const favoriteHymns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedAllFavorites.map((entry) => entry.localized);
    return sortedAllFavorites
      .filter(({ raw, localized, englishTitle }) => {
        const translatedCat = raw.categories ? translateCategories(raw.categories, language).toLowerCase() : '';
        return (
          String(localized.number).toLowerCase().includes(q) ||
          localized.title.toLowerCase().includes(q) ||
          String(raw.title).toLowerCase().includes(q) ||
          englishTitle.toLowerCase().includes(q) ||
          (raw.categories && String(raw.categories).toLowerCase().includes(q)) ||
          translatedCat.includes(q)
        );
      })
      .map((entry) => entry.localized);
  }, [sortedAllFavorites, searchQuery, language]);

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
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || !q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, playlistSort, searchOpen, searchQuery]);

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

  const cardSurface = isDarkMode ? '#19191B' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : theme.outlineVariant + '45';
  const subtlePillBg = isDarkMode ? 'rgba(255,255,255,0.11)' : theme.primary + '12';
  const mutedSub = isDarkMode ? 'rgba(235,235,245,0.62)' : theme.onSurfaceVariant;
  const menuIconActive = theme.primary;
  const menuIconDefault = theme.onSurface;

  const searchTriggerNode = (
    <Pressable
      onPress={openSearchTakeover}
      accessibilityRole="button"
      accessibilityLabel={t.favoritesSearchPlaceholder}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.75 }]}
    >
      <AppMenuIcon
        ios="magnifyingglass"
        android="search"
        size={22}
        containerSize={26}
        scale="large"
        weight="medium"
        color={theme.primary}
      />
    </Pressable>
  );

  const createTriggerNode = (
    <Pressable
      onPress={openCreateSheet}
      accessibilityRole="button"
      accessibilityLabel={t.playlistsNewTitle}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.75 }]}
    >
      <AppMenuIcon
        ios="plus"
        android="add"
        size={23}
        containerSize={27}
        scale="large"
        weight="semibold"
        color={theme.primary}
      />
    </Pressable>
  );

  const sortMenuNode = (
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
                imageColor: favSort === 'recent' ? menuIconActive : menuIconDefault,
              },
              {
                id: 'number',
                title: t.favoritesSortNumber,
                state: favSort === 'number' ? 'on' : 'off',
                image: IS_IOS ? 'number' : undefined,
                imageColor: favSort === 'number' ? menuIconActive : menuIconDefault,
              },
              {
                id: 'alpha',
                title: t.favoritesSortAZ,
                state: favSort === 'alpha' ? 'on' : 'off',
                image: IS_IOS ? 'textformat.abc' : undefined,
                imageColor: favSort === 'alpha' ? menuIconActive : menuIconDefault,
              },
            ]
          : [
              {
                id: 'recent',
                title: t.playlistsSortRecent,
                state: playlistSort === 'recent' ? 'on' : 'off',
                image: IS_IOS ? 'clock' : undefined,
                imageColor: playlistSort === 'recent' ? menuIconActive : menuIconDefault,
              },
              {
                id: 'alpha',
                title: t.playlistsSortAZ,
                state: playlistSort === 'alpha' ? 'on' : 'off',
                image: IS_IOS ? 'textformat.abc' : undefined,
                imageColor: playlistSort === 'alpha' ? menuIconActive : menuIconDefault,
              },
              {
                id: 'count',
                title: t.playlistsSortCount,
                state: playlistSort === 'count' ? 'on' : 'off',
                image: IS_IOS ? 'list.number' : undefined,
                imageColor: playlistSort === 'count' ? menuIconActive : menuIconDefault,
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
      <View style={styles.circleHit} accessibilityRole="button" accessibilityLabel={t.favoritesSortTitle}>
        <AppMenuIcon
          ios="line.3.horizontal.decrease"
          android="sort"
          size={22}
          containerSize={26}
          scale="large"
          weight="medium"
          color={theme.primary}
        />
      </View>
    </MenuView>
  );

  const renderFavoritesRows = () => (
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
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.primary + '0B',
                },
              ]}
              activeOpacity={0.78}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/hymn/[id]',
                  params: { id: idStr, source: 'favorites', sort: favSort },
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
                        ? 'rgba(255,255,255,0.08)'
                        : theme.primary + '10',
                  },
                ]}
              >
                {isCurrent && isPlaying ? (
                  <MaterialIcons name="graphic-eq" size={21} color={theme.onPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.numBadgeText,
                      { color: isCurrent ? theme.onPrimary : theme.primary },
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
                  <Text numberOfLines={1} style={[styles.rowSub, { color: mutedSub }]}>
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
                    { backgroundColor: subtlePillBg },
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <MaterialIcons
                    name={isCurrent && isPlaying ? 'equalizer' : 'play-arrow'}
                    size={21}
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
                style={({ pressed }) => [styles.bookmarkBtn, pressed && { opacity: 0.65 }]}
              >
                <MaterialIcons name="bookmark" size={23} color={theme.primary} />
              </Pressable>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderPlaylistsRows = () => (
    <View style={[styles.listCard, { backgroundColor: cardSurface, borderColor: cardBorder, marginTop: searchOpen ? 0 : 14 }]}>
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
              colors={isDarkMode ? ['#58191e', '#280a0d'] : ['#7c1a1e', '#4d0e11']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playlistThumb}
            >
              <MaterialIcons name="queue-music" size={27} color="rgba(255,255,255,0.94)" />
            </LinearGradient>
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={[styles.playlistName, { color: theme.onSurface }]}>
                {playlist.name}
              </Text>
              <Text style={[styles.playlistMeta, { color: mutedSub }]}>
                {playlist.hymnIds.length}{' '}
                {playlist.hymnIds.length === 1 ? t.songCount_one : t.songCount_other}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={23} color={mutedSub} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const searchInputInner = (
    <View style={styles.topSearchInner}>
      <AppMenuIcon
        ios="magnifyingglass"
        android="search"
        size={20}
        containerSize={22}
        scale="medium"
        weight="medium"
        color={mutedSub}
      />
      <TextInput
        ref={searchInputRef}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={
          activeTab === 'favorites'
            ? t.favoritesSearchAllPlaceholder
            : t.playlistsSearchPlaceholder
        }
        placeholderTextColor={mutedSub}
        style={[styles.topSearchInput, { color: theme.onSurface }]}
        autoFocus
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && !IS_IOS && (
        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
          <MaterialIcons name="close" size={19} color={mutedSub} />
        </Pressable>
      )}
    </View>
  );

  const cancelSearchBtnInner = (
    <Pressable
      onPress={closeSearchTakeover}
      accessibilityRole="button"
      accessibilityLabel={t.close}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.75 }]}
    >
      <AppMenuIcon
        ios="xmark"
        android="close"
        size={21}
        containerSize={25}
        scale="large"
        weight="semibold"
        color={theme.primary}
      />
    </Pressable>
  );

  const scrollContent = searchOpen ? (
    /* ══════════════════════════════════════════════════════════════════════════
     * APPLE MUSIC–STYLE TOP NATIVE LIQUID GLASS SEARCH TAKEOVER
     * ══════════════════════════════════════════════════════════════════════════ */
    <Reanimated.View key="search-takeover" entering={FadeIn.duration(160)}>
      <GlassGroup spacing={8} style={styles.topSearchRow}>
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={58}
          style={[
            styles.topSearchPill,
            !IS_IOS && {
              backgroundColor: cardSurface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: cardBorder,
              overflow: 'hidden',
            },
          ]}
        >
          {searchInputInner}
        </GlassSurface>
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={58}
          style={[styles.glassCircle, !IS_IOS && styles.androidCircleClip]}
        >
          {cancelSearchBtnInner}
        </GlassSurface>
      </GlassGroup>

      {/* Scope Bar directly beneath the Search Pill (matches Apple Music | Library) */}
      <View style={{ marginBottom: 20 }}>
        <LiquidGlassSegmented
          value={activeTab}
          onChange={(next) => setActiveTab(next)}
          items={[
            { key: 'favorites', label: t.myFavorites, count: favoriteIds.length },
            { key: 'playlists', label: t.playlistsTabShort, count: playlists.length },
          ]}
        />
      </View>

      {searchQuery.trim().length === 0 ? (
        <View style={styles.searchEmptyPrompt}>
          <AppMenuIcon
            ios="magnifyingglass"
            android="search"
            size={48}
            containerSize={54}
            scale="large"
            weight="regular"
            color={mutedSub}
          />
          <Text style={[styles.searchPromptTitle, { color: theme.onSurface }]}>
            {t.favoritesSearchPromptTitle}
          </Text>
          <Text style={[styles.searchPromptBody, { color: mutedSub }]}>
            {t.favoritesSearchPromptBody}
          </Text>
        </View>
      ) : activeTab === 'favorites' ? (
        favoriteHymns.length === 0 ? (
          <View style={styles.searchEmptyPrompt}>
            <AppMenuIcon
              ios="magnifyingglass"
              android="search"
              size={44}
              containerSize={50}
              scale="large"
              color={mutedSub}
            />
            <Text style={[styles.searchPromptTitle, { color: theme.onSurface }]}>
              {t.hymnsNoResultsFound}
            </Text>
          </View>
        ) : (
          renderFavoritesRows()
        )
      ) : sortedPlaylists.length === 0 ? (
        <View style={styles.searchEmptyPrompt}>
          <AppMenuIcon
            ios="magnifyingglass"
            android="search"
            size={44}
            containerSize={50}
            scale="large"
            color={mutedSub}
          />
          <Text style={[styles.searchPromptTitle, { color: theme.onSurface }]}>
            {t.hymnsNoResultsFound}
          </Text>
        </View>
      ) : (
        renderPlaylistsRows()
      )}

      <View style={{ height: bottomClearance }} />
    </Reanimated.View>
  ) : (
    /* ══════════════════════════════════════════════════════════════════════════
     * STANDARD FAVORITES & PLAYLISTS HUB
     * ══════════════════════════════════════════════════════════════════════════ */
    <>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.largeTitle, { color: theme.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {activeTab === 'favorites' ? t.myFavorites : t.playlistsTitle}
          </Text>
          <Text style={[styles.largeSubtitle, { color: mutedSub }]}>
            {activeTab === 'favorites'
              ? favoriteIds.length > 0
                ? `${favoriteIds.length} ${favoriteIds.length !== 1 ? t.hymnsSaved_other : t.hymnsSaved_one}`
                : t.savedForQuickAccess
              : playlists.length > 0
                ? `${playlists.length} ${playlists.length !== 1 ? t.playlistsCount_other : t.playlistsCount_one}`
                : t.yourCustomPlaylists}
          </Text>
        </View>

        <GlassGroup spacing={8} style={styles.actionsRow}>
          {activeTab === 'playlists' ? (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={58}
              style={[styles.glassCircle, !IS_IOS && styles.androidCircleClip]}
            >
              {createTriggerNode}
            </GlassSurface>
          ) : null}
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={58}
            style={[styles.glassCircle, !IS_IOS && styles.androidCircleClip]}
          >
            {searchTriggerNode}
          </GlassSurface>
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={58}
            style={[styles.glassCircle, !IS_IOS && styles.androidCircleClip]}
          >
            {sortMenuNode}
          </GlassSurface>
        </GlassGroup>
      </View>

      {/* ── Genuine Liquid Glass Sliding Segmented Control ── */}
      <View style={{ marginBottom: 18 }}>
        <LiquidGlassSegmented
          value={activeTab}
          onChange={(next) => setActiveTab(next)}
          items={[
            { key: 'favorites', label: t.myFavorites, count: favoriteIds.length },
            { key: 'playlists', label: t.playlistsTabShort, count: playlists.length },
          ]}
        />
      </View>

      {/* ── TAB 1: MIS FAVORITOS ── */}
      {activeTab === 'favorites' ? (
        favoriteIds.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: subtlePillBg }]}>
              <MaterialIcons name="bookmark-border" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.emptyText, { color: mutedSub }]}>{t.noFavoritesYet}</Text>
            <TouchableOpacity
              style={[styles.primaryPillBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/hymns');
              }}
            >
              <Text style={[styles.primaryPillText, { color: theme.onPrimary }]}>{t.exploreHymns}</Text>
              <MaterialIcons name="arrow-forward" size={19} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Apple Music–style Play & Liquid Glass Shuffle Hero Capsules */}
            <View style={styles.playShuffleRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.heroActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => handlePlayFavorites(false)}
              >
                <AppMenuIcon
                  ios="play.fill"
                  android="play-arrow"
                  size={22}
                  containerSize={22}
                  scale="large"
                  weight="semibold"
                  color={theme.onPrimary}
                />
                <Text style={[styles.heroActionText, { color: theme.onPrimary }]}>
                  {t.favoritesPlay}
                </Text>
              </TouchableOpacity>

              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={58}
                style={[
                  styles.heroActionGlass,
                  !IS_IOS && {
                    backgroundColor: subtlePillBg,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: cardBorder,
                    overflow: 'hidden',
                  },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [styles.heroActionGlassInner, pressed && { opacity: 0.78 }]}
                  onPress={() => handlePlayFavorites(true)}
                >
                  <AppMenuIcon
                    ios="shuffle"
                    android="shuffle"
                    size={21}
                    containerSize={23}
                    scale="large"
                    weight="semibold"
                    color={theme.primary}
                  />
                  <Text style={[styles.heroActionText, { color: theme.primary }]}>
                    {t.favoritesShuffle}
                  </Text>
                </Pressable>
              </GlassSurface>
            </View>

            {renderFavoritesRows()}
          </>
        )
      ) : (
        /* ── TAB 2: LISTAS DE REPRODUCCIÓN ── */
        <>
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
              <MaterialIcons name="add" size={28} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.playlistName, { color: theme.primary }]}>
                {t.playlistsNewTitle}
              </Text>
              <Text numberOfLines={1} style={[styles.playlistMeta, { color: mutedSub }]}>
                {t.playlistsNewSubtitle}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={23} color={mutedSub} />
          </Pressable>

          {sortedPlaylists.length === 0 ? (
            <View style={[styles.emptyState, { marginTop: 28 }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: subtlePillBg }]}>
                <MaterialIcons name="library-music" size={38} color={theme.primary} />
              </View>
              <Text style={[styles.emptyText, { color: mutedSub }]}>{t.noPlaylistsYet}</Text>
            </View>
          ) : (
            renderPlaylistsRows()
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
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + ipadTopOffset + (searchOpen ? 10 : 18) },
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
                      <Text style={[styles.createSheetSub, { color: mutedSub }]}>
                        {t.playlistsNewSubtitle}
                      </Text>
                    </View>
                    <GlassSurface
                      isInteractive
                      glassEffectStyle="regular"
                      intensity={58}
                      style={styles.closeGlass}
                    >
                      <Pressable
                        onPress={closeCreateSheet}
                        accessibilityRole="button"
                        accessibilityLabel={t.close}
                        style={styles.closeGlass}
                      >
                        <AppMenuIcon
                          ios="xmark"
                          android="close"
                          color={theme.primary}
                          size={19}
                          containerSize={22}
                          scale="large"
                          weight="semibold"
                        />
                      </Pressable>
                    </GlassSurface>
                  </View>
                </GestureDetector>

                <TextInput
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholder={t.playlistsNamePlaceholder}
                  placeholderTextColor={mutedSub}
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
                  <Text style={[styles.createConfirmText, { color: theme.onPrimary }]}>
                    {t.playlistsCreateButton}
                  </Text>
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
    fontSize: 33,
    lineHeight: 39,
    letterSpacing: -0.3,
  },
  largeSubtitle: {
    ...fonts.sansRegular,
    fontSize: 14,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  glassCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  androidCircleClip: {
    overflow: 'hidden',
  },
  circleHit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  topSearchPill: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
  },
  topSearchInner: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 9,
  },
  topSearchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 16.5,
    paddingVertical: 6,
  },
  searchEmptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 96,
    paddingHorizontal: 32,
    gap: 10,
  },
  searchPromptTitle: {
    ...fonts.sansBold,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 6,
  },
  searchPromptBody: {
    ...fonts.sansRegular,
    fontSize: 15.5,
    lineHeight: 22,
    textAlign: 'center',
  },
  playShuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  heroActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroActionGlass: {
    flex: 1,
    height: 48,
    borderRadius: 999,
  },
  heroActionGlassInner: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroActionText: {
    ...fonts.sansSemiBold,
    fontSize: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    ...fonts.bold,
    fontSize: 16.5,
  },
  rowTitle: {
    ...fonts.regularItalic,
    fontSize: 18,
    lineHeight: 23,
  },
  rowSub: {
    ...fonts.sansRegular,
    fontSize: 11.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  quickPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtn: {
    width: 32,
    height: 36,
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
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  primaryPillText: {
    ...fonts.sansSemiBold,
    fontSize: 15.5,
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
    ...StyleSheet.absoluteFill,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createConfirmText: {
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
});
