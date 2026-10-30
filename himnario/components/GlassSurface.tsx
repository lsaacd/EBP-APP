/**
 * GlassSurface — Cross-platform native surface primitive:
 * - iOS 26+: Apple Liquid Glass via `expo-glass-effect` (`GlassView`) when
 *   `isLiquidGlassAvailable()` is true.
 * - Older iOS: Translucent `BlurView` (`expo-blur`) with a Sacred Ink wash.
 * - Android / Web: Material 3 tonal surface without heavy blur.
 */
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useTheme } from '../theme/ThemeContext';

let cachedLiquidGlassAvailable: boolean | null = null;
let CachedGlassView: React.ComponentType<any> | null = null;

function checkLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (cachedLiquidGlassAvailable !== null) return cachedLiquidGlassAvailable;
  try {
    const mod = requireOptionalNativeModule<{ isLiquidGlassAvailable?: boolean }>('ExpoGlassEffect');
    if (mod && mod.isLiquidGlassAvailable) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const glassPkg = require('expo-glass-effect');
      CachedGlassView = glassPkg.GlassView ?? null;
      cachedLiquidGlassAvailable = Boolean(CachedGlassView);
    } else {
      cachedLiquidGlassAvailable = false;
    }
  } catch {
    cachedLiquidGlassAvailable = false;
  }
  return cachedLiquidGlassAvailable;
}

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Intensity for BlurView fallback on iOS < 26 (default 48) */
  intensity?: number;
  /** Glass style on iOS 26+ ('regular' | 'clear') */
  glassEffectStyle?: 'regular' | 'clear';
  /** Interactive glass highlight on iOS 26+ */
  isInteractive?: boolean;
  /** Optional explicit background override for Android tonal surface */
  tonalColor?: string;
  /** Force dark appearance (e.g. inside dark projector or full player) */
  forceDark?: boolean;
}

export default function GlassSurface({
  children,
  style,
  intensity = 48,
  glassEffectStyle = 'regular',
  isInteractive = false,
  tonalColor,
  forceDark,
}: GlassSurfaceProps) {
  const { theme, isDarkMode } = useTheme();
  const dark = forceDark ?? isDarkMode;

  if (Platform.OS === 'ios') {
    const useLiquid = checkLiquidGlass();
    const borderColor = dark ? 'rgba(255,255,255,0.13)' : 'rgba(110,22,25,0.10)';
    const washColor = dark ? 'rgba(20,20,20,0.62)' : 'rgba(252,249,242,0.74)';

    if (useLiquid && CachedGlassView) {
      const GlassViewComp = CachedGlassView;
      return (
        <GlassViewComp
          glassEffectStyle={glassEffectStyle}
          colorScheme={dark ? 'dark' : 'light'}
          isInteractive={isInteractive}
          style={[styles.iosContainer, { borderColor }, style]}
        >
          {children}
        </GlassViewComp>
      );
    }

    return (
      <View style={[styles.iosContainer, { borderColor }, style]}>
        <BlurView
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: washColor }]} />
        {children}
      </View>
    );
  }

  // Android & Web: Material 3 tonal surface (no heavy blur)
  const androidBg =
    tonalColor ??
    (dark ? '#1F1F1F' : theme.surfaceVariants.containerLow);
  const androidBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(36,37,31,0.08)';

  return (
    <View
      style={[
        styles.androidContainer,
        { backgroundColor: androidBg, borderColor: androidBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  iosContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  androidContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
