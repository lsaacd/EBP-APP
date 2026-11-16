/**
 * MiniPlayer — Floating compact player bar above the BottomNavBar.
 *
 * Visible whenever a hymn is loaded (playing or paused).
 * - Tap or swipe up on the bar to open the full-screen MusicPlayer.
 * - Swipe left or right on the track area (YouTube Music style) to scrub to the next/previous hymn.
 * - Prev / Play-Pause / Next controls anchored on the right.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getLocalizedHymn } from '../data/alabanzasEnglish';
import { hasHymnAudio } from '../data/audioRegistry';
import { clampMiniPlayerDrag, miniPlayerSwipeDirection } from '../utils/gestureMotion';
import * as Haptics from '../utils/haptics';
import WebIcon from './WebIcon';
import GlassSurface from './GlassSurface';
import { LinearGradient } from 'expo-linear-gradient';

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');
const SWIPE_SPRING = { damping: 30, stiffness: 360, mass: 0.75, overshootClamping: true };

const ALL_HYMN_AUDIO_IDS = hymnsData.map((h: any) => String(h.id)).filter(hasHymnAudio);
const ALL_ESTRIBILLO_AUDIO_IDS = estribillosData.map((h: any) => String(h.id)).filter(hasHymnAudio);
const HYMN_BY_ID = new Map<string, any>(
  [...hymnsData, ...estribillosData].map((h: any) => [String(h.id), h]),
);

export default function MiniPlayer({ showWhileExpanded = false, transitionPreview = false }: {
  showWhileExpanded?: boolean;
  /** Noninteractive visual endpoint used while the full player collapses. */
  transitionPreview?: boolean;
}) {
  const android = Platform.OS === 'android';
  const ios = Platform.OS === 'ios';
  const [surfaceSize, setSurfaceSize] = useState({ width: 360, height: 72 });
  const [slotWidthState, setSlotWidthState] = useState(210);
  const { theme, isDarkMode } = useTheme();
  const { t, hymnLanguage } = useLanguage();
  const {
    currentHymnId,
    currentQueueIds,
    repeatMode,
    isPlaying,
    showFullPlayer,
    togglePlayPause,
    skipNext,
    skipPrev,
    openPlayer,
  } = useNowPlaying();

  // Shared values for 120Hz UI-thread horizontal track carousel
  const translateX = useSharedValue(0);
  const slotWidth = useSharedValue(210);
  const hasPrevShared = useSharedValue(false);
  const hasNextShared = useSharedValue(false);
  const isCommitting = useSharedValue(false);
  const gestureMode = useSharedValue<0 | 1 | 2>(0); // 0 = undecided, 1 = horizontal track swipe, 2 = vertical expand
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const touchInControls = useSharedValue(false);

  const suppressTapUntilRef = useRef(0);
  const commitFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { hymn, prevHymn, nextHymn } = useMemo(() => {
    if (!currentHymnId) return { hymn: null, prevHymn: null, nextHymn: null };
    const idStr = String(currentHymnId);
    const current = HYMN_BY_ID.get(idStr) ?? null;
    if (!current) return { hymn: null, prevHymn: null, nextHymn: null };

    const custom = currentQueueIds?.length ? currentQueueIds.map(String).filter(hasHymnAudio) : null;
    const list = custom?.length
      ? custom
      : idStr.startsWith('E')
        ? ALL_ESTRIBILLO_AUDIO_IDS
        : ALL_HYMN_AUDIO_IDS;
    const idx = list.indexOf(idStr);
    const localizedCurrent = getLocalizedHymn(current, hymnLanguage);
    if (idx < 0 || list.length <= 1) {
      return { hymn: localizedCurrent, prevHymn: null, nextHymn: null };
    }

    const wraps = Boolean(custom?.length) || repeatMode === 'all';
    const prevIdx = idx > 0 ? idx - 1 : wraps ? list.length - 1 : -1;
    const nextIdx = idx < list.length - 1 ? idx + 1 : wraps ? 0 : -1;
    const prevRaw = prevIdx >= 0 ? (HYMN_BY_ID.get(list[prevIdx]) ?? null) : null;
    const nextRaw = nextIdx >= 0 ? (HYMN_BY_ID.get(list[nextIdx]) ?? null) : null;

    return {
      hymn: localizedCurrent,
      prevHymn: prevRaw ? getLocalizedHymn(prevRaw, hymnLanguage) : null,
      nextHymn: nextRaw ? getLocalizedHymn(nextRaw, hymnLanguage) : null,
    };
  }, [currentHymnId, currentQueueIds, repeatMode, hymnLanguage]);

  useEffect(() => {
    hasPrevShared.value = Boolean(prevHymn);
    hasNextShared.value = Boolean(nextHymn);
  }, [prevHymn, nextHymn, hasPrevShared, hasNextShared]);

  // Synchronously reset strip offset when currentHymnId updates so the newly active hymn sits at x = 0 with zero flash
  useLayoutEffect(() => {
    if (commitFallbackTimerRef.current) {
      clearTimeout(commitFallbackTimerRef.current);
      commitFallbackTimerRef.current = null;
    }
    cancelAnimation(translateX);
    translateX.value = 0;
    isCommitting.value = false;
  }, [currentHymnId, translateX, isCommitting]);

  useEffect(() => {
    return () => {
      if (commitFallbackTimerRef.current) clearTimeout(commitFallbackTimerRef.current);
    };
  }, []);

  const markHorizontalSwipe = useCallback(() => {
    suppressTapUntilRef.current = Date.now() + 350;
  }, []);

  const handleSwipeOpen = useCallback(() => {
    if (transitionPreview || !currentHymnId) return;
    suppressTapUntilRef.current = Date.now() + 350;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openPlayer(String(currentHymnId));
  }, [transitionPreview, currentHymnId, openPlayer]);

  const handleCommitTrackSwipe = useCallback((direction: 1 | -1) => {
    suppressTapUntilRef.current = Date.now() + 350;
    if (direction === 1) {
      skipNext();
    } else {
      skipPrev();
    }
    // Safety fallback if the queue could not advance
    if (commitFallbackTimerRef.current) clearTimeout(commitFallbackTimerRef.current);
    commitFallbackTimerRef.current = setTimeout(() => {
      isCommitting.value = false;
      translateX.value = withSpring(0, SWIPE_SPRING);
    }, 260);
  }, [skipNext, skipPrev, isCommitting, translateX]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!transitionPreview && Boolean(currentHymnId))
        .manualActivation(true)
        .maxPointers(1)
        .onTouchesDown(event => {
          gestureMode.value = 0;
          if (!event.allTouches.length) return;
          touchX.value = event.allTouches[0].absoluteX;
          touchY.value = event.allTouches[0].absoluteY;
        })
        .onTouchesMove((event, manager) => {
          if (!event.allTouches.length) return;
          if (touchInControls.value || isCommitting.value) {
            manager.fail();
            return;
          }
          if (gestureMode.value !== 0) return;
          const dx = event.allTouches[0].absoluteX - touchX.value;
          const dy = event.allTouches[0].absoluteY - touchY.value;

          // Vertical upward swipe -> open full MusicPlayer
          if (dy < -8 && Math.abs(dy) > Math.abs(dx) * 1.15) {
            gestureMode.value = 2;
            manager.activate();
            return;
          }
          // Downward drag on mini-player -> fail immediately
          if (dy > 14 && Math.abs(dy) > Math.abs(dx)) {
            manager.fail();
            return;
          }
          // Horizontal thumb swipe -> scrub between previous and next tracks
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.15) {
            gestureMode.value = 1;
            manager.activate();
          }
        })
        .onStart(() => {
          if (gestureMode.value === 2) {
            runOnJS(handleSwipeOpen)();
          } else if (gestureMode.value === 1) {
            cancelAnimation(translateX);
            runOnJS(markHorizontalSwipe)();
          }
        })
        .onUpdate(event => {
          if (gestureMode.value !== 1 || isCommitting.value) return;
          translateX.value = clampMiniPlayerDrag(
            event.translationX,
            slotWidth.value,
            hasPrevShared.value,
            hasNextShared.value,
          );
        })
        .onEnd(event => {
          if (gestureMode.value !== 1 || isCommitting.value) return;
          const dir = miniPlayerSwipeDirection(
            event.translationX,
            event.velocityX,
            slotWidth.value,
            hasPrevShared.value,
            hasNextShared.value,
          );
          if (dir !== 0) {
            isCommitting.value = true;
            const targetX = -dir * slotWidth.value;
            translateX.value = withSpring(targetX, SWIPE_SPRING, finished => {
              if (finished) {
                runOnJS(handleCommitTrackSwipe)(dir);
              } else {
                isCommitting.value = false;
                translateX.value = withSpring(0, SWIPE_SPRING);
              }
            });
          } else {
            translateX.value = withSpring(0, SWIPE_SPRING);
          }
        })
        .onFinalize((_event, success) => {
          if (gestureMode.value === 1 && !success && !isCommitting.value) {
            translateX.value = withSpring(0, SWIPE_SPRING);
          }
          gestureMode.value = 0;
          touchInControls.value = false;
        }),
    [
      transitionPreview,
      currentHymnId,
      gestureMode,
      touchX,
      touchY,
      touchInControls,
      isCommitting,
      translateX,
      slotWidth,
      hasPrevShared,
      hasNextShared,
      handleSwipeOpen,
      markHorizontalSwipe,
      handleCommitTrackSwipe,
    ],
  );

  const trackStripAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Don't render if nothing is loaded or full player is open
  if (!currentHymnId || (showFullPlayer && !showWhileExpanded && !transitionPreview)) return null;
  if (!hymn) return null;

  const audioAvailable = hasHymnAudio(String(hymn.id));
  if (!audioAvailable) return null;

  // ── Theme-aware colors ──────────────────────────────────
  const textColor = isDarkMode ? '#ffffff' : '#1c1c18';
  const subtitleColor = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(28,28,24,0.5)';
  const playBtnBg = isDarkMode ? (android ? '#fdf9f2' : '#ffffff') : '#6e1619';
  const playBtnIcon = isDarkMode ? '#010101' : '#ffffff';
  const controlColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(28,28,24,0.55)';

  // CSS linear-gradient(155deg, #2b2b2b, #171717 70%). Calculate
  // endpoints in the measured rectangle so the angle survives aspect changes.
  const angle = 155 * Math.PI / 180;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const lineLength = Math.abs(surfaceSize.width * dx) + Math.abs(surfaceSize.height * dy);
  const halfX = dx * lineLength / (2 * surfaceSize.width);
  const halfY = dy * lineLength / (2 * surfaceSize.height);

  const renderTrackSlot = (item: any, isCenter: boolean) => (
    <View style={[styles.trackSlotInner, android && { gap: 12 }]}>
      <Image
        source={DEFAULT_COVER}
        style={[
          styles.cover,
          android && { width: 48, height: 48, borderRadius: 12 },
          isCenter && transitionPreview && { opacity: 0 },
        ]}
      />
      <View style={styles.textBlock}>
        <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
          {t.nowPlaying}
        </Text>
        <Text
          style={[styles.title, android && { fontSize: 20 }, { color: textColor }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>
    </View>
  );

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.wrapper, ios && styles.iosShadow, android && { paddingHorizontal: 12 }, transitionPreview && { paddingHorizontal: 0 }]}>
        <GlassSurface
          stableBackdrop={!ios || transitionPreview}
          style={[
            styles.container,
            ios && styles.iosRoundedRect,
            android && { borderRadius: 18, borderWidth: 1, borderColor: isDarkMode ? '#ffffff35' : '#e3dfd3', elevation: 8 },
          ]}
          intensity={55}
          isInteractive
          tonalColor={android ? (isDarkMode ? '#202020' : '#fcf9f2') : theme.surfaceVariants.containerLow}
        >
          {android && isDarkMode && <>
            <LinearGradient pointerEvents="none" colors={['#2b2b2b', '#171717']} locations={[0, 0.7]}
              start={{ x: 0.5 - halfX, y: 0.5 - halfY }} end={{ x: 0.5 + halfX, y: 0.5 + halfY }}
              style={StyleSheet.absoluteFill}
              onLayout={({ nativeEvent: { layout } }) => {
                if (layout.width <= 0 || layout.height <= 0) return;
                setSurfaceSize(current => current.width === layout.width && current.height === layout.height
                  ? current : { width: layout.width, height: layout.height });
              }} />
            <View pointerEvents="none" style={styles.androidHighlight} />
          </>}
          {/* Content row */}
          <Pressable
            disabled={transitionPreview}
            onPress={() => {
              if (Date.now() < suppressTapUntilRef.current) return;
              openPlayer(String(hymn.id));
            }}
            style={[styles.content, android && { padding: 12, gap: 12 }]}
          >
            {/* Clipped 3-slot YouTube Music track carousel */}
            <View
              style={styles.trackViewport}
              onLayout={({ nativeEvent: { layout } }) => {
                if (layout.width <= 0) return;
                slotWidth.value = layout.width;
                setSlotWidthState(prev => (Math.abs(prev - layout.width) < 1 ? prev : layout.width));
              }}
            >
              <Animated.View style={[styles.trackStrip, trackStripAnimatedStyle]}>
                {prevHymn && !transitionPreview && (
                  <View
                    pointerEvents="none"
                    style={[styles.neighborSlot, { left: -slotWidthState, width: slotWidthState }]}
                  >
                    {renderTrackSlot(prevHymn, false)}
                  </View>
                )}
                {renderTrackSlot(hymn, true)}
                {nextHymn && !transitionPreview && (
                  <View
                    pointerEvents="none"
                    style={[styles.neighborSlot, { left: slotWidthState, width: slotWidthState }]}
                  >
                    {renderTrackSlot(nextHymn, false)}
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Controls */}
            <View
              style={styles.controls}
              onTouchStart={() => {
                touchInControls.value = true;
              }}
              onTouchEnd={() => {
                touchInControls.value = false;
              }}
              onTouchCancel={() => {
                touchInControls.value = false;
              }}
            >
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous hymn" onPress={event => { event.stopPropagation(); skipPrev(); }} hitSlop={8} style={android && { padding: 4 }}>
                {android ? <WebIcon name="previous" color={controlColor} /> : <MaterialIcons name="skip-previous" size={22} color={controlColor} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={event => { event.stopPropagation(); togglePlayPause(); }}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                style={[styles.playBtn, android && { width: 46, height: 46, borderRadius: 14 }, { backgroundColor: playBtnBg }]}
              >
                {android ? <WebIcon name={isPlaying ? 'pause' : 'play'} color={playBtnIcon} /> : <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={22}
                  color={playBtnIcon}
                />}
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next hymn" onPress={event => { event.stopPropagation(); skipNext(); }} hitSlop={8} style={android && { padding: 4 }}>
                {android ? <WebIcon name="next" color={controlColor} /> : <MaterialIcons name="skip-next" size={22} color={controlColor} />}
              </TouchableOpacity>
            </View>
          </Pressable>
        </GlassSurface>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
  },
  container: {
    borderRadius: 16,
  },
  iosRoundedRect: { borderRadius: 16 },
  iosShadow: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
  androidHighlight: { position: 'absolute', top: 0, left: 20, right: 20, height: StyleSheet.hairlineWidth, backgroundColor: '#ffffff12' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  trackViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  trackStrip: {
    width: '100%',
  },
  trackSlotInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 4,
  },
  neighborSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 15,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
