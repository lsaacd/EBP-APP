/**
 * sanctuaryBrightness — Session-scoped screen brightness manager for the Hymn Reader.
 *
 * Allows readers in dimly lit sanctuaries or evening services to dim/brighten the
 * screen right from the "Texto" sheet, while remembering their previous brightness
 * and automatically restoring it when leaving the reader or backgrounding the app.
 */
import { Platform } from 'react-native';
import * as Brightness from 'expo-brightness';

const MIN_BRIGHTNESS = 0.08;
const MAX_BRIGHTNESS = 1.0;

let savedSystemBrightness: number | null = null;
let sessionOverrideValue: number | null = null;

function clampBrightness(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, value));
}

export async function isBrightnessSupported(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Brightness.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function readCurrentBrightness(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const available = await Brightness.isAvailableAsync();
    if (!available) return null;
    if (sessionOverrideValue !== null) return sessionOverrideValue;
    const current = await Brightness.getBrightnessAsync();
    if (!Number.isFinite(current) || current < 0) return 0.5;
    return clampBrightness(current);
  } catch {
    return null;
  }
}

export function hasSanctuaryBrightnessOverride(): boolean {
  return sessionOverrideValue !== null;
}

export async function setSanctuaryBrightness(nextValue: number): Promise<number> {
  const clamped = clampBrightness(nextValue);
  if (Platform.OS === 'web') return clamped;
  try {
    const available = await Brightness.isAvailableAsync();
    if (!available) return clamped;
    if (savedSystemBrightness === null) {
      const baseline = await Brightness.getBrightnessAsync().catch(() => null);
      if (typeof baseline === 'number' && Number.isFinite(baseline) && baseline >= 0) {
        savedSystemBrightness = Math.min(1, Math.max(0.05, baseline));
      }
    }
    sessionOverrideValue = clamped;
    await Brightness.setBrightnessAsync(clamped);
  } catch {
    // Ignore native permission/simulator errors gracefully
  }
  return clamped;
}

export async function restoreSanctuaryBrightness(): Promise<number | null> {
  if (sessionOverrideValue === null && savedSystemBrightness === null) return null;
  const target = savedSystemBrightness;
  sessionOverrideValue = null;
  savedSystemBrightness = null;

  if (Platform.OS === 'web') return target;
  try {
    if (Platform.OS === 'android') {
      await Brightness.restoreSystemBrightnessAsync();
      return await Brightness.getBrightnessAsync().catch(() => target);
    }
    if (target !== null) {
      await Brightness.setBrightnessAsync(target);
      return target;
    }
  } catch {
    // Ignore restore errors on unsupported environments
  }
  return target;
}
