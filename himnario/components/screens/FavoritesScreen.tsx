/**
 * FavoritesScreen — Apple Music iOS 26–inspired Favorites & Playlists hub.
 *
 * - Pinned floating Liquid Glass top bar with progressive blur scrim (zero status-bar overlap)
 * - Atmospheric burgundy/parchment cover wash + compact 156×156 parallax hero cover synced to
 *   the user's chosen hymnal cover (`hymnCoversStore`, zero crosses)
 * - Signature Apple Music 3-button action cluster: circular Shuffle | prominent Play pill | circular +
 * - Open borderless full-width tracklist with crisp non-italic sans-serif titles, tabular numbers
 *   (tap number to play audio, tap row to read lyrics), live Reanimated 3-bar equalizer, subtle
 *   Title-case category + audio micro-badge, and single native SwiftUI `···` action menu
 * - Apple Music 2-column visual cover grid for Playlists with `<Link.AppleZoom>` transitions
 * - Editorial tracklist footer + quiet Scripture reflection
 */
import React, { useState, useRef, useMemo, useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Image,
  Platform,
  TextInput,
  Alert,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter, useNavigation } from 'expo-router';
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
import {
  hymnCoversStore,
  initHymnCovers,
  resolveActiveHymnCover,
} from '../../data/hymnCovers';
import { fonts } from '../../theme/theme';
import * as Haptics from '../../utils/haptics';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import TabSwipeWrapper from '../TabSwipeWrapper';
import GlassSurface, { GlassGroup } from '../GlassSurface';
import LiquidGlassSegmented from '../LiquidGlassSegmented';
import AppMenuIcon from '../AppMenuIcon';
import SheetGrabber from '../SheetGrabber';
import HymnRowLink from '../HymnRowLink';
import AnimatedEqualizer from '../AnimatedEqualizer';
import TrackEllipsisMenu from '../TrackEllipsisMenu';
import AddToPlaylistModal from '../AddToPlaylistModal';
import { buildSheetBackdropGesture, buildSheetPanGesture } from '../../utils/useSheetBackdropGesture';

const IS_IOS = Platform.OS === 'ios';
const IS_IPAD = IS_IOS && Boolean((Platform as any).isPad);
const EBP_HYMN_COVER = require('../../assets/images/EBP_HYMN_COVER.png');

const PLAYLIST_TINTS = [
  'rgba(110, 22, 25, 0.34)',
  'rgba(22, 54, 92, 0.36)',
  'rgba(122, 86, 28, 0.34)',
  'rgba(24, 78, 56, 0.34)',
  'rgba(78, 34, 86, 0.34)',
];

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

function toCleanTitleCase(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/(^|\s|·|\/)([a-záéíóúñü])/g, (m, p1, p2) => `${p1}${p2.toUpperCase()}`);
  }
  return trimmed;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylists();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const { currentHymnId, isPlaying, queueLabel, setQueue, openPlayer } = useNowPlaying();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 160 : 104);
  const swiftUI = IS_IOS ? getExpoSwiftUI() : null;

  const coverState = useSyncExternalStore(
    hymnCoversStore.subscribe,
    hymnCoversStore.getSnapshot,
    hymnCoversStore.getSnapshot,
  );
  const [failedCoverId, setFailedCoverId] = useState<string | null>(null);
  useEffect(() => {
    void initHymnCovers();
  }, []);
  const activeCover = useMemo(
    () => resolveActiveHymnCover(coverState, failedCoverId),
    [coverState, failedCoverId],
  );

  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [favSort, setFavSort] = useState<FavSort>('recent');
  const [playlistSort, setPlaylistSort] = useState<PlaylistSort>('recent');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistModalHymnId, setPlaylistModalHymnId] = useState<string | null>(null);
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

  // ── Playback actions ──────────────────────────────────────────────────────
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

  // ── Scroll & Parallax Animations ──────────────────────────────────────────
  const scrollViewRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [185, 245],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const heroArtworkScale = scrollY.interpolate({
    inputRange: [-60, 0, 220],
    outputRange: [1.06, 1, 0.88],
    extrapolate: 'clamp',
  });
  const heroArtworkOpacity = scrollY.interpolate({
    inputRange: [0, 190],
    outputRange: [1, 0.35],
    extrapolate: 'clamp',
  });

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

  // ── Sacred Ink × Apple Music Palette ──────────────────────────────────────
  const canvasBg = isDarkMode ? '#000000' : '#FCF9F2';
  const primaryInk = isDarkMode ? '#FDF9F2' : '#1A1614';
  const accentColor = isDarkMode ? '#F4C7C9' : theme.primary;
  const playPillBg = isDarkMode ? '#FDF9F2' : theme.primary;
  const playPillInk = isDarkMode ? '#0D0D0F' : '#FFFFFF';
  const mutedSub = isDarkMode ? 'rgba(235,235,245,0.58)' : '#6C645E';
  const hairline = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(26,22,20,0.09)';
  const subtlePillBg = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(110,22,25,0.09)';
  const cardSurface = isDarkMode ? '#161618' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(26,22,20,0.08)';
  const topBarHeight = insets.top + ipadTopOffset + 56;

  const currentSortLabel =
    favSort === 'recent'
      ? t.favoritesSortRecent
      : favSort === 'number'
        ? t.favoritesSortNumber
        : t.favoritesSortAZ;

  const gridColumnWidth = useMemo(() => {
    const maxContainer = IS_IPAD ? Math.min(screenWidth, 780) : screenWidth;
    return Math.floor((maxContainer - 40 - 14) / 2);
  }, [screenWidth]);

  // ── Top Bar Controls (Native SwiftUI Menu for Sort on iOS) ────────────────
  const searchTriggerNode = (
    <Pressable
      onPress={openSearchTakeover}
      accessibilityRole="button"
      accessibilityLabel={t.favoritesSearchPlaceholder}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.72 }]}
    >
      <AppMenuIcon
        ios="magnifyingglass"
        android="search"
        size={19}
        containerSize={22}
        weight="semibold"
        color={primaryInk}
      />
    </Pressable>
  );

  const createTriggerNode = (
    <Pressable
      onPress={openCreateSheet}
      accessibilityRole="button"
      accessibilityLabel={t.playlistsNewTitle}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.72 }]}
    >
      <AppMenuIcon
        ios="plus"
        android="add"
        size={20}
        containerSize={23}
        weight="semibold"
        color={primaryInk}
      />
    </Pressable>
  );

  const sortMenuNode = swiftUI?.ui.Menu ? (() => {
    const { Button: SwiftButton, Host, Image: SwiftImage, Menu: SwiftMenu } = swiftUI.ui;
    const { foregroundStyle, frame } = swiftUI.modifiers;
    const items =
      activeTab === 'favorites'
        ? [
            { id: 'recent' as const, title: t.favoritesSortRecent, icon: 'clock' as const, active: favSort === 'recent' },
            { id: 'number' as const, title: t.favoritesSortNumber, icon: 'number' as const, active: favSort === 'number' },
            { id: 'alpha' as const, title: t.favoritesSortAZ, icon: 'textformat.abc' as const, active: favSort === 'alpha' },
          ]
        : [
            { id: 'recent' as const, title: t.playlistsSortRecent, icon: 'clock' as const, active: playlistSort === 'recent' },
            { id: 'alpha' as const, title: t.playlistsSortAZ, icon: 'textformat.abc' as const, active: playlistSort === 'alpha' },
            { id: 'count' as const, title: t.playlistsSortCount, icon: 'list.number' as const, active: playlistSort === 'count' },
          ];
    return (
      <Host
        style={styles.circleHit}
        colorScheme={isDarkMode ? 'dark' : 'light'}
        seedColor={theme.primary}
      >
        <SwiftMenu
          label={
            <SwiftImage
              systemName="line.3.horizontal.decrease"
              size={18}
              modifiers={[
                foregroundStyle({ type: 'color', color: primaryInk }),
                frame({ width: 40, height: 40 }),
              ]}
            />
          }
        >
          {items.map((opt) => (
            <SwiftButton
              key={opt.id}
              label={opt.title}
              systemImage={opt.active ? 'checkmark' : opt.icon}
              onPress={() => {
                Haptics.selectionAsync();
                if (activeTab === 'favorites') setFavSort(opt.id as FavSort);
                else setPlaylistSort(opt.id as PlaylistSort);
              }}
            />
          ))}
        </SwiftMenu>
      </Host>
    );
  })() : (
    <MenuView
      themeVariant={isDarkMode ? 'dark' : 'light'}
      shouldOpenOnLongPress={false}
      actions={
        activeTab === 'favorites'
          ? [
              { id: 'recent', title: t.favoritesSortRecent, state: favSort === 'recent' ? 'on' : 'off' },
              { id: 'number', title: t.favoritesSortNumber, state: favSort === 'number' ? 'on' : 'off' },
              { id: 'alpha', title: t.favoritesSortAZ, state: favSort === 'alpha' ? 'on' : 'off' },
            ]
          : [
              { id: 'recent', title: t.playlistsSortRecent, state: playlistSort === 'recent' ? 'on' : 'off' },
              { id: 'alpha', title: t.playlistsSortAZ, state: playlistSort === 'alpha' ? 'on' : 'off' },
              { id: 'count', title: t.playlistsSortCount, state: playlistSort === 'count' ? 'on' : 'off' },
            ]
      }
      onPressAction={({ nativeEvent }) => {
        Haptics.selectionAsync();
        if (activeTab === 'favorites') setFavSort(nativeEvent.event as FavSort);
        else setPlaylistSort(nativeEvent.event as PlaylistSort);
      }}
    >
      <View style={styles.circleHit} accessibilityRole="button" accessibilityLabel={t.favoritesSortTitle}>
        <AppMenuIcon
          ios="line.3.horizontal.decrease"
          android="sort"
          size={19}
          containerSize={22}
          weight="semibold"
          color={primaryInk}
        />
      </View>
    </MenuView>
  );

  // ── Open Borderless Apple Music Tracklist Rows ────────────────────────────
  const renderFavoritesRows = () => (
    <View style={styles.tracklistWrap}>
      {favoriteHymns.map((hymn, index) => {
        const idStr = String(hymn.id);
        const isCurrent = currentHymnId === idStr;
        const canPlay = hasHymnAudio(idStr);
        const rawCat = hymn.categories ? translateCategories(hymn.categories, language) : '';
        const cleanCat = toCleanTitleCase(rawCat);

        return (
          <View key={idStr}>
            {index > 0 ? (
              <View style={[styles.trackDivider, { backgroundColor: hairline }]} />
            ) : null}
            <View
              style={[
                styles.trackRowOuter,
                isCurrent && {
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(110,22,25,0.06)',
                },
              ]}
            >
              {/* Left tabular number / animated equalizer (tap directly to play audio!) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={canPlay ? t.favoritesPlayNow : String(hymn.number)}
                onPress={() => {
                  if (canPlay) {
                    handlePlaySingleFavorite(idStr);
                  } else {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: '/hymn/[id]',
                      params: { id: idStr, source: 'favorites', sort: favSort },
                    });
                  }
                }}
                style={({ pressed }) => [styles.trackNumCol, pressed && { opacity: 0.6 }]}
              >
                {isCurrent ? (
                  <AnimatedEqualizer
                    playing={isPlaying}
                    color={accentColor}
                    size={16}
                  />
                ) : (
                  <Text
                    style={[
                      styles.trackNumText,
                      { color: mutedSub, fontVariant: ['tabular-nums'] },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {hymn.number}
                  </Text>
                )}
              </Pressable>

              {/* Middle: full-width crisp sans-serif title + clean Title-case category & audio badge */}
              <View style={{ flex: 1 }}>
                <HymnRowLink
                  hymn={hymn}
                  href={{
                    pathname: '/hymn/[id]',
                    params: { id: idStr, source: 'favorites', sort: favSort },
                  }}
                  queueIds={favoriteHymns.map((item) => String(item.id))}
                  queueLabel={t.myFavorites}
                  style={styles.trackMainHit}
                  activeOpacity={0.72}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.trackTitle,
                        {
                          color: isCurrent ? accentColor : primaryInk,
                          ...(isCurrent ? fonts.sansSemiBold : fonts.sansMedium),
                        },
                      ]}
                    >
                      {hymn.title}
                    </Text>
                    {cleanCat || canPlay ? (
                      <View style={styles.trackSubRow}>
                        {cleanCat ? (
                          <Text
                            numberOfLines={1}
                            style={[styles.trackSubText, { color: mutedSub }]}
                          >
                            {cleanCat}
                          </Text>
                        ) : null}
                        {canPlay ? (
                          <View
                            style={[
                              styles.audioMicroBadge,
                              {
                                backgroundColor: isDarkMode
                                  ? 'rgba(255,255,255,0.10)'
                                  : 'rgba(110,22,25,0.08)',
                              },
                            ]}
                          >
                            <AppMenuIcon
                              ios="waveform"
                              android="graphic-eq"
                              size={10}
                              color={accentColor}
                              weight="semibold"
                            />
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </HymnRowLink>
              </View>

              {/* Trailing single Apple Music `···` native menu */}
              <TrackEllipsisMenu
                hymnId={idStr}
                hymnNumber={hymn.number}
                hymnTitle={hymn.title}
                canPlay={canPlay}
                removeLabel={t.favoritesRemoveFromFavorites}
                removeIcon="bookmark.slash"
                iconColor={mutedSub}
                onPlay={() => handlePlaySingleFavorite(idStr)}
                onOpenLyrics={() =>
                  router.push({
                    pathname: '/hymn/[id]',
                    params: { id: idStr, source: 'favorites', sort: favSort },
                  })
                }
                onAddToPlaylist={() => setPlaylistModalHymnId(idStr)}
                onRemove={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleFavorite(idStr);
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );

  // ── Playlists Actions & Apple Music 2-Column Cover Grid ───────────────────
  const handlePlayPlaylistFromCard = useCallback(
    (playlistItem: (typeof playlists)[number], shuffle: boolean) => {
      const playable = playlistItem.hymnIds.filter(hasHymnAudio);
      if (playable.length === 0) {
        Alert.alert(playlistItem.name, t.favoritesNoAudioAlert);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const startId = shuffle
        ? playable[Math.floor(Math.random() * playable.length)]
        : playable[0];
      openPlayer(startId, playlistItem.hymnIds, { label: playlistItem.name, shuffle });
    },
    [openPlayer, t.favoritesNoAudioAlert],
  );

  const handleDeletePlaylistFromCard = useCallback(
    (playlistItem: (typeof playlists)[number]) => {
      Alert.alert(t.deletePlaylistTitle, t.deletePlaylistConfirm, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deletePlaylist(playlistItem.id);
          },
        },
      ]);
    },
    [deletePlaylist, t.cancel, t.delete, t.deletePlaylistConfirm, t.deletePlaylistTitle],
  );

  const renderPlaylistsGrid = () => (
    <View style={styles.playlistsGrid}>
      {/* Sleek "+ New Playlist" Square Tile */}
      {!searchOpen ? (
        <Pressable
          onPress={openCreateSheet}
          style={({ pressed }) => [
            styles.playlistGridCard,
            { width: gridColumnWidth, opacity: pressed ? 0.76 : 1 },
          ]}
        >
          <View
            style={[
              styles.playlistGridArt,
              styles.newPlaylistGridBox,
              {
                width: gridColumnWidth,
                height: gridColumnWidth,
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(110,22,25,0.06)',
                borderColor: isDarkMode
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(110,22,25,0.18)',
              },
            ]}
          >
            <View
              style={[
                styles.newPlaylistPlusCircle,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(110,22,25,0.12)',
                },
              ]}
            >
              <AppMenuIcon
                ios="plus"
                android="add"
                size={26}
                color={accentColor}
                weight="semibold"
              />
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.playlistGridTitle, { color: accentColor }]}>
            {t.playlistsNewTitle}
          </Text>
          <Text numberOfLines={1} style={[styles.playlistGridSub, { color: mutedSub }]}>
            {t.playlistsCreateButton}
          </Text>
        </Pressable>
      ) : null}

      {sortedPlaylists.map((playlist, idx) => {
        const playableCount = playlist.hymnIds.filter(hasHymnAudio).length;
        const playlistHref = {
          pathname: '/(tabs)/favorites/playlist/[id]',
          params: { id: playlist.id },
        } as const;
        const tintWash = PLAYLIST_TINTS[idx % PLAYLIST_TINTS.length];
        const countLabel = `${playlist.hymnIds.length} ${
          playlist.hymnIds.length === 1 ? t.songCount_one : t.songCount_other
        }`;

        const coverCard = (
          <View
            style={[
              styles.playlistGridArt,
              { width: gridColumnWidth, height: gridColumnWidth },
            ]}
          >
            <Image
              source={EBP_HYMN_COVER}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[tintWash, 'rgba(0,0,0,0.48)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.playlistArtBadge}>
              <AppMenuIcon ios="music.note.list" android="queue-music" size={11} color="#FFFFFF" />
              <Text style={styles.playlistArtBadgeText}>{playlist.hymnIds.length}</Text>
            </View>
          </View>
        );

        return (
          <View
            key={playlist.id}
            style={[styles.playlistGridCard, { width: gridColumnWidth }]}
          >
            {IS_IOS ? (
              <Link href={playlistHref as any} asChild>
                <Link.Trigger>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Link.AppleZoom>{coverCard}</Link.AppleZoom>
                    <Text numberOfLines={1} style={[styles.playlistGridTitle, { color: primaryInk }]}>
                      {playlist.name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.playlistGridSub, { color: mutedSub }]}>
                      {countLabel}
                    </Text>
                  </Pressable>
                </Link.Trigger>

                <Link.Menu title={playlist.name}>
                  <Link.MenuAction
                    icon="play.fill"
                    disabled={playableCount === 0}
                    onPress={() => handlePlayPlaylistFromCard(playlist, false)}
                  >
                    {t.favoritesPlay}
                  </Link.MenuAction>
                  <Link.MenuAction
                    icon="shuffle"
                    disabled={playableCount === 0}
                    onPress={() => handlePlayPlaylistFromCard(playlist, true)}
                  >
                    {t.favoritesShuffle}
                  </Link.MenuAction>
                  <Link.MenuAction
                    icon="trash"
                    destructive
                    onPress={() => handleDeletePlaylistFromCard(playlist)}
                  >
                    {t.deletePlaylist}
                  </Link.MenuAction>
                </Link.Menu>
              </Link>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(playlistHref as any);
                }}
              >
                {coverCard}
                <Text numberOfLines={1} style={[styles.playlistGridTitle, { color: primaryInk }]}>
                  {playlist.name}
                </Text>
                <Text numberOfLines={1} style={[styles.playlistGridSub, { color: mutedSub }]}>
                  {countLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );

  const searchInputInner = (
    <View style={styles.topSearchInner}>
      <AppMenuIcon
        ios="magnifyingglass"
        android="search"
        size={18}
        containerSize={20}
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
        style={[styles.topSearchInput, { color: primaryInk }]}
        autoFocus
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && !IS_IOS ? (
        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
          <MaterialIcons name="close" size={19} color={mutedSub} />
        </Pressable>
      ) : null}
    </View>
  );

  const cancelSearchBtnInner = (
    <Pressable
      onPress={closeSearchTakeover}
      accessibilityRole="button"
      accessibilityLabel={t.close}
      style={({ pressed }) => [styles.circleHit, pressed && { opacity: 0.72 }]}
    >
      <AppMenuIcon
        ios="xmark"
        android="close"
        size={19}
        containerSize={22}
        weight="semibold"
        color={primaryInk}
      />
    </Pressable>
  );

  const hymnSavedText =
    favoriteIds.length === 1
      ? `1 ${t.hymnsSaved_one}`
      : `${favoriteIds.length} ${t.hymnsSaved_other}`;
  const withAudioText = t.favoritesWithAudioCount.replace(
    '{n}',
    String(playableFavoriteIds.length),
  );

  const scrollContent = searchOpen ? (
    <Reanimated.View key="search-takeover" entering={FadeIn.duration(160)}>
      <View style={styles.sectionPad}>
        <GlassGroup spacing={8} style={styles.topSearchRow}>
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={62}
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
            intensity={62}
            style={[styles.glassCircle, !IS_IOS && styles.androidCircleClip]}
          >
            {cancelSearchBtnInner}
          </GlassSurface>
        </GlassGroup>

        <View style={{ marginBottom: 14 }}>
          <LiquidGlassSegmented
            value={activeTab}
            onChange={(next) => setActiveTab(next)}
            items={[
              { key: 'favorites', label: t.myFavorites, count: favoriteIds.length },
              { key: 'playlists', label: t.playlistsTabShort, count: playlists.length },
            ]}
          />
        </View>
      </View>

      {searchQuery.trim().length === 0 ? (
        <View style={styles.searchEmptyPrompt}>
          <AppMenuIcon ios="magnifyingglass" android="search" size={42} color={mutedSub} />
          <Text style={[styles.searchPromptTitle, { color: primaryInk }]}>
            {t.favoritesSearchPromptTitle}
          </Text>
          <Text style={[styles.searchPromptBody, { color: mutedSub }]}>
            {t.favoritesSearchPromptBody}
          </Text>
        </View>
      ) : activeTab === 'favorites' ? (
        favoriteHymns.length === 0 ? (
          <View style={styles.searchEmptyPrompt}>
            <AppMenuIcon ios="magnifyingglass" android="search" size={38} color={mutedSub} />
            <Text style={[styles.searchPromptTitle, { color: primaryInk }]}>
              {t.hymnsNoResultsFound}
            </Text>
          </View>
        ) : (
          renderFavoritesRows()
        )
      ) : sortedPlaylists.length === 0 ? (
        <View style={styles.searchEmptyPrompt}>
          <AppMenuIcon ios="magnifyingglass" android="search" size={38} color={mutedSub} />
          <Text style={[styles.searchPromptTitle, { color: primaryInk }]}>
            {t.hymnsNoResultsFound}
          </Text>
        </View>
      ) : (
        <View style={styles.sectionPad}>{renderPlaylistsGrid()}</View>
      )}

      <View style={{ height: bottomClearance }} />
    </Reanimated.View>
  ) : (
    <>
      {/* ── Segmented Switcher (My Favorites | Playlists) ── */}
      <View style={[styles.sectionPad, { marginBottom: 18 }]}>
        <LiquidGlassSegmented
          value={activeTab}
          onChange={(next) => setActiveTab(next)}
          items={[
            { key: 'favorites', label: t.myFavorites, count: favoriteIds.length },
            { key: 'playlists', label: t.playlistsTabShort, count: playlists.length },
          ]}
        />
      </View>

      {/* ── TAB 1: MY FAVORITES (Apple Music Hero Stage + Open Tracklist) ── */}
      {activeTab === 'favorites' ? (
        favoriteIds.length === 0 ? (
          <View style={[styles.emptyState, styles.sectionPad]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: subtlePillBg }]}>
              <AppMenuIcon ios="bookmark" android="bookmark-border" size={36} color={accentColor} />
            </View>
            <Text style={[styles.emptyText, { color: mutedSub }]}>{t.noFavoritesYet}</Text>
            <TouchableOpacity
              style={[styles.primaryPillBtn, { backgroundColor: playPillBg }]}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/hymns');
              }}
            >
              <Text style={[styles.primaryPillText, { color: playPillInk }]}>{t.exploreHymns}</Text>
              <MaterialIcons name="arrow-forward" size={18} color={playPillInk} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Compact Apple Music 156×156 Parallax Hero Artwork + Editorial Metadata */}
            <View style={styles.heroStage}>
              <Animated.View
                style={[
                  styles.heroCoverShadow,
                  {
                    transform: [{ scale: heroArtworkScale }],
                    opacity: heroArtworkOpacity,
                  },
                ]}
              >
                <View style={styles.heroCoverClip}>
                  <Image
                    source={activeCover.source}
                    style={styles.heroCoverImg}
                    resizeMode="cover"
                    onError={() => setFailedCoverId(activeCover.preset.id)}
                  />
                </View>
              </Animated.View>

              <Text style={[styles.heroTitle, { color: primaryInk }]}>{t.myFavorites}</Text>
              <Text style={[styles.heroBrand, { color: accentColor }]}>{t.appName}</Text>

              <View style={styles.heroMetaRow}>
                <Text
                  style={[
                    styles.heroMetaText,
                    { color: mutedSub, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {`${hymnSavedText} · ${withAudioText}`}
                </Text>
                {playableFavoriteIds.length > 0 ? (
                  <View
                    style={[
                      styles.heroAudioPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.10)'
                          : 'rgba(110,22,25,0.09)',
                      },
                    ]}
                  >
                    <AppMenuIcon ios="waveform" android="graphic-eq" size={10} color={accentColor} />
                    <Text style={[styles.heroAudioPillText, { color: accentColor }]}>
                      {t.favoritesAudioBadge}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Signature Apple Music 3-Button Action Cluster: [Shuffle]  [▶ Play]  [+] */}
              <View style={styles.appleActionCluster}>
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={62}
                  style={[
                    styles.clusterCircle,
                    !IS_IOS && {
                      backgroundColor: subtlePillBg,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: cardBorder,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.favoritesShuffle}
                    onPress={() => handlePlayFavorites(true)}
                    style={({ pressed }) => [styles.clusterCircleHit, pressed && { opacity: 0.72 }]}
                  >
                    <AppMenuIcon
                      ios="shuffle"
                      android="shuffle"
                      size={19}
                      weight="semibold"
                      color={primaryInk}
                    />
                  </Pressable>
                </GlassSurface>

                <TouchableOpacity
                  activeOpacity={0.84}
                  accessibilityRole="button"
                  accessibilityLabel={t.favoritesPlay}
                  onPress={() => handlePlayFavorites(false)}
                  style={[styles.clusterPlayPill, { backgroundColor: playPillBg }]}
                >
                  <AppMenuIcon
                    ios="play.fill"
                    android="play-arrow"
                    size={18}
                    weight="semibold"
                    color={playPillInk}
                  />
                  <Text style={[styles.clusterPlayText, { color: playPillInk }]}>
                    {t.favoritesPlay}
                  </Text>
                </TouchableOpacity>

                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={62}
                  style={[
                    styles.clusterCircle,
                    !IS_IOS && {
                      backgroundColor: subtlePillBg,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: cardBorder,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.playlistsNewTitle}
                    onPress={openCreateSheet}
                    style={({ pressed }) => [styles.clusterCircleHit, pressed && { opacity: 0.72 }]}
                  >
                    <AppMenuIcon
                      ios="plus"
                      android="add"
                      size={20}
                      weight="semibold"
                      color={primaryInk}
                    />
                  </Pressable>
                </GlassSurface>
              </View>
            </View>

            {/* Full-Bleed Hairline Separator into Open Tracklist */}
            <View style={[styles.topTrackHairline, { backgroundColor: hairline }]} />
            {renderFavoritesRows()}

            {/* Apple Music–Style Editorial Footer */}
            <View style={[styles.editorialFooter, { borderTopColor: hairline }]}>
              <Text
                style={[
                  styles.editorialFooterText,
                  { color: mutedSub, fontVariant: ['tabular-nums'] },
                ]}
              >
                {`${hymnSavedText} · ${withAudioText}`}
              </Text>
              <Text style={[styles.editorialFooterText, { color: mutedSub }]}>
                {t.favoritesSortedBy.replace('{label}', currentSortLabel)}
              </Text>
            </View>
          </>
        )
      ) : (
        /* ── TAB 2: PLAYLISTS (Apple Music 2-Column Cover Grid) ── */
        <View style={styles.sectionPad}>
          <View style={styles.playlistsHeaderRow}>
            <Text style={[styles.playlistsSectionTitle, { color: primaryInk }]}>
              {t.playlistsTitle}
            </Text>
            <Text style={[styles.playlistsSectionCount, { color: mutedSub }]}>
              {`${playlists.length} ${
                playlists.length === 1 ? t.playlistsCount_one : t.playlistsCount_other
              }`}
            </Text>
          </View>
          {renderPlaylistsGrid()}
        </View>
      )}

      {/* Quiet Editorial Scripture Liner Note */}
      <View style={styles.quoteBlock}>
        <Text style={[styles.quoteText, { color: mutedSub }]}>{t.favoritesQuoteText}</Text>
        <Text style={[styles.quoteAuthor, { color: mutedSub }]}>{t.favoritesQuoteAuthor}</Text>
      </View>

      <View style={{ height: bottomClearance }} />
    </>
  );

  return (
    <TabSwipeWrapper currentTab="favorites" style={[styles.root, { backgroundColor: canvasBg }]}>
      {/* ── Atmospheric Apple Music Top Color Wash ── */}
      <LinearGradient
        colors={
          isDarkMode
            ? ['rgba(122, 24, 30, 0.56)', 'rgba(54, 12, 16, 0.24)', 'rgba(0, 0, 0, 0)']
            : ['rgba(110, 22, 25, 0.14)', 'rgba(110, 22, 25, 0.04)', 'rgba(252, 249, 242, 0)']
        }
        style={[styles.atmosphericWash, { height: insets.top + ipadTopOffset + 340 }]}
        pointerEvents="none"
      />

      {/* ── Pinned Floating Liquid Glass Top Bar (Zero Status-Bar Overlap!) ── */}
      {!searchOpen ? (
        <>
          <LinearGradient
            colors={
              isDarkMode
                ? ['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.58)', 'rgba(0,0,0,0)']
                : ['rgba(252,249,242,0.95)', 'rgba(252,249,242,0.68)', 'rgba(252,249,242,0)']
            }
            style={[styles.topScrim, { height: topBarHeight + 18 }]}
            pointerEvents="none"
          />
          <View
            pointerEvents="box-none"
            style={[styles.stickyTopBar, { paddingTop: insets.top + ipadTopOffset + 6 }]}
          >
            <View style={styles.stickyBarSpacer} />
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.stickyBarTitle,
                { color: primaryInk, opacity: stickyTitleOpacity },
              ]}
            >
              {activeTab === 'favorites' ? t.myFavorites : t.playlistsTitle}
            </Animated.Text>
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={[styles.actionsCapsule, !IS_IOS && styles.androidCircleClip]}
            >
              <View style={styles.actionsCapsuleInner}>
                {searchTriggerNode}
                {activeTab === 'playlists' ? createTriggerNode : null}
                {sortMenuNode}
              </View>
            </GlassSurface>
          </View>
        </>
      ) : null}

      <Animated.ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: searchOpen ? insets.top + ipadTopOffset + 10 : topBarHeight + 6 },
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

      {/* ── Add to Playlist Modal (triggered from any track's `···` menu) ── */}
      <AddToPlaylistModal
        visible={Boolean(playlistModalHymnId)}
        onClose={() => setPlaylistModalHymnId(null)}
        hymnId={playlistModalHymnId || ''}
      />

      {/* ── Create New Playlist Sheet ── */}
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
                      backgroundColor: playPillBg,
                      opacity: newPlaylistName.trim() ? 1 : 0.45,
                    },
                  ]}
                >
                  <Text style={[styles.createConfirmText, { color: playPillInk }]}>
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
  atmosphericWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stickyBarSpacer: {
    width: 84,
  },
  stickyBarTitle: {
    flex: 1,
    textAlign: 'center',
    ...fonts.sansSemiBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
  },
  scroll: {
    flexGrow: 1,
  },
  sectionPad: {
    paddingHorizontal: 20,
  },
  actionsCapsule: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  actionsCapsuleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  circleHit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidCircleClip: {
    overflow: 'hidden',
  },
  heroStage: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCoverShadow: {
    width: 156,
    height: 156,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    marginBottom: 14,
  },
  heroCoverClip: {
    width: 156,
    height: 156,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  heroCoverImg: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    ...fonts.sansBold,
    fontSize: 23,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroBrand: {
    ...fonts.sansMedium,
    fontSize: 15.5,
    marginTop: 2,
    textAlign: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 6,
  },
  heroMetaText: {
    ...fonts.sansMedium,
    fontSize: 12.5,
  },
  heroAudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  heroAudioPillText: {
    ...fonts.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  appleActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
    width: '100%',
  },
  clusterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clusterCircleHit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterPlayPill: {
    flex: 1,
    maxWidth: 196,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
  },
  clusterPlayText: {
    ...fonts.sansSemiBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
  },
  topTrackHairline: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  tracklistWrap: {
    width: '100%',
  },
  trackRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    minHeight: 58,
  },
  trackNumCol: {
    width: 44,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumText: {
    ...fonts.sansMedium,
    fontSize: 15,
  },
  trackMainHit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 6,
  },
  trackTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  trackSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackSubText: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    flexShrink: 1,
  },
  audioMicroBadge: {
    width: 18,
    height: 15,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  editorialFooter: {
    marginTop: 14,
    paddingTop: 14,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  editorialFooterText: {
    ...fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  playlistsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  playlistsSectionTitle: {
    ...fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  playlistsSectionCount: {
    ...fonts.sansMedium,
    fontSize: 13.5,
  },
  playlistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  playlistGridCard: {
    marginBottom: 6,
  },
  playlistGridArt: {
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  newPlaylistGridBox: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistPlusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistArtBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  playlistArtBadgeText: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  playlistGridTitle: {
    ...fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  playlistGridSub: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    marginTop: 1,
  },
  topSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  topSearchPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  topSearchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  topSearchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchEmptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    gap: 10,
  },
  searchPromptTitle: {
    ...fonts.sansSemiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  searchPromptBody: {
    ...fonts.sansRegular,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 14,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 15.5,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    marginTop: 4,
  },
  primaryPillText: {
    ...fonts.sansSemiBold,
    fontSize: 15.5,
  },
  quoteBlock: {
    marginTop: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  quoteText: {
    ...fonts.regularItalic,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
  },
  quoteAuthor: {
    ...fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  modalBackdropWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.44)',
  },
  createSheetOuter: {
    width: '100%',
  },
  grabberHitZone: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  createSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
  },
  createSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createSheetTitle: {
    ...fonts.sansBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  createSheetSub: {
    ...fonts.sansRegular,
    fontSize: 13.5,
  },
  closeGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    ...fonts.sansRegular,
    fontSize: 16,
  },
  createConfirmBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  createConfirmText: {
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
});
