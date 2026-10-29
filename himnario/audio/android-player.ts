import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event, RepeatMode, State } from 'react-native-track-player';
import { Asset } from 'expo-asset';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { getHymnAudio, hasHymnAudio } from '../data/audioRegistry';
import { createAndroidPlaybackController } from './android-playback-controller';

let ready = false;
let preparing: Promise<void> | null = null;

async function prepare() {
  if (ready) return;
  if (!preparing) {
    preparing = (async () => {
      try {
        await TrackPlayer.setupPlayer();
      } catch (error) {
        if ((error as { code?: string }).code !== 'player_already_initialized') throw error;
      }
      await TrackPlayer.updateOptions({
        capabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.SkipToNext, Capability.SkipToPrevious, Capability.SeekTo],
        compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
        android: { appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification },
      });
      ready = true;
    })().finally(() => { preparing = null; });
  }
  return preparing;
}

async function assetUri(source: number) {
  const asset = Asset.fromModule(source);
  if (!asset.localUri) await asset.downloadAsync();
  return asset.localUri || asset.uri;
}

export const androidPlayer = createAndroidPlaybackController({
  prepare,
  async load(id) {
    const source = getHymnAudio(id);
    if (!source) throw new Error(`No recording registered for ${id}`);
    const url = await assetUri(source);
    const data = id.startsWith('E') ? estribillosData : hymnsData;
    const hymn = data.find((item: { id: string | number }) => String(item.id) === id);
    let artwork: string | undefined;
    try { artwork = await assetUri(require('../assets/images/EBP_HYMN_COVER.png')); }
    catch (error) { console.warn('[AndroidPlayback] Artwork unavailable:', error); }
    await TrackPlayer.reset();
    await TrackPlayer.add({ id, url, title: hymn?.title || `Himno ${id}`, artist: hymn?.author || 'Himnario El Buen Pastor', artwork });
  },
  play: () => TrackPlayer.play(),
  pause: () => TrackPlayer.pause(),
  // Stop can arrive before a track was selected; never initialize a service in the background.
  async reset() { if (ready) await TrackPlayer.reset(); },
  seek: position => TrackPlayer.seekTo(position),
  getPlayWhenReady: () => TrackPlayer.getPlayWhenReady(),
  async setRepeatOne(enabled) { await TrackPlayer.setRepeatMode(enabled ? RepeatMode.Track : RepeatMode.Off); },
  hasAudio: hasHymnAudio,
  collection: id => (id.startsWith('E') ? estribillosData : hymnsData).map((h: { id: string | number }) => String(h.id)),
  report: error => console.warn('[AndroidPlayback]', error),
});

let registered = false;

/** Registered once by service.js; none of these actions depend on a mounted screen. */
export function registerAndroidPlaybackService() {
  if (registered) return;
  registered = true;
  TrackPlayer.addEventListener(Event.RemotePlay, () => androidPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => androidPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => androidPlayer.clear());
  TrackPlayer.addEventListener(Event.RemoteNext, () => androidPlayer.next());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => androidPlayer.previous());
  TrackPlayer.addEventListener(Event.RemoteSeek, event => androidPlayer.seek(event.position));
  TrackPlayer.addEventListener(Event.RemoteDuck, event => androidPlayer.interrupt(event));
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => androidPlayer.ended());
  TrackPlayer.addEventListener(Event.PlaybackError, error => androidPlayer.playbackError(error));
  TrackPlayer.addEventListener(Event.PlaybackState, event => {
    if (event.state === State.Error) androidPlayer.playbackError(event.error);
    else androidPlayer.playbackState(event.state === State.Playing, event.state === State.Loading || event.state === State.Buffering);
  });
}
