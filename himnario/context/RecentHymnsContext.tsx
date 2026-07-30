import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@himnario_recent';
const MAX_RECENT = 10; // keep last 10 hymns

interface RecentHymnsContextType {
  recentIds: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
}

const RecentHymnsContext = createContext<RecentHymnsContextType>({
  recentIds: [],
  addRecent: () => {},
  clearRecent: () => {},
});

export function RecentHymnsProvider({ children }: { children: React.ReactNode }) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load persisted list on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setRecentIds(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      // Move to front, deduplicate, cap at MAX_RECENT
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <RecentHymnsContext.Provider value={{ recentIds, addRecent, clearRecent }}>
      {children}
    </RecentHymnsContext.Provider>
  );
}

export const useRecentHymns = () => useContext(RecentHymnsContext);
