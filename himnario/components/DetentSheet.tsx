/**
 * DetentSheet — a persistent (non-modal) bottom sheet that rests at one of a
 * few heights, like the Apple Maps search sheet.
 *
 * Only the header is draggable; the body below it scrolls normally. That keeps
 * the sheet drag and the list scroll from competing for the same touch.
 * The sheet is laid out at its tallest height and translated down, so the body
 * must add `maxHeight - snapHeights[index]` of bottom padding to stay reachable.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { sheetSnapTarget } from '../utils/gestureMotion';
import SheetGrabber from './SheetGrabber';

const SPRING = { damping: 30, stiffness: 260, mass: 1, overshootClamping: true };

type Props = {
  /** Resting heights in ascending order. */
  snapHeights: number[];
  index: number;
  onIndexChange: (index: number) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  /** Optional extra gesture for the header, e.g. a horizontal swipe. */
  headerGesture?: GestureType;
  /** Rendered behind the content, clipped to the sheet's rounded shape. */
  background?: React.ReactNode;
  /** Floats above the sheet's top-right edge and travels with it. */
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Room reserved above the sheet so the accessory stays inside the touchable
// bounds of the moving container (views outside their parent get no touches).
const ACCESSORY_SPACE = 58;
const OVERSHOOT = 60;

export default function DetentSheet({
  snapHeights,
  index,
  onIndexChange,
  header,
  children,
  headerGesture,
  background,
  accessory,
  style,
}: Props) {
  const maxHeight = snapHeights[snapHeights.length - 1];
  const minHeight = snapHeights[0];
  const target = snapHeights[Math.max(0, Math.min(snapHeights.length - 1, index))];
  const height = useSharedValue(target);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    height.value = withSpring(target, SPRING);
    return () => cancelAnimation(height);
  }, [height, target]);

  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .failOffsetX([-24, 24])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(height);
      dragStart.value = height.value;
    })
    .onUpdate((event) => {
      const next = dragStart.value - event.translationY;
      // Rubber-band slightly past either end so the edges feel soft.
      if (next > maxHeight) height.value = maxHeight + (next - maxHeight) * 0.18;
      else if (next < minHeight) height.value = minHeight - (minHeight - next) * 0.18;
      else height.value = next;
    })
    .onEnd((event) => {
      const next = sheetSnapTarget(height.value, event.velocityY, snapHeights);
      height.value = withSpring(snapHeights[next], SPRING);
      runOnJS(onIndexChange)(next);
    });

  const gesture = headerGesture ? Gesture.Race(pan, headerGesture) : pan;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: maxHeight - height.value }],
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        { height: maxHeight + OVERSHOOT + ACCESSORY_SPACE, marginBottom: -OVERSHOOT },
        sheetStyle,
      ]}
    >
      <View pointerEvents="box-none" style={styles.accessoryRow}>
        {accessory}
      </View>
      <View style={[styles.sheet, { paddingBottom: OVERSHOOT }, style]}>
        {background ? (
          <View pointerEvents="none" style={styles.background}>
            {background}
          </View>
        ) : null}
        <GestureDetector gesture={gesture}>
          <View collapsable={false}>
            <SheetGrabber interactive />
            {header}
          </View>
        </GestureDetector>
        <View style={styles.body}>{children}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  accessoryRow: {
    height: ACCESSORY_SPACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
  },
  background: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  body: {
    flex: 1,
  },
});
