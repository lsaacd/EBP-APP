/**
 * FriendsScreen (iOS 26 Native SwiftUI Form) — Clean people-first Friends hub.
 *
 * Moves the 4 Privacy switches + explanatory note out of the main feed into a
 * native SwiftUI Liquid Glass BottomSheet opened from the header shield button,
 * keeping the main view calm and focused on Friends, Requests / Shared Playlists,
 * and Congregation members with native SwipeActions and ContentUnavailableView.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { MINISTRIES, choirDisplayName } from '../../data/communityRules';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import { communityError } from '../../utils/communityApi';
import { churchDisplayName } from '../../utils/churchName';
import {
  type FriendProfile,
  type FriendStatus,
  type SharedPlaylist,
} from '../../utils/friends';
import { useFriends } from '../../utils/friendsStore';
import { seedMemberPreview } from '../../utils/memberProfileCache';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { showSuccessToast } from '../../utils/toast';
import UserAvatar from '../UserAvatar';
import type { FriendsScreenProps } from './FriendsScreen';

type Table = Record<string, [string, string]>;
type FriendsTab = 'friends' | 'requests' | 'church';

export default function FriendsScreenIOS({
  privacySheetOpen,
  onPrivacySheetOpenChange,
  onOpenChurchesMap,
  onOpenHymn,
  onOpenMember,
}: FriendsScreenProps) {
  const swiftUI = getExpoSwiftUI();
  const { theme, isDarkMode } = useTheme();
  const { language, hymnLanguage, t } = useLanguage();
  const { user, updateProfile, refreshUser } = useAuth();
  const { importPlaylist } = usePlaylists();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const es = language !== 'en';
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const {
    lists,
    suggestions,
    sharedPlaylists,
    loading,
    refresh,
    refreshSuggestions,
    request: requestFriend,
    accept: acceptFriend,
    remove: removeFriend,
    markSharedPlaylistSeen,
    deleteSharedPlaylist,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [openSharedId, setOpenSharedId] = useState<string | null>(null);
  const [savedSharedIds, setSavedSharedIds] = useState<Record<string, boolean>>({});
  const [deletingSharedId, setDeletingSharedId] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
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

  useEffect(() => {
    for (const friend of lists.friends) {
      seedMemberPreview({
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        avatarUrl: friend.avatarUrl ?? null,
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

  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;

  const hymnById = useMemo(() => {
    const map = new Map<string, { id: string; number: string; title: string }>();
    for (const raw of [...hymnsData, ...estribillosData]) {
      const hymn = getLocalizedHymn(raw as any, displayHymnLang) as any;
      map.set(String(raw.id), {
        id: String(raw.id),
        number: String(hymn.number),
        title: String(hymn.title),
      });
    }
    return map;
  }, [displayHymnLang]);

  const roleLine = useCallback(
    (person: FriendProfile) =>
      [
        person.ministry ? (MINISTRIES as Table)[person.ministry]?.[es ? 0 : 1] : null,
        person.choir ? choirDisplayName(person.choir, es, choirsBySlug) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    [choirsBySlug, es],
  );

  const openMemberPage = useCallback(
    (person: FriendProfile, status: FriendStatus) => {
      Haptics.selectionAsync().catch(() => {});
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
        friendStatus: status,
      });
      onOpenMember(person.id);
    },
    [onOpenMember],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), refreshSuggestions()]);
  }, [refresh, refreshSuggestions]);

  const handleAcceptRequest = useCallback(
    (person: FriendProfile) => {
      if (actingUserId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActingUserId(person.id);
      acceptFriend(person.id)
        .then(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        })
        .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setActingUserId(null));
    },
    [acceptFriend, actingUserId, es, t.churchError],
  );

  const handleDeclineOrCancel = useCallback(
    (person: FriendProfile) => {
      if (actingUserId) return;
      Haptics.selectionAsync().catch(() => {});
      setActingUserId(person.id);
      removeFriend(person.id)
        .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setActingUserId(null));
    },
    [actingUserId, es, removeFriend, t.churchError],
  );

  const handleConfirmRemoveFriend = useCallback(
    (person: FriendProfile) => {
      if (actingUserId) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert(t.friendsRemoveTitle, person.name, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.friendsRemove,
          style: 'destructive',
          onPress: () => {
            setActingUserId(person.id);
            removeFriend(person.id)
              .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
              .finally(() => setActingUserId(null));
          },
        },
      ]);
    },
    [actingUserId, es, removeFriend, t.cancel, t.churchError, t.friendsRemove, t.friendsRemoveTitle],
  );

  const handleSendFriendRequest = useCallback(
    (person: FriendProfile) => {
      if (actingUserId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActingUserId(person.id);
      requestFriend(person.id)
        .then(() => {
          showSuccessToast(t.friendsRequestSent);
        })
        .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setActingUserId(null));
    },
    [actingUserId, es, requestFriend, t.churchError, t.friendsRequestSent],
  );

  const handleSaveSharedPlaylist = useCallback(
    (item: SharedPlaylist) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      importPlaylist(item.name, item.hymnIds);
      setSavedSharedIds((prev) => ({ ...prev, [item.id]: true }));
      showSuccessToast(t.friendsPlaylistSaved);
      if (!item.seen) {
        void markSharedPlaylistSeen(item.id);
      }
    },
    [importPlaylist, markSharedPlaylistSeen, t.friendsPlaylistSaved],
  );

  const handleDeleteSharedPlaylist = useCallback(
    (item: SharedPlaylist) => {
      if (deletingSharedId) return;
      Haptics.selectionAsync().catch(() => {});
      setDeletingSharedId(item.id);
      deleteSharedPlaylist(item.id)
        .then(() => {
          if (openSharedId === item.id) setOpenSharedId(null);
        })
        .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setDeletingSharedId(null));
    },
    [deleteSharedPlaylist, deletingSharedId, es, openSharedId, t.churchError],
  );

  const handleSavePrivacySwitch = useCallback(
    (
      key:
        | 'shareFavoritesWithFriends'
        | 'showFriendsList'
        | 'suggestToChurchMembers'
        | 'directoryVisibleToAll',
      value: boolean,
    ) => {
      if (savingSwitch) return;
      Haptics.selectionAsync().catch(() => {});
      setSavingSwitch(key);
      updateProfile({ [key]: value })
        .then(() => {
          showSuccessToast(t.profileVisibilitySaved);
          if (key === 'suggestToChurchMembers' || key === 'directoryVisibleToAll') {
            void refreshSuggestions();
          }
        })
        .catch((e: unknown) => Alert.alert(t.churchError, communityError(e, es)))
        .finally(() => setSavingSwitch(null));
    },
    [es, refreshSuggestions, savingSwitch, t.churchError, t.profileVisibilitySaved, updateProfile],
  );

  if (!swiftUI || !user) return null;

  const {
    BottomSheet,
    Button,
    Circle,
    ContentUnavailableView,
    DisclosureGroup,
    Form,
    Group,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    NavigationStack,
    Picker,
    ProgressView,
    RNHostView,
    Section,
    Spacer,
    SwipeActions,
    Text,
    Toggle,
    Toolbar,
    ToolbarItem,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    buttonBorderShape,
    buttonStyle,
    contentShape,
    controlSize,
    disabled,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    listRowBackground,
    listRowInsets,
    listSectionMargins,
    listSectionSpacing,
    padding,
    pickerStyle,
    preferredColorScheme,
    presentationDetents,
    presentationDragIndicator,
    refreshable,
    scrollEdgeEffectStyle,
    shapes,
    tag,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const prominentFill = isDarkMode ? '#fdf9f2' : '#6e1619';
  const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
  const avatarBg = isDarkMode ? '#F3EEE8' : '#6e1619';
  const avatarText = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const toggleTint = isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary;
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const bottomPad = hasMiniPlayer ? 92 : 28;
  const hasRNHost = typeof RNHostView === 'function';

  const hasLinkedChurch = Boolean(user.churchId) || suggestions.hasChurch;
  const myChurchLabel = churchDisplayName(
    suggestions.churchName || user.churchName || '',
  );
  const directoryMatchesChurch = !user.churchId || user.churchId === suggestions.churchId;
  const churchMembers = directoryMatchesChurch ? suggestions.churchMembers : [];
  const nextOffset = directoryMatchesChurch ? suggestions.churchMembersNextOffset : null;
  const requestsBadgeCount =
    lists.incoming.length + sharedPlaylists.filter((p) => !p.seen).length;

  const chevron = (
    <SwiftUIImage
      systemName="chevron.right"
      size={13}
      modifiers={[foregroundStyle(tertiaryStyle)]}
    />
  );

  const renderAvatar = (person: { initials: string; avatarUrl?: string | null }) => {
    if (person.avatarUrl && hasRNHost) {
      return (
        <ZStack modifiers={[frame({ width: 40, height: 40 })]}>
          <RNHostView matchContents>
            <UserAvatar
              uri={person.avatarUrl}
              initials={person.initials}
              size={40}
              fontSize={14}
              backgroundColor={avatarBg}
              textColor={avatarText}
            />
          </RNHostView>
        </ZStack>
      );
    }
    return (
      <ZStack modifiers={[frame({ width: 40, height: 40 })]}>
        <Circle modifiers={[foregroundStyle({ type: 'color', color: avatarBg })]} />
        <Text
          modifiers={[
            font({ size: 14, weight: 'semibold' }),
            foregroundStyle({ type: 'color', color: avatarText }),
          ]}
        >
          {person.initials}
        </Text>
      </ZStack>
    );
  };

  const renderTintedIcon = (systemImage: SFSymbol, size?: number) => (
    <SwiftUIImage
      systemName={systemImage}
      size={size}
      modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
    />
  );

  const renderFriendRow = (person: FriendProfile, status: FriendStatus) => {
    const role = roleLine(person);
    const church = person.churchName ? churchDisplayName(person.churchName) : '';
    const subtitle = [role, church].filter(Boolean).join(' · ');
    const isActing = actingUserId === person.id;

    const rowCore = (
      <HStack alignment="center" spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        {renderAvatar(person)}
        <VStack alignment="leading" spacing={2}>
          <HStack alignment="center" spacing={5}>
            <Text
              modifiers={[
                font({ textStyle: 'body', weight: 'semibold' }),
                lineLimit(1),
                truncationMode('tail'),
              ]}
            >
              {person.name}
            </Text>
            {person.badgeVerified && person.ministry === 'obispo' ? (
              <SwiftUIImage
                systemName="checkmark.seal.fill"
                size={13}
                modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
              />
            ) : null}
          </HStack>
          {subtitle ? (
            <Text
              modifiers={[
                font({ textStyle: 'footnote' }),
                foregroundStyle(secondaryStyle),
                lineLimit(1),
                truncationMode('tail'),
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </VStack>
        <Spacer />
        {status === 'incoming' ? (
          <HStack alignment="center" spacing={8}>
            <Button
              onPress={() => handleAcceptRequest(person)}
              modifiers={[
                buttonStyle('borderedProminent'),
                buttonBorderShape('capsule'),
                controlSize('small'),
                tint(prominentFill),
                disabled(Boolean(actingUserId)),
              ]}
            >
              {isActing ? (
                <ProgressView />
              ) : (
                <Text
                  modifiers={[
                    font({ textStyle: 'footnote', weight: 'semibold' }),
                    foregroundStyle({ type: 'color', color: prominentInk }),
                  ]}
                >
                  {t.friendsAccept}
                </Text>
              )}
            </Button>
            <Button
              onPress={() => handleDeclineOrCancel(person)}
              modifiers={[
                buttonStyle('bordered'),
                buttonBorderShape('circle'),
                controlSize('small'),
                disabled(Boolean(actingUserId)),
              ]}
            >
              <SwiftUIImage systemName="xmark" size={11} />
            </Button>
          </HStack>
        ) : status === 'none' ? (
          <Button
            onPress={() => handleSendFriendRequest(person)}
            modifiers={[
              buttonStyle('borderedProminent'),
              buttonBorderShape('capsule'),
              controlSize('small'),
              tint(prominentFill),
              disabled(Boolean(actingUserId)),
            ]}
          >
            {isActing ? (
              <ProgressView />
            ) : (
              <Text
                modifiers={[
                  font({ textStyle: 'footnote', weight: 'semibold' }),
                  foregroundStyle({ type: 'color', color: prominentInk }),
                ]}
              >
                {t.friendsAdd}
              </Text>
            )}
          </Button>
        ) : (
          chevron
        )}
      </HStack>
    );

    const tappableRow = (
      <Button
        modifiers={[foregroundStyle(primaryStyle)]}
        onPress={() => openMemberPage(person, status)}
      >
        {rowCore}
      </Button>
    );

    if (status === 'friends') {
      return (
        <SwipeActions key={person.id}>
          {tappableRow}
          <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
            <Button
              role="destructive"
              label={t.friendsRemove}
              systemImage="person.badge.minus"
              onPress={() => handleConfirmRemoveFriend(person)}
            />
          </SwipeActions.Actions>
        </SwipeActions>
      );
    }

    if (status === 'incoming') {
      return (
        <SwipeActions key={person.id}>
          {tappableRow}
          <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
            <Button
              role="destructive"
              label={t.friendsDecline}
              systemImage="xmark"
              onPress={() => handleDeclineOrCancel(person)}
            />
          </SwipeActions.Actions>
        </SwipeActions>
      );
    }

    if (status === 'outgoing') {
      return (
        <SwipeActions key={person.id}>
          {tappableRow}
          <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
            <Button
              role="destructive"
              label={t.friendsCancelRequest}
              systemImage="xmark"
              onPress={() => handleDeclineOrCancel(person)}
            />
          </SwipeActions.Actions>
        </SwipeActions>
      );
    }

    return <Group key={person.id}>{tappableRow}</Group>;
  };

  const renderSharedPlaylistsSection = () => {
    if (sharedPlaylists.length === 0) return null;
    return (
      <Section title={`${t.friendsSharedPlaylists} (${sharedPlaylists.length})`}>
        {sharedPlaylists.map((item) => {
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
            <DisclosureGroup
              key={item.id}
              isExpanded={open}
              onIsExpandedChange={(nextOpen) => {
                Haptics.selectionAsync().catch(() => {});
                setOpenSharedId(nextOpen ? item.id : null);
                if (nextOpen && !item.seen) {
                  void markSharedPlaylistSeen(item.id);
                }
              }}
            >
              <DisclosureGroup.Label>
                <Label icon={renderTintedIcon('music.note.list', 18)}>
                  <VStack alignment="leading" spacing={2}>
                    <Text
                      modifiers={[
                        font({ textStyle: 'body', weight: 'semibold' }),
                        lineLimit(1),
                        truncationMode('tail'),
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote' }),
                        foregroundStyle(secondaryStyle),
                        lineLimit(1),
                        truncationMode('tail'),
                      ]}
                    >
                      {`${senderLabel} · ${countLabel}`}
                    </Text>
                  </VStack>
                </Label>
              </DisclosureGroup.Label>

              {known.map((hymn) => (
                <Button
                  key={hymn.id}
                  modifiers={[foregroundStyle(primaryStyle)]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onOpenHymn(hymn.id);
                  }}
                >
                  <HStack
                    alignment="center"
                    spacing={10}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline', weight: 'bold' }),
                        foregroundStyle({ type: 'color', color: symbolTint }),
                        frame({ width: 42, alignment: 'leading' }),
                      ]}
                    >
                      {hymn.number}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        lineLimit(1),
                        truncationMode('tail'),
                      ]}
                    >
                      {hymn.title}
                    </Text>
                    <Spacer />
                    {chevron}
                  </HStack>
                </Button>
              ))}

              <HStack alignment="center" spacing={10}>
                <Button
                  onPress={() => handleSaveSharedPlaylist(item)}
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    controlSize('small'),
                    tint(prominentFill),
                    disabled(saved || known.length === 0),
                  ]}
                >
                  <Text
                    modifiers={[
                      font({ textStyle: 'footnote', weight: 'semibold' }),
                      foregroundStyle({ type: 'color', color: prominentInk }),
                    ]}
                  >
                    {saved ? t.friendsPlaylistSaved : t.friendsSavePlaylist}
                  </Text>
                </Button>
                <Spacer />
                <Button
                  role="destructive"
                  onPress={() => handleDeleteSharedPlaylist(item)}
                  modifiers={[
                    buttonStyle('borderless'),
                    disabled(deletingSharedId === item.id),
                  ]}
                >
                  <SwiftUIImage systemName="trash" size={15} />
                </Button>
              </HStack>
            </DisclosureGroup>
          );
        })}
      </Section>
    );
  };

  const renderChurchTab = () => {
    if (!hasLinkedChurch) {
      return (
        <>
          {suggestions.users.length > 0 ? (
            <Section title={`${t.friendsFromMyChurch} (${suggestions.users.length})`}>
              {suggestions.users.map((person) => renderFriendRow(person, 'none'))}
            </Section>
          ) : null}
          <Section
            footer={
              <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                <Text> </Text>
              </VStack>
            }
          >
            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onOpenChurchesMap();
              }}
            >
              <HStack
                alignment="center"
                spacing={10}
                modifiers={[contentShape(shapes.rectangle())]}
              >
                <Label icon={renderTintedIcon('building.columns', 18)}>
                  <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                      {t.friendsNoChurchTitle}
                    </Text>
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {t.friendsNoChurchBody}
                    </Text>
                  </VStack>
                </Label>
                <Spacer />
                {chevron}
              </HStack>
            </Button>
          </Section>
        </>
      );
    }

    const headerTitle = myChurchLabel
      ? t.friendsChurchMembersTitle.replace('{church}', myChurchLabel.toUpperCase())
      : t.friendsFromMyChurch;

    return (
      <>
        <Section
          title={headerTitle}
          footer={
            <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
              <Text> </Text>
            </VStack>
          }
        >
          {churchMembers.length === 0 ? (
            <ContentUnavailableView
              title={myChurchLabel || t.friendsTabChurch}
              systemImage="building.columns"
              description={t.friendsChurchMembersEmpty.replace(
                '{church}',
                myChurchLabel || t.friendsFromMyChurch.toLowerCase(),
              )}
              modifiers={[padding({ top: 12, bottom: 12 })]}
            />
          ) : (
            churchMembers.map((person) => {
              const role = roleLine(person);
              const badgeText =
                person.friendStatus === 'friends'
                  ? t.churchMembersBadgeFriend
                  : person.friendStatus === 'outgoing' || person.friendStatus === 'incoming'
                    ? t.churchMembersBadgePending
                    : null;
              const isActing = actingUserId === person.id;

              return (
                <Button
                  key={person.id}
                  modifiers={[foregroundStyle(primaryStyle)]}
                  onPress={() => openMemberPage(person, person.friendStatus)}
                >
                  <HStack
                    alignment="center"
                    spacing={12}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    {renderAvatar(person)}
                    <VStack alignment="leading" spacing={2}>
                      <HStack alignment="center" spacing={5}>
                        <Text
                          modifiers={[
                            font({ textStyle: 'body', weight: 'semibold' }),
                            lineLimit(1),
                            truncationMode('tail'),
                          ]}
                        >
                          {person.name}
                        </Text>
                        {person.badgeVerified && person.ministry === 'obispo' ? (
                          <SwiftUIImage
                            systemName="checkmark.seal.fill"
                            size={13}
                            modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                          />
                        ) : null}
                      </HStack>
                      {role ? (
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                            lineLimit(1),
                            truncationMode('tail'),
                          ]}
                        >
                          {role}
                        </Text>
                      ) : null}
                    </VStack>
                    <Spacer />
                    {person.friendStatus === 'none' ? (
                      <Button
                        onPress={() => handleSendFriendRequest(person)}
                        modifiers={[
                          buttonStyle('borderedProminent'),
                          buttonBorderShape('capsule'),
                          controlSize('small'),
                          tint(prominentFill),
                          disabled(Boolean(actingUserId)),
                        ]}
                      >
                        {isActing ? (
                          <ProgressView />
                        ) : (
                          <Text
                            modifiers={[
                              font({ textStyle: 'footnote', weight: 'semibold' }),
                              foregroundStyle({ type: 'color', color: prominentInk }),
                            ]}
                          >
                            {t.friendsAdd}
                          </Text>
                        )}
                      </Button>
                    ) : (
                      <HStack alignment="center" spacing={6}>
                        {badgeText ? (
                          <Text
                            modifiers={[
                              font({ textStyle: 'caption', weight: 'semibold' }),
                              foregroundStyle(
                                person.friendStatus === 'friends'
                                  ? { type: 'color', color: '#34C759' }
                                  : secondaryStyle,
                              ),
                            ]}
                          >
                            {badgeText}
                          </Text>
                        ) : null}
                        {chevron}
                      </HStack>
                    )}
                  </HStack>
                </Button>
              );
            })
          )}

          {nextOffset !== null ? (
            <Button
              label={t.churchMembersLoadMore}
              onPress={() => void refreshSuggestions(nextOffset)}
            />
          ) : null}

          <Button
            modifiers={[foregroundStyle(primaryStyle)]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onOpenChurchesMap();
            }}
          >
            <HStack
              alignment="center"
              spacing={10}
              modifiers={[contentShape(shapes.rectangle())]}
            >
              <Label
                title={t.friendsChurchViewMap}
                icon={renderTintedIcon('map.fill', 16)}
              />
              <Spacer />
              {chevron}
            </HStack>
          </Button>
        </Section>
      </>
    );
  };

  return (
    <>
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollEdgeEffectStyle('soft', 'all'),
            refreshable(handleRefresh),
          ]}
        >
          {/* ── Native iOS 26 Segmented Picker ── */}
          <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
            <Picker
              selection={activeTab}
              onSelectionChange={(next) => {
                if (next === 'friends' || next === 'requests' || next === 'church') {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveTab(next);
                }
              }}
              modifiers={[
                pickerStyle('segmented'),
                listRowBackground('clear'),
                listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
              ]}
            >
              <Text modifiers={[tag('friends')]}>
                {lists.friends.length > 0
                  ? `${t.friendsTabMine} (${lists.friends.length})`
                  : t.friendsTabMine}
              </Text>
              <Text modifiers={[tag('requests')]}>
                {requestsBadgeCount > 0
                  ? `${t.friendsTabRequests} (${requestsBadgeCount})`
                  : t.friendsTabRequests}
              </Text>
              <Text modifiers={[tag('church')]}>
                {churchMembers.length > 0
                  ? `${t.friendsTabChurch} (${churchMembers.length})`
                  : t.friendsTabChurch}
              </Text>
            </Picker>
          </Section>

          {/* ── Tab 1: Friends ── */}
          {activeTab === 'friends' ? (
            lists.friends.length > 0 ? (
              <Section
                title={`${t.friendsMine} (${lists.friends.length})`}
                footer={
                  <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                    <Text> </Text>
                  </VStack>
                }
              >
                {lists.friends.map((person) => renderFriendRow(person, 'friends'))}
              </Section>
            ) : (
              <Section
                footer={
                  <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                    <Text> </Text>
                  </VStack>
                }
              >
                {loading ? (
                  <HStack
                    alignment="center"
                    modifiers={[
                      frame({ maxWidth: Infinity, alignment: 'center' }),
                      padding({ top: 28, bottom: 28 }),
                      listRowBackground('clear'),
                    ]}
                  >
                    <ProgressView />
                  </HStack>
                ) : (
                  <ContentUnavailableView
                    title={t.friendsEmptyTitle}
                    systemImage="person.2"
                    description={t.friendsEmptyBody}
                    modifiers={[
                      listRowBackground('clear'),
                      padding({ top: 28, bottom: 20 }),
                    ]}
                  />
                )}
              </Section>
            )
          ) : null}

          {/* ── Tab 2: Requests & Shared Playlists ── */}
          {activeTab === 'requests' ? (
            <>
              {lists.incoming.length > 0 ? (
                <Section title={`${t.friendsRequests} (${lists.incoming.length})`}>
                  {lists.incoming.map((person) => renderFriendRow(person, 'incoming'))}
                </Section>
              ) : null}
              {renderSharedPlaylistsSection()}
              {lists.outgoing.length > 0 ? (
                <Section title={`${t.friendsSent} (${lists.outgoing.length})`}>
                  {lists.outgoing.map((person) => renderFriendRow(person, 'outgoing'))}
                </Section>
              ) : null}
              {lists.incoming.length === 0 &&
              lists.outgoing.length === 0 &&
              sharedPlaylists.length === 0 ? (
                <Section
                  footer={
                    <VStack alignment="leading" modifiers={[padding({ bottom: bottomPad })]}>
                      <Text> </Text>
                    </VStack>
                  }
                >
                  <ContentUnavailableView
                    title={t.friendsTabRequests}
                    systemImage="tray"
                    description={t.friendsEmptyBody}
                    modifiers={[
                      listRowBackground('clear'),
                      padding({ top: 28, bottom: 20 }),
                    ]}
                  />
                </Section>
              ) : null}
            </>
          ) : null}

          {/* ── Tab 3: Congregation Members ── */}
          {activeTab === 'church' ? renderChurchTab() : null}
        </Form>
      </Host>

      {/* ── Native Liquid Glass Privacy BottomSheet (opened from top-right shield button) ── */}
      <Host
        style={{ position: 'absolute', width: 0, height: 0 }}
        colorScheme={scheme}
        seedColor={symbolTint}
      >
        <BottomSheet
          isPresented={privacySheetOpen}
          onIsPresentedChange={onPrivacySheetOpenChange}
        >
          <Group
            modifiers={[
              presentationDetents(['medium', 'large']),
              presentationDragIndicator('visible'),
              preferredColorScheme(scheme),
            ]}
          >
            <NavigationStack>
              <Toolbar>
                <Form
                  modifiers={[
                    tint(symbolTint),
                    listSectionSpacing('compact'),
                    scrollEdgeEffectStyle('soft', 'all'),
                  ]}
                >
                  <Section
                    title={t.friendsPrivacy}
                    footer={<Text>{t.friendsPrivacyNote}</Text>}
                  >
                    <Toggle
                      isOn={user.shareFavoritesWithFriends}
                      onIsOnChange={(next) =>
                        handleSavePrivacySwitch('shareFavoritesWithFriends', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.friendsShareFavorites}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.friendsShareFavoritesSub}
                        </Text>
                      </VStack>
                    </Toggle>

                    <Toggle
                      isOn={user.showFriendsList}
                      onIsOnChange={(next) =>
                        handleSavePrivacySwitch('showFriendsList', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.friendsShowList}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.friendsShowListSub}
                        </Text>
                      </VStack>
                    </Toggle>

                    <Toggle
                      isOn={user.suggestToChurchMembers}
                      onIsOnChange={(next) =>
                        handleSavePrivacySwitch('suggestToChurchMembers', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.friendsSuggestMe}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.friendsSuggestMeSub}
                        </Text>
                      </VStack>
                    </Toggle>

                    <Toggle
                      isOn={user.directoryVisibleToAll}
                      onIsOnChange={(next) =>
                        handleSavePrivacySwitch('directoryVisibleToAll', next)
                      }
                      modifiers={[tint(toggleTint), disabled(savingSwitch !== null)]}
                    >
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'body' })]}>
                          {t.friendsDirectoryAll}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {t.friendsDirectoryAllSub}
                        </Text>
                      </VStack>
                    </Toggle>
                  </Section>
                </Form>

                <Toolbar.Content>
                  <ToolbarItem placement="principal">
                    <Text
                      modifiers={[
                        font({ textStyle: 'headline', weight: 'semibold' }),
                        foregroundStyle(primaryStyle),
                      ]}
                    >
                      {t.friendsPrivacyTitle}
                    </Text>
                  </ToolbarItem>
                  <ToolbarItem placement="confirmationAction">
                    <Button
                      label={t.done}
                      onPress={() => onPrivacySheetOpenChange(false)}
                      modifiers={[foregroundStyle(primaryStyle)]}
                    />
                  </ToolbarItem>
                </Toolbar.Content>
              </Toolbar>
            </NavigationStack>
          </Group>
        </BottomSheet>
      </Host>
    </>
  );
}
