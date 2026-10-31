# App editing

Use [ARCHITECTURE.md](../../ARCHITECTURE.md) for the source map, [EAS.md](../../EAS.md) for builds, and [README.md](../../README.md) for current status. These replace the old future-fixes and agent handoff plans.

## Before changing code

- Inspect Git status and current source; preserve unrelated edits.
- Android playback is fixed and confirmed working by Isaac. Preserve the TrackPlayer patch, native adapter and headless service.
- Build 7's iOS crash report is historical. Build 11 has now been built and submitted for TestFlight; see [EAS.md](../../EAS.md) for evidence and links.
- Use PowerShell `-LiteralPath` for the bracketed workspace.
- Keep theme tokens, bilingual strings, separate hymn/estribillo IDs, existing storage keys and playlist shapes.
- Minimize hides the full player; stop/clear ends playback. Do not merge those behaviors.
- Check safe areas and MiniPlayer clearance when moving controls.
- Edit web generators for generated data/pages. Avoid uploading the audio catalog for routine UI work.

## Validation

From `himnario/`:

```sh
npx tsc --noEmit
npm run lint
```

From the repository root, when relevant:

```sh
node --test scripts/test-android-playback.cjs
node scripts/test-web-search.js
```

Distinguish existing lint issues from regressions. Native audio requires a compatible native build, not Expo Go. Validate changed behavior on the target device; mocked checks do not establish lock-screen or Universal Link behavior.

Latest checks: TypeScript passes; targeted ESLint checks pass; all 16 playback/offline/search regression tests pass. Broader lint previously reported existing template alias errors. The new APK and iOS build are available for device/print verification; their creation is not proof that every visual or printing flow has passed on a phone.

## October 30 implementation handoff — Antigravity / Claude

These are Isaac's final UI choices after testing several APKs. Preserve these choices rather than restoring an intermediate design:

- Android main tabs: large Home, Book, Bookmark and Settings icons, with no visible text labels. The bar spans the bottom edge; no floating pill or side/bottom margins. Use native circular ripple feedback and a subtle selected highlight.
- iOS: retain NativeTabs, SF Symbols and labels. Do not replace them with the Android bar.
- Hymn reader toolbar: retain Text, Light/Dark and Audio labels alongside icons. On Android this remains a rounded toolbar, unlike the main navigation.
- Mini-player: website-inspired light parchment/burgundy and dark charcoal/cream, larger cover/title, rounded play button and matching outlined skip icons. Keep it directly above the bottom bar without a vertical gap.
- Geometry: Android icon row and reader toolbar share a 64px height in `androidBottomLayout.ts`. The main bar includes the safe inset below its row; the reader uses `androidBottomInset`. Root mini-player positioning must use the corresponding geometry.
- Android system navigation is hidden on startup/resume with `expo-navigation-bar`. Respect OS swipe access; validate on the actual phone.
- `utils/haptics.ts` makes Android tap/selection/notification haptics no-ops and preserves iOS feedback. Import that wrapper for new interactions rather than calling `expo-haptics` directly.
- Projector action is in the hymn header. Player sharing has the large artwork preview; WhatsApp uses its actual logo. Version labels read the app config.
- App PDF: two identical copies on landscape Letter with a center cut line, an include-title toggle, and page-count-based font reduction for long lyrics. Turning the title off removes header metadata. Errors and preparing state have bilingual strings.
- Website PDF: preserve the original portrait default, one/two lyric columns, font controls, auto-fit, download and print; landscape two-copy format and title toggle are additional options. Web changes have not been deployed by these native builds.
- Keep existing canonical hymn URLs and association identifiers. Universal Links still need device verification; do not infer success from configuration or build completion.

New files such as `AndroidReaderControls.tsx`, `WebIcon.tsx`, `androidBottomLayout.ts` and `utils/haptics.ts` may be untracked. Include them with their callers when preparing a source commit; do not include private attachment directories or build logs.

For website work, see [docs/README.md](../README.md).
