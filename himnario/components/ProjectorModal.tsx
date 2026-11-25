/**
 * ProjectorModal — Congregation presentation mode for a hymn (Workstream D).
 *
 * Parity with `docs/js/projection.js`:
 * - Shows one stanza at a time with "Himno N · Title" and verse label (Estrofa N / CORO)
 * - Stanza chips (1–9, C), horizontal swipe left/right, and phone tap zones
 *   (left third = previous, right third = next, center = toggle controls)
 * - Auto text size that fits the entire stanza on screen, plus manual − / + / Auto
 * - Hide lyrics (blank screen), independent projector light/dark theme,
 *   orientation flip / free rotation (Portrait & Landscape),
 *   lyrics-only immersive mode (hide controls), footer branding
 *   "Himnario El Buen Pastor · himnarioebp.com"
 * - Page-turn transition that respects Reduce Motion
 * - Keeps screen awake via `expo-keep-awake` and hides StatusBar
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from '../utils/haptics';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';
import AppMenuIcon from './AppMenuIcon';

export interface ProjectorStanza {
  isCoro: boolean;
  text: string;
  verseNum: number;
  coroLabel?: string;
}

export interface ProjectorModalProps {
  visible: boolean;
  onClose: () => void;
  hymn: {
    id: string | number;
    number: string | number;
    title: string;
  };
  stanzas: ProjectorStanza[];
  initialDarkMode: boolean;
}

function KeepAwakeGuard() {
  useKeepAwake();
  return null;
}

export default function ProjectorModal({
  visible,
  onClose,
  hymn,
  stanzas,
  initialDarkMode,
}: ProjectorModalProps) {
  const { t, hymnLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [blank, setBlank] = useState(false);
  const [projectorDark, setProjectorDark] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [manualFont, setManualFont] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [windowDims, setWindowDims] = useState(() => Dimensions.get('window'));
  const [manualLandscape, setManualLandscape] = useState(false);
  const [stageLayout, setStageLayout] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
  });
  const [showTapHint, setShowTapHint] = useState(false);
  const tapHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Page-turn animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  // Track window dimension changes when rotating phone
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }: { window: ReturnType<typeof Dimensions.get> }) => {
      setWindowDims(window);
      // If native OS rotated the window into landscape, clear manual transform fallback
      if (window.width > window.height) {
        setManualLandscape(false);
      }
    });
    return () => sub?.remove?.();
  }, []);

  // On Android, unlock orientation while ProjectorModal is open and lock back to Portrait on exit.
  // On iOS, keep native window orientation untouched (Info.plist PORTRAIT_UP) and use pure 90deg view rotation
  // (useTransformLandscape) so backgrounding/foregrounding never triggers ExpoScreenOrientation's native crash.
  const orientationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDarkModeRef = useRef(initialDarkMode);
  initialDarkModeRef.current = initialDarkMode;

  const clearOrientationUnlockTimer = useCallback(() => {
    if (orientationUnlockTimerRef.current) {
      clearTimeout(orientationUnlockTimerRef.current);
      orientationUnlockTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      if (!visible) setManualLandscape(false);
      return;
    }
    clearOrientationUnlockTimer();
    if (visible) {
      ScreenOrientation.unlockAsync().catch(() => {});
    } else {
      setManualLandscape(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    return () => {
      clearOrientationUnlockTimer();
      if (visible) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
  }, [clearOrientationUnlockTimer, visible]);

  useEffect(() => {
    if (visible) {
      setIndex(0);
      setBlank(false);
      setProjectorDark(initialDarkModeRef.current ?? true);
      setControlsVisible(true);
      setManualFont(null);
      setManualLandscape(false);
    }
    return () => {
      if (tapHintTimer.current) clearTimeout(tapHintTimer.current);
    };
  }, [visible, hymn.id]);

  const isNativeLandscape = windowDims.width > windowDims.height;
  const isLandscape = isNativeLandscape || manualLandscape;
  // Apply 90deg CSS/View rotation only when user toggled landscape manually and the OS window is still portrait
  const useTransformLandscape = manualLandscape && !isNativeLandscape;

  const handleToggleOrientation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearOrientationUnlockTimer();
    if (isLandscape) {
      setManualLandscape(false);
      if (Platform.OS === 'android') {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          orientationUnlockTimerRef.current = setTimeout(() => {
            orientationUnlockTimerRef.current = null;
            if (visible) {
              ScreenOrientation.unlockAsync().catch(() => {});
            }
          }, 800);
        } catch {
          // Ignore if unsupported
        }
      }
    } else {
      setManualLandscape(true);
      if (Platform.OS === 'android') {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch {
          // Fallback transform handles it if native lock fails or OS rotation lock is active
        }
      }
    }
  }, [clearOrientationUnlockTimer, isLandscape, visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearOrientationUnlockTimer();
    setManualLandscape(false);
    if (Platform.OS === 'android') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    onClose();
  }, [clearOrientationUnlockTimer, onClose]);

  const triggerTapHint = useCallback(() => {
    setShowTapHint(true);
    if (tapHintTimer.current) clearTimeout(tapHintTimer.current);
    tapHintTimer.current = setTimeout(() => setShowTapHint(false), 2600);
  }, []);

  const goToSlide = useCallback(
    (targetIdx: number) => {
      if (!stanzas.length) return;
      const clamped = Math.max(0, Math.min(stanzas.length - 1, targetIdx));
      if (clamped === index) return;
      const dir = clamped > index ? 1 : -1;

      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setBlank(false);
      setIndex(clamped);

      if (!reduceMotion && !blank) {
        slideAnim.setValue(dir * 26);
        fadeAnim.setValue(0.35);
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 22,
            stiffness: 210,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [stanzas.length, index, reduceMotion, blank, slideAnim, fadeAnim]
  );

  // Swipe left/right gesture on the stage (accounts for 90deg rotated stage if active)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gs) => {
          const primaryDelta = useTransformLandscape ? gs.dy : gs.dx;
          const secondaryDelta = useTransformLandscape ? gs.dx : gs.dy;
          return Math.abs(primaryDelta) > 18 && Math.abs(primaryDelta) > Math.abs(secondaryDelta) * 1.4;
        },
        onPanResponderRelease: (_evt, gs) => {
          const primaryDelta = useTransformLandscape ? gs.dy : gs.dx;
          const primaryVel = useTransformLandscape ? gs.vy : gs.vx;
          if (primaryDelta < -45 || primaryVel < -0.4) {
            goToSlide(index + 1);
          } else if (primaryDelta > 45 || primaryVel > 0.4) {
            goToSlide(index - 1);
          }
        },
      }),
    [goToSlide, index, useTransformLandscape]
  );

  const currentStanza = stanzas[index] ?? stanzas[0];

  // Auto-fit font size calculation so the entire stanza fits on screen
  const autoFontSize = useMemo(() => {
    if (!currentStanza?.text) return 32;
    const lines = currentStanza.text.split('\n').filter(Boolean);
    const lineCount = Math.max(lines.length, 2);
    const maxCharsInLine = Math.max(...lines.map((l) => l.length), 18);
    const usableH = Math.max(150, stageLayout.height - (isLandscape ? 72 : 110));
    const usableW = Math.max(260, stageLayout.width - 48);

    // Height constraint: lineCount * (fontSize * 1.48) <= usableH
    const byHeight = usableH / (lineCount * 1.48);
    // Width constraint: rough average glyph width ~0.5 * fontSize
    const byWidth = usableW / (maxCharsInLine * 0.5);

    const fitted = Math.floor(Math.min(byHeight, byWidth));
    return Math.max(18, Math.min(54, fitted));
  }, [currentStanza, stageLayout.height, stageLayout.width, isLandscape]);

  const effectiveFontSize = manualFont ?? autoFontSize;

  // Projector colors
  const bg = projectorDark ? '#050505' : '#FCF9F2';
  const fg = projectorDark ? '#FDF9F2' : '#24251F';
  const accent = projectorDark ? '#E6B89C' : '#6E1619';
  const muted = projectorDark ? 'rgba(253,249,242,0.55)' : 'rgba(36,37,31,0.55)';
  const chipBg = projectorDark ? 'rgba(255,255,255,0.10)' : 'rgba(110,22,25,0.08)';
  const chipActiveBg = projectorDark ? '#FDF9F2' : '#6E1619';
  const chipActiveFg = projectorDark ? '#050505' : '#FFFFFF';

  const isEstribillo = String(hymn.id).startsWith('E');
  const hymnPrefix = isEstribillo
    ? hymnLanguage === 'en'
      ? 'Chorus'
      : 'Estribillo'
    : hymnLanguage === 'en'
      ? 'Hymn'
      : 'Himno';
  const stanzaBadge = currentStanza?.isCoro
    ? currentStanza.coroLabel || (hymnLanguage === 'en' ? 'CHORUS' : t.projectorChorus)
    : t.projectorStanza.replace('{n}', String(currentStanza?.verseNum ?? index + 1));

  const handleStageTap = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const width = stageLayout.width || windowDims.width;
    if (x < width * 0.3) {
      goToSlide(index - 1);
    } else if (x > width * 0.7) {
      goToSlide(index + 1);
    } else {
      setControlsVisible((v) => {
        const next = !v;
        if (!next) triggerTapHint();
        return next;
      });
    }
  };

  if (!visible) return null;

  const topPad = useTransformLandscape
    ? 14
    : isNativeLandscape
      ? Math.max(insets.top, 10)
      : Math.max(insets.top, Platform.OS === 'android' ? 22 : 16) + 4;
  const bottomPad = useTransformLandscape
    ? 14
    : isNativeLandscape
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, Platform.OS === 'android' ? 22 : 16) + 8;
  const horizontalPad = useTransformLandscape
    ? Math.max(insets.top, insets.bottom, 20)
    : Math.max(insets.left, insets.right, 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      supportedOrientations={['portrait']}
      onRequestClose={handleClose}
    >
      <KeepAwakeGuard />
      <StatusBar hidden />

      <View style={[styles.outerViewport, { backgroundColor: bg }]}>
        <View
          style={[
            styles.root,
            { backgroundColor: bg, paddingHorizontal: horizontalPad },
            useTransformLandscape && {
              flex: 0,
              width: windowDims.height,
              height: windowDims.width,
              maxHeight: windowDims.width,
              transform: [{ rotate: '90deg' }],
            },
          ]}
        >
          {/* Top Bar: Exit button + Stanza counter */}
          {controlsVisible && (
            <View style={[styles.topBar, { paddingTop: topPad }]}>
              {Platform.OS === 'ios' ? (
                <GlassSurface
                  isInteractive
                  forceDark={projectorDark}
                  glassEffectStyle="regular"
                  intensity={56}
                  style={styles.exitGlassPill}
                >
                  <Pressable
                    style={({ pressed }) => [styles.exitGlassHit, pressed && { opacity: 0.75 }]}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel={t.projectorExit}
                  >
                    <AppMenuIcon
                      ios="chevron.left"
                      android="arrow-back"
                      size={15}
                      containerSize={18}
                      weight="semibold"
                      color={fg}
                    />
                    <Text style={[styles.exitBtnText, { color: fg }]}>
                      {t.projectorExit}
                    </Text>
                  </Pressable>
                </GlassSurface>
              ) : (
                <TouchableOpacity
                  style={[styles.exitBtn, { backgroundColor: chipBg }]}
                  onPress={handleClose}
                  accessibilityLabel={t.projectorExit}
                >
                  <MaterialIcons name="arrow-back" size={18} color={fg} />
                  <Text style={[styles.exitBtnText, { color: fg }]}>
                    {t.projectorExit}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.counterText, { color: muted }]}>
                {index + 1} / {stanzas.length}
              </Text>
            </View>
          )}

          {/* Main Stage (Tap Zones + Swipe Left/Right) */}
          <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            <Pressable
              style={[styles.stage, !controlsVisible && { paddingTop: topPad }]}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width > 0 && height > 0) {
                  setStageLayout({ width, height });
                }
              }}
              onPress={handleStageTap}
            >
              {!blank && currentStanza ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.stageInner,
                    isLandscape && { gap: 8 },
                    {
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                {/* Hymn Heading */}
                <Text
                  style={[styles.hymnHeading, { color: muted }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  <Text style={[styles.hymnHeadingNumber, { color: accent }]}>
                    {hymnPrefix} {hymn.number}
                  </Text>
                  {'  ·  '}
                  {hymn.title}
                </Text>

                {/* Stanza Label (Estrofa N / CORO) */}
                <View
                  style={[
                    styles.stanzaBadge,
                    {
                      backgroundColor: currentStanza.isCoro
                        ? accent + '22'
                        : chipBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stanzaBadgeText,
                      { color: currentStanza.isCoro ? accent : muted },
                    ]}
                  >
                    {stanzaBadge}
                  </Text>
                </View>

                {/* Lyrics Text */}
                <Text
                  style={[
                    styles.lyricsText,
                    currentStanza.isCoro && styles.lyricsTextChorus,
                    {
                      color: fg,
                      fontSize: effectiveFontSize,
                      lineHeight: Math.round(effectiveFontSize * 1.46),
                    },
                  ]}
                >
                  {currentStanza.text}
                </Text>
              </Animated.View>
            ) : null}
          </Pressable>
          </View>

          {/* Footer Branding */}
          <View
            style={[
              styles.brandingRow,
              !controlsVisible && { paddingBottom: bottomPad + 4 },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.brandingText, { color: muted }]}>
              Himnario El Buen Pastor{'  ·  '}
              <Text style={styles.brandingDomain}>himnarioebp.com</Text>
            </Text>
          </View>

          {/* Tap Hint Toast when entering lyrics-only mode */}
          {showTapHint && (
            <View
              style={[
                styles.tapHintWrap,
                { bottom: bottomPad + 48 },
              ]}
              pointerEvents="none"
            >
              <View style={styles.tapHintPill}>
                <Text style={styles.tapHintText}>{t.projectorTapHint}</Text>
              </View>
            </View>
          )}

          {/* Reveal Controls Floating Pill when controls are hidden */}
          {!controlsVisible && (
            <View
              style={[
                styles.revealWrap,
                { bottom: bottomPad + 6 },
              ]}
            >
              {Platform.OS === 'ios' ? (
                <GlassSurface
                  isInteractive
                  forceDark={projectorDark}
                  glassEffectStyle="regular"
                  intensity={56}
                  style={styles.revealGlassPill}
                >
                  <Pressable
                    style={({ pressed }) => [styles.revealGlassHit, pressed && { opacity: 0.75 }]}
                    onPress={() => setControlsVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t.projectorShowControls}
                  >
                    <AppMenuIcon
                      ios="slider.horizontal.3"
                      android="tune"
                      size={15}
                      containerSize={18}
                      weight="semibold"
                      color={fg}
                    />
                    <Text style={[styles.revealBtnText, { color: fg }]}>
                      {t.projectorShowControls}
                    </Text>
                  </Pressable>
                </GlassSurface>
              ) : (
                <TouchableOpacity
                  style={[styles.revealBtn, { backgroundColor: chipBg }]}
                  onPress={() => setControlsVisible(true)}
                >
                  <MaterialIcons name="tune" size={16} color={fg} />
                  <Text style={[styles.revealBtnText, { color: fg }]}>
                    {t.projectorShowControls}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Controls Toolbar */}
          {controlsVisible && (
            <View
              style={[
                styles.toolbarWrap,
                { paddingBottom: bottomPad },
              ]}
            >
              <GlassSurface
                isInteractive
                forceDark={projectorDark}
                intensity={55}
                tonalColor={projectorDark ? '#181818' : '#F2ECE1'}
                style={[
                  styles.toolbar,
                  {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: projectorDark
                      ? 'rgba(255,255,255,0.14)'
                      : 'rgba(110,22,25,0.14)',
                  },
                ]}
              >
                {/* Row 1: Stanza Selector Chips (1–9, C) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {stanzas.map((s, idx) => {
                    const active = idx === index;
                    const chipLabel = s.isCoro ? 'C' : String(s.verseNum);
                    return (
                      <TouchableOpacity
                        key={`stanza-chip-${idx}`}
                        style={[
                          styles.stanzaChip,
                          {
                            backgroundColor: active ? chipActiveBg : chipBg,
                          },
                        ]}
                        onPress={() => goToSlide(idx)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={
                          s.isCoro
                            ? t.projectorChorus
                            : t.projectorStanza.replace('{n}', String(s.verseNum))
                        }
                      >
                        <Text
                          style={[
                            styles.stanzaChipText,
                            { color: active ? chipActiveFg : fg },
                          ]}
                        >
                          {chipLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Row 2: Font Size & Mode Actions */}
                <View style={styles.actionsRow}>
                  {/* Font Size Group: − / size / + / Auto */}
                  <View style={[styles.fontGroup, { backgroundColor: chipBg }]}>
                    <TouchableOpacity
                      style={styles.fontStepBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setManualFont(Math.max(16, effectiveFontSize - 3));
                      }}
                    >
                      <MaterialIcons name="remove" size={17} color={fg} />
                    </TouchableOpacity>

                    <Text
                      style={[styles.fontPxLabel, { color: fg }]}
                      numberOfLines={1}
                    >
                      {Math.round(effectiveFontSize)}px
                    </Text>

                    <TouchableOpacity
                      style={styles.fontStepBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setManualFont(Math.min(64, effectiveFontSize + 3));
                      }}
                    >
                      <MaterialIcons name="add" size={17} color={fg} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.autoBtn,
                        manualFont === null && { backgroundColor: chipActiveBg },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setManualFont(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.autoBtnText,
                          { color: manualFont === null ? chipActiveFg : fg },
                        ]}
                        numberOfLines={1}
                      >
                        {t.projectorAutoSize}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Utility Buttons: Rotate, Blank, Theme, Hide Controls */}
                  <View style={styles.utilityRow}>
                    {/* Rotate / Flip Orientation (Portrait <-> Landscape) */}
                    <TouchableOpacity
                      style={[
                        styles.iconToolBtn,
                        {
                          backgroundColor: isLandscape ? chipActiveBg : chipBg,
                        },
                      ]}
                      onPress={handleToggleOrientation}
                      accessibilityLabel={t.projectorRotate}
                    >
                      <AppMenuIcon
                        ios="rotate.right"
                        android="screen-rotation"
                        size={17}
                        containerSize={20}
                        weight="medium"
                        color={isLandscape ? chipActiveFg : fg}
                      />
                    </TouchableOpacity>

                    {/* Blank / Hide Lyrics */}
                    <TouchableOpacity
                      style={[
                        styles.iconToolBtn,
                        {
                          backgroundColor: blank ? chipActiveBg : chipBg,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBlank((b) => !b);
                      }}
                      accessibilityLabel={
                        blank ? t.projectorShowLyrics : t.projectorHideLyrics
                      }
                    >
                      <AppMenuIcon
                        ios={blank ? 'eye.slash' : 'eye'}
                        android={blank ? 'visibility-off' : 'visibility'}
                        size={17}
                        containerSize={20}
                        weight="medium"
                        color={blank ? chipActiveFg : fg}
                      />
                    </TouchableOpacity>

                    {/* Projector Light / Dark Theme */}
                    <TouchableOpacity
                      style={[styles.iconToolBtn, { backgroundColor: chipBg }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setProjectorDark((d) => !d);
                      }}
                      accessibilityLabel={projectorDark ? t.lightModeTitle : t.darkModeTitle}
                    >
                      <AppMenuIcon
                        ios={projectorDark ? 'sun.max.fill' : 'moon.fill'}
                        android={projectorDark ? 'light-mode' : 'dark-mode'}
                        size={17}
                        containerSize={20}
                        weight="medium"
                        color={fg}
                      />
                    </TouchableOpacity>

                    {/* Immersive Lyrics-only (Hide Controls) */}
                    <TouchableOpacity
                      style={[styles.iconToolBtn, { backgroundColor: chipBg }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setControlsVisible(false);
                        triggerTapHint();
                      }}
                      accessibilityLabel={t.projectorHideControls}
                    >
                      <AppMenuIcon
                        ios="arrow.up.left.and.arrow.down.right"
                        android="fullscreen"
                        size={16}
                        containerSize={20}
                        weight="medium"
                        color={fg}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassSurface>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outerViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  exitGlassPill: {
    borderRadius: 20,
  },
  exitGlassHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  exitBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 13.5,
  },
  counterText: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stageInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  hymnHeading: {
    ...fonts.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  hymnHeadingNumber: {
    ...fonts.sansBold,
    fontSize: 16,
    letterSpacing: 0.8,
  },
  stanzaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  stanzaBadgeText: {
    ...fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  lyricsText: {
    ...fonts.regular,
    textAlign: 'center',
    width: '100%',
  },
  lyricsTextChorus: {
    ...fonts.regularItalic,
  },
  brandingRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  brandingText: {
    ...fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    opacity: 0.7,
  },
  brandingDomain: {
    ...fonts.sansBold,
  },
  tapHintWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  tapHintPill: {
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tapHintText: {
    ...fonts.sansMedium,
    fontSize: 12.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  revealWrap: {
    position: 'absolute',
    right: 20,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  revealGlassPill: {
    borderRadius: 20,
  },
  revealGlassHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  revealBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 12.5,
  },
  toolbarWrap: {
    paddingHorizontal: 12,
  },
  toolbar: {
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 11,
    gap: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  stanzaChip: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stanzaChipText: {
    ...fonts.sansBold,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  fontGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 3,
    gap: 1,
    flexShrink: 1,
  },
  fontStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontPxLabel: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
    minWidth: 30,
    textAlign: 'center',
  },
  autoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 1,
  },
  autoBtnText: {
    ...fonts.sansBold,
    fontSize: 11,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  iconToolBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
