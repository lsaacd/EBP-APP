/**
 * LiquidGlassSegmented — Genuine iOS 26 Liquid Glass sliding segmented control.
 *
 * - On iOS 26+: Renders an interactive `AnimatedGlassView` (`UIGlassEffect`) pill thumb
 *   inside a recessed translucent capsule track (no `overflow: 'hidden'` clipping the
 *   native specular glass rim), supporting both tap and horizontal finger-drag with
 *   subtle liquid lift (`scale: 1.04`) and haptic ticks.
 * - On older iOS: Frosted `BlurView` capsule thumb with luminous border.
 * - On Android / Web: Elevated Material 3 tonal pill thumb.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';

export interface LiquidSegmentItem<K extends string = string> {
  key: K;
  label: string;
  count?: number | null;
  highlightBadge?: boolean;
}

let cachedAvailable: boolean | null = null;
let CachedAnimatedGlassView: React.ComponentType<any> | null = null;

function getAnimatedGlassView(): React.ComponentType<any> | null {
  if (Platform.OS !== 'ios') return null;
  if (cachedAvailable !== null) return CachedAnimatedGlassView;
  try {
    const mod = requireOptionalNativeModule<{
      isLiquidGlassAvailable?: boolean;
      isGlassEffectAPIAvailable?: boolean;
    }>('ExpoGlassEffect');
    if (mod?.isLiquidGlassAvailable === true && mod.isGlassEffectAPIAvailable === true) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const glassPkg = require('expo-glass-effect');
      if (glassPkg?.GlassView) {
        CachedAnimatedGlassView = Animated.createAnimatedComponent(glassPkg.GlassView);
        cachedAvailable = true;
        return CachedAnimatedGlassView;
      }
    }
  } catch {
    // Fallback below
  }
  cachedAvailable = false;
  return null;
}

const THUMB_SPRING = {
  damping: 24,
  stiffness: 320,
  mass: 0.72,
};

const SCALE_SPRING = {
  damping: 20,
  stiffness: 360,
  mass: 0.6,
};

const PAD = 4;

export default function LiquidGlassSegmented<K extends string>({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: readonly LiquidSegmentItem<K>[];
  value: K;
  onChange: (next: K) => void;
  compact?: boolean;
}) {
  const { theme, isDarkMode } = useTheme();
  const isIOS = Platform.OS === 'ios';
  const count = Math.max(1, items.length);
  const activeIdx = Math.max(
    0,
    items.findIndex((it) => it.key === value),
  );

  const [trackWidth, setTrackWidth] = useState(0);
  const pos = useSharedValue(activeIdx);
  const dragStartPos = useSharedValue(activeIdx);
  const lastHapticIdx = useSharedValue(activeIdx);
  const thumbScale = useSharedValue(1);

  useEffect(() => {
    pos.value = withSpring(activeIdx, THUMB_SPRING);
    lastHapticIdx.value = activeIdx;
  }, [activeIdx, pos, lastHapticIdx]);

  const emitChangeByIndex = useCallback(
    (idx: number) => {
      const target = items[idx];
      if (target && target.key !== value) {
        Haptics.selectionAsync();
        onChange(target.key);
      }
    },
    [items, onChange, value],
  );

  const fireTick = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const innerSpan = Math.max(0, trackWidth - PAD * 2);
  const segWidth = count > 0 ? innerSpan / count : 0;

  const pan = Gesture.Pan()
    .enabled(segWidth > 0 && count > 1)
    .activeOffsetX([-8, 8])
    .failOffsetY([-18, 18])
    .onStart(() => {
      cancelAnimation(pos);
      dragStartPos.value = pos.value;
      thumbScale.value = withSpring(1.045, SCALE_SPRING);
    })
    .onUpdate((e) => {
      if (segWidth <= 0) return;
      const next = Math.max(0, Math.min(count - 1, dragStartPos.value + e.translationX / segWidth));
      pos.value = next;
      const rounded = Math.round(next);
      if (rounded !== lastHapticIdx.value) {
        lastHapticIdx.value = rounded;
        runOnJS(fireTick)();
      }
    })
    .onEnd((e) => {
      const projected = pos.value + (segWidth > 0 ? (e.velocityX * 0.08) / segWidth : 0);
      const snapped = Math.max(0, Math.min(count - 1, Math.round(projected)));
      pos.value = withSpring(snapped, THUMB_SPRING);
      thumbScale.value = withSpring(1, SCALE_SPRING);
      runOnJS(emitChangeByIndex)(snapped);
    })
    .onFinalize(() => {
      thumbScale.value = withSpring(1, SCALE_SPRING);
    });

  const thumbAnimStyle = useAnimatedStyle(() => ({
    width: segWidth,
    opacity: segWidth > 0 ? 1 : 0,
    transform: [{ translateX: pos.value * segWidth }, { scale: thumbScale.value }],
  }));

  const AnimatedGlass = getAnimatedGlassView();
  const scheme = isDarkMode ? 'dark' : 'light';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.62)' : theme.onSurfaceVariant;

  const trackBg = isDarkMode
    ? 'rgba(255,255,255,0.08)'
    : isIOS
      ? 'rgba(110,22,25,0.065)'
      : theme.surfaceVariants.containerLow;
  const trackBorder = isDarkMode ? 'rgba(255,255,255,0.13)' : 'rgba(110,22,25,0.10)';

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={[
          styles.track,
          compact && styles.trackCompact,
          {
            backgroundColor: trackBg,
            borderColor: trackBorder,
          },
        ]}
      >
        {/* Sliding Liquid Glass Thumb */}
        {AnimatedGlass ? (
          <AnimatedGlass
            pointerEvents="none"
            glassEffectStyle="regular"
            colorScheme={scheme}
            isInteractive
            style={[styles.thumb, thumbAnimStyle]}
          />
        ) : isIOS ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              styles.fallbackClip,
              {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.9)',
                borderWidth: StyleSheet.hairlineWidth,
              },
              thumbAnimStyle,
            ]}
          >
            <BlurView
              intensity={65}
              tint={isDarkMode ? 'light' : 'default'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.16)'
                    : 'rgba(255,255,255,0.88)',
                },
              ]}
            />
          </Animated.View>
        ) : (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                backgroundColor: isDarkMode ? '#38383C' : '#FFFFFF',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(110,22,25,0.10)',
                elevation: 2,
              },
              thumbAnimStyle,
            ]}
          />
        )}

        {/* Segment Pressables */}
        {items.map((item, idx) => {
          const selected = idx === activeIdx;
          const showCount = item.count !== undefined && item.count !== null && item.count > 0;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPressIn={() => {
                if (selected) {
                  thumbScale.value = withSpring(1.035, SCALE_SPRING);
                }
              }}
              onPressOut={() => {
                thumbScale.value = withSpring(1, SCALE_SPRING);
              }}
              onPress={() => {
                if (item.key === value) return;
                Haptics.selectionAsync();
                onChange(item.key);
              }}
              style={[styles.tab, compact && styles.tabCompact]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  { color: selected ? theme.primary : mutedText },
                  selected && fonts.sansBold,
                ]}
              >
                {item.label}
              </Text>
              {showCount ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: item.highlightBadge
                        ? theme.primary
                        : selected
                          ? isDarkMode
                            ? 'rgba(255,255,255,0.20)'
                            : theme.primary + '16'
                          : isDarkMode
                            ? 'rgba(255,255,255,0.10)'
                            : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: item.highlightBadge
                          ? theme.onPrimary
                          : selected
                            ? theme.primary
                            : mutedText,
                      },
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAD,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  trackCompact: {
    padding: PAD,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 999,
  },
  fallbackClip: {
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  tabCompact: {
    minHeight: 38,
    paddingHorizontal: 6,
    gap: 5,
  },
  label: {
    ...fonts.sansSemiBold,
    fontSize: 14.5,
    flexShrink: 1,
  },
  labelCompact: {
    fontSize: 13.5,
  },
  badge: {
    minWidth: 21,
    height: 19,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...fonts.sansBold,
    fontSize: 11,
  },
});
