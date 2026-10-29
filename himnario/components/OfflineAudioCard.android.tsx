/**
 * Settings section (Android only): save every hymn recording for offline use,
 * show progress, and free the space again.
 */
import React, { useEffect, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  offlineAudio,
  refreshOfflineAudio,
  downloadAllHymnAudio,
  cancelDownloadAll,
  deleteSavedHymnAudio,
} from '../audio/offline-audio';

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

export default function OfflineAudioCard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const state = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  useEffect(() => { void refreshOfflineAudio(); }, []);

  const downloading = state.status === 'downloading';
  const complete = state.saved >= state.total;
  const progress = state.total ? Math.min(1, state.saved / state.total) : 0;
  const summary = t.offlineAudioSaved
    .replace('{saved}', String(state.saved))
    .replace('{total}', String(state.total))
    .replace('{size}', formatSize(state.bytes));

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

  let status: string | null = null;
  if (downloading) status = state.cancelling ? t.offlineAudioCancelling : t.offlineAudioDownloading;
  else if (state.status === 'error' && state.failed) status = t.offlineAudioFailed.replace('{failed}', String(state.failed));
  else if (complete) status = t.offlineAudioDone;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
        {t.offlineAudioSection}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
        <View style={styles.cardInfo}>
          <MaterialIcons name="download-for-offline" size={24} color={theme.primary} />
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: theme.onSurface }]}>{t.offlineAudioTitle}</Text>
            <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>{t.offlineAudioDesc}</Text>
          </View>
        </View>

        <View
          style={[styles.track, { backgroundColor: theme.onSurfaceVariant + '26' }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: state.total, now: state.saved }}
        >
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        </View>
        <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>{summary}</Text>
        {status && (
          <Text style={[styles.cardDesc, styles.status, { color: theme.onSurface }]} accessibilityLiveRegion="polite">
            {status}
          </Text>
        )}

        <View style={styles.actions}>
          {downloading ? (
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.primary }]}
              onPress={cancelDownloadAll}
              disabled={state.cancelling}
            >
              <Text style={[styles.buttonText, { color: theme.primary }]}>{t.offlineAudioCancel}</Text>
            </TouchableOpacity>
          ) : !complete ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={confirmDownload}
            >
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                {state.saved > 0 ? t.offlineAudioResume : t.offlineAudioDownload}
              </Text>
            </TouchableOpacity>
          ) : null}
          {!downloading && state.saved > 0 && (
            <TouchableOpacity style={[styles.button, { borderColor: theme.onSurfaceVariant + '55' }]} onPress={confirmDelete}>
              <Text style={[styles.buttonText, { color: theme.onSurfaceVariant }]}>{t.offlineAudioDelete}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32, gap: 16 },
  sectionLabel: { fontFamily: 'PublicSans_700Bold', fontSize: 11, letterSpacing: 2, opacity: 0.6 },
  card: { padding: 20, borderRadius: 12, gap: 12 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontFamily: 'PublicSans_500Medium', fontSize: 17, marginBottom: 2 },
  cardDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 13 },
  status: { fontFamily: 'PublicSans_500Medium' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  button: { borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  primaryButton: {},
  buttonText: { fontFamily: 'PublicSans_600SemiBold', fontSize: 14 },
});
