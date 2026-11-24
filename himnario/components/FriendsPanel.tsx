/**
 * FriendsPanel — the friendships page inside the account sheet:
 * - Animated iOS Liquid Glass segmented control (Amistades | Solicitudes | Mi iglesia)
 * - Clean member rows that navigate to the full-screen /member/[id] profile page
 * - Shared playlists inbox & privacy switches (including friends-list visibility)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { fonts } from '../theme/theme';
import { MINISTRIES, choirDisplayName } from '../data/communityRules';
import { useApprovedChoirs } from '../utils/choirsStore';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getLocalizedHymn } from '../data/alabanzasEnglish';
import * as Haptics from '../utils/haptics';
import { communityError } from '../utils/communityApi';
import { churchDisplayName } from '../utils/churchName';
import {
  type FriendProfile,
  type FriendStatus,
  type SharedPlaylist,
} from '../utils/friends';
import { useFriends } from '../utils/friendsStore';
import { seedMemberPreview } from '../utils/memberProfileCache';
import AppMenuIcon from './AppMenuIcon';
import LiquidGlassSegmented from './LiquidGlassSegmented';
import FriendButton from './FriendButton';

type Table = Record<string, [string, string]>;
type FriendsTab = 'friends' | 'requests' | 'church';

export default function FriendsPanel({
  onOpenHymn,
  onOpenChurchesMap,
  onOpenMember,
}: {
  onOpenHymn?: (hymnId: string) => void;
  onOpenChurchesMap?: () => void;
  onOpenMember?: (memberId: string) => void;
}) {
  const { theme, isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user, updateProfile, refreshUser } = useAuth();
  const { importPlaylist } = usePlaylists();
  const es = language !== 'en';

  const {
    lists,
    suggestions,
    sharedPlaylists,
    loading,
    refresh,
    refreshSuggestions,
    accept: acceptFriend,
    remove: declineFriend,
    markSharedPlaylistSeen,
    deleteSharedPlaylist,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');

  const [openSharedId, setOpenSharedId] = useState<string | null>(null);
  const [savedSharedIds, setSavedSharedIds] = useState<Record<string, boolean>>({});
  const [deletingSharedId, setDeletingSharedId] = useState<string | null>(null);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [savingSwitch, setSavingSwitch] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    void refreshSuggestions();
  }, [refresh, refreshSuggestions, user?.churchId, user?.churchName]);

  useEffect(() => {
    if (user && !user.churchId && suggestions.churchId) {
      void refreshUser().catch(() => {});
    }
  }, [refreshUser, suggestions.churchId, user]);

  // Seed loaded friends in memory so tapping any friend opens their full-screen profile at 0ms (even if Wi-Fi drops).
  useEffect(() => {
    for (const friend of lists.friends) {
      seedMemberPreview({
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        ministry: friend.ministry,
        choir: friend.choir,
        badgeVerified: friend.badgeVerified,
        memberSince: friend.memberSince,
        churchId: friend.churchId,
        churchName: friend.churchName,
        location: friend.location,
        friendStatus: 'friends',
      });
    }
  }, [lists.friends]);

  const switchTab = useCallback((next: FriendsTab) => {
    Haptics.selectionAsync();
    setActiveTab(next);
  }, []);

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

  const cardBg = isDarkMode ? '#222225' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : theme.outlineVariant + '50';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.58)' : theme.onSurfaceVariant;
  const divider = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant;

  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const roleLine = (person: FriendProfile) =>
    [
      person.ministry ? (MINISTRIES as Table)[person.ministry]?.[es ? 0 : 1] : null,
      person.choir ? choirDisplayName(person.choir, es, choirsBySlug) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const openMemberPage = (person: FriendProfile, status: FriendStatus) => {
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
      friendStatus: status,
    });
    onOpenMember?.(person.id);
  };

  const handleAcceptRequest = (person: FriendProfile) => {
    if (actingRequestId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActingRequestId(person.id);
    acceptFriend(person.id)
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
      .finally(() => setActingRequestId(null));
  };

  const handleDeclineRequest = (person: FriendProfile) => {
    if (actingRequestId) return;
    Haptics.selectionAsync();
    setActingRequestId(person.id);
    declineFriend(person.id)
      .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
      .finally(() => setActingRequestId(null));
  };

  const renderPeopleSection = (title: string, people: FriendProfile[], status: FriendStatus) => {
    if (people.length === 0) return null;
    return (
      <View style={{ gap: 8 }}>
        <Text style={[styles.sectionHeader, { color: mutedText }]}>
          {`${title} (${people.length})`}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {people.map((person, index) => {
            const role = roleLine(person);
            const church = person.churchName ? churchDisplayName(person.churchName) : '';
            const subtitle = [role, church].filter(Boolean).join(' · ');
            const isActing = actingRequestId === person.id;
            return (
              <View key={person.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                <View style={styles.rowContainer}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openMemberPage(person, status)}
                    style={({ pressed }) => [
                      styles.rowMainHit,
                      pressed && {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary },
                      ]}
                    >
                      <Text
                        style={{
                          ...fonts.sansBold,
                          fontSize: 14,
                          color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                        }}
                      >
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
                      {subtitle ? (
                        <Text
                          numberOfLines={1}
                          style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedText }}
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {status !== 'incoming' && status !== 'none' ? (
                      <AppMenuIcon
                        ios="chevron.right"
                        android="chevron-right"
                        color={mutedText}
                        size={13}
                        weight="semibold"
                      />
                    ) : null}
                  </Pressable>

                  {status === 'incoming' ? (
                    <View style={styles.inlineActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(actingRequestId)}
                        onPress={() => handleAcceptRequest(person)}
                        style={({ pressed }) => [
                          styles.acceptPill,
                          {
                            backgroundColor: theme.primary,
                            opacity: isActing ? 0.6 : pressed ? 0.84 : 1,
                          },
                        ]}
                      >
                        {isActing ? (
                          <ActivityIndicator size="small" color={theme.onPrimary} />
                        ) : (
                          <Text
                            style={{
                              ...fonts.sansSemiBold,
                              fontSize: 12.5,
                              color: theme.onPrimary,
                            }}
                          >
                            {t.friendsAccept}
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.friendsDecline}
                        disabled={Boolean(actingRequestId)}
                        onPress={() => handleDeclineRequest(person)}
                        style={({ pressed }) => [
                          styles.declineCircle,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(255,255,255,0.10)'
                              : theme.surfaceVariants.containerHigh,
                            opacity: pressed ? 0.72 : 1,
                          },
                        ]}
                      >
                        <AppMenuIcon
                          ios="xmark"
                          android="close"
                          color={mutedText}
                          size={13}
                          weight="semibold"
                        />
                      </Pressable>
                    </View>
                  ) : status === 'none' ? (
                    <View style={{ paddingRight: 12 }}>
                      <FriendButton
                        userId={person.id}
                        name={person.name}
                        status="none"
                        compact
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const saveSwitch = (
    key:
      | 'shareFavoritesWithFriends'
      | 'showFriendsList'
      | 'suggestToChurchMembers'
      | 'directoryVisibleToAll',
    value: boolean,
  ) => {
    if (savingSwitch) return;
    Haptics.selectionAsync();
    setSavingSwitch(key);
    updateProfile({ [key]: value })
      .then(() => {
        if (key === 'suggestToChurchMembers' || key === 'directoryVisibleToAll') {
          void refreshSuggestions();
        }
      })
      .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
      .finally(() => setSavingSwitch(null));
  };

  const switchRow = (
    key:
      | 'shareFavoritesWithFriends'
      | 'showFriendsList'
      | 'suggestToChurchMembers'
      | 'directoryVisibleToAll',
    title: string,
    subtitle: string,
    value: boolean,
  ) => (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...fonts.sansMedium, fontSize: 15.5, color: theme.onSurface }}>{title}</Text>
        <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 17, color: mutedText }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={savingSwitch !== null}
        onValueChange={(next) => saveSwitch(key, next)}
        trackColor={{
          false: isDarkMode ? 'rgba(255,255,255,0.16)' : theme.outlineVariant,
          true: isDarkMode ? '#8d2d2d' : theme.primary,
        }}
        thumbColor="#ffffff"
      />
    </View>
  );

  const toggleSharedPlaylist = (item: SharedPlaylist) => {
    Haptics.selectionAsync();
    const opening = openSharedId !== item.id;
    setOpenSharedId(opening ? item.id : null);
    if (opening && !item.seen) {
      void markSharedPlaylistSeen(item.id);
    }
  };

  const handleSaveSharedPlaylist = (item: SharedPlaylist) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    importPlaylist(item.name, item.hymnIds);
    setSavedSharedIds((prev) => ({ ...prev, [item.id]: true }));
    if (!item.seen) {
      void markSharedPlaylistSeen(item.id);
    }
  };

  const handleDeleteSharedPlaylist = (item: SharedPlaylist) => {
    if (deletingSharedId) return;
    Haptics.selectionAsync();
    setDeletingSharedId(item.id);
    deleteSharedPlaylist(item.id)
      .then(() => {
        if (openSharedId === item.id) setOpenSharedId(null);
      })
      .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
      .finally(() => setDeletingSharedId(null));
  };

  const renderSharedPlaylistsSection = () => {
    if (sharedPlaylists.length === 0) return null;
    return (
      <View style={{ gap: 8 }}>
        <Text style={[styles.sectionHeader, { color: mutedText }]}>
          {`${t.friendsSharedPlaylists} (${sharedPlaylists.length})`}
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {sharedPlaylists.map((item, index) => {
            const open = openSharedId === item.id;
            const saved = savedSharedIds[item.id] === true;
            const known = item.hymnIds
              .map((id) => hymnById.get(id))
              .filter(Boolean) as { id: string; number: string; title: string }[];
            const countLabel = `${known.length} ${
              known.length === 1 ? t.songCount_one : t.songCount_other
            }`;
            const senderLabel = t.friendsSharedBy.replace('{name}', item.fromName);
            return (
              <View key={item.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => toggleSharedPlaylist(item)}
                  style={({ pressed }) => [
                    styles.rowMainHit,
                    pressed && {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.06)'
                        : theme.primary + '0D',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: item.seen
                          ? theme.surfaceVariants.containerHighest
                          : theme.primary,
                      },
                    ]}
                  >
                    <AppMenuIcon
                      ios="music.note.list"
                      android="queue-music"
                      color={item.seen ? theme.primary : theme.onPrimary}
                      size={18}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {!item.seen && (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: theme.primary,
                          }}
                        />
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          ...fonts.sansSemiBold,
                          fontSize: 16,
                          color: theme.onSurface,
                          flexShrink: 1,
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ ...fonts.sansRegular, fontSize: 13, color: mutedText }}
                    >
                      {`${senderLabel} · ${countLabel}`}
                    </Text>
                  </View>
                  <AppMenuIcon
                    ios={open ? 'chevron.up' : 'chevron.down'}
                    android={open ? 'expand-less' : 'expand-more'}
                    color={mutedText}
                    size={13}
                    weight="semibold"
                  />
                </Pressable>

                {open && (
                  <View style={styles.details}>
                    {known.length > 0 && (
                      <View style={{ gap: 2 }}>
                        {known.map((hymn) => (
                          <Pressable
                            key={hymn.id}
                            accessibilityRole="button"
                            onPress={() => {
                              Haptics.selectionAsync();
                              onOpenHymn?.(hymn.id);
                            }}
                            style={({ pressed }) => [styles.hymnRow, pressed && { opacity: 0.6 }]}
                          >
                            <Text
                              style={{
                                ...fonts.bold,
                                fontSize: 15,
                                color: theme.primary,
                                width: 44,
                              }}
                              numberOfLines={1}
                            >
                              {hymn.number}
                            </Text>
                            <Text
                              style={{
                                ...fonts.sansRegular,
                                fontSize: 14.5,
                                color: theme.onSurface,
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {hymn.title}
                            </Text>
                            <AppMenuIcon
                              ios="chevron.right"
                              android="chevron-right"
                              color={mutedText}
                              size={11}
                              weight="semibold"
                            />
                          </Pressable>
                        ))}
                      </View>
                    )}

                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        disabled={saved || known.length === 0}
                        onPress={() => handleSaveSharedPlaylist(item)}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          backgroundColor: saved
                            ? theme.surfaceVariants.containerHigh
                            : theme.primary,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios={saved ? 'checkmark' : 'plus.circle.fill'}
                          android={saved ? 'check' : 'playlist-add'}
                          color={saved ? theme.primary : theme.onPrimary}
                          size={15}
                        />
                        <Text
                          style={{
                            ...fonts.sansSemiBold,
                            fontSize: 13.5,
                            color: saved ? theme.primary : theme.onPrimary,
                          }}
                        >
                          {saved ? t.friendsPlaylistSaved : t.friendsSavePlaylist}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.delete}
                        disabled={deletingSharedId === item.id}
                        onPress={() => handleDeleteSharedPlaylist(item)}
                        style={({ pressed }) => ({
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: theme.surfaceVariants.containerHigh,
                          opacity:
                            deletingSharedId === item.id ? 0.5 : pressed ? 0.78 : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios="trash"
                          android="delete-outline"
                          color={mutedText}
                          size={16}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const hasLinkedChurch = Boolean(user?.churchId) || suggestions.hasChurch;
  const myChurchLabel = churchDisplayName(
    suggestions.churchName || user?.churchName || '',
  );
  const directoryMatchesChurch = !user?.churchId || user.churchId === suggestions.churchId;
  const churchMembers = directoryMatchesChurch ? suggestions.churchMembers : [];

  const renderMyChurchMembersSection = () => {
    if (!hasLinkedChurch) return null;
    const headerTitle = myChurchLabel
      ? t.friendsChurchMembersTitle.replace('{church}', myChurchLabel.toUpperCase())
      : t.friendsFromMyChurch;
    const nextOffset = directoryMatchesChurch ? suggestions.churchMembersNextOffset : null;
    return (
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
          }}
        >
          <Text style={[styles.sectionHeader, { color: mutedText, paddingHorizontal: 0 }]}>
            {headerTitle}
          </Text>
          {onOpenChurchesMap ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                Haptics.selectionAsync();
                onOpenChurchesMap();
              }}
            >
              <Text style={{ ...fonts.sansSemiBold, fontSize: 12.5, color: theme.primary }}>
                {t.friendsChurchViewMap}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {churchMembers.length === 0 ? (
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppMenuIcon
                ios="building.columns"
                android="account-balance"
                color={mutedText}
                size={20}
              />
              <Text
                style={{
                  flex: 1,
                  ...fonts.sansRegular,
                  fontSize: 13.5,
                  lineHeight: 19,
                  color: mutedText,
                }}
              >
                {t.friendsChurchMembersEmpty.replace(
                  '{church}',
                  myChurchLabel || t.friendsFromMyChurch.toLowerCase(),
                )}
              </Text>
            </View>
          ) : (
            churchMembers.map((person, index) => {
              const role = roleLine(person);
              const badgeText =
                person.friendStatus === 'friends'
                  ? t.churchMembersBadgeFriend
                  : person.friendStatus === 'outgoing' || person.friendStatus === 'incoming'
                    ? t.churchMembersBadgePending
                    : null;
              return (
                <View key={person.id}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                  <View style={styles.rowContainer}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openMemberPage(person, person.friendStatus)}
                      style={({ pressed }) => [
                        styles.rowMainHit,
                        pressed && {
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.06)'
                            : theme.primary + '0D',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary },
                        ]}
                      >
                        <Text
                          style={{
                            ...fonts.sansBold,
                            fontSize: 14,
                            color: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                          }}
                        >
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
                        {role ? (
                          <Text
                            numberOfLines={1}
                            style={{ ...fonts.sansRegular, fontSize: 12.5, color: mutedText }}
                          >
                            {role}
                          </Text>
                        ) : null}
                      </View>
                      {badgeText ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 999,
                            backgroundColor:
                              person.friendStatus === 'friends'
                                ? isDarkMode
                                  ? 'rgba(52,199,89,0.18)'
                                  : 'rgba(52,199,89,0.12)'
                                : isDarkMode
                                  ? 'rgba(255,255,255,0.09)'
                                  : theme.surfaceVariants.containerHigh,
                          }}
                        >
                          <Text
                            style={{
                              ...fonts.sansSemiBold,
                              fontSize: 11.5,
                              color:
                                person.friendStatus === 'friends'
                                  ? isDarkMode
                                    ? '#4CD964'
                                    : '#248A3D'
                                  : mutedText,
                            }}
                          >
                            {badgeText}
                          </Text>
                        </View>
                      ) : null}
                      {person.friendStatus !== 'none' ? (
                        <AppMenuIcon
                          ios="chevron.right"
                          android="chevron-right"
                          color={mutedText}
                          size={13}
                          weight="semibold"
                        />
                      ) : null}
                    </Pressable>

                    {person.friendStatus === 'none' ? (
                      <View style={{ paddingRight: 12 }}>
                        <FriendButton
                          userId={person.id}
                          name={person.name}
                          status="none"
                          compact
                          onStatusChange={() => void refreshSuggestions()}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
          {nextOffset !== null && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void refreshSuggestions(nextOffset)}
              style={{ padding: 14, alignItems: 'center' }}
            >
              <Text style={{ ...fonts.sansSemiBold, color: theme.primary }}>
                {t.churchMembersLoadMore}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const requestsBadgeCount =
    lists.incoming.length + sharedPlaylists.filter((p) => !p.seen).length;

  return (
    <View style={{ gap: 18 }}>
      {/* Animated iOS 26 Liquid Glass Segmented Control */}
      <LiquidGlassSegmented
        compact
        value={activeTab}
        onChange={(next) => switchTab(next)}
        items={[
          {
            key: 'friends',
            label: t.friendsTabMine,
            count: lists.friends.length,
          },
          {
            key: 'requests',
            label: t.friendsTabRequests,
            count: requestsBadgeCount,
            highlightBadge: requestsBadgeCount > 0,
          },
          {
            key: 'church',
            label: t.friendsTabChurch,
            count: churchMembers.length > 0 ? churchMembers.length : null,
          },
        ]}
      />

      {activeTab === 'requests' && (
        <Animated.View key="tab-requests" entering={FadeIn.duration(150)} style={{ gap: 16 }}>
          {renderPeopleSection(t.friendsRequests, lists.incoming, 'incoming')}
          {renderSharedPlaylistsSection()}
          {renderPeopleSection(t.friendsSent, lists.outgoing, 'outgoing')}
          {lists.incoming.length === 0 &&
            lists.outgoing.length === 0 &&
            sharedPlaylists.length === 0 && (
              <View
                style={[
                  styles.card,
                  styles.emptyCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <AppMenuIcon ios="tray" android="inbox" color={mutedText} size={28} />
                <Text
                  style={{
                    ...fonts.sansRegular,
                    fontSize: 14,
                    lineHeight: 20,
                    color: mutedText,
                    textAlign: 'center',
                  }}
                >
                  {t.friendsEmptyBody}
                </Text>
              </View>
            )}
        </Animated.View>
      )}

      {activeTab === 'friends' && (
        <Animated.View key="tab-friends" entering={FadeIn.duration(150)} style={{ gap: 16 }}>
          {renderPeopleSection(t.friendsMine, lists.friends, 'friends')}
          {lists.friends.length === 0 && (
            <View
              style={[
                styles.card,
                styles.emptyCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <AppMenuIcon ios="person.2" android="group" color={mutedText} size={30} />
                  <Text
                    style={{
                      ...fonts.sansSemiBold,
                      fontSize: 16,
                      color: theme.onSurface,
                      textAlign: 'center',
                    }}
                  >
                    {t.friendsEmptyTitle}
                  </Text>
                  <Text
                    style={{
                      ...fonts.sansRegular,
                      fontSize: 14,
                      lineHeight: 20,
                      color: mutedText,
                      textAlign: 'center',
                    }}
                  >
                    {t.friendsEmptyBody}
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {activeTab === 'church' && (
        <Animated.View key="tab-church" entering={FadeIn.duration(150)} style={{ gap: 16 }}>
          {hasLinkedChurch
            ? renderMyChurchMembersSection()
            : renderPeopleSection(t.friendsFromMyChurch, suggestions.users, 'none')}

          {!hasLinkedChurch && onOpenChurchesMap ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onOpenChurchesMap();
              }}
              style={({ pressed }) => [
                styles.card,
                styles.churchPrompt,
                { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <AppMenuIcon
                ios="building.columns"
                android="account-balance"
                color={theme.primary}
                size={22}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...fonts.sansSemiBold, fontSize: 15, color: theme.onSurface }}>
                  {t.friendsNoChurchTitle}
                </Text>
                <Text
                  style={{
                    ...fonts.sansRegular,
                    fontSize: 13,
                    lineHeight: 18,
                    color: mutedText,
                  }}
                >
                  {t.friendsNoChurchBody}
                </Text>
              </View>
              <AppMenuIcon
                ios="chevron.right"
                android="chevron-right"
                color={mutedText}
                size={13}
                weight="semibold"
              />
            </Pressable>
          ) : null}
        </Animated.View>
      )}

      {user ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.sectionHeader, { color: mutedText }]}>{t.friendsPrivacy}</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {switchRow(
              'shareFavoritesWithFriends',
              t.friendsShareFavorites,
              t.friendsShareFavoritesSub,
              user.shareFavoritesWithFriends,
            )}
            <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
            {switchRow(
              'showFriendsList',
              t.friendsShowList,
              t.friendsShowListSub,
              user.showFriendsList,
            )}
            <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
            {switchRow(
              'suggestToChurchMembers',
              t.friendsSuggestMe,
              t.friendsSuggestMeSub,
              user.suggestToChurchMembers,
            )}
            <View style={[styles.divider, { backgroundColor: divider, marginLeft: 14 }]} />
            {switchRow(
              'directoryVisibleToAll',
              t.friendsDirectoryAll,
              t.friendsDirectoryAllSub,
              user.directoryVisibleToAll,
            )}
          </View>
        </View>
      ) : null}

      <Text
        style={{
          ...fonts.sansRegular,
          fontSize: 12.5,
          lineHeight: 18,
          color: mutedText,
          paddingHorizontal: 14,
        }}
      >
        {t.friendsPrivacyNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  segmentThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentTab: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  segmentCountPill: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    ...fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.9,
    paddingHorizontal: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  emptyCard: {
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  churchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  rowMainHit: {
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  acceptPill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
    gap: 8,
  },
  hymnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
