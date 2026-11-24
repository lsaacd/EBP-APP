/**
 * MyProfileScreen (`/my-profile`) — Full-screen Profile, Community & Admin Moderation hub.
 *
 * Opened when the signed-in user taps their profile card in the Account sheet
 * (or taps their own row in another member's friends list).
 * Gives full-screen breathing room for:
 * - Hero profile card (avatar, name, email, verified ministry/choir/church, Friends & Favorites stats)
 * - Community settings: Ministry, Choir (with Admin Edit/Delete/Add), My Church, Notifications, Friends, Blocked
 * - Admin Moderation: Reports, Churches, Coros, Obispo verification (when `user.role === 'admin'`)
 * - Account Edit sub-view: Display Name, Email verification, and Delete Account
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, computeUserInitials } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useNowPlaying } from '../context/NowPlayingContext';
import { fonts } from '../theme/theme';
import { MINISTRIES, choirDisplayName } from '../data/communityRules';
import { useApprovedChoirs } from '../utils/choirsStore';
import { churchDisplayName } from '../utils/churchName';
import { useFriends } from '../utils/friendsStore';
import { useNotifications } from '../utils/notificationsStore';
import CommunityProfile, { type CommunitySubPage } from '../components/CommunityProfile';
import GlassSurface from '../components/GlassSurface';
import AppMenuIcon from '../components/AppMenuIcon';
import * as Haptics from '../utils/haptics';

type ProfileSection = 'overview' | 'account-edit' | CommunitySubPage;

const VALID_SECTIONS = new Set<string>([
  'overview',
  'account-edit',
  'ministry',
  'choir',
  'church-location',
  'blocks',
  'friends',
  'notifications',
  'moderation',
]);

export default function MyProfileScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const section: ProfileSection =
    typeof params.section === 'string' && VALID_SECTIONS.has(params.section)
      ? (params.section as ProfileSection)
      : 'overview';

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const {
    user,
    isLoading,
    updateProfileName,
    requestEmailVerification,
    refreshUser,
    deleteAccount,
  } = useAuth();
  const { favoriteIds } = useFavorites();
  const { playlists } = usePlaylists();
  const { currentHymnId } = useNowPlaying();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const { lists: friendsLists, refreshIfStale: refreshFriendsIfStale } = useFriends();
  const { refreshIfStale: refreshNotificationsIfStale } = useNotifications();

  const isIOS = Platform.OS === 'ios';
  const es = language !== 'en';

  const [nameDraft, setNameDraft] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [emailAction, setEmailAction] = useState<'verification' | 'refresh' | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openSection = (next: ProfileSection) => {
    if (next !== section) router.push(`/my-profile/${next}` as any);
  };

  useEffect(() => {
    if (user) {
      setNameDraft(user.displayName || '');
      void refreshFriendsIfStale();
      void refreshNotificationsIfStale();
    }
  }, [user, refreshFriendsIfStale, refreshNotificationsIfStale]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    setInfoMessage(null);
    setErrorMessage(null);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((section === 'overview' ? '/(tabs)/home' : '/my-profile') as any);
    }
  }, [router, section]);

  const handleSaveName = useCallback(async () => {
    if (!user) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === (user.displayName || '').trim()) return;
    setSavingName(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await updateProfileName(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInfoMessage(t.authProfileSaved);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(err?.message || t.churchError);
    } finally {
      setSavingName(false);
    }
  }, [nameDraft, t.authProfileSaved, t.churchError, updateProfileName, user]);

  const handleEmailVerification = useCallback(
    async (kind: 'verification' | 'refresh') => {
      if (!user) return;
      setEmailAction(kind);
      setErrorMessage(null);
      setInfoMessage(null);
      try {
        if (kind === 'verification') {
          await requestEmailVerification();
          setInfoMessage(t.authVerificationRequested);
        } else {
          await refreshUser();
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMessage(err?.message || t.churchError);
      } finally {
        setEmailAction(null);
      }
    },
    [refreshUser, requestEmailVerification, t.authVerificationRequested, t.churchError, user],
  );

  const handleConfirmDeleteAccount = useCallback(() => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t.authDeleteConfirmTitle, t.authDeleteConfirmBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.authDeleteAccount,
        style: 'destructive',
        onPress: () => {
          void deleteAccount().catch((err: any) => {
            Alert.alert(t.churchError, err?.message || t.churchError);
          });
        },
      },
    ]);
  }, [deleteAccount, t.authDeleteAccount, t.authDeleteConfirmBody, t.authDeleteConfirmTitle, t.cancel, t.churchError, user]);

  if (!user) {
    if (!isLoading) return null; // The root stack removes this route on sign-out.
    return (
      <View style={[styles.root, { backgroundColor: isDarkMode ? '#010101' : '#fcf9f2', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const bg = isDarkMode ? '#010101' : '#fcf9f2';
  const cardBg = isDarkMode ? '#1A1A1D' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '55';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.62)' : theme.onSurfaceVariant;
  const divider = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '60';

  const initials = user.initials || computeUserInitials(user.displayName, user.email);
  const roleParts = [
    user.ministry ? (MINISTRIES as Record<string, [string, string]>)[user.ministry]?.[es ? 0 : 1] : null,
    user.choir ? choirDisplayName(user.choir, es, choirsBySlug) : null,
  ].filter(Boolean);
  const churchLabel = user.churchName ? churchDisplayName(user.churchName) : '';
  const statsSummary = `${favoriteIds.length} ${t.tabFavorites.toLowerCase()} · ${playlists.length} ${t.playlistsTabShort.toLowerCase()}`;

  const sectionTitleMap: Record<ProfileSection, string> = {
    overview: t.myProfileTitle,
    'account-edit': t.accountProfileDetails,
    ministry: t.profileMinistry,
    choir: t.profileChoir,
    'church-location': t.profileMyChurch,
    blocks: t.profileBlocked,
    friends: t.friendsTitle,
    notifications: t.notificationsTitle,
    moderation: t.profileModeration,
  };

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: bg }]}
    >
      {/* ── Top Liquid Glass Bar ── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        {isIOS ? (
          <GlassSurface
            isInteractive
            glassEffectStyle="regular"
            intensity={58}
            style={styles.navCircle}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.homeMenuBack}
              onPress={handleBack}
              style={({ pressed }) => [styles.navCircleHit, pressed && { opacity: 0.78 }]}
            >
              <AppMenuIcon
                ios="chevron.left"
                android="arrow-back"
                color={theme.primary}
                size={21}
                containerSize={25}
                scale="large"
                weight="semibold"
              />
            </Pressable>
          </GlassSurface>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.homeMenuBack}
            onPress={handleBack}
            style={[
              styles.navCircle,
              styles.navCircleAndroid,
              styles.navCircleHit,
              { backgroundColor: theme.surfaceVariants.containerHigh },
            ]}
          >
            <AppMenuIcon
              ios="chevron.left"
              android="arrow-back"
              color={theme.primary}
              size={22}
            />
          </Pressable>
        )}

        <Text numberOfLines={1} style={[styles.topTitle, { color: theme.onSurface }]}>
          {sectionTitleMap[section]}
        </Text>

        {section === 'overview' ? (
          isIOS ? (
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={58}
              style={styles.navCircle}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.accountProfileDetails}
                onPress={() => {
                  Haptics.selectionAsync();
                  openSection('account-edit');
                }}
                style={({ pressed }) => [styles.navCircleHit, pressed && { opacity: 0.78 }]}
              >
                <AppMenuIcon
                  ios="pencil"
                  android="edit"
                  color={theme.primary}
                  size={20}
                  containerSize={24}
                  scale="large"
                  weight="semibold"
                />
              </Pressable>
            </GlassSurface>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.accountProfileDetails}
              onPress={() => {
                Haptics.selectionAsync();
                openSection('account-edit');
              }}
              style={[
                styles.navCircle,
                styles.navCircleAndroid,
                styles.navCircleHit,
                { backgroundColor: theme.surfaceVariants.containerHigh },
              ]}
            >
              <AppMenuIcon ios="pencil" android="edit" color={theme.primary} size={20} />
            </Pressable>
          )
        ) : (
          <View style={styles.navCircle} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) + (currentHymnId ? 90 : 24) },
        ]}
      >
        {section === 'overview' ? (
          <Animated.View key="my-profile-overview" entering={FadeIn.duration(160)} style={{ gap: 16 }}>
            {/* ── Hero Profile Card ── */}
            <View style={[styles.card, styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.heroAvatar, { backgroundColor: theme.primary }]}>
                <Text style={{ ...fonts.bold, fontSize: 28, color: theme.onPrimary }}>
                  {initials}
                </Text>
              </View>

              <View style={styles.nameRow}>
                <Text style={[styles.heroName, { color: theme.onSurface }]}>
                  {user.displayName || user.email.split('@')[0]}
                </Text>
                {user.badgeVerified && user.ministry === 'obispo' ? (
                  <AppMenuIcon
                    ios="checkmark.seal.fill"
                    android="verified"
                    color={theme.primary}
                    size={20}
                  />
                ) : null}
              </View>

              <View style={styles.emailRow}>
                <Text style={{ ...fonts.sansRegular, fontSize: 13.5, color: mutedText }}>
                  {user.email}
                </Text>
                {user.emailVerified && (
                  <AppMenuIcon ios="checkmark.seal.fill" android="verified" color="#34C759" size={15} />
                )}
              </View>

              {roleParts.length > 0 || churchLabel ? (
                <Text style={[styles.heroRole, { color: mutedText }]}>
                  {[...roleParts, churchLabel].filter(Boolean).join(' · ')}
                </Text>
              ) : null}

              {/* Stats Pills (Friends & Favorites) */}
              <View style={styles.statsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    openSection('friends');
                  }}
                  style={({ pressed }) => [
                    styles.statPill,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.surfaceVariants.containerLow,
                      borderColor: cardBorder,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.statNumber, { color: theme.onSurface }]}>
                    {friendsLists.friends.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedText }]}>{t.friendsCountLabel}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.navigate('/(tabs)/favorites' as any);
                  }}
                  style={({ pressed }) => [
                    styles.statPill,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.surfaceVariants.containerLow,
                      borderColor: cardBorder,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.statNumber, { color: theme.onSurface }]}>
                    {favoriteIds.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedText }]}>{t.tabFavorites}</Text>
                </Pressable>
              </View>
            </View>

            {!user.emailVerified && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  openSection('account-edit');
                }}
                style={[
                  styles.card,
                  styles.verifyBanner,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <AppMenuIcon ios="envelope.badge" android="mark-email-unread" color={theme.primary} size={22} />
                <Text style={{ flex: 1, color: theme.onSurface, ...fonts.sansMedium, fontSize: 14.5 }}>
                  {t.authEmailUnverified}
                </Text>
                <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={14} />
              </Pressable>
            )}

            {/* ── Full Community & Admin Moderation Rows ── */}
            <CommunityProfile
              onOpenSubPage={(next) => {
                Haptics.selectionAsync();
                openSection(next);
              }}
              onOpenChurchesMap={() => {
                Haptics.selectionAsync();
                router.push(
                  (user.churchId ? `/churches?id=${encodeURIComponent(user.churchId)}` : '/churches') as any,
                );
              }}
            />
          </Animated.View>
        ) : section === 'account-edit' ? (
          <Animated.View key="my-profile-edit" entering={FadeIn.duration(160)} style={{ gap: 16 }}>
            {/* Name Edit Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, padding: 16, gap: 10 }]}>
              <Text style={{ ...fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.8, color: mutedText, textTransform: 'uppercase' }}>
                {t.authNameLabel}
              </Text>
              <View style={styles.inlineEditRow}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder={t.authNamePlaceholder}
                  placeholderTextColor={mutedText}
                  autoCapitalize="words"
                  style={[
                    styles.nameInput,
                    {
                      color: theme.onSurface,
                      backgroundColor: isDarkMode ? '#121214' : theme.surfaceVariants.containerLow,
                      borderColor: cardBorder,
                    },
                  ]}
                />
                {nameDraft.trim() !== (user.displayName || '').trim() && (
                  <Pressable
                    disabled={savingName}
                    onPress={handleSaveName}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      { backgroundColor: theme.primary, opacity: savingName ? 0.6 : pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={{ ...fonts.sansSemiBold, fontSize: 14.5, color: theme.onPrimary }}>
                      {t.done}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Verification & Cloud Status */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.detailRow}>
                <Text style={{ ...fonts.sansMedium, fontSize: 15.5, color: theme.onSurface }}>
                  {t.accountStatus}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, textAlign: 'right', ...fonts.sansRegular, fontSize: 14, color: mutedText }}
                >
                  {user.emailVerified ? `${t.accountVerified} · ${statsSummary}` : t.accountUnverified}
                </Text>
              </View>

              {!user.emailVerified && (
                <>
                  <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: divider }} />
                  <Pressable
                    disabled={!!emailAction}
                    onPress={() => void handleEmailVerification('verification')}
                    style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.75 }]}
                  >
                    <AppMenuIcon ios="envelope" android="mail-outline" color={theme.primary} size={20} />
                    <Text style={{ flex: 1, ...fonts.sansMedium, fontSize: 15, color: theme.onSurface }}>
                      {t.authSendVerification}
                    </Text>
                    {emailAction === 'verification' && <ActivityIndicator size="small" color={theme.primary} />}
                  </Pressable>
                  <View style={{ height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: divider }} />
                  <Pressable
                    disabled={!!emailAction}
                    onPress={() => void handleEmailVerification('refresh')}
                    style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.75 }]}
                  >
                    <AppMenuIcon ios="arrow.clockwise" android="refresh" color={theme.primary} size={20} />
                    <Text style={{ flex: 1, ...fonts.sansMedium, fontSize: 15, color: theme.onSurface }}>
                      {t.authRefreshVerification}
                    </Text>
                    {emailAction === 'refresh' && <ActivityIndicator size="small" color={theme.primary} />}
                  </Pressable>
                </>
              )}
            </View>

            {!!infoMessage && (
              <Text style={{ ...fonts.sansMedium, fontSize: 14, color: theme.primary, textAlign: 'center' }}>
                {infoMessage}
              </Text>
            )}
            {!!errorMessage && (
              <Text style={{ ...fonts.sansMedium, fontSize: 14, color: '#D64545', textAlign: 'center' }}>
                {errorMessage}
              </Text>
            )}

            {/* Danger Zone: Delete Account */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Pressable
                accessibilityRole="button"
                onPress={handleConfirmDeleteAccount}
                style={({ pressed }) => [styles.detailRow, pressed && { backgroundColor: '#D6454514' }]}
              >
                <AppMenuIcon ios="trash" android="delete-outline" color="#D64545" size={20} />
                <Text style={{ flex: 1, ...fonts.sansMedium, fontSize: 15.5, color: '#D64545' }}>
                  {t.authDeleteAccount}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View key={`my-profile-${section}`} entering={FadeIn.duration(160)}>
            <CommunityProfile
              subPage={section}
              onBack={handleBack}
              onOpenSubPage={(next) => openSection(next)}
              onOpenChurchesMap={() => {
                router.push(
                  (user.churchId ? `/churches?id=${encodeURIComponent(user.churchId)}` : '/churches') as any,
                );
              }}
              onOpenHymn={(hymnId) => {
                router.push(`/hymn/${encodeURIComponent(hymnId)}` as any);
              }}
              onOpenMember={(memberId) => {
                router.push(`/member/${encodeURIComponent(memberId)}` as any);
              }}
              onNotificationNavigate={(dest) => {
                if (dest.kind === 'friends') {
                  openSection('friends');
                } else if (dest.kind === 'hymn') {
                  router.push(`/hymn/${encodeURIComponent(dest.hymnId)}` as any);
                }
              }}
            />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  navCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCircleAndroid: {
    overflow: 'hidden',
  },
  navCircleHit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...fonts.sansSemiBold,
    fontSize: 17,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  heroCard: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroName: {
    ...fonts.bold,
    fontSize: 23,
    textAlign: 'center',
    flexShrink: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroRole: {
    ...fonts.sansMedium,
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  statPill: {
    flex: 1,
    maxWidth: 160,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 1,
  },
  statNumber: {
    ...fonts.sansBold,
    fontSize: 17,
  },
  statLabel: {
    ...fonts.sansMedium,
    fontSize: 12,
  },
  verifyBanner: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
