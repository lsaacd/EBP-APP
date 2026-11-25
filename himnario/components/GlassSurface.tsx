/**
 * GlassSurface & GlassGroup — Cross-platform native iOS 26/27 Liquid Glass primitives.
 *
 * - iOS 26+: True Apple Liquid Glass via `expo-glass-effect@58` (`GlassView` / `UIGlassEffect`
 *   and `GlassContainer` / `UIGlassContainerEffect`).
 *   - Automatically strips `overflow: 'hidden'`, synthetic `borderWidth`/`borderColor`, and
 *     opaque `backgroundColor` from `GlassView` styles so Apple's native refractive specular
 *     rim, interactive touch illumination, and jelly press bloom are never clipped.
 *   - Applies `borderCurve: 'continuous'` for native Apple squircle refraction.
 *   - Relies on SDK 58's native `GlassView.swift` lifecycle (`didMoveToWindow` / `willMove(toWindow:)`)
 *     instead of forced React remounts that flash on tab switches.
 * - Older iOS: Translucent `BlurView` (`expo-blur`) with a Sacred Ink wash.
 * - Android / Web: Material 3 tonal surface without heavy blur.
 */
import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useTheme } from '../theme/ThemeContext';

let cachedLiquidGlassAvailable: boolean | null = null;
let CachedGlassView: React.ComponentType<any> | null = null;
let CachedGlassContainer: React.ComponentType<any> | null = null;

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
      CachedGlassContainer = glassPkg.GlassContainer ?? null;
      cachedLiquidGlassAvailable = Boolean(CachedGlassView);
    } else {
      cachedLiquidGlassAvailable = false;
    }
  } catch {
    cachedLiquidGlassAvailable = false;
  }
  return cachedLiquidGlassAvailable;
}

/**
 * Strips properties that interfere with UIKit's `UIGlassEffect` optical rim,
 * interactive press glow, or refraction when rendering a native iOS 26+ `GlassView`.
 */
function sanitizeNativeGlassStyle(style: StyleProp<ViewStyle>): ViewStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const {
    overflow: _overflow,
    borderWidth: _bw,
    borderTopWidth: _btw,
    borderBottomWidth: _bbw,
    borderLeftWidth: _blw,
    borderRightWidth: _brw,
    borderColor: _bc,
    backgroundColor: _bg,
    ...rest
  } = flat;

  return {
    borderCurve: 'continuous',
    ...rest,
  };
}

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Intensity for BlurView fallback on iOS < 26 (default 48) */
  intensity?: number;
  /** Glass style on iOS 26+ ('regular' | 'clear') */
  glassEffectStyle?: 'regular' | 'clear';
  /** Native iOS 26+ translucent tint color for `UIGlassEffect.tintColor` */
  tintColor?: ColorValue;
  /** Interactive glass highlight & tactile jelly bloom on iOS 26+ */
  isInteractive?: boolean;
  /** Optional explicit background override for Android/Web tonal surface */
  tonalColor?: string;
  /** Force dark appearance (e.g. inside dark projector, verse art, or full player) */
  forceDark?: boolean;
  /** Use a predictable frosted backing in sheets and legibility overlays */
  stableBackdrop?: boolean;
  /** Optional counter to force a fresh native GlassView mount if a parent hides via opacity */
  refreshKey?: number;
}

export default function GlassSurface({
  children,
  style,
  intensity = 48,
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  tonalColor,
  forceDark,
  stableBackdrop = false,
  refreshKey = 0,
}: GlassSurfaceProps) {
  const { theme, isDarkMode } = useTheme();
  const dark = forceDark ?? isDarkMode;

  if (Platform.OS === 'ios') {
    const useLiquid = checkLiquidGlass();
    const borderColor = dark ? 'rgba(255,255,255,0.13)' : 'rgba(110,22,25,0.10)';
    const washColor = dark ? 'rgba(20,20,20,0.62)' : 'rgba(252,249,242,0.74)';

    if (useLiquid && CachedGlassView && !stableBackdrop) {
      const GlassViewComp = CachedGlassView;
      const nativeStyle = sanitizeNativeGlassStyle(style);
      return (
        <GlassViewComp
          key={refreshKey > 0 ? `glass-${refreshKey}` : undefined}
          glassEffectStyle={glassEffectStyle}
          tintColor={tintColor}
          colorScheme={dark ? 'dark' : 'light'}
          isInteractive={isInteractive}
          style={nativeStyle}
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
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: stableBackdrop
                ? dark
                  ? 'rgba(24,24,24,0.94)'
                  : 'rgba(252,249,242,0.96)'
                : washColor,
            },
          ]}
        />
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

export interface GlassGroupProps {
  children?: React.ReactNode;
  /** Proximity threshold (pt) at which adjacent GlassSurface children merge with Liquid Glass metaball bridges on iOS 26+ */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * GlassGroup — Native `UIGlassContainerEffect` (`GlassContainer`) on iOS 26+, View fallback elsewhere.
 * Place `<GlassSurface>` controls as direct children so UIKit links their glass refraction & fluid morphing.
 */
export function GlassGroup({ children, spacing = 8, style }: GlassGroupProps) {
  if (Platform.OS === 'ios' && checkLiquidGlass() && CachedGlassContainer) {
    const GlassContainerComp = CachedGlassContainer;
    return (
      <GlassContainerComp spacing={spacing} style={style}>
        {children}
      </GlassContainerComp>
    );
  }

  return <View style={style}>{children}</View>;
}

const styles = StyleSheet.create({
  iosContainer: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  androidContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

