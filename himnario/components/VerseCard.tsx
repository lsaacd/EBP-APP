import SheetGrabber from "./SheetGrabber";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Platform,
  Linking,
  AppState,
  AccessibilityInfo,
  Modal,
  ScrollView,
  ActivityIndicator,
  UIManager,
  PixelRatio,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  cancelAnimation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { shouldCollapsePlayer } from "../utils/gestureMotion";
import { buildSheetPanGesture } from "../utils/useSheetBackdropGesture";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Image as SvgImage,
  Text as SvgText,
  TSpan,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/theme";
import { getDailyVerse } from "../data/dailyVerses";
import {
  VERSE_BACKGROUNDS,
  getDailyVerseBackground,
  resolveVerseTextTone,
  resolveVerseBackgroundSource,
  offlineVerseBackgrounds,
  refreshOfflineVerseBackgrounds,
  downloadVerseBackground,
  removeOfflineVerseBackground,
  downloadAllVerseBackgrounds,
  clearAllOfflineVerseBackgrounds,
  type VerseTextColorMode,
  type VerseRotationMode,
} from "../data/verseBackgrounds";
import {
  HYMN_COVERS,
  hymnCoversStore,
  initHymnCovers,
  selectHymnCover,
  toggleFavoriteHymnCover,
  downloadHymnCover,
  removeOfflineHymnCover,
  downloadAllHymnCovers,
  clearAllOfflineHymnCovers,
} from "../data/hymnCovers";
import {
  useCommunityApi,
  communityError,
  type VerseSummary,
} from "../utils/communityApi";
import AppMenuIcon from "./AppMenuIcon";
import GlassSurface from "./GlassSurface";
import { useNavigation } from "expo-router";
import VerseDiscussionSheet from "./VerseDiscussionSheet";
import ChoirRepertoire from "./ChoirRepertoire";
import * as Haptics from "../utils/haptics";

import {createVerseLikeQueue} from "../utils/verseLikeQueue";
import {waitForVerseShareAssets} from "../utils/verseSharing";

const empty: VerseSummary = {
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  likedByMe: false,
};

const BG_KEY = "@himnario_verse_background_v1";
const BG_FAVS_KEY = "@himnario_verse_bg_favorites_v1";
const BG_ROTATION_KEY = "@himnario_verse_bg_rotation_v1";
const BG_TEXT_COLOR_KEY = "@himnario_verse_text_color_v1";

const HAS_NATIVE_MENU =
  Platform.OS !== "web" &&
  Boolean(UIManager.hasViewManagerConfig?.("MenuView"));

function formatMb(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const BRAND_LOGO_ASSET = require("../assets/images/white-ios-logo.png");
let cachedBrandLogoDataUri: string | null = null;

async function loadBrandLogoDataUri(): Promise<string | null> {
  if (cachedBrandLogoDataUri) return cachedBrandLogoDataUri;
  try {
    const asset = Asset.fromModule(BRAND_LOGO_ASSET);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    const localUri = asset.localUri || asset.uri;
    if (localUri && localUri.startsWith("file://")) {
      const b64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (b64) {
        cachedBrandLogoDataUri = `data:image/png;base64,${b64}`;
        return cachedBrandLogoDataUri;
      }
    }
  } catch {}
  return null;
}

export default function VerseCard() {
  const { language, t } = useLanguage(),
    es = language === "es";
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { user, token, openAuthSheet } = useAuth();
  const api = useCommunityApi();
  const offlineBg = useSyncExternalStore(
    offlineVerseBackgrounds.subscribe,
    offlineVerseBackgrounds.getSnapshot,
  );
  const coverState = useSyncExternalStore(
    hymnCoversStore.subscribe,
    hymnCoversStore.getSnapshot,
  );

  const [{ dayIndex, verse }, setDay] = useState(() => getDailyVerse());
  const [summary, setSummary] = useState(empty),
    [discussion, setDiscussion] = useState(false),
    [fullScreenOpen, setFullScreenOpen] = useState(false),
    [pickerOpen, setPickerOpen] = useState(false),
    [pickerPage, setPickerPage] = useState<"hub" | "backgrounds" | "covers">("hub"),
    [sharing, setSharing] = useState(false),
    [sharePhotoUri, setSharePhotoUri] = useState<string | null>(null),
    [brandLogoUri, setBrandLogoUri] = useState<string | null>(
      cachedBrandLogoDataUri,
    );
  const navigation = useNavigation();
  const resumeDiscussion = useRef(false);
  useEffect(() => navigation.addListener("focus", () => {
    if (resumeDiscussion.current) {
      resumeDiscussion.current = false;
      setDiscussion(true);
    }
  }), [navigation]);
  useEffect(() => { resumeDiscussion.current = false; }, [user?.id]);
  const shareSvgRef = useRef<Svg | null>(null);
  const svgPhotoReadyUri = useRef<string | null>(null);
  const svgLogoReadyUri = useRef<string | null>(null);
  const shareLockRef = useRef(false);
  const shareSceneRef = useRef("");
  const shareRenderedPhotoRef = useRef<string | null>(null);
  shareRenderedPhotoRef.current = sharePhotoUri;
  const loadedPhotoBgIdRef = useRef<string | null>(null);
  const summaryRef = useRef(summary);
  const likeLanguageRef = useRef(es);
  likeLanguageRef.current = es;
  const activeLikeQueue = useRef<ReturnType<typeof createVerseLikeQueue> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const cacheWrites = useRef(Promise.resolve());
  const updateSummary = useCallback((value: VerseSummary) => { summaryRef.current = value; setSummary(value); },[]);
  const heartScale = useSharedValue(1);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const shareScale = useSharedValue(1);
  const shareLiftY = useSharedValue(0);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const shareAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }, { translateY: shareLiftY.value }],
  }));
  const shareSvgPt = Math.max(360, Math.round(1080 / PixelRatio.get()));
  const [customBg, setCustomBg] = useState<string | null>(null),
    [rotationMode, setRotationMode] = useState<VerseRotationMode>("all"),
    [favoriteIds, setFavoriteIds] = useState<string[]>([]),
    [textColorMode, setTextColorMode] = useState<VerseTextColorMode>("auto"),
    [imageFailedId, setImageFailedId] = useState<string | null>(null),
    [message, setMessage] = useState("");

  const generation = useRef(0);
  const invalidate = useCallback(() => {
    ++generation.current;
  }, []);

  const rawBackground = useMemo(
    () =>
      getDailyVerseBackground(dayIndex, customBg, {
        rotationMode,
        favoriteIds,
      }),
    [dayIndex, customBg, rotationMode, favoriteIds],
  );

  // If the selected/rotated cloud image failed to load (e.g. offline & not downloaded yet),
  // prefer an already-downloaded favorite/saved background before falling back to pure gradient.
  const background = useMemo(() => {
    if (
      rawBackground.remoteUrl &&
      imageFailedId === rawBackground.id &&
      !offlineBg.savedIds.has(rawBackground.id)
    ) {
      const savedFav = VERSE_BACKGROUNDS.find(
        (b) => favoriteIds.includes(b.id) && offlineBg.savedIds.has(b.id),
      );
      if (savedFav) return savedFav;
      const anySaved = VERSE_BACKGROUNDS.find((b) =>
        offlineBg.savedIds.has(b.id),
      );
      if (anySaved) return anySaved;
    }
    return rawBackground;
  }, [rawBackground, imageFailedId, offlineBg.savedIds, favoriteIds]);

  const bgSource = useMemo(
    () => resolveVerseBackgroundSource(background, offlineBg),
    [background, offlineBg],
  );

  const travel = Math.max(windowHeight, 600) + 40;
  const sheetSpring = {
    damping: 28,
    stiffness: 240,
    mass: 1,
    overshootClamping: true,
  };
  const pickerProgress = useSharedValue(1);
  const pickerDragOrigin = useSharedValue(0);
  const fullProgress = useSharedValue(1);
  const fullDragOrigin = useSharedValue(0);
  const fullKenBurns = useSharedValue(0);

  const pickerBackdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - pickerProgress.value,
  }));
  const pickerSheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pickerProgress.value * travel }],
  }));
  const fullBackdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - fullProgress.value,
  }));
  const fullSheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fullProgress.value * travel }],
  }));
  const fullKenBurnsStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(fullKenBurns.value, [0, 1], [1, 1.085]) },
      { translateY: interpolate(fullKenBurns.value, [0, 1], [0, -6]) },
    ],
  }));

  useEffect(() => {
    if (!fullScreenOpen) {
      cancelAnimation(fullKenBurns);
      fullKenBurns.value = 0;
      return;
    }

    let cancelled = false;
    let reduceMotion = false;

    const startBreathing = () => {
      if (cancelled || reduceMotion) return;
      cancelAnimation(fullKenBurns);
      fullKenBurns.value = 0;
      fullKenBurns.value = withRepeat(
        withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    };

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotion = enabled;
        startBreathing();
      })
      .catch(() => {
        startBreathing();
      });

    const appSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        startBreathing();
      } else {
        cancelAnimation(fullKenBurns);
      }
    });

    return () => {
      cancelled = true;
      appSub.remove();
      cancelAnimation(fullKenBurns);
    };
  }, [fullScreenOpen, fullKenBurns]);

  useEffect(() => {
    if (pickerOpen) {
      setPickerPage("hub");
      pickerProgress.value = 1;
      pickerProgress.value = withSpring(0, sheetSpring);
    } else {
      pickerProgress.value = 1;
    }
    return () => cancelAnimation(pickerProgress);
  }, [pickerOpen, pickerProgress]);

  useEffect(() => {
    if (fullScreenOpen) {
      fullProgress.value = 1;
      fullProgress.value = withSpring(0, sheetSpring);
    } else {
      fullProgress.value = 1;
    }
    return () => cancelAnimation(fullProgress);
  }, [fullScreenOpen, fullProgress]);

  const pendingModalAfterFullRef = useRef<"discussion" | "auth" | "picker" | null>(null);

  const flushPendingModalAfterFull = useCallback(() => {
    const next = pendingModalAfterFullRef.current;
    if (!next) return;
    pendingModalAfterFullRef.current = null;
    if (next === "auth") openAuthSheet();
    else if (next === "discussion") setDiscussion(true);
    else if (next === "picker") setPickerOpen(true);
  }, [openAuthSheet]);

  const openModalFromFull = useCallback(
    (target: "discussion" | "auth" | "picker") => {
      pendingModalAfterFullRef.current = target;
      setFullScreenOpen(false);
      if (Platform.OS !== "ios") {
        flushPendingModalAfterFull();
      }
    },
    [flushPendingModalAfterFull],
  );

  const finishClosePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const finishCloseFull = useCallback(() => {
    setFullScreenOpen(false);
    if (Platform.OS !== "ios") {
      flushPendingModalAfterFull();
    }
  }, [flushPendingModalAfterFull]);

  const closePickerAnimated = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerProgress.value = withTiming(
      1,
      { duration: 230, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishClosePicker)();
      },
    );
  }, [finishClosePicker, pickerProgress]);

  const closeFullAnimated = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fullProgress.value = withTiming(
      1,
      { duration: 240, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishCloseFull)();
      },
    );
  }, [finishCloseFull, fullProgress]);

  const pickerPan = buildSheetPanGesture({
    progress: pickerProgress,
    dragOrigin: pickerDragOrigin,
    travel,
    onFinishDismiss: finishClosePicker,
    collapseRatio: 0.42,
  });

  const pickerBackdropPan = buildSheetPanGesture({
    progress: pickerProgress,
    dragOrigin: pickerDragOrigin,
    travel,
    onFinishDismiss: finishClosePicker,
    collapseRatio: 0.42,
  });

  const fullPan = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-24, 24])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(fullProgress);
      fullDragOrigin.value = fullProgress.value;
    })
    .onUpdate((event) => {
      fullProgress.value = Math.max(
        0,
        Math.min(1, fullDragOrigin.value + event.translationY / travel),
      );
    })
    .onEnd((event, success) => {
      const collapse =
        success &&
        shouldCollapsePlayer(
          fullProgress.value * travel,
          event.velocityY,
          travel * 0.4,
        );
      if (collapse) {
        const remaining = Math.max(0.05, 1 - fullProgress.value);
        const duration = Math.max(110, Math.min(250, Math.round(remaining * 250)));
        fullProgress.value = withTiming(
          1,
          { duration, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(finishCloseFull)();
          },
        );
      } else {
        fullProgress.value = withSpring(0, {
          ...sheetSpring,
          velocity: event.velocityY / travel,
        });
      }
    });

  const isDefaultClassic = !customBg;
  const textTone =
    textColorMode === "light" || textColorMode === "dark"
      ? textColorMode
      : isDefaultClassic
        ? isDarkMode
          ? "light"
          : "dark"
        : resolveVerseTextTone(background, textColorMode);
  const isDarkText = textTone === "dark";
  const fgColor = isDarkText ? "#141413" : "#ffffff";
  const subFgColor = isDarkText
    ? "rgba(20,20,19,0.72)"
    : "rgba(255,255,255,0.78)";
  const borderFgColor = isDarkText
    ? "rgba(20,20,19,0.12)"
    : "rgba(255,255,255,0.14)";
  const classicColors: [string, string, string] = isDarkMode
    ? ["#303034", "#1C1C1E", "#0B0B0D"]
    : ["#FFFFFF", "#F2F2F7", "#E2E2EA"];
  const cardBgColors = isDefaultClassic ? classicColors : background.fallbackColors;
  const scrimColors = isDefaultClassic
    ? (["rgba(0,0,0,0)", "rgba(0,0,0,0)"] as [string, string])
    : isDarkText
      ? background.lightScrimColors
      : background.scrimColors;
  const quote = verse[language];

  const summaryCacheKey = `@himnario_verse_summary_v1:${verse.id}:${user?.id || "guest"}`;

  const userId = user?.id;
  const persistSummary = useCallback((value: VerseSummary) => {
    cacheWrites.current = cacheWrites.current.catch(()=>{}).then(()=>AsyncStorage.setItem(summaryCacheKey,JSON.stringify(value))).catch(()=>{});
  },[summaryCacheKey]);
  const likeQueue = useMemo(() => {
    const queue = createVerseLikeQueue(empty,liked=>api(`/verses/${verse.id}/like`,"POST",{liked}),{
      onError:(error,confirmed)=>{
        if(activeLikeQueue.current !== queue) return;
        updateSummary(confirmed);
        persistSummary(confirmed);
        setMessage(communityError(error,likeLanguageRef.current));
      },
      onIdle:()=>{ if(activeLikeQueue.current===queue) void refreshRef.current(); },
    });
    return queue;
  },[api,verse.id,updateSummary,persistSummary]);
  activeLikeQueue.current = likeQueue;
  useEffect(()=>{ likeQueue.activate(); return ()=>likeQueue.dispose(); },[likeQueue]);

  const refresh = useCallback(async () => {
    const id = ++generation.current;
    try {
      const data = await api<VerseSummary>(`/verses/${verse.id}/summary`);
      if (id !== generation.current || !likeQueue.acceptServer(data)) return;
      updateSummary(data);
      persistSummary(data);
    } catch {
      /* Quiet cached counts offline; discussions show connection state. */
    }
  }, [api, verse.id,likeQueue,updateSummary,persistSummary]);
  refreshRef.current = refresh;

  useEffect(() => {
    let cancelled = false;
    updateSummary(empty);
    const id = ++generation.current;
    void AsyncStorage.getItem(summaryCacheKey)
      .then((raw) => {
        if (!cancelled && id === generation.current && !likeQueue.pending() && raw) {
          try {
            const data = JSON.parse(raw);
            if (
              Number.isSafeInteger(data.likesCount) &&
              Number.isSafeInteger(data.commentsCount)
            )
              {
                const cached = {...empty,...data,likedByMe:Boolean(userId && data.likedByMe)};
                if (likeQueue.acceptServer(cached)) updateSummary(cached);
              }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) void refresh();
      });
    return () => {
      cancelled = true;
      invalidate();
    };
  }, [refresh, summaryCacheKey, token, userId, verse.id, invalidate,likeQueue,updateSummary]);

  shareSceneRef.current = JSON.stringify([verse.id, language, background.id, isDarkText, imageFailedId]);
  const activeLocalBgUri = offlineBg.localUris[background.id];

  // Pre-load background photo as a base64 data URI so the offscreen Share SVG always has it decoded ready
  useEffect(() => {
    let cancelled = false;
    if (isDefaultClassic || !background.remoteUrl || imageFailedId === background.id) {
      loadedPhotoBgIdRef.current = null;
      svgPhotoReadyUri.current = null;
      setSharePhotoUri(null);
      return;
    }
    if (loadedPhotoBgIdRef.current === background.id && shareRenderedPhotoRef.current) {
      return;
    }
    svgPhotoReadyUri.current = null;
    setSharePhotoUri(null);
    const loadPhotoForSvg = async () => {
      let localFile: string | undefined = activeLocalBgUri;
      if (!localFile) {
        try {
          await downloadVerseBackground(background.id);
          localFile =
            offlineVerseBackgrounds.getSnapshot().localUris[background.id];
        } catch {}
      }
      if (!localFile || cancelled) return;
      try {
        const b64 = await FileSystem.readAsStringAsync(localFile, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!cancelled && b64) {
          loadedPhotoBgIdRef.current = background.id;
          setSharePhotoUri(`data:image/png;base64,${b64}`);
        }
      } catch {}
    };
    void loadPhotoForSvg();
    return () => {
      cancelled = true;
    };
  }, [background.id, background.remoteUrl, imageFailedId, isDefaultClassic, activeLocalBgUri]);

  useEffect(() => {
    void refreshOfflineVerseBackgrounds();
    void initHymnCovers();
    if (!cachedBrandLogoDataUri) {
      void loadBrandLogoDataUri().then((uri) => {
        if (uri) setBrandLogoUri(uri);
      });
    }
    void AsyncStorage.getItem(BG_KEY)
      .then(setCustomBg)
      .catch(() => {});
    void AsyncStorage.getItem(BG_FAVS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed))
              setFavoriteIds(parsed.filter((x) => typeof x === "string"));
          } catch {}
        }
      })
      .catch(() => {});
    void AsyncStorage.getItem(BG_ROTATION_KEY)
      .then((val) => {
        if (val === "all" || val === "favorites" || val === "gradients")
          setRotationMode(val);
      })
      .catch(() => {});
    void AsyncStorage.getItem(BG_TEXT_COLOR_KEY)
      .then((val) => {
        if (val === "auto" || val === "light" || val === "dark")
          setTextColorMode(val);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const check = () =>
      setDay((current) => {
        const next = getDailyVerse();
        return next.dayIndex === current.dayIndex ? current : next;
      });
    const timer = setInterval(check, 60000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        check();
        void refresh();
        void refreshOfflineVerseBackgrounds();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  const selectBackground = (id: string | null, mode?: VerseRotationMode) => {
    Haptics.selectionAsync();
    setCustomBg(id);
    setImageFailedId(null);
    if (mode) {
      setRotationMode(mode);
      void AsyncStorage.setItem(BG_ROTATION_KEY, mode).catch(() => {});
    }
    void (
      id === null
        ? AsyncStorage.removeItem(BG_KEY)
        : AsyncStorage.setItem(BG_KEY, id)
    ).catch(() => {});
    if (id) {
      const preset = VERSE_BACKGROUNDS.find((b) => b.id === id);
      if (preset?.remoteUrl && !offlineBg.savedIds.has(id)) {
        void downloadVerseBackground(id);
      }
    }
  };

  const toggleFavoriteBg = (id: string) => {
    Haptics.selectionAsync();
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      void AsyncStorage.setItem(BG_FAVS_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      if (!exists) {
        const preset = VERSE_BACKGROUNDS.find((b) => b.id === id);
        if (preset?.remoteUrl && !offlineBg.savedIds.has(id)) {
          void downloadVerseBackground(id);
        }
      }
      return next;
    });
  };

  const updateTextColorMode = (mode: VerseTextColorMode) => {
    Haptics.selectionAsync();
    setTextColorMode(mode);
    void AsyncStorage.setItem(BG_TEXT_COLOR_KEY, mode).catch(() => {});
  };

  const like = () => {
    if (activeLikeQueue.current !== likeQueue) return;
    if (!user) {
      if (fullScreenOpen) openModalFromFull("auth");
      else openAuthSheet();
      return;
    }
    if (!user.emailVerified) {
      if (fullScreenOpen) openModalFromFull("discussion");
      else setDiscussion(true);
      return;
    }
    setMessage("");
    const before = summaryRef.current;
    const desired = !before.likedByMe;

    // 0ms immediate haptic & spring animation
    if (desired) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      heartScale.value = withSequence(
        withSpring(1.38, { damping: 10, stiffness: 360 }),
        withSpring(0.92, { damping: 12, stiffness: 320 }),
        withSpring(1, { damping: 14, stiffness: 280 }),
      );
      ringScale.value = 0.55;
      ringOpacity.value = 0.75;
      ringScale.value = withTiming(1.85, { duration: 420 });
      ringOpacity.value = withTiming(0, { duration: 420 });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      heartScale.value = withSequence(
        withTiming(0.82, { duration: 90 }),
        withSpring(1, { damping: 14, stiffness: 280 }),
      );
    }

    const nextSummary: VerseSummary = {
      ...before,
      likedByMe: desired,
      likesCount: Math.max(0, before.likesCount + (desired ? 1 : -1)),
    };
    updateSummary(nextSummary);
    persistSummary(nextSummary);
    likeQueue.request(desired);
  };

  const share = async () => {
    if (shareLockRef.current) return;
    shareLockRef.current = true;
    const scene = shareSceneRef.current;
    setSharing(true);
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shareScale.value = withSequence(
      withTiming(0.84, { duration: 75 }),
      withSpring(1.16, { damping: 10, stiffness: 360 }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );
    shareLiftY.value = withSequence(
      withTiming(-4, { duration: 95 }),
      withSpring(0, { damping: 14, stiffness: 280 }),
    );
    try {
      let expectedPhotoUri = loadedPhotoBgIdRef.current === background.id ? sharePhotoUri : null;
      const needsPhoto = !isDefaultClassic && !!background.remoteUrl && imageFailedId !== background.id;
      if (!needsPhoto) {
        expectedPhotoUri = null;
        setSharePhotoUri(null);
      }
      if (
        !isDefaultClassic &&
        background.remoteUrl &&
        imageFailedId !== background.id &&
        (loadedPhotoBgIdRef.current !== background.id || !sharePhotoUri)
      ) {
        let localFile: string | undefined = offlineBg.localUris[background.id];
        if (!localFile) {
          try {
            await downloadVerseBackground(background.id);
            localFile =
              offlineVerseBackgrounds.getSnapshot().localUris[background.id];
          } catch {}
        }
        if (localFile) {
          try {
            const b64 = await FileSystem.readAsStringAsync(localFile, {
              encoding: FileSystem.EncodingType.Base64,
            });
            if (b64) {
              svgPhotoReadyUri.current = null;
              loadedPhotoBgIdRef.current = background.id;
              expectedPhotoUri = `data:image/png;base64,${b64}`;
              setSharePhotoUri(expectedPhotoUri);
            }
          } catch {}
        }
      }

      if (needsPhoto && !expectedPhotoUri) throw new Error("verse_share_not_ready");
      const expectedLogoUri = brandLogoUri || await loadBrandLogoDataUri();
      if (!expectedLogoUri) throw new Error("verse_share_not_ready");
      if (!brandLogoUri) setBrandLogoUri(expectedLogoUri);
      await waitForVerseShareAssets(
        () => svgLogoReadyUri.current === expectedLogoUri &&
          shareRenderedPhotoRef.current === expectedPhotoUri &&
          (!expectedPhotoUri || svgPhotoReadyUri.current === expectedPhotoUri),
        () => scene === shareSceneRef.current,
      );

      const svgNode = shareSvgRef.current;
      if (svgNode && (await Sharing.isAvailableAsync())) {
        const exportDim = Platform.OS === "ios" ? shareSvgPt : 1080;
        const pngBase64 = await new Promise<string | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 2500);
          svgNode.toDataURL(
            (b64) => {
              clearTimeout(timeout);
              resolve(b64 || null);
            },
            { width: exportDim, height: exportDim },
          );
        });
        if (pngBase64) {
          if (scene !== shareSceneRef.current) throw new Error("verse_share_changed");
          if (!FileSystem.cacheDirectory) throw new Error("verse_share_not_ready");
          const outUri = `${FileSystem.cacheDirectory}versiculo-${verse.id}-${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(outUri, pngBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (Platform.OS === "ios") {
            const result = await Share.share({
              url: outUri,
            });
            if (result.action === Share.sharedAction && user?.emailVerified) {
              void api(`/verses/${verse.id}/share`, "POST", {})
                .then(() => refresh())
                .catch(() => {});
            }
          } else {
            await Sharing.shareAsync(outUri, {
              mimeType: "image/png",
              UTI: "public.png",
              dialogTitle: "Himnario El Buen Pastor",
            });
            if (user?.emailVerified) {
              void api(`/verses/${verse.id}/share`, "POST", {})
                .then(() => refresh())
                .catch(() => {});
            }
          }
          return;
        }
      }

      // A failed PNG export must not silently switch to an unrequested text/link share.
      throw new Error("verse_share_not_ready");
    } catch {
      setMessage(t.verseCardCouldNotShare);
    } finally {
      shareLockRef.current = false;
      setSharing(false);
    }
  };

  const icon = (ios: string, android: string) =>
    Platform.OS === "ios" ? ios : android;
  const menuTint = isDarkMode ? "#ffffff" : "#1c1c18";

  const moreActions: MenuAction[] = [
    {
      id: "customize",
      title: t.verseCardBackgrounds,
      image: icon("photo.on.rectangle", "ic_menu_gallery"),
      imageColor: menuTint,
    },
    {
      title: t.verseCardTextColor,
      image: icon("textformat", "ic_menu_sort_alphabetically"),
      imageColor: menuTint,
      subactions: [
        {
          id: "text:auto",
          title: t.verseCardAutomaticByBackground,
          state: textColorMode === "auto" ? "on" : "off",
        },
        {
          id: "text:light",
          title: t.verseCardWhiteText,
          state: textColorMode === "light" ? "on" : "off",
        },
        {
          id: "text:dark",
          title: t.verseCardBlackText,
          state: textColorMode === "dark" ? "on" : "off",
        },
      ],
    },
    {
      id: "copy",
      title: t.verseCardCopyVerse,
      image: icon("doc.on.doc", "ic_menu_edit"),
      imageColor: menuTint,
    },
    {
      id: "report",
      title: t.verseCardReportAnIssue,
      image: icon("flag", "ic_menu_report_image"),
      imageColor: menuTint,
    },
  ];

  const more = (id: string) => {
    if (id === "customize") {
      if (fullScreenOpen) {
        openModalFromFull("picker");
      } else {
        setPickerOpen(true);
      }
    }
    if (id === "copy")
      void Clipboard.setStringAsync(`${quote.text} — ${quote.ref}`).catch(
        () => {},
      );
    if (id === "report")
      void Linking.openURL("https://himnarioebp.com/feedback.html").catch(
        () => {},
      );
    if (id === "text:auto") updateTextColorMode("auto");
    if (id === "text:light") updateTextColorMode("light");
    if (id === "text:dark") updateTextColorMode("dark");
  };

  const cloudPresets = VERSE_BACKGROUNDS.filter((b) => Boolean(b.remoteUrl));
  const allCloudSaved =
    cloudPresets.length > 0 &&
    cloudPresets.every((b) => offlineBg.savedIds.has(b.id));
  const cloudCovers = HYMN_COVERS.filter((c) => Boolean(c.remoteUrl));
  const allCoversSaved =
    cloudCovers.length > 0 &&
    cloudCovers.every((c) => coverState.savedIds.has(c.id));

  const sectionGradient: [string, string, string] = isDarkMode
    ? ["#1C1C1E", "#0B0B0C", "#000000"]
    : ["#FFFFFF", "#F7F7FA", "#EAEAEF"];
  const topBorderColor = isDarkMode
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.05)";
  const headingColor = isDarkMode ? "#ffffff" : "#111111";
  const subColor = isDarkMode ? "rgba(235,235,245,0.6)" : "#6E6E73";

  return (
    <LinearGradient
      colors={sectionGradient}
      locations={[0, 0.55, 1]}
      style={[styles.band, { borderTopColor: topBorderColor }]}
    >
      <View style={styles.inner}>
        {/* Restored Apple Books-style Section Header */}
        <View style={styles.headerBlock}>
          <Text style={[styles.sectionTitle, { color: headingColor }]}>
            {t.verseCardVerseOfTheDay}
          </Text>
        </View>

        {/* Pill / Rounded Verse Card (only this box holds the photo/gradient) */}
        <View
          style={[
            styles.card,
            {
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <LinearGradient
            colors={cardBgColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {!isDefaultClassic && bgSource && imageFailedId !== background.id && (
            <Image
              source={bgSource}
              contentFit="cover"
              cachePolicy="disk"
              transition={220}
              onError={() => setImageFailedId(background.id)}
              style={StyleSheet.absoluteFill}
              accessibilityIgnoresInvertColors
            />
          )}
          <LinearGradient colors={scrimColors} style={StyleSheet.absoluteFill} />
          <View style={styles.content}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                t.verseCardViewFullScreenVerse
              }
              onPress={() => setFullScreenOpen(true)}
              style={{ gap: 6 }}
            >
              <Text style={[styles.cardRef, { color: fgColor }]}>
                {`${quote.ref} RVR09`}
              </Text>
              <Text
                numberOfLines={3}
                ellipsizeMode="tail"
                style={[styles.quote, { color: fgColor }]}
              >
                {quote.text}
              </Text>
            </Pressable>

            <View style={[styles.actions, { borderColor: borderFgColor }]}>
              <Pressable
                style={styles.action}
                onPress={() => like()}
                accessibilityLabel={`${t.playerLike}: ${summary.likesCount}`}
                accessibilityState={{
                  selected: summary.likedByMe,
                }}
              >
                <View style={{ width: 26, height: 24, alignItems: "center", justifyContent: "center" }}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      {
                        position: "absolute",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: "#FF2D55",
                      },
                      ringAnimStyle,
                    ]}
                  />
                  <Animated.View style={heartAnimStyle}>
                    <AppMenuIcon
                      ios={summary.likedByMe ? "heart.fill" : "heart"}
                      android={summary.likedByMe ? "favorite" : "favorite-border"}
                      color={summary.likedByMe ? "#FF2D55" : fgColor}
                      size={22}
                    />
                  </Animated.View>
                </View>
                <Text style={[styles.count, { color: fgColor }]}>
                  {summary.likesCount}
                </Text>
              </Pressable>
              <Pressable
                style={styles.action}
                onPress={() => setDiscussion(true)}
                accessibilityLabel={`${t.playerComments}: ${summary.commentsCount}`}
              >
                <AppMenuIcon
                  ios="bubble.right"
                  android="chat-bubble-outline"
                  color={fgColor}
                  size={22}
                />
                <Text style={[styles.count, { color: fgColor }]}>
                  {summary.commentsCount}
                </Text>
              </Pressable>
              <Pressable
                style={styles.action}
                disabled={sharing}
                onPress={() => void share()}
                accessibilityLabel={t.verseCardShareVerse}
              >
                <Animated.View
                  style={[
                    { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
                    shareAnimStyle,
                  ]}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color={fgColor} />
                  ) : (
                    <AppMenuIcon
                      ios="square.and.arrow.up"
                      android="share"
                      color={fgColor}
                      size={22}
                    />
                  )}
                </Animated.View>
                <Text style={[styles.count, { color: fgColor }]}>
                  {t.shareModalTitle}
                </Text>
              </Pressable>
              {HAS_NATIVE_MENU ? (
                <MenuView
                  actions={moreActions}
                  onPressAction={({ nativeEvent }) => more(nativeEvent.event)}
                  shouldOpenOnLongPress={false}
                  isAnchoredToRight
                >
                  <View
                    accessible
                    accessibilityRole="button"
                    style={styles.action}
                    accessibilityLabel={t.shareSystemMore}
                  >
                    <AppMenuIcon
                      ios="ellipsis"
                      android="more-horiz"
                      color={fgColor}
                      size={22}
                    />
                    <Text style={[styles.count, { color: fgColor }]}>
                      {t.shareMore}
                    </Text>
                  </View>
                </MenuView>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  style={styles.action}
                  accessibilityLabel={t.shareSystemMore}
                  onPress={() => setPickerOpen(true)}
                >
                  <AppMenuIcon
                    ios="ellipsis"
                    android="more-horiz"
                    color={fgColor}
                    size={22}
                  />
                </Pressable>
              )}
            </View>
            {!!message && (
              <Text
                accessibilityRole="alert"
                style={[styles.count, { color: fgColor }]}
              >
                {message}
              </Text>
            )}
          </View>
        </View>

        <ChoirRepertoire />
      </View>

      {/* ── Full-Screen Bible-App-Style Verse View ── */}
      <Modal
        visible={fullScreenOpen}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeFullAnimated}
        onDismiss={flushPendingModalAfterFull}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.55)" },
              fullBackdropStyle,
            ]}
          />
          <GestureDetector gesture={fullPan}>
            <Animated.View style={[styles.fullRoot, fullSheetAnimStyle]}>
            <LinearGradient
              colors={cardBgColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {!isDefaultClassic && bgSource && imageFailedId !== background.id && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
              >
                <Animated.View style={[StyleSheet.absoluteFill, fullKenBurnsStyle]}>
                  <Image
                    source={bgSource}
                    contentFit="cover"
                    cachePolicy="disk"
                    style={StyleSheet.absoluteFill}
                    accessibilityIgnoresInvertColors
                  />
                </Animated.View>
              </View>
            )}
            <LinearGradient colors={scrimColors} style={StyleSheet.absoluteFill} />

            <View
              style={[
                styles.fullTopBar,
                { paddingTop: Math.max(insets.top, 16) + 8 },
              ]}
            >
              <GlassSurface
                isInteractive
                forceDark={!isDefaultClassic || isDarkMode}
                glassEffectStyle={isDefaultClassic ? "regular" : "clear"}
                intensity={56}
                style={styles.fullCircleBtn}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={closeFullAnimated}
                  style={styles.fullCircleBtn}
                >
                  <AppMenuIcon
                    ios="xmark"
                    android="close"
                    color={fgColor}
                    size={18}
                    weight="semibold"
                  />
                </Pressable>
              </GlassSurface>
              {HAS_NATIVE_MENU ? (
                <MenuView
                  actions={moreActions}
                  onPressAction={({ nativeEvent }) => more(nativeEvent.event)}
                  shouldOpenOnLongPress={false}
                  isAnchoredToRight
                >
                  <GlassSurface
                    isInteractive
                    forceDark={!isDefaultClassic || isDarkMode}
                    glassEffectStyle={isDefaultClassic ? "regular" : "clear"}
                    intensity={56}
                    style={styles.fullCircleBtn}
                  >
                    <View
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={
                        t.shareSystemMore
                      }
                      style={styles.fullCircleBtn}
                    >
                      <AppMenuIcon
                        ios="ellipsis"
                        android="more-horiz"
                        color={fgColor}
                        size={19}
                        weight="semibold"
                      />
                    </View>
                  </GlassSurface>
                </MenuView>
              ) : (
                <GlassSurface
                  isInteractive
                  forceDark={!isDefaultClassic || isDarkMode}
                  glassEffectStyle={isDefaultClassic ? "regular" : "clear"}
                  intensity={56}
                  style={styles.fullCircleBtn}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      t.shareSystemMore
                    }
                    onPress={() => openModalFromFull("picker")}
                    style={styles.fullCircleBtn}
                  >
                    <AppMenuIcon
                      ios="ellipsis"
                      android="more-horiz"
                      color={fgColor}
                      size={19}
                      weight="semibold"
                    />
                  </Pressable>
                </GlassSurface>
              )}
            </View>

          <View style={styles.fullCenter}>
            <Text style={[styles.eyebrow, { color: subFgColor }]}>
              {t.verseCardVerseOfTheDay}
            </Text>
            <Text style={[styles.fullRef, { color: fgColor }]}>
              {`${quote.ref} RVR09`}
            </Text>
            <Text style={[styles.fullQuote, { color: fgColor }]}>
              {quote.text}
            </Text>
          </View>

          <View
            style={[
              styles.fullBottomBar,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
            <Pressable
              style={styles.fullAction}
              onPress={() => like()}
            >
              <View style={{ width: 28, height: 26, alignItems: "center", justifyContent: "center" }}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      borderWidth: 2,
                      borderColor: "#FF2D55",
                    },
                    ringAnimStyle,
                  ]}
                />
                <Animated.View style={heartAnimStyle}>
                  <AppMenuIcon
                    ios={summary.likedByMe ? "heart.fill" : "heart"}
                    android={summary.likedByMe ? "favorite" : "favorite-border"}
                    color={summary.likedByMe ? "#FF2D55" : fgColor}
                    size={25}
                  />
                </Animated.View>
              </View>
              <Text style={[styles.count, { color: fgColor }]}>
                {summary.likesCount}
              </Text>
            </Pressable>
            <Pressable
              style={styles.fullAction}
              onPress={() => {
                openModalFromFull("discussion");
              }}
            >
              <AppMenuIcon
                ios="bubble.right"
                android="chat-bubble-outline"
                color={fgColor}
                size={25}
              />
              <Text style={[styles.count, { color: fgColor }]}>
                {summary.commentsCount}
              </Text>
            </Pressable>
            <Pressable
              style={styles.fullAction}
              disabled={sharing}
              onPress={() => void share()}
            >
              <Animated.View
                style={[
                  { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
                  shareAnimStyle,
                ]}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={fgColor} />
                ) : (
                  <AppMenuIcon
                    ios="square.and.arrow.up"
                    android="share"
                    color={fgColor}
                    size={25}
                  />
                )}
              </Animated.View>
              <Text style={[styles.count, { color: fgColor }]}>
                {t.shareModalTitle}
              </Text>
            </Pressable>
          </View>
          </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Modal>

      {/* ── Background Gallery, Favorites, Offline Download & Text Color Modal ── */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          if (pickerPage !== "hub") {
            setPickerPage("hub");
          } else {
            closePickerAnimated();
          }
        }}
      >
        <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
          <GestureDetector gesture={pickerBackdropPan}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.48)" },
                pickerBackdropStyle,
              ]}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={closePickerAnimated}
                accessibilityLabel={t.close}
              />
            </Animated.View>
          </GestureDetector>
          <Animated.View style={pickerSheetAnimStyle}>
            <SheetGrabber inline />
          </Animated.View>
          <Animated.View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surfaceVariants.containerLow,
                paddingBottom: Math.max(insets.bottom, 16),
              },
              pickerSheetAnimStyle,
            ]}
          >
            <GestureDetector gesture={pickerPan}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                {pickerPage !== "hub" ? (
                  <GlassSurface
                    isInteractive
                    glassEffectStyle="regular"
                    intensity={56}
                    style={styles.closeHit}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPickerPage("hub");
                      }}
                      style={styles.closeHit}
                      accessibilityLabel={t.homeMenuBack}
                    >
                      <AppMenuIcon
                        ios="chevron.left"
                        android="arrow-back"
                        color={theme.onSurface}
                        size={18}
                        weight="semibold"
                      />
                    </Pressable>
                  </GlassSurface>
                ) : null}
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.onSurface, flex: 1 },
                    pickerPage !== "hub" && { textAlign: "center" },
                  ]}
                  numberOfLines={1}
                >
                  {pickerPage === "backgrounds"
                    ? t.verseCardVerseBackgrounds
                    : pickerPage === "covers"
                      ? t.verseCardHymnalCover
                      : t.verseCardVerseBackgroundText}
                </Text>
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={56}
                  style={styles.closeHit}
                >
                  <Pressable
                    onPress={closePickerAnimated}
                    style={styles.closeHit}
                    accessibilityLabel={t.close}
                  >
                    <AppMenuIcon
                      ios="xmark"
                      android="close"
                      color={theme.onSurface}
                      size={17}
                      weight="semibold"
                    />
                  </Pressable>
                </GlassSurface>
              </View>
            </View>
            </GestureDetector>

            <ScrollView
              key={pickerPage}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {pickerPage === "hub" && (
                <>
              {/* 1. Text Color Toggle (Auto + White/Black circles) */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    {t.verseCardTextColor2}
                  </Text>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      fontSize: 12,
                      ...fonts.sansRegular,
                    }}
                  >
                    {t.verseCardPickWhiteOrBlackText}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: textColorMode === "auto" }}
                    onPress={() => updateTextColorMode("auto")}
                    style={{
                      paddingHorizontal: 12,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        textColorMode === "auto"
                          ? theme.primary
                          : theme.surfaceVariants.containerHighest,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          textColorMode === "auto"
                            ? theme.onPrimary
                            : theme.onSurface,
                        ...fonts.sansSemiBold,
                        fontSize: 13,
                      }}
                    >
                      Auto
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={t.verseCardWhiteText}
                    accessibilityState={{ checked: textColorMode === "light" }}
                    onPress={() => updateTextColorMode("light")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#FFFFFF",
                      borderWidth: textColorMode === "light" ? 3 : 1,
                      borderColor:
                        textColorMode === "light"
                          ? theme.primary
                          : "rgba(128,128,128,0.45)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={t.verseCardBlackText}
                    accessibilityState={{ checked: textColorMode === "dark" }}
                    onPress={() => updateTextColorMode("dark")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#141413",
                      borderWidth: textColorMode === "dark" ? 3 : 1,
                      borderColor:
                        textColorMode === "dark"
                          ? theme.primary
                          : "rgba(255,255,255,0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                </View>
              </View>

              {/* 2. Structured Tappable Hub Cards for Verse Background & Hymnal Cover */}
              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.onSurfaceVariant, marginTop: 6 },
                ]}
              >
                {t.verseCardCustomization}
              </Text>

              {/* Tappable Verse Background Card */}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setPickerPage("backgrounds");
                }}
                style={({ pressed }) => [
                  styles.presetRow,
                  {
                    backgroundColor: theme.surfaceVariants.container,
                    borderColor: theme.outlineVariant,
                    borderWidth: StyleSheet.hairlineWidth,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <View style={styles.swatch}>
                  <LinearGradient
                    colors={cardBgColors}
                    style={StyleSheet.absoluteFill}
                  />
                  {!isDefaultClassic && bgSource && (
                    <Image
                      source={bgSource}
                      contentFit="cover"
                      cachePolicy="disk"
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[
                      styles.presetName,
                      { color: theme.onSurface, fontSize: 16 },
                    ]}
                  >
                    {t.verseCardVerseBackground}
                  </Text>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      fontSize: 13,
                      ...fonts.sansRegular,
                    }}
                    numberOfLines={1}
                  >
                    {isDefaultClassic
                      ? t.verseCardDefaultTheme
                      : background.label[language]}{" "}
                    ·{" "}
                    {es
                      ? `${offlineBg.savedIds.size}/${cloudPresets.length} sin conexión`
                      : `${offlineBg.savedIds.size}/${cloudPresets.length} offline`}
                  </Text>
                </View>
                <AppMenuIcon
                  ios="chevron.right"
                  android="chevron-right"
                  color={theme.onSurfaceVariant}
                  size={16}
                  weight="semibold"
                />
              </Pressable>

              {/* Tappable Hymnal Cover Card */}
              {(() => {
                const activeCover =
                  HYMN_COVERS.find((c) => c.id === coverState.selectedId) ||
                  HYMN_COVERS[0];
                const activeCoverSrc = activeCover.bundledSource
                  ? activeCover.bundledSource
                  : coverState.localUris[activeCover.id]
                    ? { uri: coverState.localUris[activeCover.id] }
                    : { uri: activeCover.remoteUrl! };
                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPickerPage("covers");
                    }}
                    style={({ pressed }) => [
                      styles.presetRow,
                      {
                        backgroundColor: theme.surfaceVariants.container,
                        borderColor: theme.outlineVariant,
                        borderWidth: StyleSheet.hairlineWidth,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        opacity: pressed ? 0.86 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.swatch,
                        {
                          width: 44,
                          height: 58,
                          backgroundColor: "#2b0912",
                        },
                      ]}
                    >
                      <Image
                        source={activeCoverSrc}
                        contentFit="cover"
                        cachePolicy="disk"
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={[
                          styles.presetName,
                          { color: theme.onSurface, fontSize: 16 },
                        ]}
                      >
                        {t.verseCardHymnalCover}
                      </Text>
                      <Text
                        style={{
                          color: theme.onSurfaceVariant,
                          fontSize: 13,
                          ...fonts.sansRegular,
                        }}
                        numberOfLines={1}
                      >
                        {activeCover.label[language]} ·{" "}
                        {es
                          ? `${coverState.savedIds.size}/${cloudCovers.length} sin conexión`
                          : `${coverState.savedIds.size}/${cloudCovers.length} offline`}
                      </Text>
                    </View>
                    <AppMenuIcon
                      ios="chevron.right"
                      android="chevron-right"
                      color={theme.onSurfaceVariant}
                      size={16}
                      weight="semibold"
                    />
                  </Pressable>
                );
              })()}
                </>
              )}

              {pickerPage === "backgrounds" && (
                <>
              {customBg !== null && (
                <Pressable
                  onPress={() => selectBackground(null)}
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 14,
                    backgroundColor: theme.surfaceVariants.containerHighest,
                  }}
                >
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 13,
                    }}
                  >
                    {t.verseCardUseDefaultBackgroundTheme}
                  </Text>
                </Pressable>
              )}

              {/* 3. Offline Download All Card */}
              <View
                style={[
                  styles.downloadCard,
                  {
                    backgroundColor: theme.surfaceVariants.container,
                    borderColor: theme.outlineVariant,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[styles.downloadTitle, { color: theme.onSurface }]}
                  >
                    {t.verseCardOfflineBackgrounds}
                  </Text>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      fontSize: 13,
                    }}
                  >
                    {es
                      ? `${offlineBg.savedIds.size} de ${cloudPresets.length} guardados · ${formatMb(offlineBg.bytes)}`
                      : `${offlineBg.savedIds.size} of ${cloudPresets.length} saved · ${formatMb(offlineBg.bytes)}`}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {!allCloudSaved && (
                    <Pressable
                      disabled={offlineBg.downloadingAll}
                      onPress={() => void downloadAllVerseBackgrounds()}
                      style={[
                        styles.smallActionBtn,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      {offlineBg.downloadingAll ? (
                        <ActivityIndicator size="small" color={theme.onPrimary} />
                      ) : (
                        <Text
                          style={{
                            color: theme.onPrimary,
                            ...fonts.sansSemiBold,
                            fontSize: 13,
                          }}
                        >
                          {t.verseCardDownloadAll}
                        </Text>
                      )}
                    </Pressable>
                  )}
                  {offlineBg.savedIds.size > 0 && (
                    <Pressable
                      disabled={offlineBg.downloadingAll}
                      onPress={() => void clearAllOfflineVerseBackgrounds()}
                      style={[
                        styles.smallActionBtn,
                        {
                          backgroundColor:
                            theme.surfaceVariants.containerHighest,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.onSurface,
                          ...fonts.sansSemiBold,
                          fontSize: 13,
                        }}
                      >
                        {t.verseCardClear}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* 4. Individual Backgrounds List (Pin + Favorite + Download) */}
              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                {t.verseCardChooseOrDownload}
              </Text>
              {VERSE_BACKGROUNDS.map((item) => {
                const isSelected = customBg === item.id;
                const isFav = favoriteIds.includes(item.id);
                const isSaved = offlineBg.savedIds.has(item.id);
                const isDownloading = offlineBg.downloadingIds.has(item.id);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.presetRow,
                      {
                        backgroundColor: theme.surfaceVariants.container,
                        borderColor: isSelected
                          ? theme.primary
                          : theme.outlineVariant,
                        borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.presetMainHit}
                      onPress={() => selectBackground(item.id)}
                    >
                      <View style={styles.swatch}>
                        <LinearGradient
                          colors={item.fallbackColors}
                          style={StyleSheet.absoluteFill}
                        />
                        {item.remoteUrl && (
                          <Image
                            source={resolveVerseBackgroundSource(
                              item,
                              offlineBg,
                            )}
                            contentFit="cover"
                            cachePolicy="disk"
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.presetName,
                            { color: theme.onSurface },
                          ]}
                        >
                          {item.label[language]}
                        </Text>
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            fontSize: 12,
                          }}
                        >
                          {item.remoteUrl
                            ? isSaved
                              ? t.verseCardSavedOnPhone
                              : `${t.verseCardCloud} · ${formatMb(item.approxBytes || 0)}`
                            : t.verseCardBuiltInOffline}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Favorite button */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        t.verseCardFavoriteBackground
                      }
                      onPress={() => toggleFavoriteBg(item.id)}
                      style={styles.iconActionHit}
                    >
                      <AppMenuIcon
                        ios={isFav ? "heart.fill" : "heart"}
                        android={isFav ? "favorite" : "favorite-border"}
                        color={isFav ? theme.primary : theme.onSurfaceVariant}
                        size={20}
                      />
                    </Pressable>

                    {/* Download / Remove button for cloud PNGs */}
                    {item.remoteUrl && (
                      <Pressable
                        accessibilityRole="button"
                        disabled={isDownloading}
                        accessibilityLabel={
                          isSaved
                            ? t.verseCardRemoveDownload
                            : t.verseCardDownloadBackground
                        }
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (isSaved) {
                            void removeOfflineVerseBackground(item.id);
                          } else {
                            void downloadVerseBackground(item.id);
                          }
                        }}
                        style={styles.iconActionHit}
                      >
                        {isDownloading ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.primary}
                          />
                        ) : (
                          <AppMenuIcon
                            ios={
                              isSaved
                                ? "checkmark.icloud.fill"
                                : "icloud.and.arrow.down"
                            }
                            android={
                              isSaved ? "offline-pin" : "cloud-download"
                            }
                            color={
                              isSaved ? theme.primary : theme.onSurfaceVariant
                            }
                            size={21}
                          />
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
                </>
              )}

              {pickerPage === "covers" && (
                <>
              {/* 5. Hymn Cover Section (Cloud + Offline Downloads + Favorites) */}
              <View
                style={[
                  styles.downloadCard,
                  {
                    backgroundColor: theme.surfaceVariants.container,
                    borderColor: theme.outlineVariant,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[styles.downloadTitle, { color: theme.onSurface }]}
                  >
                    {t.verseCardOfflineCovers}
                  </Text>
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      fontSize: 13,
                    }}
                  >
                    {es
                      ? `${coverState.savedIds.size} de ${cloudCovers.length} guardadas · ${formatMb(coverState.bytes)}`
                      : `${coverState.savedIds.size} of ${cloudCovers.length} saved · ${formatMb(coverState.bytes)}`}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {!allCoversSaved && (
                    <Pressable
                      disabled={coverState.downloadingAll}
                      onPress={() => void downloadAllHymnCovers()}
                      style={[
                        styles.smallActionBtn,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      {coverState.downloadingAll ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.onPrimary}
                        />
                      ) : (
                        <Text
                          style={{
                            color: theme.onPrimary,
                            ...fonts.sansSemiBold,
                            fontSize: 13,
                          }}
                        >
                          {t.verseCardDownloadAll}
                        </Text>
                      )}
                    </Pressable>
                  )}
                  {coverState.savedIds.size > 0 && (
                    <Pressable
                      disabled={coverState.downloadingAll}
                      onPress={() => void clearAllOfflineHymnCovers()}
                      style={[
                        styles.smallActionBtn,
                        {
                          backgroundColor:
                            theme.surfaceVariants.containerHighest,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.onSurface,
                          ...fonts.sansSemiBold,
                          fontSize: 13,
                        }}
                      >
                        {t.verseCardClear}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                {t.verseCardChooseOrDownloadCover}
              </Text>
              {HYMN_COVERS.map((item) => {
                const isSelected = coverState.selectedId === item.id;
                const isFav = coverState.favoriteIds.includes(item.id);
                const isSaved = coverState.savedIds.has(item.id);
                const isDownloading = coverState.downloadingIds.has(item.id);
                const previewSrc = item.bundledSource
                  ? item.bundledSource
                  : coverState.localUris[item.id]
                    ? { uri: coverState.localUris[item.id] }
                    : { uri: item.remoteUrl! };
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.presetRow,
                      {
                        backgroundColor: theme.surfaceVariants.container,
                        borderColor: isSelected
                          ? theme.primary
                          : theme.outlineVariant,
                        borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.presetMainHit}
                      onPress={() => {
                        Haptics.selectionAsync();
                        selectHymnCover(item.id);
                      }}
                    >
                      <View
                        style={[
                          styles.swatch,
                          {
                            width: 44,
                            height: 62,
                            borderRadius: 6,
                            backgroundColor: "transparent",
                          },
                        ]}
                      >
                        <Image
                          source={previewSrc}
                          contentFit="contain"
                          cachePolicy="disk"
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.presetName,
                            { color: theme.onSurface },
                          ]}
                        >
                          {item.label[language]}
                        </Text>
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            fontSize: 12,
                          }}
                        >
                          {item.remoteUrl
                            ? isSaved
                              ? t.verseCardSavedOnPhone2
                              : `${t.verseCardCloud} · ${formatMb(item.approxBytes || 0)}`
                            : t.verseCardBuiltInOffline2}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        t.verseCardFavoriteCover
                      }
                      onPress={() => {
                        Haptics.selectionAsync();
                        toggleFavoriteHymnCover(item.id);
                      }}
                      style={styles.iconActionHit}
                    >
                      <AppMenuIcon
                        ios={isFav ? "heart.fill" : "heart"}
                        android={isFav ? "favorite" : "favorite-border"}
                        color={isFav ? theme.primary : theme.onSurfaceVariant}
                        size={20}
                      />
                    </Pressable>

                    {item.remoteUrl && (
                      <Pressable
                        accessibilityRole="button"
                        disabled={isDownloading}
                        accessibilityLabel={
                          isSaved
                            ? t.verseCardRemoveDownload
                            : t.verseCardDownloadCover
                        }
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (isSaved) {
                            void removeOfflineHymnCover(item.id);
                          } else {
                            void downloadHymnCover(item.id);
                          }
                        }}
                        style={styles.iconActionHit}
                      >
                        {isDownloading ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.primary}
                          />
                        ) : (
                          <AppMenuIcon
                            ios={
                              isSaved
                                ? "checkmark.icloud.fill"
                                : "icloud.and.arrow.down"
                            }
                            android={
                              isSaved ? "offline-pin" : "cloud-download"
                            }
                            color={
                              isSaved ? theme.primary : theme.onSurfaceVariant
                            }
                            size={21}
                          />
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>

      <VerseDiscussionSheet
        visible={discussion}
        onVisitMember={() => { resumeDiscussion.current = true; }}
        onClose={() => setDiscussion(false)}
        verse={verse}
        onChanged={() => void refresh()}
      />

      {/* Offscreen 1080x1080 Verse Image Generator for Share */}
      {(() => {
        const len = quote.text.length;
        const svgFontSize =
          len <= 95 ? 52 : len <= 170 ? 44 : len <= 240 ? 36 : 31;
        const svgLineHeight = Math.round(svgFontSize * 1.24);
        const maxChars =
          len <= 95 ? 25 : len <= 170 ? 31 : len <= 240 ? 37 : 43;
        const lines = wrapLines(quote.text, maxChars);
        const blockHeight = (lines.length - 1) * svgLineHeight;
        const centerY = 550;
        const startY = Math.max(
          285,
          Math.min(540, Math.round(centerY - blockHeight / 2)),
        );
        const scrimHex = isDarkText ? "#FFFFFF" : "#000000";
        const scrimTopAlpha = isDarkText ? 0.16 : 0.16;
        const scrimBottomAlpha = isDarkText ? 0.56 : 0.62;
        return (
          <View
            pointerEvents="none"
            collapsable={false}
            style={{
              position: "absolute",
              left: -9999,
              top: 0,
              width: shareSvgPt,
              height: shareSvgPt,
            }}
          >
            <Svg
              ref={shareSvgRef}
              width={shareSvgPt}
              height={shareSvgPt}
              viewBox="0 0 1080 1080"
              preserveAspectRatio="xMidYMid meet"
            >
              <Defs>
                <SvgLinearGradient
                  id="verseBgGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor={cardBgColors[0]} />
                  <Stop offset="50%" stopColor={cardBgColors[1]} />
                  <Stop
                    offset="100%"
                    stopColor={cardBgColors[2] ?? cardBgColors[1]}
                  />
                </SvgLinearGradient>
                <SvgLinearGradient
                  id="verseScrimGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={scrimHex}
                    stopOpacity={scrimTopAlpha}
                  />
                  <Stop
                    offset="100%"
                    stopColor={scrimHex}
                    stopOpacity={scrimBottomAlpha}
                  />
                </SvgLinearGradient>
              </Defs>
              <Rect x={0} y={0} width={1080} height={1080} fill="url(#verseBgGrad)" />
              {!!sharePhotoUri && (
                <SvgImage
                  key={background.id}
                  href={{ uri: sharePhotoUri }}
                  x={0}
                  y={0}
                  width={1080}
                  height={1080}
                  preserveAspectRatio="xMidYMid slice"
                  onLoad={({nativeEvent}) => {
                    if (nativeEvent.source.width > 0 && nativeEvent.source.height > 0) svgPhotoReadyUri.current = sharePhotoUri;
                  }}
                />
              )}
              {!isDefaultClassic && (
                <Rect
                  x={0}
                  y={0}
                  width={1080}
                  height={1080}
                  fill="url(#verseScrimGrad)"
                />
              )}
              <SvgText
                x={96}
                y={135}
                fill={subFgColor}
                fontFamily="PublicSans_600SemiBold"
                fontSize={28}
                letterSpacing={3}
              >
                {t.verseCardVerseOfTheDay2}
              </SvgText>
              <SvgText
                x={96}
                y={196}
                fill={fgColor}
                fontFamily="PublicSans_800ExtraBold"
                fontSize={44}
              >
                {`${quote.ref} RVR09`}
              </SvgText>
              <SvgText
                x={96}
                y={startY}
                fill={fgColor}
                fontFamily="SourceSerif4_600SemiBold"
                fontSize={svgFontSize}
              >
                {lines.map((line, idx) => (
                  <TSpan
                    key={`${idx}-${line}`}
                    x={96}
                    dy={idx === 0 ? 0 : svgLineHeight}
                  >
                    {line}
                  </TSpan>
                ))}
              </SvgText>
              <Rect
                x={96}
                y={888}
                width={888}
                height={2}
                fill={borderFgColor}
              />
              {!!brandLogoUri && (
                <SvgImage
                  href={{ uri: brandLogoUri }}
                  onLoad={({nativeEvent}) => {
                    if (nativeEvent.source.width > 0 && nativeEvent.source.height > 0) svgLogoReadyUri.current = brandLogoUri;
                  }}
                  x={96}
                  y={922}
                  width={80}
                  height={80}
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
              <SvgText
                x={brandLogoUri ? 198 : 96}
                y={954}
                fill={fgColor}
                fontFamily="PublicSans_700Bold"
                fontSize={30}
              >
                Himnario El Buen Pastor
              </SvgText>
              <SvgText
                x={brandLogoUri ? 198 : 96}
                y={990}
                fill={subFgColor}
                fontFamily="PublicSans_400Regular"
                fontSize={24}
              >
                himnarioebp.com/app
              </SvgText>
            </Svg>
          </View>
        );
      })()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  band: {
    width: "100%",
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
  },
  headerBlock: {
    marginBottom: 14,
    gap: 3,
  },
  sectionTitle: {
    ...fonts.bold,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  sectionSub: {
    ...fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 210,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  content: { flex: 1, justifyContent: "space-between", padding: 20, gap: 14 },
  eyebrow: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  cardRef: {
    ...fonts.sansExtraBold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  quote: {
    ...fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
  },
  fullRoot: {
    flex: 1,
    justifyContent: "space-between",
  },
  fullTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  fullCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  fullCenter: {
    paddingHorizontal: 28,
    gap: 8,
  },
  fullRef: {
    ...fonts.sansExtraBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  fullQuote: {
    ...fonts.medium,
    fontSize: 27,
    lineHeight: 32,
    marginTop: 6,
  },
  fullBottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  fullAction: {
    alignItems: "center",
    gap: 5,
    minWidth: 56,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  action: {
    minHeight: 46,
    minWidth: 58,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  count: { ...fonts.sansSemiBold, fontSize: 12 },

  // Style & Background Picker Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  modalHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 10,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    ...fonts.bold,
    fontSize: 22,
    flex: 1,
  },
  closeHit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
    gap: 12,
  },
  sectionHeading: {
    ...fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    marginTop: 4,
  },
  segmentedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    minWidth: 96,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
  downloadCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  downloadTitle: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  smallActionBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    gap: 8,
  },
  presetMainHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  swatch: {
    width: 56,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
  },
  presetName: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  iconActionHit: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
