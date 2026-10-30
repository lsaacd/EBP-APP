/**
 * iOS Offline Audio Card — Inset grouped card with circular SVG progress ring,
 * large count, thin secondary size/status line, prominent single action button,
 * and quiet destructive secondary row for deleting downloads.
 */
import React, { useEffect, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';
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

export interface OfflineAudioCardProps {
  glass?: boolean;
}

export default function OfflineAudioCard({ glass = false }: OfflineAudioCardProps) {
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

  const confirmDelete = () => {
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

  // Circular ring geometry
  const ringSize = 58;
  const strokeWidth = 4.5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const CardWrapper = glass ? GlassSurface : View;
  const wrapperProps = glass
    ? { style: styles.card }
    : { style: [styles.card, { backgroundColor: theme.surfaceVariants.containerLow }] };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
        {t.offlineAudioSection}
      </Text>

      <CardWrapper {...(wrapperProps as any)}>
        <View style={styles.topRow}>
          {/* Circular Progress Ring + Icon */}
          <View
            style={styles.ringWrap}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: state.total, now: state.saved }}
          >
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(110,22,25,0.12)'}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={theme.primary}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                rotation="-90"
                origin={`${ringSize / 2}, ${ringSize / 2}`}
              />
            </Svg>
            <View style={styles.ringCenterIcon}>
              <MaterialIcons
                name={complete ? 'check-circle' : downloading ? 'downloading' : 'cloud-download'}
                size={24}
                color={theme.primary}
              />
            </View>
          </View>

          {/* Large Count & Secondary Size Line */}
          <View style={styles.metricColumn}>
            <View style={styles.countBaseline}>
              <Text style={[styles.countNumber, { color: theme.onSurface }]}>
                {state.saved}
              </Text>
              <Text style={[styles.countTotal, { color: theme.onSurfaceVariant }]}>
                / {state.total}
              </Text>
              {state.bytes > 0 && (
                <View style={[styles.sizePill, { backgroundColor: theme.primary + '14' }]}>
                  <Text style={[styles.sizePillText, { color: theme.primary }]}>
                    {formatSize(state.bytes)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
              {t.offlineAudioTitle}
            </Text>
            <Text
              style={[
                styles.cardDesc,
                { color: hasFailed ? '#d32f2f' : theme.onSurfaceVariant },
              ]}
              accessibilityLiveRegion="polite"
            >
              {stateSubtitle}
            </Text>
          </View>
        </View>

        {/* Primary Action Button */}
        {downloading ? (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              styles.cancelBtn,
              { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              cancelDownloadAll();
            }}
            disabled={state.cancelling}
            activeOpacity={0.75}
          >
            <MaterialIcons name="pause-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.primaryBtnText, { color: theme.primary }]}>
              {state.cancelling ? t.offlineAudioCancelling : t.offlineAudioCancel}
            </Text>
          </TouchableOpacity>
        ) : !complete ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={hasFailed || state.started ? () => void downloadAllHymnAudio() : confirmDownload}
            activeOpacity={0.82}
          >
            <MaterialIcons name="arrow-downward" size={18} color={theme.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>
              {primaryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Quiet Destructive Secondary Action */}
        {!downloading && state.saved > 0 && (
          <View style={[styles.footerRow, { borderTopColor: theme.outlineVariant + '22' }]}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={confirmDelete}
              activeOpacity={0.65}
            >
              <MaterialIcons name="delete-outline" size={16} color={isDarkMode ? '#ffb4ab' : '#b3261e'} />
              <Text style={[styles.deleteBtnText, { color: isDarkMode ? '#ffb4ab' : '#b3261e' }]}>
                {t.offlineAudioDelete}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </CardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32, gap: 14 },
  sectionLabel: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    opacity: 0.6,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringCenterIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricColumn: {
    flex: 1,
    gap: 3,
  },
  countBaseline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  countNumber: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 32,
  },
  countTotal: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 15,
    opacity: 0.65,
  },
  sizePill: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sizePillText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  cardDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12.5,
    lineHeight: 17.5,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  primaryBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14.5,
  },
  footerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
  },
});

