/**
 * AnimatedEqualizer — Smooth Apple Music–style 3-bar live audio level indicator.
 *
 * Animates on the Reanimated UI thread when `playing` is true and rests cleanly
 * when paused, giving active hymn rows crisp live motion without layout thrash.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface AnimatedEqualizerProps {
  playing: boolean;
  color: string;
  size?: number;
}

function EqBar({
  playing,
  color,
  delayMs,
  peakRatio,
  restRatio,
  durationMs,
  height,
  barWidth,
}: {
  playing: boolean;
  color: string;
  delayMs: number;
  peakRatio: number;
  restRatio: number;
  durationMs: number;
  height: number;
  barWidth: number;
}) {
  const progress = useSharedValue(restRatio);

  useEffect(() => {
    if (playing) {
      progress.value = withDelay(
        delayMs,
        withRepeat(
          withSequence(
            withTiming(peakRatio, { duration: durationMs, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.24, { duration: Math.round(durationMs * 0.85), easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(restRatio, { duration: 180 });
    }
    return () => cancelAnimation(progress);
  }, [delayMs, durationMs, peakRatio, playing, progress, restRatio]);

  const barStyle = useAnimatedStyle(() => ({
    height: Math.max(3, Math.round(progress.value * height)),
  }));

  return (
    <Animated.View
      style={[
        {
          width: barWidth,
          borderRadius: barWidth / 2,
          backgroundColor: color,
        },
        barStyle,
      ]}
    />
  );
}

export default function AnimatedEqualizer({
  playing,
  color,
  size = 16,
}: AnimatedEqualizerProps) {
  const barWidth = Math.max(2.5, Math.round(size * 0.19));
  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <EqBar
        playing={playing}
        color={color}
        delayMs={0}
        peakRatio={0.94}
        restRatio={0.45}
        durationMs={380}
        height={size}
        barWidth={barWidth}
      />
      <EqBar
        playing={playing}
        color={color}
        delayMs={110}
        peakRatio={1}
        restRatio={0.72}
        durationMs={310}
        height={size}
        barWidth={barWidth}
      />
      <EqBar
        playing={playing}
        color={color}
        delayMs={60}
        peakRatio={0.86}
        restRatio={0.38}
        durationMs={430}
        height={size}
        barWidth={barWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2.5,
  },
});
