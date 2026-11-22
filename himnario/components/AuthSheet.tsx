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
import { useRouter } from 'expo-router';
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
  runOnJS,
  cancelAnimation,
  FadeInRight,
  FadeInLeft,
} from 'react-native-reanimated';
import {
  Gesture,
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
import { MINISTRIES, CHOIRS } from '../data/communityRules';
import { shouldCollapsePlayer } from '../utils/gestureMotion';

const APP_SHARE_BANNER = require('../assets/images/app-share-banner.png');
const APP_SMART_QR = require('../assets/images/ebp-smart-app-qr.png');
const IMESSAGE_ICON = require('../assets/images/imessage-brand.png');
const WHATSAPP_ICON = require('../assets/images/whatsapp-brand.png');
const FEEDBACK_URL = 'https://himnarioebp.com/feedback.html?form=audio';

type AuthMode = 'login' | 'register' | 'recovery';
type SheetPage = 'account' | 'profile-details' | 'ministry' | 'choir' | 'church-location' | 'blocks' | 'moderation' | 'share-app' | 'help';

interface AuthSheetProps {
  visible?: boolean;
  onClose?: () => void;
  onOpenShareApp?: () => void;
}

export function AuthSheet({
  visible: propVisible,
  onClose: propOnClose,
  onOpenShareApp,
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pendingPostCloseRef = useRef<'settings' | 'churches' | 'scan-qr' | 'share-app' | null>(null);

  const visible = propVisible !== undefined ? propVisible : authSheetVisible;
  const onClose = propOnClose || closeAuthSheet;
  const isIOS = Platform.OS === 'ios';
  const es = language !== 'en';

  const [page, setPage] = useState<SheetPage>('account');
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
      setErrorMessage(null);
      setInfoMessage(null);
      setSubmitting(false);
      setShowPassword(false);
    } else {
      setPage('account');
      setShareTab('banner');
      setShareStatusMessage(null);
      setSharingImage(false);
      setLinkError(false);
      setSubmitting(false);
      setShowPassword(false);
      setKeyboardHeight(0);
      pendingPostCloseRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    ++accountActionRef.current;
    setEmailAction(null);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowPassword(false);
    if (!user) {
      setPage((prev) =>
        ['profile-details', 'ministry', 'choir', 'church-location', 'blocks', 'moderation'].includes(prev)
          ? 'account'
          : prev
      );
    }
    const actionRef = accountActionRef;
    return () => { ++actionRef.current; };
  }, [mode, user]);

  useEffect(() => {
    if (!visible) return;
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
  }, [isIOS, visible]);

  const travel = Math.max(windowHeight, 560);
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const spring = {
    damping: 28,
    stiffness: 240,
    mass: 1,
    overshootClamping: true,
  };

  const finishClose = useCallback(() => {
    const nextAction = pendingPostCloseRef.current;
    pendingPostCloseRef.current = null;
    onClose();
    if (nextAction === 'settings') {
      router.navigate('/(tabs)/settings');
    } else if (nextAction === 'churches') {
      router.push((user?.churchId ? `/churches?id=${encodeURIComponent(user.churchId)}` : '/churches') as any);
    } else if (nextAction === 'scan-qr') {
      router.push('/churches?scan=1' as any);
    } else if (nextAction === 'share-app' && onOpenShareApp) {
      onOpenShareApp();
    }
  }, [onClose, onOpenShareApp, router, user?.churchId]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, progress]);

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
    Haptics.selectionAsync();
    setErrorMessage(null);
    setInfoMessage(null);
    setPage('account');
  }, [animateClose, page]);

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

  const pan = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(progress);
      dragOrigin.value = progress.value;
      runOnJS(clearPendingPostClose)();
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(1, dragOrigin.value + event.translationY / travel)
      );
    })
    .onEnd((event, success) => {
      const collapse =
        success &&
        shouldCollapsePlayer(
          progress.value * travel,
          event.velocityY,
          travel * 0.45
        );
      progress.value = withSpring(
        collapse ? 1 : 0,
        { ...spring, velocity: event.velocityY / travel },
        (finished) => {
          if (finished && collapse) runOnJS(finishClose)();
        }
      );
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  if (!visible) return null;

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
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setErrorMessage(t.authErrorInvalidName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!password || (mode === 'register' && password.length < 12)) {
      setErrorMessage(mode === 'register' ? t.authErrorRegisterPasswordLength : t.authErrorPasswordRequired);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      { text: t.authCancel, style: 'cancel' },
    ]);
  };

  const handleConfirmDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t.authDeleteConfirmTitle, t.authDeleteConfirmBody, [
      { text: t.authCancel, style: 'cancel' },
      {
        text: t.authDeleteConfirmAction,
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
  const inviteTitle = es
    ? 'Himnario El Buen Pastor — App Oficial'
    : 'El Buen Pastor Hymnal — Official App';
  const inviteBody = es
    ? 'Alaba a Dios donde estés. Descarga la aplicación oficial del Himnario El Buen Pastor (637 himnos y 124 coritos con letras y audio sin conexión):'
    : 'Praise God wherever you are. Download the official El Buen Pastor Hymnal app (637 hymns and 124 choruses with lyrics and offline audio):';
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
        es
          ? 'No se pudo abrir el menú para compartir.'
          : 'Could not open the share menu.'
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
        es
          ? 'No se pudo compartir la imagen. Intenta de nuevo.'
          : 'Could not share the image. Please try again.'
      );
    } finally {
      setSharingImage(false);
    }
  };

  const handleCopyShareLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(SMART_APP_URL);
    setShareStatusMessage(
      es ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard'
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
    'profile-details': es ? 'Cuenta y perfil' : 'Account Details',
    ministry: es ? 'Ministerio' : 'Ministry',
    choir: es ? 'Coro' : 'Choir',
    'church-location': es ? 'Mi iglesia' : 'My Church',
    blocks: es ? 'Bloqueados' : 'Blocked',
    moderation: es ? 'Moderación' : 'Moderation',
    'share-app': es ? 'Compartir app' : 'Share App',
    help: es ? 'Ayuda' : 'Help',
  };

  const initials = user
    ? user.initials || computeUserInitials(user.displayName, user.email)
    : computeUserInitials(name, email);

  const statsLabel = t.authStatsSummary
    .replace('{favs}', String(favoriteIds.length))
    .replace('{lists}', String(playlists.length));

  const cardBg = isDarkMode ? '#222225' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '50';
  const iconTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.58)' : theme.onSurfaceVariant;
  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant;

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
            fontFamily: 'PublicSans_400Regular',
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
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {!user && (
        <>
          {renderMenuRow(
            es ? 'Iglesias' : 'Churches',
            'map',
            'map',
            () => {
              pendingPostCloseRef.current = 'churches';
              animateClose();
            },
            es ? 'Mapa' : 'Map'
          )}
          <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
        </>
      )}
      {renderMenuRow(
        es ? 'Escanear código QR' : 'Scan QR Code',
        'qrcode.viewfinder',
        'qr-code-scanner',
        () => {
          pendingPostCloseRef.current = 'scan-qr';
          animateClose();
        }
      )}
      <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
      {renderMenuRow(
        t.homeMenuSettings || (es ? 'Ajustes' : 'Settings'),
        'gearshape',
        'settings',
        () => {
          pendingPostCloseRef.current = 'settings';
          animateClose();
        }
      )}
      <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 53, backgroundColor: dividerColor }} />
      {renderMenuRow(
        es ? 'Compartir app' : 'Share App',
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
        es ? 'Ayuda' : 'Help',
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
      (es ? 'Sin asignar' : 'Not set');
    const choirLabel =
      (user.choir &&
        (CHOIRS as Record<string, [string, string]>)[user.choir]?.[es ? 0 : 1]) ||
      (es ? 'Sin asignar' : 'Not set');
    const churchLabel = user.churchName || (es ? 'Sin asignar' : 'Not set');
    const locationLabel = user.location || (es ? 'Sin asignar' : 'Not set');
    const visibilityLabel = user.showChurchLocation
      ? es
        ? 'Visible'
        : 'Visible'
      : es
        ? 'Oculto'
        : 'Hidden';

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
            fontFamily: 'PublicSans_400Regular',
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
                fontFamily: 'PublicSans_700Bold',
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
              fontFamily: 'Newsreader_700Bold',
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
                fontFamily: 'PublicSans_400Regular',
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
        </View>

        {/* Name Edit Card */}
        <View
          style={[
            styles.group,
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
                    backgroundColor: isDarkMode ? '#141416' : theme.surfaceVariants.containerLowest,
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
              fontFamily: 'PublicSans_600SemiBold',
              fontSize: 12,
              letterSpacing: 0.9,
              color: mutedText,
              paddingHorizontal: 14,
            }}
          >
            {es ? 'INFORMACIÓN DE PERFIL' : 'PROFILE DETAILS'}
          </Text>
          <View
            style={[
              styles.group,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {detailRow(es ? 'Ministerio' : 'Ministry', ministryLabel, () => goSubPage('ministry'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(es ? 'Coro' : 'Choir', choirLabel, () => goSubPage('choir'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(es ? 'Iglesia' : 'Church', churchLabel, () => goSubPage('church-location'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(es ? 'Ubicación' : 'Location', locationLabel, () => goSubPage('church-location'))}
            <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: dividerColor }} />
            {detailRow(es ? 'Perfil público' : 'Public profile', visibilityLabel, () => goSubPage('church-location'))}
          </View>
        </View>

        {/* Compact Cloud & Verification Card */}
        <View
          style={[
            styles.group,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.actionRow}>
            <Text
              numberOfLines={1}
              style={[styles.actionRowTitle, { color: theme.onSurface, flexShrink: 0 }]}
            >
              {es ? 'Estado' : 'Status'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                textAlign: 'right',
                fontFamily: 'PublicSans_400Regular',
                fontSize: 14.5,
                color: mutedText,
              }}
            >
              {user.emailVerified
                ? `${es ? 'Verificado' : 'Verified'} · ${statsLabel}`
                : es
                  ? 'Sin verificar'
                  : 'Unverified'}
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
        {/* Apple Books Compact Contained Account Pill */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${user.displayName || user.email}, ${es ? 'Cuenta y perfil' : 'Account Details'}`}
          onPress={() => goSubPage('profile-details')}
          style={({ pressed }) => [
            styles.group,
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
                fontFamily: 'PublicSans_700Bold',
                fontSize: 18,
                color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                letterSpacing: 0.4,
              }}
            >
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PublicSans_500Medium',
                fontSize: 17,
                color: theme.onSurface,
              }}
            >
              {user.displayName || user.email.split('@')[0]}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PublicSans_400Regular',
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
            onPress={() => goSubPage('profile-details')}
            style={[
              styles.group,
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
            <Text style={{ flex: 1, color: theme.onSurface, fontFamily: 'PublicSans_500Medium', fontSize: 14.5 }}>
              {t.authEmailUnverified}
            </Text>
            <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={14} />
          </Pressable>
        )}

        <CommunityProfile
          onOpenSubPage={goSubPage}
          onOpenChurchesMap={() => {
            pendingPostCloseRef.current = 'churches';
            animateClose();
          }}
        />

        {/* Standalone Sync Now Pill */}
        <View
          style={[
            styles.group,
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
              {es ? 'Sincronizar' : 'Sync'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                textAlign: 'right',
                fontFamily: 'PublicSans_400Regular',
                fontSize: 15,
                color: mutedText,
              }}
            >
              {isSyncing
                ? es
                  ? 'Sincronizando…'
                  : 'Syncing…'
                : syncBlocked
                  ? es
                    ? 'En pausa'
                    : 'Paused'
                  : es
                    ? 'Sincronizado'
                    : 'Synced'}
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

  const renderSignedOutAccountSection = () => (
    <>
      <Text style={[styles.leadSubtitle, { color: theme.onSurfaceVariant }]}>
        {mode === 'recovery' ? t.authRecoveryHelp : t.authSyncSubtitle}
      </Text>
      {mode === 'login' && (
        <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant }]}>
          {t.authLoginReplaceWarning}
        </Text>
      )}

      {mode !== 'recovery' && <View
          style={[
            styles.segmentedBar,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '55',
            },
          ]}
        >
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
                  active && {
                    backgroundColor: theme.primary,
                  },
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
        </View>}

      {/* Auth Form Card */}
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.surfaceVariants.containerLow,
            borderColor: theme.outlineVariant + '50',
            paddingVertical: 14,
          },
        ]}
      >
        {mode === 'register' && (
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>
              {t.authNameLabel}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.authNamePlaceholder}
              placeholderTextColor={theme.onSurfaceVariant + '70'}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              style={[
                styles.textInput,
                {
                  color: theme.onSurface,
                  backgroundColor: theme.surfaceVariants.containerLowest,
                  borderColor: theme.outlineVariant + '60',
                },
              ]}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>
            {t.authEmailLabel}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.authEmailPlaceholder}
            placeholderTextColor={theme.onSurfaceVariant + '70'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            accessibilityLabel={t.authEmailLabel}
            editable={!emailAction && !submitting}
            returnKeyType={mode === 'recovery' ? 'send' : 'next'}
            onSubmitEditing={mode === 'recovery' ? () => handleEmailAction('recovery') : undefined}
            style={[
              styles.textInput,
              {
                color: theme.onSurface,
                backgroundColor: theme.surfaceVariants.containerLowest,
                borderColor: theme.outlineVariant + '60',
              },
            ]}
          />
        </View>

        {mode !== 'recovery' && <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>
            {t.authPasswordLabel}
          </Text>
          <View
            style={[
              styles.passwordInputWrap,
              {
                backgroundColor: theme.surfaceVariants.containerLowest,
                borderColor: theme.outlineVariant + '60',
              },
            ]}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? t.authRegisterPasswordPlaceholder : t.authLoginPasswordPlaceholder}
              placeholderTextColor={theme.onSurfaceVariant + '70'}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              autoComplete={mode === 'login' ? 'password' : 'new-password'}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={[
                styles.passwordTextInput,
                {
                  color: theme.onSurface,
                },
              ]}
            />
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
          </View>
        </View>}

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
            mode === 'recovery' ? t.authSendRecovery : mode === 'register'
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
              {mode === 'recovery' ? t.authSendRecovery : mode === 'register'
                ? t.authSubmitRegister
                : t.authSubmitSignIn}
            </Text>
          )}
        </Pressable>

        <View style={styles.secondaryLinksRow}>
          {(mode === 'login' || mode === 'recovery') && (
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
          )}

        </View>
      </View>

      <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant }]}>
        {t.authOptionalNote}
      </Text>

      {/* Unified App Menu Section (Share App, Settings, Help, History) */}
      {renderUnifiedAppMenuSection()}
    </>
  );

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
          { backgroundColor: theme.surfaceVariants.containerLow },
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
      case 'moderation':
        return (
          <CommunityProfile
            subPage={page}
            onBack={handleBackOrClose}
            onOpenChurchesMap={() => {
              pendingPostCloseRef.current = 'churches';
              animateClose();
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

  const headerBar = (
    <View style={[styles.header, isIOS && { paddingTop: 14, paddingBottom: 10, paddingHorizontal: 18 }]}>
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
      ) : (
        <View style={styles.glassCircleSpacer} />
      )}

      <Text
        numberOfLines={1}
        style={[styles.headerTitle, { color: theme.onSurface }]}
      >
        {pageTitles[page]}
      </Text>

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

          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: sheetBg,
                  maxHeight: sheetMaxHeight,
                  marginBottom: !isIOS && keyboardHeight > 0 ? keyboardHeight : 0,
                  paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 18),
                  overflow: 'hidden',
                },
              ]}
            >
              <GestureDetector gesture={pan}>
                <View style={styles.dragZone}>
                  <View style={styles.handleWrap}>
                    <View
                      style={[styles.handle, { backgroundColor: theme.outline }]}
                    />
                  </View>
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
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
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
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Newsreader_700Bold',
    fontSize: 19,
  },
  doneText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  leadSubtitle: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
  },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  inputLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  textInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 13,
  },
  primaryButton: {
    marginHorizontal: 16,
    marginTop: 10,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 15,
  },
  secondaryLinksRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  textLinkHit: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textLinkLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
  },
  errorBanner: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  infoBanner: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  optionalCaption: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 27,
    letterSpacing: 0.6,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  profileHeroName: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 22,
    textAlign: 'center',
  },
  profileHeroEmail: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16.5,
  },
  actionRowSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  subSectionLabel: {
    fontFamily: 'PublicSans_700Bold',
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
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 18,
    textAlign: 'center',
  },
  fontPreviewText: {
    fontFamily: 'Newsreader_400Regular',
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
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 13,
  },
  tipBody: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'Newsreader_600SemiBold',
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  shareBannerTitle: {
    fontFamily: 'PublicSans_600SemiBold',
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
    fontFamily: 'Newsreader_700Bold',
    fontSize: 17,
    marginTop: 4,
  },
  shareQrSubtitle: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: 'PublicSans_600SemiBold',
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
