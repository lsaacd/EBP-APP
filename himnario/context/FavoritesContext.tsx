import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const favoritesRef = useRef<string[]>([]);
  const mutatedBeforeHydrateRef = useRef(false);

  // Load persisted favorites on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mutatedBeforeHydrateRef.current || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return;
          const clean = Array.from(new Set(parsed.map((x) => String(x)))).filter(Boolean);
          favoritesRef.current = clean;
          setFavoriteIds(clean);
        } catch {}
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    mutatedBeforeHydrateRef.current = true;
    const prev = favoritesRef.current;
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    favoritesRef.current = next;
    setFavoriteIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setAllFavorites = useCallback((ids: string[]) => {
    mutatedBeforeHydrateRef.current = true;
    const clean = Array.from(new Set(ids.map((x) => String(x)))).filter(Boolean);
    favoritesRef.current = clean;
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
