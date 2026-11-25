/**
 * TextSizeSheet — Reader text-size control inspired by the website's "Texto" popover.
 *
 * Features:
 * - Live Newsreader preview line
 * - Slider (12–64 px) + 1 px (− / +) step buttons
 * - Direct numeric input (12–64 px)
 * - Instant Reset to default (22 px, multiplier 1.0)
 * - iOS: Floating glass popover card with Haptics.selectionAsync() ticks
 * - Android: Material 3 bottom sheet card
 * - Closes on outside tap or Android back button
 */
import SheetGrabber from './SheetGrabber';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';
import { buildSheetPanGesture } from '../utils/useSheetBackdropGesture';
import {
  hasSanctuaryBrightnessOverride,
  readCurrentBrightness,
  restoreSanctuaryBrightness,
  setSanctuaryBrightness,
} from '../utils/sanctuaryBrightness';

const BASE_PX = 22;
const MIN_PX = 12;
const MAX_PX = 64;

export interface TextSizeSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function TextSizeSheet({ visible, onClose }: TextSizeSheetProps) {
  const { theme, isDarkMode, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();
  const { t } = useLanguage();
  const { currentHymnId, showFullPlayer, miniPlayerHeight } = useNowPlaying();
  const insets = useSafeAreaInsets();
  const miniPlayerVisible = Boolean(currentHymnId) && !showFullPlayer;
  const resolvedMiniPlayerHeight = miniPlayerHeight > 0 ? miniPlayerHeight : 57;
  const iosPillBottom = Math.max(insets.bottom, 22);
  const iosPopoverBottom = miniPlayerVisible
    ? iosPillBottom + 55 + resolvedMiniPlayerHeight + 2
    : iosPillBottom + 54 + 4;

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const [inputText, setInputText] = useState(String(currentPx));
  const lastHapticPx = useRef(currentPx);
  const [brightnessPct, setBrightnessPct] = useState<number | null>(null);
  const [brightnessOverridden, setBrightnessOverridden] = useState(() =>
    hasSanctuaryBrightnessOverride(),
  );

  useEffect(() => {
    setInputText(String(currentPx));
  }, [currentPx, visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    void readCurrentBrightness().then((val) => {
      if (!active || val === null) return;
      setBrightnessPct(Math.min(100, Math.max(8, Math.round(val * 100))));
      setBrightnessOverridden(hasSanctuaryBrightnessOverride());
    });
    return () => {
      active = false;
    };
  }, [visible]);

  const applyPx = (px: number, withHaptic = true) => {
    const clamped = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(px)));
    if (withHaptic && clamped !== lastHapticPx.current) {
      lastHapticPx.current = clamped;
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
    }
    setFontSizeMultiplier(clamped / BASE_PX);
  };

  const handleInputCommit = () => {
    const parsed = parseInt(inputText, 10);
    if (Number.isFinite(parsed)) {
      applyPx(parsed, true);
    } else {
      setInputText(String(currentPx));
    }
  };

  const { height: windowHeight } = useWindowDimensions();
  const travel = Math.max(360, windowHeight * 0.55);
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const spring = { damping: 28, stiffness: 240, mass: 1, overshootClamping: true };

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishClose, progress]);

  useEffect(() => {
    if (visible) {
      progress.value = 1;
      progress.value = withSpring(0, spring);
    } else {
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.42,
  });

  const headerPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.42,
  });

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - progress.value)),
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  const isIOS = Platform.OS === 'ios';
  const isDefault = currentPx === BASE_PX;

  const content = (
    <View style={styles.inner}>
      {/* Top Row: Label, Direct Number Input, Reset */}
      <GestureDetector gesture={headerPan}>
        <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.onSurface }]}>
          {t.textSizeTitle}
        </Text>

        <View style={styles.headerActions}>
          {/* Direct numeric px input */}
          <View
            style={[
              styles.pxInputWrap,
              {
                backgroundColor: theme.surfaceVariants.containerHighest,
                borderColor: theme.outlineVariant + '44',
              },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onBlur={handleInputCommit}
              onSubmitEditing={handleInputCommit}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={2}
               selectTextOnFocus
              style={[styles.pxInput, { color: theme.primary }]}
              accessibilityLabel={t.textSizeTitle}
            />
            <Text style={[styles.pxUnit, { color: theme.onSurfaceVariant }]}>px</Text>
          </View>

          {/* Reset button */}
          <TouchableOpacity
            style={[
              styles.resetBtn,
              {
                backgroundColor: isDefault
                  ? theme.surfaceVariants.containerHighest
                  : theme.primary + '16',
                opacity: isDefault ? 0.45 : 1,
              },
            ]}
            disabled={isDefault}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              applyPx(BASE_PX, false);
            }}
          >
            <Text
              style={[
                styles.resetText,
                { color: isDefault ? theme.onSurfaceVariant : theme.primary },
              ]}
            >
              {t.textSizeReset}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </GestureDetector>

      {/* Live Newsreader Preview */}
      <View
        style={[
          styles.previewBox,
          {
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.38)' : 'rgba(252,249,242,0.85)',
            borderColor: theme.outlineVariant + '28',
          },
        ]}
      >
        <Text
          numberOfLines={2}
          style={[
            styles.previewText,
            {
              color: theme.onSurface,
              fontSize: Math.min(42, currentPx),
              lineHeight: Math.round(Math.min(42, currentPx) * 1.45),
            },
          ]}
        >
          {t.textSizePreview}
        </Text>
      </View>

      {/* 1px Step Buttons + Slider */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.stepBtn,
            {
              backgroundColor: theme.surfaceVariants.containerHighest,
              opacity: currentPx <= MIN_PX ? 0.35 : 1,
            },
          ]}
          disabled={currentPx <= MIN_PX}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            applyPx(currentPx - 1, false);
          }}
          accessibilityLabel="−"
        >
          <MaterialIcons name="remove" size={20} color={theme.primary} />
        </TouchableOpacity>

        <Slider
          style={styles.slider}
          minimumValue={MIN_PX}
          maximumValue={MAX_PX}
          step={1}
          value={currentPx}
          onValueChange={(val) => applyPx(val, true)}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.surfaceVariants.containerHighest}
          thumbTintColor={theme.primary}
        />

        <TouchableOpacity
          style={[
            styles.stepBtn,
            {
              backgroundColor: theme.surfaceVariants.containerHighest,
              opacity: currentPx >= MAX_PX ? 0.35 : 1,
            },
          ]}
          disabled={currentPx >= MAX_PX}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            applyPx(currentPx + 1, false);
          }}
          accessibilityLabel="+"
        >
          <MaterialIcons name="add" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Sanctuary Reading Brightness */}
      {brightnessPct !== null && (
        <View
          style={[
            styles.brightnessWrap,
            { borderTopColor: theme.outlineVariant + '30' },
          ]}
        >
          <View style={styles.brightnessHeader}>
            <Text style={[styles.brightnessLabel, { color: theme.onSurface }]}>
              {t.brightnessTitle}
            </Text>
            <View style={styles.headerActions}>
              <Text style={[styles.brightnessVal, { color: theme.onSurfaceVariant }]}>
                {`${brightnessPct}%`}
              </Text>
              {brightnessOverridden && (
                <TouchableOpacity
                  style={[styles.resetBtn, { backgroundColor: theme.primary + '16' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBrightnessOverridden(false);
                    void restoreSanctuaryBrightness().then((restored) => {
                      if (typeof restored === 'number') {
                        setBrightnessPct(Math.min(100, Math.max(8, Math.round(restored * 100))));
                      }
                    });
                  }}
                >
                  <Text style={[styles.resetText, { color: theme.primary }]}>
                    {t.brightnessReset}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.controlsRow}>
            <MaterialIcons name="brightness-low" size={19} color={theme.onSurfaceVariant} />
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={100}
              step={1}
              value={brightnessPct}
              onValueChange={(val) => {
                const next = Math.min(100, Math.max(8, Math.round(val)));
                setBrightnessPct(next);
                setBrightnessOverridden(true);
                void setSanctuaryBrightness(next / 100);
              }}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.surfaceVariants.containerHighest}
              thumbTintColor={theme.primary}
            />
            <MaterialIcons name="brightness-high" size={20} color={theme.primary} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={animateClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={isIOS ? 'padding' : undefined}
          style={styles.overlay}
        >
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.backdropBg, backdropAnimStyle]}
          />
          <GestureDetector gesture={backdropPan}>
            <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />
          </GestureDetector>

          <Animated.View style={[{ width: '100%' }, sheetAnimStyle]}>
            {isIOS ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: iosPopoverBottom,
                }}
              >
                <SheetGrabber />
                <GlassSurface intensity={65} style={styles.iosPopover}>
                  {content}
                </GlassSurface>
              </View>
            ) : (
              <View
                style={[
                  styles.androidSheet,
                  {
                    backgroundColor: theme.surfaceVariants.containerLow,
                    paddingBottom: Math.max(insets.bottom, 20) + 12,
                  },
                ]}
              >
                <SheetGrabber />
                {content}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropBg: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  iosPopover: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  androidSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    elevation: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  inner: {
    gap: 14,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.35,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pxInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 3,
  },
  pxInput: {
    ...fonts.sansBold,
    fontSize: 14,
    minWidth: 26,
    textAlign: 'right',
    padding: 0,
  },
  pxUnit: {
    ...fonts.sansMedium,
    fontSize: 12,
    opacity: 0.7,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetText: {
    ...fonts.sansSemiBold,
    fontSize: 12.5,
  },
  previewBox: {
    minHeight: 74,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    ...fonts.regular,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  brightnessWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 6,
  },
  brightnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brightnessLabel: {
    ...fonts.sansSemiBold,
    fontSize: 14,
  },
  brightnessVal: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
});

