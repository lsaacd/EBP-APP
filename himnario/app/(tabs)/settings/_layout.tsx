import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useNowPlaying } from '../../../context/NowPlayingContext';

export default function SettingsLayout() {
  const { isDarkMode } = useTheme();
  const { showFullPlayer } = useNowPlaying();
  const isIOS = Platform.OS === 'ios';

  if (!isIOS) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: showFullPlayer || isDarkMode ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
