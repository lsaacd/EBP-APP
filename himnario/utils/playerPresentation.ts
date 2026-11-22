/** Nested hymn screens should replace one another, never stack native sheets. */
export function lyricsNavigation(
  pathname: string,
  hymnId: string,
): "none" | "replace" | "push" {
  if (pathname === `/hymn/${hymnId}`) return "none";
  return pathname.startsWith("/hymn/") ? "replace" : "push";
}

/** Reserve controls/safe areas before choosing the artwork's deterministic frame. */
export function expandedArtworkFrame(
  width: number,
  height: number,
  top: number,
  bottom: number,
  hasError: boolean,
) {
  // Handle (17), top bar (66), margins, info, progress, playback and actions.
  const fixedControlsHeight = 474 + (hasError ? 80 : 0);
  const size = Math.min(
    width - 56,
    Math.max(120, height - top - bottom - fixedControlsHeight),
    500,
  );
  return { x: (width - size) / 2, y: top + 83, width: size, height: size };
}
