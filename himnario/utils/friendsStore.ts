/**
 * Friends ("Hermanos") — the signed-in person's friend lists, shared between
 * the account sheet's badge, the friends page and the profile card so a change
 * made in one shows in the others.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunityApi } from './communityApi';
import {
  EMPTY_FRIEND_LISTS,
  parseFriendLists,
  parseFriendStatus,
  type FriendLists,
  type FriendStatus,
} from './friends';

let cache: { userId: string; lists: FriendLists } | null = null;
const listeners = new Set<() => void>();
const publish = (next: typeof cache) => {
  cache = next;
  for (const listener of listeners) listener();
};

export function useFriends() {
  const { user } = useAuth();
  const api = useCommunityApi();
  const userId = user?.id ?? null;
  const read = () => (cache && cache.userId === userId ? cache.lists : EMPTY_FRIEND_LISTS);
  const [lists, setLists] = useState<FriendLists>(read);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listener = () => setLists(cache && cache.userId === userId ? cache.lists : EMPTY_FRIEND_LISTS);
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
      publish({ userId, lists: parseFriendLists(await api('/friends')) });
    } catch {
      // A server without this feature yet, or no connection: keep what we have.
    } finally {
      setLoading(false);
    }
  }, [api, userId]);

  /** Ask (or accept, if they already asked). Returns the new status. */
  const request = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>('/friends/requests', 'POST', { userId: otherId });
      void refresh();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, refresh],
  );

  const accept = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>(`/friends/requests/${otherId}/accept`, 'POST', {});
      void refresh();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, refresh],
  );

  /** Decline, cancel or unfriend. */
  const remove = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>(`/friends/${otherId}`, 'DELETE');
      void refresh();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, refresh],
  );

  return { lists, loading, refresh, request, accept, remove };
}
