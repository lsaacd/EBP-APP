/**
 * FriendsPanel — the "Hermanos" page inside the account sheet: requests you
 * received, your friends (with their favourite hymns), people from your
 * church, requests you sent, and what you share. Tapping a person opens their
 * details in place (the sheet is already a modal; a second one would freeze
 * UIKit on iOS).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
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
  memberSinceLabel,
  type FriendFavorites,
  type FriendProfile,
  type FriendStatus,
  type SharedPlaylist,
} from '../utils/friends';
import { useFriends } from '../utils/friendsStore';
import AppMenuIcon from './AppMenuIcon';
import FriendButton from './FriendButton';

type Table = Record<string, [string, string]>;
type FavoritesState = { loading: boolean; error: boolean; data: FriendFavorites | null };

const FAVORITES_PREVIEW = 5;

export default function FriendsPanel({
  onOpenHymn,
  onOpenChurchesMap,
}: {
  onOpenHymn?: (hymnId: string) => void;
  onOpenChurchesMap?: () => void;
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
    fetchFavorites,
    markSharedPlaylistSeen,
    deleteSharedPlaylist,
  } = useFriends();
  const [openId, setOpenId] = useState<string | null>(null);
  const [openSharedId, setOpenSharedId] = useState<string | null>(null);
  const [savedSharedIds, setSavedSharedIds] = useState<Record<string, boolean>>({});
  const [deletingSharedId, setDeletingSharedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, FavoritesState>>({});
  const [showAllFor, setShowAllFor] = useState<string | null>(null);
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

  // Hymns and choruses by id, in the language the person reads hymns in.
  const hymnById = useMemo(() => {
    const map = new Map<string, { id: string; number: string; title: string }>();
    for (const raw of [...hymnsData, ...estribillosData]) {
      const hymn = getLocalizedHymn(raw as any, hymnLanguage) as any;
      map.set(String(raw.id), { id: String(raw.id), number: String(hymn.number), title: String(hymn.title) });
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

  const loadFavorites = (personId: string) => {
    if (favorites[personId]?.loading || favorites[personId]?.data) return;
    setFavorites((prev) => ({ ...prev, [personId]: { loading: true, error: false, data: null } }));
    fetchFavorites(personId)
      .then((data) =>
        setFavorites((prev) => ({ ...prev, [personId]: { loading: false, error: false, data } })),
      )
      .catch(() =>
        setFavorites((prev) => ({ ...prev, [personId]: { loading: false, error: true, data: null } })),
      );
  };

  const toggle = (person: FriendProfile, status: FriendStatus) => {
    Haptics.selectionAsync();
    const opening = openId !== person.id;
    setOpenId(opening ? person.id : null);
    setShowAllFor(null);
    if (opening && status === 'friends') loadFavorites(person.id);
  };

  const renderFavorites = (person: FriendProfile) => {
    const state = favorites[person.id];
    const note = (text: string) => (
      <Text style={{ ...fonts.sansRegular, fontSize: 13.5, color: mutedText }}>{text}</Text>
    );
    if (!state || state.loading) return <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start' }} />;
    if (state.error || !state.data) return note(t.friendsFavoritesError);
    if (!state.data.shared) return note(t.friendsFavoritesHidden);
    const known = state.data.favorites.map((id) => hymnById.get(id)).filter(Boolean) as {
      id: string;
      number: string;
      title: string;
    }[];
    if (known.length === 0) return note(t.friendsFavoritesEmpty);
    const all = showAllFor === person.id;
    const shown = all ? known : known.slice(0, FAVORITES_PREVIEW);
    return (
      <View style={{ gap: 2 }}>
        {shown.map((hymn) => (
          <Pressable
            key={hymn.id}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onOpenHymn?.(hymn.id);
            }}
            style={({ pressed }) => [styles.hymnRow, pressed && { opacity: 0.6 }]}
          >
            <Text style={{ ...fonts.bold, fontSize: 15, color: theme.primary, width: 44 }} numberOfLines={1}>
              {hymn.number}
            </Text>
            <Text style={{ ...fonts.sansRegular, fontSize: 14.5, color: theme.onSurface, flex: 1 }} numberOfLines={1}>
              {hymn.title}
            </Text>
            <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={11} weight="semibold" />
          </Pressable>
        ))}
        {!all && known.length > FAVORITES_PREVIEW ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAllFor(person.id);
            }}
            style={{ paddingVertical: 6 }}
          >
            <Text style={{ ...fonts.sansSemiBold, fontSize: 13.5, color: theme.primary }}>
              {t.friendsShowAll.replace('{n}', String(known.length))}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const section = (title: string, people: FriendProfile[], status: FriendStatus) => {
    if (people.length === 0) return null;
    return (
      <View style={{ gap: 8 }}>
        <Text style={[styles.sectionHeader, { color: mutedText }]}>{`${title} (${people.length})`}</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {people.map((person, index) => {
            const open = openId === person.id;
            const role = roleLine(person);
            const church = person.churchName ? churchDisplayName(person.churchName) : '';
            const since = memberSinceLabel(person.memberSince, es);
            return (
              <View key={person.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => toggle(person, status)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                    },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary }]}>
                    <Text style={{ ...fonts.sansBold, fontSize: 14, color: isDarkMode ? '#1A1A1A' : '#FFFFFF' }}>
                      {person.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text numberOfLines={1} style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface }}>
                      {person.name}
                    </Text>
                    {role ? (
                      <Text numberOfLines={1} style={{ ...fonts.sansRegular, fontSize: 13, color: mutedText }}>
                        {role}
                      </Text>
                    ) : null}
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
                    {church ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="building.columns" android="account-balance" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{church}</Text>
                      </View>
                    ) : null}
                    {person.location ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="mappin.and.ellipse" android="place" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{person.location}</Text>
                      </View>
                    ) : null}
                    {since ? (
                      <View style={styles.detailLine}>
                        <AppMenuIcon ios="calendar" android="event" color={mutedText} size={15} />
                        <Text style={[styles.detailText, { color: theme.onSurface }]}>{since}</Text>
                      </View>
                    ) : null}

                    {status === 'friends' ? (
                      <View style={{ gap: 6, marginTop: 2 }}>
                        <Text style={[styles.subHeader, { color: mutedText }]}>{t.friendsFavorites}</Text>
                        {renderFavorites(person)}
                      </View>
                    ) : null}

                    <FriendButton
                      userId={person.id}
                      name={person.name}
                      status={status}
                      compact
                      onStatusChange={() => setOpenId(null)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const saveSwitch = (key: 'shareFavoritesWithFriends' | 'suggestToChurchMembers', value: boolean) => {
    if (savingSwitch) return;
    Haptics.selectionAsync();
    setSavingSwitch(key);
    updateProfile({ [key]: value })
      .then(() => {
        if (key === 'suggestToChurchMembers') void refreshSuggestions();
      })
      .catch((e) => Alert.alert(t.churchError, communityError(e, language === 'es')))
      .finally(() => setSavingSwitch(null));
  };

  const switchRow = (
    key: 'shareFavoritesWithFriends' | 'suggestToChurchMembers',
    title: string,
    subtitle: string,
    value: boolean,
  ) => (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...fonts.sansMedium, fontSize: 15.5, color: theme.onSurface }}>{title}</Text>
        <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 17, color: mutedText }}>{subtitle}</Text>
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
      .catch((e) => Alert.alert(t.churchError, communityError(e, es)))
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
            const countLabel = `${known.length} ${known.length === 1 ? t.songCount_one : t.songCount_other}`;
            const senderLabel = t.friendsSharedBy.replace('{name}', item.fromName);
            return (
              <View key={item.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => toggleSharedPlaylist(item)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isDarkMode ? 'rgba(181,69,69,0.24)' : theme.primary + '16',
                      },
                    ]}
                  >
                    <AppMenuIcon
                      ios="music.note.list"
                      android="queue-music"
                      color={isDarkMode ? '#F0A8A8' : theme.primary}
                      size={19}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        numberOfLines={1}
                        style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface, flexShrink: 1 }}
                      >
                        {item.name}
                      </Text>
                      {!item.seen ? (
                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 999,
                            backgroundColor: '#D64545',
                          }}
                        >
                          <Text style={{ ...fonts.sansBold, fontSize: 10.5, color: '#FFFFFF' }}>
                            {t.friendsSharedNewBadge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text numberOfLines={1} style={{ ...fonts.sansRegular, fontSize: 13, color: mutedText }}>
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
                          <Text style={{ ...fonts.bold, fontSize: 15, color: theme.primary, width: 44 }} numberOfLines={1}>
                            {hymn.number}
                          </Text>
                          <Text style={{ ...fonts.sansRegular, fontSize: 14.5, color: theme.onSurface, flex: 1 }} numberOfLines={1}>
                            {hymn.title}
                          </Text>
                          <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={11} weight="semibold" />
                        </Pressable>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={saved || known.length === 0}
                        onPress={() => handleSaveSharedPlaylist(item)}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 40,
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: saved
                            ? isDarkMode
                              ? 'rgba(52,199,89,0.20)'
                              : 'rgba(52,199,89,0.14)'
                            : theme.primary,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <AppMenuIcon
                          ios={saved ? 'checkmark' : 'plus'}
                          android={saved ? 'check' : 'playlist-add'}
                          color={saved ? '#34C759' : theme.onPrimary}
                          size={15}
                          weight="semibold"
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            ...fonts.sansSemiBold,
                            fontSize: 13.5,
                            color: saved ? '#34C759' : theme.onPrimary,
                          }}
                        >
                          {saved ? t.friendsPlaylistSaved : t.friendsSavePlaylist}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={deletingSharedId === item.id}
                        onPress={() => handleDeleteSharedPlaylist(item)}
                        style={({ pressed }) => ({
                          minHeight: 40,
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.surfaceVariants.containerHigh,
                          opacity: deletingSharedId === item.id ? 0.5 : pressed ? 0.75 : 1,
                        })}
                      >
                        <Text style={{ ...fonts.sansSemiBold, fontSize: 13.5, color: mutedText }}>
                          {t.friendsRemoveSharedPlaylist}
                        </Text>
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

  const nobody =
    lists.friends.length +
      lists.incoming.length +
      lists.outgoing.length +
      suggestions.users.length +
      churchMembers.length +
      sharedPlaylists.length ===
    0;

  const renderMyChurchMembersSection = () => {
    if (!hasLinkedChurch) return null;
    const headerTitle = myChurchLabel
      ? t.friendsChurchMembersTitle.replace('{church}', myChurchLabel.toUpperCase())
      : t.friendsFromMyChurch;
    const nextOffset = directoryMatchesChurch ? suggestions.churchMembersNextOffset : null;
    return (
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
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
              <AppMenuIcon ios="building.columns" android="account-balance" color={mutedText} size={20} />
              <Text style={{ flex: 1, ...fonts.sansRegular, fontSize: 13.5, lineHeight: 19, color: mutedText }}>
                {t.friendsChurchMembersEmpty.replace('{church}', myChurchLabel || t.friendsFromMyChurch.toLowerCase())}
              </Text>
            </View>
          ) : (
            churchMembers.map((person, index) => {
              const rowKey = `church:${person.id}`;
              const open = openId === rowKey;
              const role = roleLine(person);
              const since = memberSinceLabel(person.memberSince, es);
              const badgeText =
                person.friendStatus === 'friends'
                  ? t.churchMembersBadgeFriend
                  : person.friendStatus === 'outgoing' || person.friendStatus === 'incoming'
                    ? t.churchMembersBadgePending
                    : null;
              return (
                <View key={person.id}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: divider }]} />}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const opening = openId !== rowKey;
                      setOpenId(opening ? rowKey : null);
                      if (opening && person.friendStatus === 'friends') void loadFavorites(person.id);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : theme.primary + '0D',
                      },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                      <Text style={{ ...fonts.sansBold, fontSize: 14, color: isDarkMode ? '#1A1A1A' : '#FFFFFF' }}>
                        {person.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text numberOfLines={1} style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface }}>
                        {person.name}
                      </Text>
                      {role ? (
                        <Text numberOfLines={1} style={{ ...fonts.sansRegular, fontSize: 13, color: mutedText }}>
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
                      {since ? (
                        <View style={styles.detailLine}>
                          <AppMenuIcon ios="calendar" android="event" color={mutedText} size={15} />
                          <Text style={[styles.detailText, { color: theme.onSurface }]}>{since}</Text>
                        </View>
                      ) : null}
                      {person.friendStatus === 'friends' ? (
                        <View style={{ gap: 6, marginTop: 2 }}>
                          <Text style={[styles.subHeader, { color: mutedText }]}>{t.friendsFavorites}</Text>
                          {renderFavorites(person)}
                        </View>
                      ) : null}
                      <FriendButton
                        userId={person.id}
                        name={person.name}
                        status={person.friendStatus}
                        compact
                        onStatusChange={() => {
                          setOpenId(null);
                          void refreshSuggestions();
                        }}
                      />
                    </View>
                  )}
                </View>
              );
            })
          )}
          {nextOffset !== null && (
            <Pressable accessibilityRole="button" onPress={() => void refreshSuggestions(nextOffset)} style={{ padding: 14 }}>
              <Text style={{ ...fonts.sansSemiBold, color: theme.primary }}>{t.churchMembersLoadMore}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ gap: 18 }}>
      {section(t.friendsRequests, lists.incoming, 'incoming')}
      {renderSharedPlaylistsSection()}
      {section(t.friendsMine, lists.friends, 'friends')}
      {hasLinkedChurch
        ? renderMyChurchMembersSection()
        : section(t.friendsFromMyChurch, suggestions.users, 'none')}
      {section(t.friendsSent, lists.outgoing, 'outgoing')}

      {nobody && !hasLinkedChurch && (
        <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <AppMenuIcon ios="person.2" android="group" color={mutedText} size={30} />
              <Text style={{ ...fonts.sansSemiBold, fontSize: 16, color: theme.onSurface, textAlign: 'center' }}>
                {t.friendsEmptyTitle}
              </Text>
              <Text style={{ ...fonts.sansRegular, fontSize: 14, lineHeight: 20, color: mutedText, textAlign: 'center' }}>
                {t.friendsEmptyBody}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Without a linked church there is nobody to suggest: offer the way to link one. */}
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
          <AppMenuIcon ios="building.columns" android="account-balance" color={theme.primary} size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...fonts.sansSemiBold, fontSize: 15, color: theme.onSurface }}>{t.friendsNoChurchTitle}</Text>
            <Text style={{ ...fonts.sansRegular, fontSize: 13, lineHeight: 18, color: mutedText }}>{t.friendsNoChurchBody}</Text>
          </View>
          <AppMenuIcon ios="chevron.right" android="chevron-right" color={mutedText} size={13} weight="semibold" />
        </Pressable>
      ) : null}

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
              'suggestToChurchMembers',
              t.friendsSuggestMe,
              t.friendsSuggestMeSub,
              user.suggestToChurchMembers,
            )}
          </View>
        </View>
      ) : null}

      <Text style={{ ...fonts.sansRegular, fontSize: 12.5, lineHeight: 18, color: mutedText, paddingHorizontal: 14 }}>
        {t.friendsPrivacyNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { ...fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.9, paddingHorizontal: 14 },
  subHeader: { ...fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 0.9 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  emptyCard: { padding: 22, alignItems: 'center', gap: 8 },
  churchPrompt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  row: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  details: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8 },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  detailText: { ...fonts.sansRegular, fontSize: 14.5, flex: 1 },
  hymnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
});
