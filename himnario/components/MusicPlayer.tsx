/**
 * MusicPlayer — Spotify-style full-screen player modal.
 *
 * Features:
 * - Gesture-driven expansion/collapse into the global mini-player
 * - Album art (per-hymn or default cover)
 * - Title, number, author display
 * - Scrubable progress bar with elapsed/total timestamps
 * - Play / Pause, Skip Back, Skip Forward controls
 * - Favorite toggle
 * - Loads audio from the local audioRegistry (bundled assets)
 * - Auto-advances to next hymn when track ends
 *
 * Usage:
 *   <MusicPlayer
 *     visible={showPlayer}
 *     hymn={currentHymn}
 *     onClose={() => setShowPlayer(false)}
 *   />
 */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Linking,
  StatusBar,
  useWindowDimensions,
  type LayoutRectangle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Extrapolation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import MiniPlayer from './MiniPlayer';
import { miniPlayerFrame, shouldCollapsePlayer } from '../utils/gestureMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import * as Haptics from '../utils/haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { hasHymnAudio } from '../data/audioRegistry';
import { offlineAudio } from '../audio/offline-audio';
import AddToPlaylistModal from './AddToPlaylistModal';
import ShareSheet from './ShareSheet';
import { useNowPlaying } from '../context/NowPlayingContext';
import { fonts } from '../theme/theme';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatTime = (ms: number): string => {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────
// ProgressSection — isolated to prevent full-player re-renders
// ─────────────────────────────────────────────────────────────
const ProgressSection = React.memo(function ProgressSection({
  audioAvailable,
}: {
  audioAvailable: boolean;
}) {
  const { position, duration } = useProgress(250);
  
  const isSeekingRef = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const seekGeneration = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seekVal, setSeekVal] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const currentMs = Math.floor((position ?? 0) * 1000);
  const durationMs = Math.floor((duration ?? 0) * 1000);
  useEffect(() => {
    if (pendingSeek.current !== null && Math.abs(currentMs - pendingSeek.current) < 1000) {
      pendingSeek.current = null;
      if (settleTimer.current) clearTimeout(settleTimer.current);
    }
    if (!isSeekingRef.current && pendingSeek.current === null) setSliderValue(currentMs);
  }, [currentMs]);
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);
  const displayValue = isSeekingRef.current || pendingSeek.current !== null ? seekVal : currentMs;

  return (
    <View style={progressStyles.section}>
      <GestureDetector gesture={Gesture.Native().disallowInterruption(true)}>
      <Slider
        style={progressStyles.slider}
        minimumValue={0}
        maximumValue={durationMs > 0 ? durationMs : 1}
        value={sliderValue}
        onSlidingStart={() => {
          ++seekGeneration.current;
          if (settleTimer.current) clearTimeout(settleTimer.current);
          pendingSeek.current = null;
          isSeekingRef.current = true;
          setSeekVal(currentMs);

        }}
        onValueChange={(v) => {
          setSeekVal(Math.floor(v));
        }}
        onSlidingComplete={(v: number) => {
          const target = Math.floor(v);
          const generation = ++seekGeneration.current;
          isSeekingRef.current = false;
          pendingSeek.current = target;
          setSeekVal(target);
          setSliderValue(target);
          if (settleTimer.current) clearTimeout(settleTimer.current);
          // Keep stale progress polls from pulling the thumb back after release.
          settleTimer.current = setTimeout(() => { pendingSeek.current = null; }, 2000);
          void TrackPlayer.seekTo(target / 1000).catch(() => {
            if (generation === seekGeneration.current) { pendingSeek.current = null; setSliderValue(currentMs); }
          });
        }}
        minimumTrackTintColor={audioAvailable ? '#c0392b' : 'rgba(255,255,255,0.2)'}
        maximumTrackTintColor="rgba(255,255,255,0.15)"
        thumbTintColor={audioAvailable ? '#ffffff' : 'transparent'}
        disabled={!audioAvailable}
      />
      </GestureDetector>
      <View style={progressStyles.timeRow}>
        <Text style={progressStyles.timeText}>{formatTime(displayValue)}</Text>
        <Text style={progressStyles.timeText}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  );
});

const progressStyles = StyleSheet.create({
  section: { marginBottom: 4 },
  slider: { width: '100%', height: 36 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface MusicPlayerProps {
  visible: boolean;
  hymnId: string;
  onClose: () => void;
  onViewLyrics?: (hymnId: string) => void;
  miniPlayerBottom: number;
  miniPlayerHeight: number;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
function MusicPlayerInner({ visible, hymnId, onClose, onViewLyrics, miniPlayerBottom, miniPlayerHeight }: MusicPlayerProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const window = useWindowDimensions();
  const [viewport, setViewport] = useState({ width: window.width, height: window.height });
  const { width, height } = viewport;
  const android = Platform.OS === 'android';
  const artSize = Math.min(width - 56, height * 0.45, 500);
  const [artwork, setArtwork] = useState<LayoutRectangle>({ x: (width - artSize) / 2, y: insets.top + 78, width: artSize, height: artSize });

  const {
    currentHymnId,
    isPlaying,
    isShuffled,
    repeatMode,
    togglePlayPause,
    skipNext,
    skipPrev,
    toggleShuffle,
    cycleRepeat,
    closeFullPlayer,
    clearNowPlaying,
    isLoading = false,
    playbackError,
  } = useNowPlaying();

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const offlineSnapshot = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const currentId = currentHymnId ?? hymnId;
  const activeData = String(currentId).startsWith('E') ? estribillosData : hymnsData;
  const hymn = activeData.find((h: any) => String(h.id) === String(currentId));
  const currentIndex = activeData.findIndex((h: any) => String(h.id) === String(currentId));
  const isSavedOffline = offlineSnapshot.savedIds.has(String(currentId));

  const [showShareModal, setShowShareModal] = useState(false);

  const handlePlayPause = togglePlayPause;
  const handleNext = skipNext;
  const handlePrev = skipPrev;

  const finishMinimize = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Don't pause — audio keeps playing and mini-player shows
    closeFullPlayer();
    onClose();
  }, [closeFullPlayer, onClose]);

  const audioAvailable = hymn ? hasHymnAudio(String(hymn.id)) : false;
  const nextHymn = currentIndex < activeData.length - 1 ? activeData[currentIndex + 1] : null;
  const prevHymn = currentIndex > 0 ? activeData[currentIndex - 1] : null;

  // One animation owns the sheet, artwork and mini-player endpoint on the UI thread.
  // A transparent overFullScreen modal avoids UIKit's second pageSheet dismissal.
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const frame = miniPlayerFrame(width, height, miniPlayerBottom, android, miniPlayerHeight);
  const travel = Math.max(1, frame.y);
  const spring = { damping: 28, stiffness: 240, mass: 1, overshootClamping: true };
  const animateMinimize = useCallback(() => {
    progress.value = withSpring(1, { damping: 28, stiffness: 240, mass: 1, overshootClamping: true }, finished => {
      if (finished) runOnJS(finishMinimize)();
    });
  }, [finishMinimize, progress]);
  const handleClose = animateMinimize;

  useEffect(() => {
    if (visible) progress.value = withSpring(0, { damping: 28, stiffness: 240, mass: 1, overshootClamping: true });
    return () => cancelAnimation(progress);
  }, [progress, visible]);

  const pan = Gesture.Pan()
    .enabled(!showShareModal && !playlistModalVisible)
    .activeOffsetY(12)
    .failOffsetX([-18, 18])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(progress);
      dragOrigin.value = progress.value;
    })
    .onUpdate(event => {
      progress.value = Math.max(0, Math.min(1, dragOrigin.value + event.translationY / travel));
    })
    .onEnd(event => {
      const collapse = shouldCollapsePlayer(progress.value * travel, event.velocityY, travel);
      progress.value = withSpring(collapse ? 1 : 0, { ...spring, velocity: event.velocityY / travel }, finished => {
        if (finished && collapse) runOnJS(finishMinimize)();
      });
    })
    .onFinalize((_event, success) => {
      if (!success) progress.value = withSpring(0, spring);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    top: progress.value * frame.y,
    left: progress.value * frame.x,
    width: interpolate(progress.value, [0, 1], [width, frame.width]),
    height: interpolate(progress.value, [0, 1], [height, frame.height]),
    borderRadius: progress.value * (android ? 18 : 16),
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#0e0404', isDarkMode ? '#202020' : '#fcf9f2']),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.65, 0.85], [1, 0.3, 0], Extrapolation.CLAMP),
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.65, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const coverStyle = useAnimatedStyle(() => ({
    top: interpolate(progress.value, [0, 1], [artwork.y, android ? 13 : 8.5]),
    left: interpolate(progress.value, [0, 1], [artwork.x, android ? 13 : 10.5]),
    width: interpolate(progress.value, [0, 1], [artwork.width, android ? 48 : 40]),
    height: interpolate(progress.value, [0, 1], [artwork.height, android ? 48 : 40]),
    borderRadius: interpolate(progress.value, [0, 1], [12, android ? 12 : 8]),
    // Keep the existing loading/error overlays above the expanded cover.
    opacity: 1,
  }));
  // Decode at expanded size on iOS; layout-resizing a thumbnail can retain a low-resolution decode.
  const coverImageStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [artwork.width, android ? 48 : 40]) / artSize },
      { scaleY: interpolate(progress.value, [0, 1], [artwork.height, android ? 48 : 40]) / artSize }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * 0.25 }));

  if (!hymn) return null;

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      
      <GestureHandlerRootView
        style={{ flex: 1 }}
        onLayout={event => {
          const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
          setViewport(current => current.width === nextWidth && current.height === nextHeight ? current : { width: nextWidth, height: nextHeight });
        }}
      >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]} />
      <GestureDetector gesture={pan}>
      <Animated.View style={[styles.animatedWrapper, sheetStyle]}>
      <Animated.View style={[{ width, height }, contentStyle]}>
        {/* Dark background gradient */}
        <LinearGradient
          colors={['#2a0a0b', '#0e0404', '#000000']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

        {/* ─── Top Bar (X left · header centered · chevron right) ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              clearNowPlaying();
              onClose();
            }}
            style={styles.iconHit}
            id="music-player-stop"
          >
            <MaterialIcons name="close" size={26} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.topLabel}>{t.nowPlaying}</Text>
            <Text style={styles.topSubLabel}>Himnario El Buen Pastor</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.iconHit} id="music-player-close">
            <MaterialIcons name="keyboard-arrow-down" size={32} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* ─── Album Art (flex to fill available space) ────────── */}
        <View
          style={[styles.artContainer, { width: artSize, height: artSize }]}
          onLayout={event => setArtwork(event.nativeEvent.layout)}
        >
          {/* No audio overlay */}
          {!audioAvailable && (
            <View style={styles.noAudioOverlay}>
              <MaterialIcons name="music-off" size={40} color="rgba(255,255,255,0.5)" />
              <Text style={styles.noAudioText}>Audio no disponible</Text>
            </View>
          )}

        </View>

        {/* ─── Hymn Info (compact: title line 1, credit line 2) ── */}
        <View style={styles.infoSection}>
          {playbackError && (
            <View style={{ alignItems: 'center', marginBottom: 10, gap: 6 }}>
              <Text accessibilityRole="alert" style={{ color: '#ffb4ab', textAlign: 'center', fontSize: 13 }}>
                {t.audioPlaybackError}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  closeFullPlayer();
                  onClose();
                  setTimeout(() => router.push('/settings'), 280);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                }}
              >
                <MaterialIcons name="download-for-offline" size={16} color="#ffffff" />
                <Text style={{ fontFamily: 'PublicSans_600SemiBold', fontSize: 12, color: '#ffffff' }}>
                  {t.offlineAudioOpenSettings}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.hymnTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {hymn.title}
            </Text>
            {isSavedOffline && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
                accessibilityLabel={t.offlineAudioBadge}
              >
                <MaterialIcons name="offline-pin" size={13} color="rgba(255,255,255,0.85)" />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              if (hymn.audioCredit?.url) {
                Linking.openURL(hymn.audioCredit.url).catch(() => { });
              }
            }}
            activeOpacity={0.7}
            disabled={!hymn.audioCredit?.url}
          >
            <Text style={styles.creditLine} numberOfLines={1}>
              {hymn.audioCredit?.name
                ? `${hymn.author ? hymn.author + ' · ' : ''}@${hymn.audioCredit.name}`
                : hymn.author || ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Progress Bar (isolated component — own position state) ── */}
        <ProgressSection
          audioAvailable={audioAvailable}
        />

        {/* ─── Playback Controls (5-button row like reference) ─── */}
        <View style={styles.controls}>

          {/* Shuffle */}
          <TouchableOpacity
            style={styles.controlBtnSmall}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleShuffle();
            }}
            id="music-player-shuffle"
          >
            <MaterialIcons
              name="shuffle"
              size={24}
              color={isShuffled ? '#ffffff' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

          {/* Skip Previous */}
          <TouchableOpacity
            onPress={handlePrev}
            style={styles.controlBtn}
            disabled={!prevHymn}
            id="music-player-prev"
          >
            <MaterialIcons
              name="skip-previous"
              size={38}
              color={prevHymn ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'}
            />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={!audioAvailable || isLoading}
            style={[
              styles.playBtn,
              { opacity: audioAvailable && !isLoading ? 1 : 0.35 }
            ]}
            id="music-player-playpause"
          >
            {isLoading ? (
              <ActivityIndicator size={32} color="#000" />
            ) : (
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={42}
                color="#000000"
              />
            )}
          </TouchableOpacity>

          {/* Skip Next */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!nextHymn}
            style={styles.controlBtn}
            id="music-player-next"
          >
            <MaterialIcons
              name="skip-next"
              size={38}
              color={nextHymn ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'}
            />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.controlBtnSmall}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              cycleRepeat();
            }}
            id="music-player-repeat"
          >
            <MaterialIcons
              name={repeatMode === 'one' ? 'repeat-one' : 'repeat'}
              size={24}
              color={repeatMode !== 'off' ? '#ffffff' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

        </View>

        {/* ─── Bottom Action Row (favorite left, share, lyrics right) ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPlaylistModalVisible(true);
            }}
          >
            <MaterialIcons name="playlist-add" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleFavorite(String(hymn.id));
            }}
            id="music-player-favorite"
          >
            <MaterialIcons
              name={isFavorite(String(hymn.id)) ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isFavorite(String(hymn.id)) ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowShareModal(true);
            }}
            id="music-player-share"
          >
            <MaterialIcons name="share" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* View Lyrics */}
          <TouchableOpacity
            style={styles.bottomAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Capture the current track ID before closing
              const lyricsId = currentId;
              closeFullPlayer();
              onClose();
              // Navigate to lyrics after the modal dismiss animation
              setTimeout(() => {
                if (onViewLyrics) {
                  onViewLyrics(lyricsId);
                } else {
                  router.replace(`/hymn/${lyricsId}`);
                }
              }, 350);
            }}
            id="music-player-lyrics"
          >
            <MaterialIcons name="queue-music" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

      </LinearGradient>

      </Animated.View>
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, compactStyle]}>
        <MiniPlayer transitionPreview />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', overflow: 'hidden' }, coverStyle]}><Animated.Image source={DEFAULT_COVER} style={[{ width: artSize, height: artSize, transformOrigin: 'top left' }, coverImageStyle]} resizeMode="contain" /></Animated.View>
      </Animated.View>
      </GestureDetector>
      {/* ═══════ Unified Share Sheet (Workstream E) ════════════ */}
      <ShareSheet
        variant="player"
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        hymn={hymn}
      />

      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        hymnId={currentId}
      />
      </GestureHandlerRootView>
    </Modal>
  );
}

// Memoize to prevent re-renders when the parent page scrolls
export default React.memo(MusicPlayerInner);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Top bar — header text + close button
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconHit: { padding: 8 },
  topLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  topSubLabel: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // Album art — takes up main space
  artContainer: {
    alignSelf: 'center',

    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
    }),
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  noAudioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  noAudioText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },

  // Info — compact
  infoSection: {
    marginBottom: 8,
  },
  hymnTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 4,
  },
  creditLine: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },

  // Controls — 5-button row
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  controlBtn: {
    padding: 6,
  },
  controlBtnSmall: {
    padding: 8,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#c0392b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },

  // Bottom action row
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  bottomAction: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedWrapper: {
    position: 'absolute',
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
    zIndex: 100,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});

