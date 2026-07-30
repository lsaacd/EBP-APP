/**
 * NowPlayingContext — Global audio state for the entire app.
 *
 * Uses react-native-track-player for native lock screen controls,
 * Dynamic Island (iOS), Control Center (iOS), and notification
 * media controls (Android).
 *
 * Powers both the full-screen MusicPlayer modal and the floating MiniPlayer.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import TrackPlayer, {
  Capability,
  State,
  AppKilledPlaybackBehavior,
  useTrackPlayerEvents,
  Event,
  RepeatMode,
} from 'react-native-track-player';
import { Asset } from 'expo-asset';
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
// Track Player Setup (run once)
// ─────────────────────────────────────────────────────────────
let isPlayerReady = false;

async function setupPlayer() {
  if (isPlayerReady) return;
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
    });
    isPlayerReady = true;
  } catch (e) {
    // Player might already be set up (e.g., after a hot reload)
    console.warn('[TrackPlayer] Setup warning:', e);
    isPlayerReady = true;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: resolve require() asset to a local file URI
// ─────────────────────────────────────────────────────────────
async function resolveAudioUri(requireSource: any): Promise<string | null> {
  try {
    const asset = Asset.fromModule(requireSource);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    return asset.localUri || asset.uri;
  } catch (e) {
    console.warn('[TrackPlayer] Failed to resolve audio asset:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const [currentHymnId, setCurrentHymnIdState] = useState<string | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const currentHymnIdRef = useRef<string | null>(null);

  // Initialize TrackPlayer once
  useEffect(() => {
    setupPlayer();
  }, []);

  // NOTE: We intentionally do NOT use the useIsPlaying() hook here.
  // On Android, ExoPlayer can report State.Ready instead of State.Playing,
  // causing the hook to return playing=false even when audio is playing.
  // Instead, we track isPlaying manually via our own play/pause calls
  // and also listen for native events as a safety net (see below).

  // Listen for track-ended and remote-control events
  useTrackPlayerEvents(
    [
      Event.PlaybackQueueEnded,
      Event.RemoteNext,
      Event.RemotePrevious,
      Event.RemotePlay,
      Event.RemotePause,
    ],
    async (event) => {
      if (event.type === Event.PlaybackQueueEnded) {
        // Handle repeat / auto-advance
        if (repeatMode === 'one') {
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
        } else {
          handleSkipNext();
        }
      } else if (event.type === Event.RemoteNext) {
        handleSkipNext();
      } else if (event.type === Event.RemotePrevious) {
        handleSkipPrev();
      } else if (event.type === Event.RemotePlay) {
        await TrackPlayer.play();
        setIsPlaying(true);
      } else if (event.type === Event.RemotePause) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      }
    }
  );

  // ── Load & play a track ──────────────────────────────────
  const loadAndPlay = useCallback(async (hymnId: string) => {
    if (!isPlayerReady) await setupPlayer();

    const audioSource = getHymnAudio(hymnId);
    if (!audioSource) return;

    const uri = await resolveAudioUri(audioSource);
    if (!uri) return;

    // Find hymn data for metadata
    const activeData = hymnId.startsWith('E') ? estribillosData : hymnsData;
    const hymn = activeData.find((h: any) => String(h.id) === String(hymnId));

    // Resolve album artwork for lock screen / Control Center / Dynamic Island
    let artworkUri: string | undefined;
    try {
      const coverAsset = Asset.fromModule(require('../assets/images/EBP_HYMN_COVER.png'));
      if (!coverAsset.localUri) await coverAsset.downloadAsync();
      artworkUri = coverAsset.localUri || coverAsset.uri;
    } catch (e) {
      console.warn('[TrackPlayer] Could not resolve artwork:', e);
    }

    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: hymnId,
      url: uri,
      title: hymn?.title || `Himno ${hymnId}`,
      artist: hymn?.author || 'Himnario El Buen Pastor',
      artwork: artworkUri,
    });
    await TrackPlayer.play();
    setIsPlaying(true);
  }, []);

  // ── Controls ──────────────────────────────────────────────

  const setCurrentHymnId = useCallback((id: string) => {
    setCurrentHymnIdState(id);
    currentHymnIdRef.current = id;
    loadAndPlay(id);
  }, [loadAndPlay]);

  const openPlayer = useCallback((hymnId: string) => {
    const alreadyLoaded = currentHymnIdRef.current === hymnId;
    setCurrentHymnIdState(hymnId);
    currentHymnIdRef.current = hymnId;
    setShowFullPlayer(true);
    // Only reload the track if it's a different hymn — preserve position otherwise
    if (!alreadyLoaded) {
      loadAndPlay(hymnId);
    }
  }, [loadAndPlay]);

  const closeFullPlayer = useCallback(() => {
    setShowFullPlayer(false);
    // Audio keeps playing — mini-player shows
  }, []);

  const clearNowPlaying = useCallback(async () => {
    await TrackPlayer.reset();
    setCurrentHymnIdState(null);
    currentHymnIdRef.current = null;
    setShowFullPlayer(false);
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Always ask the native player for the real state to avoid
    // any stale-closure or event-listener race on Android.
    const currentlyPlaying = await TrackPlayer.getPlayWhenReady();
    if (currentlyPlaying) {
      await TrackPlayer.pause();
      setIsPlaying(false);
    } else {
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  }, []);

  // Web: spacebar to toggle play / pause
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentHymnIdRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // Compute the current index for next/prev
  const activeData = currentHymnIdRef.current?.startsWith('E') ? estribillosData : hymnsData;
  const currentIndex = currentHymnIdRef.current
    ? activeData.findIndex((h: any) => String(h.id) === String(currentHymnIdRef.current))
    : -1;

  const handleSkipNext = useCallback(() => {
    const cId = currentHymnIdRef.current;
    if (!cId) return;
    const data = cId.startsWith('E') ? estribillosData : hymnsData;
    const idx = data.findIndex((h: any) => String(h.id) === String(cId));

    if (isShuffled) {
      const others = data.filter(
        (_: any, i: number) => i !== idx && hasHymnAudio(String(_.id))
      );
      if (others.length > 0) {
        const pick = others[Math.floor(Math.random() * others.length)];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnIdState(String(pick.id));
        currentHymnIdRef.current = String(pick.id);
        loadAndPlay(String(pick.id));
      }
      return;
    }
    // Scan forward for the next hymn that has audio available
    for (let i = idx + 1; i < data.length; i++) {
      if (hasHymnAudio(String(data[i].id))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnIdState(String(data[i].id));
        currentHymnIdRef.current = String(data[i].id);
        loadAndPlay(String(data[i].id));
        return;
      }
    }
  }, [isShuffled, loadAndPlay]);

  const handleSkipPrev = useCallback(() => {
    const cId = currentHymnIdRef.current;
    if (!cId) return;
    const data = cId.startsWith('E') ? estribillosData : hymnsData;
    const idx = data.findIndex((h: any) => String(h.id) === String(cId));

    for (let i = idx - 1; i >= 0; i--) {
      if (hasHymnAudio(String(data[i].id))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentHymnIdState(String(data[i].id));
        currentHymnIdRef.current = String(data[i].id);
        loadAndPlay(String(data[i].id));
        return;
      }
    }
  }, [loadAndPlay]);

  const skipNext = handleSkipNext;
  const skipPrev = handleSkipPrev;

  const toggleShuffle = useCallback(() => {
    setIsShuffled((p) => !p);
  }, []);

  const cycleRepeat = useCallback(async () => {
    setRepeatMode((m) => {
      const next = m === 'off' ? 'all' : m === 'all' ? 'one' : 'off';
      // Also sync with TrackPlayer's native repeat mode
      if (next === 'one') {
        TrackPlayer.setRepeatMode(RepeatMode.Track);
      } else if (next === 'all') {
        TrackPlayer.setRepeatMode(RepeatMode.Queue);
      } else {
        TrackPlayer.setRepeatMode(RepeatMode.Off);
      }
      return next;
    });
  }, []);

  return (
    <NowPlayingContext.Provider
      value={{
        currentHymnId: currentHymnIdRef.current ?? null,
        isPlaying,
        showFullPlayer,
        isShuffled,
        repeatMode,
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
