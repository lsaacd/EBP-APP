/**
 * Android offline audio: recordings stream from the audio host, and each one is
 * saved on the device the first time it plays so it works offline afterwards.
 * "Download all" saves every recording for full offline use.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { getAllAudioIds, getHymnAudio } from '../data/audioRegistry.android';

export type DownloadAllState = {
  status: 'idle' | 'downloading' | 'done' | 'error';
  saved: number;      // recordings stored on this device
  total: number;      // recordings available
  failed: number;     // failures in the current/last "download all" run
  bytes: number;      // space used by saved recordings
  cancelling: boolean;
};

const DIR = `${FileSystem.documentDirectory}hymn-audio/`;
const CONCURRENCY = 3;
const fileFor = (id: string) => `${DIR}hymn_${encodeURIComponent(id)}.m4a`;

const inFlight = new Map<string, Promise<boolean>>();
const listeners = new Set<() => void>();
let state: DownloadAllState = {
  status: 'idle', saved: 0, total: getAllAudioIds().length, failed: 0, bytes: 0, cancelling: false,
};
let cancelRequested = false;
let dirReady: Promise<void> | null = null;

function update(patch: Partial<DownloadAllState>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}

function ensureDir() {
  if (!dirReady) {
    dirReady = FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(async error => {
      const info = await FileSystem.getInfoAsync(DIR);
      if (!info.exists) { dirReady = null; throw error; }
    });
  }
  return dirReady;
}

async function savedSize(id: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(fileFor(id));
  return info.exists && !info.isDirectory && (info.size ?? 0) > 0 ? info.size ?? 0 : 0;
}

/** Saves one recording; resolves true when it is stored (or already was). */
export function saveHymnAudio(id: string): Promise<boolean> {
  const existing = inFlight.get(id);
  if (existing) return existing;
  const remote = getHymnAudio(id);
  if (!remote) return Promise.resolve(false);
  const target = fileFor(id);
  const partial = `${target}.part`;
  const job = (async () => {
    if (await savedSize(id)) return true;
    await ensureDir();
    try {
      const result = await FileSystem.downloadAsync(remote, partial);
      if (result.status !== 200) throw new Error(`HTTP ${result.status} for ${remote}`);
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.moveAsync({ from: partial, to: target });
      const size = await savedSize(id);
      update({ saved: state.saved + 1, bytes: state.bytes + size });
      return true;
    } catch (error) {
      await FileSystem.deleteAsync(partial, { idempotent: true }).catch(() => {});
      console.warn('[OfflineAudio] Could not save', id, error);
      return false;
    }
  })().finally(() => { inFlight.delete(id); });
  inFlight.set(id, job);
  return job;
}

/**
 * URI for playback: the saved file when available, otherwise the stream URL
 * (and the recording is saved in the background for next time).
 */
export async function resolvePlaybackUri(id: string): Promise<string> {
  const remote = getHymnAudio(id);
  if (!remote) throw new Error(`No recording registered for ${id}`);
  try {
    if (await savedSize(id)) return fileFor(id);
  } catch (error) {
    console.warn('[OfflineAudio] Saved file check failed', id, error);
  }
  void saveHymnAudio(id);
  return remote;
}

/** Recounts saved recordings and their size (used when Settings opens). */
export async function refreshOfflineAudio(): Promise<void> {
  try {
    await ensureDir();
    const names = new Set(await FileSystem.readDirectoryAsync(DIR));
    let saved = 0, bytes = 0;
    for (const id of getAllAudioIds()) {
      if (!names.has(`hymn_${encodeURIComponent(id)}.m4a`)) continue;
      const size = await savedSize(id);
      if (size) { saved += 1; bytes += size; }
    }
    update({ saved, bytes });
  } catch (error) {
    console.warn('[OfflineAudio] Refresh failed', error);
  }
}

/** Saves every recording not yet stored. Safe to call again to resume. */
export async function downloadAllHymnAudio(): Promise<void> {
  if (state.status === 'downloading') return;
  cancelRequested = false;
  update({ status: 'downloading', failed: 0, cancelling: false });
  await refreshOfflineAudio();
  const queue = [...getAllAudioIds()];
  let failed = 0;
  const worker = async () => {
    while (!cancelRequested) {
      const id = queue.shift();
      if (id === undefined) return;
      if (!(await saveHymnAudio(id))) failed += 1;
      update({ failed });
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  update({
    status: cancelRequested ? 'idle' : failed ? 'error' : 'done',
    failed, cancelling: false,
  });
}

/** Stops "download all" after the recordings in progress finish. */
export function cancelDownloadAll() {
  if (state.status !== 'downloading') return;
  cancelRequested = true;
  update({ cancelling: true });
}

/** Removes every saved recording (they will stream again when played). */
export async function deleteSavedHymnAudio(): Promise<void> {
  cancelRequested = true;
  await Promise.allSettled([...inFlight.values()]);
  await FileSystem.deleteAsync(DIR, { idempotent: true });
  dirReady = null;
  update({ status: 'idle', saved: 0, bytes: 0, failed: 0, cancelling: false });
}

export const offlineAudio = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
