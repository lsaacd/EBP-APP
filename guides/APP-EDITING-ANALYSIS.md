# App editing

## November 25, 2026 — SDK 58 iOS Build #43 OTA #9 (`2.2.0-sdk58-1`): Unified Home Header Liquid Glass Pill Capsule & Full-Bleed Circular Profile Photo (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`b1c8ec1`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #9:** Group [`a2fa380e-ae26-4580-ae91-ffad24ab084d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/a2fa380e-ae26-4580-ae91-ffad24ab084d) · iOS update `01a21500-c8e9-7bf0-9467-03907a86976e`.
- **What Changed (`himnario/components/HomeHeaderActions.tsx`):**
  - Combined Home's top-right Search and Profile buttons into a single unified `46pt` (`borderRadius: 23`) interactive `GlassSurface` pill capsule.
  - Expanded `UserAvatar` to `size={46}` flush to the right semicircular end (`paddingRight: 0`, `borderWidth: 0`) so profile photos fill 100% edge-to-edge inside the circle with no dark ring gap; kept a subtle vertical divider when showing monogram initials or the guest icon, and added a crisp ringed unread badge on the avatar rim.
- **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors, iOS Hermes export clean (`2,642` modules, `7.8 MB`, 129 assets).

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #8 (`2.2.0-sdk58-1`) & Cloudflare Pages `e313a270`: Universal Links (`+native-intent`), Shareable Member & Church Web Pages, Homepage/App Upgrade & Updated Legal Policies (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`145565c`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live Website (Cloudflare Pages `ebp-himnario` -> `https://himnarioebp.com/`):**
  - **Deployment:** [`e313a270`](https://e313a270.ebp-himnario.pages.dev) (live-verified HTTP 200 on AASA `application/json`, `/member/?id=...`, `/churches/?id=...`, `/privacy.html`, `/terms.html`, `/app/`, and `/`).
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #8:** Group [`610c5538-1fe2-4da5-817f-58c23f835fce`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/610c5538-1fe2-4da5-817f-58c23f835fce) · iOS update `01a214f6-efc2-7b8e-a0c1-2c9991c45459`.
- **What Changed:**
  - **Universal Links & Share URLs (`himnario/utils/deepLinks.ts`, `himnario/app/+native-intent.tsx`, `himnario/app/member/[id].tsx`, `himnario/app/churches.tsx`):** Fixed member profile sharing to emit real `https://himnarioebp.com/member/?id=<id>` URLs instead of root `https://himnarioebp.com`, added Expo Router `+native-intent.tsx` deep-link normalization for member, church, hymn (`/hymn/`, `/himno/`, `/h/`), `/app`, and `notification.click` URLs, and updated the QR scanner to support `/member`, `/himno/`, and `/h/` links.
  - **AASA & Dedicated Public Web Pages (`scripts/generate-hymn-pages.js`, `docs/.well-known/apple-app-site-association`, `docs/member/index.html`, `docs/churches/index.html`, `docs/index.html`):** Upgraded AASA to modern iOS 13–27 `appIDs` + `components` covering hymns, `/member/*`, `/member?id=?*`, `/member/?id=?*`, and `/churches*`; shipped bilingual Light/Dark live public Member Profile (`/member/`) and live Verified Churches Directory (`/churches/`) web pages fetching live data from `ebp-himnario-sync` with `Open in App` deep links, Apple Smart App Banner, and store fallback, plus a `<head>` fallback redirect in `docs/index.html` for `/member/<id>` and `/churches/<id>` paths.
  - **Website UI & Legal Policies (`docs/index.html`, `docs/css/refinements.css`, `docs/app/index.html`, `docs/privacy.html`, `docs/terms.html`):** Added **Iglesias** to nav/footer and a 4th **Directorio de iglesias** card in `.home-links`; added feature pills + `"¿Ya tienes la app? Abrir ahora"` button on `/app/`; updated bilingual Privacy Policy and Terms of Service to **November 25, 2026** covering Apple/Google OAuth, R2 cloud profile photos & Google PFP recovery, iOS Daily Verse Widget (`group.com.elbuenpastor`), and shareable profile/church links + `"View as others see me"`.
- **Verification & Device Note:** `tsc --noEmit` 0 errors, ESLint 0 errors, 28/28 `scripts/test-church-sheet.cjs` passed, 761/761 `scripts/test-web-search.js` passed, live `curl` checks passed across all Pages endpoints, iOS Hermes export clean (`2,642` modules, `7.8 MB`, 129 assets). Note: Apple's AASA CDN refreshes periodically on already-installed iOS builds; if a device still opens `/member/` in Safari immediately after deploy, reinstalling TestFlight Build `#43` or waiting for Apple's CDN refresh activates Universal Links for the new routes.

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #7 (`2.2.0-sdk58-1`): iOS 26 Monochrome Member Profile, Favorites/Playlists Top-Left Titles, Full Playlist Detail Icons & Signed-In Churches Quick Access (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`05aaa7b`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #7:** Group [`f8161256-fe94-4bf5-aa92-f6c0458ccf25`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/f8161256-fe94-4bf5-aa92-f6c0458ccf25) · iOS update `01a214e5-ba3a-7e14-bc42-d37eb59d27e8`.
- **What Changed:**
  - **iOS 26 Monochrome Member Profile (`himnario/app/member/[id].tsx`):** Switched to a calm Apple system monochrome palette (`#FFFFFF`/`#000000`, neutral chips/avatars, red reserved for destructive actions), added Liquid Glass `<` circle + `[ 🔍 | 🏛️ | ↑ | ··· ]` top capsule + Liquid Glass inline search takeover, native SwiftUI segmented `As a Friend | As Public Member` preview picker, sans-serif bold `27pt` display name, monochrome capsule action buttons, and quiet muted tabular Favorites rows.
  - **Favorites & Playlists Header Titles (`himnario/components/screens/FavoritesScreen.tsx`, `himnario/context/LanguageContext.tsx`):** Pinned `My Favorites` / `Playlists` on top-left across from the glass capsule, set `Saved Hymns` / `Himnos Guardados` under the leather cover, and switched Playlists' lower heading to a slim `YOUR PLAYLISTS` / `TUS LISTAS` eyebrow.
  - **Playlist Detail Icons & Clearance (`himnario/components/screens/PlaylistDetailScreen.tsx`):** Enlarged `[ Share | ··· ]` icons to full `22pt` (`containerSize={26}`, `scale="large"`) inside `44×42` targets and added `contentInsetAdjustmentBehavior="never"` + clean cover top padding.
  - **Signed-In Churches Quick Access (`himnario/components/AuthSheetSwiftUI.tsx`, `himnario/components/AuthSheet.tsx`):** Kept **Churches (`Map`)** at the top of **Quick Access** when signed in.
- **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors, `git diff --check` clean, iOS Hermes export clean (`2,640` modules, `7.8 MB`, 129 assets).

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #6 (`2.2.0-sdk58-1`): Near Me Close-Up Above 52% Half-Sheet & Compact Minimalist Playlists Rows (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`7b4ba50`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #6:** Group [`3a83d9ba-4499-49e0-9873-d5fa0f5b6ec0`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3a83d9ba-4499-49e0-9873-d5fa0f5b6ec0) · iOS update `01a214d5-0d1b-7c2d-aad3-4a5b3e105f7f`.
- **What Changed:**
  - **Near Me & Church Close-Up Framing (`himnario/app/churches.tsx`):** Capped `sheetHalf` at `52%` of screen height so tall church detail cards don't auto-expand near full-screen; replaced `requestNearMe`'s `fitToCoordinates` with shared `animateChurchFocus` (`0.0024` delta / `340m` 3D altitude, delayed `140ms` for `mapPadding.bottom`) so **Near Me**, pin taps, and church header swipes all center an enlarged view of the church cleanly above the half-sheet grabber.
  - **Compact Minimalist Playlists Rows (`himnario/components/screens/FavoritesScreen.tsx`):** Switched Playlists from giant 2-column cards to sleek compact Apple Music horizontal rows (`54×54` tinted album artwork + title/count + subtle chevron + inset hairlines + matching compact `+ New Playlist` row), preserving `<Link.AppleZoom>` and `<Link.Menu>`.
- **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors, 27/27 `scripts/test-church-sheet.cjs` passed, `git diff --check` clean, iOS Hermes export clean (`2,640` modules, `7.8 MB`, 129 assets).

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #5 (`2.2.0-sdk58-1`): Playlists AppleZoom Card Fix, Moonlitt Map Shade/Scrim Fix, Bottom-Left 3D Placement & 3-Icon Chromatic Swipe Bubble (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`09afd72`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #5:** Group [`5133811c-3b8c-4f40-9b22-fd9d101e6ee1`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/5133811c-3b8c-4f40-9b22-fd9d101e6ee1) · iOS update `01a214c1-03d9-7fca-bf27-4c697fc25c50`.
- **What Changed:**
  - **Playlists Cover Card Fix (`himnario/components/screens/FavoritesScreen.tsx`):** Fixed production Radix `<Slot>` array/function style stripping inside `<Link.AppleZoom>` and `<Link.Trigger>` so playlist cover cards render clipped cleanly at `gridColumnWidth × gridColumnWidth` aligned with **New Playlist**.
  - **Moonlitt Satellite Shade, Uniform Smoked Glass & Top Scrim (`himnario/app/churches.tsx`):** Switched Satellite to pure `satelliteFlyover` with a subtle twilight overlay (`rgba(6, 13, 24, 0.16)`) and Night 3D to `mutedStandard` dark on iOS; updated `topStatusScrim` to track `isDarkMapChrome` with tight status-bar-only height plus dynamic white `<Stack.Screen statusBarStyle>` / focused `<StatusBar>` on dark maps; removed `<GlassGroup>` around the top search row and bottom-left controls so all pills render uniform dark smoked glass.
  - **Bottom-Left `3D` Placement & 3-Icon Native Swipe Bubble (`himnario/components/DetentSheet.tsx`, `himnario/app/churches.tsx`):** Added animated `accessoryFloor` to `DetentSheet` so `3D`/compass rests cleanly above `Maps Legal` (or `MiniPlayer`) when collapsed and tracks above the sheet when open; restored native SwiftUI `Picker` (`pickerStyle("segmented")`, `controlSize("large")`, `170×44`, interactive capsule `glassEffect`) with larger `22pt` SF Symbols (`map.fill | list.bullet | square.3.layers.3d.top.filled`) and bumped map toolbar icon sizes (`21pt` Back/QR/`+`/Compass, `18pt` Search, `16pt` Near Me, `15pt` bold `3D`/`2D`).
- **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors, 27/27 `scripts/test-church-sheet.cjs` passed, `git diff --check` clean, iOS Hermes export clean (`2,640` modules, `7.8 MB`, 129 assets).

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #4 (`2.2.0-sdk58-1`): Threads Profile, View As, Moonlitt Map Layers & 2D/3D, Apple Music Favorites/Playlists, Google PFP Recovery & Native SwiftUI Admin Command Center (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`18aab5b`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live Cloudflare Backend:**
  - **D1 (`ebp-himnario-db`):** `0020_google_avatar_recovery.sql` applied remotely (`google_avatar_url` + `avatar_removed_at` on `users`; bookmark `00000200-00000006-0000512e-4ddd97c0d14b68c78b9e97ccfec6ecb7`).
  - **Worker (`ebp-himnario-sync`):** Deployed version `16659432-0df0-45d8-b574-14ababd23d1f` (verified live `/health` `200 OK`).
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #4:** Group [`99c63884-038f-496a-bb56-c8a08e7aa0f7`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/99c63884-038f-496a-bb56-c8a08e7aa0f7) · iOS update `01a214a0-a5d1-7f29-b8f3-610b1e1e5a6d`.
- **What Changed:**
  - **Threads-Style Member Profile & `"View As Others See Me"` (`himnario/app/member/[id].tsx`, `himnario/app/my-profile.tsx`, `himnario/components/screens/MyProfileOverview.ios.tsx`):** Rebuilt member profiles on an open Sacred Ink canvas with minimal top bar (`Back`, inline live `Search`, `Church`, `Share`, native SwiftUI `···` menu with Admin moderation shortcuts), `68pt` avatar + lightbox + Obispo seal, `Ministry` / `Coro` / `Church` pills, overlapping mini-avatars + counts, dual action buttons (with Share Playlist modal), full-width underline tabs (`Favorites | Friends | Church`), and live `"View as others see me"` (`As a Friend` | `As Public Member`) preview in `Mi Perfil`.
  - **Moonlitt-Inspired Churches Map & Polish (`himnario/app/churches.tsx`, `himnario/components/churches/MapLayersPopover.tsx`, `himnario/components/churches/ChurchDetailActionBar.tsx`, `himnario/components/DetentSheet.tsx`, `himnario/components/screens/ProfileSubPages.ios.tsx`):** Unified `44pt` true iOS 26 Liquid Glass 3-icon capsule (`Map | List | Layers`) with dark-map-adaptive chrome, floating Moonlitt-style `MapLayersPopover` (`Standard` · `Night 3D` · `Satellite` visual tiles + circular `✓` close + `AsyncStorage` persistence), bottom-left circular Liquid Glass `2D`/`3D` pill (auto-zooming smoothly so 3D buildings appear immediately, plus auto-appearing North compass reset pill) anchored via `DetentSheet` `accessoryLeft`, SF Symbols on `ChurchDetailActionBar`'s `More` SwiftUI `<Menu>`, overlapping member avatars on `Members at this church`, Title Case `Profile Details`, `17pt` icons, and singular/plural `1 playlist` grammar.
  - **Google PFP Recovery (`workers/ebp-auth-sync/migrations/0020_google_avatar_recovery.sql`, `oauth.js`, `index.js`, `community.js`, `himnario/utils/avatarUpload.ts`, `himnario/utils/useAvatarPicker.ts`, `himnario/context/AuthContext.tsx`, `himnario/components/screens/ProfileSubPages.ios.tsx`):** Saves Google OIDC `picture` (`google_avatar_url`) and tracks manual removals (`avatar_removed_at`) so re-login respects removals while enabling 1-tap `POST /auth/avatar/restore-google` (with `410 google_avatar_expired` handling) in Profile Details and the avatar action menu.
  - **Native SwiftUI Admin Command Center (`himnario/components/screens/ModerationScreen.ios.tsx`, `ModerationScreen.tsx`, `workers/ebp-auth-sync/community.js`, `himnario/utils/communityApi.ts`):** Added `GET /mod/overview`, upgraded `GET /mod/users` (`q` + `recent` / `pending_obispo` / `suspended` / `all`), `POST /mod/users/:id/verify-email`, and `POST /mod/users/:id/clear-avatar`, driving a native SwiftUI `<Form>` Admin console with pull-to-refresh, 4-tile live KPI strip, 5 tabs (Reports, Churches, Members, Choirs, Live Analytics & Hymn Reactions), `SwipeActions`, `ContentUnavailableView`, and 1-tap member actions.
  - **Apple Music iOS 26 Favorites & Playlists (`himnario/components/screens/FavoritesScreen.tsx`, `himnario/components/screens/PlaylistDetailScreen.tsx`, `himnario/components/AnimatedEqualizer.tsx`, `himnario/components/TrackEllipsisMenu.tsx`):** Fixed status-bar title overlap with pinned floating Liquid Glass top bar, atmospheric burgundy/parchment top cover wash, compact `156×156` parallax hero cover synced to `hymnCoversStore`, 3-button `Shuffle | ▶ Play | +` cluster, open borderless tracklist with wider crisp non-italic sans-serif titles (tap title = lyrics, tap number/equalizer = audio), `AnimatedEqualizer` 3-bar animation, single trailing SwiftUI `···` menu (`TrackEllipsisMenu`), 2-column visual Playlists grid, editorial footer, and matching `PlaylistDetailScreen` upgrade.
- **Verification & Pending Device Checks:** `tsc --noEmit` 0 errors, ESLint 0 errors, 199/199 Node tests passed (extended `scripts/test-oauth-security.cjs` covering Google PFP recovery, `410`, `/mod/overview`, `/mod/users` filters, `verify-email`, `clear-avatar`), `test-web-search.js` (761 items) passed, iOS Hermes export clean (`2,640` modules, `7.8 MB`). Physical iPhone TestFlight verification pending on: Threads member profile + `View As`, Moonlitt 3-icon capsule + Layers popover + bottom-left `2D`/`3D` & compass, Apple Music Favorites + Playlists + Playlist Detail (Light & Dark Mode), Google PFP remove & restore, and SwiftUI Admin Command Center.

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #3 (`2.2.0-sdk58-1`): Church Sheets, Mi iglesia, Amistades & Notificaciones UX Simplification (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`4c09d5a`, pushed to `origin/sdk-58`).
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #3:** Group [`a0b1a54b-f50f-4b20-b5f6-04f8fd7be41f`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/a0b1a54b-f50f-4b20-b5f6-04f8fd7be41f) · iOS update `01a21455-d535-71f7-b788-f95e3038c9b9`.
- **What Changed:**
  - **Church Detail & Submit Sheets (`himnario/components/churches/ChurchDetailActionBar.tsx`, `himnario/app/churches.tsx`, `himnario/utils/churchSchedule.ts`):** Kept the owner's preferred Liquid Glass sheet backdrops intact; replaced the clipped 2-row action buttons (`Mirar alrededo`, `Código Q`, green-on-green `Tu iglesia`) with a full-width primary `Cómo llegar · <time>` pill + 4 equal icon-over-label Liquid Glass tiles (`Mirar`, `Tu iglesia`/`Mi iglesia`, `QR`, `Más` native menu with Copy Address, Share, Admin Edit/Delete); added live `Hoy` / `Próximo` service pill; fixed `"1 miembros visibles"` singular/plural grammar; gave bottom safe-area breathing room; shortened Add/Edit Church sheet titles (`Nueva iglesia`/`Editar iglesia`/`Revisar iglesia`), removed duplicate bottom `Verificar y publicar` button, and tucked the cloud photo URL input behind a glass-matched `Enlace` toggle.
  - **Mi iglesia (`himnario/components/screens/ProfileSubPages.ios.tsx`):** Collapsed redundant manual location fields behind native SwiftUI `DisclosureGroup` when linked to a verified church, unified all 3 church-visibility toggles under `VISIBILIDAD` with immediate auto-save, and hid the bottom `Guardar` button unless manual fields are edited.
  - **Native SwiftUI Amistades & Notificaciones (`himnario/components/screens/FriendsScreen.ios.tsx`, `NotificationsScreen.ios.tsx`, `himnario/app/my-profile.tsx`, `FriendsPanel.tsx`, `NotificationsPanel.tsx`, `LanguageContext.tsx`):** Ported both screens on iOS to native SwiftUI `<Form>` with `ContentUnavailableView` and `SwipeActions`, moved Privacy (4 toggles + note) and Notification Preferences (push status + 3 toggles) behind top-right `shield` / `slider.horizontal.3` buttons opening native Liquid Glass `<BottomSheet>`s, removed the redundant green push-enabled status banner, and aligned Spanish notification copy to `Amistades`.
- **Verification & Pending Device Checks:** `tsc --noEmit` 0 errors, ESLint 0 errors, 199/199 Node tests passed (`scripts/test-church-sheet.cjs` extended with `getNextServiceSummary`), `test-web-search.js` (761 items) passed, iOS Hermes export clean (`2,636` modules, `7.7 MB`). Physical iPhone TestFlight verification pending on all 5 updated screens.

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #2 (`2.2.0-sdk58-1`): Longer Hymns Number Scroller & Índice A–Z Glass Carousel (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`33c52e0`, pushed to `origin/sdk-58`).
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #2:** Group [`89a7a35a-6b93-4135-a00e-9ea6f051e8d5`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/89a7a35a-6b93-4135-a00e-9ea6f051e8d5) · iOS update `01a21436-6714-7182-8815-78be6b846d48`.
- **What Changed (`himnario/app/(tabs)/hymns.tsx`):** Lengthened both the **Himnos/Estribillos vertical number scroller** (`top: 58`, dynamic `bottomNavClearance` + active MiniPlayer offset, slimmer `right: 2`/`width: 54` alignment, automatic track re-measurement) and the **Índice A–Z glass carousel** (`scrubberTopClearance = 54`, `Math.min(580, scrubberAvailableHeight)`, `11pt` letters) so both extend cleanly across the full safe vertical zone without overlapping filter chips, `[Himnos | Estribillos | Coritos]` pills, the floating tab bar, or the MiniPlayer.
- **Verification:** `tsc --noEmit` 0 errors, ESLint 0 errors, `test-web-search.js` (761 items) passed, `git diff --check` clean, iOS Hermes export clean (`7.6 MB`).

---

## November 25, 2026 — SDK 58 iOS Build #43 OTA #1 (`2.2.0-sdk58-1`): Official Sign in with Apple & 4-Color Google Buttons + Cloud-Synced Profile Photos (`sdk-58` branch)

- **Branch & Commit:** `sdk-58` (`8af1ad4`, pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Live Cloudflare Backend:**
  - **D1 (`ebp-himnario-db`):** `0019_user_avatars.sql` applied remotely (`ALTER TABLE users ADD COLUMN avatar_url TEXT`).
  - **Worker (`ebp-himnario-sync`):** Deployed version `d5f8cd5b-aefe-43de-b75a-40a3141180c5` (verified live `/health` `200`, unauthenticated `DELETE /auth/avatar` `401`).
- **Live iOS OTA (`production` branch, `runtimeVersion: "2.2.0-sdk58-1"`, Build `#43` only):**
  - **OTA #1:** Group [`8aa629c1-508d-4b9c-98f3-b8aee0ce5f4c`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/8aa629c1-508d-4b9c-98f3-b8aee0ce5f4c) · iOS update `01a2142a-6f24-7c00-a4d2-7cc9b1f2afd5`.
- **What Changed:**
  - **Social-First Official OAuth Buttons (`himnario/components/OAuthButtonsStack.tsx`, `AuthSheetSwiftUI.tsx`, `AuthSheet.tsx`):** Moved Apple & Google sign-in to the top of the login sheet directly below `Iniciar sesión | Crear cuenta` (hosted via `@expo/ui/swift-ui` `<RNHostView matchContents={{ vertical: true }}>` on iOS 26 and shared in RN fallback), with Apple HIG dark/light contrast, official 4-color Google "G" SVG (`#4285F4`/`#34A853`/`#FBBC05`/`#EA4335`), zero trailing chevrons, and a clean `o con tu correo` / `or with email` divider.
  - **Cloud-Synced Profile Photos (`workers/ebp-auth-sync/oauth.js`, `community.js`, `index.js`, `himnario/components/UserAvatar.tsx`, `utils/avatarUpload.ts`, `utils/useAvatarPicker.ts`, `context/AuthContext.tsx`):** Automatic Google OIDC `picture` import mirrored into Cloudflare R2 (`avatars/<userId>/<uuid>.<ext>`, SSRF-guarded `*.googleusercontent.com`, magic-byte validated, never overwrites existing custom avatar); `POST /auth/avatar` & `DELETE /auth/avatar` (`<= 512 KB`, R2 cleanup on overwrite/remove/account-delete); 1-tap camera/library square-crop picker in **Mi Perfil** (`MyProfileOverview.ios.tsx`, `ProfileSubPages.ios.tsx`, `app/my-profile.tsx`); circular `<UserAvatar>` rendered across `HomeHeaderActions.tsx` (top-right Liquid Glass circle), Account sheet, Settings (`Settings.ios.tsx`, `Settings.legacy.tsx`), `app/member/[id].tsx`, `FriendsPanel.tsx`, `VerseDiscussionSheet.tsx`, and `app/churches.tsx`.
- **Verification & Pending Device Checks:** `tsc --noEmit` 0 errors, ESLint 0 errors, 198/198 Node tests passed (`scripts/test-oauth-security.cjs` extended for Google PFP R2 import, SSRF allowlist, `/auth/avatar` upload/delete, and account-delete R2 cleanup) + `test-web-search.js` (761 items), iOS Hermes export clean (`2,633` modules, `7.6 MB`). Pending on-device TestFlight Build `#43` check: verify official Apple & 4-color Google buttons in Light & Dark Mode, Google login PFP auto-import, and 1-tap photo upload/removal in **Mi Perfil** updating the Home header circle and community views.

---

## November 25, 2026 — SDK 58 iOS Build #43 (`2.2.0` / `2.2.0-sdk58-1`) Upgrade Suite & Live Cloudflare OAuth Backend (`sdk-58` branch)

### Handoff for continuing on another desktop

- **Branch & Latest Commit:** Start on `sdk-58` (`git fetch origin && git checkout sdk-58 && git pull --ff-only`). Feature code is `36f86af`, `.easignore` updates are `f650c50` & `f0e9260` (all pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Native Build Queued for TestFlight:** iOS `production` **Build `#43` (`2.2.0 (43)`, runtime `2.2.0-sdk58-1`)** — EAS Build [`6790dff2-42cc-40fa-a7d4-9e5e99d88894`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/6790dff2-42cc-40fa-a7d4-9e5e99d88894), auto-submit scheduled ([`c72875c8-fbb0-41a8-9dc8-607c04fe0b20`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/c72875c8-fbb0-41a8-9dc8-607c04fe0b20); never run manual `eas submit`). Targets provisioned on Apple Developer Portal & EAS: `com.elbuenpastor` (Profile `ZM5HK4A7JT` — `App Groups` `group.com.elbuenpastor` + `Sign In with Apple`) and `com.elbuenpastor.ExpoWidgetsTarget` (Profile `Z3WL2VAXMT` — `App Groups`). Previous Build `#39` (`85ea3bf4`, `2.1.0-sdk58-2`, OTA `#14` `46c740a8`) will not receive `2.2.0-sdk58-1` OTAs.
- **Live Cloudflare Backend:** D1 `ebp-himnario-db` migrated with `0018_oauth_identities.sql` (`num_tables: 22`); Worker `ebp-himnario-sync` deployed as version `046972c7-11e0-4d1f-8802-a678c13376c7` (`APPLE_CLIENT_IDS=com.elbuenpastor`, `GOOGLE_CLIENT_IDS=242867050819-vgirqp4m77rrthvhis46kbiajmcg9qce.apps.googleusercontent.com`; verified live `/health` `200` and `/auth/oauth/google` invalid-token rejection `401`).
- **What Changed:** Native pull-down Sort Menus (`ListSortMenu.tsx` on Hymns, Churches, Playlist Detail), one-time bilingual `WhatsNewSheet` + SwiftUI `numericText` transitions, Sign in with Apple + Google OAuth (Worker RS256 JWKS + native client PKCE), `expo-widgets` "Versículo del Día" widget (`systemSmall`, `systemMedium`, `systemLarge`, `accessoryRectangular` + 7-day midnight timeline sync + `withWidgetContainerBackground.js`), Sanctuary `expo-brightness` slider with auto-restore, `pressto` + `react-native-keyboard-controller` + `sonner-native` toasts, `expo-store-review`, iPad/tablet clearance & width polish, and root `.easignore`.
- **Verification & Pending Device Checks:** `tsc --noEmit` (0 errors), ESLint (0 errors), 13/13 Node test suites (including new `scripts/test-oauth-security.cjs`), `expo config --type introspect` clean, iOS Hermes export (`2,629` modules, `8.8 MB`). Once Build `#43` lands on TestFlight, verify on physical **iPhone + iPad**: Sign in with Apple, Google OAuth (add test Gmail in Google Auth Platform → Audience → Test users), Home/Lock Screen `Versículo del Día` widgets (`Small`/`Medium`/`Large`/Lock Screen), Sanctuary brightness slider auto-restore, `WhatsNewSheet`, pull-down Sort Menus, `numericText` animations, and `sonner-native` toasts. Matching Android `2.2.0-sdk58-1` native rebuild also remains before merging `sdk-58` → `main`.

---

## November 24–25, 2026 — Expo SDK 58 / iOS 26 Native Liquid Glass Polish & TestFlight Build #39 (`sdk-58` branch)

### Handoff for continuing on another desktop

- **Branch & Latest Commit:** Start on `sdk-58` (`git fetch origin && git checkout sdk-58 && git pull --ff-only`). Latest code commit is `4c72b92` (pushed to `origin/sdk-58`). **`main` and `app-web-parity` remain untouched on Expo SDK 54 (`2.0.0-release-5`, Build `#34`).**
- **Native Build Live on TestFlight:** iOS `production` **Build `#39` (`2.1.0 (39)`, runtime `2.1.0-sdk58-2`)** — EAS Build [`85ea3bf4-1464-450a-8ac3-a4214dc4902a`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/85ea3bf4-1464-450a-8ac3-a4214dc4902a), auto-submitted (`2ff03642-7c40-4f72-84fc-fa202635d082`; never run manual `eas submit`). Built on `macos-tahoe-26.6-xcode-27.1-sdk-58` (Xcode 27.1). Adds `@expo/ui@~58.0.29` (SwiftUI bridge) and keeps all 3 active patches (`@react-native-menu+menu+2.0.0.patch`, `react-native+0.88.1.patch`, `react-native-track-player+4.1.2.patch`). Reusable `ios-simulator` dev-client build: `ab730373-e05a-40aa-ad4e-71b99553354b`.
- **Latest Live iOS OTA (`production` branch, `runtimeVersion: "2.1.0-sdk58-2"`, Build `#39` only):**
  - **OTA #14 (current live):** Group [`46c740a8-0a35-4dce-aff3-3b68b738c173`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/46c740a8-0a35-4dce-aff3-3b68b738c173) · iOS update `01a2139b-1031-7f93-ab32-716ad95d0577` (commit `4c72b92`) — Fixed Índice left pill clipping and made `[Himnos] [Estribillos] [Coritos]` smoothly horizontal-swipeable (`hymns.tsx`), and aligned `AuthSheetSwiftUI.tsx` to Oyelo's exact `GenerationReviewView.swift`: dead-center `principal` title, soft neutral opaque card polarity (`#E9E9EE` Light / `#262629` Dark), opaque mode-switcher card without muddy dark bleed-through or excess gap, compact Oyelo-style grouped action row card fitting cleanly in `.medium` detent, and calm monochrome `Cancelar`/`Cerrar`. Physical iPhone TestFlight verification pending.
  - **Earlier SDK 58 OTAs (superseded by `#14`, full details in [EAS.md](../EAS.md)):**
    - OTA `#13` `5e9bcc8f` (`ac194b9`): Centered Índice A–Z glass carousel, Coritos Índice pill (`27–124`), Settings large-to-blur title (`useScrollGeometryChange`), opaque AuthSheet cards, native Share sheet header, and permanently mounted SwiftUI `<Host><BottomSheet>` fixing Profile reopen white-screen.
    - OTA `#12` `25ad0eb7` (`e56cced`): Account card tap fix inside SwiftUI `<BottomSheet>`, tight Oyelo top alignment, and major iOS 26 native SwiftUI Profile/Ministry/Choir/Church/Friends/Notifications/Admin Moderation overhaul.
    - OTA `#11` `3ec1e78f` (`f4d687c`): Oyelo native SwiftUI `<BottomSheet>` translucent Light-Mode glass, Sign-In UI redesign, Settings compact soft blur & larger preview title, and scrolling Índice pills.
    - OTA `#10` `8a06a50a` (`8f59624`): Native SwiftUI chromatic Liquid Glass `map.fill | list.bullet` segmented picker on Maps (`app/churches.tsx`).
    - OTA `#9` `47062829` (`7990c2f`): Maps Liquid Glass swipe bubble + icons, classic printed-hymnal Índice + leveled pills, Apple Music nested Favorites tab `<Stack>` + `EBP_HYMN_COVER.png` playlist artwork, Sacred Ink Light/Dark palette alignment, and Option A Apple Books split Liquid Glass Hymn Reader bar.
    - OTA `#8` `03f8b07c` (`b1067b6`): Fixed production Radix `<Slot>` array-style row collapse in `HymnRowLink.tsx` & `favorites.tsx`, single-tap `×` close, flush `TextSizeSheet` & `< N`/`N >`, Oyelo SwiftUI `/auth-sheet`, and Maps Liquid Glass pop-ups.
    - OTA `#7` `374dd6a9` (`006b8e7`): `HymnRowLink` `<Link.Preview />` + `<Link.Menu>` and Playlist `Link.AppleZoom`.
    - OTA `#6` `77864022` (`1ec5ffe`): Native iOS 26 Liquid Glass `formSheet` route (`app/auth-sheet.tsx`) for the entire Auth & Account sheet with `Stack.Toolbar` Liquid Glass pills and Sacred Ink burgundy prominent circular CTA.
    - OTA `#5` `4ecb18c5` (`5a90281`): Disabled tab bar 4 → 1 collapse (`minimizeBehavior="never"`), restored classic underline sub-tabs on `hymns.tsx`, restored floating `TextSizeSheet` popover, restored translucent Liquid Glass + floating `SheetGrabber` on Churches `DetentSheet`, merged Favorites header icons into one connected Liquid Glass capsule with Search on far left, restored custom sliding pill with count badges in `LiquidGlassSegmented.tsx`, and redesigned Settings 5-star card in Sacred Ink burgundy.
    - OTA `#4` `4df30934` (`aff8654`): Sacred Ink theme tint on Settings Dark Mode `<Toggle>` (`#525252` in Dark Mode, `#6e1619` in Light Mode).
    - OTA `#3` `6b1a8c22` (`8402ec7`): Restored original Hymn Reader top bar & prev/next controls, original Hymns search bar, and original non-glass buttons on MusicPlayer/MiniPlayer/Projector/Churches sheets; switched Settings Appearance dropdown to native iOS `<Toggle>` switch.
    - OTA `#2` `85d0b1c5` (`2dd989c`): Upgraded `GlassSurface` + exported `GlassGroup` (`UIGlassContainerEffect`) for `expo-glass-effect@58` (`sanitizeNativeGlassStyle`, `borderCurve: 'continuous'`, `tintColor`, removed SDK 54 focus/AppState remount hacks).
    - OTA `#1` `55086d4d` (`cffa278`): Fixed Fabric invisible church map pins, Churches top scrim & frosted `DetentSheet`, Settings large-title scroll collapse & `NativeTabs` scroll minimization, Light-Mode status bar visibility, and restored classic iOS warm-gold 5-star rating card.

### Summary of everything changed on `sdk-58`

1. **Expo SDK 54 → 58 Upgrade (commits `828176e`..`8873fea`):**
   - Upgraded stepwise through SDK 55/56/57/58 (`expo@^58.0.26`, React Native `0.88.1`, React `19.3.0`, Reanimated `4.7.1`, Gesture Handler `~3.3.0`, `react-native-screens@~4.30.1`, `expo-router/native-tabs` stable, UIKit `SceneDelegate` lifecycle).
   - Removed unused `sharp` devDependency (`922407d`), patched `@react-native-menu/menu` `#import "RCTBridge.h"` for RN 0.88 (`825db8d`), regenerated `react-native+0.88.1.patch`, retired `react-native-screens+4.16.0.patch`.
2. **iOS 26 Native SwiftUI (`@expo/ui`) Settings, Profile, Segmented Pickers & `formSheet`s (`143b1d3`, `cffa278`, `8402ec7`, `aff8654`):**
   - Added Android/Web/Node-safe loader `himnario/utils/expoSwiftUI.ts` (`getExpoSwiftUI`, `isIOSLiquidGlassAvailable`).
   - Built native SwiftUI Settings (`himnario/components/screens/Settings.ios.tsx`, `app/(tabs)/settings/_layout.tsx` & `index.tsx`; Android/Web keep `Settings.legacy.tsx`): direct `<Host><Form>` root so UIKit binds large-title collapse and `NativeTabs` `minimizeBehavior="onScrollDown"`, native `<Toggle>` for Dark Mode with Sacred Ink theme tint (`#525252` dark / `#6e1619` light), live serif hymn font preview + native `Slider`, inline `Picker`s for App & Hymn Languages, offline audio status/download/delete, interactive warm-gold 5-star rating card (4–5 stars → App Store review; 1–3 stars → feedback), Share & About links, and centered signature footer.
   - Built native SwiftUI Profile overview (`himnario/components/screens/MyProfileOverview.ios.tsx` + transparent large-title stack in `app/my-profile.tsx` & `app/_layout.tsx`).
   - Adopted native SwiftUI `Picker(.segmented)` in `LiquidGlassSegmented.tsx` across `hymns.tsx`, `favorites.tsx`, `churches.tsx`, `AuthSheet.tsx`, `AppShareSheet.tsx`, `FriendsPanel.tsx`, `member/[id].tsx`.
   - Added translucent iOS 26 Liquid Glass `formSheet` routes `app/text-size-sheet.tsx` and `app/about-sheet.tsx`.
   - Fixed Light-Mode status bar contrast (`statusBarStyle` on root, settings, and hymn `<Stack>` `screenOptions`).
3. **Churches Map Pins & UI Fixes (`cffa278`, `2dd989c`, `8402ec7`):**
   - Replaced `<Marker image={...}>` (invisible under RN `0.88.1` Bridgeless Fabric) with `<ChurchPinMarker>` explicit-sized child `<Image>` (`app/churches.tsx`), added initial camera framing for nearest church + user dot, top status-bar scrim, frosted `DetentSheet` backing, inside grabber (`components/DetentSheet.tsx`), half-sheet default for `<= 3` churches, and `LiquidGlassSegmented` for `Mapa | Lista`.
4. **SDK 58 `expo-glass-effect@58` Upgrade on Existing Liquid Glass Surfaces (`2dd989c`, `8402ec7`):**
   - Upgraded `components/GlassSurface.tsx` (removed SDK 54 `AppState`/focus forced-remount `key` hack, added `sanitizeNativeGlassStyle()` to strip `overflow: 'hidden'` / synthetic borders / opaque backgrounds on iOS 26+ while enforcing `borderCurve: 'continuous'`, forwarded `tintColor`, exported `GlassGroup` wrapping `GlassContainer`).
   - Upgraded existing Liquid Glass controls in `HomeHeaderActions.tsx`, `favorites.tsx` (unified on `GlassGroup` + `GlassSurface` without forced remount keys), `churches.tsx` top bar (`GlassGroup`), `hymns.tsx` existing glass chips/scrubber, `VerseDiscussionSheet.tsx` (`GlassGroup`), `VerseCard.tsx`, `ActionToast.tsx`, and `LiquidGlassSegmented.tsx`.

### Owner UI Preferences Locked In During Testing (Do Not Regress)

- **Only keep Liquid Glass on controls that were already Liquid Glass** (Home header `🔍`/`ID`, Favorites top capsules & search takeover, Churches top map bar, existing chips/scrubber, sheet close circles, MiniPlayer, VerseCard/Discussion).
- **Keep original Hymn Reader (`app/hymn/[id].tsx`)** top bar (no glass circles squeezing `"Himnario..."`), original bottom `< N` / `N >` prev/next pills, and original floating pill; **keep original Hymns search bar (`app/(tabs)/hymns.tsx`)**; **keep original non-glass buttons** on `MusicPlayer.tsx`, `ProjectorModal.tsx`, and Churches sheet `✕` / photo viewer / QR overlays.
- **Settings Dark Mode:** Keep as a native SwiftUI `<Toggle>` switch (not a 3-choice dropdown) tinted with Sacred Ink theme colors (`isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary`). Keep the classic warm-gold 5-star rating card in Settings.

### Verification & Remaining Work Before Merging `sdk-58` → `main`

- **Verified automated:** `npx tsc --noEmit` (0 errors), all 11 `scripts/test-*.cjs` suites (196/196) + `test-web-search.js` (761 items), `git diff --check` (0), `npx expo lint` (0 errors), iOS & Android Hermes exports clean.
- **Verified on owner's iPhone (TestFlight Build `#39`):** Settings large-title collapse, `NativeTabs` scroll minimization, Dark Mode switch layout, existing Liquid Glass Home header circles.
- **Still pending:**
  1. Final iPhone check on OTA `4df30934` (Dark Mode switch tint `#525252`/`#6e1619`, restored Hymn Reader & Hymns search bar, Churches pins & Look Around, audio playback & lock-screen controls, QR/photo upload, account sync & Friends).
  2. Matching **Android native rebuild** on `2.1.0-sdk58-2` (Android is still on `2.0.0-securestore-1`).
  3. Merging `sdk-58` into `main` & `app-web-parity` once TestFlight sign-off is complete.

---

## November 24, 2026 — Swipe-down Home doctrine sheet & editorial cards (released)

- **Source:** commit `b3581eb` (pushed to `app-web-parity` and `main`).
- **iOS OTA (`production`, runtime `2.0.0-release-5`):** group [3a5900b7-2500-454a-94a1-f4b5dffd1c8f](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3a5900b7-2500-454a-94a1-f4b5dffd1c8f), iOS update `01a20ede-44ad-7b54-af63-cbfd1fdf7d81`.
- **What changed (`himnario/app/(tabs)/home.tsx`):** Replaced the static Church Motto modal with a Reanimated + Gesture Handler swipe-down sheet (`buildSheetBackdropGesture` + `buildSheetPanGesture` on backdrop, floating grabber, and sticky header), redesigned the layout with a sticky Liquid Glass `X` header, left-accented Scripture callout card, and 4 icon-badged editorial cards (`Nombre`, `Lema`, `Fundamento`, `Finalidad` — zero crosses), plus English title localization for Recently Viewed hymns on Home.
- **Verification:** `tsc --noEmit` 0 errors, `expo lint` 0 errors (0 warnings in `home.tsx`), `git diff --check` clean, iOS Hermes export clean. Physical iOS device swipe check pending.

## November 24, 2026 — Profile navigation and sign-out (released)

Source `8ed9f84`. iOS production OTA group [7c22b4d8-75cd-4d1c-9cb0-0ff211130233](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/7c22b4d8-75cd-4d1c-9cb0-0ff211130233), iOS update `01a20ed7-e20b-79a0-82a6-4e60f1dcdbc1`, runtime `2.0.0-release-5` for Build #34. Profile sections use native stack entries. Member browsing replaces the current member, tapping oneself returns to the overview, and returning from a verse author reopens the discussion. Sign-out closes the account sheet and clears profile history. TypeScript, 196 tests, search checks and iOS export passed. Physical iOS swipe, notification and offline sign-out checks pending.

## November 24, 2026 — Glorify sheet swipe, full member profiles, Liquid Glass Favorites/Playlists, swipeable player artwork, and full Admin coro controls (released)

- **Source:** commit `1787731` (pushed to `main` and `app-web-parity` before OTA).
- **Published live IDs:**
  - **D1 (`ebp-himnario-db`):** `0017_friends_list_visibility.sql` applied remotely (`show_friends_list INTEGER NOT NULL DEFAULT 1`).
  - **Worker (`ebp-himnario-sync`):** `e8b6bbc6-06ef-4c9a-bf97-b84bf4e08eec`.
  - **Pages (`ebp-himnario`):** `60dba153` (`https://60dba153.ebp-himnario.pages.dev`).
  - **iOS OTA (`production`, runtime `2.0.0-release-5`):** latest group `90ef7b68-c3fb-496d-9d81-07e935286dd7` · iOS update `01a20ebe-0a5d-724a-a2e5-d5614bf73b98` (commit `2c530cf`: full-screen `/my-profile` + Admin Moderation hub, streamlined `AuthSheet`, Apple Music top search takeover, `MenuView` Fabric `imageColor` SF Symbols fix, English hymn title localization across lists & players, live Favorites sort `setQueue` sync). Earlier Nov 24 groups: `144045be-5b87-4892-a5a7-5e34bad89dbb` (`6ecd690`) and `154a6e7f-f46f-4e29-bba3-0e660aca5099` (`1787731`).
- **What changed:**
  - **Glorify backdrop swipe:** Added `himnario/utils/useSheetBackdropGesture.ts` and wired backdrop + grabber swipe-down across all bottom sheets (`AuthSheet`, `VerseDiscussionSheet`, `DetentSheet`, `AppShareSheet`, `ShareSheet`, `TextSizeSheet`, `AddToPlaylistModal`, `VerseCard`, `churches.tsx`, `favorites.tsx`, `playlist/[id].tsx`).
  - **Full-screen member profiles + offline cache:** Created `himnario/app/member/[id].tsx` + `himnario/utils/memberProfileCache.ts` (`AsyncStorage` stale-while-revalidate cache); wired member taps from `FriendsPanel`, `churches.tsx`, and `VerseDiscussionSheet` while keeping `Cuenta` as a bottom sheet. Added `GET /users/:id/friends` + `showFriendsList` privacy switch + `docs/privacy.html` updates.
  - **Admin coro edit/delete for all coros:** Unlocked `PUT /mod/choirs/:slug` and `DELETE /mod/choirs/:slug` for all approved choirs (including built-ins) in `community.js`, `choirsStore.ts`, `CommunityProfile.tsx`, and `CommunityModeration.tsx`.
  - **Favorites queue fix + Apple Music Liquid Glass redesign:** Wired `source: 'favorites'` in `hymn/[id].tsx` and `queueLabel`/`setShuffle` in `NowPlayingContext.tsx` so skipping and page-flipping stay inside Favorites; redesigned `favorites.tsx` and `playlist/[id].tsx` with Liquid Glass action capsules, spring-sliding segmented control, 1-tap Play/Shuffle pills, inline Search/Sort `MenuView`, Create/Rename sheets, and `+ Add Hymns` picker.
  - **YouTube Music swipeable artwork:** Added `clampArtworkDrag` & `artworkSwipeDirection` (`gestureMotion.ts`) and 3-card horizontal cover swipe with peeking `#number · Title` captions in `MusicPlayer.tsx` while preserving the MiniPlayer morph.
- **Verification:** `tsc --noEmit` 0 errors, `196/196` Node tests passing, `test-web-search.js` passing, `expo lint` 0 errors (49 baseline warnings), iOS Hermes export clean (`8.33 MB`), `audit-secrets.py` 0 findings. Physical iOS device testing on TestFlight Build #34 remains.

## November 23, 2026 — Friendships, cross-church directory, choir editing (released)

### Antigravity pickup: what is live and where to continue

- **Start from Git commit `5128813` or newer on `main` / `app-web-parity`.** Feature code is `e505fcc`; `791683d` fixes the Pages deployment helper to use Wrangler's active OAuth session. Both branches pointed to `5128813` when this handoff was written. Pull before editing or publishing so an older OTA does not replace the current app.
- **App files:** `himnario/components/FriendsPanel.tsx` contains the compact Amistades/Solicitudes/De mi iglesia tabs and counts; `AuthSheet.tsx` displays the account count and the cross-church visibility choice; `VerseDiscussionSheet.tsx` displays the count on public comment profiles; `himnario/app/churches.tsx` displays the church directory and visible-member count; `CommunityModeration.tsx` edits approved coro names; `SheetGrabber.tsx` sets the shared `60×12` pill. All new labels are in both languages in `LanguageContext.tsx`.
- **Backend and site files:** `workers/ebp-auth-sync/community.js` implements the visitor directory, friend counts, and `PUT /mod/choirs/:slug`; `index.js` routes them. Migration `workers/ebp-auth-sync/migrations/0016_public_church_directory.sql` and `schema.sql` define `directory_visible_to_all` with default `0`. `docs/privacy.html` describes the behavior in Spanish and English. `scripts/test-verse-community.cjs` covers consent, exclusions, counts, and editing.
- **Privacy rule:** Same-church suggestions use the existing opt-in; visitors from another church require the separate, off-by-default `directory_visible_to_all` opt-in. Only signed-in viewers can query the directory. Keep blocked, suspended, unverified, and opted-out users excluded. An accepted friendship and public friend count do not bypass directory consent. Coro edits change displayed Spanish/English names only; keep slug and existing user associations stable.
- **Release already completed:** remote D1 `0016`, Worker `1329687d-69be-44ea-acb1-e4b92ed01215`, Pages `d13b5c7d`, then iOS OTA group `d8d19cab-07a9-4449-b6f8-efbe6eb5f919` on production runtime `2.0.0-release-5` (Build #34). These IDs are the current recorded release, so do not deploy them a second time. No Android release was made; its `2.0.0-securestore-1` runtime cannot receive this iOS OTA.
- **Still needs physical verification:** On Build #34, compare two signed-in accounts in the same church and an outsider account. Check default hidden status, both consent switches, member count, blocked/unverified exclusions, accepted-friend count on account and public comment profile, the iOS glass tabs, `60×12` grabber, and Admin coro-name edits without lost selections. The automated checks and anonymous endpoint checks passed; signed-in end-to-end device behavior was not verified. Record any follow-up release in `EAS.md`.

- **People UI:** The account profile shows a tappable accepted-friend count; public comment profiles show the same count. The friends panel now groups Amistades/Friends, Solicitudes/Requests, and De mi iglesia/From my church in a compact segmented control. The iOS control uses the existing native glass surface; Android keeps a tonal surface. Spanish friendship labels are inclusive.
- **Church card:** Any signed-in account can open the visible member list for an approved, verified church, including a church other than their own. The card shows a viewer-specific visible count. Guests see a sign-in prompt. Existing same-church suggestions still work. Blocked, suspended, unverified, and opted-out accounts are filtered.
- **Fresh consent for visitors:** D1 migration `0016_public_church_directory.sql` adds `directory_visible_to_all` defaulting to off. The old «Sugerirme a mi iglesia» setting still controls same-church visibility; the new «Visible para otras iglesias» switch is required before a member appears to signed-in visitors from another church. Do not broaden the old switch implicitly. `docs/privacy.html` was updated in Spanish and English to describe this and the visible friendship count.
- **Grabber and moderation:** The shared `SheetGrabber` pill is now `60×12`. Admins can edit Spanish and English names of approved custom and built-in coros through `PUT /mod/choirs/:slug`; the slug, assignments, and repertoire stay stable. The moderation list has inline edit fields, save/cancel, and a success toast.
- **Verification:** `npx tsc --noEmit` passes; `npx expo lint` has 0 errors and 49 existing warnings; all 11 Node test suites pass, including new directory consent, count, block, and coro edit assertions. `npx expo export --platform ios` bundled 2,114 modules successfully. `git -c core.whitespace=cr-at-eol diff --check` passes. Live Worker health/guest access and bilingual privacy content passed; signed-in directory and physical iOS UI still need device verification.
- **Released in order:** D1 migration `0016`, Worker `1329687d-69be-44ea-acb1-e4b92ed01215`, Pages `d13b5c7d`, and iOS production OTA group `d8d19cab-07a9-4449-b6f8-efbe6eb5f919` (update `01a2082b-080e-72d5-8728-d484beeb7ca1`) on runtime `2.0.0-release-5`. Source commits `e505fcc` and `791683d` were pushed to both branches before publication. No native rebuild or Android update was published.

## November 23, 2026 — Hermanos church directories and legacy links

- The Worker repairs a missing church ID when the saved name matches exactly one approved, verified church. Unrelated profile saves preserve the ID. Ambiguous names go through the map selection flow.
- **Hermanos** now shows the linked church's directory and an empty state with a map action. The linked church card also opens the directory. Both views support paging and friendship status. An explicit directory opt-out hides the member even if already a friend.
- The shared sheet grabber measures `47×12`. The app uses iOS runtime `2.0.0-release-5`.
- Source commit `4ffa8f4`, Worker `8376daf2-d1cd-4991-823e-60ea2e3d6718`, and iOS production OTA `e27859f1-fcb2-4317-af1e-a8a1f43e064b`. See [EAS.md](../EAS.md) for release verification. On TestFlight Build #34, check a legacy Riverbank link, an opted-in friend, and an account that opted out. This signed-in device check is pending.

## November 23, 2026 (late night 4) — Admin Choir Removal UI (OTA `54f32fc2` on `2.0.0-release-5`)

### What changed (commit `5a58f5b`, iOS OTA `54f32fc2-2b66-4974-b86b-51732df0cd3c`)
- **Account → Coro (`CommunityProfile.tsx`):** Added an Admin-only destructive trash button on every custom approved choir row (separate sibling `Pressable` beside the selection row, confirmation `Alert`, calls `DELETE /mod/choirs/:slug`, refreshes `approvedChoirs` + clears/refreshes user profile if they had that choir selected, and shows the inline confirmation toast).
- **Moderation → Coros (`CommunityModeration.tsx`):** Added a dedicated **Coros publicados / Published choirs** list showing all approved choirs with a `"Base"` / `"Built-in"` badge on the 3 server-protected built-ins (`esmirna`, `maranatha`, `filadelfia`) and a destructive **Eliminar / Remove** button on custom choirs (plus toast feedback on the repertoire delete button).
- **Bilingual strings (`LanguageContext.tsx`):** Added `choirRemoveTitle`, `choirRemoveBody`, `choirRemoveAction`, `choirRemovedToast`, `choirPublishedListTitle`, and `choirBuiltinBadge` (`es` & `en`).

### Published live IDs
- **iOS OTA (`production`, runtime `2.0.0-release-5`):** Group `54f32fc2-2b66-4974-b86b-51732df0cd3c`, iOS update `01a207e5-4611-7908-9477-d98a9a7f4a4a`.

### Verification & not verified
- Verified: `tsc --noEmit` 0 errors, `npx expo lint` 0 errors / 49 warnings, all 11 Node test suites pass, `test-web-search.js` passes, `audit-secrets.py` clean.
- Not verified on physical hardware: test removing a custom choir from **Cuenta → Coro** and **Moderación → Coros** on TestFlight Build #34 after pulling OTA `54f32fc2`.

---

## November 23, 2026 (late night 3) — Native MapKit Driving ETA, `40×12` SheetGrabber & Pre-App-Store Audit (iOS Build #34 `d1f054c9`, `2.0.0-release-5`)

### What changed (commit `63c7307`, Pages `94eaed5a`, iOS Build #34 `d1f054c9-2609-46c8-8b90-c92ea369d04c`)
1. **Native Apple MapKit Driving Distance & Travel Time (`AppleLookAroundModule.swift`, `apple-look-around/index.ts`, `churchMapUtils.ts`, `churches.tsx`):**
   - Added `AsyncFunction("getDrivingEstimate")` in `AppleLookAroundModule.swift` using `MKDirections.calculateETA` (with fresh `MKDirections.calculate` fallback) returning road driving distance and traffic-aware ETA matching Apple Maps (`44 mi (71 km) · 56 min` with a car icon instead of straight-line `38 mi`).
   - Added ~200 m origin-grid caching in `churches.tsx` and graceful fallback to `~38 mi (61 km)` when offline or outside iOS.
2. **Standardized `40×12` `SheetGrabber` Pill (`himnario/components/SheetGrabber.tsx`):**
   - Set shared pill width from `33` → **`40`** (`40×12`, `borderRadius: 999`) across all bottom sheets.
3. **Dependency Audit & Fixes (`himnario/package.json`, `himnario/package-lock.json`):**
   - Caught and pinned missing direct dependency `expo-file-system` (imported as `expo-file-system/legacy` in 4 files, previously only working via accidental hoisting).
   - Updated SDK 54 patches (`expo@~54.0.37`, `expo-asset@~12.0.14`, `expo-constants@~18.0.14`, `expo-updates@~29.0.20`); verified all 3 `patch-package` patches apply cleanly.
4. **Pre-App-Store Compliance & Stability Fixes (`app.json`, `CommunityProfile.tsx`, `VerseDiscussionSheet.tsx`, `AuthSheet.tsx`, `hymnCommunity.ts`, `theme.js`, `churches.tsx`, `_layout.tsx`, `pushNotifications.ts`, `VerseCard.tsx`, `churchPhotoUpload.ts`, `ChoirRepertoire.tsx`, `MusicPlayer.tsx`, `hymn/[id].tsx`, `favorites.tsx`, `hymns.tsx`, `LanguageContext.tsx`, `docs/privacy.html`, `docs/terms.html`):**
   - Cleaned `ios.infoPlist` via plugin config to drop unused `NSMicrophoneUsageDescription`, `NSLocationAlways*`, and `NSFaceIDUsageDescription`; added explicit `ios.privacyManifests` (`NSPrivacyTracking: false`, `UserDefaults` `CA92.1`, `FileTimestamp` `C617.1`) and `CFBundleLocalizations: ["es", "en"]`.
   - Removed silent background `acceptUgcTerms()` in `hymnCommunity.ts`, added explicit inline & alert Guideline 1.2 UGC Community Rules gate in `VerseDiscussionSheet.tsx`, and added clickable Terms & Privacy links during registration in `AuthSheet.tsx`.
   - Replaced nested iOS `<Modal>` choir suggestion dialog in `CommunityProfile.tsx` with an inline expandable card (prevents UIKit Fabric freeze inside `AuthSheet` Modal); moved `VerseCard` full-screen → picker handoff to `onDismiss`.
   - Changed `darkTheme.outlineVariant` from `rgba(...)` to `#38383A` (fixing 25 invalid `+ '<hex>'` dark-mode colors), fixed dark-mode white-on-cream badge contrast, fixed broken `/(tabs)` notification route to `/(tabs)/home`, deduplicated cold-start notification taps, guarded QR `decodeURIComponent`, prevented GPS fix from re-fetching `/churches`, removed `"TestFlight"` user-facing fallback error string, fixed auth success banner cancellation, and aligned English labels.
   - Updated `docs/privacy.html` & `docs/terms.html` (ES & EN, administrator anonymous) for Choir suggestions/moderation and foreground MapKit driving estimates.

### Published live IDs
- **Pages (`ebp-himnario`):** Deploy `94eaed5a` (`https://94eaed5a.ebp-himnario.pages.dev` → `https://himnarioebp.com/`, verified `privacy.html` & `terms.html` live).
- **iOS Build #34 (`production`, runtime `2.0.0-release-5`):** EAS Build `d1f054c9-2609-46c8-8b90-c92ea369d04c` · Auto-Submission `ba24a1c2-cb7a-4d3c-8b96-e3c14a5f1f31` (finished & uploaded to App Store Connect).

### Verification & remaining manual checks
- Verified: `tsc --noEmit` 0 errors, `npx expo install --check` up to date, `npx expo lint` 0 errors / 49 warnings, all 11 Node test suites (191/191 passed), `test-web-search.js` (761 items), `audit-secrets.py` (0 findings across 3,339 files), `npx expo export --platform ios` (2,114 modules, 8.22 MB Hermes bundle, zero Apple fonts), `npx expo config --type introspect` (verified exact 3 `UsageDescription` keys & privacy manifest), EAS Build #34 compiled & submitted cleanly.
- Manual checks on TestFlight Build #34 before clicking Submit for App Store Review: verify driving distance + ETA on church cards (`44 mi (71 km) · 56 min`), `40×12` grabber pill across sheets, explicit UGC rules gate on a fresh/unaccepted test account, inline Suggest Choir card inside Account → Coro, Dark Mode card borders & badges, and supply a test member account in App Store Connect Review Notes.

---

## November 23, 2026 (late night 2) — `33×12` SheetGrabber Standard, Church Draft Guard, Coro Filadelfia & Choir Submissions/Moderation (OTA `dc4ca9aa`)

### What changed (commit `6d5e969`, D1 `0015_choirs.sql`, Worker `d0008031`, iOS OTA `dc4ca9aa-232d-465a-a7a6-890babd35f38`)
1. **Standardized `33×12` `SheetGrabber` Pill (`himnario/components/SheetGrabber.tsx`, `TextSizeSheet.tsx`):**
   - Set the shared floating pill across all bottom sheets to **`width: 33, height: 12, borderRadius: 999`**, `SHEET_GRABBER_CLEARANCE = 24`, and removed the leftover duplicate inner grabber from `TextSizeSheet.tsx`.
2. **Unsaved-Draft Confirmation on Church Add/Edit Sheet (`himnario/utils/churchDraft.ts`, `himnario/app/churches.tsx`):**
   - Added pure `hasUnsavedChurchDraft()` check (detects any non-default input on new church, or any field/photo change vs. initial snapshot when editing an existing church).
   - Intercepts `X`, backdrop tap, swipe-down, and back press with a native discard dialog (`¿Descartar borrador?` / `Discard draft?`), while allowing clean instant close when empty/unchanged or after successful submission.
3. **Coro Filadelfia + User Choir Submissions & Admin Moderation (`migrations/0015_choirs.sql`, `workers/ebp-auth-sync/community.js`, `communityRules.js`, `utils/choirsStore.ts`, `CommunityProfile.tsx`, `CommunityModeration.tsx`, `ChoirRepertoire.tsx`, `AuthSheet.tsx`, `FriendsPanel.tsx`, `VerseDiscussionSheet.tsx`):**
   - Added D1 `choirs` table seeded with **Coro Esmirna**, **Coro Maranatha**, and **Coro Filadelfia**, and relaxed the legacy 2-choir `CHECK` on `choir_repertoires` so Filadelfia and any approved custom choir support pinned repertoires.
   - Added Worker routes `GET /choirs`, `POST /choirs/submit` (pending for verified members, immediate approval for admin), `GET /mod/choirs`, `POST /mod/choirs/:slug/approve`, `POST /mod/choirs/:slug/reject`, and `DELETE /mod/choirs/:slug`.
   - Upgraded **Account → Coro** (`CommunityProfile.tsx`) with dynamic approved choirs, a **Suggest / Add Choir** bottom sheet using `33×12` `SheetGrabber`, inset-grouped `AnimatedField` inputs, unsaved-draft guard, and `ActionToast`.
   - Upgraded **Moderation → Coros** (`CommunityModeration.tsx`) with live pending count badge (`Coros (N)`), editable `AnimatedField` Spanish/English names + Approve/Reject actions, and `AnimatedField` repertoire inputs across all approved choirs.

### Published live IDs
- **D1 (`ebp-himnario-db`):** Migration `0015_choirs.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `d0008031-4669-4541-bd68-55f7e6ee3770` (`/health` = `200`, `/choirs` = `200` with Esmirna, Maranatha, Filadelfia).
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `dc4ca9aa-232d-465a-a7a6-890babd35f38`, iOS update `01a207a2-2cc6-7b50-b035-988586dc8596`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node suites pass (`test-verse-community.cjs` 35/35, `test-church-sheet.cjs` 24/24, `test-verse-discussion.cjs` 18/18), `test-web-search.js`, `audit-secrets.py` (0 findings across 3,341 files), live Worker `/health` and `/choirs` return 200.
- Not verified on physical hardware: test the `33×12` pill across sheets, Church draft-discard popup, Coro Filadelfia selection, Suggest Choir modal, and Moderation → Coros approval flow on TestFlight Build #33 after pulling OTA `dc4ca9aa`.

---

## November 23, 2026 (late night) — Bigger SheetGrabber, Church Form ActionToast & “Coritos” → “Estribillos” (OTA `8d7718d5`)

### What changed (commit `07de4a3`, Pages `3cc47454`, iOS OTA `8d7718d5-7db4-43c2-88db-b7fc0639bc6d`)
1. **Bigger, High-Contrast Floating Sheet Pill (`himnario/components/SheetGrabber.tsx`):**
   - Resized the shared pill across all bottom sheets from `46×5` (`rgba(255,255,255,0.78)`, clearance `16`) to **`64×7`, `borderRadius: 999`, `rgba(255,255,255,0.92)`** with subtle hairline edge + crisper drop shadow and `SHEET_GRABBER_CLEARANCE = 22`.
2. **Auto-Dismissing Toast & Status Polish in Church Form (`himnario/components/ActionToast.tsx`, `himnario/app/churches.tsx`, `himnario/context/LanguageContext.tsx`):**
   - Added reusable `ActionToast` (Reanimated `FadeInUp`/`FadeOutUp`, Liquid Glass pill, green icon badge, auto-dismisses after 2.6 s without blocking touches).
   - Fires on confirming a new pin on the map (`"Ubicación actualizada"` / `"Location updated"` with coordinate subtitle), pasting valid new coordinates/Maps links, adding photos via Camera, Gallery, or Cloud URL (`"Foto agregada"` / `"{count} fotos agregadas"`), and switching cover photo (`"Portada actualizada"`).
   - Added a persistent green `"Actualizada"` / `"Updated"` badge + soft green border tint on the Location card once changed, plus a green-tinted photo counter pill (`N/10`) and `"Subiendo…"` / `"Uploading…"` upload indicator in the Photos card.
3. **Renamed “Coritos” → “Estribillos” Everywhere (`LanguageContext.tsx`, `hymns.tsx`, `alabanzasPaginas.js`, `docs/`):**
   - Replaced all visible Spanish `"Coritos"` labels (Índice segmented tab, Índice title, search section headers, Home card subtitle, share copy, and `E73` tag `'Corito Clásico'` → `'Estribillo Clásico'`) across both mobile app and website (`docs/js/library.js`, `docs/index.html`, `docs/app/index.html`).
   - Regenerated `docs/data/hymns-data.js` and all 761 static hymn pages (`scripts/extract-hymns.js`, `scripts/generate-hymn-pages.js`).

### Published live IDs
- **Pages (`ebp-himnario`):** Deploy `3cc47454` (`https://3cc47454.ebp-himnario.pages.dev`).
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `8d7718d5-7db4-43c2-88db-b7fc0639bc6d`, iOS update `01a2078d-b263-7a2a-adf3-904d5004df73`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node suites pass, `test-web-search.js` (761 hymns/choruses), `audit-secrets.py` (0 findings across 3,338 files), `git grep` confirmed zero remaining user-facing `"corito"` strings in `himnario/` or `docs/`.
- Not verified on physical hardware: check the larger `SheetGrabber`, Church pin/photo `ActionToast` timing, and updated `"Estribillos"` labels on TestFlight Build #33 after pulling OTA `8d7718d5`.

---

## November 23, 2026 (night) — iOS Build #33 Finished + Animated Forms, Cleaner Auth/Church UI & 8-Char Passwords (OTA `6382c472`)

### Build #33 resolution
- iOS Build #32 (`448311eb-f325-4d93-a68c-1fce3c481f19`) errored at `Run fastlane` (0 EAS build credits used) because `--non-interactive` reused the pre-push provisioning profile `ZM5HK4A7JT` without `aps-environment`.
- Confirmed APNs Push Key via `eas credentials -p ios` and ran interactive `eas build --platform ios --profile production --auto-submit`, producing **iOS Production Build #33 (`1f834da7-0481-4481-b29a-8464a531f880`, runtime `2.0.0-notif-4`, status `finished`)** auto-submitted to App Store Connect / TestFlight.

### What changed (commit `614cb15` and iOS OTA `6382c472-bd5f-414b-a049-70da51aeadd6`)
1. **Reusable Animated Input (`himnario/components/AnimatedField.tsx`) + Password Strength Helper (`himnario/utils/passwordStrength.ts`):**
   - Floating label springs smoothly from centered placeholder to top-left label on focus/value, animating a burgundy focus ring (`theme.primary`), soft shadow, and `Haptics.selectionAsync()`.
   - Supports `grouped` mode (borderless row inside an iOS Contacts-style inset card with animated 3px left focus accent bar and hairline dividers) and `rightElement` forwarding.
2. **AuthSheet UI Overhaul (`himnario/components/AuthSheet.tsx`, `himnario/context/LanguageContext.tsx`):**
   - Cut word clutter: replaced 3 stacked paragraphs (removing the 4-line sync-replacement banner) with 1 concise subtitle and compact `"Opcional · Funciona sin conexión"` / `"Optional · Works offline"` footer.
   - Added Reanimated sliding pill on the Sign In / Create Account tabs, `AnimatedField` inputs with `Next` → `Done` keyboard chaining, gentle error shake on validation/auth failures, and a 3-segment visual password strength bar (*Débil / Buena / Fuerte* / *Weak / Good / Strong*) during registration.
3. **Church Add/Edit Form Redesign (`himnario/app/churches.tsx`):**
   - Removed the 3-line intro paragraph (eliminating the internal `"(R2)"` wording).
   - Slimmed the Location block into a compact single-row card (`✓ address` + crisp `"Cambiar"` / `"Mapa"` pill) with admin-only raw coordinates/Maps URL input tucked behind a collapsible toggle.
   - Replaced 5 stacked text boxes with a single 3-row iOS Contacts-style grouped address card (`Dirección`, `Ciudad | Estado / Prov.`, `País | Código postal`) using `AnimatedField` (`grouped` mode) and keyboard `Next` chaining, and upgraded optional fields to `AnimatedField`.
4. **Minimum Password Length Lowered `12` → `8` Characters Across Stack:**
   - Updated Worker (`workers/ebp-auth-sync/index.js`, `email-auth.js`), mobile app (`AuthContext.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`), web reset page (`docs/account.html`, `docs/js/account.js`), and tests (`test-mobile-auth.cjs`, `test-auth-security.cjs`, `test-church-sheet.cjs`). Max length remains `128`; existing accounts unaffected.

### Published live IDs
- **Worker (`ebp-himnario-sync`):** Version `c21e262a-d339-4407-a061-70dec6c94b51` (`/health` = `200`).
- **Pages (`ebp-himnario`):** Deploy `1b9a25e1` (`https://1b9a25e1.ebp-himnario.pages.dev`).
- **iOS Build #33 (`production`, runtime `2.0.0-notif-4`):** EAS Build `1f834da7-0481-4481-b29a-8464a531f880`.
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `6382c472-bd5f-414b-a049-70da51aeadd6`, iOS update `01a20775-be7c-746f-8f05-b017a25299b1`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node test suites pass (including new 8-char Worker registration test and `getPasswordStrength` test), `test-web-search.js` (761 hymns/choruses), `audit-secrets.py` (0 findings across 3,337 files), live Worker `/health` = 200.
- Not verified on physical hardware: inspect the new `AnimatedField` animations, sliding Auth tabs, password strength bar, and grouped Church address card in light & dark mode on TestFlight Build #33 after pulling OTA `6382c472`.

---

## November 23, 2026 (late evening) — 127 Daily Verses & Notifications Phase 1 + 2 (iOS Build #32, `2.0.0-notif-4`)

### What changed (commits `a948821` and `1751815`)
1. **Expanded Daily Verses (`himnario/data/dailyVerses.ts`):**
   - Expanded from 27 → **127 public-domain bilingual verses** (Reina-Valera 1909 + WEB/KJV) while keeping all 27 original `id` slugs intact.
   - Switched `getDailyVerse()` to `getLocalDayNumber()` (`Date.UTC(y, m, d) / 86_400_000 % length`) so verses step strictly +1 per day across month boundaries and leap years.
2. **Notifications Phase 1 (In-App Inbox) + Phase 2 (Native Expo Push):**
   - D1 migrations `0013_notifications.sql` (`notifications` table + unique dedupe index + 3 per-user toggle columns) and `0014_push_tokens.sql` (`push_tokens` table).
   - Worker (`community.js`, `index.js`): triggers on `comment_like`, `comment_reply`, `friend_request`, `friend_accepted`, and `shared_playlist`; self/block/preference guards; Expo Push Service (`https://exp.host/--/api/v2/push/send`) dispatch via `ctx.waitUntil()` with automatic `DeviceNotRegistered` token pruning; `POST /auth/logout` deletes device push token; block/hide/delete cleanup.
   - App: installed `expo-notifications` + `expo-device`, added plugin with cross-free Android icon (`android-monochrome-app-logo.png`), bumped `runtimeVersion` to `2.0.0-notif-4`, added `NotificationsPanel.tsx`, `utils/notifications.ts`, `utils/notificationsStore.ts`, `utils/pushNotifications.ts`, Account sheet row + unread badge, header avatar dot, and lock-screen push deep-linking in `app/_layout.tsx`.
   - Privacy: updated `docs/privacy.html` (Spanish & English, administrator anonymous).

### Published live IDs
- **D1 (`ebp-himnario-db`):** `0013_notifications.sql` & `0014_push_tokens.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `79656977-059a-4765-b3b3-33a2ecc87136`.
- **Pages (`ebp-himnario`):** Deploy `466a89e2` (`https://466a89e2.ebp-himnario.pages.dev`).
- **iOS Build #32 (`production`, runtime `2.0.0-notif-4`):** EAS Build `448311eb-f325-4d93-a68c-1fce3c481f19` · Auto-Submission `d3ef3366-a4b9-4201-bf5f-ec3b6e5c7984`.

### Verification & remaining manual checks
- Verified: `tsc --noEmit` clean, all Node suites pass (`test-verse-community.cjs` 34/34, `test-church-sheet.cjs` 21/21, `test-mobile-auth.cjs`, `test-mobile-auth-email.cjs`, `test-verse-discussion.cjs` 18/18), `test-web-search.js`, `audit-secrets.py` (0 findings across 3,335 files), live Worker smoke test (`200`/`401`).
- Manual check needed: confirm Build #32 succeeds on EAS (if provisioning profile `ZM5HK4A7JT` lacks `aps-environment`, run `eas credentials -p ios` interactively to add Push Notifications + APNs Push Key and re-run build), then test lock-screen delivery between two accounts on TestFlight.

---

## November 23, 2026 — Verse comment fixes, comment liking & Friends Phase 3 shared playlists (OTA `369019dc`)

Completed everything left in progress after Claude hit its limit, verified end-to-end, and deployed in strict order (D1 → Worker → Pages → iOS OTA).

### What changed (all live in commit `2aaa2fe` and iOS OTA `369019dc-4640-4979-a539-7295465e3e38`)
1. **Verse Card Commenting Fixes (`himnario/components/VerseDiscussionSheet.tsx`, `himnario/utils/communityApi.ts`):**
   - Separated `loadFailed` from send `error` so a failed post (e.g., `rate_limited`, `duplicate_comment`, `invalid_parent`) no longer flips an empty comment list into saying *"Comentarios disponibles con conexión"*.
   - Auto-recovers from `invalid_parent` (drops stale deleted parent while keeping text), `idempotency_conflict` / `invalid_request_id` (regenerates `requestId` so retry works), and missing `editId` (`not_found` drops edit mode and keeps text).
   - Replaced `new URLSearchParams()` in `load()` with plain query-string assembly and mapped `idempotency_conflict`, `not_found`, `not_friends`, and `invalid_playlist` in `communityError()`.
2. **Comment Liking (`migrations/0012_comment_likes.sql`, `workers/ebp-auth-sync/community.js`, `VerseDiscussionSheet.tsx`):**
   - Added `verse_comment_likes` table, `POST /verse-comments/:id/like`, per-comment `likesCount` / `likedByMe` on `GET /verses/:id/comments`, and updated `sort=top` ("Destacados") to rank by `likes + replies`.
   - Added optimistic heart toggle + count beside Reply on every comment and reply (with rollback on error and account-deletion cleanup).
3. **Friends ("Hermanos") Phase 3 — Shared Playlists (`migrations/0011_shared_playlists.sql`, `community.js`, `utils/friends.ts`, `utils/friendsStore.ts`, `FriendsPanel.tsx`, `CommunityProfile.tsx`, `HomeHeaderActions.tsx`, `PlaylistsContext.tsx`, `app/playlist/[id].tsx`):**
   - Added `shared_playlists` table and routes `POST /friends/:userId/playlists`, `GET /playlists/shared`, `POST /playlists/shared/:id/seen`, and `DELETE /playlists/shared/:id` (rate-limited, accepted friends only, cleaned up on block and account deletion).
   - Added **"Compartir con un hermano" / "Share with a Friend"** picker modal inside `app/playlist/[id].tsx`, **"Listas compartidas" / "Shared Playlists"** inbox inside `FriendsPanel.tsx` with **"Guardar en mis listas" / "Save to My Playlists"** (`importPlaylist()`), combined badge count (`incoming + unseen shared playlists`) on `CommunityProfile` + subtle header avatar dot with foreground refresh.
4. **Bilingual Privacy & Terms (`docs/privacy.html`, `docs/terms.html`):**
   - Documented comment likes and shared playlists in both Spanish and English while keeping the administrator anonymous.

### Published live IDs
- **D1 (`ebp-himnario-db`):** `0011_shared_playlists.sql` and `0012_comment_likes.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `5c474ce7-4a59-40cf-a72f-cbb11a0428c7`.
- **Pages (`ebp-himnario`):** Deploy `a6f62e3a` (`https://a6f62e3a.ebp-himnario.pages.dev`).
- **iOS OTA (`production`, runtime `2.0.0-media-3`):** Group `369019dc-4640-4979-a539-7295465e3e38`, iOS update `01a206e7-8cd7-7146-affc-1d2255b46af5`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all Node test suites pass (`test-verse-community.cjs` 33/33, `test-verse-discussion.cjs` 18/18, `test-church-sheet.cjs` 19/19, plus playback/auth/sharing/search), `audit-secrets.py` 0 findings, live Worker smoke checks (`200`/`200`/`401`).
- Not verified on physical hardware: UI layout and two-account friend playlist sharing / comment liking should be checked on the owner's iPhone after pulling OTA `369019dc`.

---

## November 22, 2026 (evening) — Handoff for Claude, Codex & Antigravity (iOS Build 31, OTA `d351bb27`)

This entry is the current state. The entry below it describes the morning of the same day (Build 30) and is kept for its rules and commands.

### What changed (all live in OTA `d351bb27` and iOS Build 31)
1. **Cleanup (`3c314f5`):** deleted unreferenced components (`HomeMenuSheet`, `BottomNavBar`, `HymnListItem`, `IosStreamingNotice`, `audio/android-player.ts`) and Expo template leftovers; removed `shaka-player` and `@gorhom/bottom-sheet`; added `.github/workflows/ci.yml`.
2. **String table (`6c46ea0`):** 337 inline `es ? '…' : '…'` pairs moved into `context/LanguageContext.tsx`. Keys were generated from the English text with a per-screen prefix (`churchCameraPermission`); a few are clumsy and can be renamed. A few dozen strings with interpolated values are still inline.
3. **Churches screen (`c53253f`, `20b1a01`, `b47d491`):** `app/churches.tsx` is a full-screen map with two rows of Liquid Glass controls and one bottom sheet (`components/DetentSheet.tsx`) that is hidden at rest. It rises when the search field is focused, "Lista" is chosen or a pin is tapped. The church card shows service times as one row per day (`utils/churchSchedule.ts`), with today highlighted. The QR share modal was removed; QR scanning stays.
4. **Church wording (`3b12817`, `b47d491`):** names are shown without "IDDV El Buen Pastor" and leaders as `SDD <name>` (`utils/churchName.ts`). "Vincular mi iglesia" became "Esta es mi iglesia", and the green "Tu iglesia" button now offers to remove the link.
5. **Church form (`8e003aa`, `082e5e8`):** name and location first; the pin fills in the address; pastor, service times, contact and photos sit behind "Más detalles (opcional)"; service times use `components/ChurchScheduleEditor.tsx`; the coordinates box is admin-only; the keyboard dismisses on drag.
6. **Account sheet (`c53253f`, `082e5e8`):** one "Mi iglesia" row. Opening the map or scanner from the sheet while already on the map no longer stacks a second map, and cancelling a scan opened from Account goes back.
7. **Sheets (`c53253f`):** `components/SheetGrabber.tsx` floats above every bottom sheet.
8. **Typography (`8e003aa`):** native system fonts through `theme/fonts.ts`; 364 `fontFamily` references now spread a token.
9. **Look Around (`8e003aa`, native):** presented directly and requested by map item. Only in Build 31.

### Not verified
- No simulator or device run by the agent. The owner checked on a phone and reported the keyboard and scanner bugs, which were then fixed; the fixes themselves were not re-confirmed.
- Whether Look Around now opens scrollable and facing the building on Build 31.
- Android: nothing here has run on Android (it is on an older runtime).

### Deferred
- **Expo SDK 54 → 58 for Xcode 27** (Apple ITMS-90725, deadline April 2027): see [SDK-58-UPGRADE-PLAN.md](SDK-58-UPGRADE-PLAN.md).

---

## November 22, 2026 — Comprehensive Handoff for Claude & Codex (`2.0.0`, `runtimeVersion: "2.0.0-media-3"`, iOS Build 30 Live on TestFlight)

All November 20–22 changes have been verified, deployed to Cloudflare (D1 + Worker + R2 + Pages), and compiled into **iOS Production Build #30** (`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`, auto-submitted via `8a54ce14-8c49-4b9f-a352-20a9306cc064`).

### Non-Negotiable Product, Doctrinal & Operational Rules
1. **ZERO Crosses (Doctrinal Rule):** IDDV El Buen Pastor **never** uses crosses on church map pins, icons, logos, or branding. Keep all sanctuary artwork (`church-pin*.png`, `church-pin-selected*.png`) strictly cross-free.
2. **Administrator Anonymity in Public Policies:** Do **not** place the administrator's personal name in `docs/privacy.html`, `docs/terms.html`, or user-facing policy/moderation labels (use `"El administrador designado de Himnario El Buen Pastor"` / `"The designated administrator of Himnario El Buen Pastor"`). Note: `isaacduran167@gmail.com` is still the internal sole-admin check in `workers/ebp-auth-sync/community.js` (`ADMIN_EMAIL`) and contact link in `docs/privacy.html`/`docs/terms.html`/`docs/feedback.html`; if the user sets up a forwarding address like `soporte@himnarioebp.com` via Cloudflare Email Routing, only swap the public contact links (keep `ADMIN_EMAIL` unless migrating the admin login account).
3. **Church Photo Caps:** Maximum **5 photos** for regular user church requests; maximum **10 photos** for Admin. Enforced both in UI (`churches.tsx`, `CommunityModeration.tsx`) and Worker (`parseChurchInput` in `workers/ebp-auth-sync/community.js`).
4. **Windows `[03]` Brackets & Wrangler CLI Quirk:**
   - Always use PowerShell `-LiteralPath` when navigating paths with `[03]`.
   - Always set `$env:WRANGLER_CACHE_DIR = "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\.wrangler-cache"` before running `npx wrangler ...`.
   - Do **NOT** load `.env.cloudflare` when running Wrangler CLI (it contains an outdated account/token returning `code: 7403`); Wrangler's default logged-in OAuth session works cleanly for D1, R2, Worker, and Pages.
   - Apply new D1 SQL migrations remotely via `npx wrangler d1 execute ebp-himnario-db --remote --file "migrations/000X_....sql"` (do not use `d1 migrations apply` because `0004`–`0008` were executed directly).
5. **EAS CLI on Windows:** Always set `$env:EAS_NO_VCS = '1'; $env:EAS_PROJECT_ROOT = (Get-Location).Path` from `himnario/`. Never run a separate `eas submit` after `--auto-submit` (causes Apple `ITMS-90189`).
6. **iOS `ScreenOrientation` Rule:** Never call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS (`ProjectorModal.tsx` uses pure `90deg` view transform on iOS).

### Summary of Everything Implemented & Shipped (November 22, 2026)
1. **Audio End-of-Track Freeze Deadlock + 24 App-Wide Stability Fixes + Sync Conflict Resolution:**
   - Fixed circular Promise deadlock in `himnario/audio/android-playback-controller.ts` (`ended()` calling `advance(1)` → `startTrackLoad()` → nested `command()`), fixed replay at collection end (`reachedTrackEnd`), fixed iOS cache-eviction fallback in `offline-audio.ts`, fixed `CommunityModeration.tsx` React Hooks order, fixed `_layout.tsx` splash freeze race, fixed `.onFinalize` close-button race across all 8 modal sheets, added hydration guards across `FavoritesContext`/`PlaylistsContext`/`RecentHymnsContext`/`LanguageContext`, fixed `hymnCommunity.ts` `inFlightOpRef` deadlock, fixed `ProjectorModal.tsx` horizontal swipe & tap zones, and added `resolveSyncConflict('local' | 'cloud')` in `AuthContext.tsx` + bilingual Alert in `AuthSheet.tsx`.
2. **Verified Churches Map, Seeded Riverbank Church & Custom Cross-Free Sanctuary Pins (`churches.tsx`, `utils/churchMapUtils.ts`):**
   - Seeded `church-riverbank-ca` (`IDDV El Buen Pastor — Riverbank`, `Co-Pastor Azael Tapia`, `3109 Santa Fe St, Riverbank, CA 95367`, `37.736108061398205, -120.93872212946533`, Tuesday/Thursday/Friday Jóvenes/Sunday schedule, 2 optimized R2 photos `riverbank-ca-1.jpg` and `riverbank-ca-2.jpg`) via `migrations/0008_church_gallery_and_link.sql`.
   - Generated transparent `@1x / @2x / @3x` cross-free ivory & burgundy sanctuary pins (`assets/images/church-pin*.png`, `church-pin-selected*.png`) + viewport clustering & Maps URL/coordinate parser (`churchMapUtils.ts`).
3. **True Native In-App Apple Maps Look Around (iOS 16+) + Android Google Street View (`modules/apple-look-around/`):**
   - Built custom local Expo Swift module (`AppleLookAroundModule.swift`, `AppleLookAround.podspec`, `expo-module.config.json`, `package.json`, `index.ts`) autolinked via `himnario/package.json` `expo.autolinking.searchPaths`. Presents full-screen native `MKLookAroundViewController` with translucent `Listo / Done` pill and frosted bottom address bar, falling back to Google Street View (`google.streetview:cbll=...` on Android / web pano URL).
4. **Multi-Photo Camera & Gallery Uploader + Admin Photo Manager (`utils/churchPhotoUpload.ts`, `churches.tsx`, `CommunityModeration.tsx`, `workers/ebp-auth-sync/community.js`):**
   - Users pick from Camera or Photo Library (resized ≤1400px JPEG, EXIF stripped) and upload to `POST /churches/photos/upload` (magic-byte verified for JPEG/PNG/WebP, stored in R2 `env.MEDIA_BUCKET` under `church-photos/uploads/<uuid>.<ext>`).
   - Pending submissions stay quarantined from `GET /churches` until admin approves. Admin can reorder cover (`★ Portada`), delete individual photos (`✕`), or add new photos anytime; removed/rejected R2 upload keys are automatically deleted from R2.
   - Selected church card renders a swipeable horizontal photo carousel with pagination dots + tap-to-view fullscreen gallery modal.
5. **In-App QR Code Scanner & Church QR Sharing (`churches.tsx`, `AuthSheet.tsx`):**
   - `expo-camera` `CameraView` scans hymn (`/hymn/:id`) and church (`/churches?id=:id`) QR codes from the Churches top bar or Account menu ("Escanear código QR"). Verified church cards include a **"Código QR"** share modal.
6. **Unified "Mi iglesia" & "Iglesias (Mapa)" + Cloud Profile Sync (`users.church_id`):**
   - `AuthUser.churchId` synced via `PUT /auth/profile` and `GET /users/:id/public-profile` (gated by `showChurchLocation`).
   - Placed `Mi iglesia` and `Iglesias (Mapa)` together inside `COMUNIDAD` in `CommunityProfile.tsx`, with a 1-tap **"Elegir mi iglesia en el mapa"** banner inside `Mi iglesia` and **"✓ Tu iglesia"** green verified state on linked church cards.
7. **YouTube Music-Style Comments Sheet (`VerseDiscussionSheet.tsx` + `GET /verses/:id/comments?sort=top|newest`):**
   - Full-sheet swipe-down from anywhere inside the comments `ScrollView` when `scrollOffset <= 4` via `Gesture.Simultaneous(bodyPan, Gesture.Native())`.
   - Top-right `(i)` info button next to `✕`, `Destacados (Top)` vs `Más recientes (Newest)` sort pills, respectful church Community Guidelines banner linking to `https://himnarioebp.com/terms.html#community`, and centered YouTube Music-style empty state.
8. **Repository Cleanup (Nov 22):**
   - Deleted ~15+ MB of unused/duplicate local PNGs, raw cover/background folders already hosted on R2 (`front cover on app hymn options/`, `verse background/`), unused images (`black-ios-logo.png`, `tinted-ios-logo.png`, `imessage.svg`, `theme-mode.svg`), legacy `vercel.json`, `verify_hymns.py`, `translations.json`, and `scratch/` caches.

### Verification Commands (All Passing as of Nov 22, 2026)
```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
npx --prefix himnario tsc -p himnario/tsconfig.json --noEmit
Get-ChildItem -LiteralPath "scripts" -Filter "test-*.cjs" | ForEach-Object { node --test ("scripts/" + $_.Name) }
node scripts/test-web-search.js
```
*(10 test suites / 143 tests pass; TypeScript passes with 0 errors.)*

### Next Steps for Claude / Codex
1. **Physical Device Verification on iOS Build #30 (TestFlight):**
   - Verify Riverbank church pin, 2-photo carousel + fullscreen tap, **Apple Maps Look Around** (`MKLookAroundViewController`), Camera/Gallery photo upload, QR Scanner + Church QR Share, **"Vincular mi iglesia" → "✓ Tu iglesia"** sync, and YouTube Music comments swipe-down from body + `Destacados`/`Más recientes` sorting.
2. **Android Native Rebuild (`2.0.0-media-3`):**
   - Current Android preview APK is still on `2.0.0-securestore-1`. Run `eas build --platform android --profile preview-arm64` (or `production` for Play Store `.aab`) when ready to ship Maps, Camera, Photo Picker, and QR Scanner to Android.
3. **Optional Anonymous Support Email:**
   - If the user configures Cloudflare Email Routing (e.g. `soporte@himnarioebp.com` → private Gmail), replace public `mailto:isaacduran167@gmail.com` links in `docs/privacy.html`, `docs/terms.html`, and `docs/feedback.html` and redeploy Cloudflare Pages.

---

Older entries: [APP-EDITING-HISTORY.md](APP-EDITING-HISTORY.md).
