import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  runOnJS,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { shouldCollapsePlayer } from './gestureMotion';

const DEFAULT_SPRING = {
  damping: 28,
  stiffness: 240,
  mass: 1,
  overshootClamping: true,
};

export interface SheetBackdropGestureOptions {
  progress: SharedValue<number>;
  dragOrigin: SharedValue<number>;
  travel: number;
  /** Called when a quick tap lands on the dimmed backdrop. */
  onTapClose: () => void;
  /** Called after a downward swipe finishes animating closed. */
  onFinishDismiss: () => void;
  /** Optional custom handler when a swipe crosses the dismiss threshold (e.g. unsaved-draft prompt). */
  onInterceptDismiss?: (progressAtEnd: number) => void;
  /** Optional callback on drag start (e.g. clearing pending post-close navigation). */
  onDragStart?: () => void;
  /** Fraction of travel used as collapse span (default 0.45). */
  collapseRatio?: number;
  enabled?: boolean;
}

/**
 * Glorify-style sheet gesture:
 * - Dragging down anywhere on the dimmed backdrop or grabber pill tracks 1:1 and dismisses.
 * - Pulling up applies subtle damped elastic resistance and springs back on release.
 * - Quick tapping the dimmed backdrop closes immediately.
 */
export function buildSheetPanGesture({
  progress,
  dragOrigin,
  travel,
  onFinishDismiss,
  onInterceptDismiss,
  onDragStart,
  collapseRatio = 0.45,
  enabled = true,
}: Omit<SheetBackdropGestureOptions, 'onTapClose'>) {
  return Gesture.Pan()
    .enabled(enabled)
    .activeOffsetY([-8, 8])
    .failOffsetX([-24, 24])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(progress);
      dragOrigin.value = progress.value;
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      const raw = dragOrigin.value + event.translationY / travel;
      if (raw < 0) {
        progress.value = Math.max(-0.045, raw * 0.16);
      } else {
        progress.value = Math.min(1, raw);
      }
    })
    .onEnd((event, success) => {
      const collapse =
        success &&
        progress.value > 0 &&
        shouldCollapsePlayer(
          progress.value * travel,
          event.velocityY,
          travel * collapseRatio,
        );
      if (collapse && onInterceptDismiss) {
        runOnJS(onInterceptDismiss)(progress.value);
        return;
      }
      progress.value = withSpring(
        collapse ? 1 : 0,
        { ...DEFAULT_SPRING, velocity: event.velocityY / travel },
        (finished) => {
          if (finished && collapse) runOnJS(onFinishDismiss)();
        },
      );
    });
}

export function buildSheetBackdropGesture(options: SheetBackdropGestureOptions) {
  const pan = buildSheetPanGesture(options);
  const tap = Gesture.Tap()
    .enabled(options.enabled ?? true)
    .maxDistance(10)
    .onEnd((_, success) => {
      if (success) runOnJS(options.onTapClose)();
    });
  return Gesture.Exclusive(pan, tap);
}
