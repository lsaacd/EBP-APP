import { fonts } from '../theme/theme';
import React, { useEffect } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

const CIRCLE_SIZE = 46;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
// 43pt avatar inside 46pt Liquid Glass circle leaves a razor-thin 1.5pt luminous glass rim
const AVATAR_PHOTO_SIZE = 43;

let cachedLiquidContainerAvailable: boolean | null = null;
let CachedGlassContainer: React.ComponentType<any> | null = null;
let CachedAnimatedGlassView: React.ComponentType<any> | null = null;

function checkLiquidGlassContainer(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (cachedLiquidContainerAvailable !== null) return cachedLiquidContainerAvailable;
  try {
    const mod = requireOptionalNativeModule<{
      isLiquidGlassAvailable?: boolean;
      isGlassEffectAPIAvailable?: boolean;
    }>('ExpoGlassEffect');
    if (mod?.isLiquidGlassAvailable === true && mod.isGlassEffectAPIAvailable === true) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const glassPkg = require('expo-glass-effect');
      CachedGlassContainer = glassPkg.GlassContainer ?? null;
      const GlassViewComp = glassPkg.GlassView ?? null;
      if (CachedGlassContainer && GlassViewComp) {
        CachedAnimatedGlassView = Animated.createAnimatedComponent(GlassViewComp);
        cachedLiquidContainerAvailable = true;
      } else {
        cachedLiquidContainerAvailable = false;
      }
    } else {
      cachedLiquidContainerAvailable = false;
    }
  } catch {
    cachedLiquidContainerAvailable = false;
  }
  return cachedLiquidContainerAvailable;
}

const SPRING_CONFIG = {
  damping: 28,
  stiffness: 420,
  mass: 0.6,
};

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

  const searchTranslateX = useSharedValue(0);
  const searchTranslateY = useSharedValue(0);
  const profileTranslateX = useSharedValue(0);
  const profileTranslateY = useSharedValue(0);

  const circleButtonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.circleButton,
    !isIOS && styles.androidButtonClip,
    !isIOS && { backgroundColor: pressed ? theme.primary + '18' : 'transparent' },
    isIOS && pressed && { opacity: 0.86 },
  ];

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearch();
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openAuthSheet();
  };

  const triggerLightHaptic = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const searchPan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onStart(() => {
      runOnJS(triggerLightHaptic)();
    })
    .onUpdate((e) => {
      // Subtle taut magnetic nudge toward the profile circle (up to +7pt) without overlapping
      const clampedX = Math.max(-2, Math.min(7, e.translationX * 0.28));
      const clampedY = Math.max(-2, Math.min(2, e.translationY * 0.15));
      searchTranslateX.value = clampedX;
      searchTranslateY.value = clampedY;
    })
    .onFinalize(() => {
      searchTranslateX.value = withSpring(0, SPRING_CONFIG);
      searchTranslateY.value = withSpring(0, SPRING_CONFIG);
    });

  const profilePan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onStart(() => {
      runOnJS(triggerLightHaptic)();
    })
    .onUpdate((e) => {
      // Subtle taut magnetic nudge toward the search circle (up to -7pt) without overlapping
      const clampedX = Math.max(-7, Math.min(2, e.translationX * 0.28));
      const clampedY = Math.max(-2, Math.min(2, e.translationY * 0.15));
      profileTranslateX.value = clampedX;
      profileTranslateY.value = clampedY;
    })
    .onFinalize(() => {
      profileTranslateX.value = withSpring(0, SPRING_CONFIG);
      profileTranslateY.value = withSpring(0, SPRING_CONFIG);
    });

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: searchTranslateX.value },
      { translateY: searchTranslateY.value },
    ],
  }));

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: profileTranslateX.value },
      { translateY: profileTranslateY.value },
    ],
  }));

  const userInitials = user
    ? user.initials || computeUserInitials(user.displayName, user.email)
    : null;
  const hasAvatarPhoto = Boolean(user?.avatarUrl);
  const showUnreadDot = Boolean(user && (friendsBadge > 0 || notificationsUnread > 0));
  const badgeRingColor = isDarkMode ? '#010101' : '#FFFFFF';

  const profileAccessibilityLabel = user
    ? `${t.authAccountTitle}: ${user.displayName || user.email}`
    : `${t.authAccountTitle} · ${t.homeMenu}`;

  const searchButtonNode = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.searchPlaceholder}
      onPress={handleSearchPress}
      android_ripple={{ color: theme.primary + '20', borderless: false }}
      style={circleButtonStyle}
    >
      <AppMenuIcon
        ios="magnifyingglass"
        android="search"
        size={24}
        containerSize={28}
        scale="large"
        weight="medium"
        color={theme.primary}
      />
    </Pressable>
  );

  const profileButtonNode = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={profileAccessibilityLabel}
      onPress={handleProfilePress}
      android_ripple={{ color: theme.primary + '20', borderless: false }}
      style={circleButtonStyle}
    >
      {hasAvatarPhoto ? (
        <UserAvatar
          uri={user?.avatarUrl}
          initials={userInitials || ''}
          size={AVATAR_PHOTO_SIZE}
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
          size={24}
          containerSize={28}
          scale="large"
          weight="medium"
          color={theme.primary}
        />
      )}
      {showUnreadDot ? (
        <View
          pointerEvents="none"
          style={[
            hasAvatarPhoto ? styles.badgeDotPhoto : styles.badgeDot,
            hasAvatarPhoto && { borderColor: badgeRingColor },
          ]}
        />
      ) : null}
    </Pressable>
  );

  // iOS 26+ Native UIGlassContainerEffect:
  // Direct GlassView children inside GlassContainer morph and connect with a Liquid Glass metaball bridge!
  if (
    isIOS &&
    checkLiquidGlassContainer() &&
    CachedGlassContainer &&
    CachedAnimatedGlassView
  ) {
    const GlassContainerComp = CachedGlassContainer;
    const AnimatedGlassViewComp = CachedAnimatedGlassView;
    const scheme = isDarkMode ? 'dark' : 'light';

    return (
      <GlassContainerComp
        key={glassEpoch > 0 ? `glass-container-${glassEpoch}` : undefined}
        spacing={8}
        style={styles.actionsRow}
      >
        <AnimatedGlassViewComp
          glassEffectStyle="regular"
          colorScheme={scheme}
          isInteractive
          style={[styles.largeCircle, searchAnimatedStyle]}
        >
          <GestureDetector gesture={searchPan}>
            {searchButtonNode}
          </GestureDetector>
        </AnimatedGlassViewComp>

        <AnimatedGlassViewComp
          glassEffectStyle="regular"
          colorScheme={scheme}
          isInteractive
          style={[styles.largeCircle, profileAnimatedStyle]}
        >
          <GestureDetector gesture={profilePan}>
            {profileButtonNode}
          </GestureDetector>
        </AnimatedGlassViewComp>
      </GlassContainerComp>
    );
  }

  return (
    <View style={styles.actionsRow}>
      {/* Left Large Circular Glass Capsule: Search */}
      <GlassSurface
        refreshKey={glassEpoch}
        intensity={58}
        isInteractive
        style={[styles.largeCircle, !isIOS && styles.androidCircle]}
      >
        {searchButtonNode}
      </GlassSurface>

      {/* Far-Right Large Circular Glass Capsule: Profile / Menu */}
      <GlassSurface
        refreshKey={glassEpoch}
        intensity={58}
        isInteractive
        style={[styles.largeCircle, !isIOS && styles.androidCircle]}
      >
        {profileButtonNode}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  largeCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  androidCircle: {
    borderRadius: CIRCLE_RADIUS,
  },
  circleButton: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidButtonClip: {
    overflow: 'hidden',
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
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#D64545',
  },
});
