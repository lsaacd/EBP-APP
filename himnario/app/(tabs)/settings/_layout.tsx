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
        headerLargeTitle: false,
        headerLargeTitleEnabled: false,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTintColor: isDarkMode ? '#FFFFFF' : theme.primary,
        headerTitleStyle: { color: titleColor },
        headerUserInterfaceStyle: isDarkMode ? 'dark' : 'light',
        statusBarStyle: showFullPlayer || isDarkMode ? 'light' : 'dark',
        scrollEdgeEffects: {
          top: 'soft',
          bottom: 'soft',
        },
        ...(isLiquidGlass
          ? {}
          : {
              headerBlurEffect: isDarkMode ? 'dark' : 'light',
            }),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t.tabSettings,
          headerLargeTitle: false,
          headerLargeTitleEnabled: false,
        }}
      />
    </Stack>
  );
}
