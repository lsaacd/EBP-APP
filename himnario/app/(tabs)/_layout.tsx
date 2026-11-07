/** Main tabs: continuous adjacent-scene paging with platform-specific bar artwork. */
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { withLayoutContext } from 'expo-router';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import type { BottomTabNavigationOptions, BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs';
import { createSwipeTabsNavigator } from '../../components/SwipeTabsNavigator';
import * as Haptics from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ANDROID_BOTTOM_BAR_HEIGHT } from '../../components/androidBottomLayout';
import HomeTabIcon from '../../components/HomeTabIcon';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SwipeTabs = createSwipeTabsNavigator();
const Tabs = withLayoutContext<BottomTabNavigationOptions, typeof SwipeTabs.Navigator, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>(SwipeTabs.Navigator);

// Android bottom bar used by the shared gesture-driven scene pager.
function PlatformBottomBar({ state, descriptors, navigation }: any) {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const barHeight = ANDROID_BOTTOM_BAR_HEIGHT;
  const activeColor = isDarkMode ? '#ffffff' : '#6e1619';
  const inactiveColor = isDarkMode ? '#8e8e93' : '#747366';

  return (
    <View
      style={[
        navStyles.bar,
        {
          backgroundColor: isDarkMode ? '#0d0d0d' : '#fcf9f2',
          paddingBottom: insets.bottom,
          height: barHeight + insets.bottom,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          navStyles.topBorder,
          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : '#e3dfd3' },
        ]}
      />
      <View style={[navStyles.row, { height: barHeight }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;
          const selected = state.index === index;
          const itemColor = selected ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              style={[navStyles.tab, { height: barHeight }]}
              accessibilityRole="tab"
              accessibilityLabel={options.title}
              accessibilityState={{ selected }}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(route.name);
                }
              }}
            >
              <View style={navStyles.itemStack}>
                {route.name === 'home' ? (
                  <HomeTabIcon
                    selected={selected}
                    size={28}
                    color={itemColor}
                  />
                ) : (
                  <Ionicons
                    name={androidTabIcon(route.name, selected)}
                    size={28}
                    color={itemColor}
                  />
                )}
                <Text
                  style={[
                    navStyles.tabLabel,
                    {
                      color: itemColor,
                      fontFamily: 'PublicSans_700Bold',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {options.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AndroidPagerTabs() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props: any) => <PlatformBottomBar {...props} />}
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

const TAB_ICONS: Record<
  string,
  [
    ComponentProps<typeof Ionicons>['name'],
    ComponentProps<typeof Ionicons>['name'],
  ]
> = {
  home: ['home-outline', 'home'],
  hymns: ['book-outline', 'book'],
  favorites: ['bookmark-outline', 'bookmark'],
  settings: ['settings-outline', 'settings'],
};

function androidTabIcon(route: string, selected: boolean) {
  return (TAB_ICONS[route] ?? TAB_ICONS.home)[selected ? 1 : 0];
}

const navStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    height: ANDROID_BOTTOM_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    height: ANDROID_BOTTOM_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 13.5,
    marginTop: 1,
    includeFontPadding: false,
    textAlign: 'center',
  },
});

function IOSTabs() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();

  const activeColor = isDarkMode ? '#ffffff' : theme.primary;
  const inactiveColor = isDarkMode ? '#8e8e93' : '#5c5b52';

  // Apply identical appearance options to every Trigger so both standardAppearance
  // and scrollEdgeAppearance match on initial mount (prevents unselected tab labels
  // from dropping down before first tab switch on iOS) and pull labels closer to icons.
  const sharedTriggerOptions = {
    disableTransparentOnScrollEdge: true,
    iconColor: inactiveColor,
    selectedIconColor: activeColor,
    titlePositionAdjustment: { vertical: -2 },
    selectedTitlePositionAdjustment: { vertical: -2 },
    labelStyle: {
      fontSize: 10.5,
      fontWeight: '700' as const,
      color: inactiveColor,
    },
    selectedLabelStyle: {
      fontSize: 10.5,
      fontWeight: '700' as const,
      color: activeColor,
    },
  };

  return (
    <NativeTabs
      tintColor={activeColor}
      iconColor={{
        default: inactiveColor,
        selected: activeColor,
      }}
      labelStyle={{
        default: {
          fontSize: 10.5,
          fontWeight: '700',
          color: inactiveColor,
        },
        selected: {
          fontSize: 10.5,
          fontWeight: '700',
          color: activeColor,
        },
      }}
      disableTransparentOnScrollEdge={true}
    >
      <NativeTabs.Trigger
        name="home"
        options={{
          ...sharedTriggerOptions,
          // Home positions its content manually below the large "Himnario" header,
          // so stop react-native-screens from forcing automatic safe-area insets
          // on its ScrollView (that produced a double top gap on iOS).
          overrideScrollViewContentInsetAdjustmentBehavior: false,
        } as any}
      >
        <Icon
          src={{
            default: require('../../assets/images/ios-tabs/tab-home-outline.png'),
            selected: require('../../assets/images/ios-tabs/tab-home-filled.png'),
          }}
        />
        <Label>{t.tabHome}</Label>
      </NativeTabs.Trigger>

      {/* iOS-only 32pt template PNGs share identical frames so UIKit lays out
          every label at the same baseline from the very first render. */}
      <NativeTabs.Trigger name="hymns" options={sharedTriggerOptions as any}>
        <Icon
          src={{
            default: require('../../assets/images/ios-tabs/tab-hymns-outline.png'),
            selected: require('../../assets/images/ios-tabs/tab-hymns-filled.png'),
          }}
        />
        <Label>{t.tabHymns}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites" options={sharedTriggerOptions as any}>
        <Icon
          src={{
            default: require('../../assets/images/ios-tabs/tab-favorites-outline.png'),
            selected: require('../../assets/images/ios-tabs/tab-favorites-filled.png'),
          }}
        />
        <Label>{t.tabFavorites}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        options={{
          ...sharedTriggerOptions,
          // Settings positions its content manually below the large header,
          // so stop react-native-screens from forcing automatic safe-area insets
          // on its ScrollView (which produced an extra top gap on iOS only).
          overrideScrollViewContentInsetAdjustmentBehavior: false,
        } as any}
      >
        <Icon
          src={{
            default: require('../../assets/images/ios-tabs/tab-settings-outline.png'),
            selected: require('../../assets/images/ios-tabs/tab-settings-filled.png'),
          }}
        />
        <Label>{t.tabSettings}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}


export default function TabLayout() {
  return Platform.OS === 'ios' ? <IOSTabs /> : <AndroidPagerTabs />;
}
