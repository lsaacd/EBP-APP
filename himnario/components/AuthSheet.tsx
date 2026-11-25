import { fonts } from '../theme/theme';
import { churchDisplayName } from '../utils/churchName';
import SheetGrabber from './SheetGrabber';
import CommunityProfile from './CommunityProfile';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  Share,
  Linking,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router as globalRouter, usePathname, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  cancelAnimation,
  FadeInRight,
  FadeInLeft,
} from 'react-native-reanimated';
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, computeUserInitials } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlaylists } from '../context/PlaylistsContext';
import GlassSurface from './GlassSurface';
import AppMenuIcon from './AppMenuIcon';
import OfflineAudioCard from './OfflineAudioCard';
import AboutHymnalContent from './AboutHymnalContent';
import { APPLE_AVATAR_GRADIENT } from './HomeHeaderActions';
import { AppShareContent, SMART_APP_URL } from './AppShareSheet';
import { MINISTRIES, choirDisplayName } from '../data/communityRules';
import { useApprovedChoirs } from '../utils/choirsStore';
import { useFriends } from '../utils/friendsStore';
import { useNotifications } from '../utils/notificationsStore';
import { buildSheetPanGesture } from '../utils/useSheetBackdropGesture';
import { getPasswordStrength } from '../utils/passwordStrength';
import { AnimatedField } from './AnimatedField';
import LiquidGlassSegmented from './LiquidGlassSegmented';
import AuthSheetSwiftUI from './AuthSheetSwiftUI';
import { getExpoSwiftUI, isIOSLiquidGlassAvailable } from '../utils/expoSwiftUI';

const APP_SHARE_BANNER = require('../assets/images/app-share-banner.png');
const APP_SMART_QR = require('../assets/images/ebp-smart-app-qr.png');
const IMESSAGE_ICON = require('../assets/images/imessage-brand.png');
const WHATSAPP_ICON = require('../assets/images/whatsapp-brand.png');
const FEEDBACK_URL = 'https://himnarioebp.com/feedback.html?form=audio';

type AuthMode = 'login' | 'register' | 'recovery';
type SheetPage = 'account' | 'profile-details' | 'ministry' | 'choir' | 'church-location' | 'blocks' | 'friends' | 'notifications' | 'moderation' | 'share-app' | 'help';

interface AuthSheetProps {
  visible?: boolean;
  onClose?: () => void;
  onOpenShareApp?: () => void;
  presentationMode?: 'modal' | 'native-sheet' | 'swiftui-sheet';
  initialPage?: SheetPage;
  originPathname?: string;
}

export function AuthSheet({
  visible: propVisible,
  onClose: propOnClose,
  onOpenShareApp,
  presentationMode = 'modal',
  initialPage = 'account',
  originPathname,
}: AuthSheetProps) {
  const {
    theme,
    isDarkMode,
    toggleTheme,
    fontSizeMultiplier,
    changeFontSize,
    setFontSizeMultiplier,
  } = useTheme();
  const { t, language, hymnLanguage, setLanguage, setHymnLanguage } = useLanguage();
  const {
    user,
    isSyncing,
    authSheetVisible,
    pendingAuthSheetPage,
    clearPendingAuthSheetPage,
    openAuthSheet,
    closeAuthSheet,
    signIn,
    register,
    requestPasswordRecovery,
    requestEmailVerification,
    refreshUser,
    syncBlocked,
    isLoading,
    updateProfileName,
    syncNow,
    resolveSyncConflict,
    signOut,
    deleteAccount,
  } = useAuth();
  const { favoriteIds } = useFavorites();
  const { playlists } = usePlaylists();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const { lists: friendsLists, badgeCount: friendsBadge, refreshIfStale: refreshFriendsIfStale } = useFriends();
  const { unreadCount: notificationsUnread } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pendingPostCloseRef = useRef<'settings' | 'churches' | 'scan-qr' | 'share-app' | 'share-app-page' | 'help-page' | 'reopen-auth' | 'hymn' | 'member' | 'my-profile' | 'home' | null>(null);
  const pendingHymnIdRef = useRef<string | null>(null);
  const pendingMemberIdRef = useRef<string | null>(null);

  const visible = propVisible !== undefined ? propVisible : authSheetVisible;
  const signedInUserId = user?.id;
  useEffect(() => {
    if (visible && signedInUserId) void refreshFriendsIfStale();
  }, [visible, signedInUserId, refreshFriendsIfStale]);
  const onClose = propOnClose || closeAuthSheet;
  const isIOS = Platform.OS === 'ios';
  const isNativeSheet = presentationMode === 'native-sheet';
  const isSwiftUISheet = presentationMode === 'swiftui-sheet';
  const hasIOSGlass = isIOS && isIOSLiquidGlassAvailable();
  const hasSwiftUIForm = isIOS && Boolean(getExpoSwiftUI());
  const isNativeGlassSheet = isNativeSheet && hasIOSGlass;
  const es = language !== 'en';

  const [page, setPage] = useState<SheetPage>(initialPage);
  const [aboutParent, setAboutParent] = useState<SheetPage>('account');
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailAction, setEmailAction] = useState<'recovery' | 'verification' | 'refresh' | null>(null);
  const accountActionRef = useRef(0);
  const [linkError, setLinkError] = useState(false);

  // Refs & Reanimated values for AuthSheet fields, sliding pill, and error shake
  const nameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentProgress = useSharedValue(0);
  const formShakeX = useSharedValue(0);

  useEffect(() => {
    if (mode === 'login' || mode === 'register') {
      segmentProgress.value = withSpring(mode === 'register' ? 1 : 0, {
        damping: 20,
        stiffness: 280,
        mass: 0.8,
      });
    }
  }, [mode, segmentProgress]);

  // Share sub-page state
  const [shareTab, setShareTab] = useState<'banner' | 'qr'>('banner');
  const [shareStatusMessage, setShareStatusMessage] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileNameDraft(user.displayName || '');
    }
  }, [user]);

  useEffect(() => {
    ++accountActionRef.current;
    setEmailAction(null);
    if (visible) {
      setPage(initialPage);
      setErrorMessage(null);
      setInfoMessage(null);
      setSubmitting(false);
      setShowPassword(false);
      pendingPostCloseRef.current = null;
    } else {
      setPage(initialPage);
      setShareTab('banner');
      setShareStatusMessage(null);
      setSharingImage(false);
      setLinkError(false);
      setSubmitting(false);
      setShowPassword(false);
      setKeyboardHeight(0);
      if (!isSwiftUISheet) {
        pendingPostCloseRef.current = null;
      }
    }
  }, [initialPage, isSwiftUISheet, visible]);

  useEffect(() => {
    if (visible && user && pendingAuthSheetPage) {
      setPage(pendingAuthSheetPage);
      clearPendingAuthSheetPage();
    }
  }, [visible, user, pendingAuthSheetPage, clearPendingAuthSheetPage]);

  const userIdKey = user?.id ?? null;
  useEffect(() => {
    ++accountActionRef.current;
    setEmailAction(null);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowPassword(false);
    if (!userIdKey) {
      setPage((prev) =>
        ['profile-details', 'ministry', 'choir', 'church-location', 'blocks', 'friends', 'notifications', 'moderation'].includes(prev)
          ? 'account'
          : prev
      );
    }
    const actionRef = accountActionRef;
    return () => { ++actionRef.current; };
  }, [mode, userIdKey]);

  useEffect(() => {
    if (!visible || isNativeSheet) return;
    const showEvent = isIOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIOS ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(Math.max(0, e?.endCoordinates?.height || 0));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isIOS, isNativeSheet, visible]);

  const travel = Math.max(windowHeight, 560);
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const spring = {
    damping: 28,
    stiffness: 240,
    mass: 1,
    overshootClamping: true,
  };

  const currentPathname = usePathname();
  const onChurchesScreen = (originPathname ?? currentPathname) === '/churches';
  const dismissingNativeRef = useRef(false);
  const sawVisibleInNativeRef = useRef(false);
  const userChurchIdRef = useRef(user?.churchId ?? null);
  const currentPathnameRef = useRef(currentPathname);
  const onChurchesScreenRef = useRef(onChurchesScreen);
  const onOpenShareAppRef = useRef(onOpenShareApp);
  const onCloseRef = useRef(onClose);
  const openAuthSheetRef = useRef(openAuthSheet);

  useEffect(() => {
    userChurchIdRef.current = user?.churchId ?? null;
    currentPathnameRef.current = currentPathname;
    onChurchesScreenRef.current = onChurchesScreen;
    onOpenShareAppRef.current = onOpenShareApp;
    onCloseRef.current = onClose;
    openAuthSheetRef.current = openAuthSheet;
  }, [currentPathname, onChurchesScreen, onClose, onOpenShareApp, openAuthSheet, user?.churchId]);

  const runPendingPostClose = useCallback(() => {
    const nextAction = pendingPostCloseRef.current;
    pendingPostCloseRef.current = null;
    if (!nextAction) return;
    const churchId = userChurchIdRef.current;
    if (nextAction === 'settings') {
      globalRouter.navigate('/(tabs)/settings');
    } else if (nextAction === 'churches') {
      // Already on the map (e.g. this sheet was opened from it): closing the
      // sheet is enough. Pushing again would stack a second map screen.
      if (!onChurchesScreenRef.current) {
        globalRouter.push((churchId ? `/churches?id=${encodeURIComponent(churchId)}` : '/churches') as any);
      }
    } else if (nextAction === 'scan-qr') {
      if (onChurchesScreenRef.current) globalRouter.replace('/churches?scan=1' as any);
      else globalRouter.push('/churches?scan=1' as any);
    } else if (nextAction === 'share-app' && onOpenShareAppRef.current) {
      onOpenShareAppRef.current();
    } else if (nextAction === 'share-app-page') {
      globalRouter.push({
        pathname: '/auth-sheet',
        params: { page: 'share-app', from: currentPathnameRef.current },
      } as any);
    } else if (nextAction === 'help-page') {
      globalRouter.push({
        pathname: '/auth-sheet',
        params: { page: 'help', from: currentPathnameRef.current },
      } as any);
    } else if (nextAction === 'reopen-auth') {
      openAuthSheetRef.current();
    } else if (nextAction === 'hymn' && pendingHymnIdRef.current) {
      const hymnId = pendingHymnIdRef.current;
      pendingHymnIdRef.current = null;
      globalRouter.push(`/hymn/${encodeURIComponent(hymnId)}` as any);
    } else if (nextAction === 'member' && pendingMemberIdRef.current) {
      const memberId = pendingMemberIdRef.current;
      pendingMemberIdRef.current = null;
      globalRouter.push(`/member/${encodeURIComponent(memberId)}` as any);
    } else if (nextAction === 'my-profile') {
      globalRouter.push('/my-profile' as any);
    } else if (nextAction === 'home') {
      if (globalRouter.canDismiss()) {
        globalRouter.dismissTo('/(tabs)/home');
      } else {
        globalRouter.navigate('/(tabs)/home' as any);
      }
    }
  }, []);

  const finishClose = useCallback(() => {
    onCloseRef.current();
    runPendingPostClose();
  }, [runPendingPostClose]);

  // Keep AuthContext synchronized when native iOS formSheet is dismissed (by swipe or button),
  // and run any queued navigation cleanly right after the UIKit sheet finishes unmounting.
  useEffect(() => {
    if (!isNativeSheet) return;
    return () => {
      onCloseRef.current();
      if (pendingPostCloseRef.current) {
        setTimeout(() => {
          runPendingPostClose();
        }, 60);
      }
    };
  }, [isNativeSheet, runPendingPostClose]);

  // If closeAuthSheet() is called externally while the native formSheet is mounted, dismiss it.
  useEffect(() => {
    if (!isNativeSheet) return;
    if (authSheetVisible) {
      sawVisibleInNativeRef.current = true;
    } else if (sawVisibleInNativeRef.current && !dismissingNativeRef.current) {
      dismissingNativeRef.current = true;
      if (router.canGoBack()) {
        router.back();
      }
    }
  }, [authSheetVisible, isNativeSheet, router]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSwiftUISheet) {
      onCloseRef.current();
      return;
    }
    if (isNativeSheet) {
      if (dismissingNativeRef.current) return;
      dismissingNativeRef.current = true;
      if (router.canGoBack()) {
        router.back();
      } else {
        finishClose();
      }
      return;
    }
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, isNativeSheet, isSwiftUISheet, progress, router]);

  const handleSwiftUIDismiss = useCallback(() => {
    onCloseRef.current();
    runPendingPostClose();
  }, [runPendingPostClose]);

  const clearPendingPostClose = useCallback(() => {
    pendingPostCloseRef.current = null;
  }, []);

  const goSubPage = useCallback((next: SheetPage) => {
    Haptics.selectionAsync();
    setLinkError(false);
    setErrorMessage(null);
    setInfoMessage(null);
    setPage(next);
  }, []);

  const handleBackOrClose = useCallback(() => {
    if (page === 'account') {
      animateClose();
      return;
    }
    if (isNativeSheet && initialPage !== 'account' && hasSwiftUIForm) {
      pendingPostCloseRef.current = 'reopen-auth';
      animateClose();
      return;
    }
    Haptics.selectionAsync();
    setErrorMessage(null);
    setInfoMessage(null);
    setPage('account');
  }, [animateClose, hasSwiftUIForm, initialPage, isNativeSheet, page]);

  useEffect(() => {
    if (visible) {
      progress.value = 1;
      progress.value = withSpring(0, spring);
    } else {
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    onDragStart: clearPendingPostClose,
    collapseRatio: 0.45,
  });

  const backdropPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    onDragStart: clearPendingPostClose,
    collapseRatio: 0.45,
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - progress.value)),
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  const segmentPillStyle = useAnimatedStyle(() => {
    const pillW = Math.max(0, (segmentTrackWidth - 8) / 2);
    return {
      width: pillW,
      opacity: segmentTrackWidth > 0 ? 1 : 0,
      transform: [{ translateX: segmentProgress.value * pillW }],
    };
  }, [segmentTrackWidth]);

  const formShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: formShakeX.value }],
  }));

  if (!visible) return null;

  const triggerFormShake = () => {
    formShakeX.value = withSequence(
      withTiming(-7, { duration: 48 }),
      withTiming(7, { duration: 48 }),
      withTiming(-5, { duration: 44 }),
      withTiming(5, { duration: 44 }),
      withTiming(0, { duration: 40 }),
    );
  };

  const switchMode = (nextMode: AuthMode) => {
    Haptics.selectionAsync();
    setErrorMessage(null);
    setInfoMessage(null);
    setMode(nextMode);
  };

  const displayAuthError = (err: any) => {
    const message = String(err?.message || '');
    if (message === 'auth_cancelled') return;
    if (message === 'sync_conflict') setErrorMessage(t.authSyncConflictError);
    else if (message === 'local_backup_failed') setErrorMessage(t.authLocalBackupError);
    else if (message === 'recovery_unavailable') setErrorMessage(t.authRecoveryUnavailable);
    else if (message === 'verification_unavailable') setErrorMessage(t.authVerificationUnavailable);
    else if (message === 'password_too_short') setErrorMessage(t.authErrorRegisterPasswordLength);
    else if (message === 'invalid_credentials') setErrorMessage(t.authErrorInvalidCredentials);
    else if (message === 'email_exists') setErrorMessage(t.authErrorEmailExists);
    else if (message === 'invalid_name') setErrorMessage(t.authErrorInvalidName);
    else if (message === 'invalid_email') setErrorMessage(t.authErrorEmailRequired);
    else if (message === 'weak_password') setErrorMessage(t.authErrorWeakPassword);
    else if (message === 'account_suspended') setErrorMessage(t.authErrorAccountSuspended);
    else if (message === 'auth_failed' || message === 'invalid_sync_data' || message === 'email_request_failed' || message === 'account_refresh_failed') {
      setErrorMessage(t.authErrorGeneric);
    } else if (message.startsWith('rate_limited:')) {
      setErrorMessage(t.authRateLimitedError.replace('{secs}', message.split(':')[1] || '60'));
    } else setErrorMessage(message === 'sync_unavailable' ? t.authErrorNetwork : message || t.authErrorNetwork);
  };

  const handleEmailAction = async (action: 'recovery' | 'verification' | 'refresh') => {
    if (emailAction || submitting || isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    if (action === 'recovery' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage(t.authErrorEmailRequired);
      return;
    }
    const request = ++accountActionRef.current;
    setEmailAction(action);
    Keyboard.dismiss();
    try {
      let message: string;
      if (action === 'recovery') {
        await requestPasswordRecovery(cleanEmail);
        message = t.authRecoveryRequested;
      } else if (action === 'verification') {
        await requestEmailVerification();
        message = t.authVerificationRequested;
      } else {
        const refreshedUser = await refreshUser();
        message = refreshedUser.emailVerified ? t.authEmailVerified : t.authVerificationPending;
      }
      if (request !== accountActionRef.current) return;
      setInfoMessage(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (request !== accountActionRef.current || err?.message === 'auth_cancelled') return;
      // Keep transport/server details out of this bilingual email flow.
      if (['recovery_unavailable', 'verification_unavailable'].includes(err?.message) ||
        String(err?.message).startsWith('rate_limited:')) displayAuthError(err);
      else setErrorMessage(t.authErrorNetwork);
    } finally {
      if (request === accountActionRef.current) setEmailAction(null);
    }
  };

  const handleSubmit = async () => {
    if (submitting || isLoading) return;
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage(t.authErrorEmailRequired);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerFormShake();
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setErrorMessage(t.authErrorInvalidName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerFormShake();
      return;
    }
    if (!password || (mode === 'register' && password.length < 8)) {
      setErrorMessage(mode === 'register' ? t.authErrorRegisterPasswordLength : t.authErrorPasswordRequired);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerFormShake();
      return;
    }

    setSubmitting(true);
    setShowPassword(false);
    try {
      if (mode === 'login') {
        await signIn(trimmedEmail, password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPassword('');
      } else if (mode === 'register') {
        await register(name.trim(), trimmedEmail, password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPassword('');

      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      displayAuthError(err);
      triggerFormShake();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !profileNameDraft.trim() || submitting) return;
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      setSubmitting(true);
      await updateProfileName(profileNameDraft.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInfoMessage(t.authProfileSaved);
    } catch (err: any) {
      displayAuthError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSyncConflict = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const runResolution = async (strategy: 'local' | 'cloud') => {
      setErrorMessage(null);
      setInfoMessage(null);
      try {
        await resolveSyncConflict(strategy);
        setInfoMessage(t.authSyncResumed);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        displayAuthError(err);
      }
    };
    Alert.alert(t.authSyncConflictTitle, t.authSyncConflictPrompt, [
      {
        text: t.authSyncKeepLocal,
        onPress: () => {
          void runResolution('local');
        },
      },
      {
        text: t.authSyncUseCloud,
        onPress: () => {
          void runResolution('cloud');
        },
      },
      { text: t.cancel, style: 'cancel' },
    ]);
  };

  const handleConfirmDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t.authDeleteConfirmTitle, t.authDeleteConfirmBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            animateClose();
          } catch (err: any) {
            displayAuthError(err);
          }
        },
      },
    ]);
  };

  const openExternalLink = async (url: string) => {
    setLinkError(false);
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: theme.background,
        controlsColor: theme.primary,
      });
    } catch {
      setLinkError(true);
    }
  };

  // ── Share Sub-Page Handlers ───────────────────────────────────────────────
  const inviteTitle = t.appShareElBuenPastorHymnalOfficialApp;
  const inviteBody = t.appSharePraiseGodWhereverYouAreDownload;
  const fullShareMessage = `${inviteBody}\n\n${SMART_APP_URL}`;

  const handleShareMessages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareStatusMessage(null);
    try {
      await Share.share(
        isIOS
          ? { title: inviteTitle, message: inviteBody, url: SMART_APP_URL }
          : { title: inviteTitle, message: fullShareMessage },
        { dialogTitle: inviteTitle }
      );
    } catch {
      setShareStatusMessage(
        t.appShareCouldNotOpenTheShareMenu
      );
    }
  };

  const handleShareWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const waText = encodeURIComponent(fullShareMessage);
    Linking.openURL(`https://wa.me/?text=${waText}`).catch(() => {});
  };

  const handleSharePromoImage = async () => {
    if (sharingImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareStatusMessage(null);
    setSharingImage(true);
    try {
      const assetModule = shareTab === 'qr' ? APP_SMART_QR : APP_SHARE_BANNER;
      const [asset] = await Asset.loadAsync(assetModule);
      const localUri = asset.localUri || asset.uri;
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: inviteTitle,
        });
      } else {
        await handleShareMessages();
      }
    } catch {
      setShareStatusMessage(
        t.appShareCouldNotShareTheImagePlease
      );
    } finally {
      setSharingImage(false);
    }
  };

  const handleCopyShareLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(SMART_APP_URL);
    setShareStatusMessage(
      t.shareLinkCopied
    );
  };

  // ── Titles & Helpers ──────────────────────────────────────────────────────
  const pageTitles: Record<SheetPage, string> = {
    account: user
      ? t.authAccountTitle
      : mode === 'recovery'
      ? t.authResetPasswordTitle
      : mode === 'register'
      ? t.authCreateAccount
      : t.authSignIn,
    'profile-details': t.accountAccountDetails,
    ministry: t.profileMinistry,
    choir: t.profileChoir,
    'church-location': t.profileMyChurch,
    blocks: t.profileBlocked,
    friends: t.friendsTitle,
    notifications: t.notificationsTitle,
    moderation: t.profileModeration,
    'share-app': t.accountShareApp,
    help: t.accountHelp,
  };

  const initials = user
    ? user.initials || computeUserInitials(user.displayName, user.email)
    : computeUserInitials(name, email);

  const statsLabel = t.authStatsSummary
    .replace('{favs}', String(favoriteIds.length))
    .replace('{lists}', String(playlists.length));

  const prominentFill = theme.primary;
  const prominentInk = theme.onPrimary;
  const cardBg = isNativeGlassSheet
    ? isDarkMode
      ? 'rgba(255,255,255,0.085)'
      : 'rgba(255,255,255,0.58)'
    : isDarkMode
      ? '#222225'
      : '#FFFFFF';
  const cardBorder = isNativeGlassSheet
    ? isDarkMode
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(255,255,255,0.74)'
    : isDarkMode
      ? 'rgba(255,255,255,0.08)'
      : theme.outlineVariant + '50';
  const iconTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.58)' : theme.onSurfaceVariant;
  const dividerColor = isNativeGlassSheet
    ? isDarkMode
      ? 'rgba(255,255,255,0.11)'
      : 'rgba(60,48,42,0.11)'
    : isDarkMode
      ? 'rgba(255,255,255,0.09)'
      : theme.outlineVariant;
  const groupRadiusStyle = isNativeSheet ? styles.nativeGlassGroup : undefined;

  const renderMenuRow = (
    label: string,
    iosIcon: React.ComponentProps<typeof AppMenuIcon>['ios'],
    androidIcon: React.ComponentProps<typeof AppMenuIcon>['android'],
    onPress: () => void,
    rightValue?: string
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: theme.primary + '15' }}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D' },
      ]}
    >
      <AppMenuIcon
        ios={iosIcon}
        android={androidIcon}
        color={iconTint}
        size={21}
        containerSize={24}
        weight="medium"
      />
      <Text
        numberOfLines={1}
        style={[
          styles.actionRowTitle,
          { color: theme.onSurface, flex: rightValue ? undefined : 1, flexShrink: 0 },
        ]}
      >
        {label}
      </Text>
      {!!rightValue && (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            flex: 1,
            textAlign: 'right',
            ...fonts.sansRegular,
            fontSize: 15,
            color: mutedText,
          }}
        >
          {rightValue}
        </Text>
      )}
      <AppMenuIcon
        ios="chevron.right"
        android="chevron-right"
        color={mutedText}
        size={13}
        weight="semibold"
      />
    </Pressable>
  );

  // Unified App Menu section — crisp single-line iOS Settings rows
  const renderUnifiedAppMenuSection = () => (
    <View
      style={[
        styles.group,
        groupRadiusStyle,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {!user && (
        <>
          {renderMenuRow(
            t.profileChurches,
            'map',
            'map',
            () => {
              pendingPostCloseRef.current = 'churches';
              animateClose();
            },
            t.profileMap
          )}
          <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
        </>
      )}
      {renderMenuRow(
        t.accountScanQrCode,
        'qrcode.viewfinder',
        'qr-code-scanner',
        () => {
          pendingPostCloseRef.current = 'scan-qr';
          animateClose();
        }
      )}
      <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
      {renderMenuRow(
        t.tabSettings || (t.tabSettings),
        'gearshape',
        'settings',
        () => {
          pendingPostCloseRef.current = 'settings';
          animateClose();
        }
      )}
      <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
      {renderMenuRow(
        t.accountShareApp,
        'square.and.arrow.up',
        'share',
        () => {
          if (onOpenShareApp) {
            pendingPostCloseRef.current = 'share-app';
            animateClose();
          } else {
            goSubPage('share-app');
          }
        }
      )}
      <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
      {renderMenuRow(
        t.accountHelp,
        'questionmark.circle',
        'help-outline',
        () => goSubPage('help')
      )}
    </View>
  );

  const renderProfileDetailsSubPage = () => {
    if (!user) return null;
    const ministryLabel =
      (user.ministry &&
        (MINISTRIES as Record<string, [string, string]>)[user.ministry]?.[es ? 0 : 1]) ||
      (t.accountNotSet);
    const choirLabel =
      (user.choir && choirDisplayName(user.choir, es, choirsBySlug)) ||
      (t.accountNotSet);
    const churchLabel = (user.churchName ? churchDisplayName(user.churchName) : '') || (t.accountNotSet);
    const locationLabel = user.location || (t.accountNotSet);
    const visibilityLabel = user.showChurchLocation
      ? t.accountVisible
      : t.accountHidden;

    const detailRow = (
      label: string,
      value: string,
      onPress: () => void,
    ) => (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionRow,
          pressed && {
            backgroundColor: isDarkMode
              ? 'rgba(255,255,255,0.06)'
              : theme.primary + '0D',
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.actionRowTitle, { color: theme.onSurface, flexShrink: 0 }]}
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            flex: 1,
            textAlign: 'right',
            ...fonts.sansRegular,
            fontSize: 15,
            color: mutedText,
          }}
        >
          {value}
        </Text>
        <AppMenuIcon
          ios="chevron.right"
          android="chevron-right"
          color={mutedText}
          size={13}
          weight="semibold"
        />
      </Pressable>
    );

    return (
      <>
        {/* Clean iOS Apple ID-Style Compact Hero */}
        <View style={{ alignItems: 'center', paddingVertical: 6, gap: 6 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                ...fonts.sansBold,
                fontSize: 23,
                color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                letterSpacing: 0.4,
              }}
            >
              {initials}
            </Text>
          </View>
          <Text
            style={{
              ...fonts.bold,
              fontSize: 21,
              color: theme.onSurface,
              textAlign: 'center',
            }}
          >
            {user.displayName || user.email.split('@')[0]}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                ...fonts.sansRegular,
                fontSize: 13.5,
                color: mutedText,
              }}
            >
              {user.email}
            </Text>
            {user.emailVerified && (
              <AppMenuIcon
                ios="checkmark.seal.fill"
                android="verified"
                color="#34C759"
                size={15}
              />
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${friendsLists.friends.length} ${t.friendsCountLabel}`}
            onPress={() => goSubPage('friends')}
            style={({ pressed }) => ({ marginTop: 7, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.09)' : theme.surfaceVariants.containerLow, borderWidth: StyleSheet.hairlineWidth, borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : theme.outlineVariant, opacity: pressed ? 0.72 : 1 })}
          >
            <Text style={{ ...fonts.sansBold, fontSize: 15, color: theme.onSurface }}>{friendsLists.friends.length}</Text>
            <Text style={{ ...fonts.sansMedium, fontSize: 13.5, color: mutedText }}>{t.friendsCountLabel}</Text>
            <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={11} />
          </Pressable>
        </View>

        {/* Name Edit Card */}
        <View
          style={[
            styles.group,
            groupRadiusStyle,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              paddingVertical: 6,
            },
          ]}
        >
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: mutedText }]}>
              {t.authNameLabel}
            </Text>
            <View style={styles.inlineEditRow}>
              <TextInput
                value={profileNameDraft}
                onChangeText={setProfileNameDraft}
                placeholder={t.authNamePlaceholder}
                placeholderTextColor={mutedText}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                style={[
                  styles.textInput,
                  styles.inlineTextInput,
                  {
                    color: theme.onSurface,
                    backgroundColor: isNativeGlassSheet
                      ? isDarkMode
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(255,255,255,0.68)'
                      : isDarkMode
                        ? '#141416'
                        : theme.surfaceVariants.containerLowest,
                    borderColor: cardBorder,
                  },
                ]}
              />
              {profileNameDraft.trim() !== (user.displayName || '').trim() && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.authSaveProfile}
                  disabled={submitting || isLoading || !!emailAction}
                  onPress={handleSaveName}
                  style={({ pressed }) => [
                    styles.inlineSaveButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.inlineSaveText, { color: theme.onPrimary }]}>
                    {t.done}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Simple iOS Profile Summary Card (Ministry, Choir, Church, Location) */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              ...fonts.sansSemiBold,
              fontSize: 12,
              letterSpacing: 0.9,
              color: mutedText,
              paddingHorizontal: 14,
            }}
          >
            {t.accountProfileDetails}
          </Text>
          <View
            style={[
              styles.group,
              groupRadiusStyle,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {detailRow(t.profileMinistry, ministryLabel, () => goSubPage('ministry'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(t.profileChoir, choirLabel, () => goSubPage('choir'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(t.profileChurch, churchLabel, () => goSubPage('church-location'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(t.accountLocation, locationLabel, () => goSubPage('church-location'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(t.accountPublicProfile, visibilityLabel, () => goSubPage('church-location'))}
          </View>
        </View>

        {/* Compact Cloud & Verification Card */}
        <View
          style={[
            styles.group,
            groupRadiusStyle,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.actionRow}>
            <Text
              numberOfLines={1}
              style={[styles.actionRowTitle, { color: theme.onSurface, flexShrink: 0 }]}
            >
              {t.accountStatus}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                textAlign: 'right',
                ...fonts.sansRegular,
                fontSize: 14.5,
                color: mutedText,
              }}
            >
              {user.emailVerified
                ? `${t.accountVerified} · ${statsLabel}`
                : t.accountUnverified}
            </Text>
          </View>
          {!user.emailVerified && (
            <>
              <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.authSendVerification}
                disabled={!!emailAction || submitting || isLoading}
                onPress={() => handleEmailAction('verification')}
                style={({ pressed }) => [styles.actionRow, { opacity: emailAction || submitting || isLoading ? 0.65 : pressed ? 0.85 : 1 }]}
              >
                <AppMenuIcon ios="envelope" android="mail-outline" color={iconTint} size={21} containerSize={24} />
                <Text style={[styles.actionRowTitle, { color: theme.onSurface, flex: 1 }]}>
                  {t.authSendVerification}
                </Text>
                {emailAction === 'verification' && <ActivityIndicator size="small" color={theme.primary} />}
              </Pressable>
              <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.authRefreshVerification}
                disabled={!!emailAction || submitting || isLoading}
                onPress={() => handleEmailAction('refresh')}
                style={({ pressed }) => [styles.actionRow, { opacity: emailAction || submitting || isLoading ? 0.65 : pressed ? 0.85 : 1 }]}
              >
                <AppMenuIcon ios="arrow.clockwise" android="refresh" color={iconTint} size={21} containerSize={24} />
                <Text style={[styles.actionRowTitle, { color: theme.onSurface, flex: 1 }]}>
                  {t.authRefreshVerification}
                </Text>
                {emailAction === 'refresh' && <ActivityIndicator size="small" color={theme.primary} />}
              </Pressable>
            </>
          )}
        </View>

        {!!infoMessage && (
          <Text accessibilityLiveRegion="polite" style={[styles.infoBanner, { color: theme.primary }]}>
            {infoMessage}
          </Text>
        )}
        {!!errorMessage && (
          <Text accessibilityLiveRegion="polite" style={[styles.errorBanner, { color: '#D64545' }]}>
            {errorMessage}
          </Text>
        )}
      </>
    );
  };

  const renderSignedInAccountSection = () => {
    if (!user) return null;
    return (
      <>
        {/* Apple Books Compact Contained Account Pill — opens full-screen /my-profile */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${user.displayName || user.email}, ${t.myProfileTitle}`}
          onPress={() => {
            pendingPostCloseRef.current = 'my-profile';
            animateClose();
          }}
          style={({ pressed }) => [
            styles.group,
            groupRadiusStyle,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.22)' : theme.primary + '38',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                ...fonts.sansBold,
                fontSize: 18,
                color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                letterSpacing: 0.4,
              }}
            >
              {initials}
            </Text>
            {(friendsBadge > 0 || notificationsUnread > 0) && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 11,
                  height: 11,
                  borderRadius: 5.5,
                  backgroundColor: '#D64545',
                  borderWidth: 2,
                  borderColor: cardBg,
                }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              numberOfLines={1}
              style={{
                ...fonts.sansMedium,
                fontSize: 17,
                color: theme.onSurface,
              }}
            >
              {user.displayName || user.email.split('@')[0]}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...fonts.sansRegular,
                fontSize: 13.5,
                color: mutedText,
              }}
            >
              {user.email}
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

        {!user.emailVerified && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              pendingPostCloseRef.current = 'my-profile';
              animateClose();
            }}
            style={[
              styles.group,
              groupRadiusStyle,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                paddingHorizontal: 18,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              },
            ]}
          >
            <AppMenuIcon ios="envelope.badge" android="mark-email-unread" color={theme.primary} size={22} />
            <Text style={{ flex: 1, color: theme.onSurface, ...fonts.sansMedium, fontSize: 14.5 }}>
              {t.authEmailUnverified}
            </Text>
            <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={14} />
          </Pressable>
        )}

        {/* Standalone Sync Now Pill */}
        <View
          style={[
            styles.group,
            groupRadiusStyle,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authSyncNow}
            onPress={async () => {
              Haptics.selectionAsync();
              setErrorMessage(null);
              setInfoMessage(null);
              if (syncBlocked) {
                handleResolveSyncConflict();
                return;
              }
              try {
                await syncNow();
              } catch (err: any) {
                displayAuthError(err);
                if (err?.message === 'sync_conflict') {
                  handleResolveSyncConflict();
                }
              }
            }}
            disabled={isSyncing}
            android_ripple={{ color: theme.primary + '15' }}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D' },
            ]}
          >
            <AppMenuIcon
              ios="arrow.clockwise.icloud"
              android="sync"
              color={iconTint}
              size={21}
              containerSize={24}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[styles.actionRowTitle, { color: theme.onSurface, flexShrink: 0 }]}
            >
              {t.accountSync}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                textAlign: 'right',
                ...fonts.sansRegular,
                fontSize: 15,
                color: mutedText,
              }}
            >
              {isSyncing
                ? t.authSyncingStatus
                : syncBlocked
                  ? t.accountPaused
                  : t.accountSynced}
            </Text>
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={mutedText}
                size={13}
                weight="semibold"
              />
            )}
          </Pressable>
        </View>

        {!!infoMessage && (
          <Text accessibilityLiveRegion="polite" style={[styles.infoBanner, { color: theme.primary }]}>
            {infoMessage}
          </Text>
        )}
        {!!errorMessage && (
          <Text accessibilityLiveRegion="polite" style={[styles.errorBanner, { color: '#D64545' }]}>
            {errorMessage}
          </Text>
        )}

        {/* Unified App Menu Section (Help) */}
        {renderUnifiedAppMenuSection()}

        {/* Sign Out & Delete Account */}
        <View
          style={[
            styles.group,
            groupRadiusStyle,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authSignOut}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              try {
                await signOut();
                pendingPostCloseRef.current = null;
                dismissingNativeRef.current = true;
                onClose();
                router.dismissTo('/(tabs)/home');
              } catch (err: any) {
                displayAuthError(err);
              }
            }}
            android_ripple={{ color: theme.primary + '15' }}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D' },
            ]}
          >
            <AppMenuIcon
              ios="rectangle.portrait.and.arrow.right"
              android="logout"
              color={iconTint}
              size={24}
              containerSize={26}
              weight="medium"
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                {t.authSignOut}
              </Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authDeleteAccount}
            onPress={handleConfirmDeleteAccount}
            android_ripple={{ color: '#D6454520' }}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: '#D6454512' },
            ]}
          >
            <AppMenuIcon ios="trash" android="delete-outline" color="#D64545" size={24} containerSize={26} weight="medium" />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: '#D64545' }]}>
                {t.authDeleteAccount}
              </Text>
            </View>
          </Pressable>
        </View>
      </>
    );
  };

  const renderSignedOutAccountSection = () => {
    const strength = mode === 'register' ? getPasswordStrength(password) : 0;
    const strengthColor =
      strength === 1 ? '#D64545' : strength === 2 ? '#C98A1C' : '#2E9E56';
    const strengthLabel =
      strength === 1
        ? t.authPasswordWeak
        : strength === 2
          ? t.authPasswordGood
          : t.authPasswordStrong;
    const cardStroke = isDarkMode ? 'rgba(255,255,255,0.12)' : theme.outlineVariant + '55';

    return (
      <>
        <Text style={[styles.leadSubtitle, { color: theme.onSurfaceVariant }]}>
          {mode === 'recovery' ? t.authRecoveryHelp : t.authSyncSubtitle}
        </Text>

        {mode !== 'recovery' && (
          isIOS ? (
            <View style={{ marginBottom: 4 }}>
              <LiquidGlassSegmented
                compact
                value={mode === 'register' ? 'register' : 'login'}
                onChange={(next) => {
                  if (!submitting && !isLoading) switchMode(next);
                }}
                items={[
                  { key: 'login', label: t.authSignIn },
                  { key: 'register', label: t.authCreateAccount },
                ]}
              />
            </View>
          ) : (
            <View
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - segmentTrackWidth) > 0.5) {
                  setSegmentTrackWidth(w);
                }
              }}
              style={[
                styles.segmentedBar,
                {
                  backgroundColor: theme.surfaceVariants.containerLow,
                  borderColor: cardStroke,
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentSlidingPill,
                  { backgroundColor: theme.primary },
                  segmentPillStyle,
                ]}
              />
              {(['login', 'register'] as const).map((tab) => {
                const active = mode === tab;
                const label = tab === 'login' ? t.authSignIn : t.authCreateAccount;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    disabled={submitting || isLoading}
                    onPress={() => switchMode(tab)}
                    style={[
                      styles.segmentButton,
                      segmentTrackWidth === 0 && active && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        { color: active ? theme.onPrimary : theme.onSurfaceVariant },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )
        )}

        {/* Auth Form Card */}
        {isNativeSheet ? (
          <Animated.View style={[styles.nativeFormBlock, formShakeStyle]}>
            <View
              style={[
                styles.group,
                styles.nativeGlassGroup,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              {mode === 'register' && (
                <AnimatedField
                  ref={nameInputRef}
                  grouped
                  label={t.authNameLabel}
                  value={name}
                  onChangeText={setName}
                  placeholder={t.authNamePlaceholder}
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              )}

              <AnimatedField
                ref={emailInputRef}
                grouped
                isLast={mode === 'recovery'}
                label={t.authEmailLabel}
                value={email}
                onChangeText={setEmail}
                placeholder={t.authEmailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                editable={!emailAction && !submitting}
                returnKeyType={mode === 'recovery' ? 'send' : 'next'}
                blurOnSubmit={mode === 'recovery'}
                onSubmitEditing={
                  mode === 'recovery'
                    ? () => handleEmailAction('recovery')
                    : () => passwordInputRef.current?.focus()
                }
              />

              {mode !== 'recovery' && (
                <AnimatedField
                  ref={passwordInputRef}
                  grouped
                  isLast
                  label={t.authPasswordLabel}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    mode === 'register'
                      ? t.authRegisterPasswordPlaceholder
                      : t.authLoginPasswordPlaceholder
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  rightElement={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? t.authHidePassword : t.authShowPassword}
                      hitSlop={8}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowPassword((prev) => !prev);
                      }}
                      style={styles.passwordEyeBtn}
                    >
                      <AppMenuIcon
                        ios={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                        android={showPassword ? 'visibility-off' : 'visibility'}
                        color={theme.onSurfaceVariant}
                        size={20}
                      />
                    </Pressable>
                  }
                />
              )}
            </View>

            {mode === 'register' && strength > 0 && (
              <View style={[styles.strengthRow, { paddingHorizontal: 10 }]} accessibilityLiveRegion="polite">
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            strength >= step
                              ? strengthColor
                              : isDarkMode
                                ? 'rgba(255,255,255,0.16)'
                                : theme.outlineVariant + '60',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
            )}

            {!!errorMessage && (
              <Text accessibilityLiveRegion="polite" style={[styles.errorBanner, { color: '#D64545' }]}>
                {errorMessage}
              </Text>
            )}
            {!!infoMessage && (
              <Text accessibilityLiveRegion="polite" style={[styles.infoBanner, { color: theme.primary }]}>
                {infoMessage}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'recovery'
                  ? t.authSendRecovery
                  : mode === 'register'
                    ? t.authSubmitRegister
                    : t.authSubmitSignIn
              }
              disabled={submitting || isLoading || !!emailAction}
              onPress={mode === 'recovery' ? () => handleEmailAction('recovery') : handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.nativePrimaryButton,
                {
                  backgroundColor: prominentFill,
                  opacity: submitting || emailAction ? 0.65 : pressed ? 0.86 : 1,
                },
              ]}
            >
              {submitting || emailAction ? (
                <ActivityIndicator size="small" color={prominentInk} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: prominentInk }]}>
                  {mode === 'recovery'
                    ? t.authSendRecovery
                    : mode === 'register'
                      ? t.authSubmitRegister
                      : t.authSubmitSignIn}
                </Text>
              )}
            </Pressable>

            {mode === 'register' && (
              <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant, paddingTop: 2 }]}>
                {t.authRegisterLegalPrefix}
                <Text
                  onPress={() => void openExternalLink('https://himnarioebp.com/terms.html')}
                  style={{ color: theme.primary, ...fonts.sansSemiBold }}
                >
                  {t.authTermsLink}
                </Text>
                {t.authLegalAnd}
                <Text
                  onPress={() => void openExternalLink('https://himnarioebp.com/privacy.html')}
                  style={{ color: theme.primary, ...fonts.sansSemiBold }}
                >
                  {t.authPrivacyLink}
                </Text>
                .
              </Text>
            )}

            {(mode === 'login' || mode === 'recovery') && (
              <View style={styles.secondaryLinksRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting || isLoading}
                  onPress={() => {
                    Keyboard.dismiss();
                    setPassword('');
                    setShowPassword(false);
                    setErrorMessage(null);
                    switchMode(mode === 'recovery' ? 'login' : 'recovery');
                  }}
                  style={styles.textLinkHit}
                >
                  <Text style={[styles.textLinkLabel, { color: theme.primary }]}>
                    {mode === 'recovery' ? t.authBackToSignIn : t.authForgotPassword}
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.group,
              styles.authFormCard,
              {
                backgroundColor: isIOS
                  ? isDarkMode
                    ? 'rgba(255,255,255,0.09)'
                    : 'rgba(255,255,255,0.72)'
                  : theme.surfaceVariants.containerLow,
                borderColor: isIOS
                  ? isDarkMode
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(255,255,255,0.88)'
                  : cardStroke,
              },
              formShakeStyle,
            ]}
          >
            {mode === 'register' && (
              <AnimatedField
                ref={nameInputRef}
                label={t.authNameLabel}
                value={name}
                onChangeText={setName}
                placeholder={t.authNamePlaceholder}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            )}

            <AnimatedField
              ref={emailInputRef}
              label={t.authEmailLabel}
              value={email}
              onChangeText={setEmail}
              placeholder={t.authEmailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              editable={!emailAction && !submitting}
              returnKeyType={mode === 'recovery' ? 'send' : 'next'}
              blurOnSubmit={mode === 'recovery'}
              onSubmitEditing={
                mode === 'recovery'
                  ? () => handleEmailAction('recovery')
                  : () => passwordInputRef.current?.focus()
              }
            />

            {mode !== 'recovery' && (
              <View style={styles.passwordFieldBlock}>
                <AnimatedField
                  ref={passwordInputRef}
                  label={t.authPasswordLabel}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    mode === 'register'
                      ? t.authRegisterPasswordPlaceholder
                      : t.authLoginPasswordPlaceholder
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  rightElement={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? t.authHidePassword : t.authShowPassword}
                      hitSlop={8}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowPassword((prev) => !prev);
                      }}
                      style={styles.passwordEyeBtn}
                    >
                      <AppMenuIcon
                        ios={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                        android={showPassword ? 'visibility-off' : 'visibility'}
                        color={theme.onSurfaceVariant}
                        size={20}
                      />
                    </Pressable>
                  }
                />

                {mode === 'register' && strength > 0 && (
                  <View style={styles.strengthRow} accessibilityLiveRegion="polite">
                    <View style={styles.strengthBars}>
                      {[1, 2, 3].map((step) => (
                        <View
                          key={step}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                strength >= step
                                  ? strengthColor
                                  : isDarkMode
                                    ? 'rgba(255,255,255,0.14)'
                                    : theme.outlineVariant + '60',
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                      {strengthLabel}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!!errorMessage && (
              <Text accessibilityLiveRegion="polite" style={[styles.errorBanner, { color: '#D64545' }]}>
                {errorMessage}
              </Text>
            )}
            {!!infoMessage && (
              <Text accessibilityLiveRegion="polite" style={[styles.infoBanner, { color: theme.primary }]}>
                {infoMessage}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'recovery'
                  ? t.authSendRecovery
                  : mode === 'register'
                    ? t.authSubmitRegister
                    : t.authSubmitSignIn
              }
              disabled={submitting || isLoading || !!emailAction}
              onPress={mode === 'recovery' ? () => handleEmailAction('recovery') : handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: submitting || emailAction ? 0.65 : pressed ? 0.88 : 1,
                },
              ]}
            >
              {submitting || emailAction ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>
                  {mode === 'recovery'
                    ? t.authSendRecovery
                    : mode === 'register'
                      ? t.authSubmitRegister
                      : t.authSubmitSignIn}
                </Text>
              )}
            </Pressable>

            {mode === 'register' && (
              <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant, paddingTop: 2 }]}>
                {t.authRegisterLegalPrefix}
                <Text
                  onPress={() => void openExternalLink('https://himnarioebp.com/terms.html')}
                  style={{ color: theme.primary, ...fonts.sansSemiBold }}
                >
                  {t.authTermsLink}
                </Text>
                {t.authLegalAnd}
                <Text
                  onPress={() => void openExternalLink('https://himnarioebp.com/privacy.html')}
                  style={{ color: theme.primary, ...fonts.sansSemiBold }}
                >
                  {t.authPrivacyLink}
                </Text>
                .
              </Text>
            )}

            {(mode === 'login' || mode === 'recovery') && (
              <View style={styles.secondaryLinksRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting || isLoading}
                  onPress={() => {
                    Keyboard.dismiss();
                    setPassword('');
                    setShowPassword(false);
                    setErrorMessage(null);
                    switchMode(mode === 'recovery' ? 'login' : 'recovery');
                  }}
                  style={styles.textLinkHit}
                >
                  <Text style={[styles.textLinkLabel, { color: theme.primary }]}>
                    {mode === 'recovery' ? t.authBackToSignIn : t.authForgotPassword}
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

        <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant }]}>
          {t.authOptionalNote}
        </Text>

        {/* Unified App Menu Section (Share App, Settings, Help, History) */}
        {renderUnifiedAppMenuSection()}
      </>
    );
  };

  // ── Sub-Page: Consejos y Ayuda ───────────────────────────────────────────
  const renderHelpSubPage = () => (
    <>
      <Text style={[styles.leadSubtitle, { color: theme.onSurfaceVariant }]}>
        {t.homeMenuHelpIntro}
      </Text>
      {t.homeMenuTips.map((tip, index) => (
        <View
          key={tip.title}
          style={[
            styles.tipRow,
            { borderBottomColor: theme.outlineVariant + '60' },
          ]}
        >
          <View
            style={[
              styles.tipNumber,
              { backgroundColor: theme.surfaceVariants.container },
            ]}
          >
            <Text style={[styles.tipNumberText, { color: theme.primary }]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.actionRowTextWrap}>
            <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
              {tip.title}
            </Text>
            <Text style={[styles.tipBody, { color: theme.onSurfaceVariant }]}>
              {tip.body}
            </Text>
          </View>
        </View>
      ))}
      <View
        style={[
          styles.feedbackCard,
          groupRadiusStyle,
          {
            backgroundColor: isNativeGlassSheet ? cardBg : theme.surfaceVariants.containerLow,
            borderColor: isNativeGlassSheet ? cardBorder : 'transparent',
            borderWidth: isNativeGlassSheet ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <AppMenuIcon
          ios="bubble.left.and.bubble.right"
          android="chat-bubble-outline"
          color={theme.primary}
          size={24}
        />
        <Text style={[styles.feedbackTitle, { color: theme.onSurface }]}>
          {t.homeMenuFeedback}
        </Text>
        <Text style={[styles.tipBody, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuFeedbackSub}
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openExternalLink(FEEDBACK_URL)}
          style={({ pressed }) => [
            styles.feedbackPrimaryBtn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>
            {t.homeMenuOpenFeedback}
          </Text>
          <AppMenuIcon
            ios="arrow.up.right"
            android="open-in-new"
            color={theme.onPrimary}
            size={17}
          />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openExternalLink('https://himnarioebp.com/')}
          style={styles.webLink}
        >
          <Text style={[styles.textLinkLabel, { color: theme.primary }]}>
            {t.homeMenuOpenWebsite}
          </Text>
        </Pressable>
      </View>
      {linkError && (
        <Text
          accessibilityRole="alert"
          style={[styles.errorBanner, { color: theme.primary }]}
        >
          {t.homeMenuLinkError}
        </Text>
      )}
    </>
  );

  const renderPageContent = () => {
    switch (page) {
      case 'profile-details':
        return renderProfileDetailsSubPage();
      case 'ministry':
      case 'choir':
      case 'church-location':
      case 'blocks':
      case 'friends':
      case 'notifications':
      case 'moderation':
        return (
          <CommunityProfile
            subPage={page}
            onBack={handleBackOrClose}
            onOpenHymn={(hymnId) => {
              pendingHymnIdRef.current = hymnId;
              pendingPostCloseRef.current = 'hymn';
              animateClose();
            }}
            onOpenMember={(memberId) => {
              pendingMemberIdRef.current = memberId;
              pendingPostCloseRef.current = 'member';
              animateClose();
            }}
            onOpenChurchesMap={() => {
              pendingPostCloseRef.current = 'churches';
              animateClose();
            }}
            onNotificationNavigate={(destination) => {
              if (destination.kind === 'friends') {
                goSubPage('friends');
              } else if (destination.kind === 'hymn') {
                pendingHymnIdRef.current = destination.hymnId;
                pendingPostCloseRef.current = 'hymn';
                animateClose();
              } else {
                pendingPostCloseRef.current = 'home';
                animateClose();
              }
            }}
          />
        );
      case 'share-app':
        return <AppShareContent embedded />;
      case 'help':
        return renderHelpSubPage();
      case 'account':
      default:
        return user
          ? renderSignedInAccountSection()
          : renderSignedOutAccountSection();
    }
  };

  const topSafeLimit = insets.top + 12;
  const availableHeight =
    keyboardHeight > 0
      ? windowHeight - keyboardHeight - topSafeLimit
      : windowHeight * 0.92;
  const sheetMaxHeight = Math.max(300, Math.min(availableHeight, 840));
  const sheetBg = isDarkMode ? '#141416' : '#F6F3EC';
  const glassIconColor = isDarkMode ? '#FFFFFF' : theme.onSurface;
  const isSignedOutLogin = page === 'account' && !user;
  const authHeaderTitle = isSignedOutLogin
    ? mode === 'register'
      ? t.authCreateAccount
      : mode === 'recovery'
        ? t.authForgotPassword
        : t.authSignIn
    : pageTitles[page];
  const submitActionLabel =
    mode === 'recovery'
      ? t.authSendRecovery
      : mode === 'register'
        ? t.authSubmitRegister
        : t.authSubmitSignIn;
  const submitActionIcon =
    mode === 'recovery'
      ? 'paperplane.fill'
      : mode === 'register'
        ? 'person.badge.plus'
        : 'key.fill';
  const plainToolbarTint = isDarkMode ? '#FFFFFF' : '#1C1C18';

  if (isSwiftUISheet) {
    if (!hasSwiftUIForm) return null;
    return (
      <AuthSheetSwiftUI
        presentation="bottom-sheet"
        isPresented={visible}
        onDismiss={handleSwiftUIDismiss}
        isDarkMode={isDarkMode}
        user={user}
        initials={initials}
        mode={mode}
        name={name}
        email={email}
        password={password}
        showPassword={showPassword}
        submitting={submitting}
        isLoading={isLoading}
        emailAction={emailAction}
        isSyncing={isSyncing}
        syncBlocked={syncBlocked}
        friendsBadge={friendsBadge}
        notificationsUnread={notificationsUnread}
        errorMessage={errorMessage}
        infoMessage={infoMessage}
        onChangeMode={(next) => {
          Keyboard.dismiss();
          if (next === 'recovery' || mode === 'recovery') {
            setPassword('');
            setShowPassword(false);
          }
          switchMode(next);
        }}
        onChangeName={setName}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onToggleShowPassword={() => {
          Haptics.selectionAsync();
          setShowPassword((prev) => !prev);
        }}
        onSubmitAuth={() => {
          void handleSubmit();
        }}
        onSendRecovery={() => {
          void handleEmailAction('recovery');
        }}
        onClose={animateClose}
        onOpenMyProfile={() => {
          pendingPostCloseRef.current = 'my-profile';
          animateClose();
        }}
        onSyncNow={() => {
          Haptics.selectionAsync();
          setErrorMessage(null);
          setInfoMessage(null);
          if (syncBlocked) {
            handleResolveSyncConflict();
            return;
          }
          void (async () => {
            try {
              await syncNow();
            } catch (err: any) {
              displayAuthError(err);
              if (err?.message === 'sync_conflict') {
                handleResolveSyncConflict();
              }
            }
          })();
        }}
        onOpenChurches={() => {
          pendingPostCloseRef.current = 'churches';
          animateClose();
        }}
        onOpenScanQr={() => {
          pendingPostCloseRef.current = 'scan-qr';
          animateClose();
        }}
        onOpenSettings={() => {
          pendingPostCloseRef.current = 'settings';
          animateClose();
        }}
        onOpenShareApp={() => {
          if (onOpenShareApp) {
            pendingPostCloseRef.current = 'share-app';
            animateClose();
          } else {
            pendingPostCloseRef.current = 'share-app-page';
            animateClose();
          }
        }}
        onOpenHelp={() => {
          pendingPostCloseRef.current = 'help-page';
          animateClose();
        }}
        onOpenTerms={() => {
          void openExternalLink('https://himnarioebp.com/terms.html');
        }}
        onOpenPrivacy={() => {
          void openExternalLink('https://himnarioebp.com/privacy.html');
        }}
        onSignOut={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          void (async () => {
            try {
              await signOut();
              pendingPostCloseRef.current = 'home';
              animateClose();
            } catch (err: any) {
              displayAuthError(err);
            }
          })();
        }}
        onDeleteAccount={handleConfirmDeleteAccount}
      />
    );
  }

  if (isNativeSheet) {
    if (page === 'account' && hasSwiftUIForm) {
      return (
        <AuthSheetSwiftUI
          isDarkMode={isDarkMode}
          user={user}
          initials={initials}
          mode={mode}
          name={name}
          email={email}
          password={password}
          showPassword={showPassword}
          submitting={submitting}
          isLoading={isLoading}
          emailAction={emailAction}
          isSyncing={isSyncing}
          syncBlocked={syncBlocked}
          friendsBadge={friendsBadge}
          notificationsUnread={notificationsUnread}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          onChangeMode={(next) => {
            Keyboard.dismiss();
            if (next === 'recovery' || mode === 'recovery') {
              setPassword('');
              setShowPassword(false);
            }
            switchMode(next);
          }}
          onChangeName={setName}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onToggleShowPassword={() => {
            Haptics.selectionAsync();
            setShowPassword((prev) => !prev);
          }}
          onSubmitAuth={() => {
            void handleSubmit();
          }}
          onSendRecovery={() => {
            void handleEmailAction('recovery');
          }}
          onClose={animateClose}
          onOpenMyProfile={() => {
            pendingPostCloseRef.current = 'my-profile';
            animateClose();
          }}
          onSyncNow={() => {
            Haptics.selectionAsync();
            setErrorMessage(null);
            setInfoMessage(null);
            if (syncBlocked) {
              handleResolveSyncConflict();
              return;
            }
            void (async () => {
              try {
                await syncNow();
              } catch (err: any) {
                displayAuthError(err);
                if (err?.message === 'sync_conflict') {
                  handleResolveSyncConflict();
                }
              }
            })();
          }}
          onOpenChurches={() => {
            pendingPostCloseRef.current = 'churches';
            animateClose();
          }}
          onOpenScanQr={() => {
            pendingPostCloseRef.current = 'scan-qr';
            animateClose();
          }}
          onOpenSettings={() => {
            pendingPostCloseRef.current = 'settings';
            animateClose();
          }}
          onOpenShareApp={() => {
            if (onOpenShareApp) {
              pendingPostCloseRef.current = 'share-app';
              animateClose();
            } else {
              goSubPage('share-app');
            }
          }}
          onOpenHelp={() => goSubPage('help')}
          onOpenTerms={() => {
            void openExternalLink('https://himnarioebp.com/terms.html');
          }}
          onOpenPrivacy={() => {
            void openExternalLink('https://himnarioebp.com/privacy.html');
          }}
          onSignOut={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void (async () => {
              try {
                await signOut();
                pendingPostCloseRef.current = null;
                dismissingNativeRef.current = true;
                onClose();
                router.dismissTo('/(tabs)/home');
              } catch (err: any) {
                displayAuthError(err);
              }
            })();
          }}
          onDeleteAccount={handleConfirmDeleteAccount}
        />
      );
    }

    return (
      <View
        style={[
          styles.nativeSheetScroll,
          { backgroundColor: isNativeGlassSheet ? 'transparent' : sheetBg },
        ]}
      >
        {/* Clean Liquid Glass sheet header aligned with the grabber for sub-pages & pre-SwiftUI fallback */}
        <View style={styles.nativeSubHeader}>
          {page !== 'account' ? (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={56}
              style={styles.glassCircleBtn}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.homeMenuBack}
                onPress={handleBackOrClose}
                style={styles.glassCircleHit}
              >
                <AppMenuIcon
                  ios="chevron.left"
                  android="arrow-back"
                  color={plainToolbarTint}
                  size={17}
                  weight="semibold"
                />
              </Pressable>
            </GlassSurface>
          ) : (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={56}
              style={styles.glassCancelPill}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSignedOutLogin ? t.authCancel : t.close}
                onPress={animateClose}
                style={({ pressed }) => [styles.glassCancelHit, pressed && { opacity: 0.72 }]}
              >
                <Text style={[styles.glassCancelText, { color: plainToolbarTint }]}>
                  {isSignedOutLogin ? t.authCancel : t.close}
                </Text>
              </Pressable>
            </GlassSurface>
          )}

          <Text
            numberOfLines={1}
            style={[styles.nativeSubHeaderTitle, { color: plainToolbarTint }]}
          >
            {authHeaderTitle}
          </Text>

          {page === 'account' && isSignedOutLogin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={submitActionLabel}
              disabled={submitting || isLoading || !!emailAction}
              onPress={mode === 'recovery' ? () => handleEmailAction('recovery') : handleSubmit}
              style={({ pressed }) => [
                styles.headerActionCircle,
                {
                  backgroundColor: prominentFill,
                  opacity: submitting || emailAction ? 0.65 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {submitting || emailAction ? (
                <ActivityIndicator size="small" color={prominentInk} />
              ) : (
                <AppMenuIcon
                  ios={submitActionIcon}
                  android="vpn-key"
                  color={prominentInk}
                  size={18}
                  weight="semibold"
                />
              )}
            </Pressable>
          ) : page !== 'account' ? (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={56}
              style={styles.glassCancelPill}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.close}
                onPress={animateClose}
                style={({ pressed }) => [styles.glassCancelHit, pressed && { opacity: 0.72 }]}
              >
                <Text style={[styles.glassCancelText, { color: plainToolbarTint }]}>
                  {t.close}
                </Text>
              </Pressable>
            </GlassSurface>
          ) : (
            <View style={styles.glassCircleSpacer} />
          )}
        </View>

        <ScrollView
          key={page}
          style={styles.nativeSheetScroll}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={[
            styles.nativeScrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 18 },
          ]}
        >
          <Animated.View
            key={page}
            entering={page === 'account' ? FadeInLeft.duration(170) : FadeInRight.duration(190)}
            style={styles.nativeSheetBody}
          >
            {renderPageContent()}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  const headerBar = (
    <View style={[styles.header, isIOS && { paddingTop: 16, paddingBottom: 10, paddingHorizontal: 18 }]}>
      {page !== 'account' ? (
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={56}
          style={styles.glassCircleBtn}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.homeMenuBack}
            onPress={handleBackOrClose}
            style={styles.glassCircleHit}
          >
            <AppMenuIcon
              ios="chevron.left"
              android="arrow-back"
              color={glassIconColor}
              size={18}
              weight="semibold"
            />
          </Pressable>
        </GlassSurface>
      ) : isSignedOutLogin ? (
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={56}
          style={styles.glassCancelPill}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authCancel}
            onPress={animateClose}
            style={({ pressed }) => [styles.glassCancelHit, pressed && { opacity: 0.72 }]}
          >
            <Text style={[styles.glassCancelText, { color: theme.onSurface }]}>
              {t.authCancel}
            </Text>
          </Pressable>
        </GlassSurface>
      ) : (
        <View style={styles.glassCircleSpacer} />
      )}

      <Text
        numberOfLines={1}
        style={[styles.headerTitle, { color: theme.onSurface, flex: 1, textAlign: 'center', marginHorizontal: 8 }]}
      >
        {authHeaderTitle}
      </Text>

      {isSignedOutLogin ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'recovery'
              ? t.authSendRecovery
              : mode === 'register'
                ? t.authSubmitRegister
                : t.authSubmitSignIn
          }
          disabled={submitting || isLoading || !!emailAction}
          onPress={mode === 'recovery' ? () => handleEmailAction('recovery') : handleSubmit}
          style={({ pressed }) => [
            styles.headerActionCircle,
            {
              backgroundColor: prominentFill,
              opacity: submitting || emailAction ? 0.65 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {submitting || emailAction ? (
            <ActivityIndicator size="small" color={prominentInk} />
          ) : (
            <AppMenuIcon
              ios={
                mode === 'recovery'
                  ? 'paperplane.fill'
                  : mode === 'register'
                    ? 'person.badge.plus'
                    : 'key.fill'
              }
              android={
                mode === 'recovery'
                  ? 'send'
                  : mode === 'register'
                    ? 'person-add'
                    : 'vpn-key'
              }
              color={prominentInk}
              size={18}
              weight="semibold"
            />
          )}
        </Pressable>
      ) : (
        <GlassSurface
          isInteractive
          glassEffectStyle="regular"
          intensity={56}
          style={styles.glassCircleBtn}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.close}
            onPress={animateClose}
            style={styles.glassCircleHit}
          >
            <AppMenuIcon
              ios="xmark"
              android="close"
              color={glassIconColor}
              size={17}
              weight="semibold"
            />
          </Pressable>
        </GlassSurface>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleBackOrClose}
    >
      <GestureHandlerRootView
        style={styles.overlay}
        onAccessibilityEscape={animateClose}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={isIOS ? 'padding' : undefined}
        >
          <GestureDetector gesture={backdropPan}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(0,0,0,0.58)'
                    : 'rgba(20,16,12,0.38)',
                },
                backdropStyle,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.close}
                style={StyleSheet.absoluteFill}
                onPress={animateClose}
              />
            </Animated.View>
          </GestureDetector>

          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SheetGrabber />
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: isIOS ? 'transparent' : sheetBg,
                  borderColor: isIOS
                    ? isDarkMode
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(255,255,255,0.58)'
                    : 'transparent',
                  borderWidth: isIOS ? StyleSheet.hairlineWidth : 0,
                  maxHeight: sheetMaxHeight,
                  marginBottom: !isIOS && keyboardHeight > 0 ? keyboardHeight : 0,
                  paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 18),
                  overflow: 'hidden',
                },
              ]}
            >
              {isIOS ? (
                <GlassSurface
                  glassEffectStyle="regular"
                  intensity={76}
                  style={styles.iosSheetGlassBg}
                />
              ) : null}
              <GestureDetector gesture={pan}>
                <View style={styles.dragZone}>
                  {!isIOS && (
                    <View style={styles.handleWrap}>
                      <View style={styles.handle} />
                    </View>
                  )}
                  {headerBar}
                </View>
              </GestureDetector>

              <ScrollView
                key={page}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={isIOS ? 'interactive' : 'on-drag'}
                contentContainerStyle={styles.scrollContent}
              >
                <Animated.View
                  key={page}
                  entering={page === 'account' ? FadeInLeft.duration(170) : FadeInRight.duration(190)}
                  style={{ gap: 14 }}
                >
                  {renderPageContent()}
                </Animated.View>
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    borderCurve: 'continuous',
  },
  iosSheetGlassBg: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  glassCancelPill: {
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCancelHit: {
    height: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCancelText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  headerActionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dragZone: {
    width: '100%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    opacity: 0.45,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircleHit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircleSpacer: {
    width: 40,
    height: 40,
  },
  headerSpacer: {
    minWidth: 40,
  },
  headerLeftButton: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerRightButton: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...fonts.bold,
    fontSize: 19,
  },
  doneText: {
    ...fonts.sansBold,
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  nativeSheetScroll: {
    flex: 1,
  },
  nativeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 10,
  },
  nativeSubHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nativeScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  nativeSheetBody: {
    gap: 14,
  },
  nativeGlassGroup: {
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  nativeFormBlock: {
    gap: 12,
  },
  nativePrimaryButton: {
    borderRadius: 999,
    minHeight: 52,
    borderCurve: 'continuous',
  },
  leadSubtitle: {
    ...fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  segmentedBar: {
    flexDirection: 'row',
    position: 'relative',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  segmentSlidingPill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 10,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentButtonText: {
    ...fonts.sansSemiBold,
    fontSize: 14,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  authFormCard: {
    padding: 14,
    gap: 11,
  },
  passwordFieldBlock: {
    gap: 7,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  inputLabel: {
    ...fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  textInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    ...fonts.sansRegular,
    fontSize: 16,
  },
  passwordInputWrap: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 4,
  },
  passwordTextInput: {
    flex: 1,
    minHeight: 46,
    ...fonts.sansRegular,
    fontSize: 16,
  },
  passwordEyeBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineTextInput: {
    flex: 1,
  },
  inlineSaveButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSaveText: {
    ...fonts.sansBold,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...fonts.sansBold,
    fontSize: 15,
  },
  secondaryLinksRow: {
    alignItems: 'center',
    paddingTop: 2,
  },
  textLinkHit: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textLinkLabel: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
  errorBanner: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  infoBanner: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  optionalCaption: {
    ...fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  profileHeroCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  largeAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  largeAvatarInitials: {
    ...fonts.sansBold,
    fontSize: 27,
    letterSpacing: 0.6,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  profileHeroName: {
    ...fonts.semiBold,
    fontSize: 22,
    textAlign: 'center',
  },
  profileHeroEmail: {
    ...fonts.sansRegular,
    fontSize: 14,
    textAlign: 'center',
  },
  syncPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  syncPillText: {
    ...fonts.sansSemiBold,
    fontSize: 12,
  },
  actionRow: {
    minHeight: 49,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  actionRowTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionRowTitle: {
    ...fonts.sansRegular,
    fontSize: 16.5,
  },
  actionRowSub: {
    ...fonts.sansRegular,
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  subSectionLabel: {
    ...fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  fontControlBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fontHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fontTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fontPreviewCanvas: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fontPreviewTitle: {
    ...fonts.boldItalic,
    fontSize: 18,
    textAlign: 'center',
  },
  fontPreviewText: {
    ...fonts.regular,
    textAlign: 'center',
  },
  fontSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fontSlider: {
    flex: 1,
    height: 38,
  },
  fontCircleStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fontResetText: {
    ...fonts.sansSemiBold,
    fontSize: 12,
  },
  languageRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  languageOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageText: {
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipNumberText: {
    ...fonts.sansBold,
    fontSize: 13,
  },
  tipBody: {
    ...fonts.sansRegular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  feedbackCard: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  feedbackTitle: {
    ...fonts.semiBold,
    fontSize: 18,
  },
  feedbackPrimaryBtn: {
    marginTop: 4,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  webLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  // Share sub-page styles
  shareSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  shareSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  shareSegmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shareBannerCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  shareBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  shareBannerDomain: {
    ...fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  shareBannerTitle: {
    ...fonts.sansSemiBold,
    fontSize: 13,
    marginTop: 1,
  },
  shareQrCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    alignSelf: 'center',
  },
  shareQrImageWrap: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shareQrTitle: {
    ...fonts.bold,
    fontSize: 17,
    marginTop: 4,
  },
  shareQrSubtitle: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 310,
  },
  shareStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareStatusText: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
  shareOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    overflow: 'hidden',
  },
  shareOptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
