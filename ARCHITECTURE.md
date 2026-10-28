# ARCHITECTURE & DEVELOPER ONBOARDING GUIDE — HIMNARIO EL BUEN PASTOR (EBP APP)

> **Purpose of this document:**  
> This file is the primary orientation document for any AI coding assistant or new developer opening this repository on a new machine. It provides a complete map of the architecture, data structures, deployment channels, critical gotchas, and workflows.

---

## 1. Project Overview & Identity

* **App Name:** Himnario El Buen Pastor (EBP APP)
* **Author / Developer:** Isaac Durán (`isaacduran167@gmail.com`)
* **Community:** Iglesia de Dios del Dios Vivo, Columna y Apoyo de la Verdad, El Buen Pastor (IDDV El Buen Pastor)
* **Platforms:** iOS (Active in App Store), Android (Prepared for Google Play), Web (Vercel / GitHub Pages)
* **Remote Git Repository:** `https://github.com/lsaacd/EBP-APP.git` (Branch: `main`)
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
│   ├── data/hymns-data.js                 # Exported web hymn dataset
│   └── audio/                       # Public audio files for web streaming
├── scripts/
│   └── extract-hymns.js             # Parses mobile dataset to generate web data/hymns-data.js
└── himnario/                        # MAIN EXPO / REACT NATIVE APPLICATION ROOT
    ├── package.json                 # Dependencies (Expo 54, React 19, RN 0.81, Reanimated 4)
    ├── app.json                     # Expo configuration, bundle IDs, permissions, plugins
    ├── eas.json                     # EAS Build & Update profiles (production, preview, dev)
    ├── index.js                     # Root entry point; registers background playback service
    ├── service.js                   # Headless audio playback service (RemotePlay, RemotePause, Ducking)
    ├── app/                         # Expo Router (v6) file-based routes
    │   ├── _layout.tsx              # Root Stack, splash hold, theme provider, global MiniPlayer
    │   ├── index.tsx                # Initial entry redirector
    │   ├── (tabs)/                  # Main Tab Bar routes
    │   │   ├── _layout.tsx          # Platform split: iOS NativeTabs vs Android FloatingPillBar
    │   │   ├── home.tsx             # Hero card, Verse of the Day, Recent hymns
    │   │   ├── hymns.tsx            # FlashList catalog, A-Z fast scrubber, search, category chips
    │   │   ├── favorites.tsx        # Bookmarks & Custom Playlists management
    │   │   └── settings.tsx         # Appearance, font scale, language switch, rate app, feedback
    │   ├── hymn/
    │   │   └── [id].tsx             # Hymn Reader with 3D PageFlipTransition, lyrics, audio button
    │   └── playlist/
    │       └── [id].tsx             # Custom Playlist detail view
    ├── components/                  # Reusable UI components
    │   ├── MiniPlayer.tsx           # Floating audio bar attached above bottom navigation
    │   ├── MusicPlayer.tsx          # Full-screen modal player (scrubber, album art, repeat/shuffle)
    │   ├── PageFlipTransition.tsx   # Realistic 3D book-turning engine with underlays & shadows
    │   ├── VerseCard.tsx            # Interactive biblical verse card on home screen
    │   ├── AddToPlaylistModal.tsx   # Modal to add current hymn into user playlists
    │   └── PageFlip/                # Book spine shadow & edge gradients
    ├── context/                     # Global State Management (React Context + AsyncStorage)
    │   ├── NowPlayingContext.tsx    # Audio engine controller (TrackPlayer queue & state)
    │   ├── ThemeContext.tsx         # Sacred Ink Parchment vs Pure Black theme toggling
    │   ├── LanguageContext.tsx      # Bilingual i18n system (Spanish / English)
    │   ├── FavoritesContext.tsx     # Saved hymn IDs
    │   ├── PlaylistsContext.tsx     # Custom playlists with names and hymn ID arrays
    │   ├── RecentHymnsContext.tsx   # History of recently opened hymns
    │   └── HymnFilterContext.tsx    # Global search and tab filtering state
    ├── data/
    │   ├── alabanzasPaginas.js      # Core dataset: 637 Hymns + 124 Estribillos (lyrics & metadata)
    │   └── audioRegistry.ts         # Static require() map of all hymn audio assets
    ├── theme/
    │   └── theme.js                 # Design tokens (Parchment #fcf9f2, Burgundy #6e1619, Black #010101)
    └── patches/
        └── react-native-track-player+4.1.2.patch # Kotlin Coroutines New Architecture fix
```

---

## 3. Technology Stack & Key Libraries

* **Framework:** Expo SDK 54 (`~54.0.33`), React Native `0.81.5`, React `19.1.0`
* **Architecture:** React Native **New Architecture** enabled (`newArchEnabled: true`), **React Compiler** enabled (`reactCompiler: true`).
* **Routing:** `expo-router` v6 with typed routes.
* **Lists:** `@shopify/flash-list` for smooth 60fps rendering of 760+ songs.
* **Audio Engine:** `react-native-track-player` with lock-screen, control center, and background playback capabilities.
* **Animation:** `react-native-reanimated` v4 + `react-native-gesture-handler` v2.
* **Typography:** `@expo-google-fonts/newsreader` (classical serif for hymn titles) + `@expo-google-fonts/public-sans` (modern sans-serif for UI/body).

---

## 4. Design System: "Sacred Ink"

The visual aesthetic is governed by [`himnario/theme/theme.js`](file:///c:/Users/isaac/Desktop/%5B03%5D%20IDDV%20EL%20BUEN%20PASTOR/%5B01%5D%20APP/EBP%20APP/himnario/theme/theme.js):

* **Light Mode ("Parchment / Our Paper"):**
  * Background: `#fcf9f2`
  * Primary Accent: `#6e1619` (Sacred Burgundy)
  * Ink Text: `#1c1c18`
* **Dark Mode ("Pure Black"):**
  * Background: `#010101` (true OLED black)
  * Cards / Containers: `#373737`
  * Text / Accents: `#ffffff` and parchment cream `#fdf9f2`
* **Platform Nav Split:**
  * iOS uses Apple's native `UITabBarController` (`NativeTabs`) with SF Symbols.
  * Android uses a floating frosted glass pill bar (`FloatingPillBar`) with MaterialIcons.

---

## 5. Hymn Data Architecture

All hymns and choruses are centrally stored in [`himnario/data/alabanzasPaginas.js`](file:///c:/Users/isaac/Desktop/%5B03%5D%20IDDV%20EL%20BUEN%20PASTOR/%5B01%5D%20APP/EBP%20APP/himnario/data/alabanzasPaginas.js):
1. **`const letras = { ... }`** (Lines 19–790): Raw lyrics mapped by hymn ID.
2. **`export const hymnsData = [ ... ]`** (Line 793): Array of 637 main hymns with titles, categories, authors, and lyrics hooks.
3. **`export const estribillosData = [ ... ]`** (Line 8471): Array of 124 choruses/estribillos (`E1`–`E124`).
4. **`audioRegistry.ts`**: Static asset mapping associating each song ID with its bundled audio file.

> **When modifying lyrics or hymn metadata:**  
> Run `node scripts/extract-hymns.js` to automatically synchronize the mobile data changes into `docs/data/hymns-data.js` for the web portal.

---

## 6. Deployment & Update Workflows

### A. Over-The-Air (OTA) Updates via EAS Update
**Use this for 95% of updates (lyrics fixes, UI tweaks, bug fixes, styling):**
Do NOT submit a new binary to the App Store for JS/CSS changes. Instead, run from the `himnario` directory:

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
* Note: Remote origin is configured to `https://github.com/lsaacd/EBP-APP.git`.
* The repo is set to **Private**. When working on a new device, authenticate via `gh auth login` or Git Credential Manager.

### C. Full Native Builds (`eas build`)
**Only required if:**
* Adding or removing a native library with Java/Kotlin/Objective-C/C++ code.
* Modifying native Android permissions in `app.json` (such as `FOREGROUND_SERVICE_MEDIA_PLAYBACK`).
* Updating Expo SDK versions.

Commands:
```bash
# Build for iOS (App Store)
eas build --platform ios --profile production

# Build for Android (Google Play AAB)
eas build --platform android --profile production
```

---

## 7. Known Gotchas & Critical Tips for the Next Agent

1. **Path Formatting on Windows:**  
   The workspace path contains square brackets: `[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP`. In PowerShell or ripgrep commands, always wrap paths in double quotes to prevent PowerShell from parsing brackets as wildcard character sets.
2. **Audio Asset Bundle Size:**  
   There are 650+ `.m4a` files in `assets/audio/` totaling ~1.3 GB. Be cautious about running commands that copy or duplicate the entire directory.
3. **Android Media Controls (Background):**  
   Detailed in `FUTURE_FIXES_HIMNARIO_EBP.md`. Native notification controls on Android need native foreground service bindings compiled in a fresh APK rather than OTA updates.
4. **TrackPlayer Patch:**  
   `patches/react-native-track-player+4.1.2.patch` is applied via `patch-package` during `npm install`. It resolves New Architecture coroutine return types for React Native 0.81+.
