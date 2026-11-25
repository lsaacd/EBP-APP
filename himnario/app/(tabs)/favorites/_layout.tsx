import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useNowPlaying } from '../../../context/NowPlayingContext';

export default function FavoritesLayout() {
  const { isDarkMode } = useTheme();
  const { showFullPlayer } = useNowPlaying();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: showFullPlayer || isDarkMode ? 'light' : 'dark',
        contentStyle: {
          backgroundColor: isDarkMode ? '#010101' : '#fcf9f2',
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="playlist/[id]" />
    </Stack>
  );
}
