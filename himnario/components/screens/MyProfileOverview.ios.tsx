/**
 * MyProfileOverview (iOS 26 Native SwiftUI Form) — Modeled after Inkigo's `Profile.ios.tsx`.
 *
 * Uses @expo/ui/swift-ui `Form`, `Section`, `LabeledContent`, `Label`, `Button`,
 * `Image`, `Spacer`, and `refreshable` pull-to-refresh inside an inset-grouped
 * iOS 26 layout while keeping all EBP App rules intact (churchDisplayName,
 * choirDisplayName, cross-free SF Symbols, and LanguageContext strings).
 */
import React from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlaylists } from '../../context/PlaylistsContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { useFriends } from '../../utils/friendsStore';
import { useNotifications } from '../../utils/notificationsStore';
import { useApprovedChoirs } from '../../utils/choirsStore';
import { MINISTRIES, choirDisplayName } from '../../data/communityRules';
import { churchDisplayName } from '../../utils/churchName';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
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

  if (!swiftUI || !user) return null;

  const {
    Button,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    Section,
    Spacer,
    Text,
    VStack,
  } = swiftUI.ui;

  const {
    font,
    foregroundStyle,
    monospacedDigit,
    padding,
    refreshable,
    tint,
  } = swiftUI.modifiers;

  const es = language !== 'en';
  const scheme = isDarkMode ? 'dark' : 'light';
  const accentTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const displayName = user.displayName || user.email.split('@')[0];
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
      router.dismissTo('/(tabs)/home');
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
  ) => (
    <Button
      modifiers={[foregroundStyle(primaryStyle)]}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      <HStack alignment="center" spacing={8}>
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
      <Form modifiers={[refreshable(handleRefresh), tint(symbolTint)]}>
        {/* ─── Account (Inkigo Profile Style) ─── */}
        <Section title={t.authAccountTitle}>
          <LabeledContent label={t.authNameLabel}>
            <HStack alignment="center" spacing={6}>
              <Text>{displayName}</Text>
              {user.badgeVerified && user.ministry === 'obispo' ? (
                <SwiftUIImage
                  systemName="checkmark.seal.fill"
                  size={15}
                  color={accentTint}
                />
              ) : null}
            </HStack>
          </LabeledContent>

          <LabeledContent label={t.authEmailLabel}>
            <Text modifiers={[foregroundStyle(secondaryStyle)]}>{user.email}</Text>
          </LabeledContent>

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
            <Text modifiers={[monospacedDigit(), foregroundStyle(secondaryStyle)]}>
              {`${favoriteIds.length} · ${playlists.length} ${t.playlistsTabShort.toLowerCase()}`}
            </Text>
          </LabeledContent>

          {navRow(t.editProfileAction, 'pencil', null, () => onOpenSection('account-edit'))}

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
          )}
          {navRow(
            t.notificationsTitle,
            'bell',
            notificationsUnread > 0 ? String(notificationsUnread) : null,
            () => onOpenSection('notifications'),
            notificationsUnread > 0,
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
          {isAdmin
            ? navRow(t.profileModeration, 'shield', null, () =>
                onOpenSection('moderation'),
              )
            : null}
        </Section>

        {/* ─── Session ─── */}
        <Section>
          <Button
            modifiers={[foregroundStyle(primaryStyle)]}
            onPress={() => void handleSignOut()}
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
