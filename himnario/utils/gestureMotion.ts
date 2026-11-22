/** Pure worklet-safe gesture decisions, shared with the regression checks. */
export function tabReleaseTarget(position: number, velocity: number, start: number, count: number) {
  'worklet';
  // Project a short distance ahead for flicks; never skip an adjacent tab.
  const projected = position + velocity * 0.16;
  return Math.max(0, Math.min(count - 1, Math.max(start - 1, Math.min(start + 1, Math.round(projected)))));
}

export function shouldCollapsePlayer(distance: number, velocity: number, travel: number) {
  'worklet';
  // A quick upward reversal must cancel even after a long downward drag.
  if (velocity < -500) return false;
  return distance > travel * 0.27 || (distance > 24 && velocity > 850);
}

export function miniPlayerFrame(width: number, height: number, bottom: number, android: boolean, measuredHeight?: number) {
  'worklet';
  const inset = android ? 12 : 20;
  const miniHeight = measuredHeight ?? (android ? 74 : 57);
  return { x: inset, y: Math.max(0, height - bottom - miniHeight), width: width - inset * 2, height: miniHeight };
}

export function clampMiniPlayerDrag(
  translationX: number,
  slotWidth: number,
  hasPrev: boolean,
  hasNext: boolean,
) {
  'worklet';
  const width = Math.max(120, slotWidth);
  if (translationX < 0) {
    if (!hasNext) return Math.max(-width * 0.35, translationX * 0.25);
    return Math.max(-width, translationX);
  }
  if (translationX > 0) {
    if (!hasPrev) return Math.min(width * 0.35, translationX * 0.25);
    return Math.min(width, translationX);
  }
  return 0;
}

/**
 * Returns 1 to advance to next track (swipe left), -1 for previous track (swipe right),
 * or 0 to cancel and snap back to the current track.
 */
export function miniPlayerSwipeDirection(
  translationX: number,
  velocityX: number,
  slotWidth: number,
  hasPrev: boolean,
  hasNext: boolean,
): -1 | 0 | 1 {
  'worklet';
  const width = Math.max(120, slotWidth);
  if (translationX < 0) {
    if (!hasNext || velocityX > 350) return 0;
    if (translationX < -width * 0.28 || (translationX < -14 && velocityX < -520)) {
      return 1;
    }
    return 0;
  }
  if (translationX > 0) {
    if (!hasPrev || velocityX < -350) return 0;
    if (translationX > width * 0.28 || (translationX > 14 && velocityX > 520)) {
      return -1;
    }
    return 0;
  }
  return 0;
}

/**
 * Picks which resting height a bottom sheet settles at when released.
 * `snaps` are heights in ascending order; `velocityY` is positive when the
 * finger moves down (the sheet shrinks). A flick moves one detent in its
 * direction from wherever the sheet currently is; otherwise the nearest wins.
 */
export function sheetSnapTarget(height: number, velocityY: number, snaps: number[]) {
  'worklet';
  let nearest = 0;
  for (let i = 1; i < snaps.length; i++) {
    if (Math.abs(snaps[i] - height) < Math.abs(snaps[nearest] - height)) nearest = i;
  }
  if (Math.abs(velocityY) < 600) return nearest;
  if (velocityY < 0) {
    for (let i = 0; i < snaps.length; i++) if (snaps[i] > height + 1) return i;
    return snaps.length - 1;
  }
  for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i] < height - 1) return i;
  return 0;
}
