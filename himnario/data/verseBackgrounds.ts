import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export type VerseImageSource = { uri: string } | number;

export type VerseTextTone = "light" | "dark";
export type VerseTextColorMode = "auto" | "light" | "dark";
export type VerseRotationMode = "all" | "favorites" | "gradients";

export type VerseBackgroundPreset = {
  id: string;
  label: { es: string; en: string };
  /** Cloud URL on Cloudflare R2 (null for pure gradient presets). */
  remoteUrl: string | null;
  /** Approximate size in bytes for download UI badges. */
  approxBytes?: number;
  /** Optional bundled source if ever needed. */
  source: VerseImageSource | null;
  /** Recommended text tone ('dark' = black text for bright photos, 'light' = white text for dark photos/gradients). */
  defaultTextTone: VerseTextTone;
  fallbackColors: [string, string, string];
  scrimColors: [string, string];
  lightScrimColors: [string, string];
};

export const VERSE_BG_BASE_URL =
  "https://audio.himnarioebp.com/verse-backgrounds/";

export const VERSE_BACKGROUNDS: VerseBackgroundPreset[] = [
  {
    id: "bg-1",
    label: { es: "Cielo y flor de cerezo", en: "Sky & Cherry Blossom" },
    remoteUrl: `${VERSE_BG_BASE_URL}1.png`,
    approxBytes: 1375805,
    source: { uri: `${VERSE_BG_BASE_URL}1.png` },
    defaultTextTone: "dark",
    fallbackColors: ["#5cb3ee", "#89cdf7", "#cbe8fb"],
    scrimColors: ["rgba(0,0,0,0.18)", "rgba(0,0,0,0.62)"],
    lightScrimColors: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.58)"],
  },
  {
    id: "bg-2",
    label: { es: "Montañas al atardecer", en: "Sunset Mountains" },
    remoteUrl: `${VERSE_BG_BASE_URL}2.png`,
    approxBytes: 2701706,
    source: { uri: `${VERSE_BG_BASE_URL}2.png` },
    defaultTextTone: "light",
    fallbackColors: ["#3c2640", "#b3621c", "#2d3c1e"],
    scrimColors: ["rgba(0,0,0,0.14)", "rgba(0,0,0,0.66)"],
    lightScrimColors: ["rgba(255,255,255,0.22)", "rgba(255,255,255,0.68)"],
  },
  {
    id: "classic-dark",
    label: { es: "Oscuro clásico (Degradado)", en: "Classic Dark (Gradient)" },
    remoteUrl: null,
    source: null,
    defaultTextTone: "light",
    fallbackColors: ["#303034", "#1C1C1E", "#0B0B0D"],
    scrimColors: ["rgba(255,255,255,0.04)", "rgba(0,0,0,0.35)"],
    lightScrimColors: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.45)"],
  },
  {
    id: "classic-light",
    label: { es: "Claro clásico (Degradado)", en: "Classic Light (Gradient)" },
    remoteUrl: null,
    source: null,
    defaultTextTone: "dark",
    fallbackColors: ["#FFFFFF", "#F2F2F7", "#E2E2EA"],
    scrimColors: ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.08)"],
    lightScrimColors: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.2)"],
  },
  {
    id: "sacred-ink",
    label: { es: "Tinta sagrada (Degradado)", en: "Sacred Ink (Gradient)" },
    remoteUrl: null,
    source: null,
    defaultTextTone: "light",
    fallbackColors: ["#6e1619", "#432026", "#171717"],
    scrimColors: ["rgba(0,0,0,0.12)", "rgba(0,0,0,0.62)"],
    lightScrimColors: ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.62)"],
  },
  {
    id: "olive",
    label: { es: "Olivo (Degradado)", en: "Olive (Gradient)" },
    remoteUrl: null,
    source: null,
    defaultTextTone: "light",
    fallbackColors: ["#50654c", "#2f4035", "#17261f"],
    scrimColors: ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.65)"],
    lightScrimColors: ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.62)"],
  },
  {
    id: "evening",
    label: { es: "Atardecer (Degradado)", en: "Evening (Gradient)" },
    remoteUrl: null,
    source: null,
    defaultTextTone: "light",
    fallbackColors: ["#786355", "#514153", "#202333"],
    scrimColors: ["rgba(0,0,0,0.18)", "rgba(0,0,0,0.65)"],
    lightScrimColors: ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.62)"],
  },
];

export function resolveVerseTextTone(
  preset: VerseBackgroundPreset,
  mode: VerseTextColorMode,
): VerseTextTone {
  if (mode === "light" || mode === "dark") return mode;
  return preset.defaultTextTone;
}

export function getDailyVerseBackground(
  dayIndex: number,
  customBgId?: string | null,
  options?: {
    rotationMode?: VerseRotationMode;
    favoriteIds?: ReadonlySet<string> | string[];
  },
): VerseBackgroundPreset {
  if (customBgId) {
    const pinned = VERSE_BACKGROUNDS.find((b) => b.id === customBgId);
    if (pinned) return pinned;
  }

  const mode = options?.rotationMode ?? "all";
  const favSet =
    options?.favoriteIds instanceof Set
      ? options.favoriteIds
      : new Set(options?.favoriteIds ?? []);

  let pool = VERSE_BACKGROUNDS;
  if (mode === "gradients") {
    const grads = VERSE_BACKGROUNDS.filter((b) => !b.remoteUrl);
    if (grads.length) pool = grads;
  } else if (mode === "favorites" && favSet.size > 0) {
    const favs = VERSE_BACKGROUNDS.filter((b) => favSet.has(b.id));
    if (favs.length) pool = favs;
  }

  const idx = ((dayIndex % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// Offline Download Manager for Cloud Verse Backgrounds
// Mirrors audio/offline-audio.ts (uses cacheDirectory on iOS for iCloud rules)
// ─────────────────────────────────────────────────────────────────────────────

export type VerseBgOfflineState = {
  downloadingIds: ReadonlySet<string>;
  savedIds: ReadonlySet<string>;
  localUris: Readonly<Record<string, string>>;
  bytes: number;
  downloadingAll: boolean;
};

const BASE_DIR =
  Platform.OS === "ios"
    ? FileSystem.cacheDirectory || FileSystem.documentDirectory || ""
    : FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
const BG_DIR = `${BASE_DIR}verse-backgrounds/`;

const fileForBg = (id: string) =>
  `${BG_DIR}${id.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;

const listeners = new Set<() => void>();
const savedIds = new Set<string>();
const downloadingIds = new Set<string>();
const localUris: Record<string, string> = {};
const inFlight = new Map<string, Promise<boolean>>();
let dirReady: Promise<void> | null = null;

let state: VerseBgOfflineState = {
  downloadingIds: new Set(),
  savedIds: new Set(),
  localUris: {},
  bytes: 0,
  downloadingAll: false,
};

function emit(patch?: Partial<VerseBgOfflineState>) {
  state = {
    ...state,
    ...patch,
    downloadingIds: new Set(downloadingIds),
    savedIds: new Set(savedIds),
    localUris: { ...localUris },
  };
  listeners.forEach((l) => l());
}

function ensureBgDir(): Promise<void> {
  if (!dirReady) {
    dirReady = FileSystem.makeDirectoryAsync(BG_DIR, {
      intermediates: true,
    }).catch(async (err) => {
      const info = await FileSystem.getInfoAsync(BG_DIR);
      if (!info.exists) {
        dirReady = null;
        throw err;
      }
    });
  }
  return dirReady;
}

export async function refreshOfflineVerseBackgrounds(): Promise<void> {
  if (!BASE_DIR) return;
  try {
    await ensureBgDir();
    let totalBytes = 0;
    savedIds.clear();
    for (const preset of VERSE_BACKGROUNDS) {
      if (!preset.remoteUrl) continue;
      const path = fileForBg(preset.id);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && !info.isDirectory && (info.size ?? 0) > 0) {
        savedIds.add(preset.id);
        localUris[preset.id] = path;
        totalBytes += info.size ?? 0;
      } else {
        delete localUris[preset.id];
      }
    }
    emit({ bytes: totalBytes });
  } catch {
    // Ignore transient filesystem errors
  }
}

export function downloadVerseBackground(id: string): Promise<boolean> {
  const existing = inFlight.get(id);
  if (existing) return existing;
  const preset = VERSE_BACKGROUNDS.find((b) => b.id === id);
  if (!preset?.remoteUrl || !BASE_DIR) return Promise.resolve(false);

  const target = fileForBg(id);
  const partial = `${target}.part`;
  downloadingIds.add(id);
  emit();

  const job = (async () => {
    try {
      await ensureBgDir();
      const res = await FileSystem.downloadAsync(preset.remoteUrl!, partial);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.moveAsync({ from: partial, to: target });
      await refreshOfflineVerseBackgrounds();
      return true;
    } catch {
      await FileSystem.deleteAsync(partial, { idempotent: true }).catch(
        () => {},
      );
      return false;
    } finally {
      downloadingIds.delete(id);
      inFlight.delete(id);
      emit();
    }
  })();

  inFlight.set(id, job);
  return job;
}

export async function removeOfflineVerseBackground(id: string): Promise<void> {
  if (!BASE_DIR) return;
  const target = fileForBg(id);
  await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
  await refreshOfflineVerseBackgrounds();
}

export async function downloadAllVerseBackgrounds(): Promise<boolean> {
  emit({ downloadingAll: true });
  try {
    const cloudPresets = VERSE_BACKGROUNDS.filter((b) => Boolean(b.remoteUrl));
    const results = await Promise.all(
      cloudPresets.map((b) => downloadVerseBackground(b.id)),
    );
    return results.every(Boolean);
  } finally {
    emit({ downloadingAll: false });
  }
}

export async function clearAllOfflineVerseBackgrounds(): Promise<void> {
  if (!BASE_DIR) return;
  for (const preset of VERSE_BACKGROUNDS) {
    if (!preset.remoteUrl) continue;
    await FileSystem.deleteAsync(fileForBg(preset.id), {
      idempotent: true,
    }).catch(() => {});
  }
  await refreshOfflineVerseBackgrounds();
}

export function resolveVerseBackgroundSource(
  preset: VerseBackgroundPreset,
  offlineSnapshot: VerseBgOfflineState,
): VerseImageSource | null {
  if (!preset.remoteUrl) return preset.source;
  const localUri = offlineSnapshot.localUris[preset.id];
  if (localUri) return { uri: localUri };
  return { uri: preset.remoteUrl };
}

export const offlineVerseBackgrounds = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
};
