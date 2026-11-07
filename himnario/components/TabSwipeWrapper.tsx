import React, { useContext, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { cancelAnimation, runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';
import { TabPagerContext } from './TabPagerContext';
import { tabReleaseTarget } from '../utils/gestureMotion';

export type MainTabName = 'home' | 'hymns' | 'favorites' | 'settings';
const TAB_ORDER: MainTabName[] = ['home', 'hymns', 'favorites', 'settings'];
const SETTLE = { damping: 26, stiffness: 240, mass: 1, overshootClamping: true };

interface TabSwipeWrapperProps {
  currentTab: MainTabName;
  style?: StyleProp<ViewStyle>;
  shouldIgnoreTouch?: (pageX: number, pageY: number) => boolean;
  children: React.ReactNode;
}

/** The pager owns every scene. This wrapper only arbitrates horizontal intent. */
export default function TabSwipeWrapper({ currentTab, style, shouldIgnoreTouch, children }: TabSwipeWrapperProps) {
  const pager = useContext(TabPagerContext);
  const ignored = useSharedValue(false);
  const origin = useSharedValue(0);
  const ready = useSharedValue(false);
  const active = useSharedValue(false);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const start = useRef({ x: 0, y: 0 });
  const focused = pager?.index === TAB_ORDER.indexOf(currentTab);
  // Keep worklet closures limited to shared values and primitives, not navigation objects.
  const position = pager?.position;
  const width = pager?.width ?? 1;
  const index = pager?.index ?? 0;
  const count = pager?.count ?? TAB_ORDER.length;
  const select = pager?.select;

  const pan = Gesture.Pan()
    .enabled(Boolean(pager && focused))
    .manualActivation(true)
    .onTouchesDown(event => {
      ready.value = false;
      active.value = false;
      touchX.value = event.allTouches[0].absoluteX;
      touchY.value = event.allTouches[0].absoluteY;
    })
    .onTouchesMove((event, manager) => {
      if (!ready.value || !event.allTouches.length) return;
      if (ignored.value) { manager.fail(); return; }
      if (active.value) return;
      const dx = event.allTouches[0].absoluteX - touchX.value;
      const dy = event.allTouches[0].absoluteY - touchY.value;
      if (Math.abs(dy) > 12) manager.fail();
      else if (Math.abs(dx) > 20) manager.activate();
    })
    .maxPointers(1)
    .onStart(() => {
      if (!position || ignored.value) return;
      active.value = true;
      cancelAnimation(position);
      origin.value = position.value;
    })
    .onUpdate(event => {
      if (!position || ignored.value) return;
      const raw = origin.value - event.translationX / width;
      const lower = Math.max(0, index - 1);
      const upper = Math.min(count - 1, index + 1);
      position.value = Math.max(lower, Math.min(upper, raw));
    })
    .onEnd(event => {
      if (!position || ignored.value || !select) return;
      const target = tabReleaseTarget(position.value, -event.velocityX / width, index, count);
      position.value = withSpring(target, SETTLE, finished => {
        if (finished) runOnJS(select)(target);
      });
    })
    .onFinalize((_event, success) => {
      active.value = false;
      if (position && (!success || ignored.value)) position.value = withSpring(index, SETTLE);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[{ flex: 1 }, style]}
        onTouchStart={event => {
          const { pageX, pageY } = event.nativeEvent;
          start.current = { x: pageX, y: pageY };
          // Reserve the index scrubber and nested horizontal controls.
          ignored.value = (currentTab === 'hymns' && pageX > width - 58) || Boolean(shouldIgnoreTouch?.(pageX, pageY));
          ready.value = true;
        }}
        onTouchMove={() => {
          // A native Slider may activate after touch-down. Never steal its drag.
          if (shouldIgnoreTouch?.(start.current.x, start.current.y)) ignored.value = true;
        }}
      >
        {children}
      </View>
    </GestureDetector>
  );
}
