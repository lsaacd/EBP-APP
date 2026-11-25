/**
 * SettingsScreen (iOS 26 Native SwiftUI Form) — Modeled after Oyelo's SettingsView & Inkigo's Form UI.
 *
 * Features:
 * - Direct root `<Host><Form>` (no outer `<View>` wrapper) so UIKit binds large-title
 *   collapse and NativeTabs `minimizeBehavior="onScrollDown"` cleanly to SwiftUI's Form.
 * - Monochrome SF Symbols & primary-ink action rows matching Oyelo's Settings aesthetic.
 * - Inline Liquid Glass hover Pickers for Appearance (System / Light / Dark) & Languages.
 * - Compact live hymn preview + native iOS 26 Slider for Font Size.
 * - Offline audio status, confirmation download, and delete controls.
 * - Interactive classic iOS warm-gold 5-star rating card + feedback & about links.
 */
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { useTheme, type AppearanceMode } from '../../theme/ThemeContext';
import { useLanguage, type Language } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { sendFeedbackEmail } from '../../utils/feedback';
import {
  offlineAudio,
  refreshOfflineAudio,
  downloadAllHymnAudio,
  cancelDownloadAll,
  deleteSavedHymnAudio,
} from '../../audio/offline-audio';
import { getExpoSwiftUI } from '../../utils/expoSwiftUI';
import AppShareSheet from '../AppShareSheet';
import SettingsLegacy from './Settings.legacy';

const BASE_PX = 22;
const MIN_PX = 12;
const MAX_PX = 64;
const STAR_INDICES = [1, 2, 3, 4, 5] as const;

function formatSize(bytes: number) {
  if (bytes <= 0) return '0 MB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

export default function SettingsScreenIOS() {
  const swiftUI = getExpoSwiftUI();
  const router = useRouter();
  const {
    theme,
    isDarkMode,
    appearanceMode,
    setAppearanceMode,
    fontSizeMultiplier,
    setFontSizeMultiplier,
  } = useTheme();
  const { t, language, hymnLanguage, setLanguage, setHymnLanguage } = useLanguage();
  const { user, isSyncing, syncBlocked, openAuthSheet } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  const [selectedStars, setSelectedStars] = useState(0);
  const [showShareApp, setShowShareApp] = useState(false);

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const lastHapticPxRef = useRef(currentPx);

  useEffect(() => {
    void refreshOfflineAudio();
  }, []);

  if (!swiftUI) {
    return <SettingsLegacy />;
  }

  const {
    Button,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    Picker,
    Section,
    Slider,
    Spacer,
    Text,
    VStack,
  } = swiftUI.ui;

  const {
    buttonBorderShape,
    buttonStyle,
    controlSize,
    font,
    foregroundStyle,
    monospacedDigit,
    multilineTextAlignment,
    opacity,
    padding,
    pickerStyle,
    scaleEffect,
    tag,
    tint,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const accentTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const monochromeInk = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const starGold = isDarkMode ? '#FFB800' : '#E59A00';
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;

  const downloading = offline.status === 'downloading';
  const complete = offline.saved >= offline.total && offline.total > 0;
  const hasFailed = offline.status === 'error' && offline.failed > 0;

  let downloadActionTitle = t.offlineAudioDownload;
  if (hasFailed) downloadActionTitle = t.offlineAudioRetry;
  else if (offline.started && offline.saved > 0) downloadActionTitle = t.offlineAudioResume;

  const syncStatusLabel = isSyncing
    ? t.authSyncingStatus
    : syncBlocked
      ? t.authSyncPausedStatus
      : t.authSyncedStatus;

  const applyFontPx = (nextVal: number) => {
    const clamped = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(nextVal)));
    if (clamped !== lastHapticPxRef.current) {
      lastHapticPxRef.current = clamped;
      Haptics.selectionAsync().catch(() => {});
    }
    setFontSizeMultiplier(clamped / BASE_PX);
  };

  const confirmDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t.offlineAudioConfirmTitle, t.offlineAudioConfirmBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      {
        text: t.offlineAudioConfirm,
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void downloadAllHymnAudio();
        },
      },
    ]);
  };

  const confirmDeleteOffline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t.offlineAudioDeleteTitle, t.offlineAudioDeleteBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      {
        text: t.offlineAudioDeleteConfirm,
        style: 'destructive',
        onPress: () => {
          void deleteSavedHymnAudio();
        },
      },
    ]);
  };

  const openRateApp = () => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL('https://apps.apple.com/app/id6794435414?action=write-review').catch(() => {});
  };

  const handleStarPress = (star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedStars(star);
  };

  const ratingSubtitle =
    selectedStars === 0
      ? t.rateAppSub
      : selectedStars >= 4
        ? t.rateStarsThanks
        : t.rateStarsImprove;

  const showFeedbackCta = selectedStars > 0 && selectedStars <= 3;

  const chevron = (
    <SwiftUIImage
      systemName="chevron.right"
      size={13}
      modifiers={[foregroundStyle(tertiaryStyle)]}
    />
  );

  return (
    <>
      <Host
        style={{ flex: 1 }}
        colorScheme={scheme}
        seedColor={monochromeInk}
      >
        <Form modifiers={[tint(monochromeInk)]}>
          {/* ─── Account & Cloud ─── */}
          <Section
            title={t.accountSectionLabel}
            footer={user ? undefined : <Text>{t.authSettingsCardHint}</Text>}
          >
            {user ? (
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push('/my-profile' as any);
                }}
              >
                <HStack alignment="center" spacing={10}>
                  <Label systemImage="person.crop.circle">
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                        {user.displayName || user.email.split('@')[0]}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {`${user.email} · ${syncStatusLabel}`}
                      </Text>
                    </VStack>
                  </Label>
                  <Spacer />
                  {chevron}
                </HStack>
              </Button>
            ) : (
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  openAuthSheet();
                }}
              >
                <HStack alignment="center" spacing={10}>
                  <Label systemImage="person.crop.circle.badge.plus">
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}>
                        {t.authSignIn}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {t.authMenuSignInSub}
                      </Text>
                    </VStack>
                  </Label>
                  <Spacer />
                  {chevron}
                </HStack>
              </Button>
            )}
          </Section>

          {/* ─── Appearance & Typography ─── */}
          <Section title={t.appearanceLabel}>
            <Picker
              label={t.appearanceLabel}
              systemImage="sun.max"
              selection={appearanceMode}
              onSelectionChange={(next) => {
                if (next === 'system' || next === 'light' || next === 'dark') {
                  Haptics.selectionAsync().catch(() => {});
                  setAppearanceMode(next as AppearanceMode);
                }
              }}
              modifiers={[pickerStyle('menu')]}
            >
              <Text modifiers={[tag('system')]}>{t.appearanceSystem}</Text>
              <Text modifiers={[tag('light')]}>{t.appearanceLight}</Text>
              <Text modifiers={[tag('dark')]}>{t.appearanceDark}</Text>
            </Picker>

            <LabeledContent
              label={
                <Label title={t.fontSize} systemImage="textformat.size" />
              }
            >
              <HStack alignment="center" spacing={8}>
                {currentPx !== BASE_PX && (
                  <Button
                    label={t.textSizeReset}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFontSizeMultiplier(1.0);
                    }}
                    modifiers={[buttonStyle('bordered'), controlSize('mini'), tint(accentTint)]}
                  />
                )}
                <Text
                  modifiers={[
                    monospacedDigit(),
                    font({ textStyle: 'body', weight: 'semibold' }),
                    foregroundStyle(secondaryStyle),
                  ]}
                >
                  {`${currentPx} px`}
                </Text>
              </HStack>
            </LabeledContent>

            <Slider
              value={currentPx}
              min={MIN_PX}
              max={MAX_PX}
              step={1}
              onValueChange={applyFontPx}
              modifiers={[tint(accentTint)]}
            />

            <HStack alignment="center">
              <Spacer />
              <VStack
                alignment="center"
                spacing={6}
                modifiers={[padding({ vertical: 8, horizontal: 4 })]}
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
                  {hymnLanguage === 'en'
                    ? 'O Lord my God, when I in awesome wonder…'
                    : 'Señor, mi Dios, al contemplar los cielos…'}
                </Text>
              </VStack>
              <Spacer />
            </HStack>
          </Section>

          {/* ─── Languages ─── */}
          <Section title={t.languagesSectionTitle}>
            <Picker
              label={t.appLanguage}
              systemImage="globe"
              selection={language}
              onSelectionChange={(next) => {
                if (next === 'es' || next === 'en') {
                  Haptics.selectionAsync().catch(() => {});
                  setLanguage(next as Language);
                }
              }}
              modifiers={[pickerStyle('menu')]}
            >
              <Text modifiers={[tag('es')]}>{t.spanish}</Text>
              <Text modifiers={[tag('en')]}>{t.english}</Text>
            </Picker>

            <Picker
              label={t.hymnLanguage}
              systemImage="character.book.closed"
              selection={hymnLanguage}
              onSelectionChange={(next) => {
                if (next === 'es' || next === 'en') {
                  Haptics.selectionAsync().catch(() => {});
                  setHymnLanguage(next as Language);
                }
              }}
              modifiers={[pickerStyle('menu')]}
            >
              <Text modifiers={[tag('es')]}>{t.spanish}</Text>
              <Text modifiers={[tag('en')]}>{t.english}</Text>
            </Picker>
          </Section>

          {/* ─── Offline Audio ─── */}
          <Section
            title={t.offlineAudioSectionLabel}
            footer={
              <Text>
                {downloading
                  ? offline.cancelling
                    ? t.offlineAudioCancelling
                    : t.offlineAudioDownloading
                  : complete
                    ? t.offlineAudioDone
                    : t.offlineAudioWifiHint}
              </Text>
            }
          >
            <LabeledContent
              label={
                <Label title={t.offlineAudioTitle} systemImage="arrow.down.circle" />
              }
            >
              <Text
                modifiers={[
                  monospacedDigit(),
                  foregroundStyle(secondaryStyle),
                ]}
              >
                {`${offline.saved}/${offline.total}${
                  offline.bytes > 0 ? ` · ${formatSize(offline.bytes)}` : ''
                }`}
              </Text>
            </LabeledContent>

            {downloading ? (
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelDownloadAll();
                }}
              >
                <Label
                  title={offline.cancelling ? t.offlineAudioCancelling : t.offlineAudioCancel}
                  systemImage="pause.circle"
                />
              </Button>
            ) : !complete ? (
              <Button
                modifiers={[foregroundStyle(primaryStyle)]}
                onPress={
                  hasFailed || offline.started
                    ? () => void downloadAllHymnAudio()
                    : confirmDownload
                }
              >
                <Label title={downloadActionTitle} systemImage="icloud.and.arrow.down" />
              </Button>
            ) : null}

            {!downloading && offline.saved > 0 && (
              <Button role="destructive" onPress={confirmDeleteOffline}>
                <Label title={t.offlineAudioDelete} systemImage="trash" />
              </Button>
            )}
          </Section>

          {/* ─── Classic iOS Warm-Gold 5-Star Rating Card ─── */}
          <Section title={t.rateApp}>
            <HStack alignment="center">
              <Spacer />
              <VStack
                alignment="center"
                spacing={10}
                modifiers={[padding({ vertical: 10, horizontal: 6 })]}
              >
                <HStack alignment="center" spacing={10}>
                  {STAR_INDICES.map((star) => {
                    const isFilled = selectedStars === 0 || star <= selectedStars;
                    const restOpacity = 1 - Math.abs(star - 3) * 0.14;
                    return (
                      <Button
                        key={star}
                        modifiers={[
                          buttonStyle('borderless'),
                          scaleEffect(star === selectedStars ? 1.14 : 1),
                        ]}
                        onPress={() => handleStarPress(star)}
                      >
                        <SwiftUIImage
                          systemName={isFilled ? 'star.fill' : 'star'}
                          size={28}
                          modifiers={[
                            foregroundStyle(
                              isFilled
                                ? { type: 'color', color: starGold }
                                : tertiaryStyle,
                            ),
                            opacity(selectedStars === 0 ? restOpacity : 1),
                          ]}
                        />
                      </Button>
                    );
                  })}
                </HStack>

                <Text
                  modifiers={[
                    font({ design: 'serif', weight: 'bold', size: 19 }),
                    foregroundStyle(primaryStyle),
                    multilineTextAlignment('center'),
                  ]}
                >
                  {t.rateApp}
                </Text>

                <Text
                  modifiers={[
                    font({ design: 'serif', textStyle: 'subheadline' }),
                    foregroundStyle(secondaryStyle),
                    multilineTextAlignment('center'),
                  ]}
                >
                  {ratingSubtitle}
                </Text>

                <Button
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    tint(theme.primary),
                    padding({ top: 4 }),
                  ]}
                  onPress={
                    showFeedbackCta
                      ? () => {
                          Haptics.selectionAsync().catch(() => {});
                          sendFeedbackEmail(language);
                        }
                      : openRateApp
                  }
                >
                  <HStack alignment="center" spacing={6} modifiers={[padding({ horizontal: 8, vertical: 2 })]}>
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: theme.onPrimary }),
                      ]}
                    >
                      {showFeedbackCta ? t.sendFeedback : t.rateAppButton}
                    </Text>
                    <SwiftUIImage
                      systemName={showFeedbackCta ? 'envelope' : 'arrow.up.right'}
                      size={13}
                      modifiers={[foregroundStyle({ type: 'color', color: theme.onPrimary })]}
                    />
                  </HStack>
                </Button>
              </VStack>
              <Spacer />
            </HStack>
          </Section>

          {/* ─── Support & About ─── */}
          <Section
            title={t.supportSectionTitle}
            footer={
              <HStack alignment="center">
                <Spacer />
                <VStack
                  alignment="center"
                  spacing={4}
                  modifiers={[
                    padding({
                      top: 12,
                      bottom: hasMiniPlayer ? 88 : 28,
                    }),
                  ]}
                >
                  <Text
                    modifiers={[
                      font({ design: 'serif', textStyle: 'body' }),
                      foregroundStyle(secondaryStyle),
                      multilineTextAlignment('center'),
                    ]}
                  >
                    {t.signatureQuote}
                  </Text>
                  <Text
                    modifiers={[
                      font({ textStyle: 'footnote' }),
                      foregroundStyle(tertiaryStyle),
                      multilineTextAlignment('center'),
                    ]}
                  >
                    {`v ${Constants.expoConfig?.version ?? '2.1.0'} — Solo A Dios La Gloria`}
                  </Text>
                </VStack>
                <Spacer />
              </HStack>
            }
          >
            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                sendFeedbackEmail(language);
              }}
            >
              <HStack alignment="center">
                <Label title={t.sendFeedback} systemImage="envelope" />
                <Spacer />
                {chevron}
              </HStack>
            </Button>

            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowShareApp(true);
              }}
            >
              <HStack alignment="center">
                <Label title={t.authShareAppRow} systemImage="square.and.arrow.up" />
                <Spacer />
                {chevron}
              </HStack>
            </Button>

            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push('/about-sheet' as any);
              }}
            >
              <HStack alignment="center">
                <Label title={t.about} systemImage="info.circle" />
                <Spacer />
                {chevron}
              </HStack>
            </Button>
          </Section>
        </Form>
      </Host>

      <AppShareSheet visible={showShareApp} onClose={() => setShowShareApp(false)} />
    </>
  );
}
