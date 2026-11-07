import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createNavigatorFactory, TabRouter, useNavigationBuilder,
  type DefaultNavigatorOptions, type ParamListBase, type TabNavigationState,
  type TabRouterOptions, type TabActionHelpers,
} from '@react-navigation/native';
import type { BottomTabNavigationOptions, BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { TabPagerContext } from './TabPagerContext';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from '../utils/haptics';
import { ANDROID_BOTTOM_BAR_HEIGHT } from './androidBottomLayout';

type Props = DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap, any>
  & TabRouterOptions & { tabBar: (props: any) => React.ReactNode };

/** Real adjacent scenes stay mounted: no screenshots, remounts or end-of-touch jumps. */
function SwipeTabsNavigator({ tabBar, ...options }: Props) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>, TabRouterOptions, TabActionHelpers<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap
  >(TabRouter, options);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barHeight = (Platform.OS === 'ios' ? 49 : ANDROID_BOTTOM_BAR_HEIGHT) + insets.bottom;
  const { theme } = useTheme();
  const position = useSharedValue(state.index);

  useEffect(() => {
    Keyboard.dismiss();
    position.value = withSpring(state.index, { damping: 26, stiffness: 240, overshootClamping: true });
  }, [position, state.index]);

  const select = useCallback((index: number) => {
    if (index === state.index || !state.routes[index]) return;
    Keyboard.dismiss();
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate(state.routes[index].name);
  }, [navigation, state.index, state.routes]);
  const pager = useMemo(() => ({ position, width, index: state.index, count: state.routes.length, select }),
    [position, width, state.index, state.routes.length, select]);
  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -position.value * width }] }));

  return (
    <NavigationContent>
      <TabPagerContext.Provider value={pager}>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          <View style={[styles.viewport, { marginBottom: barHeight }]}>
            <Animated.View style={[styles.strip, { width: width * state.routes.length }, stripStyle]}>
              {state.routes.map((route, index) => (
                <View
                  key={route.key}
                  style={{ width, height: '100%' }}
                  pointerEvents={state.index === index ? 'auto' : 'none'}
                  accessibilityElementsHidden={state.index !== index}
                  importantForAccessibility={state.index === index ? 'auto' : 'no-hide-descendants'}
                >
                  {descriptors[route.key].render()}
                </View>
              ))}
            </Animated.View>
          </View>
          {tabBar({ state, descriptors, navigation })}
        </View>
      </TabPagerContext.Provider>
    </NavigationContent>
  );
}

export const createSwipeTabsNavigator = createNavigatorFactory(SwipeTabsNavigator);
const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { flex: 1, overflow: 'hidden' },
  strip: { height: '100%', flexDirection: 'row' },
});
