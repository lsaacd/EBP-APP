import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useCommunityApi, communityError } from "./communityApi";
import * as Haptics from "./haptics";

export interface HymnSummary {
  likesCount: number;
  dislikesCount: number | null;
  commentsCount: number;
  myReaction: 1 | -1 | 0;
}

const EMPTY_SUMMARY: HymnSummary = {
  likesCount: 0,
  dislikesCount: null,
  commentsCount: 0,
  myReaction: 0,
};

export function slugifyHymnId(rawId: string | number): string {
  return String(rawId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shared in-memory pub/sub so MusicPlayer and HymnDetail stay in instant sync
const memoryCache = new Map<string, HymnSummary>();
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

function setCachedSummary(key: string, summary: HymnSummary) {
  memoryCache.set(key, summary);
  notifyListeners();
  void AsyncStorage.setItem(key, JSON.stringify(summary)).catch(() => {});
}

export function useHymnCommunity(rawHymnId: string | number | undefined) {
  const slug = slugifyHymnId(rawHymnId ?? "");
  const { user, token, openAuthSheet } = useAuth();
  const { language } = useLanguage();
  const es = language === "es";
  const api = useCommunityApi();
  const isAdmin =
    user?.role === "admin" &&
    user.email.toLowerCase() === "isaacduran167@gmail.com";

  const cacheKey = `@himnario_hymn_summary_v1:${slug}:${user?.id || "guest"}`;
  const [summary, setSummary] = useState<HymnSummary>(
    () => memoryCache.get(cacheKey) || EMPTY_SUMMARY,
  );
  const [errorMessage, setErrorMessage] = useState("");

  const scopeEpochRef = useRef(0);
  const refreshGenRef = useRef(0);
  const inFlightOpRef = useRef<object | null>(null);
  const desiredReactionRef = useRef<1 | -1 | 0 | null>(null);
  const confirmedSummaryRef = useRef<HymnSummary>(summary);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const syncFromMemory = () => {
      const next = memoryCache.get(cacheKey);
      if (next) setSummary(next);
    };
    listeners.add(syncFromMemory);
    return () => {
      listeners.delete(syncFromMemory);
    };
  }, [cacheKey]);

  const refresh = useCallback(async () => {
    if (!slug) return;
    const scopeEpoch = scopeEpochRef.current;
    const gen = ++refreshGenRef.current;
    try {
      const data = await api<HymnSummary>(`/hymns/${slug}/summary`);
      if (scopeEpoch !== scopeEpochRef.current || gen !== refreshGenRef.current || inFlightOpRef.current !== null) return;
      const normalized: HymnSummary = {
        likesCount: Math.max(0, Number(data.likesCount) || 0),
        dislikesCount:
          typeof data.dislikesCount === "number"
            ? Math.max(0, data.dislikesCount)
            : null,
        commentsCount: Math.max(0, Number(data.commentsCount) || 0),
        myReaction:
          data.myReaction === 1 || data.myReaction === -1 ? data.myReaction : 0,
      };
      confirmedSummaryRef.current = normalized;
      setSummary(normalized);
      setCachedSummary(cacheKey, normalized);
    } catch {
      /* Keep offline cached state quietly */
    }
  }, [api, cacheKey, slug]);

  const userId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    setErrorMessage("");
    desiredReactionRef.current = null;
    inFlightOpRef.current = null;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      confirmedSummaryRef.current = cached;
      setSummary(cached);
    } else {
      confirmedSummaryRef.current = EMPTY_SUMMARY;
      setSummary(EMPTY_SUMMARY);
    }
    const scopeEpoch = ++scopeEpochRef.current;
    if (!slug) return;

    void AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (!cancelled && scopeEpoch === scopeEpochRef.current && inFlightOpRef.current === null && raw) {
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed?.likesCount === "number") {
              const hydrated: HymnSummary = {
                likesCount: Math.max(0, parsed.likesCount || 0),
                dislikesCount:
                  isAdmin && typeof parsed.dislikesCount === "number"
                    ? Math.max(0, parsed.dislikesCount)
                    : null,
                commentsCount: Math.max(0, parsed.commentsCount || 0),
                myReaction:
                  userRef.current && (parsed.myReaction === 1 || parsed.myReaction === -1)
                    ? parsed.myReaction
                    : 0,
              };
              confirmedSummaryRef.current = hydrated;
              memoryCache.set(cacheKey, hydrated);
              setSummary(hydrated);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) void refresh();
      });

    return () => {
      cancelled = true;
      ++scopeEpochRef.current;
    };
  }, [cacheKey, isAdmin, refresh, slug, token, userId]);

  const applyDelta = useCallback(
    (base: HymnSummary, nextReaction: 1 | -1 | 0): HymnSummary => {
      const prevReaction = base.myReaction;
      let nextLikes = base.likesCount;
      if (prevReaction === 1) nextLikes = Math.max(0, nextLikes - 1);
      if (nextReaction === 1) nextLikes += 1;

      let nextDislikes = base.dislikesCount;
      if (isAdmin) {
        const curDis = typeof nextDislikes === "number" ? nextDislikes : 0;
        let d = curDis;
        if (prevReaction === -1) d = Math.max(0, d - 1);
        if (nextReaction === -1) d += 1;
        nextDislikes = d;
      }

      return {
        ...base,
        likesCount: nextLikes,
        dislikesCount: nextDislikes,
        myReaction: nextReaction,
      };
    },
    [isAdmin],
  );

  const flushQueue = useCallback(
    async (scopeEpoch: number) => {
      if (inFlightOpRef.current !== null || !slug) return;
      const op = {};
      inFlightOpRef.current = op;
      try {
        while (desiredReactionRef.current !== null) {
          const target = desiredReactionRef.current;
          desiredReactionRef.current = null;
          await api(`/hymns/${slug}/reaction`, "POST", { reaction: target });
          if (scopeEpoch !== scopeEpochRef.current) return;
          confirmedSummaryRef.current = applyDelta(confirmedSummaryRef.current, target);
        }
      } catch (e) {
        if (scopeEpoch !== scopeEpochRef.current) return;
        desiredReactionRef.current = null;
        const rollback = confirmedSummaryRef.current;
        summaryRef.current = rollback;
        setSummary(rollback);
        setCachedSummary(cacheKey, rollback);
        setErrorMessage(communityError(e, es));
      } finally {
        if (inFlightOpRef.current === op) {
          inFlightOpRef.current = null;
        }
      }
    },
    [api, applyDelta, cacheKey, es, slug],
  );

  const react = useCallback(
    (target: 1 | -1) => {
      if (!slug) return false;
      setErrorMessage("");
      const activeUser = userRef.current;
      if (!activeUser) {
        Haptics.selectionAsync();
        openAuthSheet();
        return false;
      }
      if (!activeUser.emailVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setErrorMessage(
          es
            ? "Verifica tu correo en Cuenta para reaccionar."
            : "Verify your email in Account to react.",
        );
        openAuthSheet();
        return false;
      }

      const before = summaryRef.current;
      const prevReaction = before.myReaction;
      const nextReaction: 1 | -1 | 0 = prevReaction === target ? 0 : target;
      const scopeEpoch = scopeEpochRef.current;

      if (inFlightOpRef.current === null && desiredReactionRef.current === null) {
        confirmedSummaryRef.current = before;
      }

      const optimistic = applyDelta(before, nextReaction);
      summaryRef.current = optimistic;
      setSummary(optimistic);
      setCachedSummary(cacheKey, optimistic);

      desiredReactionRef.current = nextReaction;
      void flushQueue(scopeEpoch);
      return true;
    },
    [applyDelta, cacheKey, es, flushQueue, openAuthSheet, slug],
  );

  return {
    slug,
    commentVerseId: `hymn-${slug}`,
    summary,
    isAdmin,
    errorMessage,
    react,
    refresh,
  };
}
