import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'himnario.auth.session.v2';
const LEGACY_KEY = '@himnario_auth_session';
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Keep migration/write/logout in invocation order, including overlapping native I/O.
let pending: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(operation, operation);
  pending = next.catch(() => {});
  return next;
}

export function readAuthSession(): Promise<string | null> {
  return serialize(async () => {
    const secured = await SecureStore.getItemAsync(KEY, options);
    if (secured) {
      await AsyncStorage.removeItem(LEGACY_KEY);
      return secured;
    }
    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    // Never delete the old session until encrypted persistence succeeds.
    await SecureStore.setItemAsync(KEY, legacy, options);
    await AsyncStorage.removeItem(LEGACY_KEY);
    return legacy;
  });
}

export function writeAuthSession(raw: string): Promise<void> {
  return serialize(async () => {
    await SecureStore.setItemAsync(KEY, raw, options);
    await AsyncStorage.removeItem(LEGACY_KEY);
  });
}

export function clearAuthSession(): Promise<void> {
  return serialize(async () => {
    // Try both stores even when either removal fails. Surface failure to callers.
    const results = await Promise.allSettled([
      SecureStore.deleteItemAsync(KEY, options),
      AsyncStorage.removeItem(LEGACY_KEY),
    ]);
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) throw failed.reason;
  });
}
