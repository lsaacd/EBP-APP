# App editing

Use [ARCHITECTURE.md](../../ARCHITECTURE.md) for the source map, [EAS.md](../../EAS.md) for builds, and [README.md](../../README.md) for current status. These replace the old future-fixes and agent handoff plans.

## Before changing code

- Inspect Git status and current source; preserve unrelated edits. Note that active app feature work is on branch `app-web-parity` (with `main` synchronized).
- Android playback is fixed and confirmed working by Isaac. Preserve the TrackPlayer patch, native adapter and headless service.
- Build 7's iOS crash report is historical. Build 14 and Android `preview-arm64` build (`4ca994b5-54e5-4330-a40c-2e0fa8937bf8`) were built and submitted on November 2, 2026; see [EAS.md](../../EAS.md) for evidence and links.
- Use PowerShell `-LiteralPath` for paths containing parentheses (`app/(tabs)`).
- Keep theme tokens, bilingual strings, separate hymn/estribillo IDs, existing storage keys and playlist shapes.
- Minimize hides the full player; stop/clear ends playback. Do not merge those behaviors.
- Check safe areas and MiniPlayer clearance when moving controls.
- Edit web generators (`scripts/extract-hymns.js` and `scripts/generate-hymn-pages.js`) when updating `himnario/data/alabanzasPaginas.js` so `docs/` stays in sync.

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

Distinguish existing lint issues from regressions. Native audio and screen-orientation locking require a compatible native build, not Expo Go. Validate changed behavior on the target device; mocked checks do not establish lock-screen or Universal Link behavior.

Latest checks (November 3, 2026): `npx tsc --noEmit` passes with 0 errors; `npx expo config --type public` passes; all 16 playback/offline/search regression tests in `scripts/test-android-playback.cjs` pass.

## November 2–3, 2026 implementation handoff — Antigravity / Claude / Codex

These are Isaac's latest UI/UX decisions implemented on November 2–3, 2026. **Supersedes** all prior notes regarding Android tabs, Home header spacing, and website store badges:

1. **Bottom Navigation Bar (iOS & Android) — `himnario/app/(tabs)/_layout.tsx`**:
   - **Enlarged 28pt Icons**: Both iOS and Android use matching 28pt template PNG icons (`tab-{home,hymns,favorites,settings}-{outline,filled}` on iOS `NativeTabs`; `28pt` sizing on Android) — the maximum standard size for a 49pt tab bar.
   - **Label Typography & Spacing**: Display tab labels (`Inicio`, `Himnos`, `Favoritos`, `Ajustes`) using bold typography (`10.5pt`, `fontWeight: '700'`) positioned tightly beneath the icons (`vertical: -2` title adjustment), matching the compact Hallow app navigation layout.
   - **iOS Truncation & Drop Fix**: Native patch `patches/react-native-screens+4.16.0.patch` synchronizes `UITabBarAppearance` across tabs and forces an immediate layout flush on initial render, preventing unselected label drops and truncation of `"Favoritos"`.
   - **Dynamic Dark / Light Mode**: `ThemeContext.tsx` syncs `Appearance.setColorScheme(isDarkMode ? 'dark' : 'light')` and `_layout.tsx` dynamically sets `tintColor`, `iconColor`, `backgroundColor`, and `blurEffect`.

2. **`Inicio` (`himnario/app/(tabs)/home.tsx`) — Header, Glass Search & Tight Spacing**:
   - **Header Title**: Displays **`Himnario`** in bold serif (`Newsreader_700Bold`, `36px`), left-aligned with a circular `42×42` `GlassSurface` search button on the right.
   - **Eliminated Header Gap**: The initial vertical space between the `Himnario` header / search button and the `"Explora Todos Los Himnos"` card was removed by setting `contentInsetAdjustmentBehavior="never"` on `Animated.ScrollView` and `overrideScrollViewContentInsetAdjustmentBehavior: false` on the tab trigger. Do **not** remove these attributes.
   - **Simplified Feed**: Both "Continuar escuchando" and offline audio download cards were intentionally removed from `home.tsx`. Do **not** re-add them to `home.tsx`.

3. **Share Sheet & Interactive "Preparar PDF" Editor (`ShareSheet.tsx`, `PdfEditor.tsx`, `pdfLayout.ts`)**:
   - **Chronological Share Order**: The Share Sheet options strictly follow this exact 4-item list:
     1. **Share to Messages** (`sms:` composer with hymn title and canonical URL).
     2. **WhatsApp** (`wa.me/?text=...` with hymn title and canonical URL).
     3. **Create PDF** (switches into the interactive **Preparar PDF** modal).
     4. **Copiar Letra** (copies formatted hymn lyrics to clipboard).
   - **Interactive PDF Editor**: Features full parity with the companion website:
     - Format: "Una página" (Letter portrait) vs "Dos copias (cortar)" (Letter landscape 2-up with dashed cut line).
     - Stepper font size (4–28 pt).
     - Column layout (1 vs 2 columns, auto-defaulting to 2 columns for lyrics > 28 lines).
     - "Ajustar a la página" auto-fit calculation.
     - "Incluir título" header metadata toggle.
     - Live SVG preview and direct Print / Share PDF actions.

4. **Projector / Presentation Mode Orientation (`ProjectorModal.tsx`)**:
   - Unlocks physical phone rotation (`ScreenOrientation.unlockAsync()`) while projector mode is active, with a manual toolbar rotate toggle button (`MaterialIcons` `screen-rotation`).
   - Re-locks app to `PORTRAIT_UP` upon exiting projector mode.

5. **Website & Cloudflare Deployment (`docs/index.html`, `docs/js/mockups.js`, `scripts/deploy-cloudflare.ps1`)**:
   - **Google Play Link**: The placeholder *"Próximamente"* badge on the website has been replaced with an active link to the Closed Testing opt-in URL:
     `https://play.google.com/apps/testing/com.elbuenpastor.himnario`
     (Once Google approves production, this can point directly to `https://play.google.com/store/apps/details?id=com.elbuenpastor.himnario`).
   - **Live Cloudflare Release**: Successfully deployed to Cloudflare Pages (`ebp-himnario`) and live at `https://himnarioebp.com/`.
   - **Generated Preview Pages**: All 761 static hymn pages in `/himno/` and `/hymn/` use the production CDN base `https://audio.himnarioebp.com/` and the updated Apple App Site Association.
   - **Agent Tooling**: 19 Cloudflare skills installed at `~/.agents/skills` and Cloudflare Streamable HTTP MCP registered at `https://mcp.cloudflare.com/mcp`.
