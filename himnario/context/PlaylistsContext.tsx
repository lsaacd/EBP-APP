import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@himnario_playlists';

export interface Playlist {
  id: string;
  name: string;
  hymnIds: string[];
  createdAt: number;
}

interface PlaylistsContextType {
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  updatePlaylistName: (id: string, name: string) => void;
  addHymnToPlaylist: (playlistId: string, hymnId: string) => void;
  removeHymnFromPlaylist: (playlistId: string, hymnId: string) => void;
  isHymnInPlaylist: (playlistId: string, hymnId: string) => boolean;
  setAllPlaylists: (next: Playlist[]) => void;
}

const PlaylistsContext = createContext<PlaylistsContextType>({
  playlists: [],
  createPlaylist: () => {},
  deletePlaylist: () => {},
  updatePlaylistName: () => {},
  addHymnToPlaylist: () => {},
  removeHymnFromPlaylist: () => {},
  isHymnInPlaylist: () => false,
  setAllPlaylists: () => {},
});

export function PlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const playlistsRef = useRef<Playlist[]>([]);
  const mutatedBeforeHydrateRef = useRef(false);

  // Load persisted playlists on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mutatedBeforeHydrateRef.current || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return;
          playlistsRef.current = parsed;
          setPlaylists(parsed);
        } catch {}
      })
      .catch(() => {});
  }, []);

  const commitPlaylists = useCallback((updater: (prev: Playlist[]) => Playlist[]) => {
    mutatedBeforeHydrateRef.current = true;
    const next = updater(playlistsRef.current);
    playlistsRef.current = next;
    setPlaylists(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const cleanName = name.trim().slice(0, 100);
    if (!cleanName) return;
    const newPlaylist: Playlist = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: cleanName,
      hymnIds: [],
      createdAt: Date.now(),
    };
    commitPlaylists(prev => [...prev, newPlaylist]);
  }, [commitPlaylists]);

  const deletePlaylist = useCallback((id: string) => {
    commitPlaylists(prev => prev.filter(p => p.id !== id));
  }, [commitPlaylists]);

  const updatePlaylistName = useCallback((id: string, name: string) => {
    const cleanName = name.trim().slice(0, 100);
    if (!cleanName) return;
    commitPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: cleanName } : p));
  }, [commitPlaylists]);

  const addHymnToPlaylist = useCallback((playlistId: string, hymnId: string) => {
    commitPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.hymnIds.includes(hymnId)) {
        return { ...p, hymnIds: [...p.hymnIds, hymnId] };
      }
      return p;
    }));
  }, [commitPlaylists]);

  const removeHymnFromPlaylist = useCallback((playlistId: string, hymnId: string) => {
    commitPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, hymnIds: p.hymnIds.filter(id => id !== hymnId) };
      }
      return p;
    }));
  }, [commitPlaylists]);

  const isHymnInPlaylist = useCallback((playlistId: string, hymnId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.hymnIds.includes(hymnId) : false;
  }, [playlists]);

  const setAllPlaylists = useCallback((next: Playlist[]) => {
    commitPlaylists(() => Array.isArray(next) ? next : []);
  }, [commitPlaylists]);

  return (
    <PlaylistsContext.Provider value={{
      playlists,
      createPlaylist,
      deletePlaylist,
      updatePlaylistName,
      addHymnToPlaylist,
      removeHymnFromPlaylist,
      isHymnInPlaylist,
      setAllPlaylists,
    }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export const usePlaylists = () => useContext(PlaylistsContext);
