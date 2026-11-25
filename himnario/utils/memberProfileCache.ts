import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseChurchMembers,
  parseFriendStatus,
  type ChurchMemberProfile,
  type FriendStatus,
} from './friends';

export interface CachedMemberProfile {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  ministry: string | null;
  choir: string | null;
  badgeVerified: boolean;
  memberSince: string | null;
  churchId: string | null;
  churchName: string | null;
  location: string | null;
  friendCount: number | null;
  showFriendsList: boolean;
  friendStatus: FriendStatus | null;
  favoritesShared: boolean | null;
  favorites: string[];
  friendsVisible: boolean | null;
  friends: ChurchMemberProfile[];
  cachedAt: number;
}

export interface MemberPreviewSeed {
  id: string;
  name: string;
  initials?: string | null;
  avatarUrl?: string | null;
  ministry?: string | null;
  choir?: string | null;
  badgeVerified?: boolean;
  memberSince?: string | null;
  churchId?: string | null;
  churchName?: string | null;
  location?: string | null;
  friendCount?: number | null;
  friendStatus?: FriendStatus | null;
}

const STORAGE_PREFIX = '@ebp:member-profiles-v1:';
const MAX_CACHED_PROFILES = 60;

const memoryStore = new Map<string, Map<string, CachedMemberProfile>>();
const previewSeeds = new Map<string, MemberPreviewSeed>();

function scopeKey(viewerId: string | null | undefined): string {
  return viewerId ? String(viewerId) : 'guest';
}

function computeFallbackInitials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0] || '—').slice(0, 2).toUpperCase();
}

export function seedMemberPreview(seed: MemberPreviewSeed): void {
  if (!seed?.id) return;
  previewSeeds.set(seed.id, seed);
}

export function getSeededMemberPreview(memberId: string): MemberPreviewSeed | null {
  return previewSeeds.get(memberId) ?? null;
}

export function buildInitialMemberProfile(
  viewerId: string | null | undefined,
  memberId: string,
): CachedMemberProfile | null {
  const scope = scopeKey(viewerId);
  const existing = memoryStore.get(scope)?.get(memberId);
  const seed = previewSeeds.get(memberId);
  if (existing) {
    if (!seed) return existing;
    return {
      ...existing,
      name: seed.name || existing.name,
      initials: seed.initials || existing.initials,
      avatarUrl: seed.avatarUrl !== undefined ? seed.avatarUrl : existing.avatarUrl ?? null,
      ministry: seed.ministry !== undefined ? seed.ministry : existing.ministry,
      choir: seed.choir !== undefined ? seed.choir : existing.choir,
      badgeVerified: seed.badgeVerified ?? existing.badgeVerified,
      churchId: seed.churchId ?? existing.churchId,
      churchName: seed.churchName ?? existing.churchName,
      location: seed.location ?? existing.location,
      friendStatus: seed.friendStatus ?? existing.friendStatus,
      friendCount: seed.friendCount ?? existing.friendCount,
    };
  }
  if (!seed) return null;
  return {
    id: seed.id,
    name: seed.name,
    initials: seed.initials || computeFallbackInitials(seed.name),
    avatarUrl: seed.avatarUrl ?? null,
    ministry: seed.ministry ?? null,
    choir: seed.choir ?? null,
    badgeVerified: Boolean(seed.badgeVerified),
    memberSince: seed.memberSince ?? null,
    churchId: seed.churchId ?? null,
    churchName: seed.churchName ?? null,
    location: seed.location ?? null,
    friendCount: typeof seed.friendCount === 'number' ? seed.friendCount : null,
    showFriendsList: true,
    friendStatus: seed.friendStatus ?? null,
    favoritesShared: null,
    favorites: [],
    friendsVisible: null,
    friends: [],
    cachedAt: 0,
  };
}

export function parsePublicFriendsResponse(payload: unknown): {
  visible: boolean;
  count: number;
  friends: ChurchMemberProfile[];
} {
  const data = (payload ?? {}) as Record<string, unknown>;
  const visible = data.visible !== false;
  const friends = visible ? parseChurchMembers(data.friends) : [];
  const count =
    typeof data.count === 'number' && Number.isFinite(data.count) && data.count >= 0
      ? Math.floor(data.count)
      : friends.length;
  return { visible, count, friends };
}

export function sanitizeCachedMemberProfile(raw: unknown): CachedMemberProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  const name = typeof r.name === 'string' ? r.name.trim() : '';
  if (!id || !name) return null;
  const favorites = Array.isArray(r.favorites)
    ? r.favorites
        .filter((x) => (typeof x === 'string' || typeof x === 'number') && String(x).length <= 12)
        .map(String)
        .slice(0, 1000)
    : [];
  return {
    id,
    name,
    initials:
      typeof r.initials === 'string' && r.initials.trim()
        ? r.initials.trim().slice(0, 3)
        : computeFallbackInitials(name),
    avatarUrl: typeof r.avatarUrl === 'string' && r.avatarUrl.trim() ? r.avatarUrl.trim() : null,
    ministry: typeof r.ministry === 'string' ? r.ministry : null,
    choir: typeof r.choir === 'string' ? r.choir : null,
    badgeVerified: r.badgeVerified === true,
    memberSince: typeof r.memberSince === 'string' ? r.memberSince : null,
    churchId: typeof r.churchId === 'string' ? r.churchId : null,
    churchName: typeof r.churchName === 'string' ? r.churchName : null,
    location: typeof r.location === 'string' ? r.location : null,
    friendCount: typeof r.friendCount === 'number' ? r.friendCount : null,
    showFriendsList: r.showFriendsList !== false,
    friendStatus: parseFriendStatus(r.friendStatus),
    favoritesShared: typeof r.favoritesShared === 'boolean' ? r.favoritesShared : null,
    favorites,
    friendsVisible: typeof r.friendsVisible === 'boolean' ? r.friendsVisible : null,
    friends: parseChurchMembers(r.friends),
    cachedAt: typeof r.cachedAt === 'number' ? r.cachedAt : 0,
  };
}

async function readScopeMap(scope: string): Promise<Map<string, CachedMemberProfile>> {
  const existing = memoryStore.get(scope);
  if (existing) return existing;
  const map = new Map<string, CachedMemberProfile>();
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${scope}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const clean = sanitizeCachedMemberProfile(item);
          if (clean) map.set(clean.id, clean);
        }
      }
    }
  } catch {
    // Ignore storage read errors; network/preview still works.
  }
  memoryStore.set(scope, map);
  return map;
}

export async function loadCachedMemberProfile(
  viewerId: string | null | undefined,
  memberId: string,
): Promise<CachedMemberProfile | null> {
  const map = await readScopeMap(scopeKey(viewerId));
  return map.get(memberId) ?? null;
}

export async function saveCachedMemberProfile(
  viewerId: string | null | undefined,
  profile: CachedMemberProfile,
): Promise<void> {
  const scope = scopeKey(viewerId);
  const map = await readScopeMap(scope);
  map.delete(profile.id);
  map.set(profile.id, { ...profile, cachedAt: Date.now() });
  while (map.size > MAX_CACHED_PROFILES) {
    const oldestKey = map.keys().next().value;
    if (!oldestKey) break;
    map.delete(oldestKey);
  }
  try {
    await AsyncStorage.setItem(
      `${STORAGE_PREFIX}${scope}`,
      JSON.stringify(Array.from(map.values()).reverse()),
    );
  } catch {
    // Best-effort offline cache.
  }
}

export async function clearMemberProfileCache(viewerId?: string | null): Promise<void> {
  previewSeeds.clear();
  if (viewerId) {
    const scope = scopeKey(viewerId);
    memoryStore.delete(scope);
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${scope}`).catch(() => {});
    return;
  }
  const keys = Array.from(memoryStore.keys());
  memoryStore.clear();
  for (const k of keys) {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${k}`).catch(() => {});
  }
}
