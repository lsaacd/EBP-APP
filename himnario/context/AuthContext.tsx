import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { readAuthSession, writeAuthSession, clearAuthSession } from '../utils/authSessionStorage';
import { clearStoredPushToken, getStoredPushToken } from '../utils/pushNotifications';
import { performAppleSignIn, performGoogleSignIn } from '../utils/oauthClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites } from './FavoritesContext';
import { usePlaylists, Playlist } from './PlaylistsContext';
import { useRecentHymns } from './RecentHymnsContext';
import { useLanguage, Language } from './LanguageContext';
import { useTheme } from '../theme/ThemeContext';

export const AUTH_SYNC_API_URL = process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL || 'https://ebp-himnario-sync.himnario.workers.dev';
// Latest pre-login local snapshot per prior account (or guest), without credentials.
// Future retrieval UI can read this prefix; keep backups when signing out/deleting an account.
const LOCAL_BACKUP_KEY_PREFIX = '@himnario_auth_local_backup_v1:';

function parseRevision(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  ministry: string | null;
  choir: string | null;
  churchId: string | null;
  churchName: string | null;
  location: string | null;
  showChurchLocation: boolean;
  /** Accepted friends may see this person's favourite hymns. */
  shareFavoritesWithFriends: boolean;
  /** Signed-in members may view this person's accepted friend names. */
  showFriendsList: boolean;
  /** Suggested to others who linked the same verified church. */
  suggestToChurchMembers: boolean;
  /** Explicit consent to appear to signed-in visitors from other churches. */
  directoryVisibleToAll: boolean;
  notifyCommentLikes: boolean;
  notifyCommentReplies: boolean;
  notifyFriends: boolean;
  role: 'member' | 'admin';
  badgeVerified: boolean;
  ugcTermsAccepted: boolean;
  suspended: boolean;
  displayName: string;
  name?: string;
  initials: string;
  avatarUrl: string | null;
  hasGoogleAvatar: boolean;
}

interface SyncPayload {
  favorites: string[];
  playlists: Playlist[];
  recents: string[];
  preferences: {
    language: Language;
    hymnLanguage: Language;
    isDarkMode: boolean;
    fontSizeMultiplier: number;
  };
  updatedAt?: number;
}

function normalizeUser(raw: any): AuthUser {
  const email = String(raw?.email || '');
  const displayName = String(raw?.displayName || raw?.name || email.split('@')[0] || '');
  return {
    id: String(raw?.id || ''),
    email,
    emailVerified: raw?.emailVerified === true,
    ministry: typeof raw?.ministry === 'string' ? raw.ministry : null,
    choir: typeof raw?.choir === 'string' ? raw.choir : null,
    churchId: typeof raw?.churchId === 'string' ? raw.churchId : null,
    churchName: typeof raw?.churchName === 'string' ? raw.churchName : null,
    location: typeof raw?.location === 'string' ? raw.location : null,
    showChurchLocation: raw?.showChurchLocation === true,
    // Absent on sessions saved before friends existed: default to the server's defaults.
    shareFavoritesWithFriends: raw?.shareFavoritesWithFriends !== false,
    showFriendsList: raw?.showFriendsList !== false,
    suggestToChurchMembers:
      typeof raw?.suggestToChurchMembers === 'boolean'
        ? raw.suggestToChurchMembers
        : raw?.showChurchLocation === true,
    directoryVisibleToAll: raw?.directoryVisibleToAll === true,
    notifyCommentLikes: raw?.notifyCommentLikes !== false,
    notifyCommentReplies: raw?.notifyCommentReplies !== false,
    notifyFriends: raw?.notifyFriends !== false,
    role: raw?.role === 'admin' && email.toLowerCase() === 'isaacduran167@gmail.com' ? 'admin' : 'member',
    badgeVerified: raw?.badgeVerified === true && raw?.ministry === 'obispo',
    ugcTermsAccepted: raw?.ugcTermsAccepted === true,
    suspended: raw?.suspended === true,
    displayName,
    name: displayName,
    initials: raw?.initials || computeUserInitials(displayName, email),
    avatarUrl: typeof raw?.avatarUrl === 'string' && raw.avatarUrl.trim() ? raw.avatarUrl.trim() : null,
    hasGoogleAvatar: raw?.hasGoogleAvatar === true,
  };
}

interface StoredSession {
  token: string;
  user: AuthUser;
  lastSyncedAt: string | null;
  revision?: number | null;
  syncBlocked?: boolean;
}

export type AuthSheetInitialPage = 'account' | 'friends' | 'notifications';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncBlocked: boolean;
  lastSyncedAt: string | null;
  authSheetVisible: boolean;
  authSheetRequestId: number;
  pendingAuthSheetPage: AuthSheetInitialPage | null;
  clearPendingAuthSheetPage: () => void;
  openAuthSheet: () => void;
  openAuthSheetToPage: (initialPage: AuthSheetInitialPage) => void;
  closeAuthSheet: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string, newPassword: string, verifyName?: string) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  requestEmailVerification: () => Promise<void>;
  refreshUser: () => Promise<AuthUser>;
  updateProfileName: (displayName: string) => Promise<void>;
  updateProfile: (profile: {
    name?: string;
    ministry?: string | null;
    choir?: string | null;
    churchId?: string | null;
    churchName?: string | null;
    location?: string | null;
    showChurchLocation?: boolean;
    shareFavoritesWithFriends?: boolean;
    showFriendsList?: boolean;
    suggestToChurchMembers?: boolean;
    directoryVisibleToAll?: boolean;
    notifyCommentLikes?: boolean;
    notifyCommentReplies?: boolean;
    notifyFriends?: boolean;
  }) => Promise<void>;
  acceptUgcTerms: () => Promise<void>;
  uploadAvatar: (base64: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
  restoreGoogleAvatar: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveSyncConflict: (strategy: 'local' | 'cloud') => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isSyncing: false,
  syncBlocked: true,
  lastSyncedAt: null,
  authSheetVisible: false,
  authSheetRequestId: 0,
  pendingAuthSheetPage: null,
  clearPendingAuthSheetPage: () => {},
  openAuthSheet: () => {},
  openAuthSheetToPage: () => {},
  closeAuthSheet: () => {},
  signIn: async () => {},
  register: async () => {},
  signInWithApple: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  requestPasswordRecovery: async () => {},
  requestEmailVerification: async () => {},
  refreshUser: async () => { throw new Error('auth_cancelled'); },
  updateProfileName: async () => {},
  updateProfile: async () => {},
  acceptUgcTerms: async () => {},
  uploadAvatar: async () => {},
  removeAvatar: async () => {},
  restoreGoogleAvatar: async () => {},
  syncNow: async () => {},
  resolveSyncConflict: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
});

export function computeUserInitials(displayName?: string, email?: string): string {
  const clean = (displayName || '').trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }
  const emailPart = (email || '').split('@')[0] || 'U';
  return emailPart.slice(0, 2).toUpperCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { favoriteIds, setAllFavorites } = useFavorites();
  const { playlists, setAllPlaylists } = usePlaylists();
  const { recentIds, setAllRecents } = useRecentHymns();
  const { language, hymnLanguage, setLanguage, setHymnLanguage } = useLanguage();
  const { isDarkMode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBlocked, setSyncBlocked] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [authSheetVisible, setAuthSheetVisible] = useState(false);
  const [authSheetRequestId, setAuthSheetRequestId] = useState(0);
  const [pendingAuthSheetPage, setPendingAuthSheetPage] = useState<AuthSheetInitialPage | null>(null);

  const mountedRef = useRef(true);
  const sessionEpochRef = useRef(0);
  const sessionPendingRef = useRef(true);
  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<AuthUser | null>(null);
  const lastSyncedAtRef = useRef<string | null>(null);
  const revisionRef = useRef<number | null>(null);
  const syncBlockedRef = useRef(true);
  const profileRequestRef = useRef(0);
  const requestsRef = useRef(new Set<AbortController>());
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const syncedSnapshotRef = useRef<string | null>(null);
  const snapshotRef = useRef<SyncPayload>(null!);
  snapshotRef.current = {
    favorites: favoriteIds,
    playlists,
    recents: recentIds,
    preferences: { language, hymnLanguage, isDarkMode, fontSizeMultiplier },
  };

  const isCurrent = useCallback((epoch: number, activeToken?: string) => (
    mountedRef.current && epoch === sessionEpochRef.current &&
    (activeToken === undefined || activeToken === tokenRef.current)
  ), []);

  const assertCurrent = useCallback((epoch: number, activeToken?: string) => {
    if (!isCurrent(epoch, activeToken)) throw new Error('auth_cancelled');
  }, [isCurrent]);

  const invalidateRequests = useCallback(() => {
    const epoch = ++sessionEpochRef.current;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = null;
    requestsRef.current.forEach((request) => request.abort());
    requestsRef.current.clear();
    syncInFlightRef.current = null;
    return epoch;
  }, []);

  const saveSession = useCallback(async (
    epoch: number, nextToken: string, nextUser: AuthUser, syncedAt: string | null
  ) => {
    assertCurrent(epoch);
    tokenRef.current = nextToken;
    userRef.current = nextUser;
    lastSyncedAtRef.current = syncedAt;
    setToken(nextToken);
    setUser(nextUser);
    setLastSyncedAt(syncedAt);
    const payload: StoredSession = {
      token: nextToken, user: nextUser, lastSyncedAt: syncedAt,
      revision: revisionRef.current, syncBlocked: syncBlockedRef.current,
    };
    // The helper serializes writes/clears. Never enqueue a stale response after logout.
    assertCurrent(epoch, nextToken);
    await writeAuthSession(JSON.stringify(payload));
    assertCurrent(epoch, nextToken);
  }, [assertCurrent]);

  const clearSession = useCallback(async () => {
    invalidateRequests();
    sessionPendingRef.current = false;
    tokenRef.current = null;
    userRef.current = null;
    revisionRef.current = null;
    lastSyncedAtRef.current = null;
    syncBlockedRef.current = true;
    syncedSnapshotRef.current = null;
    setIsLoading(false);
    setIsSyncing(false);
    setSyncBlocked(true);
    setToken(null);
    setUser(null);
    setLastSyncedAt(null);
    await clearAuthSession();
  }, [invalidateRequests]);

  const normalizeServerSync = useCallback((syncData: any): SyncPayload => {
    const prefs = syncData?.preferences || {};
    const localPrefs = snapshotRef.current.preferences;
    const favs = syncData?.favorites ?? syncData?.favoriteIds;
    const recents = syncData?.recents ?? syncData?.recentIds;
    const cleanIds = (ids: unknown) => Array.isArray(ids)
      ? Array.from(new Set(ids.map(String))).filter(Boolean) : [];
    return {
      favorites: cleanIds(favs),
      playlists: Array.isArray(syncData?.playlists) ? syncData.playlists : [],
      recents: cleanIds(recents).slice(0, 10),
      preferences: {
        language: prefs.language === 'es' || prefs.language === 'en' ? prefs.language : localPrefs.language,
        hymnLanguage: prefs.hymnLanguage === 'es' || prefs.hymnLanguage === 'en'
          ? prefs.hymnLanguage : localPrefs.hymnLanguage,
        isDarkMode: typeof prefs.isDarkMode === 'boolean' ? prefs.isDarkMode : localPrefs.isDarkMode,
        fontSizeMultiplier: typeof prefs.fontSizeMultiplier === 'number' &&
          prefs.fontSizeMultiplier >= 12 / 22 && prefs.fontSizeMultiplier <= 64 / 22
          ? prefs.fontSizeMultiplier : localPrefs.fontSizeMultiplier,
      },
    };
  }, []);

  const applyServerSync = useCallback((syncData: any): SyncPayload => {
    const localPrefs = snapshotRef.current.preferences;
    const next = normalizeServerSync(syncData);
    // Only explicit login/registration/cloud-resolution may replace local collections with cloud data.
    setAllFavorites(next.favorites);
    setAllPlaylists(next.playlists);
    setAllRecents(next.recents);
    setLanguage(next.preferences.language);
    setHymnLanguage(next.preferences.hymnLanguage);
    if (next.preferences.isDarkMode !== localPrefs.isDarkMode) toggleTheme();
    setFontSizeMultiplier(next.preferences.fontSizeMultiplier);
    snapshotRef.current = next;
    syncedSnapshotRef.current = JSON.stringify(next);
    return next;
  }, [normalizeServerSync, setAllFavorites, setAllPlaylists, setAllRecents, setLanguage, setHymnLanguage,
    toggleTheme, setFontSizeMultiplier]);

  useEffect(() => {
    mountedRef.current = true;
    const epoch = sessionEpochRef.current;
    const controller = new AbortController();
    requestsRef.current.add(controller);
    const restore = async () => {
      try {
        const raw = await readAuthSession();
        if (!raw || !isCurrent(epoch)) return;
        const parsed: StoredSession = JSON.parse(raw);
        if (!parsed?.token || !parsed?.user) return;
        revisionRef.current = parseRevision(parsed.revision);
        syncBlockedRef.current = parsed.syncBlocked === true || revisionRef.current === null;
        setSyncBlocked(syncBlockedRef.current);
        tokenRef.current = parsed.token;
        userRef.current = normalizeUser(parsed.user);
        const previousDate = parsed.lastSyncedAt;
        const date = previousDate && new Date(/^\d+$/.test(previousDate) ? Number(previousDate) : previousDate);
        const syncedAt = date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
        lastSyncedAtRef.current = syncedAt;
        setToken(parsed.token);
        setUser(userRef.current);
        setLastSyncedAt(syncedAt);
        const profileVersion = profileRequestRef.current;
        const res = await fetch(`${AUTH_SYNC_API_URL}/sync`, {
          headers: { Authorization: `Bearer ${parsed.token}` }, signal: controller.signal,
        });
        if (!isCurrent(epoch, parsed.token)) return;
        if (res.status === 401) {
          await clearSession();
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!isCurrent(epoch, parsed.token)) return;
        // Sync may have started before a profile edit or email verification.
        const nextUser = data?.user?.id === userRef.current?.id
          ? normalizeUser({ ...(profileVersion === profileRequestRef.current ? data.user : userRef.current!), emailVerified: data.user.emailVerified === true || userRef.current!.emailVerified })
          : userRef.current!;
        const userChanged = JSON.stringify(nextUser) !== JSON.stringify(userRef.current);
        const cloudSyncObj = data?.data || data?.sync;
        const cloudRevision = parseRevision(cloudSyncObj?.updatedAt);
        // GET is verification only. Never rebase offline edits onto a newer cloud revision.
        if (cloudRevision === null || cloudRevision !== revisionRef.current) {
          syncBlockedRef.current = true;
          setSyncBlocked(true);
        } else if (!syncBlockedRef.current) {
          syncedSnapshotRef.current = JSON.stringify(normalizeServerSync(cloudSyncObj));
        }
        if (syncBlockedRef.current || userChanged) {
          await saveSession(epoch, parsed.token, nextUser, lastSyncedAtRef.current);
        }
      } catch {
        // Offline or unavailable secure storage: keep local collections. Unknown revisions stay blocked.
      } finally {
        requestsRef.current.delete(controller);
        if (isCurrent(epoch)) {
          sessionPendingRef.current = false;
          setIsLoading(false);
        }
      }
    };
    void restore();
    return () => {
      mountedRef.current = false;
      invalidateRequests();
    };
  }, [clearSession, invalidateRequests, isCurrent, normalizeServerSync, saveSession]);

  const pushSyncToCloud = useCallback(async (
    activeToken: string, snapshot: SyncPayload
  ): Promise<void> => {
    const epoch = sessionEpochRef.current;
    // A second write waits for the first revision; aborting a PUT cannot undo a server commit.
    while (syncInFlightRef.current) await syncInFlightRef.current.catch(() => {});
    assertCurrent(epoch, activeToken);
    if (sessionPendingRef.current) throw new Error('sync_unavailable');
    if (syncBlockedRef.current || revisionRef.current === null) throw new Error('sync_conflict');
    const controller = new AbortController();
    requestsRef.current.add(controller);
    setIsSyncing(true);
    const operation = (async () => {
      try {
        const res = await fetch(`${AUTH_SYNC_API_URL}/sync`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json', Authorization: `Bearer ${activeToken}`,
            'X-EBP-Client': 'himnario-v2',
          },
          body: JSON.stringify({ ...snapshot, expectedRevision: revisionRef.current }),
          signal: controller.signal,
        });
        assertCurrent(epoch, activeToken);
        if (res.status === 401) {
          await clearSession();
          throw new Error('auth_cancelled');
        }
        if (res.status === 409) {
          syncBlockedRef.current = true;
          setSyncBlocked(true);
          await saveSession(epoch, activeToken, userRef.current!, lastSyncedAtRef.current);
          throw new Error('sync_conflict');
        }
        if (!res.ok) throw new Error('sync_unavailable');
        const data = await res.json();
        assertCurrent(epoch, activeToken);
        const revision = parseRevision(data?.updatedAt ?? data?.sync?.updatedAt);
        if (revision === null) {
          syncBlockedRef.current = true;
          setSyncBlocked(true);
          await saveSession(epoch, activeToken, userRef.current!, lastSyncedAtRef.current);
          throw new Error('sync_conflict');
        }
        revisionRef.current = revision;
        syncedSnapshotRef.current = JSON.stringify(snapshot);
        const nextUser = data?.user?.id === userRef.current?.id
          ? { ...userRef.current!, emailVerified: data.user.emailVerified === true || userRef.current!.emailVerified }
          : userRef.current!;
        await saveSession(epoch, activeToken, nextUser, new Date(revision).toISOString());
      } catch (error) {
        assertCurrent(epoch, activeToken);
        throw error;
      } finally {
        requestsRef.current.delete(controller);
        if (isCurrent(epoch, activeToken)) {
          syncInFlightRef.current = null;
          setIsSyncing(false);
        }
      }
    })();
    syncInFlightRef.current = operation;
    await operation;
  }, [assertCurrent, clearSession, isCurrent, saveSession]);

  const localSnapshot = JSON.stringify(snapshotRef.current);
  const userId = user?.id;
  useEffect(() => {
    if (!token || !userId || isLoading || syncBlocked || sessionPendingRef.current ||
      localSnapshot === syncedSnapshotRef.current) return;
    const epoch = sessionEpochRef.current;
    const snapshot: SyncPayload = JSON.parse(localSnapshot);
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null;
      if (isCurrent(epoch, token)) {
        // Conflicts keep local data and remain paused; background failures never trigger retries.
        void pushSyncToCloud(token, snapshot).catch(() => {});
      }
    }, 1200);
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    };
  }, [token, userId, isLoading, syncBlocked, localSnapshot, isCurrent, pushSyncToCloud]);

  const authenticate = useCallback(async (
    mode: 'login' | 'register', email: string, password: string, name?: string
  ) => {
    if (mode === 'register' && password.length < 8) throw new Error('password_too_short');
    const priorAccountId = userRef.current?.id || null;
    const epoch = invalidateRequests();
    sessionPendingRef.current = true;
    setIsLoading(true);
    setIsSyncing(false);
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name?.trim() || cleanEmail.split('@')[0];
      const res = await fetch(`${AUTH_SYNC_API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-EBP-Client': 'himnario-v2' },
        body: JSON.stringify({
          email: cleanEmail, password,
          ...(mode === 'register' ? {
            name: cleanName, displayName: cleanName, localData: snapshotRef.current,
          } : {}),
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      assertCurrent(epoch);
      if (!res.ok) {
        if (res.status === 429) throw new Error(`rate_limited:${data?.retryAfterSeconds || 60}`);
        throw new Error(data?.error || data?.message || 'auth_failed');
      }
      if (typeof data.token !== 'string' || !data.token || !data.user?.id) {
        throw new Error('auth_failed');
      }
      const syncObj = data.data || data.sync;
      const revision = parseRevision(syncObj?.updatedAt);
      const localSnapshotBeforeReplace = JSON.stringify(snapshotRef.current);
      // A cloud-authoritative login must not destroy the only copy of unsynced device data.
      // Session credentials are stored exclusively through authSessionStorage above.
      try {
        await AsyncStorage.setItem(
          LOCAL_BACKUP_KEY_PREFIX + (priorAccountId ? `account:${encodeURIComponent(priorAccountId)}` : 'guest'),
          JSON.stringify({
            version: 1, priorAccountId, savedAt: new Date().toISOString(), data: JSON.parse(localSnapshotBeforeReplace),
          })
        );
      } catch {
        throw new Error('local_backup_failed');
      }
      assertCurrent(epoch);
      if (JSON.stringify(snapshotRef.current) !== localSnapshotBeforeReplace) {
        throw new Error('local_backup_failed');
      }
      revisionRef.current = revision;
      syncBlockedRef.current = revision === null;
      setSyncBlocked(syncBlockedRef.current);
      applyServerSync(syncObj);
      await saveSession(epoch, data.token, normalizeUser(data.user),
        revision === null || revision === 0 ? null : new Date(revision).toISOString());
    } catch (error) {
      assertCurrent(epoch);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
      if (isCurrent(epoch)) {
        sessionPendingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [applyServerSync, assertCurrent, invalidateRequests, isCurrent, saveSession]);

  const signIn = useCallback((email: string, password: string) => (
    authenticate('login', email, password)
  ), [authenticate]);
  const register = useCallback((name: string, email: string, password: string) => (
    authenticate('register', email, password, name)
  ), [authenticate]);

  const completeOAuth = useCallback(async (
    provider: 'apple' | 'google',
    payload: Record<string, unknown>,
  ) => {
    const priorAccountId = userRef.current?.id || null;
    const epoch = invalidateRequests();
    sessionPendingRef.current = true;
    setIsLoading(true);
    setIsSyncing(false);
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}/auth/oauth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-EBP-Client': 'himnario-v2' },
        body: JSON.stringify({
          ...payload,
          localData: snapshotRef.current,
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      assertCurrent(epoch);
      if (!res.ok) {
        if (res.status === 429) throw new Error(`rate_limited:${data?.retryAfterSeconds || 60}`);
        throw new Error(data?.error || data?.message || 'oauth_failed');
      }
      if (typeof data.token !== 'string' || !data.token || !data.user?.id) {
        throw new Error('oauth_failed');
      }
      const syncObj = data.data || data.sync;
      const revision = parseRevision(syncObj?.updatedAt);
      const localSnapshotBeforeReplace = JSON.stringify(snapshotRef.current);
      try {
        await AsyncStorage.setItem(
          LOCAL_BACKUP_KEY_PREFIX + (priorAccountId ? `account:${encodeURIComponent(priorAccountId)}` : 'guest'),
          JSON.stringify({
            version: 1,
            priorAccountId,
            savedAt: new Date().toISOString(),
            data: JSON.parse(localSnapshotBeforeReplace),
          }),
        );
      } catch {
        throw new Error('local_backup_failed');
      }
      assertCurrent(epoch);
      if (JSON.stringify(snapshotRef.current) !== localSnapshotBeforeReplace) {
        throw new Error('local_backup_failed');
      }
      revisionRef.current = revision;
      syncBlockedRef.current = revision === null;
      setSyncBlocked(syncBlockedRef.current);
      applyServerSync(syncObj);
      await saveSession(
        epoch,
        data.token,
        normalizeUser(data.user),
        revision === null || revision === 0 ? null : new Date(revision).toISOString(),
      );
    } catch (error) {
      assertCurrent(epoch);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
      if (isCurrent(epoch)) {
        sessionPendingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [applyServerSync, assertCurrent, invalidateRequests, isCurrent, saveSession]);

  const signInWithApple = useCallback(async () => {
    const applePayload = await performAppleSignIn();
    await completeOAuth('apple', {
      identityToken: applePayload.identityToken,
      nonce: applePayload.nonce,
      email: applePayload.email,
      fullName: applePayload.fullName,
    });
  }, [completeOAuth]);

  const signInWithGoogle = useCallback(async () => {
    const googlePayload = await performGoogleSignIn();
    await completeOAuth('google', {
      idToken: googlePayload.idToken,
    });
  }, [completeOAuth]);

  // These endpoints only send email. Tokens and new passwords are handled on account.html.
  const requestAccountEmail = useCallback(async (kind: 'recovery' | 'verification', email?: string) => {
    const epoch = sessionEpochRef.current;
    const activeToken = tokenRef.current;
    assertCurrent(epoch);
    if (sessionPendingRef.current || (kind === 'verification' && (!activeToken || !userRef.current))) {
      throw new Error('auth_cancelled');
    }
    const expectedToken = kind === 'verification' ? activeToken! : undefined;
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}/auth/${kind}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'X-EBP-Client': 'himnario-v2',
          ...(kind === 'verification' ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify(kind === 'recovery'
          ? { email: email!.trim().toLowerCase(), language: snapshotRef.current.preferences.language }
          : { language: snapshotRef.current.preferences.language }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      assertCurrent(epoch, expectedToken);
      if (kind === 'verification' && res.status === 401) {
        await clearSession();
        throw new Error('auth_cancelled');
      }
      if (res.status === 429) throw new Error(`rate_limited:${data?.retryAfterSeconds || 60}`);
      if (res.status === 503) throw new Error(`${kind}_unavailable`);
      if (!res.ok) throw new Error('email_request_failed');
    } catch (error) {
      assertCurrent(epoch, expectedToken);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
    }
  }, [assertCurrent, clearSession]);

  const requestPasswordRecovery = useCallback((email: string) => (
    requestAccountEmail('recovery', email)
  ), [requestAccountEmail]);
  // Keep the legacy signature; intentionally ignore the name and password arguments.
  const resetPassword = useCallback((email: string, _newPassword: string, _verifyName?: string) => (
    requestPasswordRecovery(email)
  ), [requestPasswordRecovery]);
  const requestEmailVerification = useCallback(() => (
    requestAccountEmail('verification')
  ), [requestAccountEmail]);

  const refreshUser = useCallback(async (): Promise<AuthUser> => {
    const activeToken = tokenRef.current;
    if (sessionPendingRef.current || !activeToken || !userRef.current) throw new Error('auth_cancelled');
    const epoch = sessionEpochRef.current;
    assertCurrent(epoch, activeToken);
    const request = ++profileRequestRef.current;
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}`, 'X-EBP-Client': 'himnario-v2' },
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      assertCurrent(epoch, activeToken);
      if (request !== profileRequestRef.current) throw new Error('auth_cancelled');
      if (res.status === 401) {
        await clearSession();
        throw new Error('auth_cancelled');
      }
      if (res.status === 429) throw new Error(`rate_limited:${data?.retryAfterSeconds || 60}`);
      if (!res.ok || data?.user?.id !== userRef.current?.id) throw new Error('account_refresh_failed');
      // Email is immutable in this app. Older in-flight responses cannot undo verification.
      const nextUser = normalizeUser({
        ...data.user, emailVerified: data.user.emailVerified === true || userRef.current?.emailVerified,
      });
      await saveSession(epoch, activeToken, nextUser, lastSyncedAtRef.current);
      return nextUser;
    } catch (error) {
      assertCurrent(epoch, activeToken);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
    }
  }, [assertCurrent, clearSession, saveSession]);

  const updateAccount = useCallback(async (body: object, path = '/auth/profile') => {
    const activeToken = tokenRef.current;
    if (!activeToken || !userRef.current) throw new Error('auth_cancelled');
    const epoch = sessionEpochRef.current;
    const request = ++profileRequestRef.current;
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}${path}`, {
        method: path === '/auth/profile' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${activeToken}`,
          'X-EBP-Client': 'himnario-v2',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      assertCurrent(epoch, activeToken);
      if (request !== profileRequestRef.current) throw new Error('auth_cancelled');
      if (res.status === 401) {
        await clearSession();
        throw new Error('auth_cancelled');
      }
      if (!res.ok || !data?.user || data.user.id !== userRef.current?.id) throw new Error(data?.error || 'auth_failed');
      await saveSession(epoch, activeToken, normalizeUser({
        ...data.user, emailVerified: data.user.emailVerified === true || userRef.current?.emailVerified,
      }), lastSyncedAtRef.current);
    } catch (error) {
      assertCurrent(epoch, activeToken);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
    }
  }, [assertCurrent, clearSession, saveSession]);

  const updateProfile = useCallback((profile: {
    name?: string;
    ministry?: string | null;
    choir?: string | null;
    churchId?: string | null;
    churchName?: string | null;
    location?: string | null;
    showChurchLocation?: boolean;
    shareFavoritesWithFriends?: boolean;
    showFriendsList?: boolean;
    suggestToChurchMembers?: boolean;
    directoryVisibleToAll?: boolean;
    notifyCommentLikes?: boolean;
    notifyCommentReplies?: boolean;
    notifyFriends?: boolean;
  }) => updateAccount(profile), [updateAccount]);
  const updateProfileName = useCallback((name: string) => updateProfile({name: name.trim()}), [updateProfile]);
  const acceptUgcTerms = useCallback(() => updateAccount({version:'2026-11-17'}, '/auth/ugc-terms/accept'), [updateAccount]);

  const mutateAvatar = useCallback(
    async (method: 'POST' | 'DELETE', base64?: string, path = '/auth/avatar') => {
      const activeToken = tokenRef.current;
      if (!activeToken || !userRef.current) throw new Error('auth_cancelled');
      const epoch = sessionEpochRef.current;
      const request = ++profileRequestRef.current;
      const controller = new AbortController();
      requestsRef.current.add(controller);
      try {
        const hasBody = method === 'POST' && base64 !== undefined;
        const res = await fetch(`${AUTH_SYNC_API_URL}${path}`, {
          method,
          headers: {
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            Authorization: `Bearer ${activeToken}`,
            'X-EBP-Client': 'himnario-v2',
          },
          ...(hasBody ? { body: JSON.stringify({ base64 }) } : {}),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        assertCurrent(epoch, activeToken);
        if (request !== profileRequestRef.current) throw new Error('auth_cancelled');
        if (res.status === 401) {
          await clearSession();
          throw new Error('auth_cancelled');
        }
        if (!res.ok || !data?.user || data.user.id !== userRef.current?.id) {
          throw new Error(data?.error || 'avatar_upload_failed');
        }
        await saveSession(
          epoch,
          activeToken,
          normalizeUser({
            ...data.user,
            emailVerified: data.user.emailVerified === true || userRef.current?.emailVerified,
          }),
          lastSyncedAtRef.current,
        );
      } catch (error) {
        assertCurrent(epoch, activeToken);
        throw error;
      } finally {
        requestsRef.current.delete(controller);
      }
    },
    [assertCurrent, clearSession, saveSession],
  );

  const uploadAvatar = useCallback((base64: string) => mutateAvatar('POST', base64), [mutateAvatar]);
  const removeAvatar = useCallback(() => mutateAvatar('DELETE'), [mutateAvatar]);
  const restoreGoogleAvatar = useCallback(
    () => mutateAvatar('POST', undefined, '/auth/avatar/restore-google'),
    [mutateAvatar],
  );

  const syncNow = useCallback(async () => {
    const activeToken = tokenRef.current;
    if (!activeToken || !userRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = null;
    await pushSyncToCloud(activeToken, snapshotRef.current);
  }, [pushSyncToCloud]);

  const resolveSyncConflict = useCallback(async (strategy: 'local' | 'cloud') => {
    const activeToken = tokenRef.current;
    if (!activeToken || !userRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = null;
    const epoch = sessionEpochRef.current;
    while (syncInFlightRef.current) await syncInFlightRef.current.catch(() => {});
    assertCurrent(epoch, activeToken);
    if (sessionPendingRef.current) throw new Error('sync_unavailable');
    const profileVersion = profileRequestRef.current;
    const controller = new AbortController();
    requestsRef.current.add(controller);
    setIsSyncing(true);
    const operation = (async () => {
      try {
        const res = await fetch(`${AUTH_SYNC_API_URL}/sync`, {
          headers: { Authorization: `Bearer ${activeToken}`, 'X-EBP-Client': 'himnario-v2' },
          signal: controller.signal,
        });
        assertCurrent(epoch, activeToken);
        if (res.status === 401) {
          await clearSession();
          throw new Error('auth_cancelled');
        }
        if (!res.ok) throw new Error('sync_unavailable');
        const data = await res.json();
        assertCurrent(epoch, activeToken);
        const syncObj = data?.data || data?.sync;
        const cloudRevision = parseRevision(syncObj?.updatedAt);
        if (cloudRevision === null) throw new Error('sync_unavailable');

        const baseUser = data?.user?.id === userRef.current?.id
          ? normalizeUser({
              ...(profileVersion === profileRequestRef.current ? data.user : userRef.current!),
              emailVerified: data.user.emailVerified === true || userRef.current!.emailVerified,
            })
          : userRef.current!;

        if (strategy === 'cloud') {
          const localSnapshotBeforeReplace = JSON.stringify(snapshotRef.current);
          const accountId = userRef.current!.id;
          try {
            await AsyncStorage.setItem(
              LOCAL_BACKUP_KEY_PREFIX + `account:${encodeURIComponent(accountId)}`,
              JSON.stringify({
                version: 1,
                priorAccountId: accountId,
                savedAt: new Date().toISOString(),
                data: JSON.parse(localSnapshotBeforeReplace),
              })
            );
          } catch {
            throw new Error('local_backup_failed');
          }
          assertCurrent(epoch, activeToken);
          if (JSON.stringify(snapshotRef.current) !== localSnapshotBeforeReplace) {
            throw new Error('local_backup_failed');
          }
          revisionRef.current = cloudRevision;
          syncBlockedRef.current = false;
          setSyncBlocked(false);
          applyServerSync(syncObj);
          await saveSession(
            epoch,
            activeToken,
            baseUser,
            cloudRevision === 0 ? null : new Date(cloudRevision).toISOString()
          );
          return;
        }

        const snapshot = snapshotRef.current;
        const putRes = await fetch(`${AUTH_SYNC_API_URL}/sync`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
            'X-EBP-Client': 'himnario-v2',
          },
          body: JSON.stringify({ ...snapshot, expectedRevision: cloudRevision }),
          signal: controller.signal,
        });
        assertCurrent(epoch, activeToken);
        if (putRes.status === 401) {
          await clearSession();
          throw new Error('auth_cancelled');
        }
        if (putRes.status === 409) throw new Error('sync_conflict');
        if (!putRes.ok) throw new Error('sync_unavailable');
        const putData = await putRes.json();
        assertCurrent(epoch, activeToken);
        const newRevision = parseRevision(putData?.updatedAt ?? putData?.sync?.updatedAt);
        if (newRevision === null) throw new Error('sync_conflict');
        revisionRef.current = newRevision;
        syncBlockedRef.current = false;
        setSyncBlocked(false);
        syncedSnapshotRef.current = JSON.stringify(snapshot);
        const nextUser = putData?.user?.id === baseUser.id
          ? { ...baseUser, emailVerified: putData.user.emailVerified === true || baseUser.emailVerified }
          : baseUser;
        await saveSession(epoch, activeToken, nextUser, new Date(newRevision).toISOString());
      } catch (error) {
        assertCurrent(epoch, activeToken);
        throw error;
      } finally {
        requestsRef.current.delete(controller);
        if (isCurrent(epoch, activeToken)) {
          syncInFlightRef.current = null;
          setIsSyncing(false);
        }
      }
    })();
    syncInFlightRef.current = operation;
    await operation;
  }, [applyServerSync, assertCurrent, clearSession, isCurrent, saveSession]);

  const signOut = useCallback(async () => {
    const activeToken = tokenRef.current;
    const pushToken = await getStoredPushToken();
    await clearStoredPushToken();
    const clearing = clearSession();
    if (activeToken) {
      void fetch(`${AUTH_SYNC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
          'X-EBP-Client': 'himnario-v2',
        },
        body: JSON.stringify(pushToken ? { pushToken } : {}),
      }).catch(() => {});
    }
    await clearing;
  }, [clearSession]);

  const deleteAccount = useCallback(async () => {
    const activeToken = tokenRef.current;
    if (!activeToken) return;
    const epoch = invalidateRequests();
    sessionPendingRef.current = true;
    setIsLoading(false);
    setIsSyncing(true);
    const controller = new AbortController();
    requestsRef.current.add(controller);
    try {
      const res = await fetch(`${AUTH_SYNC_API_URL}/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeToken}`, 'X-EBP-Client': 'himnario-v2' },
        signal: controller.signal,
      });
      assertCurrent(epoch, activeToken);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        assertCurrent(epoch, activeToken);
        if (res.status === 401) await clearSession();
        throw new Error(data?.error || 'auth_failed');
      }
      await clearSession();
    } catch (error) {
      if (tokenRef.current !== null) assertCurrent(epoch, activeToken);
      throw error;
    } finally {
      requestsRef.current.delete(controller);
      if (isCurrent(epoch, activeToken)) {
        sessionPendingRef.current = false;
        setIsSyncing(false);
      }
    }
  }, [assertCurrent, clearSession, invalidateRequests, isCurrent]);

  const openAuthSheet = useCallback(() => {
    setAuthSheetRequestId((n) => n + 1);
    setAuthSheetVisible(true);
  }, []);
  const openAuthSheetToPage = useCallback((initialPage: AuthSheetInitialPage) => {
    setPendingAuthSheetPage(initialPage);
    setAuthSheetRequestId((n) => n + 1);
    setAuthSheetVisible(true);
  }, []);
  const closeAuthSheet = useCallback(() => {
    setPendingAuthSheetPage(null);
    setAuthSheetVisible(false);
  }, []);
  const clearPendingAuthSheetPage = useCallback(() => setPendingAuthSheetPage(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSyncing,
        syncBlocked,
        lastSyncedAt,
        authSheetVisible,
        authSheetRequestId,
        pendingAuthSheetPage,
        clearPendingAuthSheetPage,
        openAuthSheet,
        openAuthSheetToPage,
        closeAuthSheet,
        signIn,
        register,
        signInWithApple,
        signInWithGoogle,
        resetPassword,
        requestPasswordRecovery,
        requestEmailVerification,
        refreshUser,
        updateProfileName,
        updateProfile,
        acceptUgcTerms,
        uploadAvatar,
        removeAvatar,
        restoreGoogleAvatar,
        syncNow,
        resolveSyncConflict,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
