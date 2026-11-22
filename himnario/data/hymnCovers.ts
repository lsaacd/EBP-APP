import { Platform, type ImageSourcePropType } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_HYMNAL_COVER: ImageSourcePropType = require("../assets/images/hymnal-leather-cover.jpg");

export const HYMN_COVER_BASE_URL =
  "https://audio.himnarioebp.com/hymn-covers/";

export type HymnCoverPreset = {
  id: string;
  label: { es: string; en: string };
  remoteUrl: string | null;
  approxBytes?: number;
  bundledSource: ImageSourcePropType | null;
  is3D?: boolean;
};

export const HYMN_COVERS: HymnCoverPreset[] = [
  {
    id: "classic-default",
    label: {
      es: "Clásica vino (Predeterminada)",
      en: "Classic Burgundy (Default)",
    },
    remoteUrl: null,
    bundledSource: DEFAULT_HYMNAL_COVER,
    is3D: false,
  },
  {
    id: "emblem-burgundy",
    label: {
      es: "Escudo dorado (Vino)",
      en: "Gold Emblem (Burgundy)",
    },
    remoteUrl: `${HYMN_COVER_BASE_URL}newer-hymn-cover.png`,
    approxBytes: 3226659,
    bundledSource: null,
    is3D: true,
  },
  {
    id: "emblem-black",
    label: {
      es: "Escudo plateado (Negra)",
      en: "Silver Emblem (Black)",
    },
    remoteUrl: `${HYMN_COVER_BASE_URL}newer-dark-hymn-cover.png`,
    approxBytes: 1951793,
    bundledSource: null,
    is3D: true,
  },
  {
    id: "classic-black",
    label: {
      es: "Clásica negra",
      en: "Classic Black",
    },
    remoteUrl: `${HYMN_COVER_BASE_URL}black-old-hymn.png`,
    approxBytes: 1713439,
    bundledSource: null,
    is3D: false,
  },
  {
    id: "classic-burgundy-hd",
    label: {
      es: "Clásica vino (Alta resolución)",
      en: "Classic Burgundy (Full HD)",
    },
    remoteUrl: `${HYMN_COVER_BASE_URL}old-hymn-cover.png`,
    approxBytes: 3292614,
    bundledSource: null,
    is3D: false,
  },
];

export type HymnCoverState = {
  selectedId: string;
  favoriteIds: ReadonlyArray<string>;
  downloadingIds: ReadonlySet<string>;
  savedIds: ReadonlySet<string>;
  localUris: Readonly<Record<string, string>>;
  bytes: number;
  downloadingAll: boolean;
};

const COVER_KEY = "@himnario_hymn_cover_id_v1";
const COVER_FAVS_KEY = "@himnario_hymn_cover_favs_v1";

const BASE_DIR =
  Platform.OS === "ios"
    ? FileSystem.cacheDirectory || FileSystem.documentDirectory || ""
    : FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
const COVER_DIR = `${BASE_DIR}hymn-covers/`;

const fileForCover = (id: string) =>
  `${COVER_DIR}${id.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;

const listeners = new Set<() => void>();
const savedIds = new Set<string>();
const downloadingIds = new Set<string>();
const localUris: Record<string, string> = {};
const inFlight = new Map<string, Promise<boolean>>();
let dirReady: Promise<void> | null = null;
let initialized = false;

let state: HymnCoverState = {
  selectedId: "classic-default",
  favoriteIds: [],
  downloadingIds: new Set(),
  savedIds: new Set(),
  localUris: {},
  bytes: 0,
  downloadingAll: false,
};

function emit(patch?: Partial<HymnCoverState>) {
  state = {
    ...state,
    ...patch,
    downloadingIds: new Set(downloadingIds),
    savedIds: new Set(savedIds),
    localUris: { ...localUris },
  };
  listeners.forEach((l) => l());
}

function ensureCoverDir(): Promise<void> {
  if (!dirReady) {
    dirReady = FileSystem.makeDirectoryAsync(COVER_DIR, {
      intermediates: true,
    }).catch(async (err) => {
      const info = await FileSystem.getInfoAsync(COVER_DIR);
      if (!info.exists) {
        dirReady = null;
        throw err;
      }
    });
  }
  return dirReady;
}

export async function initHymnCovers(): Promise<void> {
  if (!initialized) {
    initialized = true;
    try {
      const [savedId, rawFavs] = await Promise.all([
        AsyncStorage.getItem(COVER_KEY),
        AsyncStorage.getItem(COVER_FAVS_KEY),
      ]);
      const validId =
        savedId && HYMN_COVERS.some((c) => c.id === savedId)
          ? savedId
          : "classic-default";
      let favs: string[] = [];
      if (rawFavs) {
        try {
          const parsed = JSON.parse(rawFavs);
          if (Array.isArray(parsed))
            favs = parsed.filter((x) => typeof x === "string");
        } catch {}
      }
      emit({ selectedId: validId, favoriteIds: favs });
    } catch {}
  }
  await refreshOfflineHymnCovers();
}

export async function refreshOfflineHymnCovers(): Promise<void> {
  if (!BASE_DIR) return;
  try {
    await ensureCoverDir();
    let totalBytes = 0;
    savedIds.clear();
    for (const preset of HYMN_COVERS) {
      if (!preset.remoteUrl) continue;
      const path = fileForCover(preset.id);
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
  } catch {}
}

export function selectHymnCover(id: string): void {
  const preset =
    HYMN_COVERS.find((c) => c.id === id) ?? HYMN_COVERS[0];
  emit({ selectedId: preset.id });
  void AsyncStorage.setItem(COVER_KEY, preset.id).catch(() => {});
  if (preset.remoteUrl && !savedIds.has(preset.id)) {
    void downloadHymnCover(preset.id);
  }
}

export function toggleFavoriteHymnCover(id: string): void {
  const exists = state.favoriteIds.includes(id);
  const next = exists
    ? state.favoriteIds.filter((x) => x !== id)
    : [...state.favoriteIds, id];
  emit({ favoriteIds: next });
  void AsyncStorage.setItem(COVER_FAVS_KEY, JSON.stringify(next)).catch(
    () => {},
  );
  if (!exists) {
    const preset = HYMN_COVERS.find((c) => c.id === id);
    if (preset?.remoteUrl && !savedIds.has(id)) {
      void downloadHymnCover(id);
    }
  }
}

export function downloadHymnCover(id: string): Promise<boolean> {
  const existing = inFlight.get(id);
  if (existing) return existing;
  const preset = HYMN_COVERS.find((c) => c.id === id);
  if (!preset?.remoteUrl || !BASE_DIR) return Promise.resolve(false);

  const target = fileForCover(id);
  const partial = `${target}.part`;
  downloadingIds.add(id);
  emit();

  const job = (async () => {
    try {
      await ensureCoverDir();
      const res = await FileSystem.downloadAsync(preset.remoteUrl!, partial);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.moveAsync({ from: partial, to: target });
      await refreshOfflineHymnCovers();
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

export async function removeOfflineHymnCover(id: string): Promise<void> {
  if (!BASE_DIR) return;
  const target = fileForCover(id);
  await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
  await refreshOfflineHymnCovers();
}

export async function downloadAllHymnCovers(): Promise<boolean> {
  emit({ downloadingAll: true });
  try {
    const cloudPresets = HYMN_COVERS.filter((c) => Boolean(c.remoteUrl));
    const results = await Promise.all(
      cloudPresets.map((c) => downloadHymnCover(c.id)),
    );
    return results.every(Boolean);
  } finally {
    emit({ downloadingAll: false });
  }
}

export async function clearAllOfflineHymnCovers(): Promise<void> {
  if (!BASE_DIR) return;
  for (const preset of HYMN_COVERS) {
    if (!preset.remoteUrl) continue;
    await FileSystem.deleteAsync(fileForCover(preset.id), {
      idempotent: true,
    }).catch(() => {});
  }
  await refreshOfflineHymnCovers();
}

export function resolveActiveHymnCover(
  coverState: HymnCoverState,
  failedId?: string | null,
): { preset: HymnCoverPreset; source: ImageSourcePropType } {
  const preset =
    HYMN_COVERS.find((c) => c.id === coverState.selectedId) ?? HYMN_COVERS[0];
  if (preset.bundledSource) {
    return { preset, source: preset.bundledSource };
  }
  const local = coverState.localUris[preset.id];
  if (local) {
    return { preset, source: { uri: local } };
  }
  if (preset.remoteUrl && failedId !== preset.id) {
    return { preset, source: { uri: preset.remoteUrl } };
  }
  // Offline fallback: prefer a downloaded favorite cover, else any downloaded cover, else bundled default
  const savedFav = HYMN_COVERS.find(
    (c) =>
      coverState.favoriteIds.includes(c.id) &&
      Boolean(coverState.localUris[c.id]),
  );
  if (savedFav) {
    return { preset: savedFav, source: { uri: coverState.localUris[savedFav.id] } };
  }
  const anySaved = HYMN_COVERS.find((c) => Boolean(coverState.localUris[c.id]));
  if (anySaved) {
    return { preset: anySaved, source: { uri: coverState.localUris[anySaved.id] } };
  }
  return { preset: HYMN_COVERS[0], source: DEFAULT_HYMNAL_COVER };
}

export const hymnCoversStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): HymnCoverState {
    return state;
  },
};
