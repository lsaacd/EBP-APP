import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNowPlaying } from '../../../context/NowPlayingContext';
import { isIOSLiquidGlassAvailable } from '../../../utils/expoSwiftUI';

export default function SettingsLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { showFullPlayer } = useNowPlaying();
  const isIOS = Platform.OS === 'ios';

  if (!isIOS) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  const isLiquidGlass = isIOSLiquidGlassAvailable();
  const titleColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerLargeTitleEnabled: true,
        headerTintColor: isDarkMode ? '#FFFFFF' : theme.primary,
        headerTitleStyle: { color: titleColor },
        headerLargeTitleStyle: { color: titleColor },
        headerUserInterfaceStyle: isDarkMode ? 'dark' : 'light',
        statusBarStyle: showFullPlayer || isDarkMode ? 'light' : 'dark',
        scrollEdgeEffects: {
          top: 'soft',
          bottom: 'automatic',
        },
        ...(isLiquidGlass
          ? {}
          : {
              headerTransparent: true,
              headerBlurEffect: isDarkMode ? 'dark' : 'light',
              headerLargeStyle: {
                backgroundColor: 'transparent',
              },
            }),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t.tabSettings,
          headerLargeTitle: true,
          headerLargeTitleEnabled: true,
        }}
      />
    </Stack>
  );
}
