/**
 * Offline audio (iOS & Android): recordings stream from Cloudflare R2, and each
 * one is saved on the device the first time it plays so it works offline
 * afterwards. "Download all" saves every recording for full offline use.
 *
 * iOS storage rule: Apple's iOS Data Storage Guidelines require re-downloadable
 * content to be excluded from iCloud backup. On iOS we store recordings in
 * `FileSystem.cacheDirectory` (Library/Caches/hymn-audio/), which iOS excludes
 * from iCloud backups automatically. If the OS reclaims cache space, the app
 * streams again transparently and `refreshOfflineAudio()` updates the count.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getAllAudioIds, getHymnAudio } from '../data/audioRegistry.native';

export type DownloadAllState = {
  status: 'idle' | 'downloading' | 'done' | 'error';
  saved: number;      // recordings stored on this device
  total: number;      // recordings available
  failed: number;     // failures in the current/last "download all" run
  bytes: number;      // space used by saved recordings
  cancelling: boolean;
  started: boolean;   // a "download all" has been started on this device
  savedIds: ReadonlySet<string>; // IDs currently stored on disk
};

const BASE_DIR =
  Platform.OS === 'ios'
    ? (FileSystem.cacheDirectory || FileSystem.documentDirectory || '')
    : (FileSystem.documentDirectory || FileSystem.cacheDirectory || '');
const DIR = `${BASE_DIR}hymn-audio/`;
const CONCURRENCY = 3;
const fileFor = (id: string) => `${DIR}hymn_${encodeURIComponent(id)}.m4a`;
const STARTED_MARKER = `${DIR}.download-all-started`;

const inFlight = new Map<string, Promise<boolean>>();
const listeners = new Set<() => void>();
const savedIdSet = new Set<string>();
let state: DownloadAllState = {
  status: 'idle',
  saved: 0,
  total: getAllAudioIds().length,
  failed: 0,
  bytes: 0,
  cancelling: false,
  started: false,
  savedIds: new Set<string>(),
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

/** True when a recording is known to be saved locally on this device. */
export function isHymnAudioSaved(id: string): boolean {
  return state.savedIds.has(String(id));
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
    const existingSize = await savedSize(id);
    if (existingSize) {
      if (!savedIdSet.has(id)) {
        savedIdSet.add(id);
        update({ savedIds: new Set(savedIdSet) });
      }
      return true;
    }
    await ensureDir();
    try {
      const result = await FileSystem.downloadAsync(remote, partial);
      if (result.status !== 200) throw new Error(`HTTP ${result.status} for ${remote}`);
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.moveAsync({ from: partial, to: target });
      const size = await savedSize(id);
      const wasCounted = savedIdSet.has(id);
      savedIdSet.add(id);
      update({
        saved: wasCounted ? state.saved : state.saved + 1,
        bytes: wasCounted ? state.bytes : state.bytes + size,
        savedIds: new Set(savedIdSet),
      });
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
    if (await savedSize(id)) {
      if (!savedIdSet.has(id)) {
        savedIdSet.add(id);
        update({ savedIds: new Set(savedIdSet) });
      }
      return fileFor(id);
    } else if (savedIdSet.has(id)) {
      // OS may have evicted a cached file on iOS; update our set.
      savedIdSet.delete(id);
      update({
        saved: Math.max(0, state.saved - 1),
        savedIds: new Set(savedIdSet),
        status: state.status === 'done' ? 'idle' : state.status,
      });
    }
  } catch (error) {
    console.warn('[OfflineAudio] Saved file check failed', id, error);
  }
  void saveHymnAudio(id);
  return remote;
}

/** Recounts saved recordings and their size (used on launch and when Settings opens). */
export async function refreshOfflineAudio(): Promise<void> {
  try {
    await ensureDir();
    const names = new Set(await FileSystem.readDirectoryAsync(DIR));
    const started = names.has('.download-all-started');
    let saved = 0, bytes = 0;
    savedIdSet.clear();
    const allIds = getAllAudioIds();
    for (const id of allIds) {
      if (!names.has(`hymn_${encodeURIComponent(id)}.m4a`)) continue;
      const size = await savedSize(id);
      if (size) {
        saved += 1;
        bytes += size;
        savedIdSet.add(id);
      }
    }
    const nextStatus =
      state.status === 'downloading'
        ? 'downloading'
        : saved >= allIds.length
          ? 'done'
          : state.status === 'done'
            ? 'idle'
            : state.status;
    update({
      saved,
      bytes,
      started,
      status: nextStatus,
      savedIds: new Set(savedIdSet),
    });
  } catch (error) {
    console.warn('[OfflineAudio] Refresh failed', error);
  }
}

/** Saves every recording not yet stored. Safe to call again to resume. */
export async function downloadAllHymnAudio(): Promise<void> {
  if (state.status === 'downloading') return;
  cancelRequested = false;
  update({ status: 'downloading', failed: 0, cancelling: false, started: true });
  await refreshOfflineAudio();
  try {
    await FileSystem.writeAsStringAsync(STARTED_MARKER, new Date().toISOString());
  } catch (error) {
    console.warn('[OfflineAudio] Could not record download start', error);
  }
  update({ started: true });
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
    failed,
    cancelling: false,
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
  savedIdSet.clear();
  update({
    status: 'idle',
    saved: 0,
    bytes: 0,
    failed: 0,
    cancelling: false,
    started: false,
    savedIds: new Set<string>(),
  });
}

export const offlineAudio = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
