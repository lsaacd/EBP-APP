import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { fonts } from '../../theme/theme';
import { useCommunityApi, communityError } from '../../utils/communityApi';
import {
  memberSinceLabel,
  parseFriendFavorites,
  parseFriendStatus,
  type ChurchMemberProfile,
} from '../../utils/friends';
import { useFriends } from '../../utils/friendsStore';
import {
  buildInitialMemberProfile,
  loadCachedMemberProfile,
  parsePublicFriendsResponse,
  saveCachedMemberProfile,
  seedMemberPreview,
  type CachedMemberProfile,
} from '../../utils/memberProfileCache';
import { MINISTRIES, choirDisplayName } from '../../data/communityRules';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { churchDisplayName } from '../../utils/churchName';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import GlassSurface from '../../components/GlassSurface';
import AppMenuIcon from '../../components/AppMenuIcon';
import FriendButton from '../../components/FriendButton';
import * as Haptics from '../../utils/haptics';

type ProfileTab = 'friends' | 'favorites';

const SEGMENT_SPRING = {
  damping: 26,
  stiffness: 290,
  mass: 0.9,
};

export default function MemberProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const memberId = typeof params.id === 'string' ? params.id.trim() : '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user, openAuthSheet } = useAuth();
  const { currentHymnId } = useNowPlaying();
  const api = useCommunityApi();
  const { refresh: refreshFriendsStore } = useFriends();
  const { bySlug: choirsBySlug } = useApprovedChoirs();

  const es = language !== 'en';
  const isIOS = Platform.OS === 'ios';

  const [profile, setProfile] = useState<CachedMemberProfile | null>(() =>
    memberId ? buildInitialMemberProfile(user?.id, memberId) : null,
  );
  const [loading, setLoading] = useState<boolean>(() => !profile);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('friends');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const segmentIndex = useSharedValue(0);
  const fetchSeqRef = useRef(0);
  const profileRef = useRef<CachedMemberProfile | null>(profile);
  profileRef.current = profile;

  const hymnById = useMemo(() => {
    const map = new Map<string, { id: string; number: string; title: string }>();
    for (const raw of [...hymnsData, ...estribillosData]) {
      const hymn = getLocalizedHymn(raw as any, hymnLanguage) as any;
      map.set(String(raw.id), {
        id: String(raw.id),
        number: String(hymn.number),
        title: String(hymn.title),
      });
    }
    return map;
  }, [hymnLanguage]);

  const switchTab = useCallback(
    (next: ProfileTab) => {
      Haptics.selectionAsync();
      setActiveTab(next);
      segmentIndex.value = withSpring(next === 'friends' ? 0 : 1, SEGMENT_SPRING);
    },
    [segmentIndex],
  );

  const loadMemberData = useCallback(
    async (isPullRefresh = false) => {
      if (!memberId) return;
      const seq = ++fetchSeqRef.current;
      if (isPullRefresh) setRefreshing(true);
      else if (!profileRef.current) setLoading(true);

      // Load AsyncStorage snapshot first if we didn't have an in-memory copy yet.
      let base = profileRef.current;
      if (!base || base.cachedAt === 0) {
        const stored = await loadCachedMemberProfile(user?.id, memberId);
        if (seq !== fetchSeqRef.current) return;
        if (stored) {
          const merged: CachedMemberProfile = base
            ? {
                ...stored,
                name: base.name || stored.name,
                initials: base.initials || stored.initials,
                friendStatus: base.friendStatus ?? stored.friendStatus,
              }
            : stored;
          base = merged;
          setProfile(merged);
          setLoading(false);
        }
      }

      try {
        const pubRes = await api<{
          user?: {
            id: string;
            name: string;
            initials?: string;
            ministry?: string | null;
            choir?: string | null;
            badgeVerified?: boolean;
            memberSince?: string | null;
            friendCount?: number;
            showFriendsList?: boolean;
            friendStatus?: unknown;
            churchId?: string | null;
            churchName?: string | null;
            location?: string | null;
          };
        }>(`/users/${encodeURIComponent(memberId)}/public-profile`);

        if (seq !== fetchSeqRef.current || !pubRes?.user) return;
        const u = pubRes.user;
        const status = parseFriendStatus(u.friendStatus);

        let friendsVisible: boolean | null = u.showFriendsList !== false;
        let friendsList: ChurchMemberProfile[] = base?.friends ?? [];
        let friendCount =
          typeof u.friendCount === 'number' ? u.friendCount : (base?.friendCount ?? 0);

        if (user) {
          try {
            const fRes = await api(`/users/${encodeURIComponent(memberId)}/friends`);
            const parsedFriends = parsePublicFriendsResponse(fRes);
            friendsVisible = parsedFriends.visible;
            friendsList = parsedFriends.friends;
            friendCount = parsedFriends.count;
          } catch {
            // Keep prior cached friends if endpoint fails transiently
          }
        }

        let favoritesShared: boolean | null = base?.favoritesShared ?? null;
        let favorites: string[] = base?.favorites ?? [];
        if (user && status === 'friends') {
          try {
            const favRes = await api(`/friends/${encodeURIComponent(memberId)}/favorites`);
            const parsedFavs = parseFriendFavorites(favRes);
            favoritesShared = parsedFavs.shared;
            favorites = parsedFavs.favorites;
          } catch {
            // Keep cached favorites if offline
          }
        } else if (status !== 'friends') {
          favoritesShared = null;
          favorites = [];
        }

        if (seq !== fetchSeqRef.current) return;

        const fresh: CachedMemberProfile = {
          id: u.id,
          name: u.name,
          initials: u.initials || base?.initials || '—',
          ministry: u.ministry ?? null,
          choir: u.choir ?? null,
          badgeVerified: Boolean(u.badgeVerified),
          memberSince: u.memberSince ?? null,
          churchId: u.churchId ?? null,
          churchName: u.churchName ?? null,
          location: u.location ?? null,
          friendCount,
          showFriendsList: u.showFriendsList !== false,
          friendStatus: status,
          favoritesShared,
          favorites,
          friendsVisible,
          friends: friendsList,
          cachedAt: Date.now(),
        };

        setOfflineMode(false);
        setProfile(fresh);
        void saveCachedMemberProfile(user?.id, fresh);
      } catch {
        if (seq !== fetchSeqRef.current) return;
        setOfflineMode(true);
      } finally {
        if (seq === fetchSeqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [api, memberId, user],
  );

  useEffect(() => {
    setActiveTab('friends');
    segmentIndex.value = 0;
    const initial = memberId ? buildInitialMemberProfile(user?.id, memberId) : null;
    setProfile(initial);
    setLoading(!initial);
    setOfflineMode(false);
    void loadMemberData(false);
  }, [loadMemberData, memberId, segmentIndex, user?.id]);

  const handleBlockMember = useCallback(() => {
    if (!user || !profile || user.id === profile.id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t.memberBlockConfirmTitle.replace('{name}', profile.name),
      t.memberBlockConfirmBody,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.memberBlockUser,
          style: 'destructive',
          onPress: () => {
            void api(`/users/${encodeURIComponent(profile.id)}/block`, 'POST', {})
              .then(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                void refreshFriendsStore();
                router.back();
              })
              .catch((e) => Alert.alert(t.churchError, communityError(e, es)));
          },
        },
      ],
    );
  }, [
    api,
    es,
    profile,
    refreshFriendsStore,
    router,
    t.cancel,
    t.churchError,
    t.memberBlockConfirmBody,
    t.memberBlockConfirmTitle,
    t.memberBlockUser,
    user,
  ]);

  const openOtherMember = useCallback(
    (person: ChurchMemberProfile) => {
      Haptics.selectionAsync();
      seedMemberPreview({
        id: person.id,
        name: person.name,
        initials: person.initials,
        ministry: person.ministry,
        choir: person.choir,
        badgeVerified: person.badgeVerified,
        memberSince: person.memberSince,
        churchId: person.churchId,
        churchName: person.churchName,
        location: person.location,
        friendStatus: person.friendStatus,
      });
      router.push(`/member/${encodeURIComponent(person.id)}` as any);
    },
    [router],
  );

  const thumbAnimStyle = useAnimatedStyle(() => {
    const half = Math.max(0, (segmentWidth - 8) / 2);
    return {
      width: half,
      opacity: segmentWidth > 0 ? 1 : 0,
      transform: [{ translateX: segmentIndex.value * half }],
    };
  }, [segmentWidth]);

  const bg = isDarkMode ? '#010101' : '#fcf9f2';
  const cardBg = isDarkMode ? '#1A1A1D' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '55';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.60)' : theme.onSurfaceVariant;
  const divider = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '60';

  const roleLine = profile
    ? [
        profile.ministry ? (MINISTRIES as Record<string, [string, string]>)[profile.ministry]?.[es ? 0 : 1] : null,
        profile.choir ? choirDisplayName(profile.choir, es, choirsBySlug) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const churchLabel = profile?.churchName ? churchDisplayName(profile.churchName) : '';
  const sinceLabel = profile?.memberSince ? memberSinceLabel(profile.memberSince, es) : '';
  const knownFavorites = useMemo(
    () =>
      (profile?.favorites ?? [])
        .map((id) => hymnById.get(id))
        .filter(Boolean) as { id: string; number: string; title: string }[],
    [hymnById, profile?.favorites],
  );

  const isSelf = Boolean(user && profile && user.id === profile.id);
  const friendCountDisplay =
    typeof profile?.friendCount === 'number' ? profile.friendCount : (profile?.friends.length ?? 0);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Top Header */}
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
            intensity={56}
            style={styles.navCircle}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.homeMenuBack}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              style={styles.navCircleHit}
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
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.homeMenuBack}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={[
              styles.navCircle,
              styles.navCircleHit,
              { backgroundColor: theme.surfaceVariants.containerHigh },
            ]}
          >
            <AppMenuIcon
              ios="chevron.left"
              android="arrow-back"
              color={theme.onSurface}
              size={19}
            />
          </Pressable>
        )}

        <Text
          numberOfLines={1}
          style={[styles.topTitle, { color: theme.onSurface }]}
        >
          {profile?.name || t.memberProfileTitle}
        </Text>

        {user && profile && !isSelf ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.memberBlockUser}
            hitSlop={8}
            onPress={handleBlockMember}
            style={[
              styles.navCircle,
              styles.navCircleHit,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : theme.surfaceVariants.containerHigh,
              },
            ]}
          >
            <AppMenuIcon
              ios="hand.raised"
              android="block"
              color={mutedText}
              size={16}
            />
          </Pressable>
        ) : (
          <View style={styles.navCircle} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadMemberData(true)}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 24) + (currentHymnId ? 84 : 20),
          },
        ]}
      >
        {offlineMode && profile ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadMemberData(true)}
            style={[
              styles.offlineBanner,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : theme.surfaceVariants.containerHigh,
                borderColor: cardBorder,
              },
            ]}
          >
            <AppMenuIcon
              ios="wifi.slash"
              android="wifi-off"
              color={mutedText}
              size={15}
            />
            <Text style={{ flex: 1, ...fonts.sansMedium, fontSize: 13, color: mutedText }}>
              {t.memberOfflineSaved}
            </Text>
            <Text style={{ ...fonts.sansSemiBold, fontSize: 13, color: theme.primary }}>
              {t.memberOfflineRetry}
            </Text>
          </Pressable>
        ) : null}

        {!profile ? (
          <View style={[styles.card, styles.centeredStateCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <AppMenuIcon ios="wifi.slash" android="wifi-off" color={mutedText} size={28} />
                <Text style={{ ...fonts.sansMedium, fontSize: 14.5, color: mutedText, textAlign: 'center' }}>
                  {t.memberOfflineNotCached}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void loadMemberData(false)}
                  style={[styles.retryPill, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: theme.onPrimary }}>
                    {t.memberOfflineRetry}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            {/* Hero Profile Card */}
            <View style={[styles.card, styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.heroAvatar, { backgroundColor: theme.primary }]}>
                <Text style={{ ...fonts.bold, fontSize: 28, color: theme.onPrimary }}>
                  {profile.initials}
                </Text>
              </View>

              <View style={styles.nameRow}>
                <Text style={[styles.heroName, { color: theme.onSurface }]}>
                  {profile.name}
                </Text>
                {profile.badgeVerified && profile.ministry === 'obispo' ? (
                  <AppMenuIcon
                    ios="checkmark.seal.fill"
                    android="verified"
                    color={theme.primary}
                    size={20}
                  />
                ) : null}
              </View>

              <Text style={[styles.heroRole, { color: mutedText }]}>
                {roleLine || t.memberCommunityMember}
              </Text>

              {/* Stats Row (Instagram-style tappable pills) */}
              <View style={styles.statsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => switchTab('friends')}
                  style={({ pressed }) => [
                    styles.statPill,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.06)'
                        : theme.surfaceVariants.containerLow,
                      borderColor: activeTab === 'friends' ? theme.primary + '55' : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.statNumber, { color: theme.onSurface }]}>
                    {friendCountDisplay}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedText }]}>
                    {t.friendsCountLabel}
                  </Text>
                </Pressable>

                {profile.friendStatus === 'friends' && profile.favoritesShared !== false ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => switchTab('favorites')}
                    style={({ pressed }) => [
                      styles.statPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.06)'
                          : theme.surfaceVariants.containerLow,
                        borderColor: activeTab === 'favorites' ? theme.primary + '55' : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.statNumber, { color: theme.onSurface }]}>
                      {knownFavorites.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>
                      {t.memberFavoritesCountLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Metadata lines (Church, Location, Member Since) */}
              {churchLabel || profile.location || sinceLabel ? (
                <View
                  style={[
                    styles.metaBox,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.04)'
                        : theme.surfaceVariants.containerLow,
                      borderColor: divider,
                    },
                  ]}
                >
                  {churchLabel ? (
                    <Pressable
                      disabled={!profile.churchId}
                      accessibilityRole={profile.churchId ? 'button' : undefined}
                      onPress={() => {
                        if (!profile.churchId) return;
                        Haptics.selectionAsync();
                        router.push(`/churches?id=${encodeURIComponent(profile.churchId)}` as any);
                      }}
                      style={styles.metaRow}
                    >
                      <AppMenuIcon
                        ios="building.columns"
                        android="account-balance"
                        color={theme.primary}
                        size={16}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          ...fonts.sansSemiBold,
                          fontSize: 14,
                          color: profile.churchId ? theme.primary : theme.onSurface,
                        }}
                      >
                        {churchLabel}
                      </Text>
                      {profile.churchId ? (
                        <AppMenuIcon
                          ios="chevron.right"
                          android="chevron-right"
                          color={mutedText}
                          size={12}
                          weight="semibold"
                        />
                      ) : null}
                    </Pressable>
                  ) : null}

                  {profile.location ? (
                    <View style={styles.metaRow}>
                      <AppMenuIcon
                        ios="mappin.and.ellipse"
                        android="place"
                        color={mutedText}
                        size={16}
                      />
                      <Text style={{ flex: 1, ...fonts.sansRegular, fontSize: 13.5, color: theme.onSurface }}>
                        {profile.location}
                      </Text>
                    </View>
                  ) : null}

                  {sinceLabel ? (
                    <View style={styles.metaRow}>
                      <AppMenuIcon
                        ios="calendar"
                        android="event"
                        color={mutedText}
                        size={15}
                      />
                      <Text style={{ flex: 1, ...fonts.sansRegular, fontSize: 13.5, color: mutedText }}>
                        {sinceLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Primary Friendship Action */}
              {!isSelf ? (
                user ? (
                  <View style={{ width: '100%', marginTop: 4 }}>
                    <FriendButton
                      userId={profile.id}
                      name={profile.name}
                      status={profile.friendStatus ?? 'none'}
                      onStatusChange={(nextStatus) => {
                        setProfile((prev) =>
                          prev ? { ...prev, friendStatus: nextStatus } : prev,
                        );
                        void loadMemberData(false);
                      }}
                    />
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      openAuthSheet();
                    }}
                    style={[styles.signInBtn, { backgroundColor: theme.primary }]}
                  >
                    <Text style={{ ...fonts.sansSemiBold, fontSize: 15, color: theme.onPrimary }}>
                      {t.friendsAdd}
                    </Text>
                  </Pressable>
                )
              ) : null}
            </View>

            {/* Liquid Glass Segmented Control: Amistades | Favoritos */}
            <View
              onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
              style={[
                styles.segmentTrack,
                {
                  backgroundColor: isIOS
                    ? 'transparent'
                    : isDarkMode
                      ? 'rgba(255,255,255,0.08)'
                      : theme.surfaceVariants.containerLow,
                  borderColor: cardBorder,
                },
              ]}
            >
              {isIOS ? (
                <GlassSurface
                  intensity={58}
                  glassEffectStyle="regular"
                  style={StyleSheet.absoluteFill}
                />
              ) : null}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentThumb,
                  isIOS
                    ? {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.16)'
                          : 'rgba(255,255,255,0.92)',
                      }
                    : { backgroundColor: cardBg },
                  thumbAnimStyle,
                ]}
              />

              {(
                [
                  ['friends', `${t.friendsTabMine} (${friendCountDisplay})`],
                  [
                    'favorites',
                    profile.friendStatus === 'friends' && profile.favoritesShared !== false
                      ? `${t.memberFavoritesCountLabel} (${knownFavorites.length})`
                      : t.memberFavoritesCountLabel,
                  ],
                ] as const
              ).map(([tabKey, tabLabel]) => {
                const selected = activeTab === tabKey;
                return (
                  <Pressable
                    key={tabKey}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => switchTab(tabKey)}
                    style={styles.segmentTab}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        ...fonts.sansSemiBold,
                        fontSize: 13.5,
                        color: selected ? theme.primary : mutedText,
                      }}
                    >
                      {tabLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Tab Content */}
            {activeTab === 'friends' ? (
              <Animated.View key="tab-friends" entering={FadeIn.duration(160)}>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  {!user ? (
                    <View style={styles.emptyBox}>
                      <AppMenuIcon ios="person.2" android="group" color={mutedText} size={26} />
                      <Text style={[styles.emptyText, { color: mutedText }]}>
                        {t.memberSignInForFriends}
                      </Text>
                    </View>
                  ) : profile.friendsVisible === false ? (
                    <View style={styles.emptyBox}>
                      <AppMenuIcon ios="lock.fill" android="lock" color={mutedText} size={22} />
                      <Text style={[styles.emptyText, { color: mutedText }]}>
                        {t.memberFriendsPrivate}
                      </Text>
                    </View>
                  ) : profile.friends.length === 0 ? (
                    <View style={styles.emptyBox}>
                      {loading ? (
                        <ActivityIndicator color={theme.primary} />
                      ) : (
                        <>
                          <AppMenuIcon ios="person.2" android="group" color={mutedText} size={26} />
                          <Text style={[styles.emptyText, { color: mutedText }]}>
                            {t.memberFriendsEmpty}
                          </Text>
                        </>
                      )}
                    </View>
                  ) : (
                    profile.friends.map((person, idx) => {
                      const pRole = [
                        person.ministry
                          ? (MINISTRIES as Record<string, [string, string]>)[person.ministry]?.[es ? 0 : 1]
                          : null,
                        person.choir ? choirDisplayName(person.choir, es, choirsBySlug) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ');
                      const pChurch = person.churchName ? churchDisplayName(person.churchName) : '';
                      const sub = [pRole, pChurch].filter(Boolean).join(' · ');
                      return (
                        <View key={person.id}>
                          {idx > 0 ? (
                            <View style={[styles.rowDivider, { backgroundColor: divider }]} />
                          ) : null}
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => openOtherMember(person)}
                            style={({ pressed }) => [
                              styles.memberRow,
                              pressed && {
                                backgroundColor: isDarkMode
                                  ? 'rgba(255,255,255,0.06)'
                                  : theme.primary + '0D',
                              },
                            ]}
                          >
                            <View style={[styles.rowAvatar, { backgroundColor: theme.primary }]}>
                              <Text style={{ ...fonts.sansBold, fontSize: 13.5, color: theme.onPrimary }}>
                                {person.initials}
                              </Text>
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    ...fonts.sansSemiBold,
                                    fontSize: 15.5,
                                    color: theme.onSurface,
                                    flexShrink: 1,
                                  }}
                                >
                                  {person.name}
                                </Text>
                                {person.badgeVerified && person.ministry === 'obispo' ? (
                                  <AppMenuIcon
                                    ios="checkmark.seal.fill"
                                    android="verified"
                                    color={theme.primary}
                                    size={14}
                                  />
                                ) : null}
                              </View>
                              {sub ? (
                                <Text
                                  numberOfLines={1}
                                  style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedText }}
                                >
                                  {sub}
                                </Text>
                              ) : null}
                            </View>
                            {person.friendStatus === 'friends' ? (
                              <View
                                style={[
                                  styles.friendChip,
                                  {
                                    backgroundColor: isDarkMode
                                      ? 'rgba(52,199,89,0.18)'
                                      : 'rgba(52,199,89,0.12)',
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    ...fonts.sansSemiBold,
                                    fontSize: 11.5,
                                    color: isDarkMode ? '#4CD964' : '#248A3D',
                                  }}
                                >
                                  {t.churchMembersBadgeFriend}
                                </Text>
                              </View>
                            ) : null}
                            <AppMenuIcon
                              ios="chevron.right"
                              android="chevron-right"
                              color={mutedText}
                              size={13}
                              weight="semibold"
                            />
                          </Pressable>
                        </View>
                      );
                    })
                  )}
                </View>
              </Animated.View>
            ) : (
              <Animated.View key="tab-favorites" entering={FadeIn.duration(160)}>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  {profile.friendStatus !== 'friends' ? (
                    <View style={styles.emptyBox}>
                      <AppMenuIcon ios="heart" android="favorite-border" color={mutedText} size={24} />
                      <Text style={[styles.emptyText, { color: mutedText }]}>
                        {t.memberFavoritesFriendsOnly}
                      </Text>
                    </View>
                  ) : profile.favoritesShared === false ? (
                    <View style={styles.emptyBox}>
                      <AppMenuIcon ios="lock.fill" android="lock" color={mutedText} size={22} />
                      <Text style={[styles.emptyText, { color: mutedText }]}>
                        {t.friendsFavoritesHidden}
                      </Text>
                    </View>
                  ) : knownFavorites.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <AppMenuIcon ios="bookmark" android="bookmark-border" color={mutedText} size={24} />
                      <Text style={[styles.emptyText, { color: mutedText }]}>
                        {t.friendsFavoritesEmpty}
                      </Text>
                    </View>
                  ) : (
                    knownFavorites.map((hymn, idx) => (
                      <View key={hymn.id}>
                        {idx > 0 ? (
                          <View style={[styles.hymnDivider, { backgroundColor: divider }]} />
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync();
                            router.push(`/hymn/${encodeURIComponent(hymn.id)}` as any);
                          }}
                          style={({ pressed }) => [
                            styles.hymnRow,
                            pressed && {
                              backgroundColor: isDarkMode
                                ? 'rgba(255,255,255,0.06)'
                                : theme.primary + '0D',
                            },
                          ]}
                        >
                          <Text style={[styles.hymnNum, { color: theme.primary }]}>
                            {hymn.number}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              ...fonts.sansMedium,
                              fontSize: 15,
                              color: theme.onSurface,
                            }}
                          >
                            {hymn.title}
                          </Text>
                          <AppMenuIcon
                            ios="chevron.right"
                            android="chevron-right"
                            color={mutedText}
                            size={13}
                            weight="semibold"
                          />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  navCircleHit: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...fonts.sansSemiBold,
    fontSize: 16.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  centeredStateCard: {
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  retryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 4,
  },
  heroCard: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  heroAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
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
  heroRole: {
    ...fonts.sansMedium,
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  statPill: {
    flex: 1,
    maxWidth: 160,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  metaBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  signInBtn: {
    width: '100%',
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  segmentTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  segmentThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentTab: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  memberRow: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
  },
  friendChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  hymnRow: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hymnNum: {
    ...fonts.sansBold,
    fontSize: 14,
    minWidth: 38,
  },
  hymnDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
