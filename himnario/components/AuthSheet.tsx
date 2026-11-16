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
import { SMART_APP_URL } from './AppShareSheet';
import { shouldCollapsePlayer } from '../utils/gestureMotion';

const APP_SHARE_BANNER = require('../assets/images/app-share-banner.png');
const APP_SMART_QR = require('../assets/images/ebp-smart-app-qr.png');
const IMESSAGE_ICON = require('../assets/images/imessage-brand.png');
const WHATSAPP_ICON = require('../assets/images/whatsapp-brand.png');
const FEEDBACK_URL = 'https://himnarioebp.com/feedback.html?form=audio';

type AuthMode = 'login' | 'register' | 'recovery';
type SheetPage = 'account' | 'share' | 'settings' | 'downloads' | 'help' | 'about';

interface AuthSheetProps {
  visible?: boolean;
  onClose?: () => void;
  onOpenShareApp?: () => void;
}

export function AuthSheet({
  visible: propVisible,
  onClose: propOnClose,
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
    signOut,
    deleteAccount,
  } = useAuth();
  const { favoriteIds } = useFavorites();
  const { playlists } = usePlaylists();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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
    }
  }, [visible]);

  useEffect(() => {
    ++accountActionRef.current;
    setEmailAction(null);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowPassword(false);
    const actionRef = accountActionRef;
    return () => { ++actionRef.current; };
  }, [mode, user?.id]);

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
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, progress]);

  const goSubPage = useCallback((next: SheetPage) => {
    Haptics.selectionAsync();
    setLinkError(false);
    setShareStatusMessage(null);
    if (next === 'about') {
      setAboutParent((prev) => (prev === 'settings' ? 'settings' : 'account'));
    }
    setPage(next);
  }, []);

  const handleBackOrClose = useCallback(() => {
    if (page === 'account') {
      animateClose();
      return;
    }
    Haptics.selectionAsync();
    if (page === 'downloads') {
      setPage('settings');
    } else if (page === 'about') {
      setPage(aboutParent);
    } else {
      setPage('account');
    }
  }, [aboutParent, animateClose, page]);

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
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(1, dragOrigin.value + event.translationY / travel)
      );
    })
    .onEnd((event) => {
      const collapse = shouldCollapsePlayer(
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
    })
    .onFinalize((_event, success) => {
      if (!success) {
        progress.value = withSpring(0, spring);
      }
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
    else if (message.startsWith('rate_limited:')) {
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
    share: es ? 'Compartir Aplicación' : 'Share App',
    settings: t.homeMenuSettings,
    downloads: t.homeMenuDownloads,
    help: t.homeMenuHelp,
    about: t.homeMenuHistory,
  };

  const initials = user
    ? user.initials || computeUserInitials(user.displayName, user.email)
    : computeUserInitials(name, email);

  const statsLabel = t.authStatsSummary
    .replace('{favs}', String(favoriteIds.length))
    .replace('{lists}', String(playlists.length));

  const renderMenuRow = (
    label: string,
    iosIcon: React.ComponentProps<typeof AppMenuIcon>['ios'],
    androidIcon: React.ComponentProps<typeof AppMenuIcon>['android'],
    onPress: () => void,
    subtitle?: string
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: theme.primary + '15' }}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && { backgroundColor: theme.primary + '0D' },
      ]}
    >
      <AppMenuIcon ios={iosIcon} android={androidIcon} color={theme.primary} />
      <View style={styles.actionRowTextWrap}>
        <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
          {label}
        </Text>
        {!!subtitle && (
          <Text style={[styles.actionRowSub, { color: theme.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <AppMenuIcon
        ios="chevron.right"
        android="chevron-right"
        color={theme.outline}
        size={14}
      />
    </Pressable>
  );

  // Unified App Menu section (replaces the old ⋯ button)
  const renderUnifiedAppMenuSection = () => (
    <View
      style={[
        styles.group,
        {
          backgroundColor: theme.surfaceVariants.containerLow,
          borderColor: theme.outlineVariant + '50',
        },
      ]}
    >
      {renderMenuRow(
        t.authShareAppRow,
        'square.and.arrow.up',
        'share',
        () => goSubPage('share'),
        t.authShareAppSub
      )}
      <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
      {renderMenuRow(
        t.homeMenuSettings,
        'gearshape',
        'settings',
        () => goSubPage('settings'),
        t.homeMenuSettingsSub
      )}
      <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
      {renderMenuRow(
        t.homeMenuHelp,
        'questionmark.circle',
        'help-outline',
        () => goSubPage('help'),
        t.homeMenuHelpSub
      )}
      <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
      {renderMenuRow(
        t.homeMenuHistory,
        'clock',
        'history',
        () => {
          setAboutParent('account');
          goSubPage('about');
        },
        t.homeMenuHistorySub
      )}
    </View>
  );

  const renderSignedInAccountSection = () => {
    if (!user) return null;
    return (
      <>
        {/* Classic Himnario Profile Header Card */}
        <View
          style={[
            styles.profileHeroCard,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          <View
            style={[
              styles.largeAvatarCircle,
              {
                backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.22)' : theme.primary + '38',
              },
            ]}
          >
            <Text
              style={[
                styles.largeAvatarInitials,
                { color: isDarkMode ? '#1A1A1A' : '#FFFFFF' },
              ]}
            >
              {initials}
            </Text>
          </View>

          <Text style={[styles.profileHeroName, { color: theme.onSurface }]}>
            {user.displayName || user.email.split('@')[0]}
          </Text>
          <Text style={[styles.profileHeroEmail, { color: theme.onSurfaceVariant }]}>
            {user.email}
          </Text>

          <View
            style={[
              styles.syncPill,
              {
                backgroundColor: theme.primary + '16',
                borderColor: theme.primary + '38',
              },
            ]}
          >
            <AppMenuIcon
              ios={isSyncing ? 'arrow.triangle.2.circlepath' : syncBlocked ? 'pause.circle' : 'checkmark.icloud.fill'}
              android={isSyncing ? 'sync' : syncBlocked ? 'sync-problem' : 'cloud-done'}
              color={theme.primary}
              size={16}
            />
            <Text style={[styles.syncPillText, { color: theme.primary }]}>
              {isSyncing ? t.authSyncingStatus : syncBlocked ? t.authSyncPausedStatus : t.authSyncedStatus} · {statsLabel}
            </Text>
          </View>
        </View>

        <View style={[
          styles.group,
          { backgroundColor: theme.surfaceVariants.containerLow, borderColor: theme.outlineVariant },
        ]}>
          <View style={styles.inputContainer}>
            <Text accessibilityLiveRegion="polite" style={[styles.inputLabel, { color: theme.onSurface }]}>
              {user.emailVerified ? t.authEmailVerified : t.authEmailUnverified}
            </Text>
            {!user.emailVerified && <Text style={[styles.actionRowSub, { color: theme.onSurfaceVariant }]}>
              {t.authVerificationHelp}
            </Text>}
          </View>
          {!user.emailVerified && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.authSendVerification}
              disabled={!!emailAction || submitting || isLoading}
              onPress={() => handleEmailAction('verification')}
              style={({ pressed }) => [styles.actionRow, { opacity: emailAction || submitting || isLoading ? 0.65 : pressed ? 0.85 : 1 }]}
            >
              <AppMenuIcon ios="envelope" android="mail-outline" color={theme.primary} />
              <View style={styles.actionRowTextWrap}>
                <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>{t.authSendVerification}</Text>
              </View>
              {emailAction === 'verification' && <ActivityIndicator size="small" color={theme.primary} />}
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authRefreshVerification}
            disabled={!!emailAction || submitting || isLoading}
            onPress={() => handleEmailAction('refresh')}
            style={({ pressed }) => [styles.actionRow, { opacity: emailAction || submitting || isLoading ? 0.65 : pressed ? 0.85 : 1 }]}
          >
            <AppMenuIcon ios="arrow.clockwise" android="refresh" color={theme.primary} />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>{t.authRefreshVerification}</Text>
            </View>
            {emailAction === 'refresh' && <ActivityIndicator size="small" color={theme.primary} />}
          </Pressable>
        </View>

        {/* Display Name Edit + Sync Now Card */}
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>
              {t.authNameLabel}
            </Text>
            <View style={styles.inlineEditRow}>
              <TextInput
                value={profileNameDraft}
                onChangeText={setProfileNameDraft}
                placeholder={t.authNamePlaceholder}
                placeholderTextColor={theme.onSurfaceVariant + '70'}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                style={[
                  styles.textInput,
                  styles.inlineTextInput,
                  {
                    color: theme.onSurface,
                    backgroundColor: theme.surfaceVariants.containerLowest,
                    borderColor: theme.outlineVariant + '60',
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

          <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.authSyncNow}
            onPress={async () => {
              Haptics.selectionAsync();
              setErrorMessage(null);
              setInfoMessage(null);
              try {
                await syncNow();
              } catch (err: any) {
                displayAuthError(err);
              }
            }}
            disabled={isSyncing}
            android_ripple={{ color: theme.primary + '15' }}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && { backgroundColor: theme.primary + '0D' },
            ]}
          >
            <AppMenuIcon
              ios="arrow.clockwise.icloud"
              android="sync"
              color={theme.primary}
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                {t.authSyncNow}
              </Text>
            </View>
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={theme.outline}
                size={14}
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

        {/* Unified App Menu Section (Share App, Settings, Help, History) */}
        {renderUnifiedAppMenuSection()}

        {/* Sign Out & Delete Account */}
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
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
              pressed && { backgroundColor: theme.primary + '0D' },
            ]}
          >
            <AppMenuIcon
              ios="rectangle.portrait.and.arrow.right"
              android="logout"
              color={theme.primary}
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                {t.authSignOut}
              </Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />

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
            <AppMenuIcon ios="trash" android="delete-outline" color="#D64545" />
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

  // ── Sub-Page: Compartir Aplicación (In-Sheet, Zero Modal Collision) ──────
  const renderShareSubPage = () => {
    const cardWidth = Math.max(240, windowWidth - 40);
    const bannerHeight = Math.round((cardWidth * 630) / 1200);
    const shareOptions = [
      {
        key: 'messages',
        title: es ? 'Mensajes y más…' : 'Messages & more…',
        subtitle: es
          ? 'Compartir enlace por iMessage, SMS o redes sociales'
          : 'Share link via iMessage, SMS, or social apps',
        onPress: handleShareMessages,
        iconBg: isIOS ? 'transparent' : 'rgba(52, 199, 89, 0.16)',
        iconColor: '#34C759',
        icon: 'sms' as const,
        customImage: isIOS ? IMESSAGE_ICON : undefined,
        customImageSize: 38,
      },
      {
        key: 'whatsapp',
        title: 'WhatsApp',
        subtitle: es
          ? 'Enviar invitación con vista previa a un chat o grupo'
          : 'Send invite with preview banner to a chat or group',
        onPress: handleShareWhatsApp,
        iconBg: 'transparent',
        iconColor: '#25D366',
        customImage: WHATSAPP_ICON,
        customImageSize: 38,
      },
      {
        key: 'share-image',
        title:
          shareTab === 'qr'
            ? es
              ? 'Compartir imagen del código QR'
              : 'Share QR code image'
            : es
            ? 'Compartir tarjeta promocional'
            : 'Share promotional banner',
        subtitle: es
          ? 'Ideal para estados de WhatsApp, historias o grupos'
          : 'Great for WhatsApp Status, Stories, or church groups',
        onPress: handleSharePromoImage,
        iconBg: theme.primary + '18',
        iconColor: theme.primary,
        icon: 'image' as const,
        loading: sharingImage,
      },
      {
        key: 'copy-link',
        title: es ? 'Copiar enlace de descarga' : 'Copy download link',
        subtitle: 'himnarioebp.com/app',
        onPress: handleCopyShareLink,
        iconBg: theme.primary + '18',
        iconColor: theme.primary,
        icon: 'link' as const,
      },
    ];

    return (
      <View style={{ gap: 13 }}>
        {/* Segmented Switcher: Tarjeta | Código QR */}
        <View
          style={[
            styles.shareSegmentContainer,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(36,37,31,0.07)',
            },
          ]}
        >
          <Pressable
            style={[
              styles.shareSegmentBtn,
              shareTab === 'banner' && [
                styles.shareSegmentBtnActive,
                { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' },
              ],
            ]}
            onPress={() => {
              if (shareTab !== 'banner') {
                Haptics.selectionAsync();
                setShareTab('banner');
              }
            }}
          >
            <MaterialIcons
              name="featured-play-list"
              size={15}
              color={shareTab === 'banner' ? theme.primary : theme.onSurfaceVariant}
            />
            <Text
              style={{
                fontSize: 13,
                color: shareTab === 'banner' ? theme.onSurface : theme.onSurfaceVariant,
                fontFamily:
                  shareTab === 'banner' ? 'PublicSans_700Bold' : 'PublicSans_500Medium',
              }}
              numberOfLines={1}
            >
              {es ? 'Tarjeta' : 'Banner'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.shareSegmentBtn,
              shareTab === 'qr' && [
                styles.shareSegmentBtnActive,
                { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' },
              ],
            ]}
            onPress={() => {
              if (shareTab !== 'qr') {
                Haptics.selectionAsync();
                setShareTab('qr');
              }
            }}
          >
            <MaterialIcons
              name="qr-code-2"
              size={16}
              color={shareTab === 'qr' ? theme.primary : theme.onSurfaceVariant}
            />
            <Text
              style={{
                fontSize: 13,
                color: shareTab === 'qr' ? theme.onSurface : theme.onSurfaceVariant,
                fontFamily:
                  shareTab === 'qr' ? 'PublicSans_700Bold' : 'PublicSans_500Medium',
              }}
              numberOfLines={1}
            >
              {es ? 'Código QR' : 'In-Person QR'}
            </Text>
          </Pressable>
        </View>

        {/* Banner or QR Card */}
        {shareTab === 'banner' ? (
          <Pressable
            onPress={handleShareMessages}
            style={[
              styles.shareBannerCard,
              {
                width: cardWidth,
                backgroundColor: '#FCF9F2',
                borderColor: isDarkMode
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(110,22,25,0.14)',
              },
            ]}
          >
            <Image
              source={APP_SHARE_BANNER}
              style={{ width: cardWidth, height: bannerHeight, alignSelf: 'center' }}
              resizeMode="contain"
            />
            <View
              style={[
                styles.shareBannerFooter,
                {
                  backgroundColor: isDarkMode ? '#1C1C1E' : 'rgba(255,255,255,0.92)',
                  borderTopColor: isDarkMode
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(36,37,31,0.08)',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.shareBannerDomain, { color: theme.primary }]}
                  numberOfLines={1}
                >
                  HIMNARIOEBP.COM/APP
                </Text>
                <Text
                  style={[styles.shareBannerTitle, { color: theme.onSurface }]}
                  numberOfLines={1}
                >
                  {es
                    ? 'Disponible gratis para iPhone y Android'
                    : 'Available free for iPhone & Android'}
                </Text>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={18}
                color={theme.onSurfaceVariant}
                style={{ opacity: 0.6 }}
              />
            </View>
          </Pressable>
        ) : (
          <View
            style={[
              styles.shareQrCard,
              {
                width: cardWidth,
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(110,22,25,0.04)',
                borderColor: theme.outlineVariant + '26',
              },
            ]}
          >
            <View style={styles.shareQrImageWrap}>
              <Image
                source={APP_SMART_QR}
                style={{ width: 156, height: 156 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.shareQrTitle, { color: theme.onSurface }]}>
              {es ? 'Escanea para descargar' : 'Scan to download'}
            </Text>
            <Text style={[styles.shareQrSubtitle, { color: theme.onSurfaceVariant }]}>
              {es
                ? 'Pídele a un hermano que apunte con la cámara de su teléfono para instalar la app en iPhone o Android.'
                : 'Ask someone nearby to point their phone camera here to install on iPhone or Android.'}
            </Text>
          </View>
        )}

        {!!shareStatusMessage && (
          <View
            style={[
              styles.shareStatusBanner,
              {
                backgroundColor: theme.primary + '18',
                borderColor: theme.primary + '38',
              },
            ]}
          >
            <MaterialIcons name="check-circle" size={16} color={theme.primary} />
            <Text style={[styles.shareStatusText, { color: theme.primary }]}>
              {shareStatusMessage}
            </Text>
          </View>
        )}

        <View style={{ gap: 8 }}>
          {shareOptions.map((opt) => (
            <Pressable
              key={opt.key}
              android_ripple={{ color: theme.primary + '18' }}
              style={({ pressed }) => [
                styles.shareOptionRow,
                {
                  backgroundColor:
                    pressed && isIOS
                      ? theme.surfaceVariants.containerHighest
                      : theme.surfaceVariants.containerLowest,
                  borderColor: theme.outlineVariant + '22',
                },
              ]}
              onPress={opt.onPress}
            >
              <View style={[styles.shareOptionIconWrap, { backgroundColor: opt.iconBg }]}>
                {opt.loading ? (
                  <ActivityIndicator size="small" color={opt.iconColor} />
                ) : opt.customImage ? (
                  <Image
                    source={opt.customImage}
                    style={{
                      width: opt.customImageSize,
                      height: opt.customImageSize,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialIcons name={opt.icon!} size={22} color={opt.iconColor} />
                )}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                  {opt.title}
                </Text>
                <Text
                  style={[styles.actionRowSub, { color: theme.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {opt.subtitle}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.onSurfaceVariant}
                style={{ opacity: 0.45 }}
              />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // ── Sub-Page: Ajustes (Display, Font Size, Languages, Offline Downloads) ──
  const renderSettingsSubPage = () => {
    const pxSize = Math.round(22 * fontSizeMultiplier);
    return (
      <>
        <Text style={[styles.subSectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuDisplay}
        </Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isDarkMode }}
            accessibilityLabel={t.homeMenuDark}
            onPress={toggleTheme}
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          >
            <AppMenuIcon
              ios="circle.lefthalf.filled"
              android="contrast"
              color={theme.primary}
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                {isDarkMode ? t.homeMenuDark : t.homeMenuLight}
              </Text>
            </View>
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Switch
                value={isDarkMode}
                trackColor={{
                  false: isIOS ? (isDarkMode ? '#39393D' : '#E9E9EA') : isDarkMode ? 'rgba(255,255,255,0.20)' : theme.outlineVariant + '66',
                  true: isIOS ? '#34C759' : isDarkMode ? theme.surfaceVariants.container : theme.primary,
                }}
                thumbColor={isIOS ? undefined : isDarkMode ? '#FFFFFF' : theme.surfaceVariants.containerHighest}
                ios_backgroundColor={isDarkMode ? '#39393D' : '#E9E9EA'}
              />
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />

          {/* Full Inline Font Size Control (Live Preview + Slider + 1px Steppers) */}
          <View style={styles.fontControlBlock}>
            <View style={styles.fontHeaderRow}>
              <View style={styles.fontTitleLeft}>
                <AppMenuIcon
                  ios="textformat.size"
                  android="format-size"
                  color={theme.primary}
                />
                <Text style={[styles.actionRowTitle, { color: theme.onSurface }]}>
                  {t.fontSize} · {pxSize} px
                </Text>
              </View>
              {pxSize !== 22 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFontSizeMultiplier(1.0);
                  }}
                  style={[
                    styles.fontResetBtn,
                    { backgroundColor: theme.primary + '18' },
                  ]}
                >
                  <Text style={[styles.fontResetText, { color: theme.primary }]}>
                    {t.textSizeReset}
                  </Text>
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.fontPreviewCanvas,
                {
                  backgroundColor: theme.surfaceVariants.containerLowest,
                  borderColor: theme.outlineVariant + '26',
                },
              ]}
            >
              <Text style={[styles.fontPreviewTitle, { color: theme.primary }]}>
                ¡Cuán Grande es Él!
              </Text>
              <Text
                style={[
                  styles.fontPreviewText,
                  {
                    color: theme.onSurface,
                    fontSize: Math.min(42, pxSize),
                    lineHeight: Math.round(Math.min(42, pxSize) * 1.48),
                  },
                ]}
              >
                Señor, mi Dios, al contemplar los cielos...
              </Text>
            </View>

            <View style={styles.fontSliderRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease text size"
                onPress={() => {
                  Haptics.selectionAsync();
                  setFontSizeMultiplier((pxSize - 1) / 22);
                }}
                style={[
                  styles.fontCircleStepBtn,
                  { backgroundColor: theme.surfaceVariants.container },
                ]}
              >
                <MaterialIcons name="remove" size={20} color={theme.onSurface} />
              </Pressable>

              <Slider
                style={styles.fontSlider}
                minimumValue={12 / 22}
                maximumValue={64 / 22}
                step={1 / 22}
                value={fontSizeMultiplier}
                onValueChange={setFontSizeMultiplier}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.surfaceVariants.container}
                thumbTintColor={isIOS ? '#FFFFFF' : theme.primary}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase text size"
                onPress={() => {
                  Haptics.selectionAsync();
                  setFontSizeMultiplier((pxSize + 1) / 22);
                }}
                style={[
                  styles.fontCircleStepBtn,
                  { backgroundColor: theme.surfaceVariants.container },
                ]}
              >
                <MaterialIcons name="add" size={20} color={theme.onSurface} />
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={[styles.subSectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuAppLanguage}
        </Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          <View style={styles.languageRow}>
            {(['es', 'en'] as const).map((val) => {
              const selected = language === val;
              return (
                <Pressable
                  key={val}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLanguage(val);
                  }}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.surfaceVariants.container,
                      borderColor: selected ? theme.primary : theme.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageText,
                      { color: selected ? theme.onPrimary : theme.onSurface },
                    ]}
                  >
                    {val === 'es' ? t.spanish : t.english}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.subSectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuHymnLanguage}
        </Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          <View style={styles.languageRow}>
            {(['es', 'en'] as const).map((val) => {
              const selected = hymnLanguage === val;
              return (
                <Pressable
                  key={val}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHymnLanguage(val);
                  }}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.surfaceVariants.container,
                      borderColor: selected ? theme.primary : theme.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageText,
                      { color: selected ? theme.onPrimary : theme.onSurface },
                    ]}
                  >
                    {val === 'es' ? t.spanish : t.english}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={[styles.optionalCaption, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuLanguageHint}
        </Text>

        <Text style={[styles.subSectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.homeMenuDetails}
        </Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '50',
            },
          ]}
        >
          {renderMenuRow(
            t.homeMenuDownloads,
            'arrow.down.circle',
            'download',
            () => goSubPage('downloads'),
            t.homeMenuDownloadsSub
          )}
          <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
          {renderMenuRow(
            t.homeMenuHistory,
            'clock',
            'history',
            () => {
              setAboutParent('settings');
              goSubPage('about');
            },
            t.homeMenuHistorySub
          )}
        </View>
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
      case 'share':
        return renderShareSubPage();
      case 'settings':
        return renderSettingsSubPage();
      case 'downloads':
        return <OfflineAudioCard />;
      case 'help':
        return renderHelpSubPage();
      case 'about':
        return <AboutHymnalContent />;
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
      : windowHeight * 0.9;
  const sheetMaxHeight = Math.max(260, Math.min(availableHeight, 720));

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
            <GlassSurface
              stableBackdrop
              intensity={88}
              tonalColor={theme.surfaceVariants.containerHigh}
              style={[
                styles.sheet,
                {
                  maxHeight: sheetMaxHeight,
                  paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 18),
                },
              ]}
            >
              <GestureDetector gesture={pan}>
                <View
                  style={[
                    styles.dragZone,
                    {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: isDarkMode
                        ? 'rgba(255,255,255,0.10)'
                        : theme.outlineVariant + '55',
                    },
                  ]}
                >
                  <View style={styles.handleWrap}>
                    <View
                      style={[styles.handle, { backgroundColor: theme.outline }]}
                    />
                  </View>
                  <View style={styles.header}>
                    {page !== 'account' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.homeMenuBack}
                        onPress={handleBackOrClose}
                        style={styles.headerLeftButton}
                      >
                        <AppMenuIcon
                          ios="chevron.left"
                          android="arrow-back"
                          color={theme.primary}
                          size={18}
                        />
                        <Text style={[styles.backText, { color: theme.primary }]}>
                          {t.homeMenuBack}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.headerSpacer} />
                    )}

                    <Text
                      numberOfLines={1}
                      style={[styles.headerTitle, { color: theme.onSurface }]}
                    >
                      {pageTitles[page]}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.done}
                      onPress={animateClose}
                      style={styles.headerRightButton}
                    >
                      <Text style={[styles.doneText, { color: theme.primary }]}>
                        {t.done}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </GestureDetector>

              <ScrollView
                key={page}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={isIOS ? 'interactive' : 'on-drag'}
                contentContainerStyle={styles.scrollContent}
              >
                {renderPageContent()}
              </ScrollView>
            </GlassSurface>
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
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    minWidth: 74,
  },
  headerLeftButton: {
    minWidth: 74,
    minHeight: 40,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerRightButton: {
    minWidth: 74,
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
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 19,
  },
  doneText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
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
    borderRadius: 18,
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
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRowTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionRowTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  actionRowSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
    opacity: 0.6,
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
