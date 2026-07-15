/**
 * BookSpine — Subtle vertical gradient along the left edge simulating a book spine.
 * Theme-aware: darker shadow in dark mode for realism.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function BookSpine({ isDarkMode }: { isDarkMode: boolean }) {
  const colors: [string, string, string] = isDarkMode
    ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0)']
    : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0)'];

  return (
    <View style={styles.spine} pointerEvents="none">
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 24,
    zIndex: 10,
    opacity: 0.8,
  },
});
