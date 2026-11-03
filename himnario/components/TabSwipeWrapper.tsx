import React, { useRef } from 'react';
import { Dimensions, StyleProp, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../utils/haptics';

export type MainTabName = 'home' | 'hymns' | 'favorites' | 'settings';

const TAB_ORDER: MainTabName[] = ['home', 'hymns', 'favorites', 'settings'];

interface TabSwipeWrapperProps {
  currentTab: MainTabName;
  style?: StyleProp<ViewStyle>;
  /**
   * Optional predicate `(pageX, pageY) => boolean` to ignore swipe starts
   * in specific regions (e.g., horizontal category chip strips or right-edge scrubbers).
   */
  shouldIgnoreTouch?: (pageX: number, pageY: number) => boolean;
  children: React.ReactNode;
}

/**
 * Wraps a main tab screen so swiping horizontally left or right switches
 * to the adjacent main tab (Inicio ↔ Himnos ↔ Favoritos ↔ Ajustes),
 * similar to Instagram tab swiping, without blocking vertical ScrollViews.
 */
export default function TabSwipeWrapper({
  currentTab,
  style,
  shouldIgnoreTouch,
  children,
}: TabSwipeWrapperProps) {
  const router = useRouter();
  const touchStartRef = useRef<{
    x: number;
    y: number;
    t: number;
    ignored: boolean;
  } | null>(null);

  const handleTouchStart = (e: any) => {
    const touch = e?.nativeEvent?.touches?.[0] ?? e?.nativeEvent;
    if (!touch) return;
    const pageX = touch.pageX ?? 0;
    const pageY = touch.pageY ?? 0;
    const screenW = Dimensions.get('window').width;

    // Ignore touches starting on the far right edge (scrubber track) or custom ignored regions
    const ignored =
      pageX > screenW - 58 || (shouldIgnoreTouch ? shouldIgnoreTouch(pageX, pageY) : false);

    touchStartRef.current = {
      x: pageX,
      y: pageY,
      t: Date.now(),
      ignored,
    };
  };

  const handleTouchEnd = (e: any) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || start.ignored) return;

    const touch = e?.nativeEvent?.changedTouches?.[0] ?? e?.nativeEvent;
    if (!touch) return;

    const dx = (touch.pageX ?? 0) - start.x;
    const dy = (touch.pageY ?? 0) - start.y;
    const dt = Date.now() - start.t;

    // Must be a deliberate horizontal swipe: >= 68px horizontal, mostly horizontal, under 600ms
    if (dt > 600) return;
    if (Math.abs(dx) < 68 || Math.abs(dx) < Math.abs(dy) * 1.75) return;

    const currentIndex = TAB_ORDER.indexOf(currentTab);
    if (currentIndex === -1) return;

    const targetIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= TAB_ORDER.length) return;

    const nextTab = TAB_ORDER[targetIndex];
    Haptics.selectionAsync().catch(() => {});
    router.navigate(`/${nextTab}` as any);
  };

  return (
    <View
      style={[{ flex: 1 }, style]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
    >
      {children}
    </View>
  );
}

