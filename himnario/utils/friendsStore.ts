/**
 * Friends ("Hermanos") — the signed-in person's friend lists and church
 * suggestions, shared between the account sheet's badge, the friends page and
 * the profile card so a change made in one shows in the others.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunityApi } from './communityApi';
import {
  EMPTY_FRIEND_LISTS,
  EMPTY_SUGGESTIONS,
  parseFriendFavorites,
  parseFriendLists,
  parseFriendStatus,
  parseSuggestions,
  type FriendFavorites,
  type FriendLists,
  type FriendStatus,
  type FriendSuggestions,
} from './friends';

type Cache = { userId: string; lists: FriendLists; suggestions: FriendSuggestions };
let cache: Cache | null = null;
const listeners = new Set<() => void>();
const publish = (next: Cache | null) => {
  cache = next;
  for (const listener of listeners) listener();
};

export function useFriends() {
  const { user } = useAuth();
  const api = useCommunityApi();
  const userId = user?.id ?? null;
  const mine = () => (cache && cache.userId === userId ? cache : null);
  const [lists, setLists] = useState<FriendLists>(() => mine()?.lists ?? EMPTY_FRIEND_LISTS);
  const [suggestions, setSuggestions] = useState<FriendSuggestions>(
    () => mine()?.suggestions ?? EMPTY_SUGGESTIONS,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listener = () => {
      const current = cache && cache.userId === userId ? cache : null;
      setLists(current?.lists ?? EMPTY_FRIEND_LISTS);
      setSuggestions(current?.suggestions ?? EMPTY_SUGGESTIONS);
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
      const lists = parseFriendLists(await api('/friends'));
      publish({
        userId,
        lists,
        suggestions: cache && cache.userId === userId ? cache.suggestions : EMPTY_SUGGESTIONS,
      });
    } catch {
      // A server without this feature yet, or no connection: keep what we have.
    } finally {
      setLoading(false);
    }
  }, [api, userId]);

  /** People from the same linked church. Only the friends page asks for this. */
  const refreshSuggestions = useCallback(async () => {
    if (!userId) return;
    try {
      const next = parseSuggestions(await api('/friends/suggestions'));
      publish({
        userId,
        lists: cache && cache.userId === userId ? cache.lists : EMPTY_FRIEND_LISTS,
        suggestions: next,
      });
    } catch {
      // Same as above: an older server simply has no suggestions.
    }
  }, [api, userId]);

  const after = useCallback(() => {
    void refresh();
    void refreshSuggestions();
  }, [refresh, refreshSuggestions]);

  /** Ask (or accept, if they already asked). Returns the new status. */
  const request = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>('/friends/requests', 'POST', { userId: otherId });
      after();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, after],
  );

  const accept = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>(`/friends/requests/${otherId}/accept`, 'POST', {});
      after();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, after],
  );

  /** Decline, cancel or unfriend. */
  const remove = useCallback(
    async (otherId: string): Promise<FriendStatus | null> => {
      const result = await api<{ friendStatus?: unknown }>(`/friends/${otherId}`, 'DELETE');
      after();
      return parseFriendStatus(result?.friendStatus);
    },
    [api, after],
  );

  /** A friend's favourite hymns. Rejects if they are not an accepted friend. */
  const fetchFavorites = useCallback(
    async (otherId: string): Promise<FriendFavorites> =>
      parseFriendFavorites(await api(`/friends/${otherId}/favorites`)),
    [api],
  );

  return { lists, suggestions, loading, refresh, refreshSuggestions, request, accept, remove, fetchFavorites };
}
