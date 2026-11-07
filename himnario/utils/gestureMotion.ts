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
