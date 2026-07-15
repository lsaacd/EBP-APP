/**
 * PageShadow — Dynamic floating shadow that tracks the page fold edge.
 * Opacity peaks mid-swipe and fades at rest and completion.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface PageShadowProps {
  /** Normalized drag progress: -1 (swiped fully left) to 1 (swiped fully right) */
  progress: SharedValue<number>;
  /** Screen width — used to position the shadow */
  width: number;
}

export function PageShadow({ progress, width }: PageShadowProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Shadow position follows the page fold edge
    const translateX = interpolate(
      progress.value,
      [-1, 0, 1],
      [-width * 0.5, 0, width * 0.5],
      Extrapolation.CLAMP,
    );

    // Peak shadow at 50% drag, fade at rest and completion
    const opacity = interpolate(
      Math.abs(progress.value),
      [0, 0.5, 1],
      [0, 0.4, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.shadowContainer, animatedStyle]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 5,
  },
});
