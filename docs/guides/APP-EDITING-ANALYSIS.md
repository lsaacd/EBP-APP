# App editing

Use [ARCHITECTURE.md](../../ARCHITECTURE.md) for the source map, [EAS.md](../../EAS.md) for builds, and [README.md](../../README.md) for current status. These replace the old future-fixes and agent handoff plans.

## Before changing code

- Inspect Git status and current source; preserve unrelated edits. Note that active app feature work is on branch `app-web-parity` (with `main` merged in).
- Android playback is fixed and confirmed working by Isaac. Preserve the TrackPlayer patch, native adapter and headless service.
- Build 7's iOS crash report is historical. Build 12 (`0a349cae-f337-422b-97cd-4f301c76b746`) and Android `preview-arm64` build (`a9fe3ee0-e392-4308-b1b7-facc67642d26`) were built and submitted on November 2, 2026; see [EAS.md](../../EAS.md) for evidence and links.
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

Latest checks (November 2, 2026): `npx tsc --noEmit` passes with 0 errors; `npx expo config --type public` passes; all 16 playback/offline/search regression tests in `scripts/test-android-playback.cjs` pass.

## November 2, 2026 implementation handoff — Antigravity / Claude

These are Isaac's latest UI/UX decisions implemented on November 2, 2026. **Supersedes** the October 30 note regarding icon-only Android tabs and the old Home header:

1. **Bottom Navigation Bar (iOS & Android) — `himnario/app/(tabs)/_layout.tsx`**:
   - **Custom Home Icon**: Both iOS and Android use the custom rounded house with an arched doorway (`assets/images/tab-home-outline*.png` & `tab-home-filled*.png` on iOS `NativeTabs`; `components/HomeTabIcon.tsx` SVG on Android). Unselected state is outlined; selected state is solid-filled with the arched doorway cutout.
   - **Apple Books Tab Font & Android Text Labels**: Both iOS and Android display tab text labels (`Inicio`, `Himnos`, `Favoritos`, `Ajustes` / English equivalents) using `PublicSans_600SemiBold` (unselected) and `PublicSans_700Bold` (selected) at `10.5px` with tight letter-spacing (`-0.15`). On Android, each tab wraps its icon + label inside a rounded active pill highlight (`selectionPill`). Do **not** remove the text labels from Android's bottom bar.
   - **Dynamic Dark / Light Mode**: `ThemeContext.tsx` syncs `Appearance.setColorScheme(isDarkMode ? 'dark' : 'light')` and `_layout.tsx` sets `tintColor`, `iconColor`, `backgroundColor`, and `blurEffect` so both iOS `NativeTabs` and `AndroidBottomBar` switch immediately between dark and light mode.

2. **`Inicio` (`himnario/app/(tabs)/home.tsx`) — Apple Books Header, Glassmorphic Search & Simplified Feed**:
   - **Header Title**: Displays **`Himnario`** (not `"Himnario El Buen Pastor"`), left-aligned in big bold serif (`Newsreader_700Bold`, `36px`, `lineHeight: 42`, `letterSpacing: -0.4`), switching between `#ffffff` in dark mode and `theme.primary` in light mode.
   - **Scroll Disappear Effect**: On **both iOS and Android**, scrolling down fades out (`opacity: 1 -> 0`) and slides up (`translateY: 0 -> -10`) the header row (`Himnario` title + search button).
   - **Glassmorphic Search Button**: A circular `42×42` `GlassSurface` button with a subtle 1px specular border sits on the right side of the `Himnario` header row on both iOS and Android. Tapping it navigates to `/hymns` with `{ tab: 'himnos', focusSearch: '1', t: String(Date.now()) }`.
   - **Simplified `Inicio` Content**: Both the **"Continuar escuchando"** card and the **"Descargar todos los himnos"** / offline audio cards (`IosStreamingNotice` and the compact offline status row) were intentionally removed from `home.tsx`. Do **not** re-add them to `home.tsx`. Keep `OfflineAudioCard` inside `himnario/app/(tabs)/settings.tsx`.

3. **Projector / Presentation Mode Orientation (`himnario/components/ProjectorModal.tsx`, `himnario/app.json`, `himnario/app/_layout.tsx`)**:
   - Uses `expo-screen-orientation`. The app is locked to `PORTRAIT_UP` globally in `app/_layout.tsx`, and unlocked (`ScreenOrientation.unlockAsync()`) when `ProjectorModal` is visible so physical phone rotation between Portrait and Landscape works freely.
   - Also includes a manual **Rotate toggle button** (`MaterialIcons` `screen-rotation`) in the projector bottom toolbar `utilityRow` that toggles between Landscape and Portrait (with a 90° layout rotation fallback when the OS window stays portrait due to system Portrait Orientation Lock).
   - Exiting `ProjectorModal` locks the app back to `PORTRAIT_UP`.

4. **Share Sheet & Interactive "Preparar PDF" Editor (`himnario/components/ShareSheet.tsx`, `himnario/components/PdfEditor.tsx`, `himnario/utils/pdfLayout.ts`)**:
   - The Share Sheet options strictly follow this exact 4-item chronological order:
     1. **Share to Messages** (native `sms:` composer with hymn title and canonical URL; falls back to system share if SMS is unavailable).
     2. **WhatsApp** (opens `wa.me/?text=...` with hymn title and canonical URL).
     3. **Create PDF** (switches directly into the in-app **Preparar PDF** editor with full website parity).
     4. **Copiar Letra** (copies full hymn lyrics, title, author, and reference to clipboard).
   - The in-app **Preparar PDF** editor features:
     - Format picker: "Una página" (Letter portrait single page) vs "Dos copias (cortar)" (Letter landscape 2-up with dashed cut line).
     - Font size stepper: `−` / `[ 13 ]` / `+` (4 to 28 pt).
     - Columns selector: "Una" vs "Dos" columns (auto-defaulted to 2 columns if lyrics > 28 lines).
     - "Ajustar a la página" button: auto-calculates the optimal font size so all stanzas fit on 1 page.
     - "Incluir título" toggle: switches header metadata, title, and divider rule on or off.
     - Live visual paper preview: rendered via `react-native-svg` (`SvgXml`) driven by `pdfLayout.ts`.
     - "Guardar / Compartir PDF" (`expo-sharing`) and "Imprimir" (`expo-print`) actions.

5. **iOS Bottom Tabs & Home Header Spacing (`himnario/app/(tabs)/_layout.tsx`, `himnario/app/(tabs)/home.tsx`, `himnario/patches/react-native-screens+4.16.0.patch`)**:
   - All four iOS tabs use matching 28pt template PNG icons (`tab-{home,hymns,favorites,settings}-{outline,filled}`) — the maximum standard size for a 49pt tab bar — with tight vertical title adjustment (`vertical: -2`), and Android icons are enlarged to 28pt to match.
   - `patches/react-native-screens+4.16.0.patch` synchronizes `UITabBarAppearance` to the tab bar from the selected tab on mount and forces a relayout flush, eliminating unselected label drops.
   - Initial vertical gap between "Himnario" and the hero card is eliminated with `contentInsetAdjustmentBehavior="never"` on `Animated.ScrollView` and `overrideScrollViewContentInsetAdjustmentBehavior: false` on the Home tab trigger.

6. **Preserved October 30 decisions**:
   - Hymn reader toolbar (`AndroidReaderControls.tsx`), MiniPlayer geometry (`androidBottomLayout.ts`, `64px` bar height), hidden Android system navigation bar (`expo-navigation-bar`), Android no-op haptics wrapper (`utils/haptics.ts`), and the printable PDF export remain in place.

For website work, see [docs/README.md](../README.md).
