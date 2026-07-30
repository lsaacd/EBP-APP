import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import TrackPlayer from 'react-native-track-player';

// Register the playback service at the absolute root of the application.
// This ensures that when Android triggers a background task (e.g., from the lock screen),
// the service is successfully registered before the React component tree mounts.
TrackPlayer.registerPlaybackService(() => require('./service'));

// This is the standard Expo Router entry point code.
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
