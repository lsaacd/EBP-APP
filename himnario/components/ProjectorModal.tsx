/**
 * ProjectorModal — Congregation presentation mode for a hymn (Workstream D).
 *
 * Parity with `docs/js/projection.js`:
 * - Shows one stanza at a time with "Himno N · Title" and verse label (Estrofa N / CORO)
 * - Stanza chips (1–9, C), horizontal swipe left/right, and phone tap zones
 *   (left third = previous, right third = next, center = toggle controls)
 * - Auto text size that fits the entire stanza on screen, plus manual − / + / Auto
 * - Hide lyrics (blank screen), independent projector light/dark theme,
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
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';

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
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [blank, setBlank] = useState(false);
  const [projectorDark, setProjectorDark] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [manualFont, setManualFont] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
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

  useEffect(() => {
    if (visible) {
      setIndex(0);
      setBlank(false);
      setProjectorDark(initialDarkMode ?? true);
      setControlsVisible(true);
      setManualFont(null);
    }
    return () => {
      if (tapHintTimer.current) clearTimeout(tapHintTimer.current);
    };
  }, [visible, hymn.id, initialDarkMode]);

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

  // Swipe left/right gesture on the stage
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gs) =>
          Math.abs(gs.dx) > 18 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.4,
        onPanResponderRelease: (_evt, gs) => {
          if (gs.dx < -45 || gs.vx < -0.4) {
            goToSlide(index + 1);
          } else if (gs.dx > 45 || gs.vx > 0.4) {
            goToSlide(index - 1);
          }
        },
      }),
    [goToSlide, index]
  );

  const currentStanza = stanzas[index] ?? stanzas[0];

  // Auto-fit font size calculation so the entire stanza fits on screen
  const autoFontSize = useMemo(() => {
    if (!currentStanza?.text) return 32;
    const lines = currentStanza.text.split('\n').filter(Boolean);
    const lineCount = Math.max(lines.length, 2);
    const maxCharsInLine = Math.max(...lines.map((l) => l.length), 18);
    const usableH = Math.max(200, stageLayout.height - 110);
    const usableW = Math.max(260, stageLayout.width - 48);

    // Height constraint: lineCount * (fontSize * 1.48) <= usableH
    const byHeight = usableH / (lineCount * 1.52);
    // Width constraint: rough average glyph width ~0.52 * fontSize
    const byWidth = usableW / (maxCharsInLine * 0.5);

    const fitted = Math.floor(Math.min(byHeight, byWidth));
    return Math.max(18, Math.min(54, fitted));
  }, [currentStanza, stageLayout.height, stageLayout.width]);

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
  const hymnPrefix = isEstribillo ? 'Estribillo' : 'Himno';
  const stanzaBadge = currentStanza?.isCoro
    ? currentStanza.coroLabel || t.projectorChorus
    : t.projectorStanza.replace('{n}', String(currentStanza?.verseNum ?? index + 1));

  const handleStageTap = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const width = stageLayout.width || Dimensions.get('window').width;
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeepAwakeGuard />
      <StatusBar hidden />

      <View style={[styles.root, { backgroundColor: bg }]}>
        {/* Top Bar: Exit button + Stanza counter */}
        {controlsVisible && (
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top, 16) + 4 },
            ]}
          >
            <TouchableOpacity
              style={[styles.exitBtn, { backgroundColor: chipBg }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              accessibilityLabel={t.projectorExit}
            >
              <MaterialIcons name="arrow-back" size={18} color={fg} />
              <Text style={[styles.exitBtnText, { color: fg }]}>
                {t.projectorExit}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.counterText, { color: muted }]}>
              {index + 1} / {stanzas.length}
            </Text>
          </View>
        )}

        {/* Main Stage (Tap Zones + Swipe Left/Right) */}
        <Pressable
          style={styles.stage}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setStageLayout({ width, height });
            }
          }}
          onPress={handleStageTap}
          {...panResponder.panHandlers}
        >
          {!blank && currentStanza ? (
            <Animated.View
              style={[
                styles.stageInner,
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

        {/* Footer Branding */}
        <View
          style={[
            styles.brandingRow,
            !controlsVisible && { paddingBottom: Math.max(insets.bottom, 16) + 8 },
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
              { bottom: Math.max(insets.bottom, 24) + 54 },
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
              { bottom: Math.max(insets.bottom, 16) + 10 },
            ]}
          >
            <TouchableOpacity
              style={[styles.revealBtn, { backgroundColor: chipBg }]}
              onPress={() => setControlsVisible(true)}
            >
              <MaterialIcons name="tune" size={16} color={fg} />
              <Text style={[styles.revealBtnText, { color: fg }]}>
                {t.projectorShowControls}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Controls Toolbar */}
        {controlsVisible && (
          <View
            style={[
              styles.toolbarWrap,
              { paddingBottom: Math.max(insets.bottom, 16) + 6 },
            ]}
          >
            <GlassSurface
              forceDark={projectorDark}
              intensity={55}
              tonalColor={projectorDark ? '#181818' : '#F2ECE1'}
              style={styles.toolbar}
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
                    <MaterialIcons name="remove" size={18} color={fg} />
                  </TouchableOpacity>

                  <Text style={[styles.fontPxLabel, { color: fg }]}>
                    {Math.round(effectiveFontSize)}px
                  </Text>

                  <TouchableOpacity
                    style={styles.fontStepBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setManualFont(Math.min(64, effectiveFontSize + 3));
                    }}
                  >
                    <MaterialIcons name="add" size={18} color={fg} />
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
                    >
                      {t.projectorAutoSize}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Utility Buttons: Blank, Theme, Hide Controls */}
                <View style={styles.utilityRow}>
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
                    <MaterialIcons
                      name={blank ? 'visibility-off' : 'visibility'}
                      size={20}
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
                    <MaterialIcons
                      name={projectorDark ? 'light-mode' : 'dark-mode'}
                      size={20}
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
                    <MaterialIcons name="fullscreen" size={22} color={fg} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassSurface>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  exitBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13.5,
  },
  counterText: {
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  hymnHeadingNumber: {
    fontFamily: 'PublicSans_700Bold',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  lyricsText: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    width: '100%',
  },
  lyricsTextChorus: {
    fontFamily: fonts.regularItalic,
  },
  brandingRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  brandingText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.6,
    opacity: 0.7,
  },
  brandingDomain: {
    fontFamily: 'PublicSans_700Bold',
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
    fontFamily: 'PublicSans_500Medium',
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
  revealBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12.5,
  },
  toolbarWrap: {
    paddingHorizontal: 16,
  },
  toolbar: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fontGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  fontStepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontPxLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12.5,
    minWidth: 38,
    textAlign: 'center',
  },
  autoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 2,
  },
  autoBtnText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 12,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconToolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

