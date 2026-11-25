# Native builds and updates

## November 25, 2026 — SDK 58 iOS OTA #14: Swipeable Unclipped Índice Pills & Exact Oyelo `GenerationReviewView` Login/Account Sheet Match

- **Branch & Source:** `sdk-58` branch (commit `4c72b92`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`46c740a8-0a35-4dce-aff3-3b68b738c173`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/46c740a8-0a35-4dce-aff3-3b68b738c173)
  - **iOS Update ID:** `01a2139b-1031-7f93-ab32-716ad95d0577`
  - **Included Changes:**
    - **Unclipped horizontal-swipeable Índice pills (`app/(tabs)/hymns.tsx`):** Removed `marginLeft: -8` clipping inside `FlatList`, moved list horizontal padding onto rows/headers, and wrapped `[Himnos] [Estribillos] [Coritos]` in a full-width horizontal `<ScrollView horizontal alwaysBounceHorizontal showsHorizontalScrollIndicator={false}>` with `16pt` horizontal padding.
    - **Exact Oyelo `GenerationReviewView.swift` Login/Account sheet alignment (`components/AuthSheetSwiftUI.tsx`):** Added `<ToolbarItem placement="principal">` + `navigationTitle('')` so titles sit dead-center under the grabber bar, switched card containers from stark `#FFFFFF` to Oyelo's soft neutral opaque surface (`#E9E9EE` Light / `#262629` Dark), moved the `Iniciar sesión | Crear cuenta` segmented picker into an opaque card row (eliminating dark sunset bleed-through and the extra gap below it), replaced the oversized bottom burgundy bar with a compact Oyelo-style grouped action row card so all 3 sections fit cleanly inside `.medium` detent, and styled `Cancelar` / `Cerrar` with calm monochrome `primary` ink.
  - **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors on both modified files, `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.3 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #13: Centered Índice A–Z Carousel, Coritos Índice Pill (27–124), Settings Large-to-Blur Title, Opaque AuthSheet Cards & Share Sheet / Profile Reopen Fix

- **Branch & Source:** `sdk-58` branch (commit `ac194b9`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`5e9bcc8f-2985-4278-85bc-f8bd60604941`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/5e9bcc8f-2985-4278-85bc-f8bd60604941)
  - **iOS Update ID:** `01a2138b-4d77-7f6c-8e7b-cc0d4d0abe47`
  - **Included Changes:**
    - **Centered Índice A–Z glass carousel (`app/(tabs)/hymns.tsx`):** Removed `flex: 1` top-stretching on `alphabetGlassCapsule`, measured `indiceBody` height dynamically, and bounded the capsule height (`<= 400pt`) centered safely above the bottom tab bar and active `MiniPlayer` (re-measuring touch coordinates whenever `MiniPlayer` state changes).
    - **Coritos pill in Índice only (`app/(tabs)/hymns.tsx`, `context/LanguageContext.tsx`):** Added a 3rd capsule pill (`[Himnos] [Estribillos] [Coritos]`) inside Índice splitting `Estribillos` (`1–26`, 26 items) and `Coritos` (`27–124`, 98 items) with bilingual titles while keeping the top `Estribillos` sub-tab untouched (all 124 items together).
    - **Settings big title → blurry compact small title on scroll (`app/(tabs)/settings/_layout.tsx`, `components/screens/Settings.ios.tsx`):** Disabled the empty 44pt UIKit nav-bar dead row (`headerShown: false`), placed a bold `34pt` `Ajustes` title tightly at the top of `<Form>`, and bound `@expo/ui`'s `useScrollGeometryChange` UI-thread worklet to cross-fade in a soft frosted blur bar with small centered `Ajustes` on scroll.
    - **Opaque Auth/Account inner containers (`components/AuthSheetSwiftUI.tsx`):** Preserved the outer frosted Liquid Glass `<BottomSheet>` chrome while applying solid `listRowBackground(isDarkMode ? '#1C1C1E' : '#FFFFFF')` to all grouped content rows (`Isaac V2`, `Sincronizar`, `Acceso rápido`, sign-in inputs, benefits, and session actions).
    - **Share App header overlap & Profile reopen white-screen fix (`app/_layout.tsx`, `app/auth-sheet.tsx`, `components/AuthSheet.tsx`, `components/screens/Settings.ios.tsx`):** Switched `/auth-sheet` (`share-app` / `help`) to a native transparent iOS `formSheet` header bar with `contentInsetAdjustmentBehavior="automatic"` (eliminating `Tarjeta | Código QR` overlap) and routed Settings' `Compartir app` to the same sheet; kept SwiftUI's global `<Host><BottomSheet>` permanently mounted (never returning `null` on `!visible` for `swiftui-sheet`), isolated sub-page unmounts from global `closeAuthSheet()`, and increased the `<` back-to-Account reopen delay to `420ms`.
  - **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors across all 8 modified files, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.3 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #12: Account Tap Fix, Tight Oyelo Sheet Top Alignment & Major iOS 26 Native SwiftUI Profile/Coros/Ministries/Admin Overhaul

- **Branch & Source:** `sdk-58` branch (commit `e56cced`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`25ad0eb7-ebc9-4150-a2fc-08a4293cb8a3`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/25ad0eb7-ebc9-4150-a2fc-08a4293cb8a3)
  - **iOS Update ID:** `01a21367-c02a-7e33-9114-cf6599411476`
  - **Included Changes:**
    - Fixed tapping the signed-in Account card (and Quick Access rows) inside the SwiftUI native `<BottomSheet>` (`components/AuthSheet.tsx`, `components/AuthSheetSwiftUI.tsx`) with an idempotent post-dismiss navigation fallback timer (`280ms` alongside `onDismiss`, routed via `useRouter()`) plus `contentShape(shapes.rectangle())` full-row hit targets.
    - Tightened Auth & Account sheet top spacing via iOS 26 `listSectionMargins({ edges: 'top', length: 6 })` to match Oyelo's `.medium` sheet layout, kept Sign-In controls reachable at `.medium` detent, and added `lineLimit(1)` + `truncationMode('tail')` so long emails stay on one line.
    - Switched `/my-profile` and `/my-profile/[section]` (`app/_layout.tsx`, `app/my-profile.tsx`) to compact transparent headers with soft progressive scroll-under blur; upgraded `MyProfileOverview.ios.tsx` with a compact Avatar + Name + Obispo seal + single-line email hero card and a dedicated **Administration / Administración** section for Admin access.
    - Built native iOS 26 SwiftUI `<Form>` sub-pages (`components/screens/ProfileSubPages.ios.tsx`, `ProfileSubPages.tsx`) for **Ministry** (3 inset-grouped sections), **Choir** (with full Admin inline Edit/Delete/Add & instant publish preserved), **My Church** (verified map card, native Liquid Glass Country menu `<Picker>`, `<Toggle>`, prominent capsule Save), **Account Details**, and **Blocked Users**.
    - Upgraded **Friends** (`FriendsPanel.tsx`: `glassTrack` Liquid Glass segmented control, continuous `20pt` cards, Sacred Ink Dark/Light switch tints), **Notifications** (`NotificationsPanel.tsx`), and **Admin Moderation** (`CommunityModeration.tsx`: live pending summary strip, native SwiftUI chromatic Liquid Glass 4-segment `<Picker>`, continuous grouped cards, Sacred Ink/destructive pills, preserving 100% of Reports, Churches + 10-photo R2 manager, Members/Obispo verification, Choirs, and Pinned Choir Repertoire controls).
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on all 11 touched/created files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, `git diff --check` clean, iOS Hermes export clean (`7.3 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #11: Oyelo Native SwiftUI `<BottomSheet>` Glass, Settings Compact Soft Scroll Blur & Larger Preview Title, Sign-In UI Polish & Scrolling Índice Pills

- **Branch & Source:** `sdk-58` branch (commit `f4d687c`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`3ec1e78f-2717-4327-9bb5-d7a53a963b4e`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3ec1e78f-2717-4327-9bb5-d7a53a963b4e)
  - **iOS Update ID:** `01a21351-66a1-78f6-be9c-a5f6f11d583b`
  - **Included Changes:**
    - Upgraded iOS Auth & Account sheet (`components/AuthSheetSwiftUI.tsx`, `components/AuthSheet.tsx`, `app/_layout.tsx`, `app/auth-sheet.tsx`) to present via SwiftUI's native `<BottomSheet>` (`.presentationDetents([.medium, .large])`, `.presentationDragIndicator(.visible)`, `preferredColorScheme`) so iOS 26 renders Oyelo's genuine translucent frosted Liquid Glass sheet and frosted `<Form>` wells in Light Mode at `.medium` detent, smoothly morphing into luminous cards at `.large`. Routed `Share App` and `Help` seamlessly to `/auth-sheet?page=share-app` / `/auth-sheet?page=help` with back returning to the Auth sheet.
    - Redesigned the Sign-In form (`AuthSheetSwiftUI.tsx`, `LanguageContext.tsx`): floated the chromatic Liquid Glass `Sign In | Create Account` segmented pill cleanly on glass (`listRowBackground('clear')`, zero insets), added leading SF Symbols (`person`, `envelope`, `lock`) on credential fields, replaced the bare `Continue` row with a dedicated full-width prominent Sacred Ink capsule CTA + centered `Forgot password?` button, added a compact 3-row **With an account / Con tu cuenta** benefits strip (`icloud`, `person.2`, `building.columns` — zero crosses), and added a **Quick Access / Acceso rápido** header above app shortcuts.
    - Removed Settings top dead space (`app/(tabs)/settings/_layout.tsx`: compact transparent inline header with `headerLargeTitle: false`, `headerTransparent: true`, `headerShadowVisible: false`, `scrollEdgeEffects: { top: 'soft', bottom: 'soft' }`) and added `listSectionSpacing('compact')` + `scrollEdgeEffectStyle('soft', 'all')` on `<Form>` in `components/screens/Settings.ios.tsx` for Oyelo's progressive soft scroll-under blur.
    - Enlarged the Settings live font preview red/burgundy serif title (`¡Cuán Grande es Él!` / `How Great Thou Art!`) from fixed `18pt` to `Math.min(38, Math.max(28, Math.round(currentPx * 1.45)))`.
    - Moved Índice `Hymns | Choruses` pills (`app/(tabs)/hymns.tsx`) into `<FlatList ListHeaderComponent={indiceToggleHeader}>` so they scroll away smoothly while staying level with the `Himnos` category chips at rest (`paddingTop: 8`, `x = 16`, `indexLayouts` initial offset `52px`).
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on all 8 touched files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, `git diff --check` clean, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #10: Native SwiftUI Chromatic Liquid Glass Segmented Picker on Maps (`map.fill | list.bullet`)

- **Branch & Source:** `sdk-58` branch (commit `8f59624`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`8a06a50a-bb43-413b-83c3-078b584ff805`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/8a06a50a-bb43-413b-83c3-078b584ff805)
  - **iOS Update ID:** `01a2133e-47b4-7090-b52d-03be7a088211`
  - **Included Changes:**
    - Replaced the iOS Maps `Mapa | Lista` switcher (`himnario/app/churches.tsx`) with a compact (`118×40`) native SwiftUI `<Host><Picker>` (`pickerStyle('segmented')`, `controlSize('large')`, interactive `glassEffect` capsule, Sacred Ink `seedColor={theme.primary}`) rendering SF Symbols `map.fill` and `list.bullet` with bilingual accessibility labels (`t.profileMap` / `t.churchList`) for authentic Apple iOS 26 chromatic refractive Liquid Glass swipe-bubble behavior.
    - Kept `LiquidGlassSegmented` fallback for pre-SwiftUI iOS versions and left Favorites (count badges) and Android untouched.
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on `app/churches.tsx` 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #9: Maps Liquid Glass Swipe Bubble + Icons, Classic Índice + Leveled Pills, Apple Music Playlist Tab Bar + EBP Cover Art, Sacred Ink Palette & Split Reader Bar

- **Branch & Source:** `sdk-58` branch (commit `7990c2f`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`47062829-2b76-4500-8441-7511f2c3ec92`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/47062829-2b76-4500-8441-7511f2c3ec92)
  - **iOS Update ID:** `01a21327-c116-7d85-8800-9a27d1028ad4`
  - **Included Changes:**
    - Upgraded Maps `Mapa | Lista` segmented control (`components/LiquidGlassSegmented.tsx`, `app/churches.tsx`) with a genuine outer `GlassSurface` capsule (`glassTrack`), interactive refractive swipe-bubble magnification (`scaleX: 1.1`, `scaleY: 1.22`, `glassEffectStyle: 'clear'` while dragging with edge rubber-band + haptics), and restored classic `map.fill` / `list.bullet` icons.
    - Leveled the Índice `Himnos | Estribillos` pills directly with the category chips (`paddingTop: 8`, `paddingHorizontal: 16`, `height: 38`) and polished the classic printed-hymnal Índice rows (`--A--` bold serif headers, `19pt` Newsreader titles, inline `offline-pin`, explicit `height: 1` baseline dotted leaders, bold `tabular-nums` serif numbers, synced `indexLayouts`) in `app/(tabs)/hymns.tsx`.
    - Converted Favorites into a nested tab `<Stack>` (`app/(tabs)/favorites/{_layout.tsx, index.tsx, playlist/[id].tsx}` backed by `components/screens/FavoritesScreen.tsx` & `PlaylistDetailScreen.tsx`, keeping `app/playlist/[id].tsx` as fallback) so the iOS 26 Liquid Glass bottom tab bar & docked `MiniPlayer` stay visible inside Playlists like Apple Music while preserving `Link.AppleZoom`.
    - Replaced generic playlist gradient/music-note placeholders with official `EBP_HYMN_COVER.png` artwork on both Playlist thumbnails and Playlist Detail hero cards.
    - Aligned Sacred Ink Light Mode (`#6e1619` dark red) & Dark Mode (`#fdf9f2` warm white + `#010101` ink) across Settings SF Symbols & 5-Star Rate My App card (`Settings.ios.tsx`), My Profile SF Symbols (`MyProfileOverview.ios.tsx`), Auth sheet (`AuthSheetSwiftUI.tsx`, `AuthSheet.tsx`), Maps Pin Picker/Submit (`churches.tsx`), and Church QR (`ChurchQrSheet.tsx`).
    - Upgraded the iOS Hymn Reader bottom bar (`app/hymn/[id].tsx`, `components/TextSizeSheet.tsx`) to Option A — Apple Books–style split Liquid Glass `<GlassGroup>` (frosted `Texto | Claro/Oscuro` capsule with SF Symbols + detached prominent circular Play button + bottom gradient scrim).
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on all 16 touched/created files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #8: Fix Row Layout & Single-Tap Close, Flush Reader Dock, Oyelo SwiftUI Auth Sheet & Maps Liquid Glass

- **Branch & Source:** `sdk-58` branch (commit `b1067b6`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`03f8b07c-5b27-4d04-af7c-f28ec15cc8b1`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/03f8b07c-5b27-4d04-af7c-f28ec15cc8b1)
  - **iOS Update ID:** `01a2130c-b4a9-763e-a365-558d22126418`
  - **Included Changes:**
    - Fixed production vertical row stacking in Favorites, Playlists, and Índice by using a plain-object `<Pressable>` wrapper around `<View style={...}>` inside Expo Router's `<Link.Trigger>` (`components/HymnRowLink.tsx`, `app/(tabs)/favorites.tsx`), and added a 450ms tap debounce guard.
    - Fixed single-tap `×` close in `app/hymn/[id].tsx` by popping the entire nested `hymn` stack (and any stacked `hymn` entries) in one tap.
    - Exposed live measured `miniPlayerHeight` via `NowPlayingContext.tsx` / `app/_layout.tsx` and anchored both `TextSizeSheet.tsx` and prev/next page number buttons (`< N` / `N >`) flush directly above `MiniPlayer` (or directly above the bottom control bar when hidden).
    - Upgraded `/auth-sheet` on iOS to native SwiftUI `<NavigationStack>` + `<Form>` (`components/AuthSheetSwiftUI.tsx`, `components/AuthSheet.tsx`, `app/_layout.tsx` with `headerShown: false`, `sheetAllowedDetents: [0.68, 1.0]`, `listSectionSpacing('compact')`, `scrollEdgeEffectStyle('soft', 'all')`, `Cancelar`/`Cerrar` cancellation pills, and prominent circular burgundy `key.fill` button).
    - Upgraded all Churches Maps pop-ups & icons (`app/churches.tsx`, `components/ChurchQrSheet.tsx`) to genuine iOS 26 Liquid Glass (translucent inset cards, `DetentSheet` header `×` circles, Admin Pending chips, Look Around / My Church / QR action buttons, Drop-a-Pin confirmation card, Submit/Edit Church sheet with `Cancelar` pill, Fullscreen Photo `Done` pill, QR Camera Scanner `Close` & hint pills, and floating Liquid Glass `ChurchQrSheet`).
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on all 10 touched files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #7: Apple Fluid Zoom (`Link.AppleZoom`) on Playlists + Long-Press `Link.Preview` & `Link.Menu` on Hymn Rows

- **Branch & Source:** `sdk-58` branch (commit `006b8e7`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`374dd6a9-cf0e-4eb5-af64-97ebac08939d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/374dd6a9-cf0e-4eb5-af64-97ebac08939d)
  - **iOS Update ID:** `01a212ea-087f-7eaf-8805-12ec37c80156`
  - **Included Changes:**
    - Added reusable `HymnRowLink` (`himnario/components/HymnRowLink.tsx`) wrapping iOS hymn rows across `home.tsx` (*Himnos Recientes*), `hymns.tsx` (*Himnos*, *Estribillos*, *Índice*, and Search results), `favorites.tsx` (*Mis Favoritos*), and `playlist/[id].tsx` with lazy live `<Link.Preview />` + native Liquid Glass `<Link.Menu>` (*Play*, *Save/Remove Favorite*, 1-tap *Add to playlist…* `isOn` checkmark submenu, *Share hymn*, and destructive *Remove from playlist*). Android/Web keep plain `TouchableOpacity` rows.
    - Guarded `addRecent` in `himnario/app/hymn/[id].tsx` with `useIsFocused()` so peeking via long-press `<Link.Preview />` never pollutes *Himnos Recientes* unless opened.
    - Added Apple Fluid Zoom (`Link.AppleZoom` → `Link.AppleZoomTarget`) from Playlist cards in `favorites.tsx` into the centered Hero Artwork on `playlist/[id].tsx`, plus long-press `<Link.Menu>` (*Play*, *Shuffle*, *Delete Playlist*).
    - Added bilingual context-menu strings (`contextSaveFavorite`, `contextRemoveFavorite`, `contextRemoveFromPlaylist`) in `LanguageContext.tsx`.
  - **Verification:** `tsc --noEmit` 0 errors, ESLint on all 7 touched files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #6: Native iOS 26 Liquid Glass `formSheet` Auth & Account Sheet

- **Branch & Source:** `sdk-58` branch (commit `1ec5ffe`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`77864022-1897-465b-9778-ddc206e1f527`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/77864022-1897-465b-9778-ddc206e1f527)
  - **iOS Update ID:** `01a212cf-901a-7c8b-a4e1-6c7f0f3fd9c3`
  - **Included Changes:**
    - Migrated the entire iOS top-right Auth & Account sheet (both signed-out Login/Register/Recovery and signed-in Account & sub-pages) from a custom React Native `<Modal>` to a native iOS 26 Liquid Glass Expo Router `formSheet` route (`himnario/app/auth-sheet.tsx`, registered in `himnario/app/_layout.tsx` with `sheetGrabberVisible: true`, `sheetAllowedDetents: [0.72, 1.0]`, `headerTransparent: true`, `scrollEdgeEffects: { top: 'soft', bottom: 'soft' }`, and transparent `contentStyle`). Android/Web keep the existing `<Modal>` `AuthSheet`.
    - Added an edge-triggered `authSheetRequestId` in `himnario/context/AuthContext.tsx` so all existing `openAuthSheet()` / `openAuthSheetToPage()` call sites present `/auth-sheet` on iOS cleanly without swipe-dismiss bounce-back.
    - Added Oyelo-inspired native `Stack.Toolbar` header buttons (left frosted Liquid Glass `Cancelar` pill when signed out / `chevron.left` on sub-pages; right prominent circular Sacred Ink burgundy Liquid Glass action button `#6e1619` light / `#9E2A32` dark with `key.fill` / `person.badge.plus` / `paperplane.fill` when signed out, and native `xmark` when signed in).
    - Replaced opaque card surfaces with translucent Liquid Glass inset-grouped cards (`borderRadius: 22`, `borderCurve: 'continuous'`), grouped `AnimatedField` inputs with hairline dividers, and a Sacred Ink burgundy capsule submit CTA.
  - **Verification:** `tsc --noEmit` 0 errors, `npx expo lint` + ESLint on all touched files 0 errors, all 11 `scripts/test-*.cjs` suites + `test-web-search.js` (761 items) passed, `git diff --check` clean, iOS Hermes export clean (`7.2 MB`, 129 assets). Physical iPhone TestFlight verification pending.

## November 25, 2026 — SDK 58 iOS OTA #5: No Tab Minimize, Classic Controls, Glass Map Sheet, Favorites Capsule, Burgundy Stars & Liquid Glass Login

- **Branch & Source:** `sdk-58` branch (commit `5a90281`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`4ecb18c5-425b-4727-8a04-c416dca28758`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/4ecb18c5-425b-4727-8a04-c416dca28758)
  - **iOS Update ID:** `01a212b8-8c7c-734b-b6ef-564abad92c97`
  - **Included Changes:**
    - Disabled 4 → 1 Liquid Glass bottom tab bar collapse on scroll across all tabs (`minimizeBehavior="never"` in `app/(tabs)/_layout.tsx`).
    - Restored classic underline sub-tabs (`Himnos | Estribillos | Índice`) on iOS in `app/(tabs)/hymns.tsx` and restored the floating Liquid Glass `TextSizeSheet` popover in `app/hymn/[id].tsx`.
    - Restored genuine translucent Liquid Glass background (removed `stableBackdrop`) and floating top `SheetGrabber` pill (`grabberPlacement="floating"`) on the Churches map `DetentSheet` (`app/churches.tsx`).
    - Combined the Favorites / Playlists header action buttons into one connected Liquid Glass capsule with Search (`🔍`) on the far left (`app/(tabs)/favorites.tsx`), and removed the SwiftUI `Picker(.segmented)` override in `LiquidGlassSegmented.tsx` to restore the custom sliding pill with count badges.
    - Redesigned the iOS Settings 5-star review card with Sacred Ink burgundy stars (`#6e1619` light / `#D14D56` dark) and burgundy capsule CTA (`components/screens/Settings.ios.tsx`).
    - Upgraded the signed-out Login / Register / Recovery sheet (`components/AuthSheet.tsx`) to genuine iOS 26 Liquid Glass with translucent inset cards, left Liquid Glass `Cancelar` capsule, dynamic title, and top-right circular burgundy submit button (`key.fill` / `person.badge.plus` / `paperplane.fill`).
  - **Verification:** `tsc --noEmit` 0 errors, `npx expo lint` 0 errors, all 11 `scripts/test-*.cjs` Node suites + `test-web-search.js` (761 items) passed, `git diff --check` clean, iOS Hermes export clean (`7.2 MB`, 129 assets, 0 bundled Apple fonts). Physical iPhone TestFlight verification pending.
  - **Also built reusable simulator dev client (for Expo Simulators cloud testing):** `ab730373-e05a-40aa-ad4e-71b99553354b` (`ios-simulator`, `2.1.0-sdk58-2`).

## November 24, 2026 — SDK 58 iOS OTA: Dark Mode Toggle Sacred Ink Tint

- **Branch & Source:** `sdk-58` branch (commit `aff8654`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`4df30934-e6b0-4217-be0f-7bea42337fe0`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/4df30934-e6b0-4217-be0f-7bea42337fe0)
  - **iOS Update ID:** `01a2110f-da6a-7630-9e4e-d23f9c1816b5`
  - **Included Change:** Updated the Settings Dark Mode `<Toggle>` tint (`components/screens/Settings.ios.tsx`) from system green to Sacred Ink theme tint (`#525252` in Dark Mode, `#6e1619` in Light Mode), matching `theme.js` and `Settings.legacy.tsx`.
  - **Verification:** `tsc --noEmit` 0 errors, `git diff --check` clean, `npx expo lint` 0 errors, iOS OTA export clean.

## November 24, 2026 — SDK 58 iOS OTA: Original Hymn Reader & Hymns Search Bar Restored + Dark Mode Toggle Switch

- **Branch & Source:** `sdk-58` branch (commit `8402ec7`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`6b1a8c22-8cb7-49c1-ad6e-ccd2f7b21aa0`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/6b1a8c22-8cb7-49c1-ad6e-ccd2f7b21aa0)
  - **iOS Update ID:** `01a21108-522c-77df-a08a-7f1d065d98f7`
  - **Included Changes:**
    - Restored original Hymn Reader top bar and prev/next buttons (`app/hymn/[id].tsx`), original Hymns search bar (`app/(tabs)/hymns.tsx`), and original non-glass controls on `MusicPlayer.tsx`, `MiniPlayer.tsx`, `ProjectorModal.tsx`, and Churches sheets/overlays (`app/churches.tsx`), keeping SDK 58 Liquid Glass upgrades strictly on existing Liquid Glass controls (`GlassSurface.tsx`, `HomeHeaderActions.tsx`, `favorites.tsx`, Churches top bar, `VerseCard.tsx`, `VerseDiscussionSheet.tsx`, `ActionToast.tsx`, `LiquidGlassSegmented.tsx`).
    - Replaced the Settings Appearance dropdown picker (`components/screens/Settings.ios.tsx`) with a native iOS 26 SwiftUI `<Toggle>` switch (`Modo Oscuro` / `Dark Mode`, monochrome SF Symbol, iOS green `#34C759` tint).
  - **Verification:** `tsc --noEmit` 0 errors, `git diff --check` clean, all Node test suites passed, `npx expo lint` 0 errors, iOS & Android Hermes exports clean.

## November 24, 2026 — SDK 58 iOS OTA: True iOS 26/27 Liquid Glass Icons & `GlassGroup` Containers

- **Branch & Source:** `sdk-58` branch (commit `2dd989c`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`85d0b1c5-122e-4b16-ba53-0c95a01bac8f`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/85d0b1c5-122e-4b16-ba53-0c95a01bac8f)
  - **iOS Update ID:** `01a210f5-6e25-7ce2-8e81-821c097c9814`
  - **Included Fixes:**
    - **`GlassSurface` & `GlassGroup` (`components/GlassSurface.tsx`):** Removed SDK 54 focus/AppState forced-remount `key` hack (handled natively by `expo-glass-effect@58`), added automatic iOS 26 style sanitization (stripping `overflow: 'hidden'`, synthetic borders, and opaque backgrounds while setting `borderCurve: 'continuous'`), forwarded `tintColor`, and exported `GlassGroup` (`UIGlassContainerEffect`).
    - **Grouped Glass Icon Bars & Capsules:** Wrapped paired/grouped icon bars in `<GlassGroup>` across Churches top bar (`app/churches.tsx`), Hymn Reader top-right actions (`app/hymn/[id].tsx`), Favorites search takeover & hero actions (`app/(tabs)/favorites.tsx`), and Verse Discussion sheet (`components/VerseDiscussionSheet.tsx`); removed stale remount keys in `HomeHeaderActions.tsx` and `favorites.tsx`.
    - **Upgraded Interactive Glass Icons & SF Symbols:** Converted remaining flat iOS icons/pills to interactive Liquid Glass + SF Symbols across Hymns search bar & A–Z scrubber (`app/(tabs)/hymns.tsx`), Hymn Reader close/nav/floating pill (`app/hymn/[id].tsx`), MusicPlayer top `✕`/`⌄` & tinted Lyrics pill (`components/MusicPlayer.tsx`), MiniPlayer controls (`components/MiniPlayer.tsx`), Projector exit/reveal/toolbar (`components/ProjectorModal.tsx`), Churches sheet `✕`, photo viewer **Done**, and QR scanner **Close** (`app/churches.tsx`), VerseCard dark-art adaptive glass (`components/VerseCard.tsx`), and `ActionToast.tsx`.
  - **Verification:** `tsc --noEmit` 0 errors, all Node test suites passed, `git diff --check` clean, `npx expo lint` 0 errors (223 warnings), iOS & Android Hermes exports clean. Physical iPhone TestFlight verification pending.

## November 24, 2026 — SDK 58 iOS OTA Polish (Fabric church pins, Settings scroll header, Light-Mode status bar, classic gold 5-star rating)

- **Branch & Source:** `sdk-58` branch (commit `cffa278`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5`).
- **iOS OTA (`production` channel/branch, `runtimeVersion: "2.1.0-sdk58-2"` — Build `#39` only):**
  - **Update Group:** [`55086d4d-cb76-46c1-8ad1-cdcf6f7bc46c`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/55086d4d-cb76-46c1-8ad1-cdcf6f7bc46c)
  - **iOS Update ID:** `01a210b7-873e-73ff-9f18-79ee64be588a`
  - **Included Fixes:**
    - **Churches Map Pins & UI (`app/churches.tsx`, `components/DetentSheet.tsx`):** Replaced `<Marker image={...}>` (invisible under RN `0.88.1` Bridgeless Fabric where `[RCTBridge currentBridge]` is nil) with a Fabric-safe explicit-sized `<ChurchPinMarker>` child `<Image>`, added initial camera framing for nearest church + user dot, added top status-bar gradient scrim, frosted `DetentSheet` backing in both List & Detail modes, inside sheet grabber, half-sheet default when `<= 3` churches, and iOS `LiquidGlassSegmented` for `Mapa | Lista`.
    - **Settings Scroll Header & Tab-Bar Minimization (`Settings.ios.tsx`, `app/(tabs)/settings/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/my-profile.tsx`):** Removed outer wrapper `<View>` / `<KeyboardAvoidingView>` around `<Host><Form>`, enabled `headerLargeTitleEnabled: true` + iOS 26 system background + `headerUserInterfaceStyle` + adaptive black/white titles + monochrome primary row ink + consistent sentence-case section titles + centered signature footer.
    - **App-Wide Light-Mode Status Bar (`app/_layout.tsx`, `app/(tabs)/settings/_layout.tsx`, `app/hymn/_layout.tsx`):** Added `statusBarStyle` to native `<Stack>` `screenOptions` so status bar clock/battery stay dark in Light Mode even when the iPhone is in System Dark Mode.
    - **Interactive Classic iOS Gold 5-Star Rating (`Settings.ios.tsx`, `LanguageContext.tsx`):** Replaced the `¿Disfrutas la app?` disclosure button with an interactive warm-gold 5-star SwiftUI card (tapping 4–5 stars prompts App Store review; 1–3 stars prompts direct feedback) plus a dedicated feedback row in Support.
  - **Verification:** `tsc --noEmit` 0 errors, `196/196` Node tests + `761` search checks passed, `npx expo lint` 0 errors (0 new warnings), `git diff --check` clean, iOS & Android Hermes exports clean. Physical iPhone TestFlight verification pending.

## November 24, 2026 — iOS 26 Native Liquid Glass & `@expo/ui` TestFlight Build #39 (`sdk-58` branch, `runtimeVersion: "2.1.0-sdk58-2"`)

- **Branch & Source:** `sdk-58` branch (commit `143b1d3`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5` until TestFlight sign-off).
- **iOS `production`, Build #39 (`2.1.0 (39)`) — FINISHED on Xcode 27.1 and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`85ea3bf4-1464-450a-8ac3-a4214dc4902a`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/85ea3bf4-1464-450a-8ac3-a4214dc4902a)
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/MPDftzkr0l96M9dvFgdw2JylR_JULY1UEMHn1sPxX5k.ipa`
  - **Auto-Submission:** [`2ff03642-7c40-4f72-84fc-fa202635d082`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/2ff03642-7c40-4f72-84fc-fa202635d082) *(do **not** run manual `eas submit`)*
  - **Native Changes:** Added `@expo/ui@~58.0.29` (SwiftUI native bridge `ExpoUI`) and bumped `runtimeVersion` from `2.1.0-sdk58-1` to `2.1.0-sdk58-2`. All 3 patches re-applied cleanly (`@react-native-menu+menu+2.0.0.patch`, `react-native+0.88.1.patch`, `react-native-track-player+4.1.2.patch`).
  - **Included UI (iOS 26 Native Liquid Glass Polish Pass, Oyelo & Inkigo patterns):**
    - Guarded SwiftUI helper `himnario/utils/expoSwiftUI.ts` (Android/Web/Node-safe).
    - System / Light / Dark appearance mode in `ThemeContext.tsx` (`Appearance.setColorScheme('auto')` for system) + 19 new `es`/`en` strings in `LanguageContext.tsx`.
    - Oyelo-style native SwiftUI Settings (`components/screens/Settings.ios.tsx` + `app/(tabs)/settings/_layout.tsx` & `index.tsx` with `headerLargeTitle: true`, monochrome SF Symbols, hover-popover `Picker`s for Appearance & Languages, live serif font preview + native `Slider`, offline audio controls, Inkigo `DisclosureGroup`, and Share & About; legacy Settings preserved for Android/Web in `Settings.legacy.tsx`).
    - Inkigo-style native SwiftUI Profile (`components/screens/MyProfileOverview.ios.tsx` + transparent native large-title stack in `app/my-profile.tsx` & `app/_layout.tsx`, pull-to-refresh, `LabeledContent` rows, `churchDisplayName()`/`choirDisplayName()` rows, Sign Out, Danger Zone).
    - `NativeTabs` `minimizeBehavior="onScrollDown"` in `app/(tabs)/_layout.tsx` (collapsing tab bar on scroll across all 4 tabs).
    - Native SwiftUI `Picker(.segmented)` Liquid Glass lens bubble in `LiquidGlassSegmented.tsx` (adopted on iOS in `hymns.tsx`, `AuthSheet.tsx`, `AppShareSheet.tsx`, plus existing `favorites.tsx`, `FriendsPanel.tsx`, `member/[id].tsx`).
    - Translucent iOS 26 Liquid Glass `formSheet` routes `app/text-size-sheet.tsx` (from `app/hymn/[id].tsx`) and `app/about-sheet.tsx` (from `Settings.ios.tsx`).
  - **Verification:** `tsc --noEmit` 0 errors, `196/196` Node tests + `761` search checks passed, `npx expo lint` 0 errors (0 warnings in new files), iOS (`8.3 MB`) & Android (`8.5 MB`) Hermes exports clean. Physical iPhone TestFlight verification and matching Android `2.1.0-sdk58-2` rebuild remain.

## November 24, 2026 — Expo SDK 58 / Xcode 27.1 iOS TestFlight Build #38 (`sdk-58` branch, `runtimeVersion: "2.1.0-sdk58-1"`)

- **Branch & Source:** `sdk-58` branch (commit `825db8d`; `main` and `app-web-parity` remain on SDK 54 / `2.0.0-release-5` until TestFlight sign-off).
- **iOS `production`, Build #38 (`2.1.0 (38)`) — FINISHED on Xcode 27.1 and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`4ce09aa6-912c-4a24-ad8f-0d3ea3cceb2f`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4ce09aa6-912c-4a24-ad8f-0d3ea3cceb2f)
  - **Build Image:** `macos-tahoe-26.6-xcode-27.1-sdk-58` (**Xcode 27.1 / `27A9275`**, `iPhoneOS27.1.sdk`)
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/tQT9Ly5nF2J_ASLMnBFP-LccfIXMzlf42XiHqVPoOG4.ipa`
  - **Auto-Submission:** [`5d21d55f-83d0-44b2-af8b-28c2f5b3a4be`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/5d21d55f-83d0-44b2-af8b-28c2f5b3a4be) *(do **not** run manual `eas submit`)*
  - **Prior failed SDK 58 attempts on `sdk-58`:** Build `#36` (`15fc7322`, stopped in `npm ci` due to unused `sharp` devDependency compiling against VM `libvips`, fixed in `922407d`) and Build `#37` (`929e2271`, stopped on `@react-native-menu/menu` `#import "RCTBridge.h"`, fixed in `825db8d` with `patches/@react-native-menu+menu+2.0.0.patch`).
  - **Stack:** Expo SDK 58 (`expo@^58.0.26`), React Native `0.88.1`, React `19.3.0`, Reanimated `4.7.1`, Gesture Handler `~3.3.0`, `react-native-screens@~4.30.1`, `expo-router/native-tabs` (stable), UIKit `SceneDelegate` lifecycle, `AppleLookAround` Swift module, `react-native-track-player@4.1.2` (compiled cleanly on Xcode 27.1).
  - **Active patches (3):** `@react-native-menu+menu+2.0.0.patch`, `react-native+0.88.1.patch`, `react-native-track-player+4.1.2.patch` (`react-native-screens+4.16.0.patch` retired after upstream `4.30.1` tabs rewrite).
  - **Verification:** `tsc --noEmit` 0 errors, `196/196` Node tests + `761` search checks passed, `expo lint` 0 errors, iOS (`8.1 MB`) & Android (`8.2 MB`) Hermes exports clean, `expo-doctor` 19/20 (expected directory metadata for `react-native-track-player` & local `apple-look-around`). Physical iPhone TestFlight checklist and Android `2.1.0-sdk58-1` rebuild pending.

## November 24, 2026 — Swipe-down Home doctrine sheet & editorial cards (released)

Source `b3581eb`. iOS production OTA group [3a5900b7-2500-454a-94a1-f4b5dffd1c8f](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3a5900b7-2500-454a-94a1-f4b5dffd1c8f), iOS update `01a20ede-44ad-7b54-af63-cbfd1fdf7d81`, runtime `2.0.0-release-5` for Build #34. Upgraded the Home **Nombre, Lema, Fundamento y Finalidad** modal in `himnario/app/(tabs)/home.tsx` to a Glorify-style swipe-down Reanimated bottom sheet (draggable from backdrop, floating grabber, or sticky header), redesigned its content into a Scripture callout card + 4 structured icon-badged editorial cards with a Liquid Glass `X` button, and localized Home Recently Viewed hymn titles when App Language is English. TypeScript (`tsc --noEmit`), `expo lint` (0 errors, 0 warnings in `home.tsx`), `git diff --check`, and iOS Hermes export passed. Physical iOS swipe verification pending.

## November 24, 2026 — Profile navigation and sign-out (released)

Source `8ed9f84`. iOS production OTA group [7c22b4d8-75cd-4d1c-9cb0-0ff211130233](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/7c22b4d8-75cd-4d1c-9cb0-0ff211130233), iOS update `01a20ed7-e20b-79a0-82a6-4e60f1dcdbc1`, runtime `2.0.0-release-5` for Build #34. Profile sections use native stack entries. Member browsing replaces the current member, tapping oneself returns to the overview, and returning from a verse author reopens the discussion. Sign-out closes the account sheet and clears profile history. TypeScript, 196 tests, search checks and iOS export passed. Physical iOS swipe, notification and offline sign-out checks pending.

## November 24, 2026 — Glorify backdrop swipe, full member profiles + offline cache, Liquid Glass Favorites/Playlists, swipeable MusicPlayer artwork, and full Admin coro controls

- **Source:** commit `1787731`, pushed to both `main` and `app-web-parity` before publication. App version remains `2.0.0`; no native code, dependencies, or runtime version changed.
- **D1:** applied `workers/ebp-auth-sync/migrations/0017_friends_list_visibility.sql` to production `ebp-himnario-db` (`ed683396-bfd7-43ff-b69e-f82cf4621c55`, bookmark `0000015a-00000006-0000512d-e2885f3d668b49d0447b6be99b57b7b6`). Adds `show_friends_list INTEGER NOT NULL DEFAULT 1`.
- **Worker:** deployed `ebp-himnario-sync` version `e8b6bbc6-06ef-4c9a-bf97-b84bf4e08eec`. Adds `GET /users/:id/friends` (signed-in members see friend count & names unless opted out, excluding blocked/suspended users), `showFriendsList` in `PUT /auth/profile`, and unlocks Admin edit/delete for all approved coros (including built-ins).
- **Pages:** deployed [Pages `60dba153`](https://60dba153.ebp-himnario.pages.dev) to `ebp-himnario`, updating `docs/privacy.html` (ES & EN) for visible friend lists and the opt-out switch.
- **iOS OTA (latest):** published [group `90ef7b68-c3fb-496d-9d81-07e935286dd7`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/90ef7b68-c3fb-496d-9d81-07e935286dd7), iOS update `01a20ebe-0a5d-724a-a2e5-d5614bf73b98` (commit `2c530cf`), on `production` for runtime `2.0.0-release-5` — adds full-screen `/my-profile` page (Community + Admin Moderation + Account Edit) with streamlined `AuthSheet`, Apple Music–style top Liquid Glass search takeover in `favorites.tsx`, Fabric `imageColor` fix for visible SF Symbols in `MenuView` popovers, English hymn title localization across Favorites/Playlists/Member Profiles/MiniPlayer/MusicPlayer/Lock Screen, and live `setQueue` sync when re-sorting Favorites.
- **iOS OTA (earlier Nov 24):** published [group `144045be-5b87-4892-a5a7-5e34bad89dbb`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/144045be-5b87-4892-a5a7-5e34bad89dbb), iOS update `01a20cf0-0232-7638-8c7f-86cca42be8f9` (commit `6ecd690`), on `production` for runtime `2.0.0-release-5` — adds native iOS 26 `LiquidGlassSegmented` (`AnimatedGlassView` pill thumb + drag/tap), eliminates profile `<` back-arrow loop (`router.replace`), fixes dark-mode `Reproducir` / primary button `theme.onPrimary` contrast, removes iOS `overflow: 'hidden'` glass rim clipping, and enlarges header/capsule icons.
- **iOS OTA (previous):** published [group `154a6e7f-f46f-4e29-bba3-0e660aca5099`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/154a6e7f-f46f-4e29-bba3-0e660aca5099), iOS update `01a20cc7-88d6-7f31-b0c8-197cdbaf2728`, on `production` for runtime `2.0.0-release-5` (Build #34).
- **Included UI & Fixes:** Glorify-style backdrop swipe-down across all bottom sheets (`useSheetBackdropGesture.ts`), full-screen `/member/[id]` profile page with `AsyncStorage` offline cache (`memberProfileCache.ts`), Reanimated Liquid Glass segmented control in `FriendsPanel.tsx`, Admin edit/delete on all coros in `CommunityProfile.tsx` and `CommunityModeration.tsx`, Favorites queue skip & page-flip fix (`source: 'favorites'`), Apple Music–inspired Liquid Glass redesign for `favorites.tsx` and `playlist/[id].tsx` (Play/Shuffle pills, Sort `MenuView`, Create/Rename/Add Hymns sheets), and YouTube Music–style horizontal swipeable cover art in `MusicPlayer.tsx`.
- **Verification:** `tsc --noEmit` 0 errors, `npx expo lint` 0 errors (49 baseline warnings), 196/196 Node tests passing, `test-web-search.js` passed, `npx expo export --platform ios` clean (`8.33 MB` Hermes bundle), `audit-secrets.py` 0 findings. Physical iOS device check remains.

## November 23, 2026 — Consented church directory and coro editing release

- **Source:** commits `e505fcc` (features) and `791683d` (Pages OAuth helper), pushed to both `main` and `app-web-parity` before publication. App version remains `2.0.0`; no native code, dependencies, or runtime version changed.
- **D1:** applied `workers/ebp-auth-sync/migrations/0016_public_church_directory.sql` to production `ebp-himnario-db` (`ed683396-bfd7-43ff-b69e-f82cf4621c55`). Verified `directory_visible_to_all` exists with default `0`. Existing same-church consent does not expose members to visitors from other churches.
- **Worker:** deployed `ebp-himnario-sync` version `1329687d-69be-44ea-acb1-e4b92ed01215`. Live health returned `ok`, `/choirs` returned approved coros, and a signed-out church-directory request returned `401`.
- **Pages:** deployed [Pages `d13b5c7d`](https://d13b5c7d.ebp-himnario.pages.dev) to `ebp-himnario`; the [live privacy page](https://himnarioebp.com/privacy.html) returned `200` with the new Spanish and English consent wording. Used the OAuth-safe `deploy-cloudflare.ps1` with audio upload skipped.
- **iOS OTA:** published [group `d8d19cab-07a9-4449-b6f8-efbe6eb5f919`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/d8d19cab-07a9-4449-b6f8-efbe6eb5f919), iOS update `01a2082b-080e-72d5-8728-d484beeb7ca1`, on active `production` channel/branch for runtime `2.0.0-release-5` using EAS environment `production`. The channel was verified to point at this group after publication. This reaches compatible iOS Build #34 installations after the usual update download/relaunch cycle.
- **Included UI:** inclusive Amistades/Friends labels and counts, the simpler people tabs with iOS glass, signed-in church directory with a separate cross-church opt-in, `60×12` shared grabber, and admin editing of approved coro names. The existing Android APK is on `2.0.0-securestore-1` and cannot receive this OTA; no Android build or OTA was released.
- **Verification:** TypeScript passed, lint 0 errors / 49 warnings, all 11 Node suites passed (192 tests), and iOS Metro export completed. Physical iOS/Android UI and signed-in live directory flows still need device verification.

## November 23, 2026 — Church member directories

- **iOS production OTA for Build #34** on runtime `2.0.0-release-5` and version `2.0.0`. [Expo update group e27859f1-fcb2-4317-af1e-a8a1f43e064b](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/e27859f1-fcb2-4317-af1e-a8a1f43e064b). Update ID `01a20800-f4fa-73e0-86e1-05e3802f1e4d`.
- **Cloudflare Worker** `ebp-himnario-sync` version `8376daf2-d1cd-4991-823e-60ea2e3d6718` deployed before the OTA. Existing D1 schema supports the change.
- **Source commit** `4ffa8f4` pushed to both `main` and `app-web-parity`. Android's existing preview APK uses the older `2.0.0-securestore-1` runtime.
- TypeScript, 192 regression tests, web search checks, and the iOS export passed. Lint reported zero errors and 49 warnings. The live directory endpoints returned 401 for signed-out requests. Signed-in verification on a physical phone is pending.

## November 23, 2026 — App Store Release Candidate: iOS Production Build #34 (`runtimeVersion: "2.0.0-release-5"`)

Final App Store release build adding native **Apple MapKit driving distance & traffic-aware travel time** (`MKDirections.calculateETA()` in `AppleLookAroundModule.swift`), the standardized **`40×12` `SheetGrabber` pill**, pinned **`expo-file-system`** + SDK 54 dependency patches, and all **pre-App-Store compliance and stability fixes**.

- **Source version and runtime:** `version: "2.0.0"`, `"runtimeVersion": "2.0.0-release-5"` (bumped from `2.0.0-notif-4` for the new `getDrivingEstimate` native Swift function, cleaned `Info.plist` permissions, explicit `ios.privacyManifests`, and `CFBundleLocalizations`).
- **iOS `production`, Build #34 (`2.0.0 (34)`) — finished and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`d1f054c9-2609-46c8-8b90-c92ea369d04c`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/d1f054c9-2609-46c8-8b90-c92ea369d04c)
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/4ZqjbdGHTpA-hjMGmUjhQiHhVtb1Kl5MMwAoxiVk5uY.ipa`
  - **Auto-Submission:** [`ba24a1c2-cb7a-4d3c-8b96-e3c14a5f1f31`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/ba24a1c2-cb7a-4d3c-8b96-e3c14a5f1f31) (Uploaded to App Store Connect — do **not** run a manual `eas submit`).
  - **Native & Compliance Changes in `2.0.0-release-5`:**
    - `AppleLookAroundModule.swift`: added `getDrivingEstimate(fromLat, fromLng, toLat, toLng)` using `MKDirections.calculateETA` (with fresh `MKDirections.calculate` fallback) so church cards show real road distance & travel time matching Apple Maps (`44 mi (71 km) · 56 min`).
    - `himnario/app.json`: disabled unused `NSMicrophoneUsageDescription`, `NSLocationAlways*`, and `NSFaceIDUsageDescription`; added explicit `ios.privacyManifests` (`NSPrivacyTracking: false`, `UserDefaults` `CA92.1`, `FileTimestamp` `C617.1`) and `CFBundleLocalizations: ["es", "en"]`.
    - `himnario/package.json`: pinned direct dependency `expo-file-system` and updated SDK 54 patches (`expo@~54.0.37`, `expo-asset@~12.0.14`, `expo-constants@~18.0.14`, `expo-updates@~29.0.20`); all 3 `patch-package` patches verified intact.
    - App fixes embedded in Build #34 (commit `63c7307`): `40×12` `SheetGrabber`, Guideline 1.2 explicit UGC EULA/Community Rules gate (`VerseDiscussionSheet.tsx`, `AuthSheet.tsx`, removed silent auto-accept in `hymnCommunity.ts`), removed nested iOS `<Modal>` freeze in `CommunityProfile.tsx`, fixed dark-mode `outlineVariant` hex & contrast bugs, fixed `/(tabs)/home` notification route + cold-start dedupe, fixed QR `decodeURIComponent` guard, removed `"TestFlight"` user-facing fallback error copy.
- **iOS OTAs on branch `production`, runtime `2.0.0-release-5` (newest first):**
  - [`54f32fc2-2b66-4974-b86b-51732df0cd3c`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/54f32fc2-2b66-4974-b86b-51732df0cd3c) — previous (November 23, from commit `5a58f5b`, iOS update `01a207e5-4611-7908-9477-d98a9a7f4a4a`). Adds Admin remove-choir controls (`DELETE /mod/choirs/:slug`) directly in **Account → Coro** (trash icon with confirmation dialog & inline toast on custom choirs) and a dedicated **Coros publicados / Published choirs** management card in **Moderation → Coros**.
- **Backend & Web Paired Deployments (Live):**
  - **Cloudflare Pages (`ebp-himnario`):** Deploy `94eaed5a` (`https://94eaed5a.ebp-himnario.pages.dev` → `https://himnarioebp.com/`), updating `docs/privacy.html` & `docs/terms.html` (ES & EN) for Choir suggestions/moderation and foreground Apple MapKit driving estimates.
  - **Cloudflare Worker (`ebp-himnario-sync`):** Version `d0008031-4669-4541-bd68-55f7e6ee3770` (unchanged, live).
  - **Cloudflare D1 (`ebp-himnario-db`):** Migrations `0002`–`0015_choirs.sql` (unchanged, live).
- **Commit:** `63c7307` (pushed to `app-web-parity` & `main`).
- **Validation at build time:** `tsc --noEmit` 0 errors, `npx expo install --check` clean, `npx expo lint` 0 errors (49 warnings), all 11 Node test suites (191/191 tests passed), `test-web-search.js` passed (761 items), `audit-secrets.py` 0 findings (3,339 files), `npx expo export --platform ios` succeeded cleanly (2,114 modules, zero Apple fonts bundled).

---

## November 23, 2026 — Full Native Rebuild: iOS Production Build #33 & OTA (`runtimeVersion: "2.0.0-notif-4"`)

Ships **127 daily bilingual verses** with consecutive daily rotation (`getLocalDayNumber()`), **Notifications Phase 1** (in-app notification center + 5 community triggers + per-category switches), **Notifications Phase 2** (native `expo-notifications` + `expo-device` + Expo Push Service delivery), **animated floating-label forms** (`AnimatedField`), **redesigned Auth & Church forms**, and the **8-character minimum password length** across mobile, Worker, and web.

- **Source version and runtime:** `version: "2.0.0"`, `"runtimeVersion": "2.0.0-notif-4"` (bumped from `2.0.0-media-3` due to adding `expo-notifications` and `expo-device`).
- **iOS `production`, Build #33 (`2.0.0 (33)`) — finished and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`1f834da7-0481-4481-b29a-8464a531f880`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/1f834da7-0481-4481-b29a-8464a531f880) (auto-submitted — do **not** run a manual `eas submit`).
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/oMEV0Y57YjGyBg85txN2eS5zXA1qaTp8dQobfQwd4EA.ipa`
  - **Note on Build #32 (`448311eb-f325-4d93-a68c-1fce3c481f19`):** Errored at `Run fastlane` (0 Expo Build credits charged) because `--non-interactive` reused the pre-push provisioning profile `ZM5HK4A7JT` without `aps-environment`. Verified APNs Push Key in `eas credentials -p ios` and ran interactive `eas build` to sync Push Notifications capability for Build #33.
- **iOS OTAs on branch `production`, runtime `2.0.0-notif-4` (newest first):**
  - [`dc4ca9aa-232d-465a-a7a6-890babd35f38`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/dc4ca9aa-232d-465a-a7a6-890babd35f38) — **current** (November 23, from commit `6d5e969`, iOS update `01a207a2-2cc6-7b50-b035-988586dc8596`). Standardized `33×12` `SheetGrabber` pill across all bottom sheets (removed duplicate inner grabber from `TextSizeSheet`), Church Add/Edit unsaved-draft confirmation (`churchDraft.ts`), built-in **Coro Filadelfia**, member choir submissions + Admin approve/reject/edit/repertoire workflow using `AnimatedField`, `ActionToast`, and `choirsStore`. Needs D1 migration `0015_choirs.sql` and Worker `d0008031`, both live.
  - [`8d7718d5-7db4-43c2-88db-b7fc0639bc6d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/8d7718d5-7db4-43c2-88db-b7fc0639bc6d) — (November 23, from commit `07de4a3`, iOS update `01a2078d-b263-7a2a-adf3-904d5004df73`). Larger high-contrast `SheetGrabber` pill (`64×7`, clearance `22`) across all bottom sheets, new auto-dismissing `ActionToast` confirmation pill + updated badge/photo counter polish in `churches.tsx` (fires on pin change, pasted coordinates, camera/gallery/URL photo add, and cover switch), and full `"coritos"` → `"estribillos"` rename across mobile app and website.
  - [`6382c472-bd5f-414b-a049-70da51aeadd6`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/6382c472-bd5f-414b-a049-70da51aeadd6) — (November 23, from commit `614cb15`, iOS update `01a20775-be7c-746f-8f05-b017a25299b1`). Reusable Reanimated `AnimatedField` (floating labels, focus ring, haptics, inset-grouped variant), upgraded `AuthSheet` (sliding pill tabs, concise copy, error shake, 3-bar password strength meter), redesigned Church add/edit form (removed R2 intro text, compact location card with collapsible admin coordinates, 3-row iOS Contacts-style grouped address card), and 8-character password minimum.
- **Backend & Web Paired Deployments (Live):**
  - **Cloudflare D1 (`ebp-himnario-db`):** Migrations `0013_notifications.sql`, `0014_push_tokens.sql`, and `0015_choirs.sql` applied remotely.
  - **Cloudflare Worker (`ebp-himnario-sync`):** Version `d0008031-4669-4541-bd68-55f7e6ee3770` (dynamic choirs directory, Coro Filadelfia, member choir submissions, `/mod/choirs` moderation, and approved-choir repertoire; builds on `c21e262a` 8-char passwords and `79656977` notifications + Expo Push).
  - **Cloudflare Pages (`ebp-himnario`):** Deploy `3cc47454` (`https://3cc47454.ebp-himnario.pages.dev`, `"coritos"` → `"estribillos"` across `docs/`, regenerated 761 hymn pages + `hymns-data.js`; builds on `1b9a25e1` 8-char password reset page and `466a89e2` privacy notifications update).
- **Commits:** `a948821` (127 daily verses), `1751815` (Notifications Phase 1 & 2, `2.0.0-notif-4`), `614cb15` (animated forms, cleaner Auth & Church UI, 8-char password minimum), `07de4a3` (bigger SheetGrabber pill, Church form ActionToast feedback, `"coritos"` → `"estribillos"`), `6d5e969` (`33×12` SheetGrabber standard, church draft guard, Coro Filadelfia, choir submissions + moderation).

---

## November 22, 2026 (evening) — iOS Production Build #31 and OTAs (`runtimeVersion: "2.0.0-media-3"`)

Current release record. The Build #30 entry below describes the morning of the same day.

- **Source version and runtime:** `version: "2.0.0"`, `"runtimeVersion": "2.0.0-media-3"` (unchanged, so Builds #30 and #31 receive the same OTAs).
- **iOS `production`, Build #31 (`2.0.0 (31)`) — finished and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`2105a538-0d18-4d29-83f6-a922c35ac656`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/2105a538-0d18-4d29-83f6-a922c35ac656)
  - **Auto-submission:** [`e1843910-ba89-4066-9549-1a6bb45b077b`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/e1843910-ba89-4066-9549-1a6bb45b077b) (do **not** run a manual `eas submit`).
  - **Native change:** `himnario/modules/apple-look-around/ios/AppleLookAroundModule.swift` now presents `MKLookAroundViewController` directly and requests the scene by map item. No new native modules; JavaScript interface unchanged.
  - **Apple warning ITMS-90725:** built with the iOS 26.0 SDK (EAS image `macos-sequoia-15.6-xcode-26.0`, the `sdk-54` default). From April 2027 uploads need Xcode 27. This requires the Expo SDK upgrade in [guides/SDK-58-UPGRADE-PLAN.md](guides/SDK-58-UPGRADE-PLAN.md); do **not** set an Xcode 27 `image` on SDK 54.
- **iOS OTAs on branch `production`, runtime `2.0.0-media-3` (newest first):**
  - [`369019dc-4640-4979-a539-7295465e3e38`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/369019dc-4640-4979-a539-7295465e3e38) — **current** (November 23, from commit `2aaa2fe`, iOS update `01a206e7-8cd7-7146-affc-1d2255b46af5`). Verse card comment fixes (`loadFailed` vs send error, stale reply/edit/request-id recovery), comment liking (`POST /verse-comments/:id/like`, `sort=top` by likes + replies), and Friends ("Hermanos") phase 3 shared playlists (`POST /friends/:id/playlists`, `GET /playlists/shared`, seen/delete, Save to My Playlists, combined header & Account badge). Needs D1 migrations `0011_shared_playlists.sql` and `0012_comment_likes.sql` and Worker `5c474ce7`, all live; Pages `a6f62e3a` live for updated privacy & terms.
  - [`327e2203-2407-49fe-a0aa-20eb9e81f77b`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/327e2203-2407-49fe-a0aa-20eb9e81f77b) — (November 23, from commit `f7c2764`). Friends phases 2 and 4: a friend's favourite hymns, "De mi iglesia" suggestions, two privacy switches. Needs D1 migration `0010_friend_sharing.sql` and Worker `8fe80fe4` or later, both live. That Worker also fixes linked churches being wiped on profile saves.
  - [`3dc3d29a-6969-41f3-acb5-28afaabf1591`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3dc3d29a-6969-41f3-acb5-28afaabf1591) — (November 23, from commit `a5ab17d`). Friends ("Hermanos") phase 1: friend button and "Miembro desde" on the profile card, "Hermanos" page in the account sheet. Needs D1 migration `0009_friends.sql` and Worker `3689b22f` or later, both live.
  - [`03709a08-ad27-47f4-af2b-60593f0213e1`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/03709a08-ad27-47f4-af2b-60593f0213e1) — (November 23, from commit `e173270`). "Más gustados" chip in the Himnos tab (needs Worker `ba6eb62e` or later for `GET /hymns/top`); church leader entered as a plain name and shown as "SDD Hno <name>".
  - [`a08f14ab-e56c-4b6f-acc2-26b05f7740ad`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/a08f14ab-e56c-4b6f-acc2-26b05f7740ad) — (from commit `57f2930`). Hymn reader label "HIMNO N.º 243" / "HYMN NO. 243"; hymn QR code in the share sheet that opens the hymn on the website; distances as "38 mi (61 km)"; "Cerca de mí" frames the user with the nearest church and opens its card.
  - [`b58d065d-b081-4161-9d7f-67ab1695cc1d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/b58d065d-b081-4161-9d7f-67ab1695cc1d) — Church QR code restored on the card, with Share and Print; the code is encoded on the device (`himnario/utils/qrPath.ts`) instead of fetched from `api.qrserver.com`, and prints as inline SVG. Adds the pure-JS `qrcode` encoder (no native code; bundle +0.05 MB).
  - [`d351bb27-fd01-46bb-b304-393d7258d8a6`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/d351bb27-fd01-46bb-b304-393d7258d8a6) — Church form keyboard dismissal, QR scan from Account returns on cancel, top Liquid Glass controls, `SDD` title, native system fonts, location-first church form with schedule picker.
  - `78f9b043-d4a3-4337-b59f-6a299003ac05` — Liquid Glass sheet, "Cerca de mí" pill, unlink church, city-only church names, "Mirar alrededor".
  - `4cb9ae0d-49bc-4385-85ce-f11e02914322` — churches map + bottom sheet redesign, merged "Mi iglesia" row, floating sheet grabber, stacked-map fix; also carried the cleanup and string-table commits.
  - Roll back the newest with `eas update:rollback --branch production`.
- **Android:** unchanged. Last APK (`45c31c43`) is on runtime `2.0.0-securestore-1` and received none of this.
- **Backend:** Worker unchanged. One D1 data edit: `church-riverbank-ca.pastor_name` set to `Hno Azael Tapia`. Cloudflare Pages redeployed on November 22 (`afdbd124`, from commit `285e83e`) after the internal guides were moved out of `docs/`; the edge cache held the old copies for a while afterwards.
- **Validation at publish time:** type check clean, 11 Node suites / 151 tests pass, `expo lint` 0 errors / 50 warnings, iOS and Android bundle exports succeed. None of the UI was run on a simulator; only the owner's device has seen it.

---

## November 22, 2026 — Full Native Rebuild: iOS Production Build #30 (`runtimeVersion: "2.0.0-media-3"`)

User requested a full EAS native rebuild to ship native **Apple Maps Look Around (`MKLookAroundViewController`)**, **QR Code Scanner (`expo-camera`)**, **Camera & Photo Library church photo uploads (`expo-image-picker`, `expo-image-manipulator`)**, plus all Riverbank church, photo gallery, profile linking, YouTube Music-style comments sheet, audio deadlock, and 24 stability fixes.

- **Current Source Version & Runtime:** `version: "2.0.0"`, explicit `"runtimeVersion": "2.0.0-media-3"` in `himnario/app.json`.
- **iOS `production`, Build #30 (`2.0.0 (30)`) — FINISHED & AUTO-SUBMITTED TO APP STORE CONNECT / TESTFLIGHT:**
  - **EAS Build:** [`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/b6501dac-6ab5-4a5f-86e1-1740ce1036d3)
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/M_p7fFfbqEmaQIGbjTOL22NAFFl6tee3N0eimTJCPIg.ipa`
  - **Auto-Submission:** [`8a54ce14-8c49-4b9f-a352-20a9306cc064`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/8a54ce14-8c49-4b9f-a352-20a9306cc064) (Uploaded — do **not** run a manual `eas submit` for Build 30).
  - **New Native Modules Compiled into `2.0.0-media-3`:**
    - `himnario/modules/apple-look-around` (`AppleLookAroundModule.swift` — local Expo Swift module autolinked via `himnario/package.json` `expo.autolinking.searchPaths`, wrapping iOS 16+ `MKLookAroundSceneRequest` & `MKLookAroundViewController`).
    - `expo-camera` (in-app QR code scanner via `CameraView`).
    - `expo-image-picker` + `expo-image-manipulator` (camera/gallery church photos resized to ≤1400px JPEG with EXIF stripped).
    - `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` added to `himnario/app.json` `ios.infoPlist`.
- **Previous Nov 22 iOS OTAs on `2.0.0-maps-2` (for older Build 29 testers before upgrading to Build 30):**
  - `986859ba-293c-44f4-821c-ac55c794b1bf` (Audio end-of-track deadlock + 24 app-wide bug fixes + sync conflict resolution).
  - `68b58182-9f32-4855-9dbd-a81a31ac2ac2` (Phase 1 Churches map + custom cross-free sanctuary pins).
- **Android Status:** The last built Android APK (`45c31c43`) is still on runtime `2.0.0-securestore-1`. Run `eas build --platform android --profile preview-arm64` (or `production` for Play Store `.aab`) from `himnario/` when ready to cut an Android `2.0.0-media-3` binary with Maps, Location, Camera, and Photo Picker.
- **Backend & Web Paired Deployments (Live):**
  - **Cloudflare D1 `ebp-himnario-db`:** Migrations `0003` through `0008_church_gallery_and_link.sql` applied on remote D1 (seeded `church-riverbank-ca`).
  - **Cloudflare Worker `ebp-himnario-sync`:** Version `3e08460e-b5b5-4f99-97f1-eaa8bac1365b` with `env.MEDIA_BUCKET` (`ebp-himnario-audio`) binding.
  - **Cloudflare Pages `ebp-himnario`:** Deploy `972eec98.ebp-himnario.pages.dev` (`privacy.html` & `terms.html` updated and anonymized).

---

### Historical Releases Below

## Local verse chat fixes — November 20, 2026 (Superseded by Build 30)

Keyboard-visible first taps, emoji/self-reply submission, failed-send recovery, pending reply IDs and rapid heart toggles are fixed locally. **115 tests and TypeScript pass.** No OTA, rebuild or deployment was performed for this follow-up; the last published update remains `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`. Source version/runtime stay **2.0.0 / 2.0.0-maps-2**. See [the app editing handoff](guides/APP-EDITING-ANALYSIS.md) for causes, safeguards and device checks.


## November 20, 2026 — Published iOS OTA after Antigravity handoff

User authorized finishing Antigravity's interrupted verse-share/My Church work and publishing OTA. Source version remains **2.0.0**. Current explicit runtime is **2.0.0-maps-2**, with an existing finished iOS **build 29** (`7237c570-3ed2-4e37-9651-099d1154d247`, created November 20). Maps/location/native changes belong to that already-created binary; the finishing changes below add no native modules.

- **Published and independently verified:** iOS production OTA group [`6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a), update `01a1fb5a-4334-71db-b734-37c1e205fa07`, created **2026-11-20 15:45:59 PST** (`23:45:59Z`). Live channel `production` is unpaused and maps to branch `production`; verified update platform `ios`, runtime `2.0.0-maps-2`, branch `production`.
- Antigravity had already published group `e4aecd8c-256f-4a93-a05f-3ad1b471d35d` at `23:37:28Z` despite the screenshot's credit-error message. This follow-up fixes a real remaining first-share race rather than treating that screenshot as proof publication failed.
- Verse PNG footer preserves the bundled `white-ios-logo.png` left of the stacked app name and printed download address. iOS receives a **single local PNG attachment** with no separate message/website item. Native SVG photo/logo readiness replaces fixed decode sleeps; failed preparation shows an error instead of silently opening a text share. Selection changes cancel stale export and unique cache filenames avoid stale share previews. The decode wait has a bounded timeout and repeat taps are locked while sharing.
- Preserved Antigravity's compact grouped country/city/church form and public-visibility switch. Added VoiceOver/TalkBack labels and disabled country changes while saving. Form data and visibility behavior are preserved.
- **Android compatibility:** latest verified Android preview APK is still build 3, runtime `2.0.0-securestore-1` (`45c31c43-e36e-4952-a15a-238ac2c1521c`). It cannot receive maps-runtime OTA. No Android OTA, native rebuild, store submission, Worker/D1/Pages deployment, Git commit or push was made in this finishing turn. An Android maps-capable rebuild remains separate work; do not mislabel the old runtime to force delivery.
- **Validation:** TypeScript passed; scoped ESLint has zero errors (seven existing warnings); 101 tests passed across sharing readiness, community/API, player presentation/playback, gestures, storage and mobile auth. EAS exported and uploaded the iOS Hermes bundle successfully. Read-only live health, verse summary and churches endpoints returned 200. These checks do not establish physical-device appearance or TestFlight installation; test share behavior and the form on compatible build 29.
- Relevant finishing files: `components/VerseCard.tsx`, `components/CommunityProfile.tsx`, `utils/verseSharing.ts`, `scripts/test-verse-sharing.cjs`. Keep the other uncommitted Antigravity/community changes intact.

Earlier release/development entries below remain historical evidence and may describe prior runtimes or pre-deployment states.


## Local community implementation — November 17, 2026

Verse-of-the-Day discussions, profiles, sole-admin moderation, choir repertoire, prepared backgrounds, player overlay/navigation fixes and bilingual legal drafts are implemented locally. **No deployment, OTA, native rebuild or store submission was made for this work.** Version remains **2.0.0**, runtime **2.0.0-securestore-1**; no native dependencies changed. See the [implementation and release handoff](guides/VERSE-COMMUNITY-HANDOFF.md) for schema migration 0003, safeguards, validation and release order. Earlier live-state notes below are historical and do not describe this unreleased work.


## November 15, 2026 — Full Security, Email Auth & UI Polish Live Status (`2.0.0`, `runtimeVersion: "2.0.0-securestore-1"`)

All security, Email Auth, Cloudflare Pages, and `expo-secure-store` native rebuilds are live, followed by OTA Update **`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`** (`production` and `preview`, runtime `2.0.0-securestore-1`):
- **Production Worker & D1**: `ebp-himnario-sync` version **`6e056043-383c-44e6-9187-22ee9aad0c52`** deployed with `env.EMAIL` bound (`cuenta@auth.himnarioebp.com`), `auth.himnarioebp.com` Email Sending enabled in Cloudflare, and D1 migration `0002_email_auth.sql` applied on `ebp-himnario-db`.
- **Cloudflare Pages**: `https://himnarioebp.com/account.html` + `_headers` + `privacy.html` deployed (`f21d7e62.ebp-himnario.pages.dev`).
- **Native Rebuilds (`runtimeVersion: "2.0.0-securestore-1"`)**:
  - **Android (`preview-arm64` APK)**: `45c31c43-e36e-4952-a15a-238ac2c1521c`
  - **iOS (`production`, Build `22`)**: `a72551f5-58d3-403c-b8d6-589f048c0ad6` (App Store Connect auto-submit `c1d9bbc6-4df7-4301-bb98-965a42c4d974`). *Note: Build `22` delivered to App Store Connect with early warning `ITMS-91182` for `assets/fonts/ios/SFProText-Semibold.otf`; `assets/fonts/ios/` has since been deleted so Build `23+` will be completely clean.*
- **Latest OTA Update (`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`, `production` & `preview`, runtime `2.0.0-securestore-1`)**: Fixed `AuthSheet` Settings Font Size `12 px` lock bug (full Slider + live preview + 1 px steppers), restored native iOS `UISwitch` colors (`#34C759`), restored classic cream/burgundy profile avatar (removing the Apple blue gradient), separated/tightened `HomeHeaderActions` glass bubbles (`gap: 12`, `spacing: 6`, `±7 pt`), and unified `app/_layout.tsx` on `@expo-google-fonts/newsreader` + `@expo-google-fonts/public-sans`. See [SECURITY-REMEDIATION-PLAN.md](guides/SECURITY-REMEDIATION-PLAN.md) and [APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md).

Run native commands from `himnario/`. Configuration lives in `app.json` and `eas.json`; credentials belong outside source control.
## Configuration

- Expo account: `isaacduran`; project: `74ef3b4c-fe90-4c2c-8521-b52f4b6a5441`.
- iOS bundle: `com.elbuenpastor`; App Store Connect ID: `6794435414`.
- Provisioning Profile: `ZM5HK4A7JT` (has `Associated Domains` enabled for `applinks:himnarioebp.com`).
- Android package: `com.elbuenpastor.himnario`.
- Current runtime: explicit `"2.0.0-release-5"` in `himnario/app.json`; source version `2.0.0` (iOS Build 34). Build 33 uses `2.0.0-notif-4`; Builds 30–31 use `2.0.0-media-3`; older iOS Build 29 uses `2.0.0-maps-2`; the older Android preview binary still uses `2.0.0-securestore-1`.
- Profiles include `development`, `ios-simulator`, `preview`, `preview-arm64`, `production`. `preview-arm64` builds an Android APK; `production` produces the store build.
- Production submission config supplies the iOS App Store Connect ID (`6794435414`). Android automated submission is not configured there.

> **Caution on duplicate uploads (`ITMS-90189`):** `build-ios-testflight.ps1` (or `eas build --platform ios --profile production --auto-submit`) automatically schedules an App Store Connect submission. Do not run a second `eas submit` manually after an auto-submitted build completes, or Apple will reject it with `ITMS-90189: Redundant Binary Upload`.

## Build helpers

- `build-android-test.ps1`: Android test APK (`preview-arm64`).
- `build-android-production.ps1`: Android production build (`.aab`).
- `build-ios-testflight.ps1`: iOS build and automatic submission; also offers credential management.

Manual equivalents (from `himnario/`):

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
eas build --platform android --profile preview-arm64
eas build --platform android --profile production
eas build --platform ios --profile production --auto-submit
```

For this Windows path, use PowerShell `-LiteralPath`. The helpers scope the EAS archive to the app with `EAS_NO_VCS` and `EAS_PROJECT_ROOT`; local uncommitted app changes are included in the archive.

## Over-The-Air (OTA) Updates (`eas update`)

EAS Update allows delivering compatible JavaScript, TypeScript, styling, and asset updates to already-installed apps on physical devices (TestFlight, iOS App Store, Google Play Store, and Preview APKs) **without needing a new app store review, binary upload, or 15-minute cloud build**.

### 1. Channel & Branch Architecture (`eas.json`)

EAS Update routes updates through **channels** linked to build profiles:

| Build Profile | Channel | Target Audience | Command to Update |
|---|---|---|---|
| `production` | `production` | **TestFlight**, **iOS App Store**, **Google Play Store** | `eas update --branch production --message "..."` |
| `preview` / `preview-arm64` | `preview` | **Android Test APKs**, internal device testing | `eas update --branch preview --message "..."` |
| `development` | `development` | Dev client builds (`expo-dev-client`) | `eas update --branch development --message "..."` |

> **Critical Rule for Agents:** Build profiles in `eas.json` specify an EAS Update `channel`, and that channel points to an EAS Update `branch` on Expo's servers (in this project, channel `production` → branch `production`, and channel `preview` → branch `preview`). TestFlight and store builds are on channel `production`. An update sent to `--branch preview` will **never** be seen by TestFlight users. Always verify the live channel-to-branch mapping and use `--branch production` when updating TestFlight or store users.

### 2. PowerShell Command Syntax (Windows)

Because of the monorepo folder layout and the `.git` parent directory trap, always set `$env:EAS_NO_VCS = '1'` and `$env:EAS_PROJECT_ROOT` before publishing:

```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\himnario"
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path

# Push to TestFlight and App Store:
eas update --branch production --message "Fix hymn search accent normalization"

# Push to Android Test APK users:
eas update --branch preview --message "Fix hymn search accent normalization"
```

Or run the helper script:
```powershell
.\publish-update.ps1 -Branch production -Message "Your update message"
```

### 3. Runtime Version Policy (`runtimeVersion`)

**Current configuration uses explicit `"runtimeVersion": "2.0.0-media-3"`, not an appVersion policy.** Preserve compatibility isolation between `2.0.0-media-3` (Camera + Image Picker + Apple Look Around), `2.0.0-maps-2` (Maps/Location), and older `2.0.0-securestore-1` binaries. The appVersion explanation below describes an older configuration, not the current source.

Historical configuration: `"runtimeVersion": { "policy": "appVersion" }`.
- EAS Update matches the user-facing `version` (current unreleased source: `2.0.0`).
- Delivery requires a compatible native binary, matching runtime/platform, and the correct live channel-to-branch mapping. Matching a version string alone does not establish native compatibility or immediate delivery.
- Bumping `version` under `appVersion` creates a new runtime: a native build is required. Installed `2.0.0` test binaries may share this runtime label while lacking SecureStore; do not send the new native-dependent bundle to those binaries by OTA. SecureStore cannot be added by OTA to binaries without that native module.

### 4. Golden Decision Matrix: `eas update` vs. `eas build`

| Modification | Can use `eas update`? | Required Action |
|---|---|---|
| Bug fix in `.tsx`, `.ts`, `.js`, or CSS styling | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Lyric, title, or category changes in `alabanzasPaginas.js` | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Layout, color, animation, or UI logic tweaks | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Updating static images/icons in `assets/` | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Installing an npm package with **native iOS/Android code** (e.g. `@react-native-menu/menu`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Applying native patches (`patches/*.patch`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Changing native entitlements (Associated Domains, UIBackgroundModes) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Modifying native `app.json` fields (`permissions`, `scheme`, `plugins`, `package`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Bumping app `version` string (e.g., `1.1.0` → `1.2.0`) | 🛑 **NO** | Full native rebuild required (`eas build`) |

### 5. How Users & Testers Receive the Update

1. Run `eas update --branch production --message "..."`. The update uploads in ~30 seconds.
2. The user/tester opens the app on their phone. `expo-updates` checks EAS in the background and silently downloads the new bundle.
3. The next time the user opens the app (or force-closes and reopens), the app boots directly with the new update!

A Git commit, EAS Update, native build, store submission, and website deployment remain separate operations.

## Release status

### November 15, 2026 — Version `2.0.0` Release: Optional Account & Cloud Sync (Cloudflare Worker + D1), Apple Books `ID` Header & Unified `AuthSheet`, iOS 26 Connecting Liquid Glass Circles (`GlassContainer`), Anti-Bot Hardening & Settings UI Redesign

- **Version Bumped to `2.0.0` (`himnario/app.json`, `himnario/package.json`)**:
  - Native builds completed on runtime `2.0.0` (iOS `production` Build 20 auto-submitted to TestFlight/App Store Connect; Android `preview-arm64` APK built).
- **Latest OTA Updates Published on Runtime `2.0.0` (November 15, 2026)**:
  - **`production` & `preview` Update Group (`23922bbe-f53b-41d2-8d34-eef7c739cf64`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/23922bbe-f53b-41d2-8d34-eef7c739cf64) · iOS `01a1defb-5ee9-72e6-a284-c692d779a3f2` · Android `01a1defb-5ee9-7963-9199-48900315adac`.
  - **Cloudflare Worker + D1 Cloud Sync (`workers/ebp-auth-sync/`, `context/AuthContext.tsx`)**:
    - Deployed Worker `ebp-himnario-sync` (`https://ebp-himnario-sync.himnario.workers.dev`, Version `5e626283-1559-462e-830f-56d0e19f86fc`) backed by Cloudflare D1 `ebp-himnario-db` (`ed683396-bfd7-43ff-b69e-f82cf4621c55`).
    - Optional, non-blocking sign-in / account creation (`PBKDF2-HMAC-SHA256` 100k iterations + per-user random salt, `SHA-256` session token hashes) that union-merges Favorites, Playlists, Recent Hymns, and Reading Preferences across devices with `1200ms` debounced auto-sync.
    - Hardened with D1 `rate_limits` sliding-window lockout (`429` after 5 failed login attempts with `1m` → `5m` → `15m` progressive backoff, per-IP signup/reset/sync caps, `64 KB` body cap, honeypot bot trap, `120ms` timing floor, and session revocation on password reset).
  - **Apple Books Profile Circle & iOS 26 Connecting Liquid Glass (`HomeHeaderActions.tsx`)**:
    - Replaced the 3-item header with two large `46×46pt` circles: **Search (`🔍`)** on the left and **Profile / Unified App Menu (`ID` initials on `#9EA9DC → #7683BE` `APPLE_AVATAR_GRADIENT` when signed in, or `person.crop.circle.fill` when signed out)** on the right.
    - On iOS 26+ (`isLiquidGlassAvailable()`), wraps both circles inside `<GlassContainer spacing={18}>` with direct `Animated.createAnimatedComponent(GlassView)` children (`isInteractive`) and Reanimated `Gesture.Pan()` spring drag (`±20pt`) so nudging/dragging either circle toward the other stretches Apple's native `UIGlassContainerEffect` Liquid Glass metaball bridge between them.
  - **Unified `AuthSheet` UX & Bug Fixes (`components/AuthSheet.tsx`, `context/AuthContext.tsx`)**:
    - Consolidates Account/Cloud Sync, Share App (`share`), Settings (`settings`), Offline Downloads (`downloads`), Help (`help`), and History/About (`about`) as in-sheet sub-pages inside a single modal, eliminating iOS modal-collision freezes.
    - Added live `Keyboard` height listeners to dynamically clamp `sheetMaxHeight` below `insets.top + 12` so the grabber and **`Listo`** exit button never scroll or push behind the Dynamic Island when the keyboard opens.
    - Added Show/Hide password eye toggle (`showPassword`), decoupled the submit spinner from background `isSyncing`, and added `sessionEpochRef` + `AbortController` (`syncAbortRef`) in `AuthContext` so signing out immediately cancels pending sync timers and aborts in-flight requests.
  - **Settings Screen Redesign & Dark Mode Switch Fix (`app/(tabs)/settings.tsx`, `HomeMenuSheet.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`)**:
    - Upgraded the `CUENTA Y NUBE` card in `settings.tsx` with a `44×44pt` circular avatar badge, accented title (`#6e1619` light / `#F2D7B6` dark), `"Entrar ›"` / `"Sign In ›"` CTA pill, and an explanatory cloud-backup footnote underneath.
    - Added **Compartir aplicación / Share App** under `General` in `settings.tsx` wired to `<AppShareSheet />` (with `if (!visible) return null` guard in `AppShareSheet.tsx`).
    - Fixed the Dark Mode `<Switch>` across `settings.tsx`, `AuthSheet.tsx`, and `HomeMenuSheet.tsx` so Light Mode stays unchanged (`#6e1619` burgundy track + white knob) while Dark Mode renders a crisp `#FFFFFF` knob on our `#373737` (`theme.surfaceVariants.container`) dark-gray track.
    - Replaced personal name placeholder with `"Ej. Juan Pérez"` / `"e.g. John Doe"`.

### November 14, 2026 — YouTube Music Horizontal Track Swipe in `MiniPlayer`, iOS 26 Liquid Glass Lifecycle & Optical Centering, Quick Web Feedback Form Prefill, 3D Leather Web Covers & Hymn 429 Lyric Fix (Published via OTA on Runtime `1.1.0`)

- **Published via EAS Update (OTA) on Runtime `1.1.0`**:
  - **`production` Update Group (`7fb0f557-81d9-402e-8fac-18c2751d3d94`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/7fb0f557-81d9-402e-8fac-18c2751d3d94) · iOS `01a1dddb-67f1-773a-be21-194b66036ea8` · Android `01a1dddb-67f1-7ce4-bb4e-0322defa98aa`.
  - **`preview` Update Group (`c2caeb70-190e-4f31-af52-e281a5bec7bd`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/c2caeb70-190e-4f31-af52-e281a5bec7bd) · iOS `01a1dddc-242c-7ea5-925a-2938d6d9eb7e` · Android `01a1dddc-242c-7cfa-88ca-92f957850b47`.
  - **YouTube Music-Style Horizontal Track Carousel (`MiniPlayer.tsx`, `gestureMotion.ts`, `scripts/test-gesture-motion.cjs`)**: Swiping left or right on the `MiniPlayer` scrubs a 120Hz 3-slot track strip (`[prevHymn, hymn, nextHymn]`) inside the stationary `GlassSurface` capsule while keeping `Prev / Play-Pause / Next` anchored on the right, committing `skipNext()` or `skipPrev()` past `28%` width or `520pt/s` flick velocity and rubber-banding at non-wrapping boundaries.
  - **iOS 26 Liquid Glass Remount (`GlassSurface.tsx`, `home.tsx`, `HomeHeaderActions.tsx`)**: Automatic `GlassView` remount on navigation focus, app foregrounding (`AppState === 'active'`), and scrolling back into the top header range (`contentOffset.y < 35`).
  - **Header Share App Circle, Optical Centering & 120Hz Sheet Gestures (`HomeHeaderActions.tsx`, `AppMenuIcon.tsx`, `AppShareSheet.tsx`, `ShareSheet.tsx`, `HomeMenuSheet.tsx`)**: `44×44pt` Share App circle + `84×44pt` Search/Menu capsule with WWDC25 optical centering on iOS and 120Hz Reanimated swipe-down dismissal.
  - **`Favoritos` Sub-Tab Single-Line Fit (`favorites.tsx`)**: `numberOfLines={1}` + `adjustsFontSizeToFit` (`minimumFontScale={0.8}`).
  - **Quick Web Feedback Form & Auto-Prefill (`utils/feedback.ts`, `HomeMenuSheet.tsx`, `LanguageContext.tsx`, `docs/feedback.html`)**: Choice between in-app browser quick form (`?form=audio&hymn=...&title=...`, prefilling Google Form `entry.323314423`) and `mailto:` email with web-form fallback.
  - **Hymn 429 Lyric Fix (`data/alabanzasPaginas.js`, `docs/`)**: Removed duplicate leading `"Salmos 100:1-5"` line from Hymn 429 lyrics so Stanza 1 begins with `"Cantad alegres a Dios,"`.

### November 8, 2026 — iOS App Store v1.1.0 (Build 19) Approval, Presentation Mode Crash/Landscape Fix, Auto-Foreground OTA Updates & Offline Audio Revision Cache Invalidation

- **iOS `production`, build 19 (`1.1.0 (19)`) — APPROVED & LIVE ON APP STORE**:
  - [EAS build c3693e64](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/c3693e64-9693-45e0-be0e-5b286636cb54) · [Submission 1d1da2e0](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/1d1da2e0-ac74-4a39-965c-f33349c3c3b2).
  - Fixed Build 18's `EAGER_BUNDLE` failure (`Unable to resolve module ../assets/fonts/ios/NewYork-Regular.ttf`) by anchoring `/ios/` and `/android/` in `himnario/.easignore` (`ce97111`) so `assets/fonts/ios/` is never excluded from the EAS upload archive.
  - Set `"supportsTablet": false` under `"ios"` in `himnario/app.json` (`11fb627`) so App Store Connect only requires iPhone screenshots (while keeping the responsive `Platform.isPad` layout adjustments in code if tablet support is re-enabled later).
- **Latest `production` OTA Updates (Runtime `1.1.0`, targeting iOS App Store Build 19 / TestFlight & Android)**:
  - **Update Group `9778957d-6545-4d72-b8d7-393e734f92ec`** ([EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/9778957d-6545-4d72-b8d7-393e734f92ec) · iOS `01a1ba2e-5806-78fa-9614-b2d8657980d1` · Android `01a1ba2e-5806-711d-a1b8-2ca4a8235008`), superseding earlier November 8 groups `372319f0`, `e1e936f0`, and `5aa1d988`:
    1. **Presentation Mode (`ProjectorModal.tsx`) iOS Background/Foreground Crash Fix & Landscape Viewport Sizing (`a921214`, `84845e0`)**:
       - Removed all `ScreenOrientation.lockAsync` / `unlockAsync` calls on iOS (`app/_layout.tsx`, `components/ProjectorModal.tsx`). Calling `expo-screen-orientation` on iOS while a `fullScreen` `<Modal>` was mounted triggered an `EXScreenOrientationRegistry` thread-safety crash + `UIApplicationInvalidInterfaceOrientation` exception when backgrounding and foregrounding the app.
       - Replaced iOS manual landscape rotation in `ProjectorModal.tsx` with a pure `90deg` view transform (`useTransformLandscape`) using `flex: 0, width: windowDims.height, height: windowDims.width, maxHeight: windowDims.width` on `styles.root` so React Native's Yoga layout engine does not stretch the rotated container to `852×852`, keeping the top `Salir` button, stanza counter, auto-sized lyrics, and bottom controls toolbar 100% inside the visible screen.
    2. **Centered Single-Line Report Error Link (`app/hymn/[id].tsx`, `a921214`)**:
       - Added `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale={0.82}`, `alignSelf: 'center'`, and `textAlign: 'center'` to `footerReportBtn` / `footerReportText` so `"¿Encontraste un error? Reportar por correo"` stays centered on a single line.
    3. **Hymn 198 Chorus Lyric Fix (`data/alabanzasPaginas.js`, `docs/`, `a921214`)**:
       - Fixed `"Estaba esparcid"` → `"Estaba esparcido"` in Hymn 198 (`El Señor Jesús Está Llamando`) and regenerated `docs/data/hymns-data.js`, `docs/himno/198/index.html`, and `docs/hymn/198/index.html`.
    4. **Automatic Foreground OTA Updates (`app/_layout.tsx`, `bb91e3e`)**:
       - Added a foreground `AppState` listener in `ThemedStack` that calls `Updates.checkForUpdateAsync()` → `Updates.fetchUpdateAsync()` → `Updates.reloadAsync()` whenever the app opens or resumes (`AppState === 'active'`), safely skipping `reloadAsync()` while hymn audio is actively playing (`isPlayingRef.current === true`).
    5. **Per-Hymn Offline Audio Cache Invalidation (`data/audioRegistry.native.ts`, `data/audioRegistry.ts`, `audio/offline-audio.ts`, `d6c337d`)**:
       - Added `AUDIO_REVISIONS: Record<string, number>` and `getHymnAudioRevision(hymnId)`. When a recording on Cloudflare R2 is fixed/replaced, bumping its revision in `AUDIO_REVISIONS` (e.g. `'198': 2`) appends `?v=2` to the remote URL, stores the local file as `hymn_198_v2.m4a`, deletes the superseded `hymn_198.m4a` during `refreshOfflineAudio()`, and automatically re-downloads the updated recording in the background.
- **Planned for Future Native Build (Saved for Later)**:
  - **Custom App Icon Switcher (DuckDuckGo-style)**: Requires a native build (`eas build`) with `expo-alternate-app-icons` (or equivalent config plugin) registering alternate icons in iOS `Info.plist` (`CFBundleAlternateIcons`) and Android `AndroidManifest.xml` (`<activity-alias>`). Once pre-bundled in a future native release, the Settings picker UI and icon unlocking can be managed via OTA.

### November 7, 2026 — Liquid Glass `AppIcon.icon`, `Favoritos` Top Safe-Area Fix, iPad (`supportsTablet: true`) Compatibility & Privacy Policy Update (Committed for Mac Local/EAS Build)

- **Liquid Glass App Icon (`himnario/assets/images/AppIcon.icon`, `icon-composer-svgs/`, `himnario/app.json`)**: Extracted 5 `1024 × 1024` vector SVG layers (`00-background.svg` through `04-EBP.svg`) from `white-ios-logo.ai`, composed `AppIcon.icon` in Apple's Icon Composer (Default, Dark, Clear, and Tinted appearances), placed it at `himnario/assets/images/AppIcon.icon`, and configured `"ios": { "icon": "./assets/images/AppIcon.icon" }` in `himnario/app.json`.
- **iOS `Favoritos` Top Gap Fix (`himnario/app/(tabs)/_layout.tsx`)**: Added `overrideScrollViewContentInsetAdjustmentBehavior: false` to the `favorites` `<NativeTabs.Trigger>` (matching `home` and `settings`), eliminating the double top safe-area gap above the `Mis Favoritos | Listas de Reproducción` sub-tab bar on iOS.
- **iPad / Tablet Support (`himnario/app.json`, `app/_layout.tsx`, `components/ProjectorModal.tsx`, `app/(tabs)/*.tsx`, `components/VerseCard.tsx`, `app/hymn/[id].tsx`)**: Enabled `"supportsTablet": true` under `"ios"` in `app.json`, unlocked orientation rotation on iPad (`Platform.isPad`) while keeping phones locked to `PORTRAIT_UP`, added `50pt` top clearance on iPad for the iPadOS floating top tab bar pill, set `miniPlayerBottom` to `pillBottom` on iPad, and added `maxWidth: 780` centered containers on iPad.
- **Privacy Policy Polish (`docs/privacy.html`)**: Updated Section 5 (*Aplicación móvil* / *Mobile App*) in Spanish and English to explicitly cover both phones and tablets (`iPhone, iPad, or Android`) and bumped the update date to **November 2026**.

### November 6, 2026 (Night) — Apple Books `Inicio` Redesign, iOS `New York` + `SF Pro` Fonts, Leather Hymnal Cover, Unified `Favoritos` Scroll Header & Swipeable Rounded-Rect `MiniPlayer` OTA

Published to both iOS (`production`) and Android (`preview`) on runtime `1.1.0`:
- **iOS `production` update group**: `932e18c6-dbb1-42a9-9a87-dd95302d8aff`; update `01a1b4a1-cda5-7478-b84b-3e1bbeea8ea8`.
- **Android `preview` update group**: `8f7cadb9-d816-4ebe-ba3c-1be419bdea46`; update `01a1b4a2-a344-7326-bb2d-d6e8654e8c7c`.
- **Summary of included changes**:
  - **Interactive iOS 26 Liquid Glass Header Capsule (`HomeHeaderActions.tsx`, `GlassSurface.tsx`, `AppMenuIcon.tsx`)**: Enabled `isInteractive` on `<GlassSurface>`, removed the middle divider line and outer `overflow: 'hidden'` clipping on iOS so UIKit's native fluid stretch animation renders cleanly, and increased SF Symbol weights/sizes (`magnifyingglass` `22pt`, `ellipsis` `23pt`, `weight="bold"`).
  - **Platform Typography (`app/_layout.tsx`, `assets/fonts/ios/`)**: Bundled Apple's `New York` serif (`NewYork-*.ttf`) and `SF Pro Text` (`SFProText-*.otf`) on iOS mapped to `Newsreader_*` and `PublicSans_*`, while preserving `Newsreader` + `Public Sans` on Android.
  - **Apple Books `Inicio` / `Home` Layout & Leather Hymnal Cover (`app/(tabs)/home.tsx`, `components/VerseCard.tsx`, `assets/images/hymnal-leather-cover.jpg`)**: Renamed the top header to `"Inicio"` / `"Home"`, replaced the solid burgundy pill with an Apple Books `"Continue"`-style card featuring the custom burgundy leather hymnal cover (`54×80pt`), and styled `Inicio` sections as full-bleed top-to-bottom `<LinearGradient>` bands (`['#1C1C1E', '#0B0B0C', '#000000']` in Dark Mode; `['#FFFFFF', '#F7F7FA', '#EAEAEF']` in Light Mode).
  - **Unified `Favoritos` Scroll-Fade Header (`app/(tabs)/favorites.tsx`)**: Unified Android and iOS on the shared `Animated.ScrollView` + `scrollY` fade-out and upward slide header, fixing Android's non-collapsing header and sub-tab overlap.
  - **Swipeable Rounded-Rectangle `MiniPlayer` (`components/MiniPlayer.tsx`, `components/MusicPlayer.tsx`)**: Changed `MiniPlayer` from a `100pt` stadium pill to a clean rounded rectangle (`borderRadius: 16` on iOS, `18` on Android, matching `MusicPlayer` collapse interpolation) and added a `Gesture.Pan().activeOffsetY(-8)` upward swipe gesture in addition to tap to expand the full `MusicPlayer`.

### November 6, 2026 — Authorized Platform Polish OTA (iOS `production` & Android `preview`)

Published after Isaac authorized OTA testing for the latest visual fixes (explicit iOS native-menu SF Symbol colors, iOS-only 32pt tab assets, iOS glass pill mini-player, and Android dark mini-player website gradient `linear-gradient(155deg, #2b2b2b, #171717 70%)`). Live checks confirmed iOS build 17 (`fc6d5e27`) finished on `production`/runtime `1.1.0` and Android APK (`9f2eccb4`) finished on `preview`/runtime `1.1.0`; channels point to their same-named branches.

- **Android `preview` update group**: `afa55c01-fafa-4e65-8d75-08bcfe2dd478`; update `01a1b2e0-833d-712d-a64a-80f12fdc8660`.
- **iOS `production` update group**: `e7e7584d-f5c5-4626-aa57-ee480ffe49e5`; update `01a1b2e1-2d3b-73ef-94a2-101b518e1302`.
- Both fresh platform exports and EAS publications succeeded. Android uploaded 1 asset, iOS 25, each reusing 102 existing assets. No audio catalog re-upload, native rebuild, store submission, Git commit or website deployment.
- iOS `production` also targets compatible App Store installations. Runtime matching (`1.1.0`) is not proof of native module equivalence across older `1.1.0` binaries (though `HomeHeaderActions.tsx` guards `MenuView` with `UIManager.hasViewManagerConfig('MenuView')` and `GlassSurface.tsx` guards `ExpoGlassEffect` so pre-Build-17 binaries safely fall back). Actual phone launch, menu symbols, tab sizing and mini-player glass/gradient still require device verification. See `guides/APP-EDITING-ANALYSIS.md` for changed files and device checklist.

### November 5, 2026 (Night) — Native Menu (`@react-native-menu/menu`), Full-Res Cover, Stable Seek & Index Scrubbing Rebuild

Includes the joined Home header capsule (`HomeHeaderActions.tsx`), native `@react-native-menu/menu` (`2.0.0`) module, full-resolution cover decoding (`MusicPlayer.tsx`), stable seek slider (`ProgressSection`), and `requestAnimationFrame` catalog/index scrubbing (`hymns.tsx`).

- **Android `preview-arm64` (APK)**: [build 9f2eccb4](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/9f2eccb4-3f95-423f-b88a-0a8ccc2c4860) · [Download APK](https://expo.dev/artifacts/eas/qgaKiHjywocNarS-cS4MRiBbDPuziLy3j7ARC0GRobM.apk)
- **iOS `production`, build 17**: [build fc6d5e27](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/fc6d5e27-d1f7-44ac-b4ef-0ac8b3dd95e1) · [IPA](https://expo.dev/artifacts/eas/CitxrsGsa1FQ_DztuzAoqkQzHAggqFkYrAcmOgjXMZU.ipa)
- **TestFlight Auto-Submission**: [submission ba7d443f](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/ba7d443f-f1e8-4900-a250-7f926e67e8e2) (`FINISHED`; automatically queued—do not submit manually).

### November 5, 2026 (Evening) — Regression Repair Rebuild (Restored iOS NativeTabs, Frosted Surfaces & Brand Logos)

Restored iOS `NativeTabs` glass bar (keeping custom swipe pager Android-only), restored Home header fade, added `stableBackdrop` frosted backing, fixed full-player cover scaling, and rendered original-color green iMessage/WhatsApp PNGs.

- **Android `preview-arm64` (APK)**: [build 4d3297e8](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4d3297e8-6d31-4b63-b003-3445e076cf2f) · [Download APK](https://expo.dev/artifacts/eas/Oxl_-oO0QDR-z5k2mZndPrxFYJjwMsPHgn6uKZMueAk.apk)
- **iOS `production`, build 16**: [build de9dc116](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/de9dc116-c333-481e-b15a-52f8c2e969bc) (auto-submitted to TestFlight).

### November 5, 2026 — full rebuilds requested after OTA testing release

Isaac explicitly requested new binaries, not only OTA updates. Both archives include the local Home menu, Settings scroll fade, native sharing and interactive tab/player gesture changes. Source remains version 1.1.0; no new dependency changes were introduced in this iteration. The November 2 builds already introduced the four native modules described above.

- Android `preview-arm64`: [build dc086d80](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/dc086d80-0fb3-4343-9c20-7f9f570c3da6), full APK rebuild.
- iOS `production`, build **15**: [build 462818a5](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/462818a5-0f60-42d7-84f7-67fe6380be3c).
- Automatic TestFlight submission: [bc5adfa3](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/bc5adfa3-b2c1-46a5-be7d-ac18e37a2357). Do not submit this binary again manually.
- Both native builds finished successfully. iOS automatic submission also returned `FINISHED` with no error; Apple may still process the build before displaying it in TestFlight. [Download the Android APK](https://expo.dev/artifacts/eas/IY5XSJkmFSJF_HSmGwY_VFsnKxE6qIPOwKYBrWrUdko.apk). EAS reported 97% of included build credits used at launch and pay-as-you-go billing beyond allowance.


### Latest builds — November 2, 2026 (Pacific, Round 3)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `5`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4ca994b5-54e5-4330-a40c-2e0fa8937bf8) · [APK](https://expo.dev/artifacts/eas/iG-U4stwTugrJRUaelf4Aa1SsihSXAhyUo_6AByOd5k.apk) |
| iOS 1.1.0 (build `14`, `production`) | `FINISHED` / TestFlight auto-submitted | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/cba76d98-6f9f-459d-bca0-61c20996f612) · [IPA](https://expo.dev/artifacts/eas/1k4LoFGmO6wMcoNEZK7eb-I1Kys8EjIbUu_BEzotzQs.ipa) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/3e954b64-b36e-4533-b352-742f742ba427) |

### Latest builds — November 2–3, 2026 (Pacific, Round 3)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `5`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4ca994b5-54e5-4330-a40c-2e0fa8937bf8) |
| iOS 1.1.0 (build `14`, `production`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/cba76d98-6f9f-459d-bca0-61c20996f612) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/d88be2ff-8533-4f93-bc42-df8e16ea7731) |

### Previous builds — November 2, 2026 (Pacific, Round 2)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `4`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/e0211458-bc25-455c-961c-0507edd9093f) |
| iOS 1.1.0 (build `13`, `production`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/92e3039c-c959-473d-9807-141f81091617) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/e94f0640-0fcd-40b9-bf81-97eb55e6b3a5) |

### Previous completed builds — November 2, 2026 (Pacific, Round 1)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `3`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/a9fe3ee0-e392-4308-b1b7-facc67642d26) · [APK](https://expo.dev/artifacts/eas/Tgs7Qxp1rI4AhU-h2QF7Xploi-suzaMcS6cZg6HoJE4.apk) |
| iOS 1.1.0 (build `12`, `production`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/0a349cae-f337-422b-97cd-4f301c76b746) · [IPA](https://expo.dev/artifacts/eas/Kqi0_hD61H4x-cY2ilQbPzFs26O4j9t4Y27AviAuDVU.ipa) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/9b46eb51-7535-48b7-98b4-4f2ef23d629c) |

### What changed in the November 2, 2026 builds

1. **Bottom Navigation Bar (`himnario/app/(tabs)/_layout.tsx`, `himnario/components/HomeTabIcon.tsx`, `himnario/assets/images/tab-home-*.png`, `himnario/theme/ThemeContext.tsx`)**:
   - Replaced the Home (`Inicio`) tab icon on both iOS (`NativeTabs` bottom-aligned template PNGs `@1x`/`@2x`/`@3x`) and Android (`HomeTabIcon` SVG) with the custom rounded house with an arched doorway.
   - Fixed initial iOS tab label dropping by unifying `sharedTriggerOptions` with native bold typography (`fontWeight: '700'`, `fontSize: 11`) and negative vertical title position adjustment (`vertical: -3.5`).
   - Styled Android bottom bar in the clean Hallow app style (`PublicSans_700Bold`, `11.5px`, positioned tightly `1px` underneath the icons).
   - Synced native OS appearance so nav bars switch cleanly between dark and light mode.
2. **Apple Books-style Home Header & Larger Glassmorphic Search Button (`himnario/app/(tabs)/home.tsx`)**:
   - Left-aligned bold serif **`Himnario`** title with smooth scroll fade-out.
   - Enlarged top-right glassmorphic search button (`50×50`, `borderRadius: 25`, `26px` icon).
3. **Instagram-Style Horizontal Tab Swiping (`himnario/components/TabSwipeWrapper.tsx`)**:
   - Swiping left/right transitions smoothly between `Inicio` ↔ `Himnos` ↔ `Favoritos` ↔ `Ajustes`.
4. **Android Projector Modal Toolbar Overflow Fix (`himnario/components/ProjectorModal.tsx`)**:
   - Compacted font-size stepper and utility button layout so all buttons (including fullscreen on the far right) fit cleanly within Android screens.
5. **Cleaned Up Search & Filter Chips (`himnario/app/(tabs)/hymns.tsx`)**:
   - Removed `Todo / Título / Letra / #` scope chips and `Con audio` filter, leaving only the category chips and results count pill.
6. **`Himnos | Coritos` Switch in `Índice` (`himnario/app/(tabs)/hymns.tsx`)**:
   - Segmented toggle at the top of Índice switches both the alphabetical index list and the right A–Z scrollbar between Hymns and Choruses.
7. **Lyric Fixes (`himnario/data/alabanzasPaginas.js`, `docs/data/hymns-data.js`, `docs/hymn/`)**:
   - Fixed lowercase singular `"dios"` references in Hymns 6, 204, 222, 248, 249, and the Chorus of Hymn 409.

See [Google Play status](guides/GOOGLE-PLAY-RELEASE-PLAN.md) and the [project overview](README.md).


## Security & Email-Auth Rebuild (`runtimeVersion: "2.0.0-securestore-1"`, November 15, 2026)

- **Why a new `runtimeVersion` (`2.0.0-securestore-1`) was required:** Adding `expo-secure-store` introduces native iOS Keychain / Android Keystore code. Setting `runtimeVersion` to `2.0.0-securestore-1` keeps the user-facing version at `2.0.0` while preventing earlier `2.0.0` binaries from downloading an incompatible OTA bundle.
- **Android (`preview-arm64` APK):** `45c31c43-e36e-4952-a15a-238ac2c1521c` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/45c31c43-e36e-4952-a15a-238ac2c1521c`
- **iOS (`production`, Build `22`):** `a72551f5-58d3-403c-b8d6-589f048c0ad6` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/a72551f5-58d3-403c-b8d6-589f048c0ad6`
- **iOS App Store Connect Auto-Submit:** `c1d9bbc6-4df7-4301-bb98-965a42c4d974` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/c1d9bbc6-4df7-4301-bb98-965a42c4d974`
- **Post-Build-22 OTA (`production` & `preview`, runtime `2.0.0-securestore-1`):** `f2dae896-2d5b-4ad6-96c9-b49e3249ae4a` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`
- **Next Native Build Recommendation (`Build 23+`):** Rebuild Android/iOS natively whenever convenient so the binary itself is free of the now-deleted `assets/fonts/ios/` files (`ITMS-91182` clean) and natively embeds OTA `f2dae896`.
