# ARCHITECTURE & DEVELOPER ONBOARDING GUIDE — HIMNARIO EL BUEN PASTOR (EBP APP)

> **Purpose of this document:**  
> This file is the primary orientation document for any AI coding assistant or new developer opening this repository on a new machine. It provides a complete map of the architecture, data structures, deployment channels, critical gotchas, and workflows.

---

## 1. Project Overview & Identity

* **App Name:** Himnario El Buen Pastor (EBP APP)
* **Author / Developer:** Isaac Durán (`isaacduran167@gmail.com`)
* **Community:** Iglesia de Dios del Dios Vivo, Columna y Apoyo de la Verdad, El Buen Pastor (IDDV El Buen Pastor)
* **Platforms:** iOS (Active in App Store), Android (Prepared for Google Play), Web (Vercel / GitHub Pages)
* **Remote Git Repository:** `https://github.com/lsaacd/EBP-APP.git` (Branch: `main`, feature branch: `app-web-parity`)
* **Apple App ID:** `6794435414` (`com.elbuenpastor`)
* **Android Package Name:** `com.elbuenpastor.himnario`
* **EAS Project ID:** `74ef3b4c-fe90-4c2c-8521-b52f4b6a5441` (Account: `isaacduran`)

---

## 2. Directory Structure

```text
EBP APP/
├── ARCHITECTURE.md                  # <-- This file (system architecture & onboarding guide)
├── EAS.md                           # Comprehensive EAS deployment and App Store submission guide
├── FUTURE_FIXES_HIMNARIO_EBP.md     # Known issues, native roadmap, Android foreground controls
├── README.md                        # Bilingual overview and local run instructions
├── vercel.json                      # Web portal deployment rewrites to /docs
├── docs/                            # Web Companion, Legal Pages & Static Web Data
│   ├── index.html                   # Web hymn reader & legal/support landing page
│   ├── privacy.html                 # Official Privacy Policy
│   ├── terms.html                   # Official Terms of Service
│   ├── js/search-engine.js          # Web smart search engine (mirrored in himnario/utils/search-engine.ts)
│   └── data/hymns-data.js           # Exported web hymn dataset (517 hymns + 124 choruses = 641 total)
├── scripts/
│   ├── extract-hymns.js             # Parses mobile dataset to generate web data/hymns-data.js
│   ├── generate-hymn-pages.js       # Generates per-hymn static share preview pages (/h/{id})
│   └── test-android-playback.cjs    # Automated unit tests for native playback, offline audio, and smart search
└── himnario/                        # MAIN EXPO / REACT NATIVE APPLICATION ROOT
    ├── package.json                 # Dependencies (Expo 54, React 19, RN 0.81, Reanimated 4)
    ├── app.json                     # Expo configuration, bundle IDs, permissions, plugins
    ├── eas.json                     # EAS Build & Update profiles (production, preview, preview-arm64, dev)
    ├── .easignore                   # Excludes local assets/audio/ from EAS build archives
    ├── index.js                     # Root entry point; registers background playback service
    ├── service.js                   # Headless audio playback service (RemotePlay, RemotePause, Ducking)
    ├── audio/                       # Native audio playback & offline download engine
    │   ├── android-playback-controller.ts # Pure TS state machine for queue, repeat, shuffle, and retries
    │   ├── native-player.ts         # Cross-platform TrackPlayer adapter (iOS & Android)
    │   ├── android-player.ts        # Re-exports native-player.ts for compatibility
    │   └── offline-audio.ts         # First-play caching & bulk download (iOS cacheDirectory / Android documentDirectory)
    ├── app/                         # Expo Router (v6) file-based routes
    │   ├── _layout.tsx              # Root Stack, splash hold, theme provider, global MiniPlayer
    │   ├── index.tsx                # Initial entry redirector
    │   ├── (tabs)/                  # Main Tab Bar routes
    │   │   ├── _layout.tsx          # Platform split: iOS NativeTabs vs Android FloatingPillBar
    │   │   ├── home.tsx             # Header search button, iOS notice, Hero, Continue Listening, Verse, Motto, Recents
    │   │   ├── hymns.tsx            # FlashList catalog, Glass A-Z scrubber, smart search, category/audio chips
    │   │   ├── favorites.tsx        # Bookmarks & Custom Playlists management
    │   │   └── settings.tsx         # Appearance, font scale (12–64px), language, offline audio card, feedback
    │   ├── hymn/
    │   │   └── [id].tsx             # Hymn Reader with 3D PageFlip, TextSizeSheet, ProjectorModal, ShareSheet
    │   └── playlist/
    │       └── [id].tsx             # Custom Playlist detail view
    ├── components/                  # Reusable UI components
    │   ├── GlassSurface.tsx         # iOS 26+ Liquid Glass (expo-glass-effect) / iOS BlurView / Android M3 tonal surface
    │   ├── MiniPlayer.tsx           # Floating glass/tonal audio bar attached above bottom navigation
    │   ├── MusicPlayer.tsx          # Full-screen modal player (scrubber, album art, repeat/shuffle, ShareSheet)
    │   ├── OfflineAudioCard.ios.tsx # iOS circular ring offline audio card
    │   ├── OfflineAudioCard.android.tsx # Android Material 3 offline audio card
    │   ├── IosStreamingNotice.tsx   # One-time dismissible notice for iOS users transitioning to streaming
    │   ├── TextSizeSheet.tsx        # Reader Aa popover (12–64px slider, live preview, numeric input, reset)
    │   ├── ProjectorModal.tsx       # Full-screen church presentation mode (keep-awake, auto-fit, stanza chips)
    │   ├── ShareSheet.tsx           # WhatsApp, Copy Link, Copy Lyrics, and System Share modal
    │   ├── PageFlipTransition.tsx   # Realistic 3D book-turning engine with underlays & shadows
    │   ├── VerseCard.tsx            # Interactive biblical verse card on home screen
    │   ├── AddToPlaylistModal.tsx   # Modal to add current hymn into user playlists
    │   └── PageFlip/                # Book spine shadow & edge gradients
    ├── context/                     # Global State Management (React Context + AsyncStorage)
    │   ├── NowPlayingContext.tsx    # Unified audio controller (delegating to native-player.ts)
    │   ├── LanguageContext.tsx      # Bilingual i18n system (Spanish / English)
    │   ├── FavoritesContext.tsx     # Saved hymn IDs
    │   ├── PlaylistsContext.tsx     # Custom playlists with names and hymn ID arrays
    │   ├── RecentHymnsContext.tsx   # History of recently opened hymns
    │   └── HymnFilterContext.tsx    # Global search and tab filtering state
    ├── data/
    │   ├── alabanzasPaginas.js      # Core dataset: 517 Hymns + 124 Estribillos (641 total lyrics & metadata)
    │   ├── audioRegistry.ts         # Shared streaming URL registry (https://audio.himnarioebp.com/) for 655 recordings
    │   ├── audioRegistry.native.ts  # Re-exports audioRegistry.ts
    │   └── audioRegistry.android.ts # Re-exports audioRegistry.ts
    ├── theme/
    │   ├── ThemeContext.tsx         # Sacred Ink Parchment vs Pure Black theme & fontSizeMultiplier (12–64px)
    │   └── theme.ts                 # Design tokens (Parchment #fcf9f2, Burgundy #6e1619, Black #010101)
    ├── utils/
    │   └── search-engine.ts         # Smart search engine (accents, typos, number prefixes, snippets, highlight ranges)
    └── patches/
        └── react-native-track-player+4.1.2.patch # Kotlin Coroutines + HeadlessJsTaskService New Architecture fix
```

---

## 3. Technology Stack & Key Libraries

* **Framework:** Expo SDK 54 (`~54.0.33`), React Native `0.81.5`, React `19.1.0`
* **Architecture:** React Native **New Architecture** enabled (`newArchEnabled: true`), **React Compiler** enabled (`reactCompiler: true`).
* **Routing:** `expo-router` v6 with typed routes.
* **Lists:** `@shopify/flash-list` for smooth 60fps rendering of 641 hymns and choruses.
* **Audio Engine:** `react-native-track-player` with lock-screen, control center, and background playback capabilities on both iOS and Android, backed by Cloudflare R2 streaming (`https://audio.himnarioebp.com/`) and automatic on-device caching (`offline-audio.ts`).
* **Native Surfaces & Utilities:** `expo-glass-effect` (iOS 26+ Liquid Glass with `expo-blur` fallback on older iOS) and `expo-keep-awake` (for church projector mode).
* **Animation:** `react-native-reanimated` v4 + `react-native-gesture-handler` v2.
* **Typography:** `@expo-google-fonts/newsreader` (classical serif for hymn titles and lyrics) + `@expo-google-fonts/public-sans` (modern sans-serif for UI/body).

---

## 4. Design System: "Sacred Ink"

The visual aesthetic is governed by [`himnario/theme/theme.ts`](file:///c:/Users/isaac/Desktop/%5B03%5D%20IDDV%20EL%20BUEN%20PASTOR/%5B01%5D%20APP/EBP%20APP/himnario/theme/theme.ts) and [`himnario/theme/ThemeContext.tsx`](file:///c:/Users/isaac/Desktop/%5B03%5D%20IDDV%20EL%20BUEN%20PASTOR/%5B01%5D%20APP/EBP%20APP/himnario/theme/ThemeContext.tsx):

* **Light Mode ("Parchment / Our Paper"):**
  * Background: `#fcf9f2`
  * Primary Accent: `#6e1619` (Sacred Burgundy)
  * Ink Text: `#1c1c18`
* **Dark Mode ("Pure Black"):**
  * Background: `#010101` (true OLED black)
  * Cards / Containers: `#373737`
  * Text / Accents: `#ffffff` and parchment cream `#fdf9f2`
* **Platform Nav & Surface Split:**
  * iOS uses Apple's native `UITabBarController` (`NativeTabs`) with SF Symbols and `GlassSurface` (Liquid Glass on iOS 26+ / `BlurView` on older iOS).
  * Android uses a floating pill bar (`FloatingPillBar`) with MaterialIcons and Material 3 tonal surfaces.

---

## 5. Hymn Data & Audio Architecture

All hymns and choruses are centrally stored in [`himnario/data/alabanzasPaginas.js`](file:///c:/Users/isaac/Desktop/%5B03%5D%20IDDV%20EL%20BUEN%20PASTOR/%5B01%5D%20APP/EBP%20APP/himnario/data/alabanzasPaginas.js):
1. **`const letras = { ... }`**: Raw lyrics mapped by hymn ID.
2. **`export const hymnsData = [ ... ]`**: Array of 517 main hymns (numbered up to 516, including `110 A`) with titles, categories, authors, and lyrics hooks.
3. **`export const estribillosData = [ ... ]`**: Array of 124 choruses/estribillos (`E1`–`E124`).
4. **`audioRegistry.ts`**: Shared streaming registry mapping 655 recording IDs to `https://audio.himnarioebp.com/hymn_{id}.m4a` (no local `.m4a` files are bundled via `require()`, keeping both iOS and Android app binaries ~50–120 MB instead of ~1.4 GB).
5. **`offline-audio.ts`**: Automatically saves streamed hymns on first play and supports bulk downloading all 655 recordings. On iOS, files are stored in `FileSystem.cacheDirectory` (`Library/Caches/hymn-audio/`, excluded from iCloud backup per Apple's Data Storage Guidelines); on Android, in `FileSystem.documentDirectory`.

> **When modifying lyrics or hymn metadata:**  
> Run `node scripts/extract-hymns.js` to synchronize the mobile data changes into `docs/data/hymns-data.js` for the web portal.

---

## 6. Deployment & Update Workflows

### A. Over-The-Air (OTA) Updates via EAS Update
> **Critical Safety Rule:** Never push an `eas update` to a store build whose native binary is incompatible with the JS bundle (for example, the `app-web-parity` changes that remove bundled `require()` audio assets or add native modules like `expo-glass-effect` and `expo-keep-awake` require a new `1.1.0` store build first).

When pushing pure JS/UI fixes compatible with the live binary:
```bash
cd himnario
eas update --branch production --message "Describe changes here"
```

### B. Git Source Control Workflow
```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

### C. Full Native Builds (`eas build`)
**Required when:**
* Adding or removing a native library (`expo-glass-effect`, `expo-keep-awake`, patches).
* Changing bundled assets or `.easignore` (`assets/audio/` removal).
* Modifying native permissions in `app.json`.

Commands:
```bash
# Build for iOS (App Store)
eas build --platform ios --profile production

# Build for Android (Google Play AAB — or use himnario/build-android-production.ps1)
eas build --platform android --profile production
```

---

## 7. Known Gotchas & Critical Tips for the Next Agent

1. **Path Formatting on Windows:**  
   The workspace path contains square brackets: `[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP`. In PowerShell commands, always start with `Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"` to prevent PowerShell from interpreting brackets as wildcard character sets.
2. **Local `assets/audio/` Folder:**  
   There are 650+ `.m4a` files in `himnario/assets/audio/` (~1.3 GB) kept on disk as source files, but excluded from EAS builds via `himnario/.easignore` and no longer referenced by `audioRegistry.ts`.
3. **TrackPlayer Patch:**  
   `patches/react-native-track-player+4.1.2.patch` is applied via `patch-package` during `npm install`. It resolves New Architecture coroutine return types and `HeadlessJsTaskService` event emission on React Native 0.81+.
