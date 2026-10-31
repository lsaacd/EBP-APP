/**
 * TabLayout — Platform-split tab navigation.
 *
 * iOS:     NativeTabs → system tab bar (UITabBarController).
 * Android: Large icon-only tabs anchored to the bottom edge.
 *
 * @returns {React.JSX.Element} The tab layout.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ANDROID_BOTTOM_BAR_HEIGHT } from '../../components/androidBottomLayout';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Android — flush bottom navigation with native circular touch feedback.
function AndroidBottomBar({ state, descriptors, navigation }: any) {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const active = isDarkMode ? '#fdf9f2' : '#6e1619';
  return (
    <View style={[navStyles.bar, {
      backgroundColor: isDarkMode ? '#171717' : '#fcf9f2',
      paddingBottom: insets.bottom,
      height: ANDROID_BOTTOM_BAR_HEIGHT + insets.bottom,
    }]}>
      <View pointerEvents="none" style={[navStyles.topBorder, { backgroundColor: isDarkMode ? '#ffffff1a' : '#e3dfd3' }]} />
      <View style={navStyles.row}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;
          const selected = state.index === index;
          return (
            <Pressable key={route.key} style={navStyles.tab}
              accessibilityRole="tab" accessibilityLabel={options.title}
              accessibilityState={{ selected }}
              android_ripple={{ color: isDarkMode ? '#ffffff28' : '#6e161922', radius: 48, borderless: true }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
              }}>
              <View style={[navStyles.selection, selected && { backgroundColor: isDarkMode ? '#ffffff0c' : '#6e16190a' }]}>
                <Ionicons name={androidTabIcon(route.name, selected)} size={32}
                  color={selected ? active : (isDarkMode ? '#8e8e8e' : '#747366')} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AndroidTabs() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <AndroidBottomBar {...props} />}
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

const TAB_ICONS: Record<string, [ComponentProps<typeof Ionicons>['name'], ComponentProps<typeof Ionicons>['name']]> = {
  home: ['home-outline', 'home'],
  hymns: ['book-outline', 'book'],
  favorites: ['bookmark-outline', 'bookmark'],
  settings: ['settings-outline', 'settings'],
};
function androidTabIcon(route: string, selected: boolean) {
  return (TAB_ICONS[route] ?? TAB_ICONS.home)[selected ? 1 : 0];
}

const navStyles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth },
  row: { height: ANDROID_BOTTOM_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center' },
  tab: { flex: 1, height: ANDROID_BOTTOM_BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  selection: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

// ══════════════════════════════════════════════════════════════════════════
// Export — picks the right navigator per platform
// ══════════════════════════════════════════════════════════════════════════
export default function TabLayout() {
  if (Platform.OS === 'ios') return <IOSTabs />;
  return <AndroidTabs />;
}
