/**
 * Shared in-app notification inbox & Expo push-token sync store.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCommunityApi } from './communityApi';
import { parseNotificationsPayload, type AppNotification } from './notifications';
import {
  clearStoredPushToken,
  getStoredPushToken,
  registerForExpoPushToken,
  type PushPermissionState,
} from './pushNotifications';

type Cache = {
  userId: string;
  notifications: AppNotification[];
  unreadCount: number;
};

let cache: Cache | null = null;
let lastFetchedAt = 0;
let lastFetchedUserId: string | null = null;
const listeners = new Set<() => void>();
const publish = (next: Cache | null) => {
  cache = next;
  for (const listener of listeners) listener();
};

export function useNotifications() {
  const { user } = useAuth();
  const api = useCommunityApi();
  const userId = user?.id ?? null;
  const mine = () => (cache && cache.userId === userId ? cache : null);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => mine()?.notifications ?? [],
  );
  const [unreadCount, setUnreadCount] = useState<number>(() => mine()?.unreadCount ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listener = () => {
      const current = cache && cache.userId === userId ? cache : null;
      setNotifications(current?.notifications ?? []);
      setUnreadCount(current?.unreadCount ?? 0);
    };
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      publish(null);
      return;
    }
    setLoading(true);
    try {
      const parsed = parseNotificationsPayload(await api('/notifications'));
      lastFetchedAt = Date.now();
      lastFetchedUserId = userId;
      publish({
        userId,
        notifications: parsed.notifications,
        unreadCount: parsed.unreadCount,
      });
    } catch {
      // Older server or offline: keep cached state quietly.
    } finally {
      setLoading(false);
    }
  }, [api, userId]);

  const refreshIfStale = useCallback(
    async (maxAgeMs = 15000) => {
      if (!userId) {
        publish(null);
        return;
      }
      if (lastFetchedUserId === userId && Date.now() - lastFetchedAt < maxAgeMs) return;
      lastFetchedAt = Date.now();
      lastFetchedUserId = userId;
      await refresh();
    },
    [refresh, userId],
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      const current = cache && cache.userId === userId ? cache : null;
      if (current) {
        const nextList = current.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        );
        const nextUnread = nextList.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
        publish({ ...current, notifications: nextList, unreadCount: nextUnread });
      }
      try {
        await api('/notifications/read', 'POST', { id });
      } catch {}
    },
    [api, userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const current = cache && cache.userId === userId ? cache : null;
    if (current) {
      publish({
        ...current,
        notifications: current.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      });
    }
    try {
      await api('/notifications/read', 'POST', { all: true });
    } catch {}
  }, [api, userId]);

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      const before = cache && cache.userId === userId ? cache : null;
      if (before) {
        const nextList = before.notifications.filter((n) => n.id !== id);
        const nextUnread = nextList.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
        publish({ ...before, notifications: nextList, unreadCount: nextUnread });
      }
      try {
        await api(`/notifications/${id}`, 'DELETE');
      } catch (e) {
        if (before && cache?.userId === userId) publish(before);
        throw e;
      }
    },
    [api, userId],
  );

  /** Registers/refreshes this device's Expo Push Token on the backend. */
  const syncPushToken = useCallback(
    async (
      language: 'es' | 'en',
      askPermission = false,
    ): Promise<PushPermissionState> => {
      if (!userId || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
        return 'unavailable';
      }
      const { token, status } = await registerForExpoPushToken(askPermission);
      if (token) {
        try {
          await api('/notifications/push-token', 'POST', {
            token,
            platform: Platform.OS,
            language: language === 'en' ? 'en' : 'es',
          });
        } catch {
          // Will retry on next foreground.
        }
      }
      return status;
    },
    [api, userId],
  );

  const unregisterPushToken = useCallback(async () => {
    const token = await getStoredPushToken();
    await clearStoredPushToken();
    if (token && userId) {
      try {
        await api('/notifications/push-token', 'DELETE', { token });
      } catch {}
    }
  }, [api, userId]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    refreshIfStale,
    markRead,
    markAllRead,
    remove,
    syncPushToken,
    unregisterPushToken,
  };
}
