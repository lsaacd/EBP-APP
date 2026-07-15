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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFavorites } from '../../context/FavoritesContext';
import { useRecentHymns } from '../../context/RecentHymnsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import MusicPlayer from '../../components/MusicPlayer';
import AddToPlaylistModal from '../../components/AddToPlaylistModal';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { hasHymnAudio } from '../../data/audioRegistry';
import { sendFeedbackEmail } from '../../utils/feedback';
import PageFlipTransition, { type FlipDirection } from '../../components/PageFlipTransition';

// Module-level constants — defined outside the component so they are never
// recreated on each render. CORO_RE detects chorus stanzas by their prefix.
const CORO_RE = /^((?:\d+\s*(?:er|do|ro|to|ndo|er\.|do\.|ro\.|to\.)?\s*)?coro)[:\s]*/i;
type Stanza = { isCoro: boolean; text: string; verseNum: number; coroLabel?: string };

export default function HymnDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode, fontSizeMultiplier, toggleTheme, changeFontSize } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecent } = useRecentHymns();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();

  // Combine both for navigation
  const allHymns = useMemo(() => {
    // If we want seamless navigation between himnos and estribillos, we can concatenate them.
    // However, since estribillos are a separate list, it might be better to only navigate within the same type.
    const isEstribillo = String(id).startsWith('E');
    return isEstribillo ? estribillosData : hymnsData;
  }, [id]);

  const currentIndex = useMemo(
    () => allHymns.findIndex((h) => h.id === id || h.id === String(id)),
    [id, allHymns],
  );
  const prevHymn = currentIndex > 0 ? allHymns[currentIndex - 1] : null;
  const nextHymn = currentIndex < allHymns.length - 1 ? allHymns[currentIndex + 1] : null;

  // ── Page-flip navigation ────────────────────────────────────
  const [flipDirection, setFlipDirection] = useState<FlipDirection>('right');
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

  // Hard cooldown — disables buttons for 1s after any tap
  const [navDisabled, setNavDisabled] = useState(false);

  const goToPrev = useCallback(() => {
    if (!prevHymn || navDisabled) return;
    setNavDisabled(true);
    setFlipDirection('left');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(`/hymn/${prevHymn.id}`);
    setTimeout(() => setNavDisabled(false), 800);
  }, [prevHymn, navDisabled, router]);

  const goToNext = useCallback(() => {
    if (!nextHymn || navDisabled) return;
    setNavDisabled(true);
    setFlipDirection('right');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(`/hymn/${nextHymn.id}`);
    setTimeout(() => setNavDisabled(false), 800);
  }, [nextHymn, navDisabled, router]);

  /** Handle swipe-to-flip gestures from the PageFlipTransition component */
  const handleSwipeFlip = useCallback((dir: FlipDirection) => {
    if (dir === 'right' && nextHymn) {
      goToNext();
    } else if (dir === 'left' && prevHymn) {
      goToPrev();
    }
  }, [goToNext, goToPrev, nextHymn, prevHymn]);

  // ── Music Player via global context ──────────────────────────
  const { showFullPlayer, openPlayer, closeFullPlayer, currentHymnId } = useNowPlaying();

  // When the mini player is visible, shift nav buttons up to avoid overlap
  const miniPlayerVisible = !!currentHymnId && !showFullPlayer;
  const navBtnBottom = miniPlayerVisible ? 150 : 92;

  const hymnAudio = (h: any) => hasHymnAudio(String(h?.id ?? ''));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePlayAudio = (h: any) => {
    if (!hymnAudio(h)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openPlayer(String(h.id));
  };

  const handleBookmark = (h: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(String(h.id));
  };

  const handleShare = (h: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      title: h.title,
      message: `${h.title}\n\n${h.lyrics}\n\n— Himnario El Buen Pastor`,
    });
  };

  const hymn = allHymns.find((h) => h.id === id || h.id === String(id));

  // Record this hymn as recently viewed
  useEffect(() => {
    if (hymn) addRecent(String(hymn.id));
  }, [hymn?.id]);

  const lyricFontSize = Math.round(22 * fontSizeMultiplier);
  // Theme-reactive coro label colour: Sacred Ink burgundy in light, pure white in dark
  const CORO_COLOR = isDarkMode ? '#ffffff' : '#6e1619';

  // Memoize Stack.Screen options so setOptions is only called when the
  // background colour actually changes — prevents an infinite setState loop
  // that occurs when a fresh object is passed to Stack.Screen on every render.
  const screenOptions = useMemo(() => ({
    presentation: 'modal' as const,
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

    // Quick stanza split without complex context
    const previewStanzas = hymnData.lyrics.split('\n\n').map((raw: string) => {
      const trimmed = raw.trimStart();
      const match = trimmed.match(CORO_RE);
      const isCoro = !!match;
      const coroLabel = isCoro ? match![1].toUpperCase() : undefined;
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
            <Text style={[styles.hymnNumber, { color: theme.primary, opacity: 0.6 }]}>
              {hymnData.number}
            </Text>
            <Text style={[styles.hymnTitle, { color: theme.primary }]}>
              {hymnData.title}
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
                  {stanza.isCoro ? (stanza.coroLabel || 'CORO') : ''}
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
  }, [theme, lyricFontSize, CORO_COLOR, isDarkMode]);

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
          <Text style={{ color: theme.onSurface, fontFamily: fonts.regular, fontSize: 18 }}>
            Himno no encontrado
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
    const coroLabel = isCoro ? match[1].toUpperCase() : undefined;
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
            Himnario El Buen Pastor
          </Text>

          {/* Playlist, Bookmark + Share — top-right */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setPlaylistModalVisible(true)}>
              <MaterialIcons name="playlist-add" size={28} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleBookmark(hymn)}>
              <MaterialIcons
                name={isFavorite(String(hymn.id)) ? 'bookmark' : 'bookmark-border'}
                size={24}
                color={isFavorite(String(hymn.id)) ? theme.primary : theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleShare(hymn)}>
              <MaterialIcons name="share" size={24} color={theme.primary} />
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
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Hymn Title Section ────────────────────── */}
            <View style={styles.hymnHeader}>
              <Text style={[styles.hymnNumber, { color: theme.primary, opacity: 0.8 }]}>
                {hymn.number}
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
                    {stanza.isCoro ? (stanza.coroLabel || 'CORO') : String(stanza.verseNum)}
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
                <MaterialIcons name="mail-outline" size={16} color={theme.primary} />
                <Text style={[styles.footerReportText, { color: theme.primary }]}>
                  {t.reportHymnError}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 180 }} />
          </ScrollView>
        </SafeAreaView>
      </PageFlipTransition>

      {/* ─── Floating Reading Controls (pill) ─────────── */}
      <View style={styles.floatWrap}>
        <View style={[
          styles.floatPill,
          {
            // Android elevation adds a Material surface-overlay tint that makes
            // the pill look more opaque than intended — compensate with lower alpha.
            // iOS shadow props don't affect the view's own surface, so EE (93%) is fine.
            backgroundColor: theme.surfaceVariants.containerLow
              + (Platform.OS === 'android' ? 'CC' : 'EE'),   // CC=80%, EE=93%
            shadowColor: theme.onSurface,
          }
        ]}>
          {/* Text Size — cycles through presets inline (no navigation away) */}
          <TouchableOpacity style={styles.controlItem} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Cycle: 0.85 → 1.0 → 1.15 → 1.3 → 0.85 …
            const steps = [0.85, 1.0, 1.15, 1.3];
            const currentIdx = steps.findIndex((s) => Math.abs(s - fontSizeMultiplier) < 0.05);
            const nextIdx = (currentIdx + 1) % steps.length;
            changeFontSize(steps[nextIdx]);
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

          {/* Audio Play — always visible; red if available, grey if not */}
          <View style={[styles.controlDivider, { backgroundColor: theme.outlineVariant }]} />
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
            </View>
            <Text style={[styles.controlLabel, {
              color: !hymnAudio(hymn)
                ? theme.onSurfaceVariant + '66'
                : isDarkMode
                  ? theme.onSurfaceVariant
                  : '#7B1F1D',
            }]}>AUDIO</Text>
          </TouchableOpacity>
        </View>{/* floatPill */}
      </View>{/* floatWrap */}


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

      {/* ─── Music Player Modal ──────────────────────────── */}
      {/* Only mount when visible — see BottomNavBar.js for rationale */}
      {showFullPlayer && (
        <MusicPlayer
          visible={true}
          hymnId={String(hymn.id)}
          onClose={() => closeFullPlayer()}
        />
      )}

      {/* ─── Add to Playlist Modal ───────────────────────── */}
      <AddToPlaylistModal 
        visible={playlistModalVisible} 
        onClose={() => setPlaylistModalVisible(false)} 
        hymnId={String(hymn.id)} 
      />

    </View>
  );
}

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    fontFamily: 'PublicSans_700Bold',
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.regular,
    fontSize: 22,
    marginBottom: 8,
  },
  hymnTitle: {
    fontFamily: fonts.bold,
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
    fontFamily: 'PublicSans_500Medium',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  stanzaText: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    width: '100%',
  },
  // Coro stanzas get a subtle italic treatment to visually differentiate them
  stanzaTextCoro: {
    fontFamily: fonts.regularItalic,
    opacity: 0.88,
  },

  hymnFooter: {
    marginTop: 80,
    paddingTop: 32,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.regularItalic,
    fontSize: 14,
    opacity: 0.4,
  },
  creditText: {
    fontFamily: fonts.regularItalic,
    fontSize: 12,
    opacity: 0.35,
    letterSpacing: 0.3,
    marginTop: 8,
  },
  footerReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerReportText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.5,
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
    justifyContent: Platform.OS === 'ios' ? 'space-between' : 'center',
    width: Platform.OS === 'ios' ? windowWidth - 40 : undefined,
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 24,
    paddingVertical: Platform.OS === 'ios' ? 8 : 12,
    borderRadius: 100,
    gap: Platform.OS === 'ios' ? 0 : 10,
    // Platform split: elevation (Android only) vs shadow props (iOS only)
    // High elevation on Android adds a surface-overlay tint — keep it low.
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
    }),
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  controlDivider: {
    width: 1,
    height: 24,
    opacity: 0.15,
  },
});
