/**
 * NowPlayingContext — Global audio state for the entire app (iOS & Android).
 *
 * Uses react-native-track-player via the shared, UI-independent controller in
 * `audio/native-player.ts` for lock screen controls, Control Center (iOS),
 * Dynamic Island (iOS), and notification media controls (Android).
 */
import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../utils/haptics';
import { nativePlayer, setTrackTitleResolver } from '../audio/native-player';
import { refreshOfflineAudio } from '../audio/offline-audio';
import { useLanguage } from './LanguageContext';
import { ALABANZAS_ENGLISH } from '../data/alabanzasEnglish';

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
  /** Live rendered height of the floating MiniPlayer bar */
  miniPlayerHeight: number;
  /** Report the measured MiniPlayer bar height from RootLayout */
  setMiniPlayerHeight: (height: number) => void;
  /** Shuffle mode */
  isShuffled: boolean;
  /** Repeat mode */
  repeatMode: 'off' | 'all' | 'one';
  /** Current playback speed multiplier (default 1) */
  playbackRate: number;
  /** The list of hymn IDs currently in the playback queue (for playlists / favorites) */
  currentQueueIds: string[] | null;
  /** Optional human-readable label for the active queue (e.g. "Mis Favoritos" or playlist name) */
  queueLabel: string | null;
  /** Set a custom playback queue */
  setQueue: (ids: string[] | null, label?: string | null) => void;
  /** Change playback speed (e.g. 0.75, 0.85, 1, 1.15, 1.25, 1.5) */
  setPlaybackRate: (rate: number) => void;
  /** Open the full-screen player for a specific hymn */
  openPlayer: (
    hymnId: string,
    queueIds?: string[] | null,
    opts?: { label?: string | null; shuffle?: boolean },
  ) => void;
  /** Close the full-screen player (audio keeps playing) */
  closeFullPlayer: () => void;
  /** Fully stop and clear now-playing state */
  clearNowPlaying: () => void;
  /** Play / Pause toggle */
  togglePlayPause: () => void;
  /** Skip to next track */
  skipNext: (opts?: { silent?: boolean }) => void;
  /** Skip to previous track */
  skipPrev: (opts?: { silent?: boolean }) => void;
  /** Change the current track (used internally by the full player) */
  setCurrentHymnId: (id: string, queueIds?: string[] | null) => void;
  /** Toggle shuffle */
  toggleShuffle: () => void;
  /** Deterministically set shuffle mode */
  setShuffle: (enabled: boolean) => void;
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
  const { language, hymnLanguage } = useLanguage();
  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;
  const snapshot = useSyncExternalStore(nativePlayer.subscribe, nativePlayer.getSnapshot);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [miniPlayerHeight, setMiniPlayerHeight] = useState(0);
  const [lastPlayedHymnId, setLastPlayedHymnId] = useState<string | null>(null);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);

  useEffect(() => {
    setTrackTitleResolver((id, fallbackTitle) =>
      displayHymnLang === 'en' ? ALABANZAS_ENGLISH[id]?.title || fallbackTitle : fallbackTitle,
    );
  }, [displayHymnLang]);

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
        playbackRate: snapshot.playbackRate ?? 1,
        currentQueueIds: snapshot.currentQueueIds,
        queueLabel,
        showFullPlayer,
        miniPlayerHeight,
        setMiniPlayerHeight: (height: number) => {
          if (height > 0) {
            setMiniPlayerHeight((prev) => (Math.abs(prev - height) < 1 ? prev : height));
          }
        },
        setQueue: (ids, label) => {
          if (label !== undefined) setQueueLabel(label);
          else if (!ids) setQueueLabel(null);
          nativePlayer.setQueue(ids);
        },
        setPlaybackRate: (rate: number) => {
          void nativePlayer.setPlaybackRate(rate);
        },
        openPlayer: (id, ids, opts) => {
          if (opts?.shuffle !== undefined) {
            nativePlayer.setShuffle(opts.shuffle);
          }
          if (opts?.label !== undefined) {
            setQueueLabel(opts.label);
          } else if (ids === null) {
            setQueueLabel(null);
          }
          setShowFullPlayer(true);
          if (String(id) !== snapshot.currentHymnId || snapshot.error || ids !== undefined) void nativePlayer.open(String(id), ids);
        },
        closeFullPlayer: () => setShowFullPlayer(false),
        clearNowPlaying: () => {
          setShowFullPlayer(false);
          setQueueLabel(null);
          void nativePlayer.clear();
        },
        togglePlayPause: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          void nativePlayer.toggle();
        },
        skipNext: (opts) => {
          if (!opts?.silent) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          void nativePlayer.next();
        },
        skipPrev: (opts) => {
          if (!opts?.silent) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          void nativePlayer.previous();
        },
        setCurrentHymnId: (id, ids) => {
          void nativePlayer.select(String(id), ids);
        },
        toggleShuffle: nativePlayer.toggleShuffle,
        setShuffle: nativePlayer.setShuffle,
        cycleRepeat: () => {
          void nativePlayer.cycleRepeat();
        },
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
