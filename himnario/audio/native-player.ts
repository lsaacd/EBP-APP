import TrackPlayer, { AppKilledPlaybackBehavior, Capability, Event, RepeatMode, State } from 'react-native-track-player';
import { Asset } from 'expo-asset';
import { hymnsData, estribillosData } from '../data/alabanzasPaginas';
import { hasHymnAudio } from '../data/audioRegistry';
import { resolvePlaybackUri, saveHymnAudio } from './offline-audio';
import { createAndroidPlaybackController } from './android-playback-controller';

let ready = false;
let preparing: Promise<void> | null = null;
let cachedArtworkPromise: Promise<string | undefined> | null = null;
let trackTitleResolver: ((id: string, fallbackTitle: string) => string) | null = null;

export function setTrackTitleResolver(
  resolver: ((id: string, fallbackTitle: string) => string) | null,
) {
  trackTitleResolver = resolver;
}

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

function getCoverArtworkUri(): Promise<string | undefined> {
  if (!cachedArtworkPromise) {
    cachedArtworkPromise = (async () => {
      try {
        const asset = Asset.fromModule(require('../assets/images/EBP_HYMN_COVER.png'));
        if (!asset.localUri) await asset.downloadAsync();
        return asset.localUri || asset.uri;
      } catch (error) {
        console.warn('[NativePlayback] Artwork unavailable:', error);
        cachedArtworkPromise = null;
        return undefined;
      }
    })();
  }
  return cachedArtworkPromise;
}

export const nativePlayer = createAndroidPlaybackController({
  prepare,
  async load(id) {
    // Resolve playback URI and cached cover artwork in parallel
    const [url, artwork] = await Promise.all([
      resolvePlaybackUri(id),
      getCoverArtworkUri(),
    ]);
    const data = id.startsWith('E') ? estribillosData : hymnsData;
    const hymn = data.find((item: { id: string | number }) => String(item.id) === id);
    const fallbackTitle = hymn?.title || `Himno ${id}`;
    const title = trackTitleResolver ? trackTitleResolver(id, fallbackTitle) : fallbackTitle;
    const track = { id, url, title, artist: hymn?.author || 'Himnario El Buen Pastor', artwork };
    await TrackPlayer.reset();
    await TrackPlayer.add(track);
  },
  prefetch(id) {
    if (typeof saveHymnAudio === 'function') {
      void Promise.resolve(saveHymnAudio(id)).catch(() => {});
    }
  },
  play: () => TrackPlayer.play(),
  pause: () => TrackPlayer.pause(),
  // Stop can arrive before a track was selected; never initialize a service in the background.
  async reset() { if (ready) await TrackPlayer.reset(); },
  seek: position => TrackPlayer.seekTo(position),
  async setRate(rate) { if (ready) await TrackPlayer.setRate(rate); },
  getPlayWhenReady: () => TrackPlayer.getPlayWhenReady(),
  async setRepeatOne(enabled) { await TrackPlayer.setRepeatMode(enabled ? RepeatMode.Track : RepeatMode.Off); },
  hasAudio: hasHymnAudio,
  collection: id => (id.startsWith('E') ? estribillosData : hymnsData).map((h: { id: string | number }) => String(h.id)),
  report: error => console.warn('[NativePlayback]', error),
});

let registered = false;

/** Registered once by service.js on both iOS and Android; none of these actions depend on a mounted screen. */
export function registerPlaybackService() {
  if (registered) return;
  registered = true;
  TrackPlayer.addEventListener(Event.RemotePlay, () => nativePlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => nativePlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => nativePlayer.clear());
  TrackPlayer.addEventListener(Event.RemoteNext, () => nativePlayer.next());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => nativePlayer.previous());
  TrackPlayer.addEventListener(Event.RemoteSeek, event => nativePlayer.seek(event.position));
  TrackPlayer.addEventListener(Event.RemoteDuck, event => nativePlayer.interrupt(event));
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => nativePlayer.ended());
  TrackPlayer.addEventListener(Event.PlaybackError, error => nativePlayer.playbackError(error));
  TrackPlayer.addEventListener(Event.PlaybackState, event => {
    if (event.state === State.Error) nativePlayer.playbackError(event.error);
    else nativePlayer.playbackState(event.state === State.Playing, event.state === State.Loading || event.state === State.Buffering);
  });
}

export const androidPlayer = nativePlayer;
export const registerAndroidPlaybackService = registerPlaybackService;

