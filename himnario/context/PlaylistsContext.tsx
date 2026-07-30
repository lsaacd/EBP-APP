import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const PlaylistsContext = createContext<PlaylistsContextType>({
  playlists: [],
  createPlaylist: () => {},
  deletePlaylist: () => {},
  updatePlaylistName: () => {},
  addHymnToPlaylist: () => {},
  removeHymnFromPlaylist: () => {},
  isHymnInPlaylist: () => false,
});

export function PlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load persisted playlists on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPlaylists(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const savePlaylists = (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaylists));
  };

  const createPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      hymnIds: [],
      createdAt: Date.now(),
    };
    savePlaylists([...playlists, newPlaylist]);
  }, [playlists]);

  const deletePlaylist = useCallback((id: string) => {
    savePlaylists(playlists.filter(p => p.id !== id));
  }, [playlists]);

  const updatePlaylistName = useCallback((id: string, name: string) => {
    savePlaylists(playlists.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  }, [playlists]);

  const addHymnToPlaylist = useCallback((playlistId: string, hymnId: string) => {
    savePlaylists(playlists.map(p => {
      if (p.id === playlistId && !p.hymnIds.includes(hymnId)) {
        return { ...p, hymnIds: [...p.hymnIds, hymnId] };
      }
      return p;
    }));
  }, [playlists]);

  const removeHymnFromPlaylist = useCallback((playlistId: string, hymnId: string) => {
    savePlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, hymnIds: p.hymnIds.filter(id => id !== hymnId) };
      }
      return p;
    }));
  }, [playlists]);

  const isHymnInPlaylist = useCallback((playlistId: string, hymnId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.hymnIds.includes(hymnId) : false;
  }, [playlists]);

  return (
    <PlaylistsContext.Provider value={{
      playlists,
      createPlaylist,
      deletePlaylist,
      updatePlaylistName,
      addHymnToPlaylist,
      removeHymnFromPlaylist,
      isHymnInPlaylist
    }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export const usePlaylists = () => useContext(PlaylistsContext);
