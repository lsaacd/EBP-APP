import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@himnario_favorites';

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  setAllFavorites: (ids: string[]) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  setAllFavorites: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load persisted favorites on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setFavoriteIds(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAllFavorites = useCallback((ids: string[]) => {
    const clean = Array.from(new Set(ids.map((x) => String(x)))).filter(Boolean);
    setFavoriteIds(clean);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean)).catch(() => {});
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, setAllFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
