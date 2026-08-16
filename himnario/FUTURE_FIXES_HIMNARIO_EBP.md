# Future Fixes & Architectural Guide — Himnario El Buen Pastor App

This document serves as a comprehensive technical guide, detailing platform-specific behavior, native build requirements, and future roadmap items for **Himnario El Buen Pastor**.

---

## 1. 🤖 Android Notification Media Controls (Native Service Issue)

### Problem Description
On Android devices and emulators, tapping Play, Pause, or Skip buttons on the Android system notification center / lock screen media player widget fails to respond or update the player state in the app.

### Root Cause Analysis
1. **Background JS Event Disconnect**:
   - `react-native-track-player` registers `service.js` via `TrackPlayer.registerPlaybackService()`.
   - When the app is in the background or screen is locked, Android triggers native media intent events (`RemotePlay`, `RemotePause`, `RemoteNext`, `RemotePrevious`) inside `service.js`.
   - `service.js` attempts to communicate with `NowPlayingContext.tsx` via `DeviceEventEmitter`.
   - However, `DeviceEventEmitter` **requires an active React JS UI thread**. When Android background-throttles the JS thread or when the app is backgrounded, these events are dropped.

2. **Native Binary Requirement**:
   - `react-native-track-player` relies on native Android `MediaSession` and `ForegroundService` capabilities (configured in `AndroidManifest.xml` / native Gradle build).
   - JS-only over-the-air (OTA) updates via `eas update` **cannot alter native Android Manifest permissions or native Android ForegroundService lifecycle registration**.
   - If the native APK build was compiled without full `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions or proper native `MediaSessionCompat` initialization in the Android native binary, JS OTA updates alone will not fix the notification widget controls.

### Required Fix Steps
1. **Perform a Full Native Development / Production Build**:
   - Run a fresh `eas build --platform android --profile preview` (or `production`) to re-compile the native C++/Java/Kotlin binaries for `react-native-track-player`.
2. **Native Service Contract in `service.js`**:
   - Keep native control handlers (`TrackPlayer.play()`, `TrackPlayer.pause()`, `TrackPlayer.seekTo()`, `TrackPlayer.stop()`) direct and asynchronous inside `service.js`.
   - In `NowPlayingContext.tsx`, rely on native `Event.PlaybackState` events rather than listening to UI-driven events to update player status.

---

## 2. 📱 iOS NativeTabs vs. Custom Sub-Route Navigation

### Problem Description
When deep-linking or pushing screens inside the `(tabs)` stack group (e.g. `playlist/[id]`), iOS `NativeTabs` (`UITabBarController`) either hides the bottom tab bar automatically or breaks navigation if child routes don't have explicit `NativeTabs.Trigger` components.

### Recommended Solution
- Keep sub-detail pages (like `/playlist/[id]` and `/hymn/[id]`) **outside the `(tabs)` group** as standard stack screens.
- This provides standard push/pop navigation with full back-button gestures, clean slide transitions, and proper bottom safe-area insets without interfering with Apple's native `UITabBarController`.

---

## 3. 🎨 UI & Layout Enhancements Completed

- **Bottom Clearance on Standalone Detail Pages**:
  - `app/playlist/[id].tsx` features dynamic bottom clearance (`insets.bottom + 90`) so the floating `MiniPlayer` never obscures the final list item.
- **Route Match Precision in Root Layout**:
  - Route path checks use exact trailing slash matching (`pathname.startsWith('/hymn/')` vs `/hymns`) to prevent tab pages from misinterpreting detail-page layout rules.
- **Playlist Queue Looping**:
  - When playing custom queues (playlists), `NowPlayingContext.tsx` wraps around seamlessly to the first hymn in the list when reaching the end of the queue.
- **Hymn Title Sanitization**:
  - Removed unwanted metadata strings (such as `"Hebp Audio"`) from hymn titles in `alabanzasPaginas.js`.
- **Add to Playlist Dynamic Hymn ID**:
  - `MusicPlayer.tsx` passes the active dynamically-playing track ID (`currentId`) to `AddToPlaylistModal` rather than the initial static hymn ID.

---

## 4. 🚀 Future Roadmap & Feature Enhancements

1. **Fresh Android APK Rebuild**:
   - Run `eas build -p android` to bake in native media service permissions into a fresh APK binary.
2. **Audio Pre-caching & Offline Storage**:
   - Pre-fetch hymn audio files locally to enable offline playback without network dependency.
3. **Playlist Drag-and-Drop Reordering**:
   - Add drag-to-reorder functionality inside playlist detail views using `react-native-reorderable-list`.
