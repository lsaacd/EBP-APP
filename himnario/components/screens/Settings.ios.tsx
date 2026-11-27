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
import { Alert, Linking, Platform, StyleSheet, Text as RNText, View } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage, type Language } from '../../context/LanguageContext';
import { useAuth, computeUserInitials } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { sendFeedbackEmail } from '../../utils/feedback';
import {
  offlineAudio,
  refreshOfflineAudio,
  downloadAllHymnAudio,
  cancelDownloadAll,
  deleteSavedHymnAudio,
} from '../../audio/offline-audio';
import { getExpoSwiftUI, type ExpoSwiftUIBundle } from '../../utils/expoSwiftUI';
import WhatsNewSheet from '../WhatsNewSheet';
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
  if (!swiftUI) {
    return <SettingsLegacy />;
  }
  return <SettingsSwiftUIContent swiftUI={swiftUI} />;
}

function SettingsSwiftUIContent({ swiftUI }: { swiftUI: ExpoSwiftUIBundle }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPad = Platform.OS === 'ios' && Boolean((Platform as any).isPad);
  const {
    theme,
    isDarkMode,
    setAppearanceMode,
    fontSizeMultiplier,
    setFontSizeMultiplier,
  } = useTheme();
  const { t, language, hymnLanguage, setLanguage, setHymnLanguage } = useLanguage();
  const { user, isSyncing, syncBlocked, openAuthSheet } = useAuth();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  const [selectedStars, setSelectedStars] = useState(0);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const lastHapticPxRef = useRef(currentPx);
  const firstEventTime = useSharedValue(0);
  const lastContainerW = useSharedValue(0);
  const restOffsetY = useSharedValue<number | null>(null);
  const scrollDelta = useSharedValue(0);

  const scrollGeometryModifier = swiftUI.modifiers.useScrollGeometryChange((g) => {
    'worklet';
    const y = g.contentOffsetY;
    const now = Date.now();
    if (lastContainerW.value !== 0 && Math.abs(g.containerWidth - lastContainerW.value) > 1) {
      firstEventTime.value = now;
      restOffsetY.value = y;
    }
    lastContainerW.value = g.containerWidth;
    if (firstEventTime.value === 0) {
      firstEventTime.value = now;
    }
    if (restOffsetY.value === null) {
      restOffsetY.value = y;
    } else if (y < restOffsetY.value && now - firstEventTime.value < 400) {
      restOffsetY.value = y;
    }
    scrollDelta.value = Math.max(0, y - (restOffsetY.value ?? y));
  });

  useEffect(() => {
    void refreshOfflineAudio();
  }, []);

  const {
    Button,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    LabeledContent,
    Picker,
    RNHostView,
    Section,
    Slider,
    Spacer,
    Text,
    Toggle,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    Animation,
    animation,
    buttonBorderShape,
    buttonStyle,
    contentTransition,
    controlSize,
    font,
    foregroundStyle,
    frame,
    listRowBackground,
    listRowInsets,
    listSectionMargins,
    listSectionSpacing,
    monospacedDigit,
    multilineTextAlignment,
    opacity,
    padding,
    pickerStyle,
    scaleEffect,
    scrollEdgeEffectStyle,
    tag,
    tint,
  } = swiftUI.modifiers;

  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollDelta.value, [14, 42], [0, 1], Extrapolation.CLAMP),
  }));

  const stickyTitleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollDelta.value, [14, 42], [6, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const scheme = isDarkMode ? 'dark' : 'light';
  const accentTint = isDarkMode ? '#fdf9f2' : theme.primary;
  const symbolTint = isDarkMode ? '#FFFFFF' : theme.primary;
  const starFilledColor = isDarkMode ? '#fdf9f2' : theme.primary;
  const starUnselectedColor = isDarkMode ? '#525252' : '#C99EA2';
  const ctaFillColor = theme.primary;
  const ctaInkColor = theme.onPrimary;
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
    void (async () => {
      try {
        if (await StoreReview.isAvailableAsync()) {
          await StoreReview.requestReview();
          return;
        }
      } catch {
        // Fall back to App Store review URL
      }
      Linking.openURL('https://apps.apple.com/app/id6794435414?action=write-review').catch(() => {});
    })();
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

  const renderTintedIcon = (systemName: any) => (
    <SwiftUIImage
      systemName={systemName}
      modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
    />
  );

  const formModifiers = [
    tint(symbolTint),
    listSectionSpacing('compact'),
    scrollEdgeEffectStyle('soft', 'all'),
    ...(scrollGeometryModifier ? [scrollGeometryModifier] : []),
  ];

  const stickyBarTop = isPad ? Math.max(insets.top, 20) + 48 : insets.top;

  return (
    <View style={settingsStyles.root}>
      <Host
        style={settingsStyles.root}
        colorScheme={scheme}
        seedColor={symbolTint}
      >
        <Form modifiers={formModifiers}>
          {/* ─── Tight Large Title (zero dead space above; collapses into floating blur bar on scroll) ─── */}
          <Section modifiers={[listSectionMargins({ edges: 'top', length: 0 })]}>
            <Text
              modifiers={[
                font({ size: 34, weight: 'bold' }),
                foregroundStyle(primaryStyle),
                listRowBackground('clear'),
                listRowInsets({
                  top: isPad ? 52 : 4,
                  leading: 20,
                  bottom: 0,
                  trailing: 20,
                }),
              ]}
            >
              {t.tabSettings}
            </Text>
          </Section>

          {/* ─── Account & Cloud ─── */}
          <Section
            title={t.accountSectionLabel}
            modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
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
                <HStack alignment="center" spacing={12}>
                  {user.avatarUrl && typeof RNHostView === 'function' ? (
                    <>
                      <ZStack
                        alignment="center"
                        modifiers={[frame({ width: 38, height: 38 })]}
                      >
                        <RNHostView matchContents>
                          <UserAvatar
                            uri={user.avatarUrl}
                            initials={
                              user.initials ||
                              computeUserInitials(user.displayName, user.email)
                            }
                            size={38}
                            backgroundColor={isDarkMode ? '#F3EEE8' : '#6e1619'}
                            textColor={isDarkMode ? '#1A1A1A' : '#FFFFFF'}
                          />
                        </RNHostView>
                      </ZStack>
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
                    </>
                  ) : (
                    <Label icon={renderTintedIcon('person.crop.circle')}>
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
                  )}
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
                  <Label icon={renderTintedIcon('person.crop.circle.badge.plus')}>
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
            <Toggle
              isOn={isDarkMode}
              onIsOnChange={(nextOn) => {
                Haptics.selectionAsync().catch(() => {});
                setAppearanceMode(nextOn ? 'dark' : 'light');
              }}
              modifiers={[tint(isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary)]}
            >
              <Label
                title={t.darkModeTitle}
                icon={renderTintedIcon(isDarkMode ? 'moon.fill' : 'sun.max')}
                modifiers={[foregroundStyle(primaryStyle)]}
              />
            </Toggle>

            <LabeledContent
              label={
                <Label
                  title={t.fontSize}
                  icon={renderTintedIcon('textformat.size')}
                />
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
                    contentTransition('numericText'),
                    animation(Animation.default, currentPx),
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
                spacing={8}
                modifiers={[padding({ vertical: 10, horizontal: 6 })]}
              >
                <Text
                  modifiers={[
                    font({
                      design: 'serif',
                      weight: 'bold',
                      size: Math.min(38, Math.max(28, Math.round(currentPx * 1.45))),
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
              label={
                <Label
                  title={t.appLanguage}
                  icon={renderTintedIcon('globe')}
                />
              }
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
              label={
                <Label
                  title={t.hymnLanguage}
                  icon={renderTintedIcon('character.book.closed')}
                />
              }
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
                <Label
                  title={t.offlineAudioTitle}
                  icon={renderTintedIcon('arrow.down.circle')}
                />
              }
            >
              <Text
                modifiers={[
                  monospacedDigit(),
                  contentTransition('numericText'),
                  animation(Animation.default, offline.saved),
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
                  icon={renderTintedIcon('pause.circle')}
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
                <Label
                  title={downloadActionTitle}
                  icon={renderTintedIcon('icloud.and.arrow.down')}
                />
              </Button>
            ) : null}

            {!downloading && offline.saved > 0 && (
              <Button role="destructive" onPress={confirmDeleteOffline}>
                <Label title={t.offlineAudioDelete} systemImage="trash" />
              </Button>
            )}
          </Section>

          {/* ─── Sacred Ink 5-Star Rating Card (Dark Red Light / Warm White Dark) ─── */}
          <Section title={t.rateApp}>
            <HStack alignment="center">
              <Spacer />
              <VStack
                alignment="center"
                spacing={12}
                modifiers={[padding({ vertical: 14, horizontal: 8 })]}
              >
                <HStack alignment="center" spacing={12}>
                  {STAR_INDICES.map((star) => {
                    const isFilled = selectedStars === 0 || star <= selectedStars;
                    const restOpacity = 1 - Math.abs(star - 3) * 0.12;
                    return (
                      <Button
                        key={star}
                        modifiers={[
                          buttonStyle('borderless'),
                          scaleEffect(star === selectedStars ? 1.16 : 1),
                        ]}
                        onPress={() => handleStarPress(star)}
                      >
                        <SwiftUIImage
                          systemName={isFilled ? 'star.fill' : 'star'}
                          size={30}
                          modifiers={[
                            foregroundStyle({
                              type: 'color',
                              color: isFilled ? starFilledColor : starUnselectedColor,
                            }),
                            opacity(selectedStars === 0 ? restOpacity : 1),
                          ]}
                        />
                      </Button>
                    );
                  })}
                </HStack>

                <VStack alignment="center" spacing={4}>
                  <Text
                    modifiers={[
                      font({ design: 'serif', weight: 'bold', size: 20 }),
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
                </VStack>

                <Button
                  modifiers={[
                    buttonStyle('borderedProminent'),
                    buttonBorderShape('capsule'),
                    tint(ctaFillColor),
                    padding({ top: 2 }),
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
                  <HStack alignment="center" spacing={6} modifiers={[padding({ horizontal: 12, vertical: 4 })]}>
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: ctaInkColor }),
                      ]}
                    >
                      {showFeedbackCta ? t.sendFeedback : t.rateAppButton}
                    </Text>
                    <SwiftUIImage
                      systemName={showFeedbackCta ? 'envelope' : 'arrow.up.right'}
                      size={13}
                      modifiers={[foregroundStyle({ type: 'color', color: ctaInkColor })]}
                    />
                  </HStack>
                </Button>

                {showFeedbackCta && (
                  <Button
                    modifiers={[buttonStyle('borderless'), padding({ top: 2 })]}
                    onPress={openRateApp}
                  >
                    <HStack alignment="center" spacing={4}>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote', weight: 'medium' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {t.rateAppButton}
                      </Text>
                      <SwiftUIImage
                        systemName="arrow.up.right"
                        size={11}
                        modifiers={[foregroundStyle(secondaryStyle)]}
                      />
                    </HStack>
                  </Button>
                )}
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
                <Label title={t.sendFeedback} icon={renderTintedIcon('envelope')} />
                <Spacer />
                {chevron}
              </HStack>
            </Button>

            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push({
                  pathname: '/auth-sheet',
                  params: { page: 'share-app', from: '/(tabs)/settings', noBack: '1' },
                } as any);
              }}
            >
              <HStack alignment="center">
                <Label title={t.authShareAppRow} icon={renderTintedIcon('square.and.arrow.up')} />
                <Spacer />
                {chevron}
              </HStack>
            </Button>

            <Button
              modifiers={[foregroundStyle(primaryStyle)]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowWhatsNew(true);
              }}
            >
              <HStack alignment="center">
                <Label title={t.settingsWhatsNewRow} icon={renderTintedIcon('sparkles')} />
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
                <Label title={t.about} icon={renderTintedIcon('info.circle')} />
                <Spacer />
                {chevron}
              </HStack>
            </Button>
          </Section>
        </Form>
      </Host>

      {/* ─── Scroll-reactive soft blur compact header ("Ajustes" small title on scroll) ─── */}
      <Animated.View
        pointerEvents="none"
        style={[
          settingsStyles.stickyHeader,
          { height: stickyBarTop + 46 },
          stickyHeaderStyle,
        ]}
      >
        <BlurView
          intensity={isDarkMode ? 52 : 62}
          tint={isDarkMode ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={[StyleSheet.absoluteFill, { bottom: 6 }]}
        />
        <LinearGradient
          colors={[
            isDarkMode ? 'rgba(0,0,0,0.52)' : 'rgba(242,242,247,0.68)',
            isDarkMode ? 'rgba(0,0,0,0.22)' : 'rgba(242,242,247,0.28)',
            'transparent',
          ]}
          locations={[0, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            settingsStyles.stickyTitleWrap,
            { top: stickyBarTop },
            stickyTitleStyle,
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              settingsStyles.stickyTitleText,
              { color: isDarkMode ? '#FFFFFF' : '#000000' },
            ]}
          >
            {t.tabSettings}
          </RNText>
        </Animated.View>
      </Animated.View>

      <WhatsNewSheet visible={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyTitleWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitleText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.25,
  },
});
