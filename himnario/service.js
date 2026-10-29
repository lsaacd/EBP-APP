import TrackPlayer, { Event } from 'react-native-track-player';
import { Platform } from 'react-native';
import { registerAndroidPlaybackService } from './audio/android-player';

module.exports = async function () {
  if (Platform.OS === 'android') {
    registerAndroidPlaybackService();
    return;
  }
  // ── Play / Pause / Stop / Seek ─────────────────────────────────────
  // These MUST be handled here in the service because Android fires
  // these events from the notification even when the JS UI is not active.
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.reset();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
  });

  // iOS skip events remain handled by the existing NowPlayingContext path.

  // ── Duck (handle audio interruptions gracefully) ───────────────────
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
    } else if (event.permanent) {
      await TrackPlayer.stop();
    } else {
      // Volume was ducked temporarily (e.g. navigation prompt) — resume
      await TrackPlayer.play();
    }
  });
};
