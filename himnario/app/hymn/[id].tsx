/**
 * HymnDetail component — Displays the full lyrics and metadata for a specific hymn.
 *
 * Responsibility:
 * - Fetches hymn data based on the `id` parameter.
 * - Displays the hymn title, number, author, and reference.
 * - Renders the lyrics formatted into stanzas.
 * - Provides floating controls for font size, theme, and audio playback.
 * - Manages "Recently Viewed" history and "Favorites" toggling.
 *
 * @returns {React.JSX.Element} The rendered Hymn Detail screen.
 */
import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MenuView } from '@react-native-menu/menu';
import { useTheme } from '../../theme/ThemeContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { useFavorites } from '../../context/FavoritesContext';
import { useRecentHymns } from '../../context/RecentHymnsContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import AddToPlaylistModal from '../../components/AddToPlaylistModal';
import TextSizeSheet from '../../components/TextSizeSheet';
import ProjectorModal from '../../components/ProjectorModal';
import ShareSheet from '../../components/ShareSheet';
import VerseDiscussionSheet from '../../components/VerseDiscussionSheet';
import AppMenuIcon from '../../components/AppMenuIcon';
import WebIcon from '../../components/WebIcon';
import AndroidReaderControls from '../../components/AndroidReaderControls';
import GlassSurface from '../../components/GlassSurface';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { hasHymnAudio } from '../../data/audioRegistry';
import { offlineAudio } from '../../audio/offline-audio';
import { sendFeedbackEmail } from '../../utils/feedback';
import { useHymnCommunity } from '../../utils/hymnCommunity';
import PageFlipTransition, { type FlipDirection } from '../../components/PageFlipTransition';

// Module-level constants — defined outside the component so they are never
// recreated on each render. CORO_RE detects chorus stanzas by their prefix.
const CORO_RE = /^((?:\d+\s*(?:er|do|ro|to|ndo|st|nd|rd|th)?\.?\s*)?(?:coro|chorus))[:\s]*/i;

function formatChorusLabel(rawLabel: string | undefined, hymnLanguage: 'es' | 'en'): string {
  const fallback = hymnLanguage === 'en' ? 'CHORUS' : 'CORO';
  if (!rawLabel) return fallback;
  const upper = rawLabel.trim().toUpperCase();
  if (hymnLanguage === 'en') {
    return upper
      .replace(/\b1\s*ER\.?\s*CORO\b/, '1ST CHORUS')
      .replace(/\b2\s*DO\.?\s*CORO\b/, '2ND CHORUS')
      .replace(/\b3\s*ER\.?\s*CORO\b/, '3RD CHORUS')
      .replace(/\bCORO\b/, 'CHORUS');
  }
  return upper.replace(/\bCHORUS\b/, 'CORO');
}
const IS_IPAD = Platform.OS === 'ios' && Boolean((Platform as any).isPad);
type Stanza = { isCoro: boolean; text: string; verseNum: number; coroLabel?: string };

export default function HymnDetail() {
  const { id, playlistId, source, sort } = useLocalSearchParams();
  const isFromFavorites = String(source ?? '') === 'favorites';
  const favSortParam = String(sort ?? 'recent');
  const router = useRouter();
  const { theme, isDarkMode, fontSizeMultiplier, toggleTheme } = useTheme();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { addRecent } = useRecentHymns();
  const { playlists } = usePlaylists();
  const { t, language, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  // Combine both for navigation
  const allHymns = useMemo(() => {
    // If we want seamless navigation between himnos and estribillos, we can concatenate them.
    // However, since estribillos are a separate list, it might be better to only navigate within the same type.
    const isEstribillo = String(id).startsWith('E');
    return isEstribillo ? estribillosData : hymnsData;
  }, [id]);

  const activePlaylist = useMemo(() => {
    if (!playlistId) return null;
    return playlists.find(p => String(p.id) === String(playlistId)) || null;
  }, [playlistId, playlists]);

  const hymnList = useMemo(() => {
    if (activePlaylist) {
      const combined = [...hymnsData, ...estribillosData];
      return activePlaylist.hymnIds.map((hId: string) => {
        return combined.find(h => String(h.id) === String(hId));
      }).filter(Boolean);
    }
    if (isFromFavorites && favoriteIds.length > 0) {
      const combined = [...hymnsData, ...estribillosData];
      const byId = new Map<string, any>();
      for (const h of combined) byId.set(String(h.id), h);
      const list = favoriteIds.map((fId) => byId.get(String(fId))).filter(Boolean);
      const displayLang = language === 'en' ? 'en' : hymnLanguage;
      if (favSortParam === 'recent') {
        list.reverse();
      } else if (favSortParam === 'number') {
        list.sort((a: any, b: any) => {
          const aClean = String(a.id).trim();
          const bClean = String(b.id).trim();
          const aChorus = aClean.startsWith('E') ? 1 : 0;
          const bChorus = bClean.startsWith('E') ? 1 : 0;
          if (aChorus !== bChorus) return aChorus - bChorus;
          const aNum = parseInt(aClean.replace(/[^\d]/g, ''), 10) || 0;
          const bNum = parseInt(bClean.replace(/[^\d]/g, ''), 10) || 0;
          if (aNum !== bNum) return aNum - bNum;
          return aClean.localeCompare(bClean);
        });
      } else if (favSortParam === 'alpha') {
        list.sort((a: any, b: any) =>
          getLocalizedHymn(a, displayLang).title.localeCompare(getLocalizedHymn(b, displayLang).title),
        );
      }
      if (list.some(h => String(h.id) === String(id))) {
        return list;
      }
    }
    return allHymns;
  }, [activePlaylist, isFromFavorites, favoriteIds, favSortParam, language, hymnLanguage, id, allHymns]);

  const currentIndex = useMemo(
    () => hymnList.findIndex((h: any) => String(h.id) === String(id)),
    [id, hymnList],
  );
  const prevHymn = currentIndex > 0 ? hymnList[currentIndex - 1] : null;
  const nextHymn = currentIndex >= 0 && currentIndex < hymnList.length - 1 ? hymnList[currentIndex + 1] : null;

  // ── Page-flip navigation ────────────────────────────────────
  const [flipDirection, setFlipDirection] = useState<FlipDirection>('right');
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [textSizeSheetVisible, setTextSizeSheetVisible] = useState(false);
  const [projectorVisible, setProjectorVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const offlineSnapshot = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const {
    commentVerseId,
    summary: hymnSummary,
    isAdmin,
    react: reactToHymn,
    refresh: refreshHymnCommunity,
  } = useHymnCommunity(String(id));

  // Hard cooldown — disables buttons for 1s after any tap
  const [navDisabled, setNavDisabled] = useState(false);

  const goToPrev = useCallback(() => {
    if (!prevHymn || navDisabled) return;
    setNavDisabled(true);
    setFlipDirection('left');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playlistId) {
      router.replace({ pathname: '/hymn/[id]', params: { id: prevHymn.id, playlistId } });
    } else if (isFromFavorites) {
      router.replace({ pathname: '/hymn/[id]', params: { id: prevHymn.id, source: 'favorites', sort: favSortParam } });
    } else {
      router.replace(`/hymn/${prevHymn.id}`);
    }
    setTimeout(() => setNavDisabled(false), 800);
  }, [prevHymn, navDisabled, router, playlistId, isFromFavorites, favSortParam]);

  const goToNext = useCallback(() => {
    if (!nextHymn || navDisabled) return;
    setNavDisabled(true);
    setFlipDirection('right');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playlistId) {
      router.replace({ pathname: '/hymn/[id]', params: { id: nextHymn.id, playlistId } });
    } else if (isFromFavorites) {
      router.replace({ pathname: '/hymn/[id]', params: { id: nextHymn.id, source: 'favorites', sort: favSortParam } });
    } else {
      router.replace(`/hymn/${nextHymn.id}`);
    }
    setTimeout(() => setNavDisabled(false), 800);
  }, [nextHymn, navDisabled, router, playlistId, isFromFavorites, favSortParam]);

  /** Handle swipe-to-flip gestures from the PageFlipTransition component */
  const handleSwipeFlip = useCallback((dir: FlipDirection) => {
    if (dir === 'right' && nextHymn) {
      goToNext();
    } else if (dir === 'left' && prevHymn) {
      goToPrev();
    }
  }, [goToNext, goToPrev, nextHymn, prevHymn]);

  // ── Music Player via global context ──────────────────────────
  const { showFullPlayer, openPlayer, currentHymnId } = useNowPlaying();

  // When the mini player is visible, shift nav buttons up to avoid overlap
  const miniPlayerVisible = !!currentHymnId && !showFullPlayer;
  const baseNavBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 22) + 78 + 6 : 92;
  const navBtnBottom = miniPlayerVisible ? baseNavBottom + 70 : baseNavBottom;

  const hymnAudio = (h: any) => hasHymnAudio(String(h?.id ?? ''));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePlayAudio = (h: any) => {
    if (!hymnAudio(h)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activePlaylist) {
      openPlayer(String(h.id), activePlaylist.hymnIds, { label: activePlaylist.name });
    } else if (isFromFavorites) {
      const favQueue = hymnList.map((item: any) => String(item.id));
      openPlayer(String(h.id), favQueue.length > 0 ? favQueue : favoriteIds, { label: t.myFavorites });
    } else {
      openPlayer(String(h.id), null);
    }
  };

  const handleBookmark = (h: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(String(h.id));
  };

  // "HIMNO N.º 243" / "HYMN NO. 243" above the title (choruses say ESTRIBILLO / CHORUS).
  const numberLabel = useCallback(
    (h: { id: string | number; number: string | number }) =>
      (String(h.id).startsWith('E') ? t.chorusNumberLabel : t.hymnNumberLabel).replace(
        '{n}',
        String(h.number),
      ),
    [t],
  );

  const handleShare = (_h: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareSheetVisible(true);
  };

  const rawHymn = allHymns.find((h) => h.id === id || h.id === String(id));
  const hymn = useMemo(
    () => (rawHymn ? getLocalizedHymn(rawHymn, hymnLanguage) : undefined),
    [rawHymn, hymnLanguage],
  );

  // Record this hymn as recently viewed
  useEffect(() => {
    if (hymn) addRecent(String(hymn.id));
  }, [hymn, addRecent]);

  const lyricFontSize = Math.round(22 * fontSizeMultiplier);
  // Theme-reactive coro label colour: Sacred Ink burgundy in light, pure white in dark
  const CORO_COLOR = isDarkMode ? '#ffffff' : '#6e1619';

  // Memoize Stack.Screen options so setOptions is only called when the
  // background colour actually changes — prevents an infinite setState loop
  // that occurs when a fresh object is passed to Stack.Screen on every render.
  const screenOptions = useMemo(() => ({
    animation: 'fade' as const,
    gestureEnabled: false,
    headerShown: false,
    contentStyle: { backgroundColor: theme.background },
  }), [theme.background]);

  // ── Static hymn preview for swipe underlays ─────────────────────────
  // Renders a lightweight, non-interactive snapshot of a hymn's title + lyrics.
  // Shown underneath the current page during swipe gestures.
  const renderStaticHymnPreview = useCallback((hymnData: typeof hymn | null) => {
    if (!hymnData) return null;
    const localizedPreview = getLocalizedHymn(hymnData, hymnLanguage);

    // Quick stanza split without complex context
    const previewStanzas = localizedPreview.lyrics.split('\n\n').map((raw: string) => {
      const trimmed = raw.trimStart();
      const match = trimmed.match(CORO_RE);
      const isCoro = !!match;
      const coroLabel = isCoro ? formatChorusLabel(match![1], hymnLanguage) : undefined;
      const text = isCoro ? trimmed.replace(CORO_RE, '').trim() : trimmed;
      return { isCoro, text, coroLabel };
    });

    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View style={styles.hymnHeader}>
            <Text style={[styles.hymnNumber, { color: theme.onSurfaceVariant }]}>
              {numberLabel(localizedPreview)}
            </Text>
            <Text style={[styles.hymnTitle, { color: theme.primary }]}>
              {localizedPreview.title}
            </Text>
          </View>
          <View style={styles.lyricsArea}>
            {previewStanzas.map((stanza: { isCoro: boolean; text: string; coroLabel?: string }, idx: number) => (
              <View key={idx} style={styles.stanzaBlock}>
                <Text
                  style={[
                    styles.stanzaLabel,
                    { color: theme.outline, opacity: 0.5 },
                    stanza.isCoro && { color: CORO_COLOR, opacity: 1 },
                  ]}
                >
                  {stanza.isCoro ? (stanza.coroLabel || formatChorusLabel(undefined, hymnLanguage)) : ''}
                </Text>
                <Text style={[
                  styles.stanzaText,
                  stanza.isCoro && styles.stanzaTextCoro,
                  { color: theme.onSurface, fontSize: lyricFontSize, lineHeight: lyricFontSize * 2 },
                ]}>
                  {stanza.text}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 180 }} />
        </ScrollView>
      </View>
    );
  }, [theme, lyricFontSize, CORO_COLOR, hymnLanguage, numberLabel]);

  if (!hymn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.iconBtn, { marginTop: insets.top }]}
        >
          <MaterialIcons name="close" size={26} color={theme.outline} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.onSurface, ...fonts.regular, fontSize: 18 }}>
            {t.hymnNotFound}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Split lyrics into stanzas at blank lines and classify each one.
  // A stanza is a 'coro' if its first line starts with "Coro" (case-insensitive).
  // The leading "Coro:" / "Coro" prefix is stripped from the displayed text
  // so it doesn't appear twice — the label in the gutter acts as the marker.
  let verseCounter = 0;
  const stanzas: Stanza[] = hymn.lyrics.split('\n\n').map((raw: string) => {
    const trimmed = raw.trimStart();
    const match = trimmed.match(CORO_RE);
    const isCoro = !!match;
    const coroLabel = isCoro ? formatChorusLabel(match[1], hymnLanguage) : undefined;
    const text = isCoro ? trimmed.replace(CORO_RE, '').trim() : trimmed;

    if (!isCoro) verseCounter++;
    return { isCoro, text, verseNum: isCoro ? 0 : verseCounter, coroLabel };
  });
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* ── Per-screen modal options (Expo Router pattern) ───────────────
          Declaring options here (not in _layout.tsx) avoids the
          "extraneous route" warning from Expo Router's file-system
          auto-discovery. presentation:'modal' triggers the native
          iOS page-sheet with swipe-down dismiss + drag handle.     */}
      <Stack.Screen options={screenOptions} />

      {/* ─── Modal Header — static (no collapsible; sheet has native drag-dismiss) ── */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          {/* ✕ Close — top-left, standard iOS modal position */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color={theme.outline} />
          </TouchableOpacity>

          {/* App title — centred */}
          <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>
            Himnario EBP
          </Text>

          {/* Playlist, Bookmark + Share — top-right */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setProjectorVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.projectHymn}
            >
              <MaterialIcons name="present-to-all" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setPlaylistModalVisible(true)}>
              {Platform.OS === 'android' ? <WebIcon name="list" color={theme.primary} size={26} /> : <MaterialIcons name="playlist-add" size={28} color={theme.primary} />}
            </TouchableOpacity>
            <MenuView
              themeVariant={isDarkMode ? 'dark' : 'light'}
              shouldOpenOnLongPress={false}
              actions={[
                {
                  id: 'favorite',
                  title: isFavorite(String(hymn.id))
                    ? t.offlineAudioBadge
                    : t.save,
                  state: isFavorite(String(hymn.id)) ? 'on' : 'off',
                  image: Platform.select({
                    ios: isFavorite(String(hymn.id)) ? 'bookmark.fill' : 'bookmark',
                    default: undefined,
                  }),
                  imageColor: isFavorite(String(hymn.id)) ? theme.primary : theme.onSurface,
                },
                {
                  id: 'like',
                  title: `${t.playerLike}${
                    hymnSummary.likesCount > 0 ? ` (${hymnSummary.likesCount})` : ''
                  }`,
                  state: hymnSummary.myReaction === 1 ? 'on' : 'off',
                  image: Platform.select({
                    ios: hymnSummary.myReaction === 1 ? 'hand.thumbsup.fill' : 'hand.thumbsup',
                    default: undefined,
                  }),
                  imageColor: hymnSummary.myReaction === 1 ? theme.primary : theme.onSurface,
                },
                {
                  id: 'dislike',
                  title: `${t.playerDislike}${
                    isAdmin &&
                    typeof hymnSummary.dislikesCount === 'number' &&
                    hymnSummary.dislikesCount > 0
                      ? ` (${hymnSummary.dislikesCount})`
                      : ''
                  }`,
                  state: hymnSummary.myReaction === -1 ? 'on' : 'off',
                  image: Platform.select({
                    ios: hymnSummary.myReaction === -1 ? 'hand.thumbsdown.fill' : 'hand.thumbsdown',
                    default: undefined,
                  }),
                  imageColor: hymnSummary.myReaction === -1 ? theme.primary : theme.onSurface,
                },
                {
                  id: 'comments',
                  title: `${t.playerComments}${
                    hymnSummary.commentsCount > 0 ? ` (${hymnSummary.commentsCount})` : ''
                  }`,
                  image: Platform.select({
                    ios: 'bubble.left',
                    default: undefined,
                  }),
                  imageColor: theme.onSurface,
                },
              ]}
              onPressAction={({ nativeEvent }) => {
                const action = nativeEvent.event;
                if (action === 'favorite') {
                  handleBookmark(hymn);
                } else if (action === 'like') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  reactToHymn(1);
                } else if (action === 'dislike') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  reactToHymn(-1);
                } else if (action === 'comments') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCommentsOpen(true);
                }
              }}
            >
              <View
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={t.readerCommunityAndFavorites}
              >
                <AppMenuIcon
                  ios={
                    isFavorite(String(hymn.id)) || hymnSummary.myReaction !== 0
                      ? 'cloud.fill'
                      : 'cloud'
                  }
                  android={
                    isFavorite(String(hymn.id)) || hymnSummary.myReaction !== 0
                      ? 'cloud'
                      : 'cloud-queue'
                  }
                  size={23}
                  color={theme.primary}
                />
              </View>
            </MenuView>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleShare(hymn)}>
              {Platform.OS === 'android' ? <WebIcon name="share" color={theme.primary} size={24} /> : <MaterialIcons name="share" size={24} color={theme.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Status Bar Scrim ──────────────────────────────────── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 16 }]}
        pointerEvents="none"
      />

      <PageFlipTransition
        pageKey={String(id)}
        direction={flipDirection}
        onSwipeFlip={handleSwipeFlip}
        gestureEnabled={!navDisabled}
        hasPrev={!!prevHymn}
        hasNext={!!nextHymn}
        isDarkMode={isDarkMode}
        renderPrevPage={() => renderStaticHymnPreview(prevHymn)}
        renderNextPage={() => renderStaticHymnPreview(nextHymn)}
      >
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          {/* ─── Scrollable Lyrics Canvas ─────────────────────────── */}
          <ScrollView
            contentContainerStyle={[styles.scroll, IS_IPAD && styles.tabletCenter]}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Hymn Title Section ────────────────────── */}
            <View style={styles.hymnHeader}>
              <Text style={[styles.hymnNumber, { color: theme.onSurfaceVariant }]}>
                {numberLabel(hymn)}
              </Text>
              <Text style={[styles.hymnTitle, { color: theme.primary }]}>
                {hymn.title}
              </Text>

              {/* Author / Reference row */}
              {(hymn.author || hymn.reference) && (
                <View style={styles.metaRow}>
                  {hymn.author ? (
                    <Text style={[styles.metaText, { color: theme.onSurfaceVariant }]}>
                      {hymn.author.toUpperCase()}
                    </Text>
                  ) : null}
                  {hymn.author && hymn.reference ? (
                    <View style={[styles.metaDot, { backgroundColor: theme.outlineVariant, opacity: 0.3 }]} />
                  ) : null}
                  {hymn.reference ? (
                    <Text style={[styles.metaText, { color: theme.onSurfaceVariant }]}>
                      {hymn.reference.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* ─── Stanzas ──────────────────────────────── */}
            <View style={styles.lyricsArea}>
              {stanzas.map((stanza, idx) => (
                <View key={idx} style={styles.stanzaBlock}>
                  {/* Side label — 'Coro' in red/white, or verse number in primary colour */}
                  <Text
                    style={[
                      styles.stanzaLabel,
                      { color: theme.outline, opacity: 0.5 },
                      stanza.isCoro && { color: CORO_COLOR, opacity: 1 },
                    ]}
                  >
                    {stanza.isCoro ? (stanza.coroLabel || formatChorusLabel(undefined, hymnLanguage)) : String(stanza.verseNum)}
                  </Text>
                  <Text style={[
                    styles.stanzaText,
                    stanza.isCoro && styles.stanzaTextCoro,
                    { color: theme.onSurface, fontSize: lyricFontSize, lineHeight: lyricFontSize * 2 },
                  ]}>
                    {stanza.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={[styles.hymnFooter, { borderTopColor: theme.outlineVariant + '1A' }]}>
              <Text style={[styles.footerText, { color: theme.onSurfaceVariant }]}>
                {hymn.author ? `${hymn.author}` : 'Himnario El Buen Pastor'}
              </Text>
              {/* Audio credit line — shows channel name when available */}
              {hymn.audioCredit?.name ? (
                <Text style={[styles.creditText, { color: theme.onSurfaceVariant }]}>
                  🎵 Audio: @{hymn.audioCredit.name}
                </Text>
              ) : null}
              {/* Report error link */}
              <TouchableOpacity
                onPress={() => sendFeedbackEmail(language, hymn.number, hymn.title)}
                style={styles.footerReportBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="mail-outline" size={15} color={theme.primary} />
                <Text
                  style={[styles.footerReportText, { color: theme.primary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {t.reportHymnError}
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 180 }} />
          </ScrollView>
        </SafeAreaView>
      </PageFlipTransition>

      {/* Android matches the website; iOS retains its reading pill. */}
      {Platform.OS === 'android' ? (
        <AndroidReaderControls onText={() => setTextSizeSheetVisible(true)} onTheme={toggleTheme}
          onAudio={() => handlePlayAudio(hymn)} hasAudio={hymnAudio(hymn)} />
      ) : <View style={[
        styles.floatWrap, 
        { bottom: Math.max(insets.bottom, 22) } 
      ]}>
        <GlassSurface
          intensity={55}
          isInteractive
          tonalColor={theme.surfaceVariants.containerLow}
          style={[
            styles.floatPill,
            { shadowColor: theme.onSurface },
          ]}
        >
          {/* Text Size — native iOS 26 Liquid Glass formSheet on iOS, modal popover elsewhere */}
          <TouchableOpacity style={styles.controlItem} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (Platform.OS === 'ios') {
              router.push('/text-size-sheet' as any);
            } else {
              setTextSizeSheetVisible(true);
            }
          }}>
            <View style={[styles.controlCircle, { backgroundColor: theme.surfaceVariants.containerHigh }]}>
              <MaterialIcons name="format-size" size={20} color={theme.onSurfaceVariant} />
            </View>
            <Text style={[styles.controlLabel, { color: theme.onSurfaceVariant }]}>{t.textSize}</Text>
          </TouchableOpacity>

          <View style={[styles.controlDivider, { backgroundColor: theme.outlineVariant }]} />

          {/* Dark / Light Mode */}
          <TouchableOpacity style={styles.controlItem} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleTheme();
          }}>
            <View style={[styles.controlCircle, { backgroundColor: theme.surfaceVariants.containerHigh }]}>
              <MaterialIcons name={isDarkMode ? "light-mode" : "dark-mode"} size={20} color={theme.onSurfaceVariant} />
            </View>
            <Text style={[styles.controlLabel, { color: theme.onSurfaceVariant }]}>{isDarkMode ? t.lightMode : t.darkMode}</Text>
          </TouchableOpacity>

          <View style={[styles.controlDivider, { backgroundColor: theme.outlineVariant }]} />

          {/* Audio Play — always visible; red if available, grey if not */}
          <TouchableOpacity
            style={styles.controlItem}
            onPress={() => handlePlayAudio(hymn)}
            disabled={!hymnAudio(hymn)}
          >
            <View style={[styles.controlCircle, {
              backgroundColor: !hymnAudio(hymn)
                ? theme.outlineVariant + '33'
                : isDarkMode
                  ? theme.surfaceVariants.containerHigh
                  : '#7B1F1D',
            }]}>
              <MaterialIcons
                name="play-arrow"
                size={20}
                color={!hymnAudio(hymn)
                  ? theme.onSurfaceVariant + '66'
                  : isDarkMode
                    ? theme.onSurfaceVariant
                    : '#ffffff'}
              />
              {offlineSnapshot.savedIds.has(String(hymn.id)) && (
                <View style={[styles.savedBadgeDot, { backgroundColor: theme.primary }]} />
              )}
            </View>
            <Text style={[styles.controlLabel, {
              color: !hymnAudio(hymn)
                ? theme.onSurfaceVariant + '66'
                : isDarkMode
                  ? theme.onSurfaceVariant
                  : '#7B1F1D',
            }]}>AUDIO</Text>
          </TouchableOpacity>
        </GlassSurface>{/* floatPill */}
      </View>}{/* floatWrap */}


      {/* ── Prev / Next hymn navigation buttons (bottom edges) ───── */}
      {prevHymn && (
        <TouchableOpacity
          style={[styles.hymnNavBtn, styles.hymnNavBtnLeft, { bottom: navBtnBottom }, navDisabled && { opacity: 0.15 }]}
          onPress={goToPrev}
          activeOpacity={0.6}
          disabled={navDisabled}
        >
          <MaterialIcons name="chevron-left" size={20} color={theme.onSurfaceVariant} />
          <Text style={[styles.hymnNavBtnText, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            {prevHymn.number}
          </Text>
        </TouchableOpacity>
      )}
      {nextHymn && (
        <TouchableOpacity
          style={[styles.hymnNavBtn, styles.hymnNavBtnRight, { bottom: navBtnBottom }, navDisabled && { opacity: 0.15 }]}
          onPress={goToNext}
          activeOpacity={0.6}
          disabled={navDisabled}
        >
          <Text style={[styles.hymnNavBtnText, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            {nextHymn.number}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
      )}

      {/* Playback presentation is owned once by the root layout. */}

      {/* ─── Add to Playlist Modal ───────────────────────── */}
      <AddToPlaylistModal 
        visible={playlistModalVisible} 
        onClose={() => setPlaylistModalVisible(false)} 
        hymnId={String(hymn.id)} 
      />

      {/* ─── Text Size Popover / Sheet (Workstream C) ────── */}
      <TextSizeSheet
        visible={textSizeSheetVisible}
        onClose={() => setTextSizeSheetVisible(false)}
      />

      {/* ─── Projector / Presentation Mode (Workstream D) ── */}
      <ProjectorModal
        visible={projectorVisible}
        onClose={() => setProjectorVisible(false)}
        hymn={hymn}
        stanzas={stanzas}
        initialDarkMode={isDarkMode}
      />

      {/* ─── Unified Share Sheet (Workstream E) ──────────── */}
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        hymn={hymn}
      />

      {/* ─── Hymn Comments Discussion Sheet ──────────────── */}
      <VerseDiscussionSheet
        visible={commentsOpen}
        onClose={() => {
          setCommentsOpen(false);
          void refreshHymnCommunity();
        }}
        verse={{
          id: commentVerseId,
          es: { ref: `${hymn.number} · ${hymn.title}`, text: '' },
          en: { ref: `${hymn.number} · ${hymn.title}`, text: '' },
        }}
        titleOverride={{
          es: 'Comentarios del himno',
          en: 'Hymn comments',
        }}
        subtitleOverride={`${String(id).startsWith('E') ? (language === 'en' ? 'Chorus' : 'Estribillo') : (language === 'en' ? 'Hymn' : 'Himno')} ${hymn.number} · ${hymn.title}`}
        onChanged={() => {
          void refreshHymnCommunity();
        }}
      />

    </View>
  );
}

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabletCenter: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  safe: { flex: 1 },
  container: { flex: 1 },

  // Prev / Next hymn tappable navigation buttons
  hymnNavBtn: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 6,
    zIndex: 55,
    opacity: 0.5,
  },
  hymnNavBtnLeft: { left: 4 },
  hymnNavBtnRight: { right: 4 },
  hymnNavBtnText: {
    ...fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  headerContainer: {
    // Static positioning — no absolute needed; sits at top of flex column
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    ...fonts.bold,
    fontSize: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row' },
  iconBtn: { padding: 8 },

  scroll: {
    paddingHorizontal: 24,
  },

  hymnHeader: {
    alignItems: 'center',
    marginBottom: 64,
  },
  hymnNumber: {
    ...fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 2.6,
    marginBottom: 12,
  },
  hymnTitle: {
    ...fonts.bold,
    fontSize: 38,
    textAlign: 'center',
    lineHeight: 46,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  metaText: {
    ...fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.6,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  lyricsArea: {
    gap: 48,
  },
  stanzaBlock: {
    alignItems: 'stretch',
  },
  // Side label shared base — verse number or 'Coro'
  stanzaLabel: {
    ...fonts.sansBold,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  stanzaText: {
    ...fonts.regular,
    textAlign: 'center',
    width: '100%',
  },
  // Coro stanzas get a subtle italic treatment to visually differentiate them
  stanzaTextCoro: {
    ...fonts.regularItalic,
    opacity: 0.88,
  },

  hymnFooter: {
    marginTop: 80,
    paddingTop: 32,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    ...fonts.regularItalic,
    fontSize: 14,
    opacity: 0.4,
  },
  creditText: {
    ...fonts.regularItalic,
    fontSize: 12,
    opacity: 0.35,
    letterSpacing: 0.3,
    marginTop: 8,
  },
  footerReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  footerReportText: {
    flexShrink: 1,
    ...fonts.sansMedium,
    fontSize: 12.5,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Floating pill controls
  floatWrap: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  floatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 100,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
    }),
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  controlCirclePlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    // shadowColor / shadowOpacity set inline (theme-reactive — no red glow in dark mode)
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  controlLabel: {
    ...fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  controlDivider: {
    width: 1,
    height: 24,
    opacity: 0.15,
  },
});
