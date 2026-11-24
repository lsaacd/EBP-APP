/**
 * GlassSurface — Cross-platform native surface primitive:
 * - iOS 26+: Apple Liquid Glass via `expo-glass-effect` (`GlassView`) when
 *   `isLiquidGlassAvailable()` is true.
 * - Older iOS: Translucent `BlurView` (`expo-blur`) with a Sacred Ink wash.
 * - Android / Web: Material 3 tonal surface without heavy blur.
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { NavigationContext } from 'expo-router/react-navigation';
import { BlurView } from 'expo-blur';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useTheme } from '../theme/ThemeContext';

let cachedLiquidGlassAvailable: boolean | null = null;
let CachedGlassView: React.ComponentType<any> | null = null;

function checkLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (cachedLiquidGlassAvailable !== null) return cachedLiquidGlassAvailable;
  try {
    const mod = requireOptionalNativeModule<{
      isLiquidGlassAvailable?: boolean;
      isGlassEffectAPIAvailable?: boolean;
    }>('ExpoGlassEffect');
    if (mod?.isLiquidGlassAvailable === true && mod.isGlassEffectAPIAvailable === true) {
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
  /** Use a predictable frosted backing in modals and floating players. */
  stableBackdrop?: boolean;
  /** Optional counter to force a fresh native GlassView mount after scroll/visibility changes */
  refreshKey?: number;
}

export default function GlassSurface({
  children,
  style,
  intensity = 48,
  glassEffectStyle = 'regular',
  isInteractive = false,
  tonalColor,
  forceDark,
  stableBackdrop = false,
  refreshKey = 0,
}: GlassSurfaceProps) {
  const { theme, isDarkMode } = useTheme();
  const dark = forceDark ?? isDarkMode;
  const navigation = useContext(NavigationContext);
  const wasBlurredRef = useRef(false);
  const [glassKey, setGlassKey] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios' || stableBackdrop || !checkLiquidGlass()) return;

    const unsubBlur = navigation?.addListener('blur', () => {
      wasBlurredRef.current = true;
    });
    const unsubFocus = navigation?.addListener('focus', () => {
      if (wasBlurredRef.current) {
        wasBlurredRef.current = false;
        setGlassKey((k) => k + 1);
      }
    });
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setGlassKey((k) => k + 1);
      }
    });

    return () => {
      unsubBlur?.();
      unsubFocus?.();
      appStateSub.remove();
    };
  }, [navigation, stableBackdrop]);

  if (Platform.OS === 'ios') {
    const useLiquid = checkLiquidGlass();
    const borderColor = dark ? 'rgba(255,255,255,0.13)' : 'rgba(110,22,25,0.10)';
    const washColor = dark ? 'rgba(20,20,20,0.62)' : 'rgba(252,249,242,0.74)';

    if (useLiquid && CachedGlassView && !stableBackdrop) {
      const GlassViewComp = CachedGlassView;
      return (
        <GlassViewComp
          key={`glass-${glassKey}-${refreshKey}-${dark ? 'd' : 'l'}`}
          glassEffectStyle={glassEffectStyle}
          colorScheme={dark ? 'dark' : 'light'}
          isInteractive={isInteractive}
          style={[!isInteractive && styles.iosContainer, !isInteractive && { borderColor }, style]}
        >
          {children}
        </GlassViewComp>
      );
    }

    return (
      <View style={[styles.iosContainer, { borderColor }, style]}>
        <BlurView
          intensity={intensity}
          tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: stableBackdrop ? (dark ? 'rgba(24,24,24,0.94)' : 'rgba(252,249,242,0.96)') : washColor }]} />
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

