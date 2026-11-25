/**
 * SettingsScreen (Android Material 3 Expressive Jetpack Compose) — Modeled after
 * Beto's `kujun-habits/SettingsScreen.android.tsx` with full Sacred Ink parity.
 *
 * Uses `@expo/ui/jetpack-compose` (`Host`, `LazyColumn`, `ListItem`, `Switch`,
 * `SingleChoiceSegmentedButtonRow`, `SegmentedButton`, `Slider`, `useMaterialColors`,
 * `Shapes.RoundedCorner(20)`).
 */
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Column,
  FilledTonalButton,
  Host,
  LazyColumn,
  ListItem,
  OutlinedButton,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Slider,
  Spacer,
  Switch,
  Text,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  clip,
  fillMaxWidth,
  height,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../theme/ThemeContext';
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
import { ANDROID_BOTTOM_BAR_HEIGHT, androidBottomInset } from '../androidBottomLayout';
import AboutHymnalContent from '../AboutHymnalContent';
import AppShareSheet from '../AppShareSheet';
import WhatsNewSheet from '../WhatsNewSheet';

const BASE_PX = 22;
const MIN_PX = 12;
const MAX_PX = 64;
const ROW_SHAPE = Shapes.RoundedCorner(20);
const SEED_COLOR = '#6E1619';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.elbuenpastor.himnario';

function formatSize(bytes: number) {
  if (bytes <= 0) return '0 MB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
      <Text style={{ typography: 'labelLarge', fontWeight: '700' }}>{title}</Text>
      <Column verticalArrangement={{ spacedBy: 3 }}>{children}</Column>
    </Column>
  );
}

function ActionRow({
  label,
  supporting,
  value,
  destructive = false,
  materialColors,
  onPress,
}: {
  label: string;
  supporting?: string;
  value?: string;
  destructive?: boolean;
  materialColors: MaterialColors;
  onPress: () => void;
}) {
  return (
    <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE), clickable(onPress)]}>
      <ListItem.HeadlineContent>
        <Text
          color={destructive ? materialColors.error : undefined}
          style={{ typography: 'titleMedium' }}
        >
          {label}
        </Text>
      </ListItem.HeadlineContent>
      {supporting ? (
        <ListItem.SupportingContent>
          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
            {supporting}
          </Text>
        </ListItem.SupportingContent>
      ) : null}
      <ListItem.TrailingContent>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
          {value ? (
            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
              {value}
            </Text>
          ) : null}
          <Text color={materialColors.onSurfaceVariant} style={{ typography: 'titleLarge' }}>
            ›
          </Text>
        </Row>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export default function SettingsScreenAndroid() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [showAbout, setShowAbout] = useState(false);
  const [showShareApp, setShowShareApp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const colorScheme = isDarkMode ? 'dark' : 'light';
  const materialColors = useMaterialColors({
    colorScheme,
    seedColor: SEED_COLOR,
  });

  useEffect(() => {
    void refreshOfflineAudio();
  }, []);

  const currentPx = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(BASE_PX * fontSizeMultiplier)));
  const hasMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;
  const bottomPad =
    ANDROID_BOTTOM_BAR_HEIGHT + androidBottomInset(insets.bottom) + (hasMiniPlayer ? 84 : 24);

  const syncStatusLabel = isSyncing
    ? t.authSyncingStatus
    : syncBlocked
      ? t.authSyncPausedStatus
      : t.authSyncedStatus;

  const downloading = offline.status === 'downloading';
  const complete = offline.total > 0 && offline.saved >= offline.total;
  const hasFailed = offline.status === 'error' && offline.failed > 0;
  const downloadActionTitle = hasFailed
    ? t.offlineAudioRetry
    : offline.started && offline.saved > 0
      ? t.offlineAudioResume
      : t.offlineAudioDownload;

  const confirmDownload = () => {
    Alert.alert(t.offlineAudioConfirmTitle, t.offlineAudioConfirmBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      {
        text: t.offlineAudioConfirm,
        onPress: () => void downloadAllHymnAudio(),
      },
    ]);
  };

  const confirmDeleteOffline = () => {
    Alert.alert(t.offlineAudioDeleteTitle, t.offlineAudioDeleteBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      {
        text: t.offlineAudioDeleteConfirm,
        style: 'destructive',
        onPress: () => void deleteSavedHymnAudio(),
      },
    ]);
  };

  const handleRateApp = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
        return;
      }
    } catch {
      // Fall back to Play Store URL
    }
    void Linking.openURL(PLAY_STORE_URL).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: materialColors.surface }]}>
      <Host style={styles.host} seedColor={SEED_COLOR} colorScheme={colorScheme}>
        <LazyColumn
          verticalArrangement={{ spacedBy: 18 }}
          contentPadding={{
            start: 16,
            end: 16,
            top: Math.max(16, insets.top + 12),
            bottom: bottomPad,
          }}
        >
          {/* ─── Page Heading ─── */}
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
            <Text style={{ typography: 'headlineLarge', fontWeight: '700' }}>
              {t.tabSettings}
            </Text>
            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
              {t.settingsSub}
            </Text>
          </Column>

          {/* ─── Account & Cloud ─── */}
          <SettingsSection title={t.accountSectionLabel}>
            {user ? (
              <ActionRow
                label={user.displayName || user.email.split('@')[0]}
                supporting={`${user.email} · ${syncStatusLabel}`}
                materialColors={materialColors}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push('/my-profile' as any);
                }}
              />
            ) : (
              <ActionRow
                label={t.authSignIn}
                supporting={t.authMenuSignInSub}
                materialColors={materialColors}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  openAuthSheet();
                }}
              />
            )}
          </SettingsSection>

          {/* ─── Appearance & Font Size ─── */}
          <SettingsSection title={t.appearanceLabel}>
            <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Text style={{ typography: 'titleMedium' }}>{t.darkModeTitle}</Text>
              </ListItem.HeadlineContent>
              <ListItem.TrailingContent>
                <Switch
                  value={isDarkMode}
                  onCheckedChange={(next) => {
                    Haptics.selectionAsync().catch(() => {});
                    setAppearanceMode(next ? 'dark' : 'light');
                  }}
                />
              </ListItem.TrailingContent>
            </ListItem>

            <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
                  <Text style={{ typography: 'titleMedium' }}>{t.fontSize}</Text>
                  <Text color={materialColors.primary} style={{ typography: 'labelLarge', fontWeight: '700' }}>
                    {`${currentPx} px`}
                  </Text>
                </Row>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                  <Slider
                    value={currentPx}
                    min={MIN_PX}
                    max={MAX_PX}
                    steps={MAX_PX - MIN_PX - 1}
                    onValueChange={(nextVal) => {
                      const snapped = Math.round(nextVal);
                      if (snapped >= MIN_PX && snapped <= MAX_PX) {
                        setFontSizeMultiplier(snapped / BASE_PX);
                      }
                    }}
                    modifiers={[fillMaxWidth()]}
                  />
                  <Text
                    color={materialColors.onSurface}
                    style={{
                      fontFamily: 'serif',
                      fontSize: Math.min(34, currentPx),
                      fontWeight: '500',
                    }}
                  >
                    {hymnLanguage === 'en'
                      ? 'O Lord my God, when I in awesome wonder…'
                      : 'Señor, mi Dios, al contemplar los cielos…'}
                  </Text>
                  {currentPx !== BASE_PX ? (
                    <OutlinedButton
                      onClick={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFontSizeMultiplier(1.0);
                      }}
                    >
                      <Text>{t.textSizeReset}</Text>
                    </OutlinedButton>
                  ) : null}
                </Column>
              </ListItem.SupportingContent>
            </ListItem>
          </SettingsSection>

          {/* ─── Languages ─── */}
          <SettingsSection title={t.languagesSectionTitle}>
            <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Text style={{ typography: 'titleMedium' }}>{t.appLanguage}</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Column modifiers={[fillMaxWidth()]}>
                  <Spacer modifiers={[height(8)]} />
                  <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                    {(['es', 'en'] as Language[]).map((lang) => (
                      <SegmentedButton
                        key={`app-${lang}`}
                        selected={language === lang}
                        onClick={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setLanguage(lang);
                        }}
                      >
                        <SegmentedButton.Label>
                          <Text>{lang === 'es' ? t.spanish : t.english}</Text>
                        </SegmentedButton.Label>
                      </SegmentedButton>
                    ))}
                  </SingleChoiceSegmentedButtonRow>
                </Column>
              </ListItem.SupportingContent>
            </ListItem>

            <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Text style={{ typography: 'titleMedium' }}>{t.hymnLanguage}</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Column modifiers={[fillMaxWidth()]}>
                  <Spacer modifiers={[height(8)]} />
                  <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                    {(['es', 'en'] as Language[]).map((lang) => (
                      <SegmentedButton
                        key={`hymn-${lang}`}
                        selected={hymnLanguage === lang}
                        onClick={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setHymnLanguage(lang);
                        }}
                      >
                        <SegmentedButton.Label>
                          <Text>{lang === 'es' ? t.spanish : t.english}</Text>
                        </SegmentedButton.Label>
                      </SegmentedButton>
                    ))}
                  </SingleChoiceSegmentedButtonRow>
                </Column>
              </ListItem.SupportingContent>
            </ListItem>
          </SettingsSection>

          {/* ─── Offline Audio ─── */}
          <SettingsSection title={t.offlineAudioSectionLabel}>
            <ListItem modifiers={[fillMaxWidth(), clip(ROW_SHAPE)]}>
              <ListItem.HeadlineContent>
                <Text style={{ typography: 'titleMedium' }}>{t.offlineAudioTitle}</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                  <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
                    {`${offline.saved}/${offline.total}${offline.bytes > 0 ? ` · ${formatSize(offline.bytes)}` : ''} · ${
                      downloading
                        ? offline.cancelling
                          ? t.offlineAudioCancelling
                          : t.offlineAudioDownloading
                        : complete
                          ? t.offlineAudioDone
                          : t.offlineAudioWifiHint
                    }`}
                  </Text>
                  <Row horizontalArrangement={{ spacedBy: 8 }}>
                    {downloading ? (
                      <OutlinedButton
                        onClick={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          cancelDownloadAll();
                        }}
                      >
                        <Text>{offline.cancelling ? t.offlineAudioCancelling : t.offlineAudioCancel}</Text>
                      </OutlinedButton>
                    ) : !complete ? (
                      <FilledTonalButton
                        onClick={
                          hasFailed || offline.started
                            ? () => void downloadAllHymnAudio()
                            : confirmDownload
                        }
                      >
                        <Text>{downloadActionTitle}</Text>
                      </FilledTonalButton>
                    ) : null}
                    {!downloading && offline.saved > 0 ? (
                      <OutlinedButton onClick={confirmDeleteOffline}>
                        <Text color={materialColors.error}>{t.offlineAudioDelete}</Text>
                      </OutlinedButton>
                    ) : null}
                  </Row>
                </Column>
              </ListItem.SupportingContent>
            </ListItem>
          </SettingsSection>

          {/* ─── Support & About ─── */}
          <SettingsSection title={t.supportSectionTitle}>
            <ActionRow
              label={t.rateApp}
              value={t.rateAppButton}
              materialColors={materialColors}
              onPress={() => void handleRateApp()}
            />
            <ActionRow
              label={t.sendFeedback}
              materialColors={materialColors}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                sendFeedbackEmail(language);
              }}
            />
            <ActionRow
              label={t.authShareAppRow}
              materialColors={materialColors}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowShareApp(true);
              }}
            />
            <ActionRow
              label={t.settingsWhatsNewRow}
              materialColors={materialColors}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowWhatsNew(true);
              }}
            />
            <ActionRow
              label={t.about}
              materialColors={materialColors}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowAbout(true);
              }}
            />
          </SettingsSection>

          {/* ─── Signature Footer ─── */}
          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
            <Text color={materialColors.onSurfaceVariant} style={{ fontFamily: 'serif', typography: 'bodyMedium' }}>
              {t.signatureQuote}
            </Text>
            <Text color={materialColors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
              {`v ${Constants.expoConfig?.version ?? '2.3.0'} — Solo A Dios La Gloria`}
            </Text>
          </Column>
        </LazyColumn>
      </Host>

      <WhatsNewSheet visible={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <AppShareSheet visible={showShareApp} onClose={() => setShowShareApp(false)} />

      <Modal
        visible={showAbout}
        animationType="slide"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={[styles.aboutModal, { backgroundColor: theme.background, paddingTop: insets.top + 12 }]}>
          <View style={styles.aboutHeader}>
            <RNText style={[styles.aboutTitle, { color: theme.onSurface }]}>{t.about}</RNText>
            <Pressable onPress={() => setShowAbout(false)} style={styles.aboutClose}>
              <RNText style={[styles.aboutCloseText, { color: theme.primary }]}>{t.close}</RNText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
            <AboutHymnalContent />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
  },
  aboutModal: {
    flex: 1,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  aboutClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  aboutCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
