/** Native SVG images decode after React commits; a fixed delay cannot establish readiness. */
export async function waitForVerseShareAssets(
  ready: () => boolean,
  current: () => boolean,
  options: {
    timeoutMs?: number;
    now?: () => number;
    wait?: (ms: number) => Promise<void>;
  } = {},
): Promise<void> {
  const now = options.now ?? Date.now;
  const wait =
    options.wait ??
    ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + (options.timeoutMs ?? 3000);
  while (true) {
    if (!current()) throw new Error("verse_share_changed");
    if (ready()) return;
    if (now() >= deadline) throw new Error("verse_share_not_ready");
    await wait(25);
  }
}
