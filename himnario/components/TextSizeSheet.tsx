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
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';

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
  const insets = useSafeAreaInsets();

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const [inputText, setInputText] = useState(String(currentPx));
  const lastHapticPx = useRef(currentPx);

  useEffect(() => {
    setInputText(String(currentPx));
  }, [currentPx, visible]);

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

  const isIOS = Platform.OS === 'ios';
  const isDefault = currentPx === BASE_PX;

  const content = (
    <View style={styles.inner}>
      {/* Grabber */}
      <View style={[styles.grabber, { backgroundColor: theme.outlineVariant }]} />

      {/* Top Row: Label, Direct Number Input, Reset */}
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
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {isIOS ? (
          <GlassSurface
            intensity={65}
            style={[
              styles.iosPopover,
              { marginBottom: Math.max(insets.bottom, 22) + 84 },
            ]}
          >
            {content}
          </GlassSurface>
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
            {content}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  iosPopover: {
    marginHorizontal: 16,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  androidSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    elevation: 16,
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
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 14,
    minWidth: 26,
    textAlign: 'right',
    padding: 0,
  },
  pxUnit: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 12,
    opacity: 0.7,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetText: {
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: fonts.regular,
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
});

