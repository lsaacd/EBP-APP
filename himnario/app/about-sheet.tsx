/**
 * AboutSheet Route (`/about-sheet`) — Native iOS 26 Liquid Glass `formSheet`
 * presenting AboutHymnalContent cleanly above the Settings tab.
 */
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../utils/haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import AboutHymnalContent from '../components/AboutHymnalContent';
import AppMenuIcon from '../components/AppMenuIcon';
import { isIOSLiquidGlassAvailable } from '../utils/expoSwiftUI';

export default function AboutSheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const isIOS = Platform.OS === 'ios';
  const hasGlass = isIOSLiquidGlassAvailable();
  const headerAccent = isDarkMode ? '#ffffff' : theme.primary;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor:
            isIOS && hasGlass ? 'transparent' : theme.background,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: t.about,
          headerRight: isIOS
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.close}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  style={({ pressed }) => [
                    styles.headerCloseBtn,
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <AppMenuIcon
                    ios="xmark"
                    android="close"
                    color={headerAccent}
                    size={18}
                    containerSize={20}
                    weight="semibold"
                  />
                </Pressable>
              )
            : undefined,
        }}
      />

      {!isIOS && (
        <View style={[styles.fallbackHeader, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.fallbackTitle, { color: theme.onSurface }]}>{t.about}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.close}
            onPress={() => router.back()}
            style={[styles.fallbackCloseBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.fallbackCloseText, { color: theme.onPrimary }]}>
              {t.close}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
        showsVerticalScrollIndicator
        indicatorStyle={isDarkMode ? 'white' : 'black'}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        <AboutHymnalContent />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerCloseBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  fallbackTitle: {
    ...fonts.sansBold,
    fontSize: 18,
  },
  fallbackCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fallbackCloseText: {
    ...fonts.sansSemiBold,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
