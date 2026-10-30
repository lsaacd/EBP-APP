/**
 * NowPlayingContext — Global audio state for the entire app (iOS & Android).
 *
 * Uses react-native-track-player via the shared, UI-independent controller in
 * `audio/native-player.ts` for lock screen controls, Control Center (iOS),
 * Dynamic Island (iOS), and notification media controls (Android).
 */
import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { nativePlayer } from '../audio/native-player';
import { refreshOfflineAudio } from '../audio/offline-audio';

const LAST_PLAYED_STORAGE_KEY = '@ebp_last_played_hymn_id';

interface NowPlayingState {
  isLoading?: boolean;
  playbackError?: string | null;
  /** The hymn ID currently loaded (null = nothing loaded) */
  currentHymnId: string | null;
  /** The last hymn ID played in this or a previous session */
  lastPlayedHymnId: string | null;
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Whether the full-screen player modal is open */
  showFullPlayer: boolean;
  /** Shuffle mode */
  isShuffled: boolean;
  /** Repeat mode */
  repeatMode: 'off' | 'all' | 'one';
  /** The list of hymn IDs currently in the playback queue (for playlists) */
  currentQueueIds: string[] | null;
  /** Set a custom playback queue */
  setQueue: (ids: string[] | null) => void;
  /** Open the full-screen player for a specific hymn */
  openPlayer: (hymnId: string, queueIds?: string[] | null) => void;
  /** Close the full-screen player (audio keeps playing) */
  closeFullPlayer: () => void;
  /** Fully stop and clear now-playing state */
  clearNowPlaying: () => void;
  /** Play / Pause toggle */
  togglePlayPause: () => void;
  /** Skip to next track */
  skipNext: () => void;
  /** Skip to previous track */
  skipPrev: () => void;
  /** Change the current track (used internally by the full player) */
  setCurrentHymnId: (id: string, queueIds?: string[] | null) => void;
  /** Toggle shuffle */
  toggleShuffle: () => void;
  /** Cycle repeat mode */
  cycleRepeat: () => void;
}

const NowPlayingContext = createContext<NowPlayingState | null>(null);

export function useNowPlaying() {
  const ctx = useContext(NowPlayingContext);
  if (!ctx) throw new Error('useNowPlaying must be inside NowPlayingProvider');
  return ctx;
}

export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(nativePlayer.subscribe, nativePlayer.getSnapshot);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [lastPlayedHymnId, setLastPlayedHymnId] = useState<string | null>(null);

  useEffect(() => {
    void refreshOfflineAudio();
    AsyncStorage.getItem(LAST_PLAYED_STORAGE_KEY)
      .then((stored) => {
        if (stored) setLastPlayedHymnId(stored);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!snapshot.currentHymnId) {
      setShowFullPlayer(false);
    } else {
      setLastPlayedHymnId(snapshot.currentHymnId);
      AsyncStorage.setItem(LAST_PLAYED_STORAGE_KEY, snapshot.currentHymnId).catch(() => {});
    }
  }, [snapshot.currentHymnId]);

  return (
    <NowPlayingContext.Provider
      value={{
        currentHymnId: snapshot.currentHymnId,
        lastPlayedHymnId,
        isPlaying: snapshot.isPlaying,
        isLoading: snapshot.isLoading,
        playbackError: snapshot.error,
        isShuffled: snapshot.isShuffled,
        repeatMode: snapshot.repeatMode,
        currentQueueIds: snapshot.currentQueueIds,
        showFullPlayer,
        setQueue: nativePlayer.setQueue,
        openPlayer: (id, ids) => {
          setShowFullPlayer(true);
          void nativePlayer.open(String(id), ids);
        },
        closeFullPlayer: () => setShowFullPlayer(false),
        clearNowPlaying: () => {
          setShowFullPlayer(false);
          void nativePlayer.clear();
        },
        togglePlayPause: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          void nativePlayer.toggle();
        },
        skipNext: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          void nativePlayer.next();
        },
        skipPrev: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          void nativePlayer.previous();
        },
        setCurrentHymnId: (id, ids) => {
          void nativePlayer.select(String(id), ids);
        },
        toggleShuffle: nativePlayer.toggleShuffle,
        cycleRepeat: () => {
          void nativePlayer.cycleRepeat();
        },
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
