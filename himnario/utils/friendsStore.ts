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
  friendsBadgeCount,
  mergeChurchMembers,
  parseFriendFavorites,
  parseFriendLists,
  parseFriendStatus,
  parseSharedPlaylists,
  parseSuggestions,
  type FriendFavorites,
  type FriendLists,
  type FriendStatus,
  type FriendSuggestions,
  type SharedPlaylist,
} from './friends';

type Cache = {
  userId: string;
  lists: FriendLists;
  suggestions: FriendSuggestions;
  sharedPlaylists: SharedPlaylist[];
};
let cache: Cache | null = null;
let lastFetchedAt = 0;
let lastFetchedUserId: string | null = null;
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
  const [sharedPlaylists, setSharedPlaylists] = useState<SharedPlaylist[]>(
    () => mine()?.sharedPlaylists ?? [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listener = () => {
      const current = cache && cache.userId === userId ? cache : null;
      setLists(current?.lists ?? EMPTY_FRIEND_LISTS);
      setSuggestions(current?.suggestions ?? EMPTY_SUGGESTIONS);
      setSharedPlaylists(current?.sharedPlaylists ?? []);
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
      const [listsResult, sharedResult] = await Promise.allSettled([
        api('/friends'),
        api('/playlists/shared'),
      ]);
      const current = cache && cache.userId === userId ? cache : null;
      const nextLists =
        listsResult.status === 'fulfilled'
          ? parseFriendLists(listsResult.value)
          : current?.lists ?? EMPTY_FRIEND_LISTS;
      const nextShared =
        sharedResult.status === 'fulfilled'
          ? parseSharedPlaylists(sharedResult.value)
          : current?.sharedPlaylists ?? [];
      if (listsResult.status === 'fulfilled' || sharedResult.status === 'fulfilled') {
        lastFetchedAt = Date.now();
        lastFetchedUserId = userId;
        publish({
          userId,
          lists: nextLists,
          suggestions: current?.suggestions ?? EMPTY_SUGGESTIONS,
          sharedPlaylists: nextShared,
        });
      }
    } catch {
      // A server without this feature yet, or no connection: keep what we have.
    } finally {
      setLoading(false);
    }
  }, [api, userId]);

  /** Lightweight refresh for foreground/header badge without duplicating across tabs. */
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

  /** People from the same linked church. Only the friends page asks for this. */
  const refreshSuggestions = useCallback(async (offset = 0) => {
    if (!userId) return;
    try {
      const next = parseSuggestions(await api(`/friends/suggestions?offset=${offset}`));
      const current = cache && cache.userId === userId ? cache : null;
      if (offset) {
        if (!current?.suggestions.churchId ||
            current.suggestions.churchId !== next.churchId ||
            current.suggestions.churchMembersNextOffset !== offset) return;
        next.churchMembers = mergeChurchMembers(current.suggestions.churchMembers, next.churchMembers);
      }
      publish({
        userId,
        lists: current?.lists ?? EMPTY_FRIEND_LISTS,
        suggestions: next,
        sharedPlaylists: current?.sharedPlaylists ?? [],
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

  /** Send a copy of a playlist to an accepted friend. */
  const sendPlaylist = useCallback(
    async (otherId: string, name: string, hymnIds: string[]): Promise<void> => {
      await api(`/friends/${otherId}/playlists`, 'POST', {
        name: name.trim().slice(0, 60),
        hymnIds: hymnIds.slice(0, 200),
      });
    },
    [api],
  );

  /** Mark a received shared playlist as seen and clear its badge contribution. */
  const markSharedPlaylistSeen = useCallback(
    async (sharedId: string): Promise<void> => {
      if (!userId) return;
      const current = cache && cache.userId === userId ? cache : null;
      if (current) {
        publish({
          ...current,
          sharedPlaylists: current.sharedPlaylists.map((item) =>
            item.id === sharedId ? { ...item, seen: true } : item,
          ),
        });
      }
      try {
        await api(`/playlists/shared/${sharedId}/seen`, 'POST', {});
      } catch {
        // Non-fatal; will reconcile on next refresh.
      }
    },
    [api, userId],
  );

  /** Delete a received shared playlist from the inbox. */
  const deleteSharedPlaylist = useCallback(
    async (sharedId: string): Promise<void> => {
      if (!userId) return;
      const before = cache && cache.userId === userId ? cache : null;
      if (before) {
        publish({
          ...before,
          sharedPlaylists: before.sharedPlaylists.filter((item) => item.id !== sharedId),
        });
      }
      try {
        await api(`/playlists/shared/${sharedId}`, 'DELETE');
      } catch (e) {
        if (before && cache?.userId === userId) publish(before);
        throw e;
      }
    },
    [api, userId],
  );

  const badgeCount = friendsBadgeCount(lists, sharedPlaylists);

  return {
    lists,
    suggestions,
    sharedPlaylists,
    badgeCount,
    loading,
    refresh,
    refreshIfStale,
    refreshSuggestions,
    request,
    accept,
    remove,
    fetchFavorites,
    sendPlaylist,
    markSharedPlaylistSeen,
    deleteSharedPlaylist,
  };
}
