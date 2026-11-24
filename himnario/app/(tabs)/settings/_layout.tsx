import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { isIOSLiquidGlassAvailable } from '../../../utils/expoSwiftUI';

export default function SettingsLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const isIOS = Platform.OS === 'ios';

  if (!isIOS) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: isIOSLiquidGlassAvailable()
          ? undefined
          : isDarkMode
            ? 'dark'
            : 'light',
        headerLargeStyle: {
          backgroundColor: 'transparent',
        },
        headerTintColor: isDarkMode ? '#ffffff' : theme.primary,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t.tabSettings,
        }}
      />
    </Stack>
  );
}
