/**
 * TabLayout — Platform-split tab navigation.
 *
 * iOS:     NativeTabs → system tab bar (UITabBarController).
 * Android: Expo Router <Tabs> with a custom floating pill tab bar that
 *          mirrors the old BottomNavBar design — glass tint, rounded pill,
 *          burgundy active accent — but uses simple taps instead of the
 *          complex PanResponder sliding bubble.
 *
 * @returns {React.JSX.Element} The tab layout.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// ══════════════════════════════════════════════════════════════════════════
// iOS — NativeTabs with SF Symbols
// ══════════════════════════════════════════════════════════════════════════
function IOSTabs() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();

  return (
    <NativeTabs
      tintColor={isDarkMode ? '#ffffff' : theme.primary}
      backgroundColor={isDarkMode ? '#010101' : '#ffffff'}
      disableTransparentOnScrollEdge={true}
    >
      <NativeTabs.Trigger name="home">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t.tabHome}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hymns">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <Label>{t.tabHymns}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites">
        <Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} />
        <Label>{t.tabFavorites}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>{t.tabSettings}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Android — Custom floating pill tab bar
// ══════════════════════════════════════════════════════════════════════════

// Tab config — same icons as the old BottomNavBar
type IconName = ComponentProps<typeof MaterialIcons>['name'];

const TAB_CONFIG: { name: string; icon: IconName }[] = [
  { name: 'home', icon: 'home' },
  { name: 'hymns', icon: 'menu-book' },
  { name: 'favorites', icon: 'bookmark' },
  { name: 'settings', icon: 'settings' },
];

/**
 * FloatingPillBar — Custom tab bar component rendered by Expo Router <Tabs>.
 * Visually identical to the old BottomNavBar: floating pill with glass tint,
 * rounded 50px corners, and the same color palette.
 */
function FloatingPillBar({ state, descriptors, navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Old pill colours — exact match ──────────────────────────────────
  const ACTIVE_COLOR = isDarkMode ? '#ffffff' : '#6e1619';
  const glassTint = isDarkMode
    ? 'rgba(1,1,1,0.88)'           // dark pill — opaque (no blur on Android)
    : 'rgba(252,249,242,0.92)';     // parchment light pill
  const borderColor = isDarkMode
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(255,255,255,0.50)';

  const pillBottom = Math.max(insets.bottom, 22);

  return (
    <View style={pillStyles.overlay} pointerEvents="box-none">
      <View
        style={[
          pillStyles.pillShadow,
          { bottom: pillBottom },
        ]}
        pointerEvents="auto"
      >
        {/* Clip wrapper — overflow:hidden clips to pill radius */}
        <View style={[pillStyles.pillClip, { borderColor }]}>

          {/* Glass tint background (Android has no blur, tint IS the bg) */}
          <View
            style={[
              StyleSheet.absoluteFill,
              pillStyles.blurSelf,
              { backgroundColor: glassTint },
            ]}
          />

          {/* Tab row */}
          <View style={pillStyles.tabRow}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const config = TAB_CONFIG[index];

              const iconColor = isFocused
                ? ACTIVE_COLOR
                : isDarkMode
                  ? 'rgba(243,240,234,0.55)'
                  : 'rgba(28,28,24,0.45)';

              const onPress = () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={pillStyles.tabItem}
                  activeOpacity={0.7}
                  onPress={onPress}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={options.title}
                  accessibilityState={{ selected: isFocused }}
                >
                  <MaterialIcons
                    name={config?.icon ?? 'circle'}
                    size={28}
                    color={iconColor}
                  />
                  <Text
                    style={[
                      pillStyles.label,
                      { color: iconColor },
                    ]}
                    numberOfLines={1}
                  >
                    {options.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function AndroidTabs() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <FloatingPillBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          elevation: 0,
          borderTopWidth: 0,
          height: 0,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t.tabHome }} />
      <Tabs.Screen name="hymns" options={{ title: t.tabHymns }} />
      <Tabs.Screen name="favorites" options={{ title: t.tabFavorites }} />
      <Tabs.Screen name="settings" options={{ title: t.tabSettings }} />
    </Tabs>
  );
}

const PILL_RADIUS = 50;

const pillStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pillShadow: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  pillClip: {
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  blurSelf: {
    borderRadius: PILL_RADIUS,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: -0.1,
  },
});

// ══════════════════════════════════════════════════════════════════════════
// Export — picks the right navigator per platform
// ══════════════════════════════════════════════════════════════════════════
export default function TabLayout() {
  if (Platform.OS === 'ios') return <IOSTabs />;
  return <AndroidTabs />;
}
