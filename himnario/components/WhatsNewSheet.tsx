/**
 * WhatsNewSheet — One-time release highlights sheet shown once per major update
 * (modeled after Duo's WhatsNewSheet.swift).
 *
 * - On iOS 26+: Renders via native SwiftUI `<BottomSheet>` with `.large` detent,
 *   large bold header, cross-free SF Symbol rows, and a prominent Sacred Ink capsule CTA.
 * - On Android / Web / pre-SwiftUI iOS: Renders a clean elevated native sheet Modal.
 */
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import { WHATS_NEW_ITEMS, WHATS_NEW_VERSION } from '../data/whatsNewCatalog';
import { getExpoSwiftUI } from '../utils/expoSwiftUI';
import * as Haptics from '../utils/haptics';
import AppMenuIcon from './AppMenuIcon';

export interface WhatsNewSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function WhatsNewSheet({ visible, onClose }: WhatsNewSheetProps) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const swiftUI = getExpoSwiftUI();
  const es = language !== 'en';

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  };

  if (Platform.OS === 'ios' && swiftUI) {
    const {
      BottomSheet,
      Button,
      Group,
      Host,
      HStack,
      Image: SwiftUIImage,
      RoundedRectangle,
      ScrollView: SwiftUIScrollView,
      Spacer,
      Text,
      VStack,
      ZStack,
    } = swiftUI.ui;

    const {
      buttonBorderShape,
      buttonStyle,
      controlSize,
      font,
      foregroundStyle,
      frame,
      padding,
      preferredColorScheme,
      presentationDetents,
      presentationDragIndicator,
      scrollEdgeEffectStyle,
      tint,
    } = swiftUI.modifiers;

    const scheme = isDarkMode ? 'dark' : 'light';
    const accent = isDarkMode ? '#FDF9F2' : '#6E1619';
    const prominentFill = isDarkMode ? '#FDF9F2' : '#6E1619';
    const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
    const iconWell = isDarkMode ? '#242428' : '#F2EAE4';
    const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
    const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };

    return (
      <Host
        style={{ position: 'absolute', width: 0, height: 0 }}
        colorScheme={scheme}
        seedColor={accent}
      >
        <BottomSheet
          isPresented={visible}
          onIsPresentedChange={(next) => {
            if (!next) onClose();
          }}
          onDismiss={onClose}
        >
          <Group
            modifiers={[
              presentationDetents(['large']),
              presentationDragIndicator('visible'),
              preferredColorScheme(scheme),
            ]}
          >
            <VStack spacing={0} modifiers={[tint(accent)]}>
              <SwiftUIScrollView modifiers={[scrollEdgeEffectStyle('soft', 'all')]}>
                <VStack
                  alignment="leading"
                  spacing={24}
                  modifiers={[padding({ horizontal: 26, top: 34, bottom: 20 })]}
                >
                  <VStack alignment="leading" spacing={6}>
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: accent }),
                      ]}
                    >
                      {`${t.whatsNewVersionPrefix} ${WHATS_NEW_VERSION}`}
                    </Text>
                    <Text
                      modifiers={[
                        font({ design: 'serif', size: 32, weight: 'bold' }),
                        foregroundStyle(primaryStyle),
                      ]}
                    >
                      {t.whatsNewTitle}
                    </Text>
                  </VStack>

                  {WHATS_NEW_ITEMS.map((item) => (
                    <HStack key={item.id} alignment="top" spacing={16}>
                      <ZStack alignment="center">
                        <RoundedRectangle
                          cornerRadius={14}
                          modifiers={[
                            foregroundStyle({ type: 'color', color: iconWell }),
                            frame({ width: 48, height: 48 }),
                          ]}
                        />
                        <SwiftUIImage
                          systemName={item.iosIcon}
                          size={22}
                          modifiers={[foregroundStyle({ type: 'color', color: accent })]}
                        />
                      </ZStack>
                      <VStack alignment="leading" spacing={4}>
                        <Text
                          modifiers={[
                            font({ textStyle: 'headline', weight: 'semibold' }),
                            foregroundStyle(primaryStyle),
                          ]}
                        >
                          {es ? item.titleEs : item.titleEn}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'subheadline' }),
                            foregroundStyle(secondaryStyle),
                          ]}
                        >
                          {es ? item.bodyEs : item.bodyEn}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </SwiftUIScrollView>

              <VStack modifiers={[padding({ horizontal: 24, top: 12, bottom: 18 })]}>
                <Button
                  onPress={handleDismiss}
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    controlSize('large'),
                    tint(prominentFill),
                  ]}
                >
                  <HStack alignment="center">
                    <Spacer />
                    <Text
                      modifiers={[
                        font({ textStyle: 'body', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: prominentInk }),
                      ]}
                    >
                      {t.whatsNewContinue}
                    </Text>
                    <Spacer />
                  </HStack>
                </Button>
              </VStack>
            </VStack>
          </Group>
        </BottomSheet>
      </Host>
    );
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <View
        style={[
          styles.fallbackRoot,
          {
            backgroundColor: theme.background,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.fallbackScroll}
          showsVerticalScrollIndicator={false}
        >
          <RNText style={[styles.eyebrow, { color: theme.primary }]}>
            {`${t.whatsNewVersionPrefix} ${WHATS_NEW_VERSION}`}
          </RNText>
          <RNText style={[styles.title, { color: theme.onSurface }]}>
            {t.whatsNewTitle}
          </RNText>

          <View style={styles.list}>
            {WHATS_NEW_ITEMS.map((item) => (
              <View key={item.id} style={styles.row}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.08)'
                        : theme.primary + '14',
                    },
                  ]}
                >
                  <AppMenuIcon
                    ios={item.iosIcon}
                    android={item.androidIcon}
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <RNText style={[styles.rowTitle, { color: theme.onSurface }]}>
                    {es ? item.titleEs : item.titleEn}
                  </RNText>
                  <RNText style={[styles.rowBody, { color: theme.onSurfaceVariant }]}>
                    {es ? item.bodyEs : item.bodyEn}
                  </RNText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <RNText style={[styles.ctaText, { color: theme.onPrimary }]}>
              {t.whatsNewContinue}
            </RNText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fallbackRoot: {
    flex: 1,
  },
  fallbackScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    ...fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    ...fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 26,
  },
  list: {
    gap: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    ...fonts.sansBold,
    fontSize: 16,
  },
  rowBody: {
    ...fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  cta: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...fonts.sansBold,
    fontSize: 16,
  },
});
