import TrackPlayer, { Event } from 'react-native-track-player';
import { DeviceEventEmitter } from 'react-native';

module.exports = async function () {
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
    await TrackPlayer.destroy();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
  });

  // ── Skip Next / Previous ───────────────────────────────────────────
  // Our app uses a single-track queue managed in NowPlayingContext.
  // We forward these to the UI via DeviceEventEmitter so our custom
  // queue logic can pick the correct next/prev hymn.
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    DeviceEventEmitter.emit('CustomRemoteNext');
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    DeviceEventEmitter.emit('CustomRemotePrev');
  });

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
