/**
 * TextSizeSheet Route (`/text-size-sheet`) — Native iOS 26 Liquid Glass `formSheet`
 * pop-up for adjusting hymn reading font size, modeled after Oyelo's Create Audio sheet.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../utils/haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getExpoSwiftUI, isIOSLiquidGlassAvailable } from '../utils/expoSwiftUI';
import {
  hasSanctuaryBrightnessOverride,
  readCurrentBrightness,
  restoreSanctuaryBrightness,
  setSanctuaryBrightness,
} from '../utils/sanctuaryBrightness';
import TextSizeSheet from '../components/TextSizeSheet';

const BASE_PX = 22;
const MIN_PX = 12;
const MAX_PX = 64;

export default function TextSizeSheetScreen() {
  const router = useRouter();
  const { theme, isDarkMode, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();
  const { t, hymnLanguage } = useLanguage();
  const swiftUI = getExpoSwiftUI();

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const lastHapticPxRef = useRef(currentPx);
  const [brightnessPct, setBrightnessPct] = useState<number | null>(null);
  const [brightnessOverridden, setBrightnessOverridden] = useState(() =>
    hasSanctuaryBrightnessOverride(),
  );
  const lastBrightnessStepRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void readCurrentBrightness().then((val) => {
      if (!active || val === null) return;
      const pct = Math.min(100, Math.max(8, Math.round(val * 100)));
      lastBrightnessStepRef.current = Math.round(pct / 5);
      setBrightnessPct(pct);
    });
    return () => {
      active = false;
    };
  }, []);

  if (Platform.OS !== 'ios' || !swiftUI) {
    return <TextSizeSheet visible onClose={() => router.back()} />;
  }

  const {
    Button,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    Section,
    Slider,
    Spacer,
    Text,
    VStack,
  } = swiftUI.ui;

  const {
    Animation,
    animation,
    buttonBorderShape,
    buttonStyle,
    contentTransition,
    controlSize,
    disabled,
    font,
    foregroundStyle,
    monospacedDigit,
    multilineTextAlignment,
    padding,
    tint,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const accentTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const isDefault = currentPx === BASE_PX;
  const hasGlass = isIOSLiquidGlassAvailable();
  const secondaryBtnStyle = hasGlass ? 'glass' : 'bordered';
  const primaryBtnStyle = hasGlass ? 'glassProminent' : 'borderedProminent';

  const applyPx = (nextVal: number) => {
    const clamped = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(nextVal)));
    if (clamped !== lastHapticPxRef.current) {
      lastHapticPxRef.current = clamped;
      Haptics.selectionAsync().catch(() => {});
    }
    setFontSizeMultiplier(clamped / BASE_PX);
  };

  const applyBrightnessPct = (nextPct: number) => {
    const clamped = Math.min(100, Math.max(8, Math.round(nextPct)));
    const stepBucket = Math.round(clamped / 5);
    if (lastBrightnessStepRef.current !== stepBucket) {
      lastBrightnessStepRef.current = stepBucket;
      Haptics.selectionAsync().catch(() => {});
    }
    setBrightnessPct(clamped);
    setBrightnessOverridden(true);
    void setSanctuaryBrightness(clamped / 100);
  };

  const resetBrightness = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBrightnessOverridden(false);
    void restoreSanctuaryBrightness().then((restored) => {
      if (typeof restored === 'number') {
        setBrightnessPct(Math.min(100, Math.max(8, Math.round(restored * 100))));
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={accentTint}>
        <VStack spacing={0} modifiers={[tint(accentTint)]}>
          {/* Sheet Header Bar (Oyelo Create Audio header layout) */}
          <HStack
            alignment="center"
            spacing={12}
            modifiers={[padding({ top: 18, horizontal: 20, bottom: 8 })]}
          >
            <Button
              label={t.textSizeReset}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                applyPx(BASE_PX);
              }}
              modifiers={[
                buttonStyle(secondaryBtnStyle),
                controlSize('small'),
                disabled(isDefault),
              ]}
            />
            <Spacer />
            <Text modifiers={[font({ textStyle: 'headline', weight: 'semibold' })]}>
              {t.textSizeTitle}
            </Text>
            <Spacer />
            <Button
              role="close"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              modifiers={[
                buttonStyle(primaryBtnStyle),
                buttonBorderShape('circle'),
                controlSize('small'),
              ]}
            />
          </HStack>

          <Form>
            {/* Live Hymn Lyrics Preview */}
            <Section>
              <VStack
                alignment="center"
                spacing={6}
                modifiers={[padding({ vertical: 10, horizontal: 6 })]}
              >
                <Text
                  modifiers={[
                    font({
                      design: 'serif',
                      weight: 'bold',
                      size: 18,
                    }),
                    foregroundStyle({ type: 'color', color: accentTint }),
                    multilineTextAlignment('center'),
                  ]}
                >
                  {hymnLanguage === 'en' ? 'How Great Thou Art!' : '¡Cuán Grande es Él!'}
                </Text>
                <Text
                  modifiers={[
                    font({
                      design: 'serif',
                      weight: 'regular',
                      size: Math.min(42, currentPx),
                    }),
                    multilineTextAlignment('center'),
                  ]}
                >
                  {t.textSizePreview}
                </Text>
              </VStack>
            </Section>

            {/* Size Readout, Native iOS 26 Slider, and Fine Step Buttons */}
            <Section>
              <LabeledContent label={t.fontSize}>
                <Text
                  modifiers={[
                    monospacedDigit(),
                    contentTransition('numericText'),
                    animation(Animation.default, currentPx),
                    font({ textStyle: 'body', weight: 'semibold' }),
                    foregroundStyle(secondaryStyle),
                  ]}
                >
                  {`${currentPx} px`}
                </Text>
              </LabeledContent>

              <Slider
                value={currentPx}
                min={MIN_PX}
                max={MAX_PX}
                step={1}
                onValueChange={applyPx}
              />

              <HStack alignment="center" spacing={12} modifiers={[padding({ vertical: 4 })]}>
                <Button
                  label="−"
                  systemImage="minus"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    applyPx(currentPx - 1);
                  }}
                  modifiers={[
                    buttonStyle(secondaryBtnStyle),
                    controlSize('regular'),
                    disabled(currentPx <= MIN_PX),
                  ]}
                />
                <Spacer />
                <Text
                  modifiers={[
                    monospacedDigit(),
                    font({ textStyle: 'subheadline', weight: 'medium' }),
                    foregroundStyle(secondaryStyle),
                  ]}
                >
                  {`${MIN_PX}–${MAX_PX} px`}
                </Text>
                <Spacer />
                <Button
                  label="+"
                  systemImage="plus"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    applyPx(currentPx + 1);
                  }}
                  modifiers={[
                    buttonStyle(secondaryBtnStyle),
                    controlSize('regular'),
                    disabled(currentPx >= MAX_PX),
                  ]}
                />
              </HStack>
            </Section>

            {/* Sanctuary Reading Brightness Slider (Apple Books style, auto-restores on reader exit) */}
            {brightnessPct !== null ? (
              <Section footer={<Text>{t.brightnessAutoRestoreHint}</Text>}>
                <LabeledContent
                  label={
                    <Label
                      title={t.brightnessTitle}
                      icon={
                        <SwiftUIImage
                          systemName="sun.max"
                          modifiers={[foregroundStyle({ type: 'color', color: accentTint })]}
                        />
                      }
                    />
                  }
                >
                  <HStack alignment="center" spacing={8}>
                    {brightnessOverridden ? (
                      <Button
                        label={t.brightnessReset}
                        onPress={resetBrightness}
                        modifiers={[buttonStyle('bordered'), controlSize('mini'), tint(accentTint)]}
                      />
                    ) : null}
                    <Text
                      modifiers={[
                        monospacedDigit(),
                        contentTransition('numericText'),
                        animation(Animation.default, brightnessPct),
                        font({ textStyle: 'body', weight: 'semibold' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {`${brightnessPct}%`}
                    </Text>
                  </HStack>
                </LabeledContent>

                <HStack alignment="center" spacing={10}>
                  <SwiftUIImage
                    systemName="sun.min"
                    size={15}
                    modifiers={[foregroundStyle(secondaryStyle)]}
                  />
                  <Slider
                    value={brightnessPct}
                    min={8}
                    max={100}
                    step={1}
                    onValueChange={applyBrightnessPct}
                  />
                  <SwiftUIImage
                    systemName="sun.max.fill"
                    size={17}
                    modifiers={[foregroundStyle({ type: 'color', color: accentTint })]}
                  />
                </HStack>
              </Section>
            ) : null}
          </Form>
        </VStack>
      </Host>
    </View>
  );
}
