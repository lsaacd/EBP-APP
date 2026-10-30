// Re-export the unified streaming audio registry from audioRegistry.native.ts.
// Keeping the base implementation in audioRegistry.native.ts ensures Metro's
// platform-specific resolution (.native.ts / .android.ts / .ts) never creates
// a circular self-import on iOS or Android.
export {
  AUDIO_BASE_URL,
  getHymnAudio,
  hasHymnAudio,
  getAllAudioIds,
  default,
} from './audioRegistry.native';
