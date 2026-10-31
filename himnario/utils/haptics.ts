import { Platform } from 'react-native';
import * as NativeHaptics from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

// Android uses visual touch feedback. Preserve existing iOS haptics.
export const impactAsync = (style?: NativeHaptics.ImpactFeedbackStyle) =>
  Platform.OS === 'ios' ? NativeHaptics.impactAsync(style) : Promise.resolve();
export const notificationAsync = (type?: NativeHaptics.NotificationFeedbackType) =>
  Platform.OS === 'ios' ? NativeHaptics.notificationAsync(type) : Promise.resolve();
export const selectionAsync = () =>
  Platform.OS === 'ios' ? NativeHaptics.selectionAsync() : Promise.resolve();
