/**
 * Native Expo Push Notifications wrapper (Phase 2).
 * Safely guards every native module call so simulators, web, and older
 * binaries degrade gracefully to in-app notifications without ever crashing.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

const PUSH_TOKEN_STORAGE_KEY = '@himnario_expo_push_token_v1';
const FALLBACK_EAS_PROJECT_ID = '74ef3b4c-fe90-4c2c-8521-b52f4b6a5441';

export type PushPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

let handlerConfigured = false;

function loadNotificationsModule(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null;
  try {
    // Check that the native notifications binary is compiled into this build.
    const nativeMod =
      requireOptionalNativeModule('ExpoPushTokenManager') ||
      requireOptionalNativeModule('ExpoNotificationPermissionsModule');
    if (!nativeMod) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

function loadDeviceModule(): typeof import('expo-device') | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device') as typeof import('expo-device');
  } catch {
    return null;
  }
}

export function ensureNotificationHandlerConfigured(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  const Notifications = loadNotificationsModule();
  if (!Notifications) return;
  handlerConfigured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Non-fatal
  }
}

export async function getPushPermissionStatus(): Promise<PushPermissionState> {
  if (Platform.OS === 'web') return 'unavailable';
  const Notifications = loadNotificationsModule();
  const Device = loadDeviceModule();
  if (!Notifications || !Device || !Device.isDevice) return 'unavailable';
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.status === 'granted') return 'granted';
    if (settings.canAskAgain === false || settings.status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

export async function registerForExpoPushToken(askPermission: boolean): Promise<{
  token: string | null;
  status: PushPermissionState;
}> {
  if (Platform.OS === 'web') return { token: null, status: 'unavailable' };
  const Notifications = loadNotificationsModule();
  const Device = loadDeviceModule();
  if (!Notifications || !Device || !Device.isDevice) {
    return { token: null, status: 'unavailable' };
  }
  ensureNotificationHandlerConfigured();
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('community', {
        name: 'Comunidad',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#7B1E26',
      }).catch(() => {});
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    let canAskAgain = existing.canAskAgain;

    if (finalStatus !== 'granted' && askPermission) {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
      canAskAgain = requested.canAskAgain;
    }

    if (finalStatus !== 'granted') {
      return {
        token: null,
        status: canAskAgain === false || finalStatus === 'denied' ? 'denied' : 'undetermined',
      };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      FALLBACK_EAS_PROJECT_ID;
    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = typeof tokenRes?.data === 'string' ? tokenRes.data : null;
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token).catch(() => {});
    }
    return { token, status: 'granted' };
  } catch {
    return { token: null, status: 'unavailable' };
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {}
}

const handledNotificationResponseIds = new Set<string>();

export function subscribeNotificationResponses(
  onData: (data: Record<string, unknown>) => void,
): () => void {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return () => {};
  ensureNotificationHandlerConfigured();

  let active = true;
  const dispatchOnce = (response: any) => {
    if (!active || !response) return;
    const reqId = response.notification?.request?.identifier;
    if (typeof reqId === 'string' && reqId) {
      if (handledNotificationResponseIds.has(reqId)) return;
      handledNotificationResponseIds.add(reqId);
    }
    const data = response.notification?.request?.content?.data;
    if (data && typeof data === 'object') {
      onData(data as Record<string, unknown>);
    }
  };

  // Handle cold launch from a tapped lock-screen notification.
  void Notifications.getLastNotificationResponseAsync()
    .then(dispatchOnce)
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener(dispatchOnce);

  return () => {
    active = false;
    try {
      sub.remove();
    } catch {}
  };
}
