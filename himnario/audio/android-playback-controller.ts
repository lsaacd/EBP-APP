/** UI-independent state and commands shared by Android screens and the headless service. */
export type PlaybackSnapshot = {
  currentHymnId: string | null;
  currentQueueIds: string[] | null;
  isPlaying: boolean;
  isLoading: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  error: string | null;
};

export interface PlaybackDriver {
  prepare(): Promise<void>;
  load(id: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  reset(): Promise<void>;
  seek(position: number): Promise<void>;
  getPlayWhenReady(): Promise<boolean>;
  setRepeatOne(enabled: boolean): Promise<void>;
  hasAudio(id: string): boolean;
  collection(id: string): string[];
  report(error: unknown): void;
}

export function createAndroidPlaybackController(driver: PlaybackDriver) {
  let state: PlaybackSnapshot = {
    currentHymnId: null, currentQueueIds: null, isPlaying: false,
    isLoading: false, isShuffled: false, repeatMode: 'off', error: null,
  };
  const listeners = new Set<() => void>();
  let pending = Promise.resolve();
  let resumeAfterInterruption = false;

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

  async function load(id: string) {
    if (!driver.hasAudio(id)) throw new Error(`No recording registered for ${id}`);
    update({ currentHymnId: id, isLoading: true, isPlaying: false, error: null });
    try {
      await driver.prepare();
      await driver.load(id);
      await driver.setRepeatOne(state.repeatMode === 'one');
      await driver.play();
      update({ currentHymnId: id, isPlaying: true, isLoading: false });
    } catch (error) {
      // Keep the requested item visible so its Play button can retry loading it.
      throw error;
    }
  }

  async function advance(direction: 1 | -1) {
    const id = state.currentHymnId;
    if (!id) return;
    const custom = state.currentQueueIds;
    const ids = (custom?.length ? custom : driver.collection(id)).filter(driver.hasAudio);
    const index = ids.indexOf(id);
    if (!ids.length || index < 0) return;
    if (direction === 1 && state.isShuffled) {
      const others = ids.filter(candidate => candidate !== id);
      if (others.length) await load(others[Math.floor(Math.random() * others.length)]);
      return;
    }
    let next = index + direction;
    if (next < 0 || next >= ids.length) {
      // Preserve existing custom-playlist wraparound; global collections wrap on repeat-all.
      if (!custom?.length && state.repeatMode !== 'all') return;
      next = (next + ids.length) % ids.length;
    }
    await load(ids[next]);
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
      return command(async () => {
        if (ids !== undefined) update({ currentQueueIds: ids ? ids.map(String) : null });
        if (state.currentHymnId !== id || state.error) await load(id);
      });
    },
    select(id: string, ids?: string[] | null) {
      return command(async () => {
        if (ids !== undefined) update({ currentQueueIds: ids ? ids.map(String) : null });
        await load(id);
      });
    },
    next: () => command(() => advance(1)),
    previous: () => command(() => advance(-1)),
    play: () => command(async () => {
      if (!state.currentHymnId) return;
      if (state.error) await load(state.currentHymnId);
      else { await driver.play(); update({ isPlaying: true, error: null }); }
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
      const playing = await driver.getPlayWhenReady();
      if (playing) await driver.pause(); else await driver.play();
      update({ isPlaying: !playing });
    }),
    clear: () => command(async () => {
      resumeAfterInterruption = false;
      await driver.reset();
      update({ currentHymnId: null, currentQueueIds: null, isPlaying: false, isLoading: false, error: null });
    }),
    seek: (position: number) => command(async () => {
      if (Number.isFinite(position)) await driver.seek(Math.max(0, position));
    }),
    toggleShuffle() { update({ isShuffled: !state.isShuffled }); },
    cycleRepeat: () => command(async () => {
      const mode = state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off';
      await driver.setRepeatOne(mode === 'one');
      update({ repeatMode: mode });
    }),
    ended: () => command(async () => {
      update({ isPlaying: false });
      if (state.repeatMode === 'one') {
        await driver.seek(0); await driver.play(); update({ isPlaying: true });
      } else await advance(1);
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
      update({ isPlaying: playing, isLoading: loading });
    },
    playbackError(error: unknown) {
      driver.report(error);
      update({ isPlaying: false, isLoading: false, error: 'No se pudo reproducir el audio. Intenta nuevamente.' });
    },
  };
}
