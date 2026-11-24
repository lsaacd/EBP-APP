/** UI-independent state and commands shared by Android screens and the headless service. */
export type PlaybackSnapshot = {
  currentHymnId: string | null;
  currentQueueIds: string[] | null;
  isPlaying: boolean;
  isLoading: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackRate: number;
  error: string | null;
};

export interface PlaybackDriver {
  prepare(): Promise<void>;
  load(id: string): Promise<void>;
  prefetch?(id: string): void;
  play(): Promise<void>;
  pause(): Promise<void>;
  reset(): Promise<void>;
  seek(position: number): Promise<void>;
  setRate?(rate: number): Promise<void>;
  getPlayWhenReady(): Promise<boolean>;
  setRepeatOne(enabled: boolean): Promise<void>;
  hasAudio(id: string): boolean;
  collection(id: string): string[];
  report(error: unknown): void;
}

export function createAndroidPlaybackController(driver: PlaybackDriver) {
  let state: PlaybackSnapshot = {
    currentHymnId: null, currentQueueIds: null, isPlaying: false,
    isLoading: false, isShuffled: false, repeatMode: 'off', playbackRate: 1, error: null,
  };
  const listeners = new Set<() => void>();
  let pending = Promise.resolve();
  let resumeAfterInterruption = false;
  let activeLoads = 0;
  let reachedTrackEnd = false;

  function update(patch: Partial<PlaybackSnapshot>) {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  }

  // UI taps and notification actions must never interleave reset/add/play calls.
  function command(action: () => Promise<void>): Promise<void> {
    const result = pending.then(action).catch(error => {
      driver.report(error);
      update({ isLoading: false, isPlaying: false, error: 'No se pudo reproducir el audio. Intenta nuevamente.' });
    });
    pending = result;
    return result;
  }

  function resolveNeighborId(fromId: string, direction: 1 | -1): string | null {
    const custom = state.currentQueueIds;
    const ids = (custom?.length ? custom : driver.collection(fromId)).filter(driver.hasAudio);
    const index = ids.indexOf(fromId);
    if (!ids.length || index < 0) return null;
    if (direction === 1 && state.isShuffled) {
      const others = ids.filter(candidate => candidate !== fromId);
      return others.length ? others[Math.floor(Math.random() * others.length)] : null;
    }
    let next = index + direction;
    if (next < 0 || next >= ids.length) {
      if (!custom?.length && state.repeatMode !== 'all') return null;
      next = (next + ids.length) % ids.length;
    }
    return ids[next] ?? null;
  }

  async function load(id: string) {
    if (!driver.hasAudio(id)) throw new Error(`No recording registered for ${id}`);
    activeLoads += 1;
    reachedTrackEnd = false;
    update({ currentHymnId: id, isLoading: true, isPlaying: false, error: null });
    try {
      await driver.prepare();
      await driver.load(id);
      await driver.setRepeatOne(state.repeatMode === 'one');
      await driver.play();
      if (state.playbackRate !== 1 && driver.setRate) {
        await driver.setRate(state.playbackRate);
      }
      update({ currentHymnId: id, isPlaying: true, isLoading: false });
      const upcomingId = resolveNeighborId(id, 1);
      if (upcomingId && upcomingId !== id) {
        try { driver.prefetch?.(upcomingId); } catch {}
      }
    } finally {
      activeLoads = Math.max(0, activeLoads - 1);
    }
  }

  function startTrackLoad(id: string) {
    reachedTrackEnd = false;
    // Optimistically update currentHymnId on tap so UI title/lyrics/mini-player snap immediately
    update({ currentHymnId: id, isLoading: true, error: null });
    return command(() => load(id));
  }

  function advance(direction: 1 | -1) {
    const id = state.currentHymnId;
    if (!id) return Promise.resolve();
    const targetId = resolveNeighborId(id, direction);
    if (!targetId) return Promise.resolve();
    return startTrackLoad(targetId);
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setQueue(ids: string[] | null) {
      update({ currentQueueIds: ids ? ids.map(String) : null });
    },
    open(id: string, ids?: string[] | null) {
      if (ids !== undefined) update({ currentQueueIds: ids ? ids.map(String) : null });
      if (state.currentHymnId !== id || state.error) {
        return startTrackLoad(id);
      }
      return Promise.resolve();
    },
    select(id: string, ids?: string[] | null) {
      if (ids !== undefined) update({ currentQueueIds: ids ? ids.map(String) : null });
      return startTrackLoad(id);
    },
    next: () => advance(1),
    previous: () => advance(-1),
    play: () => command(async () => {
      if (!state.currentHymnId) return;
      if (state.error) {
        await load(state.currentHymnId);
      } else {
        if (reachedTrackEnd) {
          await driver.seek(0);
          reachedTrackEnd = false;
        }
        await driver.play();
        if (state.playbackRate !== 1 && driver.setRate) {
          await driver.setRate(state.playbackRate);
        }
        update({ isPlaying: true, error: null });
      }
    }),
    pause: () => command(async () => {
      resumeAfterInterruption = false;
      await driver.pause();
      update({ isPlaying: false });
    }),
    toggle: () => command(async () => {
      resumeAfterInterruption = false;
      if (!state.currentHymnId) return;
      if (state.error) { await load(state.currentHymnId); return; }
      if (reachedTrackEnd) {
        await driver.seek(0);
        reachedTrackEnd = false;
        await driver.play();
        if (state.playbackRate !== 1 && driver.setRate) {
          await driver.setRate(state.playbackRate);
        }
        update({ isPlaying: true, error: null });
        return;
      }
      const playing = await driver.getPlayWhenReady();
      if (playing) await driver.pause();
      else {
        await driver.play();
        if (state.playbackRate !== 1 && driver.setRate) {
          await driver.setRate(state.playbackRate);
        }
      }
      update({ isPlaying: !playing });
    }),
    clear: () => command(async () => {
      resumeAfterInterruption = false;
      reachedTrackEnd = false;
      await driver.reset();
      update({ currentHymnId: null, currentQueueIds: null, isPlaying: false, isLoading: false, error: null });
    }),
    seek: (position: number) => command(async () => {
      if (Number.isFinite(position)) {
        reachedTrackEnd = false;
        await driver.seek(Math.max(0, position));
      }
    }),
    setPlaybackRate: (rate: number) => {
      const clamped = Math.max(0.5, Math.min(2, Number(rate) || 1));
      update({ playbackRate: clamped });
      return command(async () => {
        if (driver.setRate) await driver.setRate(clamped);
      });
    },
    toggleShuffle() { update({ isShuffled: !state.isShuffled }); },
    setShuffle(enabled: boolean) { update({ isShuffled: Boolean(enabled) }); },
    cycleRepeat: () => command(async () => {
      const mode = state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off';
      const wantOne = mode === 'one';
      await driver.setRepeatOne(wantOne);
      update({ repeatMode: mode });
    }),
    ended: () => command(async () => {
      update({ isPlaying: false });
      if (!state.currentHymnId) return;
      if (state.repeatMode === 'one') {
        reachedTrackEnd = false;
        await driver.seek(0);
        await driver.play();
        if (state.playbackRate !== 1 && driver.setRate) {
          await driver.setRate(state.playbackRate);
        }
        update({ isPlaying: true });
      } else {
        const targetId = resolveNeighborId(state.currentHymnId, 1);
        if (targetId) {
          reachedTrackEnd = false;
          await load(targetId);
        } else {
          reachedTrackEnd = true;
        }
      }
    }),
    interrupt: (event: { paused: boolean; permanent: boolean }) => command(async () => {
      if (event.permanent) {
        resumeAfterInterruption = false;
        await driver.pause();
        update({ isPlaying: false });
      } else if (event.paused) {
        // Repeated loss events must not overwrite the original resume intent.
        resumeAfterInterruption = resumeAfterInterruption || await driver.getPlayWhenReady();
        await driver.pause();
        update({ isPlaying: false });
      } else if (resumeAfterInterruption) {
        resumeAfterInterruption = false;
        await driver.play();
        update({ isPlaying: true });
      }
    }),
    playbackState(playing: boolean, loading: boolean) {
      if (activeLoads > 0) {
        update({ isLoading: true });
        return;
      }
      if (playing) reachedTrackEnd = false;
      update({ isPlaying: playing, isLoading: loading });
    },
    playbackError(error: unknown) {
      driver.report(error);
      update({ isPlaying: false, isLoading: false, error: 'No se pudo reproducir el audio. Intenta nuevamente.' });
    },
  };
}
