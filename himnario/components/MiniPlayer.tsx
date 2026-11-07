/**
 * MiniPlayer — Floating compact player bar above the BottomNavBar.
 *
 * Visible whenever a hymn is loaded (playing or paused).
 * Tap or swipe up on the bar to open the full-screen MusicPlayer.
 * Prev / Play-Pause / Next controls on the right.
 */
import React, { useCallback, useMemo, useState } from 'react';
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
import { runOnJS } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { hasHymnAudio } from '../data/audioRegistry';
import * as Haptics from '../utils/haptics';
import WebIcon from './WebIcon';
import GlassSurface from './GlassSurface';
import { LinearGradient } from 'expo-linear-gradient';

const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

export default function MiniPlayer({ showWhileExpanded = false, transitionPreview = false }: {
  showWhileExpanded?: boolean;
  /** Noninteractive visual endpoint used while the full player collapses. */
  transitionPreview?: boolean;
}) {
  const android = Platform.OS === 'android';
  const ios = Platform.OS === 'ios';
  const [surfaceSize, setSurfaceSize] = useState({ width: 360, height: 72 });
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const {
    currentHymnId,
    isPlaying,
    showFullPlayer,
    togglePlayPause,
    skipNext,
    skipPrev,
    openPlayer,
  } = useNowPlaying();

  const handleSwipeOpen = useCallback(() => {
    if (transitionPreview || !currentHymnId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openPlayer(String(currentHymnId));
  }, [transitionPreview, currentHymnId, openPlayer]);

  const swipeUpGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!transitionPreview && Boolean(currentHymnId))
        .activeOffsetY(-8)
        .failOffsetX([-24, 24])
        .onStart(() => {
          runOnJS(handleSwipeOpen)();
        }),
    [transitionPreview, currentHymnId, handleSwipeOpen]
  );

  // Don't render if nothing is loaded or full player is open
  if (!currentHymnId || (showFullPlayer && !showWhileExpanded && !transitionPreview)) return null;

  const activeData = String(currentHymnId).startsWith('E') ? estribillosData : hymnsData;
  const hymn = activeData.find((h: any) => String(h.id) === String(currentHymnId));
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

  return (
    <GestureDetector gesture={swipeUpGesture}>
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
            onPress={() => openPlayer(String(hymn.id))}
            style={[styles.content, android && { padding: 12, gap: 12 }]}
          >
            {/* Album art thumbnail */}
            <Image source={DEFAULT_COVER} style={[styles.cover, android && { width: 48, height: 48, borderRadius: 12 }, transitionPreview && { opacity: 0 }]} />

            {/* Text block */}
            <View style={styles.textBlock}>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {t.nowPlaying}
              </Text>
              <Text
                style={[styles.title, android && { fontSize: 20 }, { color: textColor }]}
                numberOfLines={1}
              >
                {hymn.title}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
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
