import { fonts } from '../theme/theme';
import React, { useEffect } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, computeUserInitials } from '../context/AuthContext';
import { useFriends } from '../utils/friendsStore';
import { useNotifications } from '../utils/notificationsStore';
import GlassSurface from './GlassSurface';
import AppMenuIcon from './AppMenuIcon';
import UserAvatar from './UserAvatar';
import * as Haptics from '../utils/haptics';

export const APPLE_AVATAR_GRADIENT: [string, string] = ['#9EA9DC', '#7683BE'];

const CAPSULE_HEIGHT = 46;
const CAPSULE_RADIUS = CAPSULE_HEIGHT / 2;

export default function HomeHeaderActions({
  onSearch,
  glassEpoch = 0,
}: {
  onSearch: () => void;
  glassEpoch?: number;
}) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user, openAuthSheet } = useAuth();
  const { badgeCount: friendsBadge, refreshIfStale: refreshFriendsIfStale } = useFriends();
  const { unreadCount: notificationsUnread, refreshIfStale: refreshNotificationsIfStale } = useNotifications();
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (!user?.id) return;
    void refreshFriendsIfStale(15000);
    void refreshNotificationsIfStale(15000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshFriendsIfStale(15000);
        void refreshNotificationsIfStale(15000);
      }
    });
    return () => sub.remove();
  }, [refreshFriendsIfStale, refreshNotificationsIfStale, user?.id]);

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearch();
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openAuthSheet();
  };

  const userInitials = user
    ? user.initials || computeUserInitials(user.displayName, user.email)
    : null;
  const hasAvatarPhoto = Boolean(user?.avatarUrl);
  const showUnreadDot = Boolean(user && (friendsBadge > 0 || notificationsUnread > 0));

  const profileAccessibilityLabel = user
    ? `${t.authAccountTitle}: ${user.displayName || user.email}`
    : `${t.authAccountTitle} · ${t.homeMenu}`;

  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(60,60,67,0.16)';
  const badgeRingColor = isDarkMode ? '#010101' : '#FFFFFF';

  return (
    <GlassSurface
      refreshKey={glassEpoch}
      glassEffectStyle="regular"
      intensity={58}
      isInteractive
      style={[
        styles.capsule,
        { paddingRight: hasAvatarPhoto ? 0 : 4 },
        !isIOS && styles.androidCapsule,
      ]}
    >
      {/* Left slot: Search icon */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.searchPlaceholder}
        onPress={handleSearchPress}
        android_ripple={{ color: theme.primary + '20', borderless: false }}
        style={({ pressed }) => [
          styles.searchSlot,
          hasAvatarPhoto && styles.searchSlotWithAvatar,
          !isIOS && pressed && { backgroundColor: theme.primary + '16' },
          isIOS && pressed && { opacity: 0.72 },
        ]}
      >
        <AppMenuIcon
          ios="magnifyingglass"
          android="search"
          size={22}
          containerSize={26}
          scale="large"
          weight="medium"
          color={theme.primary}
        />
      </Pressable>

      {/* Subtle hairline divider when no full-bleed photo forms the visual boundary */}
      {!hasAvatarPhoto ? (
        <View pointerEvents="none" style={[styles.divider, { backgroundColor: dividerColor }]} />
      ) : null}

      {/* Right slot: Full-bleed circular profile photo (edge-to-edge) or monogram/icon */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={profileAccessibilityLabel}
        onPress={handleProfilePress}
        android_ripple={{ color: theme.primary + '20', borderless: false }}
        style={({ pressed }) => [
          hasAvatarPhoto ? styles.avatarPhotoSlot : styles.profileIconSlot,
          !isIOS && pressed && { backgroundColor: theme.primary + '16' },
          isIOS && pressed && { opacity: 0.84 },
        ]}
      >
        {hasAvatarPhoto ? (
          <UserAvatar
            uri={user?.avatarUrl}
            initials={userInitials || ''}
            size={CAPSULE_HEIGHT}
            fontSize={15}
            backgroundColor={isDarkMode ? '#2C2C2E' : '#E5E5EA'}
            textColor={isDarkMode ? '#FFFFFF' : '#111111'}
            borderWidth={0}
          />
        ) : userInitials ? (
          <Text
            style={[
              styles.classicAvatarInitials,
              { color: isDarkMode ? '#FDF9F2' : theme.primary },
            ]}
          >
            {userInitials}
          </Text>
        ) : (
          <AppMenuIcon
            ios="person.crop.circle"
            android="account-circle"
            size={22}
            containerSize={26}
            scale="large"
            weight="medium"
            color={theme.primary}
          />
        )}

        {showUnreadDot ? (
          <View
            pointerEvents="none"
            style={[
              hasAvatarPhoto ? styles.badgeDotPhoto : styles.badgeDotIcon,
              hasAvatarPhoto && { borderColor: badgeRingColor },
            ]}
          />
        ) : null}
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
    borderCurve: 'continuous',
    paddingLeft: 4,
    flexShrink: 0,
  },
  androidCapsule: {
    overflow: 'hidden',
  },
  searchSlot: {
    width: 44,
    height: CAPSULE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSlotWithAvatar: {
    width: 46,
    paddingRight: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    marginHorizontal: 1,
  },
  avatarPhotoSlot: {
    width: CAPSULE_HEIGHT,
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconSlot: {
    width: 44,
    height: CAPSULE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicAvatarInitials: {
    ...fonts.sansBold,
    fontSize: 16,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlign: 'center',
  },
  badgeDotPhoto: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
    backgroundColor: '#D64545',
  },
  badgeDotIcon: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#D64545',
  },
});
