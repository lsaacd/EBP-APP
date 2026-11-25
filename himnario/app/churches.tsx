import SheetGrabber from "../components/SheetGrabber";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import MapView, { Marker, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { CameraView, Camera } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useNowPlaying } from "../context/NowPlayingContext";
import { fonts } from "../theme/theme";
import { useCommunityApi, communityError } from "../utils/communityApi";
import { buildSheetPanGesture } from "../utils/useSheetBackdropGesture";
import * as Haptics from "../utils/haptics";
import GlassSurface, { GlassGroup } from "../components/GlassSurface";
import LiquidGlassSegmented from "../components/LiquidGlassSegmented";
import AppMenuIcon from "../components/AppMenuIcon";
import DetentSheet from "../components/DetentSheet";
import { getExpoSwiftUI, isIOSLiquidGlassAvailable } from "../utils/expoSwiftUI";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedField } from "../components/AnimatedField";
import ActionToast, { type ActionToastMessage } from "../components/ActionToast";
import ListSortMenu, { type ListSortOption } from "../components/ListSortMenu";
import ChurchScheduleEditor, { canEditSchedule } from "../components/ChurchScheduleEditor";
import ChurchQrSheet from "../components/ChurchQrSheet";
import ChurchDetailActionBar from "../components/churches/ChurchDetailActionBar";
import FriendButton from "../components/FriendButton";
import { mergeChurchMembers, parseChurchMembers, parseChurchMembersOffset, type ChurchMemberProfile } from "../utils/friends";
import { seedMemberPreview } from "../utils/memberProfileCache";
import UserAvatar from "../components/UserAvatar";
import { MINISTRIES, choirDisplayName } from "../data/communityRules";
import { useApprovedChoirs } from "../utils/choirsStore";
import { getNextServiceSummary, parseServiceTimes } from "../utils/churchSchedule";
import { churchDisplayName, servantBareName, servantDisplayName } from "../utils/churchName";
import {
  buildChurchMapPins,
  churchShareUrl,
  parseCoordsOrMapsInput,
  formatDistance,
  formatDriveTime,
  formatDrivingEstimate,
  nearestIndex,
  type MapViewportRegion,
} from "../utils/churchMapUtils";
import { showSuccessToast } from "../utils/toast";
import { pickAndUploadChurchPhotos } from "../utils/churchPhotoUpload";
import { hasUnsavedChurchDraft, type ChurchFormSnapshot } from "../utils/churchDraft";
import {
  getAppleDrivingEstimate,
  presentAppleLookAround,
  type AppleDrivingEstimate,
} from "../modules/apple-look-around";

const SUBMIT_SHEET_SPRING = {
  damping: 28,
  stiffness: 240,
  mass: 1,
  overshootClamping: true,
};

const CHURCH_PIN_IMG = require("../assets/images/church-pin.png");
const CHURCH_PIN_SELECTED_IMG = require("../assets/images/church-pin-selected.png");

/**
 * Custom Fabric-safe Church Map Marker.
 *
 * `react-native-maps@1.29` iOS `AIRMapMarker.setImageSrc:` calls `[RCTBridge currentBridge]`,
 * which is nil under Bridgeless Fabric (React Native 0.88 / Expo SDK 58), making `<Marker image={...} />`
 * invisible (0x0). Rendering an explicit-sized `<Image>` child routes through Fabric's image loader
 * and keeps anchor/bounds rock-solid on both iOS Apple Maps and Android Google Maps.
 */
function ChurchPinMarker({
  church,
  isSelected,
  onPress,
}: {
  church: VerifiedChurch;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [androidTrack, setAndroidTrack] = useState(Platform.OS === "android");
  const pinW = isSelected ? 48 : 40;
  const pinH = isSelected ? 43 : 36;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const timer = setTimeout(() => setAndroidTrack(false), 320);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: church.lat, longitude: church.lng }}
      anchor={{ x: 0.5, y: 0.88 }}
      centerOffset={{ x: 0, y: -16 }}
      tracksViewChanges={Platform.OS === "android" ? androidTrack : false}
      zIndex={isSelected ? 20 : 1}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
    >
      <View collapsable={false} style={styles.churchPinSlot}>
        <Image
          source={isSelected ? CHURCH_PIN_SELECTED_IMG : CHURCH_PIN_IMG}
          style={{ width: pinW, height: pinH }}
          resizeMode="contain"
          fadeDuration={0}
          onLoadEnd={
            Platform.OS === "android"
              ? () => {
                  setTimeout(() => setAndroidTrack(false), 120);
                }
              : undefined
          }
        />
      </View>
    </Marker>
  );
}

export interface VerifiedChurch {
  id: string;
  name: string;
  pastorName: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  lat: number;
  lng: number;
  serviceTimes: string | null;
  photoUrl?: string | null;
  photos?: string[];
  contactInfo?: string | null;
  submittedByName?: string | null;
  verified: boolean;
  status: "pending" | "approved" | "rejected";
}

export function getChurchPhotos(church: VerifiedChurch | null | undefined): string[] {
  if (!church) return [];
  const list: string[] = [];
  if (Array.isArray(church.photos)) {
    for (const u of church.photos) {
      if (typeof u === "string" && u.trim() && !list.includes(u.trim())) {
        list.push(u.trim());
      }
    }
  }
  if (typeof church.photoUrl === "string" && church.photoUrl.trim() && !list.includes(church.photoUrl.trim())) {
    list.unshift(church.photoUrl.trim());
  }
  return list;
}

const DEFAULT_REGION: Region = {
  latitude: 28.5,
  longitude: -101.0,
  latitudeDelta: 34,
  longitudeDelta: 34,
};


const LIST_HEADER_HEIGHT = 52;
// Height of the two rows of glass controls below the status bar.
const TOP_CONTROLS_HEIGHT = 112;

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export default function ChurchesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; scan?: string }>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const es = language === "es";
  const { user, openAuthSheet, updateProfile, refreshUser } = useAuth();
  const { currentHymnId } = useNowPlaying();
  const api = useCommunityApi();
  const mapRef = useRef<MapView | null>(null);

  const isIOS = Platform.OS === "ios";
  const isAdmin =
    user?.role === "admin" &&
    user.email.toLowerCase() === "isaacduran167@gmail.com";
  const maxPhotos = isAdmin ? 10 : 5;

  const [churches, setChurches] = useState<VerifiedChurch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<VerifiedChurch | null>(
    null,
  );
  // ── Bottom sheet (Apple Maps style): collapsed → half → full ─────────────
  const [snapIndex, setSnapIndex] = useState(Platform.OS === "web" ? 2 : 0);
  const [detailBodyHeight, setDetailBodyHeight] = useState(0);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(0);
  const listSnapBeforeDetailRef = useRef(0);
  const pendingLinkChurchIdRef = useRef<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  // True when this screen was opened only to scan (Account → "Scan QR Code"):
  // cancelling the scanner then returns to where the user came from.
  const scannerOnlyVisitRef = useRef(false);
  const [lookingAroundId, setLookingAroundId] = useState<string | null>(null);
  const [qrShareChurch, setQrShareChurch] = useState<VerifiedChurch | null>(null);
  const qrScanLockedRef = useRef(false);
  const handledDeepLinkRef = useRef<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [viewerCoords, setViewerCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<MapViewportRegion>(DEFAULT_REGION);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [pendingChurches, setPendingChurches] = useState<VerifiedChurch[]>([]);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, boolean>>({});
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [settingMyChurchId, setSettingMyChurchId] = useState<string | null>(
    null,
  );
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const [churchMembersOpen, setChurchMembersOpen] = useState(false);
  const [churchMembers, setChurchMembers] = useState<ChurchMemberProfile[]>([]);
  const [churchMembersTotal, setChurchMembersTotal] = useState<number | null>(null);
  const [churchMembersLoading, setChurchMembersLoading] = useState(false);
  const [churchMembersFailed, setChurchMembersFailed] = useState(false);
  const [churchMembersNextOffset, setChurchMembersNextOffset] = useState<number | null>(null);
  const churchMembersRequest = useRef(0);
  const churchRepairAttemptRef = useRef<string | null>(null);

  // Submit / Add / Edit Church Modal State
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<VerifiedChurch | null>(null);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [pinPickerCenter, setPinPickerCenter] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_REGION.latitude,
    lng: DEFAULT_REGION.longitude,
  });
  const [formName, setFormName] = useState("");
  const [formPastor, setFormPastor] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formCountry, setFormCountry] = useState(
    t.churchUnitedStates,
  );
  const [formPostal, setFormPostal] = useState("");
  const [formCoordsInput, setFormCoordsInput] = useState("");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formSchedule, setFormSchedule] = useState("");
  const [formContact, setFormContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [showCoordsInput, setShowCoordsInput] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);
  const [formToast, setFormToast] = useState<ActionToastMessage | null>(null);
  const formToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPastedCoordsRef = useRef("");
  const initialEditSnapshotRef = useRef<ChurchFormSnapshot | null>(null);
  const formAddressRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const formCityRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const formStateRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const formCountryRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const formPostalRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const showFormToast = useCallback(
    (title: string, subtitle?: string, icon: ActionToastMessage["icon"] = "check") => {
      if (formToastTimerRef.current) clearTimeout(formToastTimerRef.current);
      setFormToast({ id: Date.now(), title, subtitle, icon });
      formToastTimerRef.current = setTimeout(() => {
        setFormToast(null);
        formToastTimerRef.current = null;
      }, 2600);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (formToastTimerRef.current) clearTimeout(formToastTimerRef.current);
    };
  }, []);
  // Legacy schedules the picker cannot represent stay editable as plain text.
  const [scheduleAsText, setScheduleAsText] = useState(false);
  const parsedFormCoords = useMemo(
    () => parseCoordsOrMapsInput(formCoordsInput),
    [formCoordsInput],
  );

  const travel = Math.max(windowHeight, 600) + 40;
  const sheetSpring = SUBMIT_SHEET_SPRING;
  const submitProgress = useSharedValue(1);
  const submitDragOrigin = useSharedValue(0);
  const submitBackdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - submitProgress.value,
  }));
  const submitSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: submitProgress.value * travel }],
  }));

  useEffect(() => {
    if (submitOpen) {
      submitProgress.value = 1;
      submitProgress.value = withSpring(0, sheetSpring);
    } else {
      submitProgress.value = 1;
    }
    return () => cancelAnimation(submitProgress);
  }, [submitOpen, submitProgress]);

  const pendingSubmitAlertRef = useRef<{ title: string; body: string } | null>(null);

  const flushPendingSubmitAlert = useCallback(() => {
    const alert = pendingSubmitAlertRef.current;
    if (!alert) return;
    pendingSubmitAlertRef.current = null;
    Alert.alert(alert.title, alert.body);
  }, []);

  const finishCloseSubmit = useCallback(() => {
    setSubmitOpen(false);
    if (Platform.OS !== "ios") {
      flushPendingSubmitAlert();
    }
  }, [flushPendingSubmitAlert]);

  const closeSubmitAnimated = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    submitProgress.value = withTiming(
      1,
      { duration: 240, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishCloseSubmit)();
      },
    );
  }, [finishCloseSubmit, submitProgress]);

  const isFormDirty = useCallback(() => {
    return hasUnsavedChurchDraft(
      {
        name: formName,
        pastor: formPastor,
        address: formAddress,
        city: formCity,
        state: formState,
        country: formCountry,
        postal: formPostal,
        coordsInput: formCoordsInput,
        photos: formPhotos,
        photoUrl: formPhotoUrl,
        schedule: formSchedule,
        contact: formContact,
      },
      initialEditSnapshotRef.current,
      t.churchUnitedStates,
    );
  }, [
    formAddress,
    formCity,
    formContact,
    formCoordsInput,
    formCountry,
    formName,
    formPastor,
    formPhotoUrl,
    formPhotos,
    formPostal,
    formSchedule,
    formState,
    t.churchUnitedStates,
  ]);

  const clearDraftAndClose = useCallback(() => {
    initialEditSnapshotRef.current = null;
    setEditingChurch(null);
    setFormName("");
    setFormPastor("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormCountry(t.churchUnitedStates);
    setFormPostal("");
    setFormCoordsInput("");
    setFormPhotos([]);
    setFormPhotoUrl("");
    setFormSchedule("");
    setFormContact("");
    setFormError("");
    setLocationChanged(false);
    setFormToast(null);
    lastPastedCoordsRef.current = "";
    closeSubmitAnimated();
  }, [closeSubmitAnimated, t.churchUnitedStates]);

  const requestCloseSubmit = useCallback(() => {
    if (submitting) return;
    if (!isFormDirty()) {
      closeSubmitAnimated();
      return;
    }
    Keyboard.dismiss();
    submitProgress.value = withSpring(0, sheetSpring);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t.churchDiscardDraftTitle, t.churchDiscardDraftBody, [
      { text: t.churchKeepEditing, style: "cancel" },
      {
        text: t.churchDiscardAction,
        style: "destructive",
        onPress: clearDraftAndClose,
      },
    ]);
  }, [
    clearDraftAndClose,
    closeSubmitAnimated,
    isFormDirty,
    submitProgress,
    submitting,
    t.churchDiscardAction,
    t.churchDiscardDraftBody,
    t.churchDiscardDraftTitle,
    t.churchKeepEditing,
  ]);

  const handleSubmitSwipeDismiss = useCallback(
    (progressAtEnd: number) => {
      if (submitting) {
        submitProgress.value = withSpring(0, sheetSpring);
        return;
      }
      if (isFormDirty()) {
        requestCloseSubmit();
        return;
      }
      Keyboard.dismiss();
      const remaining = Math.max(0.05, 1 - progressAtEnd);
      const duration = Math.max(110, Math.min(240, Math.round(remaining * 240)));
      submitProgress.value = withTiming(
        1,
        { duration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(finishCloseSubmit)();
        },
      );
    },
    [finishCloseSubmit, isFormDirty, requestCloseSubmit, submitProgress, submitting],
  );

  const submitPan = buildSheetPanGesture({
    progress: submitProgress,
    dragOrigin: submitDragOrigin,
    travel,
    onFinishDismiss: finishCloseSubmit,
    onInterceptDismiss: handleSubmitSwipeDismiss,
    collapseRatio: 0.42,
  });

  const submitBackdropPan = buildSheetPanGesture({
    progress: submitProgress,
    dragOrigin: submitDragOrigin,
    travel,
    onFinishDismiss: finishCloseSubmit,
    onInterceptDismiss: handleSubmitSwipeDismiss,
    collapseRatio: 0.42,
  });

  const hasCenteredInitialRef = useRef(false);
  const userCoordsRef = useRef(userCoords);
  userCoordsRef.current = userCoords;
  const drivingEstimateCacheRef = useRef<Map<string, AppleDrivingEstimate>>(new Map());
  const [selectedDrivingEstimate, setSelectedDrivingEstimate] =
    useState<AppleDrivingEstimate | null>(null);

  useEffect(() => {
    if (!selectedChurch || !userCoords || Platform.OS !== "ios") {
      setSelectedDrivingEstimate(null);
      return;
    }
    const cacheKey = `${selectedChurch.id}:${Math.round(userCoords.lat * 500)}:${Math.round(userCoords.lng * 500)}`;
    const cached = drivingEstimateCacheRef.current.get(cacheKey);
    if (cached) {
      setSelectedDrivingEstimate(cached);
      return;
    }
    setSelectedDrivingEstimate(null);
    let cancelled = false;
    void getAppleDrivingEstimate(
      userCoords.lat,
      userCoords.lng,
      selectedChurch.lat,
      selectedChurch.lng,
    ).then((est) => {
      if (cancelled || !est) return;
      drivingEstimateCacheRef.current.set(cacheKey, est);
      setSelectedDrivingEstimate(est);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedChurch, userCoords]);

  const loadChurches = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [res, modRes] = await Promise.all([
          api<{
            churches: VerifiedChurch[];
            viewerCoords?: { lat: number; lng: number } | null;
          }>("/churches"),
          isAdmin
            ? api<{ churches: VerifiedChurch[] }>("/mod/churches").catch(() => ({
                churches: [] as VerifiedChurch[],
              }))
            : Promise.resolve({ churches: [] as VerifiedChurch[] }),
        ]);
        const approved = res.churches || [];
        setChurches(approved);
        if (isAdmin) {
          setPendingChurches(
            (modRes.churches || []).filter((c) => c.status === "pending"),
          );
        } else {
          setPendingChurches([]);
        }
        if (res.viewerCoords) {
          setViewerCoords(res.viewerCoords);
          if (!hasCenteredInitialRef.current && !userCoordsRef.current && approved.length === 0) {
            hasCenteredInitialRef.current = true;
            const region: Region = {
              latitude: res.viewerCoords.lat,
              longitude: res.viewerCoords.lng,
              latitudeDelta: 3.5,
              longitudeDelta: 3.5,
            };
            setMapRegion(region);
            mapRef.current?.animateToRegion(region, 500);
          }
        }
      } catch (e) {
        setError(communityError(e, es));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api, es, isAdmin],
  );

  useEffect(() => {
    void loadChurches();
  }, [loadChurches]);

  // Frame the nearest verified church (and user dot when nearby) once data loads
  // so markers are immediately visible even when location resolves after mount.
  useEffect(() => {
    if (Platform.OS === "web" || loading || churches.length === 0 || params.id) return;
    if (hasCenteredInitialRef.current || !mapRef.current) return;
    hasCenteredInitialRef.current = true;

    const origin = userCoords ?? viewerCoords;
    const nearest = origin ? churches[nearestIndex(origin, churches)] : churches[0];
    if (!nearest) return;

    if (userCoords && haversineMiles(userCoords.lat, userCoords.lng, nearest.lat, nearest.lng) <= 150) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: userCoords.lat, longitude: userCoords.lng },
          { latitude: nearest.lat, longitude: nearest.lng },
        ],
        {
          edgePadding: {
            top: insets.top + TOP_CONTROLS_HEIGHT + 36,
            right: 64,
            bottom: 110,
            left: 64,
          },
          animated: false,
        },
      );
      return;
    }

    const region: Region = {
      latitude: nearest.lat,
      longitude: nearest.lng,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    };
    mapRef.current.animateToRegion(region, 420);
  }, [churches, insets.top, loading, params.id, userCoords, viewerCoords]);

  const requestNearMe = useCallback(
    async (focusMap = true) => {
      if (Platform.OS === "web") return;
      Haptics.selectionAsync();
      setLocating(true);
      setLocationDenied(false);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationDenied(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        if (focusMap && mapRef.current) {
          // "Near me" answers "which church is closest?": frame the user and
          // the nearest church together and open that church's card.
          const nearest = churches[nearestIndex(coords, churches)];
          if (nearest) {
            listSnapBeforeDetailRef.current = 0;
            setSelectedChurch(nearest);
            setCarouselIndex(0);
            setSnapIndex(1);
            mapRef.current.fitToCoordinates(
              [
                { latitude: coords.lat, longitude: coords.lng },
                { latitude: nearest.lat, longitude: nearest.lng },
              ],
              {
                edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
                animated: true,
              },
            );
          } else {
            mapRef.current.animateToRegion(
              {
                latitude: coords.lat,
                longitude: coords.lng,
                latitudeDelta: 0.35,
                longitudeDelta: 0.35,
              },
              550,
            );
          }
        }
      } catch {
        setLocationDenied(true);
      } finally {
        setLocating(false);
      }
    },
    [churches],
  );

  // Silently check existing location permission on mount (without prompting)
  useEffect(() => {
    if (Platform.OS === "web") return;
    void Location.getForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status === "granted") {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            setUserCoords({
              lat: last.coords.latitude,
              lng: last.coords.longitude,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const availableCountries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of churches) {
      const clean = (c.country || "").trim();
      if (clean) counts.set(clean, (counts.get(clean) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country);
  }, [churches]);

  const [churchSort, setChurchSort] = useState<"nearest" | "az" | "region">("nearest");

  const churchSortOptions = useMemo<readonly ListSortOption<"nearest" | "az" | "region">[]>(
    () => [
      { value: "nearest", label: t.sortNearest, shortLabel: t.sortNearestShort, iosIcon: "location" },
      { value: "az", label: t.sortByAZ, shortLabel: t.sortByAZShort, iosIcon: "textformat.abc" },
      { value: "region", label: t.sortByRegion, shortLabel: t.sortByRegionShort, iosIcon: "globe" },
    ],
    [t.sortByAZ, t.sortByAZShort, t.sortByRegion, t.sortByRegionShort, t.sortNearest, t.sortNearestShort],
  );

  const enrichedChurches = useMemo(() => {
    const fold = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = fold(search.trim());
    const list = churches
      .map((c) => ({
        ...c,
        distanceMiles: userCoords
          ? haversineMiles(userCoords.lat, userCoords.lng, c.lat, c.lng)
          : null,
      }))
      .filter((c) => {
        if (countryFilter && c.country !== countryFilter) return false;
        if (!q) return true;
        return fold(
          [
            c.name,
            c.pastorName || "",
            c.address,
            c.city,
            c.state || "",
            c.country,
            c.postalCode || "",
          ].join(" "),
        ).includes(q);
      });
    if (churchSort === "az") {
      list.sort((a, b) =>
        churchDisplayName(a.name, a.city).localeCompare(
          churchDisplayName(b.name, b.city),
        ),
      );
    } else if (churchSort === "region") {
      list.sort((a, b) => {
        const cmpCountry = (a.country || "").localeCompare(b.country || "");
        if (cmpCountry !== 0) return cmpCountry;
        const cmpState = (a.state || "").localeCompare(b.state || "");
        if (cmpState !== 0) return cmpState;
        const cmpCity = (a.city || "").localeCompare(b.city || "");
        if (cmpCity !== 0) return cmpCity;
        return churchDisplayName(a.name, a.city).localeCompare(
          churchDisplayName(b.name, b.city),
        );
      });
    } else if (userCoords) {
      list.sort(
        (a, b) => (a.distanceMiles ?? 99999) - (b.distanceMiles ?? 99999),
      );
    }
    return list;
  }, [churches, churchSort, countryFilter, search, userCoords]);

  const mapPins = useMemo(
    () => buildChurchMapPins(enrichedChurches, mapRegion, selectedChurch?.id),
    [enrichedChurches, mapRegion, selectedChurch?.id],
  );


  const closestChurch = useMemo(() => {
    if (!userCoords || enrichedChurches.length === 0) return null;
    let best = enrichedChurches[0];
    for (const c of enrichedChurches) {
      if ((c.distanceMiles ?? 99999) < (best.distanceMiles ?? 99999)) {
        best = c;
      }
    }
    return best;
  }, [enrichedChurches, userCoords]);

  const focusChurchOnMap = useCallback((church: VerifiedChurch) => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    // Remember where the list was resting so closing the card returns there.
    if (!selectedChurch) {
      listSnapBeforeDetailRef.current = snapIndex === 2 ? 1 : snapIndex;
    }
    setSnapIndex(1);
    setSelectedChurch(church);
    setCarouselIndex(0);
    if (Platform.OS !== "web") {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: church.lat,
            longitude: church.lng,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          480,
        );
      }, 60);
    }
  }, [selectedChurch, snapIndex]);

  useEffect(() => {
    if (params.scan === "1" && handledDeepLinkRef.current !== "scan:1") {
      handledDeepLinkRef.current = "scan:1";
      void (async () => {
        if (Platform.OS === "web") return;
        const perm = await Camera.requestCameraPermissionsAsync();
        if (perm.granted) {
          qrScanLockedRef.current = false;
          scannerOnlyVisitRef.current = true;
          setQrScannerOpen(true);
        } else {
          Alert.alert(
            t.churchCameraPermission,
            t.churchEnableCameraPermissionInSettingsTo,
            [{ text: "OK", onPress: () => router.back() }],
          );
        }
      })();
    }
  }, [t, es, params.scan, router]);

  const dismissQrScanner = useCallback(() => {
    setQrScannerOpen(false);
    if (scannerOnlyVisitRef.current) {
      scannerOnlyVisitRef.current = false;
      router.back();
    }
  }, [router]);

  useEffect(() => {
    if (!params.id || churches.length === 0) return;
    const key = `id:${params.id}`;
    if (handledDeepLinkRef.current === key) return;
    const found = churches.find((c) => c.id === params.id);
    if (found) {
      handledDeepLinkRef.current = key;
      focusChurchOnMap(found);
    }
  }, [churches, focusChurchOnMap, params.id]);

  const handleQrScanned = useCallback(
    (result: { data?: string }) => {
      if (qrScanLockedRef.current) return;
      const raw = String(result?.data || "").trim();
      if (!raw) return;
      qrScanLockedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setQrScannerOpen(false);
      const scannerOnlyVisit = scannerOnlyVisitRef.current;
      scannerOnlyVisitRef.current = false;

      const safeDecode = (val: string) => {
        try {
          return decodeURIComponent(val);
        } catch {
          return val;
        }
      };

      // 1. Check for church QR link
      const churchMatch =
        raw.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
        raw.match(/\/churches\/([a-zA-Z0-9_-]+)/i) ||
        raw.match(/^church:([a-zA-Z0-9_-]+)$/i);
      if (churchMatch && (raw.includes("church") || raw.startsWith("church:"))) {
        const targetId = safeDecode(churchMatch[1]);
        const found = churches.find((c) => c.id === targetId);
        if (found) {
          focusChurchOnMap(found);
          return;
        }
      }

      // 2. Check for hymn QR link
      const hymnMatch =
        raw.match(/\/hymn\/([a-zA-Z0-9%_-]+)/i) ||
        raw.match(/[?&]hymn=([a-zA-Z0-9%_-]+)/i) ||
        raw.match(/^hymn:([a-zA-Z0-9%_-]+)$/i);
      if (hymnMatch) {
        const hymnId = safeDecode(hymnMatch[1]);
        // Opened just to scan: the hymn takes the map's place in the stack.
        if (scannerOnlyVisit) router.replace(`/hymn/${encodeURIComponent(hymnId)}` as any);
        else router.push(`/hymn/${encodeURIComponent(hymnId)}` as any);
        return;
      }

      // 3. Fallback alert if unrecognized QR
      Alert.alert(
        t.churchQrCodeScanned,
        t.churchThisQrCodeDoesNotMatch,
      );
    },
    [t, churches, focusChurchOnMap, router],
  );

  const openStreetPreview = useCallback(
    async (church: VerifiedChurch) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLookingAroundId(church.id);
      try {
        if (Platform.OS === "ios") {
          const presented = await presentAppleLookAround(church.lat, church.lng, {
            primaryTitle: church.address,
            secondaryTitle: `${church.city}${church.state ? `, ${church.state}` : ""}`,
            doneLabel: t.done,
          });
          if (presented) return;
        }
        if (Platform.OS === "android") {
          const androidSvUrl = `google.streetview:cbll=${church.lat},${church.lng}`;
          const canOpen = await Linking.canOpenURL(androidSvUrl).catch(() => false);
          if (canOpen) {
            await Linking.openURL(androidSvUrl);
            return;
          }
        }
        const webPanoUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${church.lat},${church.lng}`;
        await Linking.openURL(webPanoUrl);
      } catch {
        // Ignore cancelled link
      } finally {
        setLookingAroundId(null);
      }
    },
    [t],
  );

  const openDirections = useCallback(
    (church: VerifiedChurch) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const label = encodeURIComponent(church.name);
      const query = encodeURIComponent(
        `${church.address}, ${church.city}${church.state ? `, ${church.state}` : ""}, ${church.country}`,
      );
      const appleUrl = `maps://?daddr=${church.lat},${church.lng}&q=${label}`;
      const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}&destination_place_id=&query=${query}`;

      if (Platform.OS === "ios") {
        Alert.alert(
          t.churchGetDirections,
          `${churchDisplayName(church.name, church.city)}\n${church.address}, ${church.city}`,
          [
            {
              text: "Apple Maps",
              onPress: () => void Linking.openURL(appleUrl).catch(() => {}),
            },
            {
              text: "Google Maps",
              onPress: () => void Linking.openURL(googleUrl).catch(() => {}),
            },
            { text: t.cancel, style: "cancel" },
          ],
        );
      } else {
        void Linking.openURL(googleUrl).catch(() => {});
      }
    },
    [t],
  );

  const churchViewerId = user?.id;
  const linkedChurchId = user?.churchId;
  const linkedChurchName = user?.churchName;
  const loadChurchMembers = useCallback(
    async (churchId: string, offset = 0) => {
      if (!churchViewerId) return;
      const request = ++churchMembersRequest.current;
      setChurchMembersLoading(true);
      setChurchMembersFailed(false);
      try {
        const res = await api<{ members?: unknown; nextOffset?: unknown; total?: unknown }>(
          `/churches/${encodeURIComponent(churchId)}/members?offset=${offset}`,
        );
        if (request !== churchMembersRequest.current) return;
        const members = parseChurchMembers(res?.members);
        setChurchMembers(current => offset ? mergeChurchMembers(current, members) : members);
        setChurchMembersTotal(typeof res?.total === 'number' && Number.isFinite(res.total) ? res.total : members.length);
        setChurchMembersNextOffset(parseChurchMembersOffset(res?.nextOffset));
        if (!linkedChurchId && linkedChurchName && churchRepairAttemptRef.current !== churchViewerId) {
          churchRepairAttemptRef.current = churchViewerId;
          void refreshUser().catch(() => {});
        }
      } catch {
        if (request === churchMembersRequest.current) {
          setChurchMembers([]);
          setChurchMembersTotal(null);
          setChurchMembersNextOffset(null);
          setChurchMembersFailed(true);
        }
      } finally {
        if (request === churchMembersRequest.current) setChurchMembersLoading(false);
      }
    },
    [api, refreshUser, churchViewerId, linkedChurchId, linkedChurchName],
  );

  useEffect(() => {
    setChurchMembersOpen(false);
    setChurchMembers([]);
    setChurchMembersTotal(null);
    setChurchMembersNextOffset(null);
    setChurchMembersLoading(false);
    setChurchMembersFailed(false);
    return () => { churchMembersRequest.current += 1; };
  }, [selectedChurch?.id, user?.id]);

  useEffect(() => {
    if (selectedChurch?.id && churchViewerId) void loadChurchMembers(selectedChurch.id);
  }, [selectedChurch?.id, churchViewerId, loadChurchMembers]);

  const handleSetMyChurch = useCallback(
    async (church: VerifiedChurch) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!user) {
        pendingLinkChurchIdRef.current = church.id;
        openAuthSheet();
        return;
      }
      const alreadyMine =
        user.churchId === church.id ||
        (!user.churchId && user.churchName === church.name);
      if (alreadyMine) {
        // Tapping the green "Your church" button offers to remove the link.
        Alert.alert(
          t.churchRemoveMyChurchTitle,
          es
            ? `“${churchDisplayName(church.name, church.city)}” dejará de aparecer como tu iglesia en tu perfil.`
            : `“${churchDisplayName(church.name, church.city)}” will no longer show as your church on your profile.`,
          [
            { text: t.cancel, style: "cancel" },
            {
              text: t.churchRemoveMyChurchConfirm,
              style: "destructive",
              onPress: () => {
                setSettingMyChurchId(church.id);
                void updateProfile({ churchId: null, churchName: null })
                  .then(() =>
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
                  )
                  .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
                  .finally(() => setSettingMyChurchId(null));
              },
            },
          ],
        );
        return;
      }
      setSettingMyChurchId(church.id);
      try {
        const loc = [church.country, church.state ? `${church.city}, ${church.state}` : church.city]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 80);
        await updateProfile({
          churchId: church.id,
          churchName: church.name.slice(0, 80),
          location: loc || null,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t.churchChurchSynced,
          es
            ? `“${churchDisplayName(church.name, church.city)}” ahora aparece como tu iglesia en tu perfil.`
            : `“${churchDisplayName(church.name, church.city)}” now shows as your church on your profile.`,
        );
      } catch (e) {
        Alert.alert(t.churchError, communityError(e, es));
      } finally {
        setSettingMyChurchId(null);
      }
    },
    [t, es, openAuthSheet, updateProfile, user],
  );

  const openQrScanner = useCallback(async () => {
    if (Platform.OS === "web") return;
    Haptics.selectionAsync();
    try {
      const perm = await Camera.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t.churchCameraPermission,
          t.churchEnableCameraPermissionInSettingsTo2,
        );
        return;
      }
      qrScanLockedRef.current = false;
      setQrScannerOpen(true);
    } catch {
      Alert.alert(
        t.churchCameraUnavailable,
        t.churchCouldNotOpenTheQrScanner,
      );
    }
  }, [t]);

  const resetFormFields = useCallback(() => {
    initialEditSnapshotRef.current = null;
    setEditingChurch(null);
    setFormName("");
    setFormPastor("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormCountry(t.churchUnitedStates);
    setFormPostal("");
    setFormCoordsInput("");
    setFormPhotos([]);
    setFormPhotoUrl("");
    setFormSchedule("");
    setFormContact("");
    setFormError("");
    setShowAddressFields(false);
    setShowCoordsInput(false);
    setShowMoreDetails(false);
    setShowPhotoUrlInput(false);
    setLocationChanged(false);
    setFormToast(null);
    lastPastedCoordsRef.current = "";
    setScheduleAsText(false);
  }, [t]);

  const openSubmitModal = useCallback(() => {
    Haptics.selectionAsync();
    if (!user) {
      openAuthSheet();
      return;
    }
    if (!user.emailVerified) {
      Alert.alert(
        t.churchVerifyYourEmail,
        t.churchPleaseVerifyYourEmailInAccount,
      );
      return;
    }
    resetFormFields();
    setSubmitOpen(true);
  }, [t, openAuthSheet, resetFormFields, user]);

  const openEditChurchModal = useCallback((church: VerifiedChurch) => {
    Haptics.selectionAsync();
    const initialCoords = `${church.lat.toFixed(6)}, ${church.lng.toFixed(6)}`;
    const initialPhotos = getChurchPhotos(church);
    const initialPastor = servantBareName(church.pastorName);
    const initialCountry = church.country || t.churchUnitedStates;
    initialEditSnapshotRef.current = {
      name: church.name || "",
      pastor: initialPastor,
      address: church.address || "",
      city: church.city || "",
      state: church.state || "",
      country: initialCountry,
      postal: church.postalCode || "",
      coordsInput: initialCoords,
      photos: initialPhotos,
      photoUrl: "",
      schedule: church.serviceTimes || "",
      contact: church.contactInfo || "",
    };
    setEditingChurch(church);
    setFormName(church.name || "");
    // The field holds only the name; "SDD Hno" is added when it is shown.
    setFormPastor(initialPastor);
    setFormAddress(church.address || "");
    setFormCity(church.city || "");
    setFormState(church.state || "");
    setFormCountry(initialCountry);
    setFormPostal(church.postalCode || "");
    setFormCoordsInput(initialCoords);
    setFormPhotos(initialPhotos);
    setFormPhotoUrl("");
    setFormSchedule(church.serviceTimes || "");
    setFormContact(church.contactInfo || "");
    setFormError("");
    setShowAddressFields(true);
    setShowCoordsInput(false);
    setShowMoreDetails(true);
    setShowPhotoUrlInput(false);
    setLocationChanged(false);
    setFormToast(null);
    lastPastedCoordsRef.current = initialCoords;
    setScheduleAsText(!canEditSchedule(church.serviceTimes || ""));
    setSubmitOpen(true);
  }, [t]);

  const handlePickPhotos = useCallback(
    async (source: "camera" | "library") => {
      if (uploadingPhotos || submitting) return;
      const remaining = maxPhotos - formPhotos.length;
      if (remaining <= 0) {
        Alert.alert(
          t.churchPhotoLimit,
          es
            ? `Puedes adjuntar hasta ${maxPhotos} fotos.`
            : `You can attach up to ${maxPhotos} photos.`,
        );
        return;
      }
      Haptics.selectionAsync();
      setUploadingPhotos(true);
      setFormError("");
      try {
        const urls = await pickAndUploadChurchPhotos({
          source,
          remainingSlots: remaining,
          uploadBase64: async (b64) => {
            const res = await api<{ url: string }>("/churches/photos/upload", "POST", {
              base64: b64,
            });
            return res.url;
          },
          es,
        });
        if (urls.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setFormPhotos((prev) => {
            const merged = [...prev];
            for (const u of urls) {
              if (!merged.includes(u) && merged.length < maxPhotos) merged.push(u);
            }
            return merged;
          });
          const msg =
            urls.length === 1
              ? t.churchPhotoAddedToast
              : t.churchPhotosAddedToast.replace("{count}", String(urls.length));
          showFormToast(msg, undefined, "photo");
        }
      } catch (e: any) {
        setFormError(e?.message || communityError(e, es));
      } finally {
        setUploadingPhotos(false);
      }
    },
    [t, api, es, formPhotos.length, maxPhotos, showFormToast, submitting, uploadingPhotos],
  );

  const handleDeleteChurch = useCallback(
    (church: VerifiedChurch) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t.churchDeleteChurch,
        `${church.name}\n${church.address}, ${church.city}`,
        [
          { text: t.cancel, style: "cancel" },
          {
            text: t.delete,
            style: "destructive",
            onPress: async () => {
              try {
                await api(`/mod/churches/${church.id}`, "DELETE");
                if (selectedChurch?.id === church.id) setSelectedChurch(null);
                await loadChurches(true);
              } catch (e) {
                Alert.alert("Error", communityError(e, es));
              }
            },
          },
        ],
      );
    },
    [t, api, es, loadChurches, selectedChurch?.id],
  );

  const autofillAddressFromCoords = useCallback(
    async (lat: number, lng: number, overwrite = false) => {
      if (Platform.OS === "web") return;
      // A freshly dropped pin replaces the previous address; typed coordinates
      // only fill in what is still empty.
      const keep = (prev: string, next: string) => (overwrite ? next : prev.trim() || next);
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev.length > 0) {
          const r = rev[0];
          const streetLine = [r.streetNumber, r.street || r.name]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (streetLine) setFormAddress((prev) => keep(prev, streetLine));
          if (r.city || r.subregion) {
            setFormCity((prev) => keep(prev, String(r.city || r.subregion || "")));
          }
          if (r.region) setFormState((prev) => keep(prev, String(r.region || "")));
          if (r.postalCode) setFormPostal((prev) => keep(prev, String(r.postalCode || "")));
          if (r.country) setFormCountry((prev) => keep(prev, String(r.country || "")));
        }
      } catch {
        // Optional helper only
      }
    },
    [],
  );

  const handleStartPinPicker = useCallback(() => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    const startCenter = parsedFormCoords
      ? parsedFormCoords
      : selectedChurch
        ? { lat: selectedChurch.lat, lng: selectedChurch.lng }
        : userCoords
          ? userCoords
          : viewerCoords
            ? viewerCoords
            : { lat: mapRegion.latitude, lng: mapRegion.longitude };
    setPinPickerCenter(startCenter);
    setSubmitOpen(false);
    setPinPickerOpen(true);
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: startCenter.lat,
          longitude: startCenter.lng,
          latitudeDelta: parsedFormCoords || selectedChurch ? 0.015 : 0.08,
          longitudeDelta: parsedFormCoords || selectedChurch ? 0.015 : 0.08,
        },
        420,
      );
    }, 80);
  }, [mapRegion, parsedFormCoords, selectedChurch, userCoords, viewerCoords]);

  const handleConfirmPinPicker = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { lat, lng } = pinPickerCenter;
    const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    lastPastedCoordsRef.current = formatted;
    setFormCoordsInput(formatted);
    setLocationChanged(true);
    setPinPickerOpen(false);
    setSubmitOpen(true);
    showFormToast(
      t.churchLocationUpdatedToast,
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      "pin",
    );
    void autofillAddressFromCoords(lat, lng, true);
  }, [autofillAddressFromCoords, pinPickerCenter, showFormToast, t.churchLocationUpdatedToast]);

  const handleSubmitChurch = async () => {
    if (submitting) return;
    const name = formName.trim();
    const address = formAddress.trim();
    const city = formCity.trim();
    const country = formCountry.trim();
    if (!name || !address || !city || !country) {
      // Show the address fields so whatever is missing can be filled in.
      setShowAddressFields(true);
      setFormError(
        t.churchPleaseFillInChurchNameAddress,
      );
      return;
    }
    const cleanPhotoUrl = formPhotoUrl.trim();
    if (cleanPhotoUrl && !/^https:\/\/[^\s"'<>]+$/i.test(cleanPhotoUrl)) {
      setFormError(
        t.churchPhotoUrlMustStartWithHttps,
      );
      return;
    }
    const finalPhotos = [...formPhotos];
    if (cleanPhotoUrl && !finalPhotos.includes(cleanPhotoUrl)) {
      finalPhotos.push(cleanPhotoUrl);
    }
    if (finalPhotos.length > maxPhotos) {
      setFormError(
        es
          ? `Puedes adjuntar hasta ${maxPhotos} fotos.`
          : `You can attach up to ${maxPhotos} photos.`,
      );
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      let lat: number | null = parsedFormCoords?.lat ?? null;
      let lng: number | null = parsedFormCoords?.lng ?? null;

      if ((lat === null || lng === null) && Platform.OS !== "web") {
        const fullAddr = [
          address,
          city,
          formState.trim(),
          formPostal.trim(),
          country,
        ]
          .filter(Boolean)
          .join(", ");
        try {
          const geocoded = await Location.geocodeAsync(fullAddr);
          if (geocoded.length > 0) {
            lat = geocoded[0].latitude;
            lng = geocoded[0].longitude;
          }
        } catch {}
      }
      if (lat === null || lng === null) {
        setFormError(
          t.churchCouldNotLocateThatAddressAutomatically,
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        name,
        pastorName: servantBareName(formPastor) || null,
        address,
        city,
        state: formState.trim() || null,
        country,
        postalCode: formPostal.trim() || null,
        lat,
        lng,
        serviceTimes: formSchedule.trim() || null,
        contactInfo: formContact.trim() || null,
        photos: finalPhotos,
        photoUrl: finalPhotos[0] || null,
        ...(isAdmin && editingChurch ? { approve: true } : {}),
      };

      if (isAdmin && editingChurch) {
        await api(`/mod/churches/${editingChurch.id}`, "PUT", payload);
        if (selectedChurch?.id === editingChurch.id) {
          setSelectedChurch((prev) =>
            prev
              ? {
                  ...prev,
                  name,
                  pastorName: payload.pastorName,
                  address,
                  city,
                  state: payload.state,
                  country,
                  postalCode: payload.postalCode,
                  lat,
                  lng,
                  serviceTimes: payload.serviceTimes,
                  photoUrl: payload.photoUrl,
                  photos: finalPhotos,
                  verified: true,
                  status: "approved",
                }
              : null,
          );
        }
      } else {
        const endpoint = isAdmin ? "/mod/churches" : "/churches/submit";
        await api(endpoint, "POST", payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const wasEditing = Boolean(editingChurch);
      resetFormFields();
      await loadChurches(true);

      pendingSubmitAlertRef.current = {
        title: isAdmin
          ? wasEditing
            ? t.churchChurchUpdatedVerified
            : t.churchChurchVerifiedPublished
          : t.churchSubmissionReceived,
        body: isAdmin
          ? t.churchThisChurchIsNowLiveAnd
          : t.churchThankYouTheAdministratorWillReview,
      };
      closeSubmitAnimated();
    } catch (e) {
      setFormError(communityError(e, es));
    } finally {
      setSubmitting(false);
    }
  };


  const handleCopyChurchAddress = useCallback((church: VerifiedChurch) => {
    const fullAddress = [
      church.address,
      church.city,
      church.state,
      church.postalCode,
      church.country,
    ]
      .filter(Boolean)
      .join(", ");
    void Clipboard.setStringAsync(fullAddress)
      .then(() => {
        showSuccessToast(t.churchAddressCopied);
      })
      .catch(() => {});
  }, [t.churchAddressCopied]);

  const handleShareChurch = useCallback((church: VerifiedChurch) => {
    const title = churchDisplayName(church.name, church.city);
    const addressLine = [church.address, church.city, church.state]
      .filter(Boolean)
      .join(", ");
    const url = churchShareUrl(church.id);
    const message = `${title}\n${addressLine}\n${url}`;
    void Share.share(
      Platform.OS === "ios"
        ? { title, message, url }
        : { title, message },
    ).catch(() => {});
  }, []);

  const bottomClearance = Math.max(insets.bottom, 18) + (currentHymnId ? 88 : 22);
  const sheetFull = Math.max(360, windowHeight - insets.top - TOP_CONTROLS_HEIGHT);
  // At rest the sheet sits fully below the screen (negative so its grabber hides too).
  const sheetCollapsed = -40;
  const sheetHalf = Math.max(
    240,
    Math.min(
      sheetFull,
      selectedChurch && detailBodyHeight > 0
        ? detailHeaderHeight + detailBodyHeight + bottomClearance
        : Math.round(windowHeight * 0.46),
    ),
  );
  const snapHeights = [sheetCollapsed, sheetHalf, sheetFull];
  const sheetBodyPad = bottomClearance + (sheetFull - snapHeights[snapIndex]);

  const selectedPosition = useMemo(() => {
    if (!selectedChurch) return null;
    const idx = enrichedChurches.findIndex((c) => c.id === selectedChurch.id);
    return idx >= 0 ? idx : null;
  }, [enrichedChurches, selectedChurch]);

  const closeDetail = useCallback((toIndex?: number) => {
    Haptics.selectionAsync();
    pendingLinkChurchIdRef.current = null;
    setSelectedChurch(null);
    setDetailBodyHeight(0);
    setSnapIndex(toIndex ?? listSnapBeforeDetailRef.current);
  }, []);

  // Raises the list (search focus always expands full; tapping "Lista" opens half
  // when there are only a few churches so the map & pins stay visible above it).
  const openListSheet = useCallback(
    (preferFull = false) => {
      if (selectedChurch) {
        pendingLinkChurchIdRef.current = null;
        setSelectedChurch(null);
        setDetailBodyHeight(0);
      }
      const nextSnap = preferFull || enrichedChurches.length > 3 ? 2 : 1;
      setSnapIndex(nextSnap);
    },
    [enrichedChurches.length, selectedChurch],
  );

  const sheetMode: "map" | "list" = !selectedChurch && snapIndex > 0 ? "list" : "map";

  const handleModeChange = (mode: "map" | "list") => {
    if (mode === "list") {
      openListSheet(false);
      return;
    }
    Keyboard.dismiss();
    if (selectedChurch) closeDetail(0);
    else setSnapIndex(0);
  };

  const handleSheetIndexChange = useCallback(
    (next: number) => {
      // Swiping a church card all the way down dismisses it back to the list.
      if (selectedChurch && next === 0) closeDetail(0);
      else {
        if (next < 2) Keyboard.dismiss();
        setSnapIndex(next);
      }
    },
    [closeDetail, selectedChurch],
  );

  const stepChurch = useCallback(
    (direction: 1 | -1) => {
      if (selectedPosition === null) return;
      const next = enrichedChurches[selectedPosition + direction];
      if (next) focusChurchOnMap(next);
    },
    [enrichedChurches, focusChurchOnMap, selectedPosition],
  );

  // Horizontal swipe on a church card moves to the next / previous church.
  const makeChurchSwipe = () =>
    Gesture.Pan()
      .enabled(Boolean(selectedChurch) && enrichedChurches.length > 1)
      .activeOffsetX([-22, 22])
      .failOffsetY([-14, 14])
      .maxPointers(1)
      .onEnd((event, success) => {
        if (!success) return;
        if (Math.abs(event.translationX) > 56 || Math.abs(event.velocityX) > 600) {
          runOnJS(stepChurch)(event.translationX < 0 ? 1 : -1);
        }
      });
  const headerSwipe = makeChurchSwipe();
  const bodySwipe = makeChurchSwipe();

  // A signed-out user who tapped "Set as My Church" finishes the link as soon
  // as they sign in, instead of having to find the church again.
  useEffect(() => {
    const pendingId = pendingLinkChurchIdRef.current;
    if (!user || !pendingId) return;
    pendingLinkChurchIdRef.current = null;
    const church = churches.find((c) => c.id === pendingId);
    if (church && user.churchId !== church.id) void handleSetMyChurch(church);
  }, [churches, handleSetMyChurch, user]);

  const sheetSummary = loading
    ? t.churchLoadingChurches
    : enrichedChurches.length === 0
      ? search.trim()
        ? t.churchNoMatchingChurchesFound
        : t.churchElBuenPastorDirectory
      : closestChurch && closestChurch.distanceMiles !== null && !search.trim()
        ? es
          ? `Más cercana: ${closestChurch.city} · ${formatDistance(closestChurch.distanceMiles)}`
          : `Closest: ${closestChurch.city} · ${formatDistance(closestChurch.distanceMiles)}`
        : es
          ? `${enrichedChurches.length} ${enrichedChurches.length === 1 ? "iglesia verificada" : "iglesias verificadas"}`
          : `${enrichedChurches.length} verified ${enrichedChurches.length === 1 ? "church" : "churches"}`;

  const hasIOSGlass = isIOS && isIOSLiquidGlassAvailable();
  const expoSwiftUI = isIOS ? getExpoSwiftUI() : null;
  const bgSurface = isDarkMode ? "#0D0D0F" : "#F6F3EC";
  const cardBg = hasIOSGlass
    ? isDarkMode
      ? "rgba(255,255,255,0.085)"
      : "rgba(255,255,255,0.62)"
    : isDarkMode
      ? "#1C1C1E"
      : "#FFFFFF";
  const cardBorder = hasIOSGlass
    ? isDarkMode
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.78)"
    : isDarkMode
      ? "rgba(255,255,255,0.10)"
      : "rgba(0,0,0,0.07)";
  const mutedText = isDarkMode
    ? "rgba(235,235,245,0.60)"
    : theme.onSurfaceVariant;

  const selectedDistance =
    selectedChurch && userCoords
      ? haversineMiles(
          userCoords.lat,
          userCoords.lng,
          selectedChurch.lat,
          selectedChurch.lng,
        )
      : null;

  const addressVisible =
    showAddressFields ||
    Boolean(parsedFormCoords) ||
    Boolean(editingChurch) ||
    Platform.OS === "web";

  const renderFormField = (f: {
    label: string;
    val: string;
    set: (value: string) => void;
    placeholder: string;
    max: number;
    returnKeyType?: "next" | "done";
    onSubmitEditing?: () => void;
  }) => (
    <AnimatedField
      key={f.label}
      label={f.label}
      value={f.val}
      onChangeText={f.set}
      placeholder={f.placeholder}
      maxLength={f.max}
      returnKeyType={f.returnKeyType ?? "done"}
      blurOnSubmit={f.returnKeyType !== "next"}
      onSubmitEditing={f.onSubmitEditing}
      editable={!submitting}
      surfaceColor={cardBg}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: bgSurface }]}>
      {/* ── Native Apple Maps Layer (Map Mode) ─────────────────────────────── */}
      {Platform.OS !== "web" ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={
            userCoords
              ? {
                  latitude: userCoords.lat,
                  longitude: userCoords.lng,
                  latitudeDelta: 0.45,
                  longitudeDelta: 0.45,
                }
              : enrichedChurches[0]
                ? {
                    latitude: enrichedChurches[0].lat,
                    longitude: enrichedChurches[0].lng,
                    latitudeDelta: 1.5,
                    longitudeDelta: 1.5,
                  }
                : viewerCoords
                  ? {
                      latitude: viewerCoords.lat,
                      longitude: viewerCoords.lng,
                      latitudeDelta: 3.5,
                      longitudeDelta: 3.5,
                    }
                  : DEFAULT_REGION
          }
          onRegionChangeComplete={(region) => {
            setMapRegion(region);
            if (pinPickerOpen) {
              setPinPickerCenter({
                lat: region.latitude,
                lng: region.longitude,
              });
            }
          }}
          mapPadding={{
            top: insets.top + TOP_CONTROLS_HEIGHT,
            right: 0,
            left: 0,
            bottom: Math.max(0, Math.min(snapHeights[snapIndex], snapHeights[1])),
          }}
          userInterfaceStyle={isDarkMode ? "dark" : "light"}
          showsUserLocation={Boolean(userCoords)}
          showsMyLocationButton={false}
          showsCompass={false}
          onPress={() => {
            Keyboard.dismiss();
            if (pinPickerOpen) return;
            if (selectedChurch) closeDetail();
            else if (snapIndex > 0) setSnapIndex(0);
          }}
        >
          {mapPins.map((pin) => {
            if (pin.type === "cluster") {
              return (
                <Marker
                  key={pin.id}
                  coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Haptics.selectionAsync();
                    mapRef.current?.animateToRegion(
                      {
                        latitude: pin.lat,
                        longitude: pin.lng,
                        latitudeDelta: pin.expansionDelta.latitudeDelta,
                        longitudeDelta: pin.expansionDelta.longitudeDelta,
                      },
                      380,
                    );
                  }}
                >
                  <View
                    style={[
                      styles.clusterBubble,
                      {
                        backgroundColor: theme.primary,
                        borderColor: isDarkMode ? "#1C1C1E" : "#FAF5EE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clusterBubbleText,
                        { color: theme.onPrimary },
                      ]}
                    >
                      {pin.count}
                    </Text>
                  </View>
                </Marker>
              );
            }
            const church = pin.church;
            const isSelected = selectedChurch?.id === church.id;
            return (
              <ChurchPinMarker
                key={Platform.OS === "android" ? `${church.id}-${isSelected ? "s" : "n"}` : church.id}
                church={church}
                isSelected={isSelected}
                onPress={() => {
                  if (!pinPickerOpen) focusChurchOnMap(church);
                }}
              />
            );
          })}
        </MapView>
      ) : null}

      {/* ── Interactive Drop-a-Pin Crosshair Overlay ───────────────────────── */}
      {pinPickerOpen && Platform.OS !== "web" && (
        <>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <View style={{ alignItems: "center", transform: [{ translateY: -18 }] }}>
              <Image
                source={CHURCH_PIN_SELECTED_IMG}
                style={{ width: 52, height: 46 }}
                resizeMode="contain"
              />
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.primary,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  marginTop: -2,
                }}
              />
            </View>
          </View>

          <View
            style={[
              styles.mapBottomWrap,
              { paddingBottom: bottomClearance, zIndex: 40 },
            ]}
          >
            <GlassSurface
              glassEffectStyle="regular"
              intensity={74}
              style={[
                styles.selectedCard,
                !isIOS && { backgroundColor: cardBg, borderColor: cardBorder },
                isIOS && {
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(255,255,255,0.65)",
                  borderCurve: "continuous",
                },
              ]}
            >
              <Text
                style={{
                  color: theme.onSurface,
                  ...fonts.bold,
                  fontSize: 16.5,
                }}
              >
                {t.churchPanTheMapOntoTheChurch}
              </Text>
              <Text
                style={{
                  color: mutedText,
                  ...fonts.sansMedium,
                  fontSize: 13,
                }}
              >
                {`${pinPickerCenter.lat.toFixed(6)}, ${pinPickerCenter.lng.toFixed(6)}`}
              </Text>
              <View style={styles.selectedActionsRow}>
                {isIOS ? (
                  <GlassSurface
                    isInteractive
                    glassEffectStyle="regular"
                    intensity={56}
                    style={styles.actionBtnSecondaryGlass}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPinPickerOpen(false);
                        setSubmitOpen(true);
                      }}
                      style={styles.actionBtnSecondaryHit}
                    >
                      <Text
                        style={{
                          color: theme.onSurface,
                          ...fonts.sansSemiBold,
                          fontSize: 14,
                        }}
                      >
                        {t.cancel}
                      </Text>
                    </Pressable>
                  </GlassSurface>
                ) : (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPinPickerOpen(false);
                      setSubmitOpen(true);
                    }}
                    style={[
                      styles.actionBtnSecondary,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.09)"
                          : theme.surfaceVariants.containerHighest,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.onSurface,
                        ...fonts.sansSemiBold,
                        fontSize: 14,
                      }}
                    >
                      {t.cancel}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleConfirmPinPicker}
                  style={[
                    styles.actionBtnPrimary,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <AppMenuIcon
                    ios="checkmark.circle.fill"
                    android="check-circle"
                    color={theme.onPrimary}
                    size={17}
                  />
                  <Text
                    style={{
                      color: theme.onPrimary,
                      ...fonts.sansSemiBold,
                      fontSize: 14.5,
                    }}
                  >
                    {t.churchConfirmLocation}
                  </Text>
                </Pressable>
              </View>
            </GlassSurface>
          </View>
        </>
      )}

      {/* ── Subtle top status-bar gradient scrim for readability over bright map tiles ── */}
      {Platform.OS !== "web" && (
        <LinearGradient
          pointerEvents="none"
          colors={
            isDarkMode
              ? ["rgba(10,10,12,0.72)", "rgba(10,10,12,0.28)", "rgba(10,10,12,0)"]
              : ["rgba(250,247,241,0.82)", "rgba(250,247,241,0.34)", "rgba(250,247,241,0)"]
          }
          style={[styles.topStatusScrim, { height: insets.top + 34 }]}
        />
      )}

      {/* ── Floating Liquid Glass controls: search, scan, add, Map/List, Near me ── */}
      <View
        pointerEvents="box-none"
        style={[styles.topChrome, { paddingTop: insets.top + 8 }]}
      >
        <GlassGroup spacing={8} style={styles.searchRow}>
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={64}
            style={styles.circleBtn}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.homeMenuBack}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              style={styles.circleBtnHit}
            >
              <AppMenuIcon
                ios="chevron.left"
                android="arrow-back"
                color={theme.onSurface}
                size={19}
                weight="semibold"
              />
            </Pressable>
          </GlassSurface>

          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={64}
            style={styles.searchPill}
          >
            <AppMenuIcon
              ios="magnifyingglass"
              android="search"
              color={mutedText}
              size={17}
              weight="medium"
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onFocus={() => openListSheet(true)}
              placeholder={
                t.churchNameCityOrZip
              }
              placeholderTextColor={mutedText}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.onSurface }]}
            />
            {!!search && (
              <Pressable
                hitSlop={8}
                onPress={() => setSearch("")}
                accessibilityLabel={t.churchClear}
              >
                <AppMenuIcon
                  ios="xmark.circle.fill"
                  android="cancel"
                  color={mutedText}
                  size={17}
                />
              </Pressable>
            )}
          </GlassSurface>

          {Platform.OS !== "web" && (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={styles.circleBtn}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  t.churchScanQrCode
                }
                onPress={() => void openQrScanner()}
                style={styles.circleBtnHit}
              >
                <AppMenuIcon
                  ios="qrcode.viewfinder"
                  android="qr-code-scanner"
                  color={theme.onSurface}
                  size={19}
                  weight="semibold"
                />
              </Pressable>
            </GlassSurface>
          )}

          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={64}
            style={styles.circleBtn}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                t.churchSubmitAChurch
              }
              onPress={openSubmitModal}
              style={styles.circleBtnHit}
            >
              <AppMenuIcon
                ios="plus"
                android="add"
                color={theme.onSurface}
                size={19}
                weight="semibold"
              />
            </Pressable>
          </GlassSurface>
        </GlassGroup>

        {/* Secondary Pill Bar: Map/List Switcher + Near Me GPS Button */}
        <View style={styles.pillControlsRow}>
          {Platform.OS !== "web" &&
            (isIOS ? (
              expoSwiftUI ? (() => {
                const { Host, Image: SwiftImage, Picker: SwiftPicker } = expoSwiftUI.ui;
                const {
                  accessibilityLabel,
                  controlSize,
                  glassEffect,
                  pickerStyle,
                  tag,
                } = expoSwiftUI.modifiers;
                return (
                  <Host
                    style={styles.iosNativeModePickerHost}
                    colorScheme={isDarkMode ? "dark" : "light"}
                    seedColor={theme.primary}
                  >
                    <SwiftPicker
                      label={t.profileMap}
                      selection={sheetMode}
                      onSelectionChange={(next) => {
                        if ((next === "map" || next === "list") && next !== sheetMode) {
                          Haptics.selectionAsync();
                          handleModeChange(next);
                        }
                      }}
                      modifiers={[
                        pickerStyle("segmented"),
                        controlSize("large"),
                        glassEffect({
                          glass: { variant: "regular", interactive: true },
                          shape: "capsule",
                        }),
                      ]}
                    >
                      <SwiftImage
                        systemName="map.fill"
                        modifiers={[tag("map"), accessibilityLabel(t.profileMap)]}
                      />
                      <SwiftImage
                        systemName="list.bullet"
                        modifiers={[tag("list"), accessibilityLabel(t.churchList)]}
                      />
                    </SwiftPicker>
                  </Host>
                );
              })() : (
                <View style={styles.iosModeSegmentedWrap}>
                  <LiquidGlassSegmented
                    compact
                    glassTrack
                    value={sheetMode}
                    onChange={(m) => handleModeChange(m)}
                    items={[
                      { key: "map", label: t.profileMap, iosIcon: "map.fill", androidIcon: "map" },
                      { key: "list", label: t.churchList, iosIcon: "list.bullet", androidIcon: "format-list-bulleted" },
                    ]}
                  />
                </View>
              )
            ) : (
              <GlassSurface
                glassEffectStyle="regular"
                intensity={62}
                style={styles.modeSegmented}
              >
                {(["map", "list"] as const).map((m) => {
                  const active = sheetMode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        Haptics.selectionAsync();
                        handleModeChange(m);
                      }}
                      style={[
                        styles.modeBtn,
                        active && { backgroundColor: theme.primary },
                      ]}
                    >
                      <AppMenuIcon
                        ios={m === "map" ? "map.fill" : "list.bullet"}
                        android={m === "map" ? "map" : "format-list-bulleted"}
                        color={active ? theme.onPrimary : theme.onSurface}
                        size={14}
                        weight="semibold"
                      />
                      <Text
                        style={[
                          styles.modeBtnText,
                          { color: active ? theme.onPrimary : theme.onSurface },
                        ]}
                      >
                        {m === "map" ? t.profileMap : t.churchList}
                      </Text>
                    </Pressable>
                  );
                })}
              </GlassSurface>
            ))}

          {Platform.OS !== "web" && (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={62}
              style={styles.nearMePill}
            >
              <Pressable
                onPress={() => void requestNearMe(true)}
                disabled={locating}
                style={styles.nearMeHit}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <AppMenuIcon
                    ios="location.fill"
                    android="my-location"
                    color={userCoords ? theme.primary : theme.onSurface}
                    size={14}
                    weight="semibold"
                  />
                )}
                <Text
                  style={[styles.modeBtnText, { color: theme.onSurface }]}
                  numberOfLines={1}
                >
                  {t.churchNearMe}
                </Text>
              </Pressable>
            </GlassSurface>
          )}
        </View>

        {/* Admin Pending User Submissions Banner */}
        {isAdmin && pendingChurches.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 10 }}
          >
            {pendingChurches.map((pending) => (
              <GlassSurface
                key={pending.id}
                isInteractive
                glassEffectStyle="regular"
                intensity={62}
                tintColor={
                  isIOS
                    ? isDarkMode
                      ? "rgba(158,42,50,0.34)"
                      : "rgba(110,22,25,0.12)"
                    : undefined
                }
                style={[
                  styles.pendingGlassChip,
                  !isIOS && {
                    backgroundColor: isDarkMode ? "#3B181A" : "#FDF2F2",
                    borderColor: theme.primary,
                    borderWidth: 1,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    focusChurchOnMap(pending);
                    openEditChurchModal(pending);
                  }}
                  style={styles.pendingGlassChipHit}
                >
                  <AppMenuIcon
                    ios="bell.badge.fill"
                    android="notifications-active"
                    color={theme.primary}
                    size={14}
                  />
                  <Text
                    style={{
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 12.5,
                    }}
                  >
                    {es
                      ? `Pendiente: ${churchDisplayName(pending.name, pending.city)}`
                      : `Pending: ${churchDisplayName(pending.name, pending.city)}`}
                  </Text>
                </Pressable>
              </GlassSurface>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Bottom sheet: search + list, or the selected church ────────────── */}
      {!pinPickerOpen && (
        <DetentSheet
          snapHeights={snapHeights}
          index={snapIndex}
          onIndexChange={handleSheetIndexChange}
          headerGesture={headerSwipe}
          grabberPlacement="floating"
          style={
            isIOS
              ? {
                  backgroundColor: "transparent",
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(255,255,255,0.55)",
                  shadowOpacity: isDarkMode ? 0.34 : 0.16,
                }
              : { backgroundColor: bgSurface, borderColor: cardBorder }
          }
          background={
            isIOS ? (
              <GlassSurface
                glassEffectStyle="regular"
                intensity={76}
                style={[
                  StyleSheet.absoluteFill,
                  { borderTopLeftRadius: 26, borderTopRightRadius: 26 },
                ]}
              />
            ) : undefined
          }
          header={
            selectedChurch ? (
              <View
                style={styles.sheetHeader}
                onLayout={(e) => setDetailHeaderHeight(e.nativeEvent.layout.height)}
              >
              <View style={styles.selectedHeader}>
                <Image
                  source={CHURCH_PIN_SELECTED_IMG}
                  style={styles.selectedAvatar}
                  resizeMode="contain"
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.selectedTitle,
                        { color: theme.onSurface, flexShrink: 1 },
                      ]}
                    >
                      {churchDisplayName(selectedChurch.name, selectedChurch.city)}
                    </Text>
                    <AppMenuIcon
                      ios="checkmark.seal.fill"
                      android="verified"
                      color={theme.primary}
                      size={17}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[styles.rowSub, { color: mutedText }]}
                  >
                    {selectedChurch.address}, {selectedChurch.city}
                    {selectedChurch.state ? `, ${selectedChurch.state}` : ""}{" "}
                    {selectedChurch.postalCode || ""}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    {(selectedDrivingEstimate !== null || selectedDistance !== null) && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {selectedDrivingEstimate !== null && (
                          <AppMenuIcon
                            ios="car.fill"
                            android="directions-car"
                            color={theme.primary}
                            size={12}
                          />
                        )}
                        <Text
                          style={{
                            color: theme.primary,
                            ...fonts.sansSemiBold,
                            fontSize: 12.5,
                          }}
                        >
                          {selectedDrivingEstimate
                            ? formatDrivingEstimate(
                                selectedDrivingEstimate.distanceMeters,
                                selectedDrivingEstimate.expectedTravelTimeSeconds,
                              )
                            : `~${formatDistance(selectedDistance!)}`}
                        </Text>
                      </View>
                    )}
                    {!!selectedChurch.pastorName && (
                      <Text
                        style={{
                          color: mutedText,
                          ...fonts.sansMedium,
                          fontSize: 12.5,
                        }}
                      >
                        {servantDisplayName(selectedChurch.pastorName)}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedPosition !== null && enrichedChurches.length > 1 && (
                  <Text
                    style={{
                      color: mutedText,
                      ...fonts.sansSemiBold,
                      fontSize: 12.5,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {`${selectedPosition + 1} / ${enrichedChurches.length}`}
                  </Text>
                )}
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={60}
                  style={[
                    styles.miniCloseGlass,
                    !isIOS && {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <Pressable
                    hitSlop={10}
                    onPress={() => closeDetail()}
                    accessibilityRole="button"
                    accessibilityLabel={t.close}
                    style={styles.miniCloseGlassHit}
                  >
                    <AppMenuIcon
                      ios="xmark"
                      android="close"
                      color={theme.onSurface}
                      size={13}
                      weight="bold"
                    />
                  </Pressable>
                </GlassSurface>
              </View>
              </View>
            ) : (
              <View
                style={[
                  styles.sheetHeader,
                  {
                    height: LIST_HEADER_HEIGHT,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingTop: 4,
                    paddingBottom: 6,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: theme.onSurface,
                    ...fonts.sansSemiBold,
                    fontSize: 15,
                  }}
                >
                  {sheetSummary}
                </Text>
                {enrichedChurches.length > 1 && (
                  <View style={{ marginRight: 6 }}>
                    <ListSortMenu
                      value={churchSort}
                      onChange={setChurchSort}
                      options={churchSortOptions}
                      menuTitle={t.sortMenuTitle}
                    />
                  </View>
                )}
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={60}
                  style={[
                    styles.miniCloseGlass,
                    !isIOS && {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleModeChange("map")}
                    accessibilityRole="button"
                    accessibilityLabel={t.close}
                    style={styles.miniCloseGlassHit}
                  >
                    <AppMenuIcon
                      ios="xmark"
                      android="close"
                      color={theme.onSurface}
                      size={13}
                      weight="bold"
                    />
                  </Pressable>
                </GlassSurface>
              </View>
            )
          }
        >
          {selectedChurch ? (
            <ScrollView
              key={selectedChurch.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: sheetBodyPad }}
            >
              <Animated.View
                entering={FadeIn.duration(180)}
                onLayout={(e) => setDetailBodyHeight(e.nativeEvent.layout.height)}
                style={styles.sheetDetailBody}
              >
              {(() => {
                const validPhotos = getChurchPhotos(selectedChurch).filter(
                  (u) => !failedPhotoIds[u],
                );
                if (validPhotos.length === 0) return null;
                const cardInnerWidth = Math.max(240, windowWidth - 36);
                return (
                  <View style={{ position: "relative" }}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(
                          e.nativeEvent.contentOffset.x / cardInnerWidth,
                        );
                        setCarouselIndex(
                          Math.max(0, Math.min(validPhotos.length - 1, idx)),
                        );
                      }}
                      style={{
                        width: cardInnerWidth,
                        height: 148,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      {validPhotos.map((uri, i) => (
                        <Pressable
                          key={uri}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setFullscreenPhotoIndex(i);
                          }}
                          style={{ width: cardInnerWidth, height: 148 }}
                        >
                          <Image
                            source={{ uri }}
                            onError={() =>
                              setFailedPhotoIds((prev) => ({
                                ...prev,
                                [uri]: true,
                              }))
                            }
                            style={{ width: cardInnerWidth, height: 148 }}
                            resizeMode="cover"
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                    {validPhotos.length > 1 && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 0,
                          right: 0,
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {validPhotos.map((u, idx) => (
                          <View
                            key={u}
                            style={{
                              width: idx === carouselIndex ? 16 : 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor:
                                idx === carouselIndex
                                  ? "#FFFFFF"
                                  : "rgba(255,255,255,0.5)",
                            }}
                          />
                        ))}
                      </View>
                    )}
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: "rgba(0,0,0,0.52)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          ...fonts.sansSemiBold,
                          fontSize: 11,
                        }}
                      >
                        {`${Math.min(carouselIndex + 1, validPhotos.length)} / ${validPhotos.length}`}
                      </Text>
                    </View>
                  </View>
                );
              })()}

                <GestureDetector gesture={bodySwipe}>
                  <View collapsable={false} style={{ gap: 12 }}>
                    {!!selectedChurch.serviceTimes &&
                      (() => {
                        const rows = parseServiceTimes(selectedChurch.serviceTimes);
                        const today = new Date().getDay();
                        const scheduleBg = hasIOSGlass
                          ? cardBg
                          : isDarkMode
                            ? "rgba(255,255,255,0.06)"
                            : theme.surfaceVariants.containerLow;
                        if (!rows) {
                          return (
                            <View style={[styles.scheduleCard, { backgroundColor: scheduleBg }]}>
                              <Text style={[styles.sectionEyebrow, { color: mutedText }]}>
                                {t.churchServiceTimes}
                              </Text>
                              <Text
                                style={{
                                  color: theme.onSurface,
                                  ...fonts.sansRegular,
                                  fontSize: 14,
                                  lineHeight: 20,
                                  paddingBottom: 10,
                                }}
                              >
                                {selectedChurch.serviceTimes}
                              </Text>
                            </View>
                          );
                        }
                        const nextService = getNextServiceSummary(rows);
                        const nextBadgeText = nextService
                          ? nextService.isToday
                            ? `${t.churchToday} · ${nextService.startClock}`
                            : `${t.churchNextService}: ${es ? nextService.dayShortEs : nextService.dayShortEn} ${nextService.startClock}`
                          : null;
                        return (
                          <View style={[styles.scheduleCard, { backgroundColor: scheduleBg }]}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                paddingTop: 10,
                                paddingBottom: 4,
                              }}
                            >
                              <Text
                                style={[
                                  styles.sectionEyebrow,
                                  { color: mutedText, paddingTop: 0, paddingBottom: 0 },
                                ]}
                              >
                                {t.churchServiceTimes}
                              </Text>
                              {nextBadgeText ? (
                                <View
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 999,
                                    backgroundColor: nextService?.isToday
                                      ? isDarkMode
                                        ? "rgba(52,199,89,0.22)"
                                        : "rgba(52,199,89,0.16)"
                                      : isDarkMode
                                        ? "rgba(255,255,255,0.11)"
                                        : theme.primary + "14",
                                  }}
                                >
                                  <Text
                                    numberOfLines={1}
                                    style={{
                                      color: nextService?.isToday
                                        ? isDarkMode
                                          ? "#5EE380"
                                          : "#1F7A38"
                                        : isDarkMode
                                          ? "#FDF9F2"
                                          : theme.primary,
                                      ...fonts.sansSemiBold,
                                      fontSize: 11.5,
                                      fontVariant: ["tabular-nums"],
                                    }}
                                  >
                                    {nextBadgeText}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            {rows.map((row, i) => {
                              const isToday = row.dayIndex === today;
                              const rowColor = isToday ? theme.primary : theme.onSurface;
                              return (
                                <View
                                  key={`${row.day}-${i}`}
                                  style={[
                                    styles.scheduleRow,
                                    i > 0 && {
                                      borderTopWidth: StyleSheet.hairlineWidth,
                                      borderTopColor: cardBorder,
                                    },
                                  ]}
                                >
                                  <View style={{ flex: 1, gap: 1 }}>
                                    <Text
                                      style={{
                                        color: rowColor,
                                        ...(isToday ? fonts.sansSemiBold : fonts.sansMedium),
                                        fontSize: 15,
                                      }}
                                    >
                                      {row.day}
                                      {isToday ? ` · ${t.churchToday}` : ""}
                                    </Text>
                                    {!!row.note && (
                                      <Text
                                        style={{
                                          color: mutedText,
                                          ...fonts.sansRegular,
                                          fontSize: 12.5,
                                        }}
                                      >
                                        {row.note}
                                      </Text>
                                    )}
                                  </View>
                                  <Text
                                    style={{
                                      color: rowColor,
                                      ...(isToday ? fonts.sansSemiBold : fonts.sansMedium),
                                      fontSize: 15,
                                      fontVariant: ["tabular-nums"],
                                    }}
                                  >
                                    {row.time}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })()}

              <ChurchDetailActionBar
                driveTimeLabel={
                  selectedDrivingEstimate
                    ? formatDriveTime(selectedDrivingEstimate.expectedTravelTimeSeconds)
                    : null
                }
                isMyLinkedChurch={
                  user?.churchId === selectedChurch.id ||
                  (!user?.churchId && user?.churchName === selectedChurch.name)
                }
                isLookingAround={lookingAroundId === selectedChurch.id}
                isSettingMyChurch={settingMyChurchId === selectedChurch.id}
                isAdmin={isAdmin}
                isPending={selectedChurch.status === "pending"}
                onDirections={() => openDirections(selectedChurch)}
                onStreetPreview={() => void openStreetPreview(selectedChurch)}
                onToggleMyChurch={() => void handleSetMyChurch(selectedChurch)}
                onOpenQr={() => {
                  Haptics.selectionAsync();
                  setQrShareChurch(selectedChurch);
                }}
                onCopyAddress={() => handleCopyChurchAddress(selectedChurch)}
                onShareChurch={() => handleShareChurch(selectedChurch)}
                onEditChurch={() => openEditChurchModal(selectedChurch)}
                onDeleteChurch={() => handleDeleteChurch(selectedChurch)}
              />

              {(() => {
                return (
                  <View
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: hasIOSGlass
                        ? cardBorder
                        : isDarkMode
                          ? "rgba(255,255,255,0.10)"
                          : theme.outlineVariant + "55",
                      backgroundColor: hasIOSGlass
                        ? cardBg
                        : isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : theme.surfaceVariants.containerLow,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: churchMembersOpen }}
                      onPress={() => {
                        Haptics.selectionAsync();
                        const next = !churchMembersOpen;
                        setChurchMembersOpen(next);
                        if (next && user && (churchMembersFailed || churchMembersTotal === null)) void loadChurchMembers(selectedChurch.id);
                        if (next && !user) openAuthSheet();
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 11,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        opacity: pressed ? 0.84 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.09)"
                            : theme.primary + "14",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppMenuIcon
                          ios="person.2.fill"
                          android="group"
                          color={theme.primary}
                          size={16}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text
                          style={{
                            color: theme.onSurface,
                            ...fonts.sansSemiBold,
                            fontSize: 14.5,
                          }}
                        >
                          {t.churchMembersRowTitle}
                        </Text>
                        <Text
                          style={{
                            color: theme.onSurfaceVariant,
                            ...fonts.sansRegular,
                            fontSize: 12,
                          }}
                        >
                          {user && churchMembersTotal !== null
                            ? churchMembersTotal === 1
                              ? t.churchMembersCountOne
                              : t.churchMembersCount.replace('{n}', String(churchMembersTotal))
                            : t.churchMembersRowSub}
                        </Text>
                      </View>
                      <AppMenuIcon
                        ios={churchMembersOpen ? "chevron.up" : "chevron.down"}
                        android={churchMembersOpen ? "expand-less" : "expand-more"}
                        color={theme.onSurfaceVariant}
                        size={13}
                        weight="semibold"
                      />
                    </Pressable>

                    {churchMembersOpen && (
                      <View
                        style={{
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDarkMode
                            ? "rgba(255,255,255,0.08)"
                            : theme.outlineVariant + "55",
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          gap: 10,
                        }}
                      >
                        {!user ? (
                          <Text style={{ ...fonts.sansRegular, color: theme.onSurfaceVariant }}>{t.churchMembersSignIn}</Text>
                        ) : churchMembersLoading ? (
                          <View style={{ paddingVertical: 10, alignItems: "center" }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                          </View>
                        ) : churchMembersFailed ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => void loadChurchMembers(selectedChurch.id)}
                            style={{ padding: 14 }}
                          >
                            <Text style={{ ...fonts.sansSemiBold, color: theme.primary }}>
                              {t.churchMembersRetry}
                            </Text>
                          </Pressable>
                        ) : churchMembers.length === 0 ? (
                          <Text
                            style={{
                              color: theme.onSurfaceVariant,
                              ...fonts.sansRegular,
                              fontSize: 13,
                              lineHeight: 18,
                              paddingVertical: 4,
                            }}
                          >
                            {t.churchMembersEmpty}
                          </Text>
                        ) : (
                          churchMembers.map((member) => {
                            const role = [
                              member.ministry
                                ? (MINISTRIES as Record<string, [string, string]>)[member.ministry]?.[es ? 0 : 1]
                                : null,
                              member.choir
                                ? choirDisplayName(member.choir, es, choirsBySlug)
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ");
                            return (
                              <View
                                key={member.id}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    seedMemberPreview({
                                      id: member.id,
                                      name: member.name,
                                      initials: member.initials,
                                      avatarUrl: member.avatarUrl ?? null,
                                      ministry: member.ministry,
                                      choir: member.choir,
                                      badgeVerified: member.badgeVerified,
                                      memberSince: member.memberSince,
                                      churchId: member.churchId ?? selectedChurch.id,
                                      churchName: member.churchName ?? selectedChurch.name,
                                      location: member.location,
                                      friendStatus: member.friendStatus,
                                    });
                                    router.push(`/member/${encodeURIComponent(member.id)}` as any);
                                  }}
                                  style={({ pressed }) => ({
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 10,
                                    opacity: pressed ? 0.75 : 1,
                                  })}
                                >
                                  <UserAvatar
                                    uri={member.avatarUrl}
                                    initials={member.initials}
                                    size={34}
                                    fontSize={12.5}
                                    backgroundColor={theme.primary}
                                    textColor={theme.onPrimary}
                                  />
                                  <View style={{ flex: 1, gap: 1 }}>
                                    <Text
                                      numberOfLines={1}
                                      style={{
                                        color: theme.onSurface,
                                        ...fonts.sansSemiBold,
                                        fontSize: 14.5,
                                      }}
                                    >
                                      {member.name}
                                    </Text>
                                    {!!role && (
                                      <Text
                                        numberOfLines={1}
                                        style={{
                                          color: theme.onSurfaceVariant,
                                          ...fonts.sansRegular,
                                          fontSize: 12,
                                        }}
                                      >
                                        {role}
                                      </Text>
                                    )}
                                  </View>
                                </Pressable>
                                <FriendButton
                                  userId={member.id}
                                  name={member.name}
                                  status={member.friendStatus}
                                  compact
                                  onStatusChange={() =>
                                    void loadChurchMembers(selectedChurch.id)
                                  }
                                />
                              </View>
                            );
                          })
                        )}
                        {!churchMembersLoading && churchMembersNextOffset !== null && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => void loadChurchMembers(selectedChurch.id, churchMembersNextOffset)}
                            style={{ padding: 14 }}
                          >
                            <Text style={{ ...fonts.sansSemiBold, color: theme.primary }}>
                              {t.churchMembersLoadMore}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()}

                  </View>
                </GestureDetector>
              </Animated.View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.sheetListContent,
                { paddingBottom: sheetBodyPad + 16 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void loadChurches(true)}
                  tintColor={theme.primary}
                />
              }
            >
              {/* Country filter */}
        {availableCountries.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 10 }}
          >
            {[null, ...availableCountries].map((cName) => {
              const active = countryFilter === cName;
              const label =
                cName === null ? (t.churchAll) : cName;
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCountryFilter(cName);
                  }}
                  style={[
                    styles.countryChip,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : isDarkMode
                          ? "rgba(28,28,30,0.88)"
                          : "rgba(255,255,255,0.92)",
                      borderColor: active ? theme.primary : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? theme.onPrimary : theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 12.5,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                  style={{ marginVertical: 24 }}
                />
              ) : null}

          {!!error && (
            <View
              style={[
                styles.infoCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Text style={{ color: theme.primary, ...fonts.sansMedium }}>
                {error}
              </Text>
            </View>
          )}

          {locationDenied && (
            <View
              style={[
                styles.infoCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Text
                style={{
                  color: mutedText,
                  ...fonts.sansRegular,
                  fontSize: 13.5,
                }}
              >
                {t.churchYouCanSearchByCityState}
              </Text>
            </View>
          )}

            {!loading && enrichedChurches.length === 0 ? (
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: cardBg, borderColor: cardBorder, gap: 12 },
                ]}
              >
                <Text
                  style={{
                    color: theme.onSurface,
                    ...fonts.sansSemiBold,
                    fontSize: 16,
                  }}
                >
                  {search.trim()
                    ? t.churchNoMatchingChurchesFound
                    : t.churchNoVerifiedChurchesPublishedYet}
                </Text>
                <Text
                  style={{
                    color: mutedText,
                    ...fonts.sansRegular,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {t.churchKnowAnIddvElBuenPastor}
                </Text>
                <Pressable
                  onPress={openSubmitModal}
                  style={[
                    styles.primaryPillBtn,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <AppMenuIcon
                    ios="plus.circle.fill"
                    android="add-circle"
                    color={theme.onPrimary}
                    size={17}
                  />
                  <Text
                    style={{
                      color: theme.onPrimary,
                      ...fonts.sansSemiBold,
                      fontSize: 14,
                    }}
                  >
                    {isAdmin
                      ? t.churchAddVerifiedChurch
                      : t.churchSubmitAChurch2}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={[
                  styles.groupedCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {enrichedChurches.map((church, idx) => (
                  <React.Fragment key={church.id}>
                    {idx > 0 && (
                      <View
                        style={[
                          styles.rowDivider,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.07)",
                          },
                        ]}
                      />
                    )}
                    <Pressable
                      onPress={() => focusChurchOnMap(church)}
                      style={({ pressed }) => [
                        styles.churchRow,
                        pressed && {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        },
                      ]}
                    >
                      <Image
                        source={
                          church.photoUrl && !failedPhotoIds[church.id]
                            ? { uri: church.photoUrl }
                            : CHURCH_PIN_IMG
                        }
                        onError={() =>
                          setFailedPhotoIds((prev) => ({
                            ...prev,
                            [church.id]: true,
                          }))
                        }
                        style={styles.rowAvatar}
                        resizeMode={
                          church.photoUrl && !failedPhotoIds[church.id]
                            ? "cover"
                            : "contain"
                        }
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.rowTitle,
                              { color: theme.onSurface, flexShrink: 1 },
                            ]}
                          >
                            {churchDisplayName(church.name, church.city)}
                          </Text>
                          <AppMenuIcon
                            ios="checkmark.seal.fill"
                            android="verified"
                            color={theme.primary}
                            size={15}
                          />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[styles.rowSub, { color: mutedText }]}
                        >
                          {church.address}, {church.city}
                          {church.state ? `, ${church.state}` : ""}
                          {church.postalCode ? ` ${church.postalCode}` : ""}
                        </Text>
                        {church.distanceMiles !== null && (
                          <Text
                            style={{
                              color: theme.primary,
                              ...fonts.sansSemiBold,
                              fontSize: 12,
                            }}
                          >
                            {formatDistance(church.distanceMiles)}
                          </Text>
                        )}
                      </View>
                      <AppMenuIcon
                        ios="chevron.right"
                        android="chevron-right"
                        color={mutedText}
                        size={14}
                        weight="semibold"
                      />
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>
            )}

              {/* "Don't see your church?" */}
          {enrichedChurches.length > 0 && (
            <Pressable
              onPress={openSubmitModal}
              style={({ pressed }) => [
                styles.infoCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.primary + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppMenuIcon
                  ios="building.columns.fill"
                  android="account-balance"
                  color={theme.primary}
                  size={19}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.onSurface,
                    ...fonts.sansSemiBold,
                    fontSize: 15,
                  }}
                >
                  {isAdmin
                    ? t.churchAddAVerifiedChurch
                    : t.churchDonTSeeYourChurch}
                </Text>
                <Text
                  style={{
                    color: mutedText,
                    ...fonts.sansRegular,
                    fontSize: 13,
                  }}
                >
                  {isAdmin
                    ? t.churchPublishACongregationDirectlyOnThe
                    : t.churchSubmitItForAdministratorVerification}
                </Text>
              </View>
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={mutedText}
                size={14}
                weight="semibold"
              />
            </Pressable>
          )}
            </ScrollView>
          )}
        </DetentSheet>
      )}


      {/* ── Submit / Add Verified Church Sheet (120fps Swipe-Down) ─────────── */}
      <Modal
        visible={submitOpen}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={requestCloseSubmit}
        onDismiss={flushPendingSubmitAlert}
      >
        <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
          <KeyboardAvoidingView
            style={{ flex: 1, justifyContent: "flex-end" }}
            behavior={isIOS ? "padding" : "height"}
          >
            <GestureDetector gesture={submitBackdropPan}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(0,0,0,0.48)" },
                  submitBackdropStyle,
                ]}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={requestCloseSubmit}
                />
              </Animated.View>
            </GestureDetector>

            <Animated.View style={submitSheetStyle}>
              <SheetGrabber inline />
            </Animated.View>
            <Animated.View
              style={[
                styles.submitSheet,
                {
                  backgroundColor: isIOS ? "transparent" : bgSurface,
                  borderColor: isIOS
                    ? isDarkMode
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(255,255,255,0.62)"
                    : "transparent",
                  borderWidth: isIOS ? StyleSheet.hairlineWidth : 0,
                  borderBottomWidth: 0,
                  maxHeight: windowHeight * 0.9,
                  paddingBottom: Math.max(insets.bottom, 20),
                },
                submitSheetStyle,
              ]}
            >
              {isIOS ? (
                <GlassSurface
                  glassEffectStyle="regular"
                  intensity={76}
                  style={styles.submitGlassBg}
                />
              ) : null}
              <GestureDetector gesture={submitPan}>
                <View style={styles.submitHeader}>
                  {!isIOS ? <View style={styles.grabber} /> : null}
                  <View style={styles.submitTitleRow}>
                    <GlassSurface
                      isInteractive
                      glassEffectStyle="regular"
                      intensity={56}
                      style={[
                        styles.submitCancelPill,
                        !isIOS && {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.10)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <Pressable
                        onPress={requestCloseSubmit}
                        style={({ pressed }) => [
                          styles.submitCancelHit,
                          pressed && { opacity: 0.72 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t.authCancel}
                      >
                        <Text
                          style={[
                            styles.submitCancelText,
                            { color: theme.onSurface },
                          ]}
                        >
                          {t.authCancel}
                        </Text>
                      </Pressable>
                    </GlassSurface>
                    <Text
                      style={[
                        styles.submitTitle,
                        isIOS && styles.submitTitleIOS,
                        { color: theme.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {editingChurch
                        ? editingChurch.status === "pending"
                          ? t.churchReviewShortTitle
                          : t.churchEditShortTitle
                        : t.churchNewShortTitle}
                    </Text>
                    <Pressable
                      disabled={submitting}
                      onPress={() => void handleSubmitChurch()}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isAdmin
                          ? editingChurch
                            ? editingChurch.status === "pending"
                              ? t.churchApprovePublishOnMap
                              : t.churchSaveChanges
                            : t.churchVerifyPublish
                          : t.churchSendRequestForApproval
                      }
                      style={({ pressed }) => [
                        styles.submitProminentCircle,
                        {
                          backgroundColor: theme.primary,
                          opacity: submitting ? 0.6 : pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color={theme.onPrimary} />
                      ) : (
                        <AppMenuIcon
                          ios={isAdmin ? "checkmark" : "paperplane.fill"}
                          android={isAdmin ? "check" : "send"}
                          color={theme.onPrimary}
                          size={17}
                          weight="bold"
                        />
                      )}
                    </Pressable>
                  </View>
                </View>
              </GestureDetector>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={isIOS ? "interactive" : "on-drag"}
                contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24, gap: 12 }}
              >
                {/* 1 · Name */}
                {renderFormField({
                  label: t.churchChurchName,
                  val: formName,
                  set: setFormName,
                  placeholder: t.churchEGIddvElBuenPastor,
                  max: 100,
                  returnKeyType: addressVisible ? "next" : "done",
                  onSubmitEditing: addressVisible
                    ? () => formAddressRef.current?.focus()
                    : undefined,
                })}

                {/* 2 · Compact Location Card */}
                <View
                  style={[
                    styles.compactLocationCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: locationChanged
                        ? "#34C75970"
                        : parsedFormCoords
                          ? isDarkMode
                            ? "rgba(255,255,255,0.20)"
                            : theme.primary + "45"
                          : cardBorder,
                    },
                  ]}
                >
                  <View style={styles.compactLocationRow}>
                    <View style={styles.compactLocationLeft}>
                      <AppMenuIcon
                        ios={parsedFormCoords ? "checkmark.circle.fill" : "mappin.and.ellipse"}
                        android={parsedFormCoords ? "check-circle" : "add-location-alt"}
                        color={parsedFormCoords ? "#34C759" : theme.primary}
                        size={19}
                      />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            color: theme.onSurface,
                            ...(parsedFormCoords ? fonts.sansMedium : fonts.sansSemiBold),
                            fontSize: 14,
                            lineHeight: 19,
                          }}
                        >
                          {parsedFormCoords
                            ? [formAddress.trim(), formCity.trim(), formState.trim()]
                                .filter(Boolean)
                                .join(", ") || t.churchLocationSet
                            : t.churchLocationRequired}
                        </Text>
                        {parsedFormCoords && locationChanged && (
                          <View style={styles.updatedBadgePill}>
                            <Text style={styles.updatedBadgeText}>
                              {t.churchLocationUpdatedBadge}
                            </Text>
                          </View>
                        )}
                        {!parsedFormCoords && (
                          <Text
                            numberOfLines={2}
                            style={{
                              color: mutedText,
                              ...fonts.sansRegular,
                              fontSize: 12.5,
                              lineHeight: 17,
                            }}
                          >
                            {t.churchLocationHint}
                          </Text>
                        )}
                      </View>
                    </View>

                    {Platform.OS !== "web" && (
                      <Pressable
                        onPress={handleStartPinPicker}
                        disabled={submitting}
                        accessibilityRole="button"
                        accessibilityLabel={
                          parsedFormCoords
                            ? t.churchChangeLocationOnMap
                            : t.churchPickOnMap
                        }
                        style={({ pressed }) => [
                          styles.compactLocationBtn,
                          {
                            backgroundColor: parsedFormCoords
                              ? isDarkMode
                                ? "rgba(255,255,255,0.12)"
                                : theme.primary + "16"
                              : theme.primary,
                            opacity: pressed ? 0.82 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: parsedFormCoords ? theme.primary : theme.onPrimary,
                            ...fonts.sansSemiBold,
                            fontSize: 13.5,
                          }}
                        >
                          {parsedFormCoords
                            ? t.churchChangeLocationShort
                            : t.churchPickLocationShort}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Admin-only collapsible coordinates / Maps link paste field */}
                  {isAdmin && (
                    <View style={{ gap: 8 }}>
                      <Pressable
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showCoordsInput }}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowCoordsInput((v) => !v);
                        }}
                        style={styles.coordsToggleBtn}
                      >
                        <Text
                          style={{
                            color: mutedText,
                            ...fonts.sansMedium,
                            fontSize: 12.5,
                          }}
                        >
                          {t.churchPasteCoordsToggle}
                        </Text>
                        <AppMenuIcon
                          ios={showCoordsInput ? "chevron.up" : "chevron.down"}
                          android={showCoordsInput ? "expand-less" : "expand-more"}
                          color={mutedText}
                          size={12}
                          weight="semibold"
                        />
                      </Pressable>

                      {showCoordsInput && (
                        <AnimatedField
                          label={t.churchExactLocationCoordinatesOrMapsLink}
                          value={formCoordsInput}
                          onChangeText={(txt) => {
                            setFormCoordsInput(txt);
                            const parsed = parseCoordsOrMapsInput(txt);
                            if (parsed) {
                              const key = `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;
                              if (key !== lastPastedCoordsRef.current) {
                                lastPastedCoordsRef.current = key;
                                setLocationChanged(true);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                showFormToast(
                                  t.churchLocationUpdatedToast,
                                  `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`,
                                  "pin",
                                );
                              }
                              void autofillAddressFromCoords(parsed.lat, parsed.lng);
                            }
                          }}
                          placeholder={t.churchEG3738121218975}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!submitting}
                          surfaceColor={bgSurface}
                        />
                      )}
                    </View>
                  )}

                  {!addressVisible && (
                    <Pressable
                      hitSlop={8}
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowAddressFields(true);
                      }}
                    >
                      <Text
                        style={{
                          color: theme.primary,
                          ...fonts.sansSemiBold,
                          fontSize: 13,
                        }}
                      >
                        {t.churchTypeAddressInstead}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* 3 · iOS Contacts-Style Grouped Address Card */}
                {addressVisible && (
                  <View
                    style={[
                      styles.addressGroupCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      },
                    ]}
                  >
                    <AnimatedField
                      ref={formAddressRef}
                      grouped
                      label={t.churchStreetAddress}
                      value={formAddress}
                      onChangeText={setFormAddress}
                      placeholder="1234 Main St"
                      maxLength={140}
                      editable={!submitting}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => formCityRef.current?.focus()}
                    />

                    <View style={styles.addressTwoColRow}>
                      <AnimatedField
                        ref={formCityRef}
                        grouped
                        isLast
                        containerStyle={{ flex: 1.15 }}
                        label={t.churchCity}
                        value={formCity}
                        onChangeText={setFormCity}
                        placeholder={t.churchEGLosAngeles}
                        maxLength={80}
                        editable={!submitting}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => formStateRef.current?.focus()}
                      />
                      <View
                        style={[
                          styles.addressColDivider,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.10)"
                              : theme.outlineVariant + "48",
                          },
                        ]}
                      />
                      <AnimatedField
                        ref={formStateRef}
                        grouped
                        isLast
                        containerStyle={{ flex: 0.85 }}
                        label={t.churchStateProvince}
                        value={formState}
                        onChangeText={setFormState}
                        placeholder={t.churchEGCaliforniaTexas}
                        maxLength={60}
                        editable={!submitting}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => formCountryRef.current?.focus()}
                      />
                    </View>
                    <View
                      style={[
                        styles.addressRowDivider,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.10)"
                            : theme.outlineVariant + "48",
                        },
                      ]}
                    />

                    <View style={styles.addressTwoColRow}>
                      <AnimatedField
                        ref={formCountryRef}
                        grouped
                        isLast
                        containerStyle={{ flex: 1.15 }}
                        label={t.churchCountry}
                        value={formCountry}
                        onChangeText={setFormCountry}
                        placeholder={t.churchUnitedStatesMexico}
                        maxLength={60}
                        editable={!submitting}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => formPostalRef.current?.focus()}
                      />
                      <View
                        style={[
                          styles.addressColDivider,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.10)"
                              : theme.outlineVariant + "48",
                          },
                        ]}
                      />
                      <AnimatedField
                        ref={formPostalRef}
                        grouped
                        isLast
                        containerStyle={{ flex: 0.85 }}
                        label={t.churchZipPostalCodeOptional}
                        value={formPostal}
                        onChangeText={setFormPostal}
                        placeholder="95112"
                        maxLength={24}
                        editable={!submitting}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                )}

                {/* 4 · Everything optional lives behind one row */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showMoreDetails }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowMoreDetails((v) => !v);
                  }}
                  style={({ pressed }) => [
                    styles.moreDetailsRow,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: theme.onSurface,
                      ...fonts.sansSemiBold,
                      fontSize: 15,
                    }}
                  >
                    {t.churchMoreDetailsOptional}
                  </Text>
                  <AppMenuIcon
                    ios={showMoreDetails ? "chevron.up" : "chevron.down"}
                    android={showMoreDetails ? "expand-less" : "expand-more"}
                    color={mutedText}
                    size={14}
                    weight="semibold"
                  />
                </Pressable>

                {showMoreDetails && (
                  <>
                    {renderFormField({
                      label: t.churchPastorMinisterOptional,
                      val: formPastor,
                      set: setFormPastor,
                      placeholder: t.churchEGPastorJuanPerez,
                      max: 80,
                    })}

                    {scheduleAsText ? (
                      renderFormField({
                        label: t.churchServiceTimesOptional,
                        val: formSchedule,
                        set: setFormSchedule,
                        placeholder: t.churchEGSundays1000Am,
                        max: 240,
                      })
                    ) : (
                      <View style={{ gap: 6 }}>
                        <Text
                          style={{
                            color: mutedText,
                            ...fonts.sansSemiBold,
                            fontSize: 12.5,
                            marginLeft: 2,
                          }}
                        >
                          {t.churchServiceTimesOptional}
                        </Text>
                        <ChurchScheduleEditor
                          value={formSchedule}
                          onChange={setFormSchedule}
                          disabled={submitting}
                        />
                      </View>
                    )}

                    {renderFormField({
                      label: t.churchVerificationPhoneOrEmailPrivate,
                      val: formContact,
                      set: setFormContact,
                      placeholder: t.churchVisibleOnlyToAdministrator,
                      max: 160,
                    })}

                {/* Multi-Photo Camera, Gallery & Cloud URL Manager (Max 5 user / 10 admin) */}
                <View
                  style={{
                    padding: 13,
                    borderRadius: 14,
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          color: theme.onSurface,
                          ...fonts.sansSemiBold,
                          fontSize: 13.5,
                        }}
                      >
                        {t.churchPhotosLabel}
                      </Text>
                      <View
                        style={[
                          styles.photoCountBadge,
                          {
                            backgroundColor:
                              formPhotos.length > 0
                                ? "rgba(52, 199, 89, 0.16)"
                                : isDarkMode
                                  ? "rgba(255,255,255,0.10)"
                                  : theme.surfaceVariants.containerHighest,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.photoCountBadgeText,
                            {
                              color:
                                formPhotos.length > 0 ? "#2E9E56" : mutedText,
                            },
                          ]}
                        >
                          {formPhotos.length}/{maxPhotos}
                        </Text>
                      </View>
                    </View>
                    {uploadingPhotos && (
                      <View style={styles.uploadingBadge}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text
                          style={{
                            color: theme.primary,
                            ...fonts.sansSemiBold,
                            fontSize: 12,
                          }}
                        >
                          {t.churchUploadingPhoto}
                        </Text>
                      </View>
                    )}
                  </View>

                  {Platform.OS !== "web" && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        disabled={
                          uploadingPhotos ||
                          submitting ||
                          formPhotos.length >= maxPhotos
                        }
                        onPress={() => void handlePickPhotos("camera")}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 11,
                          backgroundColor: theme.primary + "16",
                          opacity:
                            uploadingPhotos || formPhotos.length >= maxPhotos
                              ? 0.45
                              : pressed
                                ? 0.8
                                : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios="camera.fill"
                          android="photo-camera"
                          color={theme.primary}
                          size={15}
                        />
                        <Text
                          style={{
                            color: theme.primary,
                            ...fonts.sansSemiBold,
                            fontSize: 13,
                          }}
                        >
                          {t.churchTakePhoto}
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={
                          uploadingPhotos ||
                          submitting ||
                          formPhotos.length >= maxPhotos
                        }
                        onPress={() => void handlePickPhotos("library")}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 11,
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.09)"
                            : theme.surfaceVariants.containerHighest,
                          opacity:
                            uploadingPhotos || formPhotos.length >= maxPhotos
                              ? 0.45
                              : pressed
                                ? 0.8
                                : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios="photo.on.rectangle.angled"
                          android="photo-library"
                          color={theme.onSurface}
                          size={15}
                        />
                        <Text
                          style={{
                            color: theme.onSurface,
                            ...fonts.sansSemiBold,
                            fontSize: 13,
                          }}
                        >
                          {t.churchGallery}
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={
                          uploadingPhotos ||
                          submitting ||
                          formPhotos.length >= maxPhotos
                        }
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowPhotoUrlInput((v) => !v);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showPhotoUrlInput }}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          paddingHorizontal: 11,
                          paddingVertical: 10,
                          borderRadius: 11,
                          backgroundColor: showPhotoUrlInput
                            ? theme.primary + "22"
                            : isDarkMode
                              ? "rgba(255,255,255,0.09)"
                              : theme.surfaceVariants.containerHighest,
                          opacity:
                            uploadingPhotos || formPhotos.length >= maxPhotos
                              ? 0.45
                              : pressed
                                ? 0.8
                                : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios="link"
                          android="link"
                          color={showPhotoUrlInput ? theme.primary : theme.onSurface}
                          size={14}
                        />
                        <Text
                          style={{
                            color: showPhotoUrlInput ? theme.primary : theme.onSurface,
                            ...fonts.sansSemiBold,
                            fontSize: 13,
                          }}
                        >
                          {t.churchPastePhotoUrlAction}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {formPhotos.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
                    >
                      {formPhotos.map((uri, idx) => (
                        <View
                          key={uri}
                          style={{
                            width: 108,
                            height: 84,
                            borderRadius: 12,
                            overflow: "hidden",
                            borderWidth: idx === 0 ? 2 : 1,
                            borderColor:
                              idx === 0 ? theme.primary : cardBorder,
                            position: "relative",
                          }}
                        >
                          <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                          {/* Set as Primary Cover badge / button */}
                          <Pressable
                            onPress={() => {
                              if (idx === 0) return;
                              Haptics.selectionAsync();
                              setFormPhotos((prev) => {
                                const next = [...prev];
                                const [picked] = next.splice(idx, 1);
                                next.unshift(picked);
                                return next;
                              });
                              showFormToast(t.churchCoverUpdatedToast, undefined, "photo");
                            }}
                            style={{
                              position: "absolute",
                              bottom: 5,
                              left: 5,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor:
                                idx === 0
                                  ? theme.primary
                                  : "rgba(0,0,0,0.62)",
                            }}
                          >
                            <Text
                              style={{
                                color: idx === 0 ? theme.onPrimary : "#FFFFFF",
                                ...fonts.sansSemiBold,
                                fontSize: 10,
                              }}
                            >
                              {idx === 0
                                ? t.churchCover
                                : t.churchMakeCover}
                            </Text>
                          </Pressable>

                          {/* Delete photo button */}
                          <Pressable
                            hitSlop={6}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setFormPhotos((prev) =>
                                prev.filter((_, i) => i !== idx),
                              );
                            }}
                            style={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: "rgba(0,0,0,0.68)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <AppMenuIcon
                              ios="xmark"
                              android="close"
                              color="#FFFFFF"
                              size={11}
                              weight="bold"
                            />
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Optional Cloud Photo URL input — glass-harmonized, revealed on demand */}
                  {formPhotos.length < maxPhotos && (showPhotoUrlInput || Platform.OS === "web") && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={formPhotoUrl}
                        onChangeText={setFormPhotoUrl}
                        placeholder={
                          t.churchOrPasteCloudPhotoHttpsUrl
                        }
                        placeholderTextColor={mutedText}
                        maxLength={300}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!submitting && !uploadingPhotos}
                        style={[
                          styles.formInput,
                          {
                            flex: 1,
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(255,255,255,0.68)",
                            borderColor: cardBorder,
                            color: theme.onSurface,
                            paddingVertical: 8,
                            fontSize: 13.5,
                          },
                        ]}
                      />
                      {!!formPhotoUrl.trim() && (
                        <Pressable
                          onPress={() => {
                            const clean = formPhotoUrl.trim();
                            if (!/^https:\/\/[^\s"'<>]+$/i.test(clean)) {
                              setFormError(
                                t.churchPhotoUrlMustStartWithHttps2,
                              );
                              return;
                            }
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setFormPhotos((prev) =>
                              prev.includes(clean) || prev.length >= maxPhotos
                                ? prev
                                : [...prev, clean],
                            );
                            setFormPhotoUrl("");
                            setShowPhotoUrlInput(false);
                            setFormError("");
                            showFormToast(t.churchPhotoAddedToast, undefined, "photo");
                          }}
                          style={{
                            paddingHorizontal: 13,
                            borderRadius: 11,
                            backgroundColor: theme.primary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: theme.onPrimary,
                              ...fonts.sansSemiBold,
                              fontSize: 13,
                            }}
                          >
                            {t.churchAdd}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
                  </>
                )}


                {!!formError && (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      color: theme.primary,
                      ...fonts.sansMedium,
                      fontSize: 13.5,
                    }}
                  >
                    {formError}
                  </Text>
                )}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
          <ActionToast
            toast={formToast}
            topOffset={Math.max(insets.top, 14) + 6}
          />
        </GestureHandlerRootView>
      </Modal>

      {/* ── Fullscreen Church Photo Gallery Viewer Modal ──────────────────── */}
      <Modal
        visible={fullscreenPhotoIndex !== null && Boolean(selectedChurch)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullscreenPhotoIndex(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.94)",
            justifyContent: "center",
          }}
        >
          {selectedChurch && fullscreenPhotoIndex !== null && (() => {
            const validPhotos = getChurchPhotos(selectedChurch).filter(
              (u) => !failedPhotoIds[u],
            );
            return (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentOffset={{
                    x: fullscreenPhotoIndex * windowWidth,
                    y: 0,
                  }}
                >
                  {validPhotos.map((uri) => (
                    <View
                      key={uri}
                      style={{
                        width: windowWidth,
                        height: windowHeight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image
                        source={{ uri }}
                        style={{
                          width: windowWidth,
                          height: windowHeight * 0.76,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={62}
                  style={[
                    styles.overlayGlassPill,
                    {
                      position: "absolute",
                      top: insets.top + 14,
                      right: 18,
                    },
                    !isIOS && { backgroundColor: "rgba(255,255,255,0.18)" },
                  ]}
                >
                  <Pressable
                    onPress={() => setFullscreenPhotoIndex(null)}
                    accessibilityRole="button"
                    accessibilityLabel={t.done}
                    style={styles.overlayGlassPillHit}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        ...fonts.sansSemiBold,
                        fontSize: 15,
                      }}
                    >
                      {t.done}
                    </Text>
                  </Pressable>
                </GlassSurface>
              </>
            );
          })()}
        </View>
      </Modal>

      <ChurchQrSheet church={qrShareChurch} onClose={() => setQrShareChurch(null)} />

      {/* ── In-App Camera QR Code Scanner Modal ───────────────────────────── */}
      {Platform.OS !== "web" && (
        <Modal
          visible={qrScannerOpen}
          transparent={false}
          animationType="slide"
          statusBarTranslucent
          onRequestClose={dismissQrScanner}
        >
          <View style={{ flex: 1, backgroundColor: "#000000" }}>
            {qrScannerOpen && (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleQrScanned}
              />
            )}

            {/* Top Bar */}
            <View
              style={{
                paddingTop: insets.top + 12,
                paddingHorizontal: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  ...fonts.bold,
                  fontSize: 20,
                }}
              >
                {t.accountScanQrCode}
              </Text>
              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={62}
                style={[
                  styles.overlayGlassPill,
                  !isIOS && { backgroundColor: "rgba(0,0,0,0.58)" },
                ]}
              >
                <Pressable
                  onPress={dismissQrScanner}
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  style={styles.overlayGlassPillHit}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      ...fonts.sansSemiBold,
                      fontSize: 14.5,
                    }}
                  >
                    {t.close}
                  </Text>
                </Pressable>
              </GlassSurface>
            </View>

            {/* Center Viewfinder Frame */}
            <View
              pointerEvents="none"
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 32,
              }}
            >
              <View
                style={{
                  width: 248,
                  height: 248,
                  borderRadius: 28,
                  borderWidth: 3,
                  borderColor: "#FAF5EE",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              />
              <GlassSurface
                glassEffectStyle="regular"
                intensity={58}
                style={[
                  styles.scannerHintGlass,
                  !isIOS && { backgroundColor: "rgba(0,0,0,0.65)" },
                ]}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    ...fonts.sansMedium,
                    fontSize: 13.5,
                    textAlign: "center",
                  }}
                >
                  {t.churchPointAtAnElBuenPastor}
                </Text>
              </GlassSurface>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  locationCta: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  moreDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  nearMeGlassPill: {
    height: 40,
    borderRadius: 20,
  },
  nearMeGlassHit: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  sheetSearch: {
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  sheetSummary: {
    ...fonts.sansMedium,
    fontSize: 13,
    paddingHorizontal: 2,
  },
  sheetListContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 14,
  },
  sheetDetailBody: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
    gap: 12,
  },
  scheduleCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  root: { flex: 1 },
  topStatusScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  churchPinSlot: {
    width: 50,
    height: 45,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iosNativeModePickerHost: {
    width: 118,
    height: 40,
  },
  iosModeSegmentedWrap: {
    width: 192,
  },
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  circleBtnHit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15.5,
    paddingVertical: 0,
  },
  pillControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  modeSegmented: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 3,
    gap: 2,
    overflow: "hidden",
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
  nearMePill: {
    borderRadius: 20,
  },
  nearMeHit: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  countryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  clusterBubble: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  clusterBubbleText: {
    color: "#FFFFFF",
    ...fonts.sansBold,
    fontSize: 13.5,
  },
  floatingGpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  selectedHeroPhoto: {
    width: "100%",
    height: 138,
    borderRadius: 16,
    marginBottom: 2,
  },
  pinOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  pinImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  listContent: {
    paddingHorizontal: 18,
    gap: 18,
  },
  listHeaderBlock: {
    gap: 4,
  },
  screenTitle: {
    ...fonts.bold,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  screenSub: {
    ...fonts.sansRegular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  sectionEyebrow: {
    ...fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  nearCard: {
    width: 148,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  nearAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  nearName: {
    ...fonts.sansSemiBold,
    fontSize: 14,
    textAlign: "center",
  },
  nearCity: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    textAlign: "center",
  },
  distPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  distPillText: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  primaryPillBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  groupedCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  churchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  rowTitle: {
    ...fonts.sansSemiBold,
    fontSize: 16,
  },
  rowSub: {
    ...fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  mapBottomWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    zIndex: 20,
  },
  mapPeekCard: {
    borderRadius: 22,
    overflow: "hidden",
  },
  mapPeekInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  peekPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  selectedCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  selectedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 13,
  },
  selectedTitle: {
    ...fonts.bold,
    fontSize: 18.5,
  },
  miniCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCloseGlass: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCloseGlassHit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingGlassChip: {
    borderRadius: 999,
    overflow: "hidden",
  },
  pendingGlassChipHit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  selectedActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnSecondaryGlass: {
    flex: 1,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  actionBtnSecondaryHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
  },
  submitSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  submitGlassBg: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  submitHeader: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
  submitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  submitCancelPill: {
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  submitCancelHit: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitCancelText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  submitProminentCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  submitTitle: {
    flex: 1,
    textAlign: "center",
    ...fonts.bold,
    fontSize: 19,
  },
  submitTitleIOS: {
    ...fonts.sansBold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  overlayGlassPill: {
    borderRadius: 999,
  },
  overlayGlassPillHit: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerHintGlass: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
    borderCurve: "continuous",
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    ...fonts.sansRegular,
    fontSize: 15.5,
  },
  compactLocationCard: {
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  compactLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compactLocationLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  compactLocationBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  coordsToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  updatedBadgePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(52, 199, 89, 0.16)",
  },
  updatedBadgeText: {
    color: "#2E9E56",
    ...fonts.sansSemiBold,
    fontSize: 11,
  },
  photoCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  photoCountBadgeText: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
  },
  uploadingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressGroupCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  addressTwoColRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  addressColDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  addressRowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 14,
  },
  submitPrimaryBtn: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
