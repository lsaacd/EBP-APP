# Testing Android notification playback

Use an internal **preview APK**, not the Play Store AAB and not Expo Go. The preview build is a standalone app and does not need a computer or Metro server to play audio.

## Building from this Windows checkout

EAS's Git clone failed on this bracketed Windows path. With Git disabled, its default archive root still included the website's duplicate audio, producing a 2.5 GB archive above EAS's 2 GB upload limit. Scope the archive to the app directory explicitly. From `himnario/`, the build command used is:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
eas build --platform android --profile preview --non-interactive --no-wait
```

These environment settings apply to the terminal process, not source configuration. The upload includes local uncommitted app changes. The existing internal preview profile produces an APK and uses the preview update channel; this command does not submit to Google Play or publish an EAS Update.

## Install

1. Open the completed EAS build link on your Android phone and download the APK.
2. If Android asks, allow installation from that browser or file manager. Open the download and choose Install.
3. If Android offers an update to the existing app, use it to preserve local favorites/playlists. If it reports a signature conflict, stop and record the error before uninstalling: uninstalling removes that app's saved local data. A separate test phone is preferable if existing data matters.
4. Open Himnario El Buen Pastor. Choose a hymn with a recording and start playback while the app is visible.

The app stops playback and removes its notification when it is explicitly swiped away from Recents. For background tests, press Home instead; do not swipe the app away or Force stop it.

## Test checklist

| Test | Steps | Expected result |
| --- | --- | --- |
| In-app playback | Play, pause and resume a recorded hymn | Audio and play/pause icon agree. |
| Notification controls | While playing, press Home and pull down notifications | A media card shows the correct title and artwork. Pause stops audio; Play resumes. |
| Next/Previous | Tap each notification button once | Exactly one available recording changes per tap; title/artwork match the sound. |
| Seeking | Drag the timeline if the Android media card exposes one | Playback moves to that position. Availability varies by Android version and media-card layout. |
| Lock screen | Start playback, lock the phone, then use its media controls | Play/Pause and Next/Previous still work. Some phones require waking the lock screen first. |
| Automatic advance | Leave a short recorded hymn playing to its end while locked | The next available hymn begins without reopening the app. |
| Playlist | Play a custom list containing recorded and unrecorded entries | Entries without recordings are skipped; recorded entries follow the list and wrap at its end. |
| Rapid input | Tap Next several times | The final title and sound agree; playback does not freeze or overlap. |
| Reopen | Return to the app and expand/minimize the player | Current title, progress and playing state remain correct; reopening does not restart the hymn. |
| Stop | Use the app's X, or Stop if Android exposes it; then open another hymn | Playback clears and the next selected hymn starts normally. |
| Interruptions | Pause manually, then trigger an interruption; also test an interruption while playing | Manually paused audio must not resume unexpectedly. Playing audio should handle temporary loss gracefully. |
| Offline | After the initial test, enable airplane mode and choose several recordings | Bundled recordings play without a network connection. |

## If something fails

Record the phone model, Android version, APK build ID, hymn number, exact button, and whether the app was visible, backgrounded, locked or removed from Recents. Note whether the media card was missing, the button did nothing, the wrong hymn played, or the card displayed the wrong state.

For deeper diagnosis, enable Developer options and USB debugging, connect the phone, and allow its debugging prompt. From a terminal:

```powershell
adb devices -l
adb logcat -v time > android-playback-log.txt
```

Reproduce the problem, then press Ctrl+C to stop recording. Logs can contain private device information; review before sharing and keep them out of Git. A log capture plus the exact test steps is much more useful than a screenshot alone.

Passing mocked playback tests does not replace this device checklist. Publishing an OTA update or releasing to production remains a separate action.
