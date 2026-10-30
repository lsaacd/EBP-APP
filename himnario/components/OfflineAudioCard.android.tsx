/**
 * Android Offline Audio Card — Material 3 tonal card (24 dp radius), linear
 * progress indicator, tonal/filled primary button with ripple feedback, and
 * subtle destructive text button for deleting downloads.
 */
import React, { useEffect, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import {
  offlineAudio,
  refreshOfflineAudio,
  downloadAllHymnAudio,
  cancelDownloadAll,
  deleteSavedHymnAudio,
} from '../audio/offline-audio';

function formatSize(bytes: number) {
  if (bytes <= 0) return '0 MB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

export default function OfflineAudioCard() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const state = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  useEffect(() => {
    void refreshOfflineAudio();
  }, []);

  const downloading = state.status === 'downloading';
  const complete = state.saved >= state.total && state.total > 0;
  const hasFailed = state.status === 'error' && state.failed > 0;
  const progress = state.total ? Math.min(1, state.saved / state.total) : 0;

  const confirmDownload = () => {
    Alert.alert(t.offlineAudioConfirmTitle, t.offlineAudioConfirmBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      { text: t.offlineAudioConfirm, onPress: () => { void downloadAllHymnAudio(); } },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(t.offlineAudioDeleteTitle, t.offlineAudioDeleteBody, [
      { text: t.offlineAudioCancel, style: 'cancel' },
      { text: t.offlineAudioDeleteConfirm, style: 'destructive', onPress: () => { void deleteSavedHymnAudio(); } },
    ]);
  };

  let stateSubtitle = t.offlineAudioDesc;
  if (downloading) {
    stateSubtitle = state.cancelling ? t.offlineAudioCancelling : t.offlineAudioDownloading;
  } else if (hasFailed) {
    stateSubtitle = t.offlineAudioFailed.replace('{failed}', String(state.failed));
  } else if (complete) {
    stateSubtitle = t.offlineAudioDone;
  } else if (state.saved === 0) {
    stateSubtitle = `${t.offlineAudioNone} · ${t.offlineAudioWifiHint}`;
  } else if (!state.started) {
    stateSubtitle = `${t.offlineAudioPartial} · ${t.offlineAudioWifiHint}`;
  }

  let primaryLabel = t.offlineAudioDownload;
  if (hasFailed) primaryLabel = t.offlineAudioRetry;
  else if (state.started && state.saved > 0) primaryLabel = t.offlineAudioResume;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
        {t.offlineAudioSection}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceVariants.containerLow,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(36,37,31,0.06)',
          },
        ]}
      >
        {/* Header Row: Icon Badge + Count + Size */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primary + '18' }]}>
            <MaterialIcons
              name={complete ? 'offline-pin' : downloading ? 'downloading' : 'download-for-offline'}
              size={26}
              color={theme.primary}
            />
          </View>

          <View style={styles.headerTextCol}>
            <View style={styles.metricRow}>
              <Text style={[styles.countText, { color: theme.onSurface }]}>
                {state.saved}
              </Text>
              <Text style={[styles.totalText, { color: theme.onSurfaceVariant }]}>
                de {state.total}
              </Text>
              {state.bytes > 0 && (
                <View style={[styles.sizeChip, { backgroundColor: theme.primary + '16' }]}>
                  <Text style={[styles.sizeChipText, { color: theme.primary }]}>
                    {formatSize(state.bytes)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
              {t.offlineAudioTitle}
            </Text>
          </View>
        </View>

        {/* Material 3 Linear Progress Indicator */}
        <View
          style={[styles.track, { backgroundColor: theme.onSurfaceVariant + '22' }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: state.total, now: state.saved }}
        >
          <View
            style={[
              styles.fill,
              { width: `${progress * 100}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>

        {/* Status / Description */}
        <Text
          style={[
            styles.cardDesc,
            { color: hasFailed ? '#ffb4ab' : theme.onSurfaceVariant },
          ]}
          accessibilityLiveRegion="polite"
        >
          {stateSubtitle}
        </Text>

        {/* Actions Row */}
        <View style={styles.actions}>
          {downloading ? (
            <Pressable
              android_ripple={{ color: theme.primary + '22' }}
              style={[styles.tonalButton, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]}
              onPress={cancelDownloadAll}
              disabled={state.cancelling}
            >
              <MaterialIcons name="pause" size={18} color={theme.primary} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>
                {state.cancelling ? t.offlineAudioCancelling : t.offlineAudioCancel}
              </Text>
            </Pressable>
          ) : !complete ? (
            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={hasFailed || state.started ? () => void downloadAllHymnAudio() : confirmDownload}
            >
              <MaterialIcons name="file-download" size={18} color={theme.onPrimary} />
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                {primaryLabel}
              </Text>
            </Pressable>
          ) : null}

          {!downloading && state.saved > 0 && (
            <Pressable
              android_ripple={{ color: 'rgba(179,38,30,0.15)' }}
              style={styles.textButton}
              onPress={confirmDelete}
            >
              <MaterialIcons
                name="delete-outline"
                size={17}
                color={isDarkMode ? '#ffb4ab' : '#b3261e'}
              />
              <Text style={[styles.textButtonLabel, { color: isDarkMode ? '#ffb4ab' : '#b3261e' }]}>
                {t.offlineAudioDelete}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32, gap: 16 },
  sectionLabel: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    opacity: 0.6,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  countText: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  totalText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 14,
    opacity: 0.7,
  },
  sizeChip: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sizeChipText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15.5,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  cardDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  tonalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  buttonText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  textButtonLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
  },
});
