/**
 * NowPlayingContext — Global audio state for the entire app.
 *
 * Owns the `useAudioPlayer` hook so audio persists across screens.
 * Powers both the full-screen MusicPlayer modal and the floating MiniPlayer.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { getHymnAudio, hasHymnAudio } from '../data/audioRegistry';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface NowPlayingState {
  /** The hymn ID currently loaded (null = nothing loaded) */
  currentHymnId: string | null;
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Whether the full-screen player modal is open */
  showFullPlayer: boolean;
  /** Shuffle mode */
  isShuffled: boolean;
  /** Repeat mode */
  repeatMode: 'off' | 'all' | 'one';
  /** The expo-audio player instance (for ProgressSection / status) */
  player: ReturnType<typeof useAudioPlayer>;
  /** Open the full-screen player for a specific hymn */
  openPlayer: (hymnId: string) => void;
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
  setCurrentHymnId: (id: string) => void;
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

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const [currentHymnId, setCurrentHymnId] = useState<string | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const handleFinishRef = useRef<() => void>(() => {});

  // Resolve audio source from the current hymn ID
  const audioSource = currentHymnId ? getHymnAudio(currentHymnId) : null;
  const player = useAudioPlayer(audioSource ?? null);

  // Audio mode (run once)
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
  }, []);


  // Track play state reactively
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      setIsPlaying((prev) => (prev !== status.playing ? status.playing : prev));
      if (status.didJustFinish) handleFinishRef.current();
    });
    return () => sub.remove();
  }, [player]);

  // Compute the current index for next/prev
  const activeData = currentHymnId?.startsWith('E') ? estribillosData : hymnsData;
  const currentIndex = currentHymnId
    ? activeData.findIndex((h: any) => String(h.id) === String(currentHymnId))
    : -1;

  // ── Controls ──────────────────────────────────────────────

  const openPlayer = useCallback((hymnId: string) => {
    setCurrentHymnId(hymnId);
    setShowFullPlayer(true);
    // Auto-play is handled by the useEffect below that watches currentHymnId + player
  }, []);

  const closeFullPlayer = useCallback(() => {
    setShowFullPlayer(false);
    // Audio keeps playing — mini-player shows
  }, []);

  const clearNowPlaying = useCallback(() => {
    player.pause();
    setCurrentHymnId(null);
    setShowFullPlayer(false);
    setIsPlaying(false);
  }, [player]);

  const togglePlayPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player.playing) { player.pause(); } else { player.play(); }
  }, [player]);

  // Web: spacebar to toggle play / pause
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only act when a hymn is loaded
      if (!currentHymnId) return;

      // Don't hijack spacebar when the user is typing in an input field
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      // Also skip contentEditable elements
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // prevent page scroll
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentHymnId, togglePlayPause]);

  const skipNext = useCallback(() => {
    if (isShuffled) {
      // Shuffle: pick a random hymn that has audio
      const others = activeData.filter(
        (_: any, i: number) => i !== currentIndex && hasHymnAudio(String(_.id))
      );
      if (others.length > 0) {
        const pick = others[Math.floor(Math.random() * others.length)];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnId(String(pick.id));
      }
      return;
    }
    // Scan forward for the next hymn that has audio available
    for (let i = currentIndex + 1; i < activeData.length; i++) {
      if (hasHymnAudio(String(activeData[i].id))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnId(String(activeData[i].id));
        return;
      }
    }
  }, [currentIndex, isShuffled]);

  const skipPrev = useCallback(() => {
    // Scan backward for the previous hymn that has audio available
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (hasHymnAudio(String(activeData[i].id))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnId(String(activeData[i].id));
        return;
      }
    }
  }, [currentIndex]);

  // Auto-play when hymn ID changes (track switch)
  // IMPORTANT: `player` is in the dep array so we always reference the FRESH
  // player instance returned by useAudioPlayer after the source swap.
  const prevIdRef = useRef(currentHymnId);
  useEffect(() => {
    if (currentHymnId && currentHymnId !== prevIdRef.current && audioSource) {
      const t = setTimeout(() => {
        try {
          player.seekTo(0);
          player.play();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          console.warn('[NowPlaying] auto-play failed (player not ready):', e);
        }
      }, 250);
      prevIdRef.current = currentHymnId;
      return () => clearTimeout(t);
    }
    prevIdRef.current = currentHymnId;
  }, [currentHymnId, audioSource, player]);

  // Auto-advance / repeat on finish
  const handleFinish = useCallback(() => {
    if (repeatMode === 'one') { player.seekTo(0); player.play(); return; }
    skipNext();
  }, [repeatMode, skipNext, player]);

  useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((p) => !p);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }, []);

  return (
    <NowPlayingContext.Provider
      value={{
        currentHymnId,
        isPlaying,
        showFullPlayer,
        isShuffled,
        repeatMode,
        player,
        openPlayer,
        closeFullPlayer,
        clearNowPlaying,
        togglePlayPause,
        skipNext,
        skipPrev,
        setCurrentHymnId,
        toggleShuffle,
        cycleRepeat,
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
