/**
 * toast — Lightweight wrapper over `sonner-native` for crisp tactile pill notifications.
 *
 * Safe no-op on non-UI/test environments and automatically pairs light haptic feedback.
 */
import { Platform } from 'react-native';
import { toast } from 'sonner-native';
import * as Haptics from './haptics';

export function showSuccessToast(message: string, description?: string) {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
  try {
    toast.success(message, description ? { description } : undefined);
  } catch {
    // Ignore if Toaster is not mounted in an isolated test harness
  }
}

export function showInfoToast(message: string, description?: string) {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync().catch(() => {});
  }
  try {
    toast.info(message, description ? { description } : undefined);
  } catch {
    // Ignore if Toaster is not mounted
  }
}

export function showErrorToast(message: string, description?: string) {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
  try {
    toast.error(message, description ? { description } : undefined);
  } catch {
    // Ignore if Toaster is not mounted
  }
}
