import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
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
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage, categoryTranslations } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { fonts } from '../../theme/theme';
import { useCommunityApi, communityError } from '../../utils/communityApi';
import {
  memberSinceLabel,
  parseFriendFavorites,
  parseFriendStatus,
  type ChurchMemberProfile,
  type FriendStatus,
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
import { churchDisplayName, servantDisplayName } from '../../utils/churchName';
import { getNextServiceSummary, parseServiceTimes } from '../../utils/churchSchedule';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { showSuccessToast } from '../../utils/toast';
import AppMenuIcon from '../../components/AppMenuIcon';
import GlassSurface from '../../components/GlassSurface';
import UserAvatar from '../../components/UserAvatar';
import * as Haptics from '../../utils/haptics';

type ProfileTab = 'favorites' | 'friends' | 'church';
type PreviewAudience = 'friend' | 'public';

type EmbeddedChurch = {
  id: string;
  name: string;
  pastorName?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  lat: number;
  lng: number;
  serviceTimes?: string | null;
};

const ADMIN_EMAIL = 'isaacduran167@gmail.com';

export default function MemberProfileScreen() {
  const params = useLocalSearchParams<{ id?: string; preview?: string }>();
  const memberId = typeof params.id === 'string' ? params.id.trim() : '';
  const initialPreview: PreviewAudience =
    params.preview === 'public' ? 'public' : 'friend';

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user, openAuthSheet } = useAuth();
  const { favoriteIds: myFavoriteIds } = useFavorites();
  const { playlists: myPlaylists } = usePlaylists();
  const { currentHymnId } = useNowPlaying();
  const api = useCommunityApi();
  const {
    lists: myFriendsLists,
    refresh: refreshFriendsStore,
    request: sendFriendRequest,
    accept: acceptFriendRequest,
    remove: removeFriendLink,
    sendPlaylist,
  } = useFriends();
  const { bySlug: choirsBySlug } = useApprovedChoirs();

  const es = language !== 'en';
  const isIOS = Platform.OS === 'ios';
  const swiftUI = isIOS ? getExpoSwiftUI() : null;
  const isAdmin =
    user?.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL;
  const isSelf = Boolean(user && memberId && user.id === memberId);

  const [previewAs, setPreviewAs] = useState<PreviewAudience>(initialPreview);
  const [profile, setProfile] = useState<CachedMemberProfile | null>(() =>
    memberId ? buildInitialMemberProfile(user?.id, memberId) : null,
  );
  const [loading, setLoading] = useState<boolean>(() => !profile && !isSelf);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('favorites');
  const [didSetInitialTab, setDidSetInitialTab] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [friendBusy, setFriendBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);

  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [sendingPlaylistId, setSendingPlaylistId] = useState<string | null>(null);
  const [embeddedChurch, setEmbeddedChurch] = useState<EmbeddedChurch | null>(null);

  const fetchSeqRef = useRef(0);
  const profileRef = useRef<CachedMemberProfile | null>(profile);
  profileRef.current = profile;

  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const hymnById = useMemo(() => {
    const map = new Map<
      string,
      { id: string; number: string; title: string; category: string }
    >();
    for (const raw of [...hymnsData, ...estribillosData]) {
      const hymn = getLocalizedHymn(raw as any, displayHymnLang) as any;
      const rawCat = String((raw as any).category || '');
      const cat =
        displayHymnLang === 'en' && rawCat
          ? (categoryTranslations as Record<string, string>)[rawCat] || rawCat
          : rawCat;
      map.set(String(raw.id), {
        id: String(raw.id),
        number: String(hymn.number),
        title: String(hymn.title),
        category: cat,
      });
    }
    return map;
  }, [displayHymnLang]);

  const handleBackToMain = useCallback(() => {
    Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  }, [router]);

  const loadMemberData = useCallback(
    async (isPullRefresh = false) => {
      if (!memberId) return;
      const seq = ++fetchSeqRef.current;
      if (isPullRefresh) setRefreshing(true);
      else if (!profileRef.current && !isSelf) setLoading(true);

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
            avatarUrl?: string | null;
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
          typeof u.friendCount === 'number'
            ? u.friendCount
            : (base?.friendCount ?? 0);

        if (user) {
          try {
            const fRes = await api(`/users/${encodeURIComponent(memberId)}/friends`);
            const parsedFriends = parsePublicFriendsResponse(fRes);
            friendsVisible = parsedFriends.visible;
            friendsList = parsedFriends.friends;
            friendCount = parsedFriends.count;
          } catch {
            // Keep prior cached friends on transient error
          }
        }

        let favoritesShared: boolean | null = base?.favoritesShared ?? null;
        let favorites: string[] = base?.favorites ?? [];
        if (user && status === 'friends') {
          try {
            const favRes = await api(
              `/friends/${encodeURIComponent(memberId)}/favorites`,
            );
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
          avatarUrl: u.avatarUrl ?? null,
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
    [api, isSelf, memberId, user],
  );

  useEffect(() => {
    setPreviewAs(initialPreview);
    setDidSetInitialTab(false);
    setSearchOpen(false);
    setSearchQuery('');
    const initial = memberId ? buildInitialMemberProfile(user?.id, memberId) : null;
    setProfile(initial);
    setLoading(!initial && !isSelf);
    setOfflineMode(false);
    void loadMemberData(false);
  }, [initialPreview, isSelf, loadMemberData, memberId, user?.id]);

  // Build effective profile respecting live privacy toggles in "View As" self-preview mode
  const effective = useMemo(() => {
    if (isSelf && user) {
      const showChurchByPrivacy =
        previewAs === 'friend' || user.showChurchLocation === true;
      const showFavsByPrivacy =
        previewAs === 'friend' && user.shareFavoritesWithFriends !== false;
      const showFriendsByPrivacy = user.showFriendsList !== false;
      const myFriendsAsMembers: ChurchMemberProfile[] = myFriendsLists.friends.map(
        (f) => ({ ...f, friendStatus: 'friends' as const }),
      );
      return {
        id: user.id,
        name: user.displayName || user.email.split('@')[0],
        initials: user.initials || '—',
        avatarUrl: user.avatarUrl,
        ministry: user.ministry,
        choir: user.choir,
        badgeVerified: user.badgeVerified && user.ministry === 'obispo',
        memberSince: profile?.memberSince ?? null,
        churchId: showChurchByPrivacy ? user.churchId : null,
        churchName: showChurchByPrivacy ? user.churchName : null,
        location: showChurchByPrivacy ? user.location : null,
        friendStatus: (previewAs === 'friend' ? 'friends' : 'none') as FriendStatus,
        friendCount:
          profile?.friendCount ?? myFriendsLists.friends.length,
        friendsVisible: showFriendsByPrivacy,
        friends: showFriendsByPrivacy
          ? profile?.friends.length
            ? profile.friends
            : myFriendsAsMembers
          : [],
        favoritesShared: showFavsByPrivacy,
        favorites: showFavsByPrivacy ? myFavoriteIds : [],
      };
    }
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name,
      initials: profile.initials,
      avatarUrl: profile.avatarUrl,
      ministry: profile.ministry,
      choir: profile.choir,
      badgeVerified: profile.badgeVerified && profile.ministry === 'obispo',
      memberSince: profile.memberSince,
      churchId: profile.churchId,
      churchName: profile.churchName,
      location: profile.location,
      friendStatus: profile.friendStatus,
      friendCount:
        typeof profile.friendCount === 'number'
          ? profile.friendCount
          : profile.friends.length,
      friendsVisible: profile.friendsVisible !== false,
      friends: profile.friends,
      favoritesShared:
        profile.friendStatus === 'friends' && profile.favoritesShared !== false,
      favorites:
        profile.friendStatus === 'friends' && profile.favoritesShared !== false
          ? profile.favorites
          : [],
    };
  }, [isSelf, myFavoriteIds, myFriendsLists.friends, previewAs, profile, user]);

  // Set default tab once profile resolves (Favorites first when visible, else Friends)
  useEffect(() => {
    if (!effective || didSetInitialTab) return;
    setActiveTab(effective.favoritesShared ? 'favorites' : 'friends');
    setDidSetInitialTab(true);
  }, [didSetInitialTab, effective]);

  // Load verified church snapshot for the Church tab when a churchId is visible
  const targetChurchId = effective?.churchId ?? null;
  useEffect(() => {
    if (!targetChurchId) {
      setEmbeddedChurch(null);
      return;
    }
    let cancelled = false;
    api<{ churches?: EmbeddedChurch[] }>('/churches')
      .then((res) => {
        if (cancelled) return;
        const match = (res?.churches || []).find((c) => c.id === targetChurchId) ?? null;
        setEmbeddedChurch(match);
      })
      .catch(() => {
        if (!cancelled) setEmbeddedChurch(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, targetChurchId]);

  const knownFavorites = useMemo(
    () =>
      (effective?.favorites ?? [])
        .map((id) => hymnById.get(id))
        .filter(Boolean) as {
        id: string;
        number: string;
        title: string;
        category: string;
      }[],
    [effective?.favorites, hymnById],
  );

  const normalizedQuery = useMemo(
    () =>
      searchQuery
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase(),
    [searchQuery],
  );

  const filteredFavorites = useMemo(() => {
    if (!normalizedQuery) return knownFavorites;
    return knownFavorites.filter((h) => {
      const hay = `${h.number} ${h.title} ${h.category}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [knownFavorites, normalizedQuery]);

  const filteredFriends = useMemo(() => {
    const list = effective?.friends ?? [];
    if (!normalizedQuery) return list;
    return list.filter((p) => {
      const hay = `${p.name} ${p.churchName || ''} ${p.ministry || ''} ${p.choir || ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [effective?.friends, normalizedQuery]);

  const churchLabel = effective?.churchName
    ? churchDisplayName(effective.churchName)
    : '';
  const hasChurchTab = Boolean(churchLabel || effective?.churchId);
  const sinceLabel = effective?.memberSince
    ? memberSinceLabel(effective.memberSince, es)
    : '';
  const ministryLabel =
    effective?.ministry
      ? (MINISTRIES as Record<string, [string, string]>)[effective.ministry]?.[
          es ? 0 : 1
        ] ?? null
      : null;
  const choirLabel = effective?.choir
    ? choirDisplayName(effective.choir, es, choirsBySlug)
    : null;

  // Ensure activeTab stays valid if switching View As toggles hides Church tab
  useEffect(() => {
    if (activeTab === 'church' && !hasChurchTab) {
      setActiveTab(effective?.favoritesShared ? 'favorites' : 'friends');
    }
  }, [activeTab, effective?.favoritesShared, hasChurchTab]);

  const profileShareUrl = `https://himnarioebp.com`;

  const handleShareProfile = useCallback(async () => {
    if (!effective) return;
    Haptics.selectionAsync();
    const parts = [
      effective.name,
      ministryLabel,
      choirLabel,
      churchLabel ? churchLabel : null,
    ].filter(Boolean);
    try {
      await Share.share({
        message: `${parts.join(' · ')} — Himnario El Buen Pastor\n${profileShareUrl}`,
      });
    } catch {}
  }, [choirLabel, churchLabel, effective, ministryLabel, profileShareUrl]);

  const handleCopyLink = useCallback(async () => {
    Haptics.selectionAsync();
    await Clipboard.setStringAsync(profileShareUrl);
    showSuccessToast(t.toastLinkCopied);
  }, [profileShareUrl, t.toastLinkCopied]);

  const handleOpenChurchOnMap = useCallback(() => {
    if (!effective?.churchId) return;
    Haptics.selectionAsync();
    router.push(`/churches?id=${encodeURIComponent(effective.churchId)}` as any);
  }, [effective?.churchId, router]);

  const handleOpenDirections = useCallback(() => {
    if (!embeddedChurch) return;
    Haptics.selectionAsync();
    const q = encodeURIComponent(
      `${embeddedChurch.address}, ${embeddedChurch.city}, ${embeddedChurch.state || ''} ${embeddedChurch.country}`,
    );
    const url = isIOS
      ? `http://maps.apple.com/?daddr=${embeddedChurch.lat},${embeddedChurch.lng}&q=${q}`
      : `https://www.google.com/maps/dir/?api=1&destination=${embeddedChurch.lat},${embeddedChurch.lng}`;
    void Linking.openURL(url).catch(() => {});
  }, [embeddedChurch, isIOS]);

  const handleFriendAction = useCallback(
    async (kind: 'request' | 'accept' | 'remove') => {
      if (!effective || friendBusy || isSelf) return;
      if (!user) {
        openAuthSheet();
        return;
      }
      Haptics.selectionAsync();
      setFriendBusy(true);
      try {
        let next: FriendStatus | null = null;
        if (kind === 'request') next = await sendFriendRequest(effective.id);
        else if (kind === 'accept') next = await acceptFriendRequest(effective.id);
        else next = await removeFriendLink(effective.id);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                friendStatus:
                  next ??
                  (kind === 'request'
                    ? 'outgoing'
                    : kind === 'accept'
                      ? 'friends'
                      : 'none'),
              }
            : prev,
        );
        void loadMemberData(false);
      } catch (e) {
        Alert.alert(t.churchError, communityError(e, es));
      } finally {
        setFriendBusy(false);
      }
    },
    [
      acceptFriendRequest,
      effective,
      es,
      friendBusy,
      isSelf,
      loadMemberData,
      openAuthSheet,
      removeFriendLink,
      sendFriendRequest,
      t.churchError,
      user,
    ],
  );

  const confirmRemoveFriend = useCallback(
    (title: string, actionLabel: string) => {
      if (!effective) return;
      Alert.alert(title, effective.name, [
        { text: t.cancel, style: 'cancel' },
        {
          text: actionLabel,
          style: 'destructive',
          onPress: () => void handleFriendAction('remove'),
        },
      ]);
    },
    [effective, handleFriendAction, t.cancel],
  );

  const handleSendPlaylistToFriend = useCallback(
    async (playlistId: string, name: string, hymnIds: string[]) => {
      if (!effective || sendingPlaylistId) return;
      Haptics.selectionAsync();
      setSendingPlaylistId(playlistId);
      try {
        await sendPlaylist(effective.id, name, hymnIds);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShareSheetOpen(false);
        showSuccessToast(
          t.friendsSharePlaylistSent.replace('{name}', effective.name),
        );
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t.churchError, communityError(e, es));
      } finally {
        setSendingPlaylistId(null);
      }
    },
    [
      effective,
      es,
      sendPlaylist,
      sendingPlaylistId,
      t.churchError,
      t.friendsSharePlaylistSent,
    ],
  );

  const handleBlockMember = useCallback(() => {
    if (!user || !effective || isSelf) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t.memberBlockConfirmTitle.replace('{name}', effective.name),
      t.memberBlockConfirmBody,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.memberBlockUser,
          style: 'destructive',
          onPress: () => {
            void api(`/users/${encodeURIComponent(effective.id)}/block`, 'POST', {})
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
    effective,
    es,
    isSelf,
    refreshFriendsStore,
    router,
    t.cancel,
    t.churchError,
    t.memberBlockConfirmBody,
    t.memberBlockConfirmTitle,
    t.memberBlockUser,
    user,
  ]);

  const handleAdminAction = useCallback(
    (action: 'verify-obispo' | 'clear-avatar' | 'suspend') => {
      if (!isAdmin || !effective || isSelf || adminBusy) return;
      Haptics.selectionAsync();
      if (action === 'verify-obispo') {
        const nextVerified = !effective.badgeVerified;
        setAdminBusy(true);
        void api(`/mod/users/${encodeURIComponent(effective.id)}/verify-obispo`, 'POST', {
          verified: nextVerified,
        })
          .then(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void loadMemberData(false);
          })
          .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
          .finally(() => setAdminBusy(false));
        return;
      }
      if (action === 'clear-avatar') {
        Alert.alert(
          t.profileAdminClearAvatar,
          t.profileAdminClearAvatarConfirm.replace('{name}', effective.name),
          [
            { text: t.cancel, style: 'cancel' },
            {
              text: t.delete,
              style: 'destructive',
              onPress: () => {
                setAdminBusy(true);
                void api(`/mod/users/${encodeURIComponent(effective.id)}/clear-avatar`, 'POST', {})
                  .then(() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    showSuccessToast(t.profileAdminClearAvatarDone);
                    void loadMemberData(false);
                  })
                  .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
                  .finally(() => setAdminBusy(false));
              },
            },
          ],
        );
        return;
      }
      Alert.alert(t.profileAdminSuspend, effective.name, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.profileAdminSuspend,
          style: 'destructive',
          onPress: () => {
            setAdminBusy(true);
            void api(`/mod/users/${encodeURIComponent(effective.id)}/suspend`, 'POST', {})
              .then(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              })
              .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
              .finally(() => setAdminBusy(false));
          },
        },
      ]);
    },
    [
      adminBusy,
      api,
      effective,
      es,
      isAdmin,
      isSelf,
      loadMemberData,
      router,
      t.cancel,
      t.churchError,
      t.delete,
      t.profileAdminClearAvatar,
      t.profileAdminClearAvatarConfirm,
      t.profileAdminClearAvatarDone,
      t.profileAdminSuspend,
    ],
  );

  const openFallbackMoreMenu = useCallback(() => {
    if (!effective) return;
    Haptics.selectionAsync();
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: t.profileCopyProfileLink, onPress: () => void handleCopyLink() }];
    if (!isSelf && user) {
      buttons.push({
        text: t.memberBlockUser,
        style: 'destructive',
        onPress: handleBlockMember,
      });
    }
    if (isAdmin && !isSelf) {
      if (effective.ministry === 'obispo') {
        buttons.push({
          text: effective.badgeVerified
            ? t.profileAdminRevokeObispo
            : t.profileAdminVerifyObispo,
          onPress: () => handleAdminAction('verify-obispo'),
        });
      }
      if (effective.avatarUrl) {
        buttons.push({
          text: t.profileAdminClearAvatar,
          style: 'destructive',
          onPress: () => handleAdminAction('clear-avatar'),
        });
      }
      buttons.push({
        text: t.profileAdminSuspend,
        style: 'destructive',
        onPress: () => handleAdminAction('suspend'),
      });
    }
    buttons.push({ text: t.cancel, style: 'cancel' });
    Alert.alert(effective.name, undefined, buttons);
  }, [
    effective,
    handleAdminAction,
    handleBlockMember,
    handleCopyLink,
    isAdmin,
    isSelf,
    t.cancel,
    t.memberBlockUser,
    t.profileAdminClearAvatar,
    t.profileAdminRevokeObispo,
    t.profileAdminSuspend,
    t.profileAdminVerifyObispo,
    t.profileCopyProfileLink,
    user,
  ]);

  const openOtherMember = useCallback(
    (person: ChurchMemberProfile) => {
      Haptics.selectionAsync();
      if (person.id === memberId) return;
      if (user && person.id === user.id) {
        router.dismissTo('/my-profile' as any);
        return;
      }
      seedMemberPreview({
        id: person.id,
        name: person.name,
        initials: person.initials,
        avatarUrl: person.avatarUrl ?? null,
        ministry: person.ministry,
        choir: person.choir,
        badgeVerified: person.badgeVerified,
        memberSince: person.memberSince,
        churchId: person.churchId,
        churchName: person.churchName,
        location: person.location,
        friendStatus: person.friendStatus,
      });
      router.replace(`/member/${encodeURIComponent(person.id)}` as any);
    },
    [memberId, router, user],
  );

  // Clean iOS 26 monochrome system palette (calm, minimal red — red reserved for destructive actions)
  const bg = isDarkMode ? '#000000' : '#FFFFFF';
  const primaryInk = isDarkMode ? '#FFFFFF' : '#000000';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)';
  const subtleChevron = isDarkMode ? 'rgba(235,235,245,0.34)' : 'rgba(60,60,67,0.32)';
  const hairline = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,67,0.12)';
  const chipBg = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(120,120,128,0.10)';
  const secondaryFill = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(120,120,128,0.12)';
  const avatarFallbackBg = isDarkMode ? '#3A3A3C' : '#636366';
  const accentBtnBg = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const accentBtnText = isDarkMode ? '#000000' : '#FFFFFF';
  const verifiedTint = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const secondaryBtnBorder = isDarkMode
    ? 'rgba(255,255,255,0.16)'
    : 'rgba(60,60,67,0.14)';

  const friendCountText = effective
    ? (effective.friendCount === 1
        ? t.profileFriendsCount_one
        : t.profileFriendsCount_other
      ).replace('{n}', String(effective.friendCount))
    : '';
  const favoritesCountText =
    effective?.favoritesShared
      ? (knownFavorites.length === 1
          ? t.profileFavoritesCount_one
          : t.profileFavoritesCount_other
        ).replace('{n}', String(knownFavorites.length))
      : '';

  const subtitleParts = [effective?.location || null, sinceLabel || null].filter(Boolean);
  const churchScheduleRows = useMemo(
    () => parseServiceTimes(embeddedChurch?.serviceTimes) ?? [],
    [embeddedChurch?.serviceTimes],
  );
  const nextChurchService = useMemo(() => {
    const next = getNextServiceSummary(churchScheduleRows);
    if (!next) return null;
    return next.isToday
      ? `${t.churchToday} · ${next.startClock}`
      : `${t.churchNextService}: ${es ? next.dayShortEs : next.dayShortEn} ${next.startClock}`;
  }, [churchScheduleRows, es, t.churchNextService, t.churchToday]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* ── Native iOS 26 Liquid Glass Top Bar ── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: bg,
          },
        ]}
      >
        {searchOpen ? (
          <View style={styles.searchTakeoverRow}>
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={[
                styles.inlineSearchGlass,
                !isIOS && {
                  backgroundColor: secondaryFill,
                  overflow: 'hidden',
                },
              ]}
            >
              <View style={styles.inlineSearchRow}>
                <AppMenuIcon
                  ios="magnifyingglass"
                  android="search"
                  color={mutedText}
                  size={17}
                  containerSize={20}
                />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.profileSearchPlaceholder}
                  placeholderTextColor={mutedText}
                  autoFocus
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  style={[styles.inlineSearchInput, { color: primaryInk }]}
                />
                {searchQuery.length > 0 && !isIOS && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => setSearchQuery('')}
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
              </View>
            </GlassSurface>
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={[
                styles.topCircleGlass,
                !isIOS && { backgroundColor: secondaryFill, overflow: 'hidden' },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
                onPress={() => {
                  Haptics.selectionAsync();
                  Keyboard.dismiss();
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                style={({ pressed }) => [styles.topCircleHit, pressed && { opacity: 0.65 }]}
              >
                <AppMenuIcon
                  ios="xmark"
                  android="close"
                  color={primaryInk}
                  size={19}
                  containerSize={22}
                  weight="semibold"
                />
              </Pressable>
            </GlassSurface>
          </View>
        ) : (
          <>
            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={[
                styles.topCircleGlass,
                !isIOS && { backgroundColor: secondaryFill, overflow: 'hidden' },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.homeMenuBack}
                onPress={handleBackToMain}
                style={({ pressed }) => [styles.topCircleHit, pressed && { opacity: 0.65 }]}
              >
                <AppMenuIcon
                  ios="chevron.left"
                  android="arrow-back"
                  color={primaryInk}
                  size={21}
                  containerSize={25}
                  weight="semibold"
                />
              </Pressable>
            </GlassSurface>

            <GlassSurface
              isInteractive
              glassEffectStyle="regular"
              intensity={64}
              style={[
                styles.topCapsuleGlass,
                !isIOS && { backgroundColor: secondaryFill, overflow: 'hidden' },
              ]}
            >
              <View style={styles.topIconCluster}>
                {/* 1. Search */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.profileSearchPlaceholder}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSearchOpen(true);
                  }}
                  style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.6 }]}
                >
                  <AppMenuIcon
                    ios="magnifyingglass"
                    android="search"
                    color={primaryInk}
                    size={19}
                    containerSize={22}
                    weight="semibold"
                  />
                </Pressable>

                {/* 2. Church Map shortcut */}
                {effective?.churchId ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.profileViewChurch}
                    onPress={handleOpenChurchOnMap}
                    style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.6 }]}
                  >
                    <AppMenuIcon
                      ios="building.columns"
                      android="account-balance"
                      color={primaryInk}
                      size={19}
                      containerSize={22}
                      weight="medium"
                    />
                  </Pressable>
                ) : null}

                {/* 3. Share */}
                {effective ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.profileShareProfile}
                    onPress={() => void handleShareProfile()}
                    style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.6 }]}
                  >
                    <AppMenuIcon
                      ios="square.and.arrow.up"
                      android="share"
                      color={primaryInk}
                      size={20}
                      containerSize={24}
                      scale="large"
                      weight="medium"
                    />
                  </Pressable>
                ) : null}

                {/* 4. More Menu (Native SwiftUI Menu with SF Symbols on iOS) */}
                {effective ? (
                  swiftUI?.ui.Menu ? (() => {
                    const {
                      Button: SwiftButton,
                      Host,
                      Image: SwiftImage,
                      Menu: SwiftMenu,
                      Section: SwiftSection,
                    } = swiftUI.ui;
                    const { font, foregroundStyle, frame } = swiftUI.modifiers;
                    return (
                      <Host
                        style={styles.topIconBtn}
                        colorScheme={isDarkMode ? 'dark' : 'light'}
                        seedColor={primaryInk}
                      >
                        <SwiftMenu
                          label={
                            <SwiftImage
                              systemName="ellipsis"
                              size={20}
                              modifiers={[
                                font({ size: 20, weight: 'semibold' }),
                                foregroundStyle({ type: 'color', color: primaryInk }),
                                frame({ width: 40, height: 40 }),
                              ]}
                            />
                          }
                        >
                          <SwiftButton
                            label={t.profileCopyProfileLink}
                            systemImage="doc.on.doc"
                            onPress={() => void handleCopyLink()}
                          />
                          {!isSelf && user ? (
                            <SwiftButton
                              role="destructive"
                              label={t.memberBlockUser}
                              systemImage="hand.raised"
                              onPress={handleBlockMember}
                            />
                          ) : null}
                          {isAdmin && !isSelf ? (
                            <SwiftSection title={t.profileAdminSection}>
                              {effective.ministry === 'obispo' ? (
                                <SwiftButton
                                  label={
                                    effective.badgeVerified
                                      ? t.profileAdminRevokeObispo
                                      : t.profileAdminVerifyObispo
                                  }
                                  systemImage="checkmark.seal"
                                  onPress={() => handleAdminAction('verify-obispo')}
                                />
                              ) : null}
                              {effective.avatarUrl ? (
                                <SwiftButton
                                  role="destructive"
                                  label={t.profileAdminClearAvatar}
                                  systemImage="trash"
                                  onPress={() => handleAdminAction('clear-avatar')}
                                />
                              ) : null}
                              <SwiftButton
                                role="destructive"
                                label={t.profileAdminSuspend}
                                systemImage="person.crop.circle.badge.xmark"
                                onPress={() => handleAdminAction('suspend')}
                              />
                            </SwiftSection>
                          ) : null}
                        </SwiftMenu>
                      </Host>
                    );
                  })() : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.churchMoreActions}
                      onPress={openFallbackMoreMenu}
                      style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.6 }]}
                    >
                      <AppMenuIcon
                        ios="ellipsis"
                        android="more-horiz"
                        color={primaryInk}
                        size={20}
                        containerSize={24}
                        weight="semibold"
                      />
                    </Pressable>
                  )
                ) : null}
              </View>
            </GlassSurface>
          </>
        )}
      </View>

      {/* ── "View As Others See Me" Native iOS Inset Preview Bar (Self Only) ── */}
      {isSelf && user ? (
        <View
          style={[
            styles.previewBanner,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(120,120,128,0.08)',
            },
          ]}
        >
          <View style={styles.previewTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <AppMenuIcon
                ios="eye"
                android="visibility"
                color={mutedText}
                size={14}
              />
              <Text
                numberOfLines={1}
                style={{ ...fonts.sansMedium, fontSize: 12.5, color: mutedText, flex: 1 }}
              >
                {t.profilePreviewBannerHint}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/my-profile/friends' as any);
              }}
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', gap: 2 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={{ ...fonts.sansSemiBold, fontSize: 12.5, color: primaryInk }}>
                {t.profilePrivacyShortcut}
              </Text>
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={mutedText}
                size={11}
                weight="semibold"
              />
            </Pressable>
          </View>

          {swiftUI?.ui.Picker ? (() => {
            const { Host, Picker: SwiftPicker, Text: SwiftText } = swiftUI.ui;
            const { pickerStyle, tag } = swiftUI.modifiers;
            return (
              <Host
                style={styles.previewNativePickerHost}
                colorScheme={isDarkMode ? 'dark' : 'light'}
                seedColor={primaryInk}
              >
                <SwiftPicker
                  label={t.profilePreviewBannerHint}
                  selection={previewAs}
                  onSelectionChange={(next) => {
                    if ((next === 'friend' || next === 'public') && next !== previewAs) {
                      Haptics.selectionAsync();
                      setPreviewAs(next);
                    }
                  }}
                  modifiers={[pickerStyle('segmented')]}
                >
                  <SwiftText modifiers={[tag('friend')]}>
                    {t.profilePreviewAsFriend}
                  </SwiftText>
                  <SwiftText modifiers={[tag('public')]}>
                    {t.profilePreviewAsPublic}
                  </SwiftText>
                </SwiftPicker>
              </Host>
            );
          })() : (
            <View
              style={[
                styles.previewToggleTrack,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(255,255,255,0.10)'
                    : 'rgba(120,120,128,0.12)',
                },
              ]}
            >
              {(['friend', 'public'] as const).map((mode) => {
                const selected = previewAs === mode;
                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPreviewAs(mode);
                    }}
                    style={[
                      styles.previewTogglePill,
                      selected && {
                        backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        ...fonts.sansSemiBold,
                        fontSize: 12.5,
                        color: selected ? primaryInk : mutedText,
                      }}
                    >
                      {mode === 'friend'
                        ? t.profilePreviewAsFriend
                        : t.profilePreviewAsPublic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadMemberData(true)}
            tintColor={mutedText}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 28) + (currentHymnId ? 84 : 20),
        }}
      >
        {offlineMode && effective ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadMemberData(true)}
            style={[
              styles.offlineBanner,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(120,120,128,0.08)',
                borderColor: hairline,
              },
            ]}
          >
            <AppMenuIcon ios="wifi.slash" android="wifi-off" color={mutedText} size={15} />
            <Text style={{ flex: 1, ...fonts.sansMedium, fontSize: 13, color: mutedText }}>
              {t.memberOfflineSaved}
            </Text>
            <Text style={{ ...fonts.sansSemiBold, fontSize: 13, color: primaryInk }}>
              {t.memberOfflineRetry}
            </Text>
          </Pressable>
        ) : null}

        {!effective ? (
          <View style={styles.emptyWrap}>
            {loading ? (
              <ActivityIndicator color={mutedText} />
            ) : (
              <>
                <AppMenuIcon ios="wifi.slash" android="wifi-off" color={mutedText} size={28} />
                <Text style={[styles.emptyText, { color: mutedText }]}>
                  {t.memberOfflineNotCached}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void loadMemberData(false)}
                  style={[styles.retryPill, { backgroundColor: accentBtnBg }]}
                >
                  <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: accentBtnText }}>
                    {t.memberOfflineRetry}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            {/* ── Clean iOS 26 Asymmetric Identity Header (Zero Boxes) ── */}
            <View style={styles.identityBlock}>
              <View style={styles.identityHeaderRow}>
                <View style={{ flex: 1, gap: 4, paddingRight: 14 }}>
                  <Text style={[styles.displayName, { color: primaryInk }]}>
                    {effective.name}
                  </Text>
                  {subtitleParts.length > 0 ? (
                    <Text
                      numberOfLines={2}
                      style={[styles.subtitleLine, { color: mutedText }]}
                    >
                      {subtitleParts.join(' · ')}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={!effective.avatarUrl}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAvatarLightboxOpen(true);
                  }}
                  style={[
                    styles.avatarWrap,
                    {
                      borderColor: hairline,
                    },
                  ]}
                >
                  <UserAvatar
                    uri={effective.avatarUrl}
                    initials={effective.initials}
                    size={70}
                    fontSize={24}
                    backgroundColor={avatarFallbackBg}
                    textColor="#FFFFFF"
                  />
                  {effective.badgeVerified ? (
                    <View
                      style={[
                        styles.verifiedSealOverlay,
                        { backgroundColor: bg },
                      ]}
                    >
                      <AppMenuIcon
                        ios="checkmark.seal.fill"
                        android="verified"
                        color={verifiedTint}
                        size={18}
                      />
                    </View>
                  ) : null}
                </Pressable>
              </View>

              {/* ── Calm Neutral iOS Metadata Pills (Ministry, Coro, Church) ── */}
              <View style={styles.pillsRow}>
                {ministryLabel ? (
                  <View style={[styles.metaPill, { backgroundColor: chipBg }]}>
                    <AppMenuIcon
                      ios={effective.badgeVerified ? 'checkmark.seal.fill' : 'person.fill'}
                      android={effective.badgeVerified ? 'verified' : 'person'}
                      color={effective.badgeVerified ? verifiedTint : mutedText}
                      size={12.5}
                    />
                    <Text style={[styles.metaPillText, { color: primaryInk }]}>
                      {ministryLabel}
                    </Text>
                  </View>
                ) : null}

                {choirLabel ? (
                  <View style={[styles.metaPill, { backgroundColor: chipBg }]}>
                    <AppMenuIcon
                      ios="music.note"
                      android="music-note"
                      color={mutedText}
                      size={12.5}
                    />
                    <Text style={[styles.metaPillText, { color: primaryInk }]}>
                      {choirLabel}
                    </Text>
                  </View>
                ) : null}

                {churchLabel ? (
                  <Pressable
                    disabled={!effective.churchId}
                    onPress={handleOpenChurchOnMap}
                    style={({ pressed }) => [
                      styles.metaPill,
                      {
                        backgroundColor: chipBg,
                        opacity: pressed ? 0.68 : 1,
                      },
                    ]}
                  >
                    <AppMenuIcon
                      ios="building.columns"
                      android="account-balance"
                      color={mutedText}
                      size={12.5}
                    />
                    <Text style={[styles.metaPillText, { color: primaryInk }]}>
                      {churchLabel}
                    </Text>
                  </Pressable>
                ) : null}

                {!ministryLabel && !choirLabel && !churchLabel ? (
                  <View style={[styles.metaPill, { backgroundColor: chipBg }]}>
                    <AppMenuIcon
                      ios="person.fill"
                      android="person"
                      color={mutedText}
                      size={12.5}
                    />
                    <Text style={[styles.metaPillText, { color: mutedText }]}>
                      {t.profileCommunityMember}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* ── Social Proof Line (Overlapping Mini Avatars + Tabular Counts) ── */}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('friends');
                }}
                style={styles.socialProofRow}
              >
                {effective.friends.length > 0 ? (
                  <View style={styles.miniAvatarStack}>
                    {effective.friends.slice(0, 3).map((fr, idx) => (
                      <View
                        key={fr.id}
                        style={[
                          styles.miniAvatarRing,
                          idx > 0 && { marginLeft: -7 },
                          { borderColor: bg, zIndex: 3 - idx },
                        ]}
                      >
                        <UserAvatar
                          uri={fr.avatarUrl}
                          initials={fr.initials}
                          size={20}
                          fontSize={8.5}
                          backgroundColor={avatarFallbackBg}
                          textColor="#FFFFFF"
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text
                  style={[
                    styles.socialProofText,
                    { color: mutedText, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {[friendCountText, favoritesCountText].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>

              {/* ── Dual Equal-Width Monochrome iOS Action Pills ── */}
              <View style={styles.dualBtnRow}>
                {isSelf ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.push('/my-profile/account-edit' as any);
                      }}
                      style={({ pressed }) => [
                        styles.dualBtnPrimary,
                        { backgroundColor: accentBtnBg, opacity: pressed ? 0.84 : 1 },
                      ]}
                    >
                      <Text style={[styles.dualBtnText, { color: accentBtnText }]}>
                        {t.profileEditButton}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void handleShareProfile()}
                      style={({ pressed }) => [
                        styles.dualBtnSecondary,
                        {
                          backgroundColor: secondaryFill,
                          borderColor: secondaryBtnBorder,
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.dualBtnText, { color: primaryInk }]}>
                        {t.profileShareProfile}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* Left Primary Relationship CTA */}
                    {effective.friendStatus === 'friends' ? (
                      <Pressable
                        disabled={friendBusy}
                        accessibilityRole="button"
                        onPress={() =>
                          confirmRemoveFriend(t.friendsRemoveTitle, t.friendsRemove)
                        }
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            borderColor: secondaryBtnBorder,
                            backgroundColor: secondaryFill,
                            opacity: pressed ? 0.76 : 1,
                          },
                        ]}
                      >
                        {friendBusy ? (
                          <ActivityIndicator size="small" color={primaryInk} />
                        ) : (
                          <>
                            <AppMenuIcon
                              ios="checkmark"
                              android="check"
                              color={primaryInk}
                              size={14}
                              weight="bold"
                            />
                            <Text
                              numberOfLines={1}
                              style={[styles.dualBtnText, { color: primaryInk }]}
                            >
                              {t.friendsAreFriends}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    ) : effective.friendStatus === 'outgoing' ? (
                      <Pressable
                        disabled={friendBusy}
                        accessibilityRole="button"
                        onPress={() =>
                          confirmRemoveFriend(
                            t.friendsCancelRequestTitle,
                            t.friendsCancelRequest,
                          )
                        }
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        {friendBusy ? (
                          <ActivityIndicator size="small" color={primaryInk} />
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[styles.dualBtnText, { color: primaryInk }]}
                          >
                            {t.friendsRequestSent}
                          </Text>
                        )}
                      </Pressable>
                    ) : effective.friendStatus === 'incoming' ? (
                      <Pressable
                        disabled={friendBusy}
                        accessibilityRole="button"
                        onPress={() => void handleFriendAction('accept')}
                        style={({ pressed }) => [
                          styles.dualBtnPrimary,
                          { backgroundColor: accentBtnBg, opacity: pressed ? 0.85 : 1 },
                        ]}
                      >
                        {friendBusy ? (
                          <ActivityIndicator size="small" color={accentBtnText} />
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[styles.dualBtnText, { color: accentBtnText }]}
                          >
                            {t.friendsAccept}
                          </Text>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        disabled={friendBusy}
                        accessibilityRole="button"
                        onPress={() => void handleFriendAction('request')}
                        style={({ pressed }) => [
                          styles.dualBtnPrimary,
                          { backgroundColor: accentBtnBg, opacity: pressed ? 0.85 : 1 },
                        ]}
                      >
                        {friendBusy ? (
                          <ActivityIndicator size="small" color={accentBtnText} />
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[styles.dualBtnText, { color: accentBtnText }]}
                          >
                            {t.friendsAdd}
                          </Text>
                        )}
                      </Pressable>
                    )}

                    {/* Right Contextual Secondary CTA */}
                    {effective.friendStatus === 'friends' ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShareSheetOpen(true);
                        }}
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.dualBtnText, { color: primaryInk }]}
                        >
                          {t.profileSharePlaylist}
                        </Text>
                      </Pressable>
                    ) : effective.friendStatus === 'incoming' ? (
                      <Pressable
                        disabled={friendBusy}
                        accessibilityRole="button"
                        onPress={() => void handleFriendAction('remove')}
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.dualBtnText, { color: primaryInk }]}
                        >
                          {t.friendsDecline}
                        </Text>
                      </Pressable>
                    ) : effective.churchId ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleOpenChurchOnMap}
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.dualBtnText, { color: primaryInk }]}
                        >
                          {t.profileViewChurch}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void handleShareProfile()}
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.dualBtnText, { color: primaryInk }]}
                        >
                          {t.profileShareProfile}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* ── Full-Width Threads Underline Tab Bar ── */}
            <View style={[styles.tabBar, { borderBottomColor: hairline }]}>
              {(
                [
                  { key: 'favorites' as const, label: t.profileTabFavorites },
                  { key: 'friends' as const, label: t.profileTabFriends },
                  ...(hasChurchTab
                    ? [{ key: 'church' as const, label: t.profileTabChurch }]
                    : []),
                ]
              ).map((tabItem) => {
                const active = activeTab === tabItem.key;
                return (
                  <Pressable
                    key={tabItem.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab(tabItem.key);
                    }}
                    style={styles.tabBtn}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: active ? primaryInk : mutedText,
                          ...(active ? fonts.sansSemiBold : fonts.sansMedium),
                        },
                      ]}
                    >
                      {tabItem.label}
                    </Text>
                    {active ? (
                      <View
                        style={[
                          styles.tabUnderline,
                          { backgroundColor: primaryInk },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* ── Tab 1: Favorites (Borderless Full-Width Hairline List) ── */}
            {activeTab === 'favorites' ? (
              <Animated.View key="tab-favorites" entering={FadeIn.duration(150)}>
                {!effective.favoritesShared ? (
                  <View style={styles.emptyWrap}>
                    <AppMenuIcon
                      ios={effective.friendStatus === 'friends' ? 'lock.fill' : 'heart'}
                      android={effective.friendStatus === 'friends' ? 'lock' : 'favorite-border'}
                      color={mutedText}
                      size={24}
                    />
                    <Text style={[styles.emptyText, { color: mutedText }]}>
                      {isSelf
                        ? t.profileFavoritesLockedHint
                        : effective.friendStatus === 'friends'
                          ? t.friendsFavoritesHidden
                          : t.memberFavoritesFriendsOnly}
                    </Text>
                  </View>
                ) : filteredFavorites.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <AppMenuIcon
                      ios="bookmark"
                      android="bookmark-border"
                      color={mutedText}
                      size={24}
                    />
                    <Text style={[styles.emptyText, { color: mutedText }]}>
                      {normalizedQuery
                        ? t.hymnsNoResultsFound
                        : t.friendsFavoritesEmpty}
                    </Text>
                  </View>
                ) : (
                  filteredFavorites.map((hymn, idx) => (
                    <View key={hymn.id}>
                      {idx > 0 ? (
                        <View
                          style={[styles.hymnDivider, { backgroundColor: hairline }]}
                        />
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
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(120,120,128,0.08)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.hymnNumber,
                            {
                              color: mutedText,
                              fontVariant: ['tabular-nums'],
                            },
                          ]}
                        >
                          {hymn.number}
                        </Text>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            numberOfLines={1}
                            style={[styles.hymnTitle, { color: primaryInk }]}
                          >
                            {hymn.title}
                          </Text>
                          {hymn.category ? (
                            <Text
                              numberOfLines={1}
                              style={[styles.hymnCategory, { color: mutedText }]}
                            >
                              {hymn.category}
                            </Text>
                          ) : null}
                        </View>
                        <AppMenuIcon
                          ios="chevron.right"
                          android="chevron-right"
                          color={subtleChevron}
                          size={12.5}
                          weight="semibold"
                        />
                      </Pressable>
                    </View>
                  ))
                )}
              </Animated.View>
            ) : null}

            {/* ── Tab 2: Friends (Borderless Full-Width Hairline List) ── */}
            {activeTab === 'friends' ? (
              <Animated.View key="tab-friends" entering={FadeIn.duration(150)}>
                {!user ? (
                  <View style={styles.emptyWrap}>
                    <AppMenuIcon ios="person.2" android="group" color={mutedText} size={24} />
                    <Text style={[styles.emptyText, { color: mutedText }]}>
                      {t.memberSignInForFriends}
                    </Text>
                  </View>
                ) : !effective.friendsVisible ? (
                  <View style={styles.emptyWrap}>
                    <AppMenuIcon ios="lock.fill" android="lock" color={mutedText} size={22} />
                    <Text style={[styles.emptyText, { color: mutedText }]}>
                      {isSelf ? t.profileFriendsHiddenHint : t.memberFriendsPrivate}
                    </Text>
                  </View>
                ) : filteredFriends.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    {loading ? (
                      <ActivityIndicator color={mutedText} />
                    ) : (
                      <>
                        <AppMenuIcon ios="person.2" android="group" color={mutedText} size={24} />
                        <Text style={[styles.emptyText, { color: mutedText }]}>
                          {normalizedQuery
                            ? t.hymnsNoResultsFound
                            : t.memberFriendsEmpty}
                        </Text>
                      </>
                    )}
                  </View>
                ) : (
                  filteredFriends.map((person, idx) => {
                    const pRole = [
                      person.ministry
                        ? (MINISTRIES as Record<string, [string, string]>)[person.ministry]?.[
                            es ? 0 : 1
                          ]
                        : null,
                      person.choir
                        ? choirDisplayName(person.choir, es, choirsBySlug)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    const pChurch = person.churchName
                      ? churchDisplayName(person.churchName)
                      : '';
                    const sub = [pRole, pChurch].filter(Boolean).join(' · ');
                    return (
                      <View key={person.id}>
                        {idx > 0 ? (
                          <View
                            style={[styles.memberDivider, { backgroundColor: hairline }]}
                          />
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openOtherMember(person)}
                          style={({ pressed }) => [
                            styles.memberRow,
                            pressed && {
                              backgroundColor: isDarkMode
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(120,120,128,0.08)',
                            },
                          ]}
                        >
                          <UserAvatar
                            uri={person.avatarUrl}
                            initials={person.initials}
                            size={42}
                            fontSize={14}
                            backgroundColor={avatarFallbackBg}
                            textColor="#FFFFFF"
                          />
                          <View style={{ flex: 1, gap: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Text
                                numberOfLines={1}
                                style={{
                                  ...fonts.sansSemiBold,
                                  fontSize: 15.5,
                                  color: primaryInk,
                                  flexShrink: 1,
                                }}
                              >
                                {person.name}
                              </Text>
                              {person.badgeVerified && person.ministry === 'obispo' ? (
                                <AppMenuIcon
                                  ios="checkmark.seal.fill"
                                  android="verified"
                                  color={verifiedTint}
                                  size={14}
                                />
                              ) : null}
                            </View>
                            {sub ? (
                              <Text
                                numberOfLines={1}
                                style={{
                                  ...fonts.sansRegular,
                                  fontSize: 13,
                                  color: mutedText,
                                }}
                              >
                                {sub}
                              </Text>
                            ) : null}
                          </View>
                          <AppMenuIcon
                            ios="chevron.right"
                            android="chevron-right"
                            color={subtleChevron}
                            size={12.5}
                            weight="semibold"
                          />
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </Animated.View>
            ) : null}

            {/* ── Tab 3: Church Snapshot ── */}
            {activeTab === 'church' && hasChurchTab ? (
              <Animated.View
                key="tab-church"
                entering={FadeIn.duration(150)}
                style={styles.churchTabWrap}
              >
                <View style={styles.churchHeaderRow}>
                  <View
                    style={[
                      styles.churchBadgeCircle,
                      {
                        backgroundColor: chipBg,
                      },
                    ]}
                  >
                    <AppMenuIcon
                      ios="building.columns.fill"
                      android="account-balance"
                      color={primaryInk}
                      size={19}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.churchNameText, { color: primaryInk }]}>
                        {embeddedChurch
                          ? churchDisplayName(embeddedChurch.name, embeddedChurch.city)
                          : churchLabel}
                      </Text>
                      {embeddedChurch ? (
                        <AppMenuIcon
                          ios="checkmark.seal.fill"
                          android="verified"
                          color={verifiedTint}
                          size={15}
                        />
                      ) : null}
                    </View>
                    {embeddedChurch ? (
                      <Text style={{ ...fonts.sansRegular, fontSize: 13.5, color: mutedText }}>
                        {`${embeddedChurch.address}, ${embeddedChurch.city}${embeddedChurch.state ? `, ${embeddedChurch.state}` : ''} ${embeddedChurch.postalCode || ''}`.trim()}
                      </Text>
                    ) : effective.location ? (
                      <Text style={{ ...fonts.sansRegular, fontSize: 13.5, color: mutedText }}>
                        {effective.location}
                      </Text>
                    ) : null}
                    {embeddedChurch?.pastorName ? (
                      <Text
                        style={{
                          ...fonts.sansMedium,
                          fontSize: 13.5,
                          color: primaryInk,
                          marginTop: 2,
                        }}
                      >
                        {servantDisplayName(embeddedChurch.pastorName)}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {churchScheduleRows.length > 0 ? (
                  <View style={[styles.churchScheduleBox, { borderColor: hairline }]}>
                    <View style={styles.churchScheduleHeader}>
                      <Text style={[styles.churchScheduleEyebrow, { color: mutedText }]}>
                        {t.churchServiceTimes.toUpperCase()}
                      </Text>
                      {nextChurchService ? (
                        <View
                          style={[
                            styles.nextServiceBadge,
                            { backgroundColor: chipBg },
                          ]}
                        >
                          <Text
                            style={{
                              ...fonts.sansSemiBold,
                              fontSize: 11.5,
                              color: primaryInk,
                            }}
                          >
                            {nextChurchService}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {churchScheduleRows.map((row, idx) => (
                      <View
                        key={`${row.day}-${idx}`}
                        style={[
                          styles.churchScheduleRow,
                          idx > 0 && {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: hairline,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...fonts.sansMedium,
                              fontSize: 14.5,
                              color: primaryInk,
                            }}
                          >
                            {row.day}
                          </Text>
                          {row.note ? (
                            <Text
                              style={{
                                ...fonts.sansRegular,
                                fontSize: 12.5,
                                color: mutedText,
                              }}
                            >
                              {row.note}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={{
                            ...fonts.sansMedium,
                            fontSize: 14,
                            color: primaryInk,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {row.time}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {effective.churchId ? (
                  <View style={styles.dualBtnRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleOpenChurchOnMap}
                      style={({ pressed }) => [
                        styles.dualBtnPrimary,
                        { backgroundColor: accentBtnBg, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <AppMenuIcon
                        ios="map.fill"
                        android="map"
                        color={accentBtnText}
                        size={15}
                      />
                      <Text style={[styles.dualBtnText, { color: accentBtnText }]}>
                        {t.profileOpenOnMap}
                      </Text>
                    </Pressable>
                    {embeddedChurch ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleOpenDirections}
                        style={({ pressed }) => [
                          styles.dualBtnSecondary,
                          {
                            backgroundColor: secondaryFill,
                            borderColor: secondaryBtnBorder,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <AppMenuIcon
                          ios="arrow.triangle.turn.up.right.diamond"
                          android="directions"
                          color={primaryInk}
                          size={15}
                        />
                        <Text style={[styles.dualBtnText, { color: primaryInk }]}>
                          {t.churchDirections}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* ── Share Playlist Modal (when tapping Share Playlist on a friend's profile) ── */}
      <Modal
        visible={shareSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShareSheetOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShareSheetOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.shareSheetContainer}
          >
            <GlassSurface
              glassEffectStyle="regular"
              intensity={78}
              tonalColor={isDarkMode ? '#1C1C1E' : '#FFFFFF'}
              style={[
                styles.shareSheetCard,
                {
                  borderColor: hairline,
                },
              ]}
            >
              <View style={styles.shareSheetHeader}>
                <Text style={[styles.shareSheetTitle, { color: primaryInk }]}>
                  {t.profileSharePlaylistTitle.replace('{name}', effective?.name || '')}
                </Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => setShareSheetOpen(false)}
                  accessibilityLabel={t.close}
                >
                  <AppMenuIcon
                    ios="xmark.circle.fill"
                    android="close"
                    color={mutedText}
                    size={22}
                  />
                </Pressable>
              </View>

              {myPlaylists.length === 0 ? (
                <Text
                  style={{
                    ...fonts.sansRegular,
                    fontSize: 14,
                    color: mutedText,
                    textAlign: 'center',
                    paddingVertical: 18,
                  }}
                >
                  {t.profileNoPlaylistsToShare}
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 320 }}>
                  {myPlaylists.map((pl, idx) => {
                    const sending = sendingPlaylistId === pl.id;
                    return (
                      <View key={pl.id}>
                        {idx > 0 ? (
                          <View style={[styles.fullDivider, { backgroundColor: hairline }]} />
                        ) : null}
                        <Pressable
                          disabled={Boolean(sendingPlaylistId)}
                          onPress={() =>
                            void handleSendPlaylistToFriend(pl.id, pl.name, pl.hymnIds)
                          }
                          style={({ pressed }) => [
                            styles.sharePlaylistRow,
                            pressed && { opacity: 0.72 },
                          ]}
                        >
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text
                              numberOfLines={1}
                              style={{ ...fonts.sansSemiBold, fontSize: 15, color: primaryInk }}
                            >
                              {pl.name}
                            </Text>
                            <Text style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedText }}>
                              {`${pl.hymnIds.length} ${pl.hymnIds.length === 1 ? t.songCount_one : t.songCount_other}`}
                            </Text>
                          </View>
                          {sending ? (
                            <ActivityIndicator size="small" color={primaryInk} />
                          ) : (
                            <AppMenuIcon
                              ios="paperplane.fill"
                              android="send"
                              color={primaryInk}
                              size={16}
                            />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Full-Screen Avatar Lightbox ── */}
      <Modal
        visible={avatarLightboxOpen && Boolean(effective?.avatarUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarLightboxOpen(false)}
      >
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={() => setAvatarLightboxOpen(false)}
        >
          {effective?.avatarUrl ? (
            <Image
              source={{ uri: effective.avatarUrl }}
              style={styles.lightboxImage}
              resizeMode="cover"
            />
          ) : null}
          <Text style={styles.lightboxCaption}>{effective?.name}</Text>
        </Pressable>
      </Modal>
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
    minHeight: 54,
  },
  topCircleGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  topCircleHit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCapsuleGlass: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  topIconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    gap: 2,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTakeoverRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineSearchGlass: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  inlineSearchRow: {
    flex: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineSearchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15.5,
    paddingVertical: 0,
  },
  previewBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    gap: 8,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewNativePickerHost: {
    width: '100%',
    height: 32,
  },
  previewToggleTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    gap: 3,
  },
  previewTogglePill: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  identityBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  displayName: {
    ...fonts.sansBold,
    fontSize: 27,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subtitleLine: {
    ...fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
  },
  avatarWrap: {
    position: 'relative',
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verifiedSealOverlay: {
    position: 'absolute',
    left: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 999,
  },
  metaPillText: {
    ...fonts.sansMedium,
    fontSize: 13,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatarRing: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  socialProofText: {
    ...fonts.sansRegular,
    fontSize: 14,
  },
  dualBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  dualBtnPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  dualBtnSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  dualBtnText: {
    ...fonts.sansSemiBold,
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
  },
  tabUnderline: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  emptyWrap: {
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 4,
  },
  hymnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  hymnNumber: {
    ...fonts.sansMedium,
    fontSize: 15,
    width: 34,
    textAlign: 'right',
  },
  hymnTitle: {
    ...fonts.sansMedium,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  hymnCategory: {
    ...fonts.sansRegular,
    fontSize: 12.5,
  },
  hymnDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
    marginRight: 20,
  },
  fullDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  memberDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 74,
    marginRight: 20,
  },
  churchTabWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  churchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  churchBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchNameText: {
    ...fonts.bold,
    fontSize: 19,
  },
  churchScheduleBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  churchScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  churchScheduleEyebrow: {
    ...fonts.sansSemiBold,
    fontSize: 11.5,
    letterSpacing: 0.7,
  },
  nextServiceBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  churchScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  shareSheetContainer: {
    width: '100%',
  },
  shareSheetCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
  },
  shareSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareSheetTitle: {
    ...fonts.sansSemiBold,
    fontSize: 16.5,
    flex: 1,
  },
  sharePlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  lightboxImage: {
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  lightboxCaption: {
    ...fonts.sansSemiBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
});
