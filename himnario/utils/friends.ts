/**
 * Friends ("Hermanos") — pure helpers shared by the profile card and the
 * friends list. No React or network here, so they can be tested directly.
 * See guides/FRIENDS-PLAN.md.
 */

/** What the signed-in person is to someone else. `null` for a guest. */
export type FriendStatus = 'none' | 'self' | 'outgoing' | 'incoming' | 'friends';

export type FriendProfile = {
  id: string;
  name: string;
  initials: string;
  ministry: string | null;
  choir: string | null;
  badgeVerified: boolean;
  /** "2026-11" — month and year the account was created. */
  memberSince: string | null;
  churchId: string | null;
  churchName: string | null;
  location: string | null;
};

export type FriendLists = {
  friends: FriendProfile[];
  incoming: FriendProfile[];
  outgoing: FriendProfile[];
};

export const EMPTY_FRIEND_LISTS: FriendLists = { friends: [], incoming: [], outgoing: [] };

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-11" → "Miembro desde noviembre de 2026" / "Member since November 2026". */
export function memberSinceLabel(value: string | null | undefined, spanish: boolean): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) return '';
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return '';
  return spanish
    ? `Miembro desde ${MONTHS_ES[month]} de ${match[1]}`
    : `Member since ${MONTHS_EN[month]} ${match[1]}`;
}

/** Accepts only the statuses this app understands; anything else reads as unknown. */
export function parseFriendStatus(value: unknown): FriendStatus | null {
  return value === 'none' || value === 'self' || value === 'outgoing' || value === 'incoming' || value === 'friends'
    ? value
    : null;
}

/** Reads the `/friends` response defensively. */
export function parseFriendLists(payload: unknown): FriendLists {
  const list = (value: unknown): FriendProfile[] =>
    Array.isArray(value)
      ? value
          .filter((row) => row && typeof row.id === 'string' && typeof row.name === 'string')
          .map((row) => ({
            id: row.id,
            name: row.name,
            initials: typeof row.initials === 'string' ? row.initials : '',
            ministry: typeof row.ministry === 'string' ? row.ministry : null,
            choir: typeof row.choir === 'string' ? row.choir : null,
            badgeVerified: row.badgeVerified === true,
            memberSince: typeof row.memberSince === 'string' ? row.memberSince : null,
            churchId: typeof row.churchId === 'string' ? row.churchId : null,
            churchName: typeof row.churchName === 'string' ? row.churchName : null,
            location: typeof row.location === 'string' ? row.location : null,
          }))
      : [];
  const data = (payload ?? {}) as Record<string, unknown>;
  return {
    friends: list(data.friends),
    incoming: list(data.incoming),
    outgoing: list(data.outgoing),
  };
}

// ── Phase 2: a friend's favourite hymns ─────────────────────────────────────

export type FriendFavorites = {
  /** False when the friend has turned sharing off. */
  shared: boolean;
  favorites: string[];
};

export function parseFriendFavorites(payload: unknown): FriendFavorites {
  const data = (payload ?? {}) as Record<string, unknown>;
  const favorites = Array.isArray(data.favorites)
    ? data.favorites
        .filter((id) => typeof id === 'string' || typeof id === 'number')
        .map(String)
        .filter((id) => id.length > 0 && id.length <= 12)
    : [];
  return { shared: data.shared !== false, favorites: data.shared === false ? [] : favorites };
}

// ── Phase 4: people from the same church ────────────────────────────────────

export type FriendSuggestions = {
  users: FriendProfile[];
  /** False when the signed-in person has not linked a verified church. */
  hasChurch: boolean;
};

export const EMPTY_SUGGESTIONS: FriendSuggestions = { users: [], hasChurch: true };

export function parseSuggestions(payload: unknown): FriendSuggestions {
  const data = (payload ?? {}) as Record<string, unknown>;
  return {
    users: parseFriendLists({ friends: data.users }).friends,
    hasChurch: data.hasChurch !== false,
  };
}

// ── Phase 3: playlists shared between friends ───────────────────────────────

export type SharedPlaylist = {
  id: string;
  fromUserId: string;
  fromName: string;
  fromInitials: string;
  name: string;
  hymnIds: string[];
  createdAt: number;
  seen: boolean;
};

export function parseSharedPlaylists(payload: unknown): SharedPlaylist[] {
  const data = (payload ?? {}) as Record<string, unknown>;
  if (!Array.isArray(data.playlists)) return [];
  const out: SharedPlaylist[] = [];
  for (const row of data.playlists) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    if (
      typeof item.id !== 'string' ||
      typeof item.fromUserId !== 'string' ||
      typeof item.fromName !== 'string' ||
      typeof item.name !== 'string'
    ) {
      continue;
    }
    const hymnIds = Array.isArray(item.hymnIds)
      ? item.hymnIds
          .filter((id) => typeof id === 'string' || typeof id === 'number')
          .map((id) => String(id).trim())
          .filter((id) => id.length > 0 && id.length <= 12)
          .slice(0, 200)
      : [];
    out.push({
      id: item.id,
      fromUserId: item.fromUserId,
      fromName: item.fromName,
      fromInitials: typeof item.fromInitials === 'string' ? item.fromInitials : '',
      name: item.name,
      hymnIds,
      createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : 0,
      seen: item.seen === true,
    });
  }
  return out;
}

/** Total badge count for the "Hermanos" row: pending requests + unseen shared playlists. */
export function friendsBadgeCount(
  lists: FriendLists,
  sharedPlaylists: SharedPlaylist[],
): number {
  const unseenPlaylists = sharedPlaylists.reduce((acc, item) => acc + (item.seen ? 0 : 1), 0);
  return lists.incoming.length + unseenPlaylists;
}
