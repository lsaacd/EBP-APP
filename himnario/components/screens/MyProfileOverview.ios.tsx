/**
 * MyProfileOverview (iOS 26 Native SwiftUI Form) — Modeled after Oyelo & Inkigo's Form UI.
 *
 * Uses @expo/ui/swift-ui `Form`, `Section`, `LabeledContent`, `Label`, `Button`,
 * `Image`, `Spacer`, `Circle`, `ZStack`, and `refreshable` pull-to-refresh inside an
 * inset-grouped iOS 26 layout with compact top margins, soft progressive scroll-under
 * blur, full-row hit testing (`contentShape`), cross-free SF Symbols, Sacred Ink
 * Light/Dark tokens, and a dedicated Administration section for admin access.
 */
import React from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, computeUserInitials } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { useFriends } from '../../utils/friendsStore';
import { useNotifications } from '../../utils/notificationsStore';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { MINISTRIES, choirDisplayName } from '../../data/communityRules';
import { churchDisplayName } from '../../utils/churchName';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import { useAvatarPicker } from '../../utils/useAvatarPicker';
import UserAvatar from '../UserAvatar';
import type { CommunitySubPage } from '../CommunityProfile';

export type ProfileOverviewSection = 'overview' | 'account-edit' | CommunitySubPage;

export interface MyProfileOverviewProps {
  onOpenSection: (section: ProfileOverviewSection) => void;
  onConfirmDeleteAccount: () => void;
}

export default function MyProfileOverviewIOS({
  onOpenSection,
  onConfirmDeleteAccount,
}: MyProfileOverviewProps) {
  const swiftUI = getExpoSwiftUI();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const { user, refreshUser, signOut } = useAuth();
  const { favoriteIds } = useFavorites();
  const { playlists } = usePlaylists();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const { lists: friendsLists, badgeCount: friendsBadge, refreshIfStale: refreshFriends } = useFriends();
  const { unreadCount: notificationsUnread, refreshIfStale: refreshNotifications } = useNotifications();
  const { bySlug: choirsBySlug } = useApprovedChoirs();
  const { updatingAvatar, openAvatarMenu } = useAvatarPicker();

  if (!swiftUI || !user) return null;

  const {
    Button,
    Circle,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    ProgressView,
    RNHostView,
    Section,
    Spacer,
    Text,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    Animation,
    animation,
    contentShape,
    contentTransition,
    disabled,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    listSectionMargins,
    listSectionSpacing,
    monospacedDigit,
    padding,
    refreshable,
    scrollEdgeEffectStyle,
    shapes,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const es = language !== 'en';
  const scheme = isDarkMode ? 'dark' : 'light';
  const accentTint = isDarkMode ? '#fdf9f2' : theme.primary;
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const avatarBg = isDarkMode ? '#F3EEE8' : '#6e1619';
  const avatarText = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const displayName = user.displayName || user.email.split('@')[0];
  const initials = user.initials || computeUserInitials(user.displayName, user.email);
  const ministryLabel =
    (user.ministry &&
      (MINISTRIES as Record<string, [string, string]>)[user.ministry]?.[es ? 0 : 1]) ||
    t.accountNotSet;
  const choirLabel =
    (user.choir && choirDisplayName(user.choir, es, choirsBySlug)) || t.accountNotSet;
  const churchLabel =
    (user.churchName ? churchDisplayName(user.churchName) : '') || t.accountNotSet;
  const isAdmin =
    user.role === 'admin' && user.email.toLowerCase() === 'isaacduran167@gmail.com';

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshUser(),
        refreshFriends(0),
        refreshNotifications(0),
      ]);
    } catch {
      // Ignore refresh errors during pull-to-refresh
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      if (router.canDismiss()) {
        router.dismissTo('/(tabs)/home');
      } else {
        router.navigate('/(tabs)/home' as any);
      }
    } catch {
      // AuthContext handles error state
    }
  };

  const chevron = (
    <SwiftUIImage
      systemName="chevron.right"
      size={13}
      modifiers={[foregroundStyle(tertiaryStyle)]}
    />
  );

  const navRow = (
    title: string,
    systemImage: any,
    detail: string | null,
    onPress: () => void,
    highlightDetail = false,
    numericAnimValue?: number,
  ) => (
    <Button
      modifiers={[foregroundStyle(primaryStyle)]}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      <HStack
        alignment="center"
        spacing={8}
        modifiers={[contentShape(shapes.rectangle())]}
      >
        <Label
          title={title}
          icon={
            <SwiftUIImage
              systemName={systemImage}
              modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
            />
          }
        />
        <Spacer />
        {detail ? (
          <Text
            modifiers={[
              font({ textStyle: 'subheadline' }),
              foregroundStyle(
                highlightDetail ? { type: 'color', color: '#D64545' } : secondaryStyle,
              ),
              ...(numericAnimValue !== undefined
                ? [
                    monospacedDigit(),
                    contentTransition('numericText'),
                    animation(Animation.default, numericAnimValue),
                  ]
                : []),
              lineLimit(1),
              truncationMode('tail'),
            ]}
          >
            {detail}
          </Text>
        ) : null}
        {chevron}
      </HStack>
    </Button>
  );

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
      <Form
        modifiers={[
          refreshable(handleRefresh),
          tint(symbolTint),
          listSectionSpacing('compact'),
          scrollEdgeEffectStyle('soft', 'all'),
        ]}
      >
        {/* ─── Compact Identity Header Card ─── */}
        <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
          <Button
            modifiers={[foregroundStyle(primaryStyle)]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onOpenSection('account-edit');
            }}
          >
            <HStack
              alignment="center"
              spacing={14}
              modifiers={[contentShape(shapes.rectangle())]}
            >
              {user.avatarUrl && typeof RNHostView === 'function' ? (
                <ZStack
                  alignment="center"
                  modifiers={[frame({ width: 52, height: 52 })]}
                >
                  <RNHostView matchContents>
                    <UserAvatar
                      uri={user.avatarUrl}
                      initials={initials}
                      size={52}
                      backgroundColor={avatarBg}
                      textColor={avatarText}
                    />
                  </RNHostView>
                </ZStack>
              ) : (
                <ZStack alignment="center">
                  <Circle
                    modifiers={[
                      foregroundStyle(avatarBg),
                      frame({ width: 52, height: 52 }),
                    ]}
                  />
                  <Text
                    modifiers={[
                      font({ size: 19, weight: 'bold' }),
                      foregroundStyle(avatarText),
                    ]}
                  >
                    {initials}
                  </Text>
                </ZStack>
              )}
              <VStack alignment="leading" spacing={3}>
                <HStack alignment="center" spacing={6}>
                  <Text
                    modifiers={[
                      font({ textStyle: 'headline', weight: 'semibold' }),
                      lineLimit(1),
                      truncationMode('tail'),
                    ]}
                  >
                    {displayName}
                  </Text>
                  {user.badgeVerified && user.ministry === 'obispo' ? (
                    <SwiftUIImage
                      systemName="checkmark.seal.fill"
                      size={15}
                      modifiers={[foregroundStyle({ type: 'color', color: accentTint })]}
                    />
                  ) : null}
                </HStack>
                <Text
                  modifiers={[
                    font({ textStyle: 'footnote' }),
                    foregroundStyle(secondaryStyle),
                    lineLimit(1),
                    truncationMode('tail'),
                  ]}
                >
                  {user.email}
                </Text>
              </VStack>
              <Spacer />
              {chevron}
            </HStack>
          </Button>

          <Button
            modifiers={[foregroundStyle(primaryStyle), disabled(updatingAvatar)]}
            onPress={openAvatarMenu}
          >
            <HStack
              alignment="center"
              spacing={10}
              modifiers={[contentShape(shapes.rectangle())]}
            >
              <Label
                title={updatingAvatar ? t.avatarUpdating : t.avatarChangeAction}
                icon={
                  <SwiftUIImage
                    systemName="camera"
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                  />
                }
              />
              <Spacer />
              {updatingAvatar ? <ProgressView /> : chevron}
            </HStack>
          </Button>

          <LabeledContent label={t.accountStatus}>
            <Text
              modifiers={[
                foregroundStyle(
                  user.emailVerified
                    ? { type: 'color', color: '#34C759' }
                    : secondaryStyle,
                ),
              ]}
            >
              {user.emailVerified ? t.accountVerified : t.accountUnverified}
            </Text>
          </LabeledContent>

          <LabeledContent label={t.tabFavorites}>
            <Text
              modifiers={[
                monospacedDigit(),
                contentTransition('numericText'),
                animation(Animation.default, favoriteIds.length * 1000 + playlists.length),
                foregroundStyle(secondaryStyle),
              ]}
            >
              {`${favoriteIds.length} · ${playlists.length} ${t.playlistsTabShort.toLowerCase()}`}
            </Text>
          </LabeledContent>

          {!user.emailVerified
            ? navRow(
                t.authEmailUnverified,
                'envelope.badge',
                null,
                () => onOpenSection('account-edit'),
              )
            : null}
        </Section>

        {/* ─── Community & Church ─── */}
        <Section title={t.communitySectionTitle}>
          {navRow(
            t.friendsTitle,
            'person.2',
            friendsBadge > 0
              ? `${friendsLists.friends.length} · +${friendsBadge}`
              : String(friendsLists.friends.length),
            () => onOpenSection('friends'),
            friendsBadge > 0,
            friendsLists.friends.length * 1000 + friendsBadge,
          )}
          {navRow(
            t.notificationsTitle,
            'bell',
            notificationsUnread > 0 ? String(notificationsUnread) : null,
            () => onOpenSection('notifications'),
            notificationsUnread > 0,
            notificationsUnread,
          )}
          {navRow(t.profileMinistry, 'person.text.rectangle', ministryLabel, () =>
            onOpenSection('ministry'),
          )}
          {navRow(t.profileChoir, 'music.note.list', choirLabel, () =>
            onOpenSection('choir'),
          )}
          {navRow(t.profileMyChurch, 'building.columns', churchLabel, () =>
            onOpenSection('church-location'),
          )}
          {navRow(t.profileChurches, 'map', t.profileMap, () => {
            router.push(
              (user.churchId
                ? `/churches?id=${encodeURIComponent(user.churchId)}`
                : '/churches') as any,
            );
          })}
          {navRow(t.profileBlocked, 'hand.raised', null, () => onOpenSection('blocks'))}
        </Section>

        {/* ─── Dedicated Admin Section (strictly gated for Admin) ─── */}
        {isAdmin ? (
          <Section title={t.adminSectionTitle}>
            {navRow(
              t.profileModeration,
              'shield.lefthalf.filled',
              null,
              () => onOpenSection('moderation'),
            )}
          </Section>
        ) : null}

        {/* ─── Session ─── */}
        <Section>
          <Button
            modifiers={[foregroundStyle(primaryStyle)]}
            onPress={() => void handleSignOut()}
          >
            <HStack
              alignment="center"
              spacing={10}
              modifiers={[contentShape(shapes.rectangle())]}
            >
              <Label
                title={t.authSignOut}
                icon={
                  <SwiftUIImage
                    systemName="rectangle.portrait.and.arrow.right"
                    modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
                  />
                }
              />
              <Spacer />
            </HStack>
          </Button>
        </Section>

        {/* ─── Danger Zone ─── */}
        <Section
          title={t.dangerZoneTitle}
          footer={
            <VStack
              alignment="leading"
              modifiers={[padding({ bottom: hasMiniPlayer ? 88 : 24 })]}
            >
              <Text modifiers={[foregroundStyle(secondaryStyle)]}>
                {t.dangerZoneFooter}
              </Text>
            </VStack>
          }
        >
          <Button role="destructive" onPress={onConfirmDeleteAccount}>
            <Label title={t.authDeleteAccount} systemImage="trash" />
          </Button>
        </Section>
      </Form>
    </Host>
  );
}
