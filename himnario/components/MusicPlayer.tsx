import {expandedArtworkFrame} from '../utils/playerPresentation';
/**
 * MusicPlayer — Persistent full-screen player overlay.
 *
 * Features:
 * - Gesture-driven expansion/collapse into the global mini-player
 * - Album art (per-hymn or default cover)
 * - Title, number, author display in native SF Pro (iOS) / Roboto (Android)
 * - Dedicated Like/Dislike & Comments engagement row above the scrub bar and Play/Skip controls
 * - Scrubable progress bar with elapsed/total timestamps
 * - Play / Pause, Skip Back, Skip Forward, Shuffle, Repeat controls
 * - Animated bottom action bar (Playlist, Favorite with glow pop, Download, Share, Lyrics)
 * - Responsive lower deck layout that leaves zero empty black space across device sizes
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  BackHandler,
  Platform,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MiniPlayer from './MiniPlayer';
import {
  artworkSwipeDirection,
  clampArtworkDrag,
  miniPlayerFrame,
  shouldCollapsePlayer,
} from '../utils/gestureMotion';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuView } from '@react-native-menu/menu';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import * as Haptics from '../utils/haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getLocalizedHymn } from '../data/alabanzasEnglish';
import { hasHymnAudio } from '../data/audioRegistry';
import { offlineAudio } from '../audio/offline-audio';
import { nativePlayer } from '../audio/native-player';
import AddToPlaylistModal from './AddToPlaylistModal';
import ProjectorModal, { type ProjectorStanza } from './ProjectorModal';
import ShareSheet from './ShareSheet';
import VerseDiscussionSheet from './VerseDiscussionSheet';
import AppMenuIcon from './AppMenuIcon';
import { useHymnCommunity } from '../utils/hymnCommunity';
import { useNowPlaying } from '../context/NowPlayingContext';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');
// On iOS, omitting fontFamily (undefined) resolves to genuine Apple SF Pro with optical sizing.
// On Android, 'sans-serif' resolves to native Roboto.
const SYSTEM_FONT = Platform.OS === 'ios' ? undefined : 'sans-serif';

/** Full-bleed 2025 YouTube-style rounded thumb icon on a unified 24×24 optical grid. */
function ThumbIcon({
  direction,
  filled,
  size = 29,
  color,
}: {
  direction: 'up' | 'down';
  filled: boolean;
  size?: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={direction === 'down' ? { transform: [{ rotate: '180deg' }] } : undefined}
    >
      <Path
        d="M3.8 10.6C2.8 11 2.2 11.9 2.2 13V18.2C2.2 19.5 3.1 20.6 4.4 20.8L7.4 21.4C9 21.8 10.8 22 12.8 22H17.4C19.1 22 20.4 20.9 20.7 19.3C20.8 18.7 20.7 18.1 20.4 17.6C21.3 17.1 21.9 16.2 21.9 15.1C21.9 14.2 21.5 13.5 20.9 12.9C21.6 12.3 22 11.3 21.8 10.2C21.6 8.8 20.4 7.8 18.9 7.8H14.8C15.3 6.2 15.6 4.4 15.3 3.1C15 1.9 14.1 1.3 12.9 1.3C12.1 1.3 11.5 1.8 11.2 2.6C10.4 5 8.8 7.7 6.3 9.5C5.4 10.1 4.6 10.4 3.8 10.6Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Full-bleed rounded comment-text-outline SVG matching the 2.25 stroke weight. */
function CommentIcon({
  size = 28,
  color,
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.4 5C2.4 3.5 3.6 2.4 5.1 2.4H18.9C20.4 2.4 21.6 3.5 21.6 5V15.8C21.6 17.3 20.4 18.4 18.9 18.4H10.2L5.9 21.8C5.3 22.2 4.5 21.8 4.5 21.1V18.4H5.1C3.6 18.4 2.4 17.3 2.4 15.8V5Z"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.2 8.2H16.8M7.2 12.6H13.4"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Full-bleed rounded projector/present icon on the exact same 24×24 grid & 2.25 stroke weight. */
function ProjectorIcon({
  size = 28,
  color,
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.8 3.6H19.2C20.6 3.6 21.8 4.8 21.8 6.2V17.8C21.8 19.2 20.6 20.4 19.2 20.4H4.8C3.4 20.4 2.2 19.2 2.2 17.8V6.2C2.2 4.8 3.4 3.6 4.8 3.6Z"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16V8.6M8.6 11.8L12 8.4L15.4 11.8"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const LIKE_SPARKS = [
  { angle: -90, ray: true, color: '#e11d48' },
  { angle: -45, ray: false, color: '#fb7185' },
  { angle: 0, ray: true, color: '#dc2626' },
  { angle: 45, ray: false, color: '#fda4af' },
  { angle: 90, ray: true, color: '#e11d48' },
  { angle: 135, ray: false, color: '#fb7185' },
  { angle: 180, ray: true, color: '#dc2626' },
  { angle: 225, ray: false, color: '#fda4af' },
] as const;

function LikeSparkItem({
  progress,
  angle,
  ray,
  color,
}: {
  progress: SharedValue<number>;
  angle: number;
  ray: boolean;
  color: string;
}) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const startR = ray ? 13 : 11;
  const endR = ray ? 27 : 24;

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const dist = interpolate(p, [0, 1], [startR, endR], Extrapolation.CLAMP);
    const opacity = interpolate(p, [0, 0.12, 0.65, 1], [0, 1, 0.9, 0], Extrapolation.CLAMP);
    const scale = interpolate(p, [0, 0.25, 1], [0.5, 1.05, 0.35], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { translateX: cos * dist },
        { translateY: sin * dist },
        { rotate: `${angle + 90}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: ray ? 2.6 : 4,
          height: ray ? 7.5 : 4,
          borderRadius: 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

/** YouTube-style 8-spark Sacred Ink crimson radial burst behind the Like thumb. */
function LikeSparkBurst({ progress }: { progress: SharedValue<number> }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 68,
        height: 68,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {LIKE_SPARKS.map((s) => (
        <LikeSparkItem
          key={s.angle}
          progress={progress}
          angle={s.angle}
          ray={s.ray}
          color={s.color}
        />
      ))}
    </View>
  );
}
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
  audioAvailable, active, isLoading = false,
}: {
  active: boolean;
  audioAvailable: boolean;
  isLoading?: boolean;
}) {
  const [{position,duration},setProgress] = useState({position:0,duration:0});
  useEffect(() => {
    if (isLoading) {
      setProgress({ position: 0, duration: 0 });
      return;
    }
    if (!active) return;
    let cancelled = false, busy = false;
    const poll = async () => {
      if (busy) return;
      busy = true;
      try { const value = await TrackPlayer.getProgress(); if (!cancelled) setProgress(value); }
      catch { /* Player may still be starting. */ }
      finally { busy = false; }
    };
    void poll(); const timer = setInterval(() => void poll(),250);
    return () => { cancelled = true; clearInterval(timer); };
  },[active, isLoading]);
  
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
        <View collapsable={false} style={{ width: '100%' }}>
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
              void nativePlayer.seek(target / 1000).catch(() => {
                if (generation === seekGeneration.current) { pendingSeek.current = null; setSliderValue(currentMs); }
              });
            }}
            minimumTrackTintColor={audioAvailable ? '#ffffff' : 'rgba(255,255,255,0.2)'}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor={audioAvailable ? '#ffffff' : 'transparent'}
            disabled={!audioAvailable || isLoading}
          />
        </View>
      </GestureDetector>
      <View style={progressStyles.timeRow}>
        <Text style={progressStyles.timeText}>{formatTime(displayValue)}</Text>
        <Text style={progressStyles.timeText}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  );
});

const progressStyles = StyleSheet.create({
  section: { marginBottom: 2 },
  slider: { width: '100%', height: 34 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '600',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.56)',
    fontVariant: ['tabular-nums'],
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
  const { t, language, hymnLanguage } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const window = useWindowDimensions();
  const { width, height } = window;
  const android = Platform.OS === 'android';

  const {
    currentHymnId,
    currentQueueIds,
    queueLabel,
    isPlaying,
    isShuffled,
    repeatMode,
    playbackRate = 1,
    setPlaybackRate,
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

  const artwork = expandedArtworkFrame(width,height,insets.top,insets.bottom,Boolean(playbackError));
  const artSize = artwork.width;

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const offlineSnapshot = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const currentId = currentHymnId ?? hymnId;
  const activeData = String(currentId).startsWith('E') ? estribillosData : hymnsData;
  const rawHymn = activeData.find((h: any) => String(h.id) === String(currentId));
  const hymn = rawHymn ? getLocalizedHymn(rawHymn, hymnLanguage) : undefined;
  const currentIndex = activeData.findIndex((h: any) => String(h.id) === String(currentId));
  const isSavedOffline = offlineSnapshot.savedIds.has(String(currentId));

  const [showShareModal, setShowShareModal] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [projectorVisible, setProjectorVisible] = useState(false);

  const projectorStanzas = useMemo<ProjectorStanza[]>(() => {
    if (!hymn?.lyrics) return [];
    let verseCounter = 0;
    return hymn.lyrics.split('\n\n').map((raw: string) => {
      const trimmed = raw.trimStart();
      const match = trimmed.match(CORO_RE);
      const isCoro = !!match;
      const coroLabel = isCoro ? formatChorusLabel(match[1], hymnLanguage) : undefined;
      const text = isCoro ? trimmed.replace(CORO_RE, '').trim() : trimmed;
      if (!isCoro) verseCounter++;
      return { isCoro, text, verseNum: isCoro ? 0 : verseCounter, coroLabel };
    });
  }, [hymn?.lyrics, hymnLanguage]);

  const {
    commentVerseId,
    summary: hymnSummary,
    isAdmin,
    react: reactToHymn,
    refresh: refreshHymnCommunity,
  } = useHymnCommunity(currentId);

  // Crisp, non-wobbly micro-animations + YouTube-style Like spark burst
  const likeScale = useSharedValue(1);
  const likeRotate = useSharedValue(0);
  const likeTranslateY = useSharedValue(0);
  const likeBurst = useSharedValue(0);
  const dislikeScale = useSharedValue(1);
  const commentScale = useSharedValue(1);
  const projectorScale = useSharedValue(1);
  const lyricsScale = useSharedValue(1);
  const playlistScale = useSharedValue(1);
  const favScale = useSharedValue(1);
  const speedScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const shareTranslateY = useSharedValue(0);

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: likeTranslateY.value },
      { rotate: `${likeRotate.value}deg` },
      { scale: likeScale.value },
    ],
  }));
  const dislikeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dislikeScale.value }],
  }));
  const commentAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: commentScale.value }],
  }));
  const projectorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: projectorScale.value }],
  }));
  const lyricsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lyricsScale.value }],
  }));
  const playlistAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playlistScale.value }],
  }));
  const favAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favScale.value }],
  }));
  const speedAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speedScale.value }],
  }));
  const shareAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }, { translateY: shareTranslateY.value }],
  }));

  const handleLikeTap = () => {
    const willLike = hymnSummary.myReaction !== 1;
    Haptics.impactAsync(
      willLike ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    cancelAnimation(likeScale);
    cancelAnimation(likeRotate);
    cancelAnimation(likeTranslateY);
    if (willLike) {
      likeScale.value = withSequence(
        withTiming(0.84, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(1.2, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 130, easing: Easing.inOut(Easing.quad) }),
      );
      likeRotate.value = withSequence(
        withTiming(-16, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(8, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 130, easing: Easing.inOut(Easing.quad) }),
      );
      likeTranslateY.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(-2.5, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 130, easing: Easing.inOut(Easing.quad) }),
      );
      cancelAnimation(likeBurst);
      likeBurst.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      likeRotate.value = 0;
      likeTranslateY.value = 0;
      likeScale.value = withSequence(
        withTiming(0.88, { duration: 65, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
      );
    }
    reactToHymn(1);
  };

  const handleDislikeTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnimation(dislikeScale);
    dislikeScale.value = withSequence(
      withTiming(0.86, { duration: 65, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: 100, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 110, easing: Easing.inOut(Easing.quad) }),
    );
    reactToHymn(-1);
  };

  const handleCommentsTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnimation(commentScale);
    commentScale.value = withSequence(
      withTiming(0.86, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: 95, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 105, easing: Easing.inOut(Easing.quad) }),
    );
    setCommentsOpen(true);
  };

  const handleProjectorTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnimation(projectorScale);
    projectorScale.value = withSequence(
      withTiming(0.86, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: 95, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 105, easing: Easing.inOut(Easing.quad) }),
    );
    setProjectorVisible(true);
  };

  const handleFavoriteTap = () => {
    if (!hymn) return;
    const willBeFav = !isFavorite(String(hymn.id));
    Haptics.impactAsync(
      willBeFav ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    cancelAnimation(favScale);
    favScale.value = withSequence(
      withTiming(0.84, { duration: 65, easing: Easing.out(Easing.quad) }),
      withTiming(willBeFav ? 1.15 : 1.06, { duration: 110, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 115, easing: Easing.inOut(Easing.quad) }),
    );
    toggleFavorite(String(hymn.id));
  };

  const handleSpeedSelect = (rate: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnimation(speedScale);
    speedScale.value = withSequence(
      withTiming(0.88, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1.1, { duration: 100, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 110, easing: Easing.inOut(Easing.quad) }),
    );
    setPlaybackRate(rate);
  };

  const handlePlayPause = togglePlayPause;
  const handleNext = () => skipNext();
  const handlePrev = () => skipPrev();

  // No haptic on swipe-to-minimize (per user request)
  const finishMinimize = useCallback(() => {
    closeFullPlayer();
    onClose();
  }, [closeFullPlayer, onClose]);

  const audioAvailable = hymn ? hasHymnAudio(String(hymn.id)) : false;
  const allHymnsById = useMemo(() => {
    const map = new Map<string, any>();
    for (const h of hymnsData) map.set(String(h.id), h);
    for (const e of estribillosData) map.set(String(e.id), e);
    return map;
  }, []);

  const { prevHymn, nextHymn, prevHymnItem, nextHymnItem } = useMemo(() => {
    const idStr = String(currentId);
    const custom = currentQueueIds?.length ? currentQueueIds.map(String).filter(hasHymnAudio) : null;
    const defaultIds = activeData.map((h: any) => String(h.id)).filter(hasHymnAudio);
    const ids = custom?.length ? custom : defaultIds;
    const idx = ids.indexOf(idStr);
    if (idx < 0 || ids.length <= 1) {
      return { prevHymn: null, nextHymn: null, prevHymnItem: null, nextHymnItem: null };
    }
    const wraps = Boolean(custom?.length) || repeatMode === 'all';
    const hasPrev = idx > 0 || wraps;
    const hasNext = idx < ids.length - 1 || wraps || isShuffled;
    const prevId = hasPrev ? ids[(idx - 1 + ids.length) % ids.length] : null;
    const nextId = hasNext && !isShuffled ? ids[(idx + 1) % ids.length] : null;
    const prevRaw = prevId ? allHymnsById.get(prevId) : null;
    const nextRaw = nextId ? allHymnsById.get(nextId) : null;
    return {
      prevHymn: hasPrev ? true : null,
      nextHymn: hasNext ? true : null,
      prevHymnItem: prevRaw ? getLocalizedHymn(prevRaw, hymnLanguage) : null,
      nextHymnItem: nextRaw ? getLocalizedHymn(nextRaw, hymnLanguage) : null,
    };
  }, [currentId, currentQueueIds, activeData, repeatMode, isShuffled, allHymnsById, hymnLanguage]);

  // YouTube Music–style horizontal swipeable artwork state
  const artGap = 20;
  const artStride = artSize + artGap;
  const artDragX = useSharedValue(0);

  useEffect(() => {
    artDragX.value = 0;
  }, [currentId, visible, artDragX]);

  const commitArtworkSwipe = useCallback(
    (direction: -1 | 1) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (direction === 1) skipNext({ silent: true });
      else skipPrev({ silent: true });
      artDragX.value = 0;
    },
    [skipNext, skipPrev, artDragX],
  );

  const artworkPan = Gesture.Pan()
    .enabled(visible && !showShareModal && !playlistModalVisible && !commentsOpen && !projectorVisible)
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(artDragX);
    })
    .onUpdate((event) => {
      artDragX.value = clampArtworkDrag(event.translationX, artStride, Boolean(prevHymn), Boolean(nextHymn));
    })
    .onEnd((event, success) => {
      const dir = success
        ? artworkSwipeDirection(artDragX.value, event.velocityX, artStride, Boolean(prevHymn), Boolean(nextHymn))
        : 0;
      if (dir !== 0) {
        artDragX.value = withTiming(
          -dir * artStride,
          { duration: 190, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(commitArtworkSwipe)(dir);
          },
        );
      } else {
        artDragX.value = withSpring(0, { damping: 24, stiffness: 260, mass: 0.85 });
      }
    });

  // One animation owns the sheet, artwork and mini-player endpoint on the UI thread.
  // The persistent overlay avoids native modal teardown during collapse/expand.
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const frame = miniPlayerFrame(width, height, miniPlayerBottom, android, miniPlayerHeight);
  const travel = Math.max(1, frame.y);
  const spring = { damping: 28, stiffness: 215, mass: 0.92, overshootClamping: true };
  // Visibility changes immediately so the mini-player can reverse an in-flight collapse.
  const handleClose = finishMinimize;
  useEffect(() => {
    progress.value = withSpring(visible ? 0 : 1, { damping: 28, stiffness: 215, mass: 0.92, overshootClamping: true });
  }, [progress, visible]);
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { finishMinimize(); return true; });
    return () => subscription.remove();
  }, [visible, finishMinimize]);

  const pan = Gesture.Pan()
    .enabled(visible && !showShareModal && !playlistModalVisible && !commentsOpen && !projectorVisible)
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
    .onEnd((event, success) => {
      const collapse = success && shouldCollapsePlayer(progress.value * travel, event.velocityY, travel);
      progress.value = withSpring(collapse ? 1 : 0, { ...spring, velocity: event.velocityY / travel });
      if (collapse) runOnJS(finishMinimize)();
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
  const coverStyle = useAnimatedStyle(() => {
    const expandedFactor = interpolate(progress.value, [0, 0.06], [1, 0], Extrapolation.CLAMP);
    const dragX = artDragX.value * expandedFactor;
    const swipeScale = interpolate(Math.abs(dragX), [0, artStride], [1, 0.94], Extrapolation.CLAMP);
    return {
      top: interpolate(progress.value, [0, 1], [artwork.y, android ? 13 : 8.5]),
      left: interpolate(progress.value, [0, 1], [artwork.x, android ? 13 : 10.5]),
      width: interpolate(progress.value, [0, 1], [artwork.width, android ? 48 : 40]),
      height: interpolate(progress.value, [0, 1], [artwork.height, android ? 48 : 40]),
      borderRadius: interpolate(progress.value, [0, 1], [12, android ? 12 : 8]),
      transform: [{ translateX: dragX }, { scale: swipeScale }],
      // Keep the existing loading/error overlays above the expanded cover.
      opacity: 1,
    };
  });
  const peekPrevStyle = useAnimatedStyle(() => {
    const expandedFactor = interpolate(progress.value, [0, 0.04], [1, 0], Extrapolation.CLAMP);
    const reveal = interpolate(artDragX.value, [4, 34], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(artDragX.value, [0, artStride], [0.92, 1], Extrapolation.CLAMP);
    return {
      opacity: reveal * expandedFactor,
      transform: [{ translateX: -artStride + artDragX.value }, { scale }],
    };
  });
  const peekNextStyle = useAnimatedStyle(() => {
    const expandedFactor = interpolate(progress.value, [0, 0.04], [1, 0], Extrapolation.CLAMP);
    const reveal = interpolate(-artDragX.value, [4, 34], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(-artDragX.value, [0, artStride], [0.92, 1], Extrapolation.CLAMP);
    return {
      opacity: reveal * expandedFactor,
      transform: [{ translateX: artStride + artDragX.value }, { scale }],
    };
  });
  // Decode at expanded size on iOS; layout-resizing a thumbnail can retain a low-resolution decode.
  const coverImageStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [artwork.width, android ? 48 : 40]) / artSize },
      { scaleY: interpolate(progress.value, [0, 1], [artwork.height, android ? 48 : 40]) / artSize }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value,[0.99,1],[1,0],Extrapolation.CLAMP) }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * 0.25 }));

  if (!hymn) return null;

  const isLiked = hymnSummary.myReaction === 1;
  const isDisliked = hymnSummary.myReaction === -1;
  const favActive = isFavorite(String(hymn.id));

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFillObject, { zIndex: 100, elevation: android ? 24 : 0 }, overlayStyle]}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]} />
      <GestureDetector gesture={pan}>
      <Animated.View style={[styles.animatedWrapper, sheetStyle]}>
      <Animated.View style={[{ width, height }, contentStyle]}>
        {/* Rich Sacred Ink velvet-burgundy to deep obsidian gradient */}
        <LinearGradient
          colors={['#3d0e11', '#1a0608', '#080203']}
          locations={[0, 0.48, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.root,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* ─── Top Bar (X left · SF Pro header centered · chevron right) ── */}
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
              <MaterialIcons name="close" size={26} color="rgba(255,255,255,0.68)" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.topLabel}>{t.nowPlaying}</Text>
              <Text style={styles.topSubLabel} numberOfLines={1}>
                {queueLabel || 'Himnario El Buen Pastor'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.iconHit} id="music-player-close">
              <MaterialIcons name="keyboard-arrow-down" size={32} color="rgba(255,255,255,0.68)" />
            </TouchableOpacity>
          </View>

          {/* ─── Album Art Stage (YouTube Music–style horizontal swipe + seamless morph) ── */}
          <GestureDetector gesture={artworkPan}>
            <View style={[styles.artStage, { height: artSize }]}>
              {/* Peeking Previous Cover Card */}
              {prevHymn && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.peekCard, { width: artSize, height: artSize }, peekPrevStyle]}
                >
                  <Animated.Image source={DEFAULT_COVER} style={styles.albumArt} resizeMode="contain" />
                  {prevHymnItem && (
                    <View style={styles.peekCaption}>
                      <Text style={styles.peekCaptionText} numberOfLines={1}>
                        #{prevHymnItem.number} · {prevHymnItem.title}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Peeking Next Cover Card */}
              {nextHymn && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.peekCard, { width: artSize, height: artSize }, peekNextStyle]}
                >
                  <Animated.Image source={DEFAULT_COVER} style={styles.albumArt} resizeMode="contain" />
                  <View style={styles.peekCaption}>
                    <Text style={styles.peekCaptionText} numberOfLines={1}>
                      {isShuffled
                        ? t.playerShuffleNextHint
                        : nextHymnItem
                          ? `#${nextHymnItem.number} · ${nextHymnItem.title}`
                          : ''}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Active Album Art Frame (exact top+83 slot for seamless cover morph) */}
              <View style={[styles.artContainer, { width: artSize, height: artSize }]}>
                {/* No audio overlay */}
                {!audioAvailable && (
                  <View style={styles.noAudioOverlay}>
                    <MaterialIcons name="music-off" size={40} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.noAudioText}>{t.audioUnavailable}</Text>
                  </View>
                )}
              </View>
            </View>
          </GestureDetector>

          {/* ─── Responsive Lower Deck (fills remaining vertical space cleanly) ── */}
          <View style={styles.lowerDeck}>
            {/* 1. Hymn Title + Credit */}
            <View style={styles.infoSection}>
              {playbackError && (
                <View style={{ alignItems: 'center', marginBottom: 8, gap: 6 }}>
                  <Text accessibilityRole="alert" style={{ fontFamily: SYSTEM_FONT, color: '#ffb4ab', textAlign: 'center', fontSize: 13 }}>
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
                    <Text style={{ fontFamily: SYSTEM_FONT, fontWeight: '600', fontSize: 12, color: '#ffffff' }}>
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
                    style={styles.offlineBadge}
                    accessibilityLabel={t.offlineAudioBadge}
                  >
                    <MaterialIcons name="offline-pin" size={14} color="rgba(255,255,255,0.9)" />
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
                    : hymn.author || 'Himnario El Buen Pastor'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Engagement Row: Evenly Distributed Full-Bleed YouTube-Style Icons + Sleek Letra Pill */}
            <View style={styles.engagementRow}>
              {/* 1. Like (containerless so radial sparks fly freely) */}
              <Pressable
                onPress={handleLikeTap}
                style={({ pressed }) => [
                  styles.containerlessBtn,
                  pressed && { opacity: 0.72 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.playerLike}
              >
                <View style={styles.likeIconAnchor}>
                  <LikeSparkBurst progress={likeBurst} />
                  <Animated.View style={likeAnimStyle}>
                    <ThumbIcon
                      direction="up"
                      filled={isLiked}
                      size={29}
                      color="#ffffff"
                    />
                  </Animated.View>
                </View>
                {hymnSummary.likesCount > 0 && (
                  <Text
                    style={[
                      styles.engagementPrimaryText,
                      isLiked && { color: '#ffffff', fontWeight: '700' },
                    ]}
                  >
                    {hymnSummary.likesCount}
                  </Text>
                )}
              </Pressable>

              {/* 2. Dislike (containerless) */}
              <Pressable
                onPress={handleDislikeTap}
                style={({ pressed }) => [
                  styles.containerlessBtn,
                  pressed && { opacity: 0.72 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.playerDislike}
              >
                <Animated.View style={dislikeAnimStyle}>
                  <ThumbIcon
                    direction="down"
                    filled={isDisliked}
                    size={28}
                    color={isDisliked ? '#ffffff' : 'rgba(255,255,255,0.88)'}
                  />
                </Animated.View>
                {isAdmin &&
                  typeof hymnSummary.dislikesCount === 'number' &&
                  hymnSummary.dislikesCount > 0 && (
                    <Text style={styles.adminDislikeCount}>
                      {hymnSummary.dislikesCount}
                    </Text>
                  )}
              </Pressable>

              {/* 3. Comments (containerless) */}
              <Pressable
                onPress={handleCommentsTap}
                style={({ pressed }) => [
                  styles.containerlessBtn,
                  pressed && { opacity: 0.72 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.playerComments}
              >
                <Animated.View style={commentAnimStyle}>
                  <CommentIcon size={27} color="rgba(255,255,255,0.94)" />
                </Animated.View>
                {hymnSummary.commentsCount > 0 && (
                  <Text style={styles.engagementPrimaryText}>
                    {hymnSummary.commentsCount}
                  </Text>
                )}
              </Pressable>

              {/* 4. Projector (containerless, unified 2.25 rounded stroke) */}
              <Pressable
                onPress={handleProjectorTap}
                style={({ pressed }) => [
                  styles.containerlessBtn,
                  pressed && { opacity: 0.72 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.projectHymn}
              >
                <Animated.View style={projectorAnimStyle}>
                  <ProjectorIcon size={27} color="rgba(255,255,255,0.94)" />
                </Animated.View>
              </Pressable>

              {/* 5. Single Sleek Sacred Ink Lyrics Pill on Right */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelAnimation(lyricsScale);
                  lyricsScale.value = withSequence(
                    withTiming(0.88, { duration: 55, easing: Easing.out(Easing.quad) }),
                    withTiming(1.06, { duration: 90, easing: Easing.out(Easing.cubic) }),
                    withTiming(1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
                  );
                  const lyricsId = currentId;
                  closeFullPlayer();
                  onClose();
                  if (onViewLyrics) onViewLyrics(lyricsId);
                  else router.replace(`/hymn/${lyricsId}`);
                }}
                style={({ pressed }) => [
                  styles.lyricsCapsule,
                  pressed && { opacity: 0.8 },
                ]}
                id="music-player-lyrics"
                accessibilityRole="button"
                accessibilityLabel={t.playerLyrics}
              >
                <Animated.View style={lyricsAnimStyle}>
                  <MaterialIcons name="format-quote" size={22} color="#ffffff" />
                </Animated.View>
                <Text style={styles.lyricsCapsuleText} numberOfLines={1}>
                  {t.playerLyrics}
                </Text>
              </Pressable>
            </View>

            {/* 3. Progress Bar (isolated component — own position state) */}
            <ProgressSection
              key={currentId}
              active={visible}
              audioAvailable={audioAvailable}
              isLoading={isLoading}
            />

            {/* 4. Playback Controls (5-button row) */}
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
                  size={27}
                  color={isShuffled ? '#ffffff' : 'rgba(255,255,255,0.48)'}
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
                  size={44}
                  color={prevHymn ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.22)'}
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
                  <ActivityIndicator size={34} color="#000" />
                ) : (
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={46}
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
                  size={44}
                  color={nextHymn ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.22)'}
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
                  size={27}
                  color={repeatMode !== 'off' ? '#ffffff' : 'rgba(255,255,255,0.48)'}
                />
              </TouchableOpacity>
            </View>

            {/* 5. Restored Bottom Action Bar — Crisp, Non-Wobbly Tap Animations */}
            <View style={styles.bottomBar}>
              {/* Add to Playlist */}
              <TouchableOpacity
                style={styles.bottomAction}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelAnimation(playlistScale);
                  playlistScale.value = withSequence(
                    withTiming(0.86, { duration: 60, easing: Easing.out(Easing.quad) }),
                    withTiming(1.08, { duration: 95, easing: Easing.out(Easing.cubic) }),
                    withTiming(1, { duration: 105, easing: Easing.inOut(Easing.quad) }),
                  );
                  setPlaylistModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.playerSaveToPlaylist}
              >
                <Animated.View style={playlistAnimStyle}>
                  <MaterialIcons name="playlist-add" size={32} color="rgba(255,255,255,0.9)" />
                </Animated.View>
              </TouchableOpacity>

              {/* Favorite / Bookmark — Crisp, Simple Dark Red Pop (No Wobble) */}
              <TouchableOpacity
                style={styles.bottomAction}
                activeOpacity={0.75}
                onPress={handleFavoriteTap}
                id="music-player-favorite"
                accessibilityRole="button"
                accessibilityLabel={t.playerFavorite}
              >
                <Animated.View style={favAnimStyle}>
                  <MaterialIcons
                    name={favActive ? 'bookmark' : 'bookmark-border'}
                    size={31}
                    color={favActive ? '#b91c1c' : 'rgba(255,255,255,0.9)'}
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Playback Speed (Native Liquid Glass Menu on iOS / Native PopupMenu on Android) */}
              <MenuView
                title={t.playerPlaybackSpeed}
                themeVariant="dark"
                shouldOpenOnLongPress={false}
                actions={[0.75, 0.85, 1, 1.15, 1.25, 1.5].map((rate) => ({
                  id: String(rate),
                  title: rate === 1 ? (t.player1xNormal) : `${rate}x`,
                  state: Math.abs(playbackRate - rate) < 0.01 ? 'on' : 'off',
                  image: Platform.select({
                    ios: rate === 1 ? 'gauge.with.dots.needle.50percent' : rate < 1 ? 'tortoise' : 'hare',
                    default: undefined,
                  }),
                }))}
                onPressAction={({ nativeEvent }) => {
                  const chosen = Number(nativeEvent.event);
                  if (Number.isFinite(chosen)) handleSpeedSelect(chosen);
                }}
              >
                <View
                  style={styles.bottomAction}
                  accessibilityRole="button"
                  accessibilityLabel={t.playerPlaybackSpeed}
                >
                  <Animated.View
                    style={[
                      styles.speedBadge,
                      Math.abs(playbackRate - 1) >= 0.01 && styles.speedBadgeActive,
                      speedAnimStyle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedBadgeText,
                        Math.abs(playbackRate - 1) >= 0.01 && { color: '#ffffff' },
                      ]}
                    >
                      {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                    </Text>
                  </Animated.View>
                </View>
              </MenuView>

              {/* Share */}
              <TouchableOpacity
                style={styles.bottomAction}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelAnimation(shareScale);
                  cancelAnimation(shareTranslateY);
                  shareScale.value = withSequence(
                    withTiming(0.88, { duration: 60, easing: Easing.out(Easing.quad) }),
                    withTiming(1.08, { duration: 95, easing: Easing.out(Easing.cubic) }),
                    withTiming(1, { duration: 105, easing: Easing.inOut(Easing.quad) }),
                  );
                  shareTranslateY.value = withSequence(
                    withTiming(-3, { duration: 90, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 120, easing: Easing.inOut(Easing.quad) }),
                  );
                  setShowShareModal(true);
                }}
                id="music-player-share"
                accessibilityRole="button"
                accessibilityLabel={t.shareModalTitle}
              >
                <Animated.View style={shareAnimStyle}>
                  <MaterialIcons
                    name={Platform.OS === 'ios' ? 'ios-share' : 'share'}
                    size={28}
                    color="rgba(255,255,255,0.9)"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
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

      <ProjectorModal
        visible={projectorVisible}
        onClose={() => setProjectorVisible(false)}
        hymn={hymn}
        stanzas={projectorStanzas}
        initialDarkMode={true}
      />

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
        subtitleOverride={`${String(currentId).startsWith('E') ? (language === 'en' ? 'Chorus' : 'Estribillo') : (language === 'en' ? 'Hymn' : 'Himno')} ${hymn.number} · ${hymn.title}`}
        onChanged={() => {
          void refreshHymnCommunity();
        }}
      />
      </GestureHandlerRootView>
    </Animated.View>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
  },

  // Top bar — header text + close button
  topBar: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
  },
  iconHit: { padding: 8 },
  topLabel: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  topSubLabel: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '600',
    fontSize: 14.5,
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.9)',
  },

  // Album art stage — full width hit target for horizontal swipe, exact top+83 vertical slot
  artStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'visible',
  },
  peekCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#120405',
  },
  peekCaption: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 4, 5, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  peekCaptionText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '600',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  // Album art — takes up main space at exact top+83 offset
  artContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
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
    fontFamily: SYSTEM_FONT,
    fontWeight: '500',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },

  // Responsive lower deck that fills all space below artwork with zero black gap
  lowerDeck: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 4,
  },

  // Info — compact
  infoSection: {
    marginBottom: 4,
  },
  hymnTitle: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 29,
    letterSpacing: -0.45,
    marginBottom: 3,
    flexShrink: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  creditLine: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '500',
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: -0.15,
  },

  // Evenly Distributed Containerless Engagement Row + Single Sleek Sacred Ink Letra Pill
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    overflow: 'visible',
  },
  containerlessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
    height: 46,
    paddingHorizontal: 4,
    gap: 6,
    overflow: 'visible',
  },
  likeIconAnchor: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lyricsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 18,
    gap: 6,
    backgroundColor: 'rgba(123, 29, 32, 0.58)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  lyricsCapsuleText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '600',
    fontSize: 14.5,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  engagementPrimaryText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '600',
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  adminDislikeCount: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 13.5,
    color: '#fca5a5',
    fontVariant: ['tabular-nums'],
  },

  // Controls — 5-button row
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginVertical: 4,
  },
  controlBtn: {
    padding: 8,
  },
  controlBtnSmall: {
    padding: 10,
  },
  playBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },

  // Restored Bottom Action Bar — 4 evenly spaced larger animated icons
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  bottomAction: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBadge: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBadgeActive: {
    backgroundColor: 'rgba(185, 28, 28, 0.88)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  speedBadgeText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
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
