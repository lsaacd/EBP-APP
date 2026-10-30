# Handoff for Antigravity (Argon): bring the website's new features to the iOS and Android app

Written October 30, 2026 for Isaac Durán. Read all of it before changing anything. Items marked **[Isaac to review]** are proposals; ask Isaac before building them.

Also read: `ARCHITECTURE.md`, `docs/guides/APP-EDITING-ANALYSIS.md`, `docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md`, `docs/guides/ANDROID-PLAYBACK-FIX.md`, `docs/README.md`.

---

## 0. Before you touch anything: save a restore point in Git

The iOS app is live in the App Store and the Android app is in Google Play review. Everything below must be reversible.

From the repository root, in PowerShell (always use `-LiteralPath`; the path has square brackets):

```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
git status --short
```

1. If there are uncommitted changes you did not make, do not discard them. Commit them as they are, on `main`, with a message saying they are pre-existing work (`git add -A` is fine only after checking that no `credentials.json`, `token.json`, service-account keys, `.env` files or logs are included).
2. Create a tag and push it with `main`:
   ```powershell
   git tag -a pre-app-parity-2026-10-30 -m "Restore point before app/web parity work"
   git push origin main --tags
   ```
3. Do all of this work on a new branch, never directly on `main`:
   ```powershell
   git switch -c app-web-parity
   ```
4. Commit after each workstream (A, B, C…), with a clear message, so any single piece can be reverted.
5. Commit as Isaac, not a placeholder identity. Check `git config user.name` / `user.email`; they should be `Isaac Durán` / `isaacduran167@gmail.com`.

**How to go back if something breaks:** `git switch main` (untouched), or `git revert <commit>` for one piece, or compare with `git diff pre-app-parity-2026-10-30`.

---

## 1. Ground rules for this project

- **Do not publish anything without Isaac's explicit OK**: no `eas update`, `eas build`, `eas submit`, website deploy, or store change.
- **Updates must name the platform.** iOS and Android both listen on the `production` EAS Update channel. Use `--platform android` or `--platform ios`, and send to the `preview` branch first. Never run a bare `eas update --branch production`.
- **Over-the-air vs. new build.** JavaScript, styles and images can go out as EAS Updates. Anything that adds a native library, changes `app.json` permissions/entitlements/plugins/orientation, or changes Kotlin/Swift needs a new store build *and* a version bump (runtime policy is `appVersion`, currently `1.0.0`). Section 10 lists which items are which.
- **Keep what already works:** the Android notification fix (`patches/react-native-track-player+4.1.2.patch`, `audio/android-player.ts`, `audio/android-playback-controller.ts`, `service.js`), AsyncStorage keys (favorites, playlists `{id,name,hymnIds,createdAt}`, recent hymns, `isDarkMode`, `fontSizeMultiplier`, language), string IDs including the `E` prefix and `'315 A'`, the iOS `NativeTabs` vs Android floating pill navigation split, and detail routes outside `(tabs)`.
- **Design language ("Sacred Ink"):** Newsreader for titles and lyrics, Public Sans for UI; parchment `#FCF9F2`, ink `#24251F`, burgundy `#6E1619`; dark mode is true black `#010101` with `#1C1C1C` / `#373737` surfaces and cream `#FDF9F2` text. Spanish UI says "Himnario" and "alabanzas". Every new string goes in `context/LanguageContext.tsx` in both Spanish and English.
- **Checks before every commit**, from `himnario/`: `npx tsc --noEmit`, `npm run lint` (separate new problems from existing warnings), and from the repo root `node --test scripts/test-android-playback.cjs`. Add tests for new non-UI logic in the same style.
- **Never claim something works on a phone unless it was tested on one.** Write down what was tested and on what.

---

## 2. Design direction: make it feel native on each platform

Isaac wants the app to look more appealing on **iOS** and to have a **matching but Android-native** version. Same content and features; each platform's own look and feel.

**iOS**
- Use translucent "glass" surfaces for floating UI: the mini player, the reader control pill, the A–Z scroller, sheets and the projector toolbar. On iOS 26+, use Apple's Liquid Glass through `expo-glass-effect` (`GlassView`; check `isLiquidGlassAvailable()`; verify the exact API for Expo SDK 54 in Expo's docs). Fall back to `expo-blur` `BlurView` on older iOS. `expo-glass-effect` is a new native module, so it needs a new iOS build.
- Native-feeling details: large titles, SF Symbols (`expo-symbols` is installed), `Haptics.selectionAsync()` ticks on pickers and the scroller, spring animations (Reanimated 4), sheets with a grabber that respect the safe areas.

**Android**
- Material 3 look: tonal surfaces instead of heavy blur (blur on Android is costly and inconsistent), rounded 16–28 dp cards, ripple feedback (`android_ripple`), Material icons (already used), bottom sheets from `@gorhom/bottom-sheet` (installed), and edge-to-edge (already enabled).
- Same layout, colors and wording as iOS, so the two apps are recognizably the same product.

Write shared logic once and keep platform differences to presentation, using `.ios.tsx` / `.android.tsx` files or `Platform.select`, as the project already does (`OfflineAudioCard.android.tsx`).

---

## 3. Workstream A: iOS audio from Cloudflare, with downloads (same as Android)

**Goal:** iOS stops bundling ~1.3 GB of recordings, streams them from Cloudflare like Android, saves each one the first time it's played, and offers "Download all".

**How Android does it today**
- `data/audioRegistry.android.ts`: list of the 655 recording IDs, plus `getHymnAudio(id)` returning `https://audio.himnarioebp.com/hymn_{id}.m4a`. One exception: `'315 A'` → `hymn_315.m4a`.
- `audio/offline-audio.ts`: plays the saved copy if present, otherwise streams and saves in the background (`.part` file renamed when complete); download all (3 at a time, resumable, cancel), delete all, progress store. Tests in `scripts/test-android-playback.cjs`.
- `components/OfflineAudioCard.android.tsx`: the Settings section (`OfflineAudioCard.tsx` renders nothing on other platforms).
- iOS still uses `data/audioRegistry.ts` (655 `require()` calls), and the old provider in `context/NowPlayingContext.tsx` (`LegacyNowPlayingProvider`) loads them through `expo-asset`.

**Steps**
1. Make the streaming registry shared: rename `audioRegistry.android.ts` to `audioRegistry.native.ts` (Metro picks `.native` for both iOS and Android), and keep the `FILE_NAME_EXCEPTIONS` map. Decide what `audioRegistry.ts` (web) should do; streaming there too is fine. Then no file `require()`s `assets/audio/*`, and the audio drops out of both app binaries.
2. Move iOS playback onto the shared, tested player: generalize `audio/android-player.ts` into a cross-platform `audio/native-player.ts`, with `service.js` registering the same handlers on both platforms. Then remove `LegacyNowPlayingProvider` once iOS is verified. If you keep the legacy provider instead, at minimum replace its `expo-asset` loading with `resolvePlaybackUri()` from `audio/offline-audio.ts`.
   - Verify on an iPhone: Control Center and lock-screen play/pause/next/previous/seek, artwork and title, interruptions (a phone call or Siri should pause; it must not resume if the user had paused), background playback (`UIBackgroundModes: audio` is already set), and auto-advance while locked.
3. **iOS storage rule (important for App Store review):** Apple's iOS Data Storage Guidelines say re-downloadable content must not be backed up to iCloud from the Documents folder. `offline-audio.ts` currently saves to `documentDirectory`. For iOS, store downloads somewhere excluded from backup. Check whether Expo SDK 54's `expo-file-system` can set "exclude from backup"; otherwise use `cacheDirectory` and handle the OS clearing it (the app simply streams again, and "Download all" shows the new count). Read Apple's current guideline before deciding.
4. **Existing iPhone users:** after updating, their audio will no longer be inside the app. Show a one-time, dismissible notice ("Las grabaciones ahora se descargan de internet. Puedes guardarlas todas para escuchar sin conexión."), with a button that opens the download option, and a "check your connection" message when a hymn can't play offline.
5. When neither platform bundles audio, make the `.easignore` audio exclusion permanent and remove the temporary exclusion from `build-android-test.ps1` / `build-android-production.ps1`. Keep the `assets/audio` files in the repo (the source for Cloudflare uploads) unless Isaac decides otherwise.
6. Update `docs/privacy.html` section 5 (Spanish and English). It currently says iOS recordings are included in the app.
7. Delivery: ship this as a **new App Store build** (it removes audio from the binary and should be tested through TestFlight), not as an over-the-air update.

---

## 4. Workstream B: redesign the download (offline audio) section, iOS and Android

Isaac doesn't like how the current Settings card looks on either platform. Redesign it; keep the behavior and the strings' meaning.

What it must show and do:
- How many recordings are saved (`X de 655`), space used, and roughly how much a full download needs (~1.3 GB).
- States: nothing saved · some saved by playing · downloading (live progress and count, Cancel) · paused/incomplete (Continue) · complete (clear "all saved" state) · some failed (Retry failed).
- "Borrar descargas" as a quieter, destructive secondary action with confirmation.
- Recommend Wi-Fi before a large download. A real "Wi-Fi only" switch needs a network-status library (new native module, so a new build). **[Isaac to review]**

Design ideas:
- **iOS:** an inset grouped card with a circular progress ring around a download glyph, a large count, a thin secondary line with size, and a single prominent button. A glass card when used outside Settings.
- **Android:** a Material 3 card with a linear progress indicator, tonal primary button and text button for delete.
- Optional: a small "saved" indicator next to hymns in the list and in the player. **[Isaac to review]**
- Optional: also reach this screen from the player when offline playback fails.

---

## 5. Workstream C: reader text-size control like the website's "Texto" popover

**Website:** a non-modal popover with a live Newsreader preview, a slider, one-pixel − / + buttons, typing the number directly (12–64 px), Reset (26 px), saved per device, and closing on outside tap or Escape.

**App today:** the reader's control pill (`app/hymn/[id].tsx`, around line 455) cycles through four presets (0.85 / 1.0 / 1.15 / 1.3 × 22 px). Settings has a multiplier slider (0.8–2.0).

**Build:**
- Tapping "Tamaño" opens a small sheet or popover with a live preview line, a slider, − / + steps, the current size, and Reset, saved instantly.
- Keep storing `fontSizeMultiplier` (lyrics px = 22 × multiplier) so existing users keep their setting. Decide with Isaac whether to widen the 0.8–2.0 range.
- iOS: glass popover/sheet with haptic ticks. Android: Material bottom sheet.
- Optional: pinch to zoom the lyrics. **[Isaac to review]**

---

## 6. Workstream D: projector / presentation mode in the app

Website reference: `docs/js/projection.js`, `docs/css/projection.css` (latest commit `778bc52`).

Features to bring over:
- Opens from the reader for the current hymn; shows one verse at a time with "Himno N · Title" and the verse label (Estrofa N / Coro).
- Verse chips (1–9 and C), swipe left/right, and on phones the tap zones (left third = previous, right third = next, center = show controls).
- Auto text size that always fits the whole verse on screen, plus a manual size.
- Hide lyrics (blank screen), projector light/dark theme, hide controls (lyrics only), footer branding "Himnario El Buen Pastor · himnarioebp.com", and a page-turn animation that respects Reduce Motion.

App-specific needs:
- Keep the screen awake while presenting (`expo-keep-awake` is present through Expo; add it to `package.json`).
- Hide the status bar; on Android also hide the navigation bar (needs a new native module such as `expo-navigation-bar`).
- The app is locked to portrait (`app.json`). Landscape inside the projector needs `expo-screen-orientation` (new native module, new build). **[Isaac to review]**
- Connecting to a TV works through the phone's own mirroring (AirPlay on iPhone, screen cast on Android); no extra code is needed for mirroring.

---

## 7. Workstream E: sharing features

**Website** (`docs/js/sharing.js`, `docs/js/pdf-export.js`): WhatsApp, Facebook (public link), copy link (the link shows a preview card with the cover and opens the app on iPhone), copy lyrics, download TXT, the device's share menu, and a one-page PDF with preview, text size, one or two columns, and automatic shrink to fit.

**App today:** the reader uses `Share.share` with title + lyrics + `https://himnarioebp.com/hymn/{id}/`; `MusicPlayer.tsx` has its own share modal (copy and more).

**Build one shared share sheet** used by the reader, the full player and the mini player:
- WhatsApp (use `https://wa.me/?text=` so no URL-scheme permission is needed), copy link, copy lyrics, the system share menu, and the PDF.
- PDF and TXT files need `expo-print` and `expo-sharing` (new native modules, so a new build). **[Isaac to review]**
- iOS: glass sheet. Android: Material bottom sheet.

**Links opening the app:**
- `docs/.well-known/apple-app-site-association` uses `"appID": "com.elbuenpastor"` without the Apple Team ID prefix, so iOS universal links won't work. It must be `TEAMID.com.elbuenpastor`; get the Team ID from Isaac or the Apple developer account. It's generated by `scripts/generate-hymn-pages.js`, so fix it there.
- `associatedDomains` in `app.json` only take effect in a new iOS build.
- Android App Links need `intentFilters` in `app.json` plus `docs/.well-known/assetlinks.json` with the **Play App Signing** certificate fingerprint (new build).
- Test cold and warm opening of `/hymn/1/` and `/hymn/E124/`.

---

## 8. Workstream F: iOS-style glass A–Z scroller in the hymn list

`app/(tabs)/hymns.tsx` already groups by letter and has letter jump indices (around lines 225–265). Make the fast scroller feel native:
- **iOS:** a slim floating glass capsule on the right edge; while dragging, a larger glass bubble shows the current letter, with `Haptics.selectionAsync()` on each letter change (like Contacts). Hide it when search is active.
- **Android:** a Material fast-scroll thumb with a letter bubble on a tonal surface.
- Keep FlashList performance and the separate Himnos / Estribillos sections. It must work with VoiceOver/TalkBack (adjustable role, letter announced).

---

## 9. Workstream G: home page refresh (keep every key feature)

Keep: the hero "Explora todos los himnos" card, Verse of the day (`components/VerseCard.tsx`, with share), the Temario / Doctrine card, and Recent hymns.

Ideas **[Isaac to review]**:
- A quick search field at the top that opens Himnos with the keyboard ready.
- A "Continuar escuchando" card for the last played hymn.
- The church motto block ("Verdad, honestidad, justicia, santidad y caridad · LEMA DE NUESTRA IGLESIA") with "Ver más" to the identity content (as on the website).
- A small offline-audio status card ("312 de 655 guardados"), linking to the download section.
- Shortcuts to Favorites and Lists.
- iOS: large title, glass hero, gentle parallax. Android: Material cards and a tonal hero.

---

## 10. Other website features that could come to the app **[Isaac to review]**

| Website feature | In the app today? | Proposal |
| --- | --- | --- |
| Smart search: accents/case ignored, small typos and swapped letters tolerated, "himno 001", "E124", "estribillo 124", search in title / lyrics / number, highlighted matches, lyric excerpts | Basic search | Port `docs/js/search-engine.js` logic to a shared TS module with tests (`scripts/test-web-search.js` shows expected results) |
| Alphabetical index with dotted leaders and a letter rail, Himnos and Estribillos separately | A–Z grouping in the list | Optional "Índice" view |
| Category strip per collection plus a "with audio" filter | Category chips | Add the audio filter |
| Playlists: rename, reorder, remove items, delete with confirmation, play in order | Playlists exist; reorder is on the roadmap | Add rename and drag-to-reorder (a reorder library is a new native dependency) |
| Two feedback forms (hymns and audio with hymn context; website and projector) | Feedback by email | Open the matching Google Form in the in-app browser (`expo-web-browser` is installed), showing the hymn number and title |
| Report a problem from the reader (flag button) | No | Add to the reader with hymn context |
| Church identity page (Nombre, Lema, Fundamento, Finalidad) | Doctrine card | Optional dedicated screen |
| Keyboard shortcuts | — | Not needed on phones |

---

## 11. Over-the-air vs. new build

| Change | Ships as |
| --- | --- |
| iOS streaming + downloads (A) | New iOS build (removes audio from the binary; test in TestFlight) |
| Download section redesign (B) | Update, unless it uses `expo-glass-effect` or a network-status library |
| Text-size popover (C) | Update (glass on iOS needs a build) |
| Projector (D) | Update for the basics; landscape, Android navigation-bar hiding and glass need a build |
| Sharing (E) | Update for WhatsApp/copy/system share; PDF/TXT files and app-link setup need a build |
| Glass scroller (F) | Build if it uses `expo-glass-effect`; otherwise update with `expo-blur` |
| Home refresh (G) | Update |

Group native changes into **one** new build per platform, with one version bump (for example 1.1.0). Remember `appVersion` runtime: an update made for 1.1.0 does not reach 1.0.0 apps.

**Timing:** Android 1.0.0 is in Google Play review and then needs a 14-day closed test. Don't send updates to Android `production` during that test unless they fix a real problem. iOS 1.0.0 is live; its next build should include workstream A.

---

## 12. Test checklist

- **Both:** reading, page turns, light/dark, text size, favorites and playlists survive an app restart, search, sharing, the projector, and deep links.
- **Audio, both:** stream a new hymn; replay it with Wi-Fi and data off; play an unsaved hymn offline (clear message); Download all → Cancel → Continue → complete; Delete downloads; notification/lock-screen controls; auto-advance while locked; playlists skipping hymns without recordings; hymns `315 A` and `315 B`.
- **iOS:** Control Center, AirPlay mirroring of the projector, VoiceOver on new controls, glass fallback on iOS < 26, and iCloud backup size not growing after Download all.
- **Android:** notification controls (must not regress), TalkBack, back gesture and back button in the projector, and a small phone (~360 dp wide).
- Use Expo dev/preview builds or TestFlight. Expo Go cannot test the audio engine.

---

## 13. When you finish

Report to Isaac:
- What was built, with commit hashes.
- What was tested and on which devices.
- What needs a new store build.
- Open decisions marked **[Isaac to review]**.

Leave `main` untouched until Isaac approves merging `app-web-parity`. Update `docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md`, `ARCHITECTURE.md` and the privacy policy where they become outdated.
