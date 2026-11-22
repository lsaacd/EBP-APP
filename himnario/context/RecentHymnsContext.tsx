import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@himnario_recent';
const MAX_RECENT = 10; // keep last 10 hymns

interface RecentHymnsContextType {
  recentIds: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
  setAllRecents: (ids: string[]) => void;
}

const RecentHymnsContext = createContext<RecentHymnsContextType>({
  recentIds: [],
  addRecent: () => {},
  clearRecent: () => {},
  setAllRecents: () => {},
});

export function RecentHymnsProvider({ children }: { children: React.ReactNode }) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const recentRef = useRef<string[]>([]);
  const hydratedRef = useRef(false);
  const replacedRef = useRef(false);

  // Load persisted list on mount and merge with any early deep-link additions
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        hydratedRef.current = true;
        if (replacedRef.current || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return;
          const stored = parsed.map((x) => String(x)).filter(Boolean);
          const merged = Array.from(new Set([...recentRef.current, ...stored])).slice(0, MAX_RECENT);
          recentRef.current = merged;
          setRecentIds(merged);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
        } catch {}
      })
      .catch(() => {
        hydratedRef.current = true;
      });
  }, []);

  const addRecent = useCallback((id: string) => {
    const cleanId = String(id);
    if (!cleanId) return;
    const next = [cleanId, ...recentRef.current.filter((x) => x !== cleanId)].slice(0, MAX_RECENT);
    recentRef.current = next;
    setRecentIds(next);
    if (hydratedRef.current || replacedRef.current) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    }
  }, []);

  const clearRecent = useCallback(() => {
    replacedRef.current = true;
    recentRef.current = [];
    setRecentIds([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const setAllRecents = useCallback((ids: string[]) => {
    replacedRef.current = true;
    const clean = Array.from(new Set(ids.map((x) => String(x)))).filter(Boolean).slice(0, MAX_RECENT);
    recentRef.current = clean;
    setRecentIds(clean);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean)).catch(() => {});
  }, []);

  return (
    <RecentHymnsContext.Provider value={{ recentIds, addRecent, clearRecent, setAllRecents }}>
      {children}
    </RecentHymnsContext.Provider>
  );
}

export const useRecentHymns = () => useContext(RecentHymnsContext);
