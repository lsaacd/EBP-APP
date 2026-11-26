/**
 * Safe runtime loader for `@expo/ui/swift-ui` and `expo-glass-effect` on iOS.
 *
 * Returns `null` on Android, Web, Node test harnesses, or older iOS native binaries
 * that do not link the `ExpoUI` native module, preventing bundler/runtime crashes.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export type ExpoSwiftUIBundle = {
  ui: typeof import('@expo/ui/swift-ui');
  modifiers: typeof import('@expo/ui/swift-ui/modifiers');
};

let cachedChecked = false;
let cachedBundle: ExpoSwiftUIBundle | null = null;
let cachedGlassChecked = false;
let cachedGlassAvailable = false;

export function getExpoSwiftUI(): ExpoSwiftUIBundle | null {
  if (Platform.OS !== 'ios') return null;
  if (cachedChecked) return cachedBundle;
  cachedChecked = true;
  try {
    const mod = requireOptionalNativeModule('ExpoUI');
    if (mod) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ui = require('@expo/ui/swift-ui');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modifiers = require('@expo/ui/swift-ui/modifiers');
      if (ui?.Host && ui?.Picker && ui?.useNativeState && modifiers?.pickerStyle) {
        cachedBundle = { ui, modifiers };
        return cachedBundle;
      }
    }
  } catch {
    cachedBundle = null;
  }
  return null;
}

export function isIOSLiquidGlassAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (cachedGlassChecked) return cachedGlassAvailable;
  cachedGlassChecked = true;
  try {
    const mod = requireOptionalNativeModule<{
      isLiquidGlassAvailable?: boolean;
      isGlassEffectAPIAvailable?: boolean;
    }>('ExpoGlassEffect');
    cachedGlassAvailable =
      mod?.isLiquidGlassAvailable === true && mod?.isGlassEffectAPIAvailable === true;
  } catch {
    cachedGlassAvailable = false;
  }
  return cachedGlassAvailable;
}
