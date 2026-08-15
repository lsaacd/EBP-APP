import TrackPlayer, { Event } from 'react-native-track-player';
import { DeviceEventEmitter } from 'react-native';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  
  // Forward next/prev to the UI context where our custom queue logic lives
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    DeviceEventEmitter.emit('CustomRemoteNext');
  });
  
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    DeviceEventEmitter.emit('CustomRemotePrev');
  });
};
