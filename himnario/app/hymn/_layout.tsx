import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { restoreSanctuaryBrightness } from '../../utils/sanctuaryBrightness';

export default function HymnsLayout() {
  const { isDarkMode } = useTheme();
  const { showFullPlayer } = useNowPlaying();

  // Always restore the user's system brightness when leaving the Hymn Reader
  // or when the app moves into the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        void restoreSanctuaryBrightness();
      }
    });
    return () => {
      sub.remove();
      void restoreSanctuaryBrightness();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: showFullPlayer || isDarkMode ? 'light' : 'dark',
        contentStyle: {
          backgroundColor: isDarkMode ? '#1a1a16' : '#fcf9f2',
        },
      }}
    >
      {/* Hymn detail — uses a subtle fade for the initial open.
          The 3D page-flip transition handles the between-hymn navigation.
          Gestures are disabled so that only the × button closes the modal;
          swiping left/down will NOT navigate back. */}
      <Stack.Screen
        name="[id]"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
