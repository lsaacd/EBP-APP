/**
 * PageFlipTransition — Realistic 3D book-style page-flip engine for hymn navigation.
 *
 * Key differences from the previous version:
 *   1. Renders adjacent hymn content (prev/next) as UNDERLAY pages so the user
 *      sees the destination hymn during the swipe — not a blank background.
 *   2. Uses the BookSpine and PageShadow sub-components for visual depth.
 *   3. The foreground page folds away with 3D perspective + rotateY + scale,
 *      while the background page scales up from a slightly-zoomed-out resting state.
 *
 * Built for react-native-reanimated v4 + react-native-gesture-handler v2.28+
 * (uses Gesture.Pan / GestureDetector — NOT the legacy PanGestureHandler).
 */
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { PageShadow } from './PageFlip/PageShadow';
import { BookSpine } from './PageFlip/BookSpine';

// ── Types ─────────────────────────────────────────────────
export type FlipDirection = 'left' | 'right';

export type PageFlipTransitionProps = {
  /** Unique key for the current page — resets animations when changed */
  pageKey: string;
  /** Direction of the last transition */
  direction: FlipDirection;
  /** Called when the user completes a swipe-to-flip gesture */
  onSwipeFlip?: (direction: FlipDirection) => void;
  /** Whether swipe gestures are enabled */
  gestureEnabled?: boolean;
  /** Whether there is a previous page to flip to */
  hasPrev?: boolean;
  /** Whether there is a next page to flip to */
  hasNext?: boolean;
  /** The current page content */
  children: React.ReactNode;
  /** Render function for the previous page preview (shown underneath during right swipe) */
  renderPrevPage?: () => React.ReactNode;
  /** Render function for the next page preview (shown underneath during left swipe) */
  renderNextPage?: () => React.ReactNode;
  /** Theme mode — drives shadow intensity */
  isDarkMode: boolean;
};

// ── Constants ─────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;

const FLIP_CONFIG: WithTimingConfig = {
  duration: 480,
  easing: Easing.out(Easing.quad),
};

// ── Component ─────────────────────────────────────────────
export default function PageFlipTransition({
  pageKey,
  direction,
  onSwipeFlip,
  gestureEnabled = true,
  hasPrev = false,
  hasNext = false,
  children,
  renderPrevPage,
  renderNextPage,
  isDarkMode,
}: PageFlipTransitionProps) {
  // ── Animation Shared Values ──────────────────────────────
  
  // dragX: Tracks the active touch's horizontal displacement in absolute pixels.
  // Swiping left yields negative values; swiping right yields positive values.
  const dragX = useSharedValue(0);
  
  // startX: Records the starting position of the dragX at the moment the gesture initiates.
  const startX = useSharedValue(0);
  
  // progress: Normalizes dragX relative to the screen width (values ranging from -1.0 to +1.0).
  // This normalized float acts as the driver for all physical and visual interpolations.
  const progress = useSharedValue(0);
  
  // isAnimating: A thread-safe boolean lock that prevents touch input from interrupting
  // active snapping/timing animations.
  const isAnimating = useSharedValue(false);

  // ── Reset Cycle ─────────────────────────────────────────
  // Whenever the active page changes (identified by pageKey), we instantly reset all animation
  // shared values to zero and release any locks to allow immediate user interaction on the new page.
  useEffect(() => {
    dragX.value = 0;
    progress.value = 0;
    isAnimating.value = false;
  }, [pageKey]);

  // handleFlipComplete: Bridging function to notify the React state tree that the flip animation
  // has completed. Triggered at the end of the physics timing loop.
  const handleFlipComplete = (dir: FlipDirection) => {
    if (onSwipeFlip) onSwipeFlip(dir);
  };

  // ── Gesture Handler (Gesture.Pan) ─────────────────────────
  // Implements the gesture interface powered by react-native-gesture-handler.
  const panGesture = Gesture.Pan()
    .enabled(gestureEnabled)
    .activeOffsetX([-15, 15]) // Ignore tiny jittery taps; require a 15px horizontal intent
    .onStart(() => {
      'worklet'; // Mark as a worklet to ensure this runs at 120fps on the UI thread
      if (isAnimating.value) return;
      startX.value = dragX.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (isAnimating.value) return;

      let newX = startX.value + event.translationX;

      // ── Spring-back dampening (Rubber banding) ──────────
      // If the user tries to turn pages when there is no neighboring hymn (e.g., swiping past
      // the first or last song), we damp the touch offset by 85% to give organic resistance.
      if (newX > 0 && !hasPrev) newX = newX * 0.15;
      if (newX < 0 && !hasNext) newX = newX * 0.15;

      dragX.value = newX;
      progress.value = newX / SCREEN_W;
    })
    .onEnd((event) => {
      'worklet';
      if (isAnimating.value) return;

      const velocity = event.velocityX;
      const dragDistance = dragX.value;
      const threshold = SCREEN_W * 0.35; // Flip happens if dragged past 35% of screen width

      // ── Snap Point Physics ──────────────────────────────
      // Choose whether to complete the turn (snap to ±SCREEN_W) or bounce back to rest (snap to 0).
      // A quick flick (velocity exceeding 500px/sec) in the correct direction triggers a flip instantly.
      let targetX = 0;
      if (dragDistance < -threshold || (dragDistance < 0 && velocity < -500)) {
        if (hasNext) targetX = -SCREEN_W;
      } else if (dragDistance > threshold || (dragDistance > 0 && velocity > 500)) {
        if (hasPrev) targetX = SCREEN_W;
      }

      isAnimating.value = true;

      // ── Velocity-Aware Custom Snapping Duration ──────────
      // The snap timing is calculated using the distance left to travel and initial flick speed.
      // High-speed flicks result in brief, snappy transitions; slow releases transition smoothly.
      const remainingDistance = Math.abs(dragX.value - targetX);
      const velocityFactor = Math.min(Math.abs(velocity) / 2000, 1);
      const baseDuration = FLIP_CONFIG.duration ?? 480;
      const duration = Math.max(
        baseDuration * (1 - velocityFactor * 0.5) * (remainingDistance / SCREEN_W),
        180, // Minimum duration clamp to avoid abrupt visually jarring snaps
      );

      // Animate drag offset and progress in sync
      dragX.value = withTiming(targetX, { ...FLIP_CONFIG, duration });
      progress.value = withTiming(
        targetX / SCREEN_W,
        { ...FLIP_CONFIG, duration },
        () => {
          if (targetX !== 0) {
            // Success! Determine flip direction and safely dispatch state transition to the JS thread.
            const finishedDir: FlipDirection = targetX < 0 ? 'right' : 'left';
            runOnJS(handleFlipComplete)(finishedDir);
          } else {
            // Bounced back to original page; unlock animations
            isAnimating.value = false;
          }
        },
      );
    });

  // ── Animated styles ─────────────────────────────────────

  // 1. Foreground active page: Folds away in 3D space.
  // Combines 3D perspective projection, Y-axis rotation (up to 75deg), and subtle scale-down (to 92%)
  // to give a paper sheet folding-away depth sensation.
  const activePageStyle = useAnimatedStyle(() => {
    // Maps progress (-1 to 1) into degrees rotation.
    // Right-to-left swipe yields positive 75deg tilt; left-to-right yields negative 75deg tilt.
    const rotateY = interpolate(
      progress.value,
      [-1, 0, 1],
      [75, 0, -75],
      Extrapolation.CLAMP,
    );

    // Subtle scale shrink creates a beautiful ambient distance effect.
    const scale = interpolate(
      Math.abs(progress.value),
      [0, 1],
      [1, 0.92],
      Extrapolation.CLAMP,
    );

    // Parallax factor: Displacing translateX by 60% of the drag creates an organic folding paper curl.
    const translateX = dragX.value * 0.6;

    return {
      transform: [
        { perspective: 1200 }, // Standard viewport lens distance for natural 3D projection
        { translateX },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
      opacity: interpolate(
        Math.abs(progress.value),
        [0, 0.8, 1],
        [1, 0.7, 0.3], // Slightly dim/fade the page as it folds off-screen
        Extrapolation.CLAMP,
      ),
      zIndex: 2,
    };
  });

  // 2. Background underlay page: Slides/scales forward.
  // Initially starts 5% scaled-down and partially transparent. As the user swipes the foreground,
  // the background underlay smoothly scales to 1.0 and goes to full opacity.
  const backgroundPageStyle = useAnimatedStyle(() => {
    const absProgress = Math.abs(progress.value);

    return {
      opacity: interpolate(
        absProgress,
        [0, 0.15, 1],
        [0, 0.6, 1], // Fades in quickly at start of swipe so there's no black flash
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            absProgress,
            [0, 1],
            [0.95, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
      zIndex: 1,
    };
  });

  // 3. Dynamic display toggles:
  // Decouples rendering pipeline to ensure that during a left swipe, only the NEXT page's
  // underlay renders, and during a right swipe, only the PREVIOUS page renders.
  const showNextStyle = useAnimatedStyle(() => ({
    display: progress.value <= 0 ? 'flex' : 'none',
  }));

  const showPrevStyle = useAnimatedStyle(() => ({
    display: progress.value >= 0 ? 'flex' : 'none',
  }));

  // ── Render Tree ──────────────────────────────────────────
  // The layout layers are structured as follows:
  // Layer 1 (Underlays): The next or previous static hymn previews (rendered behind).
  // Layer 2 (Foreground): The active page, containing the full interactive scroll and BookSpine.
  // Layer 3 (Overlay Shadows): The floating PageShadow that spans the fold crest.
  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* Underlay: Next Page Preview (rendered during left swiping) */}
        {hasNext && renderNextPage && (
          <Animated.View style={[StyleSheet.absoluteFill, backgroundPageStyle, showNextStyle]}>
            {renderNextPage()}
          </Animated.View>
        )}

        {/* Underlay: Previous Page Preview (rendered during right swiping) */}
        {hasPrev && renderPrevPage && (
          <Animated.View style={[StyleSheet.absoluteFill, backgroundPageStyle, showPrevStyle]}>
            {renderPrevPage()}
          </Animated.View>
        )}

        {/* Foreground Page: Contains current active hymn content */}
        <Animated.View style={[styles.page, activePageStyle]}>
          {children}
          <BookSpine isDarkMode={isDarkMode} />
        </Animated.View>

        {/* Dynamic folding shadow overlay */}
        <PageShadow progress={progress} width={SCREEN_W} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    backfaceVisibility: 'hidden', // Prevents flickers on older Android GPUs
    overflow: 'hidden',
  },
});
