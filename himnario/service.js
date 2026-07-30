import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  
  // Note: RemoteNext and RemotePrevious are intentionally NOT registered here because
  // our custom queue logic (shuffle/finding tracks with audio) is handled exclusively 
  // in NowPlayingContext.tsx using useTrackPlayerEvents.
};
