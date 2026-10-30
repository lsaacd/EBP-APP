/**
 * One-time, dismissible notice for iPhone users after transitioning from
 * bundled audio to Cloudflare streaming + offline downloads.
 */
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineAudio } from '../audio/offline-audio';
import GlassSurface from './GlassSurface';

const NOTICE_KEY = '@ebp_ios_streaming_notice_dismissed_v1';

export default function IosStreamingNotice() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const state = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AsyncStorage.getItem(NOTICE_KEY)
      .then((val) => {
        if (val !== 'true') setVisible(true);
      })
      .catch(() => {});
  }, []);

  if (Platform.OS !== 'ios' || !visible || state.saved >= state.total) {
    return null;
  }

  const dismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
    AsyncStorage.setItem(NOTICE_KEY, 'true').catch(() => {});
  };

  const openDownloads = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisible(false);
    AsyncStorage.setItem(NOTICE_KEY, 'true').catch(() => {});
    router.push('/settings');
  };

  return (
    <GlassSurface style={styles.card} intensity={45}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + '18' }]}>
          <MaterialIcons name="cloud-download" size={22} color={theme.primary} />
        </View>
        <Text style={[styles.message, { color: theme.onSurface }]}>
          {t.iosStreamingNotice}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={openDownloads}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>
            {t.iosStreamingNoticeAction}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={dismiss}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissBtnText, { color: theme.onSurfaceVariant }]}>
            {t.iosStreamingNoticeDismiss}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  primaryBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dismissBtnText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
  },
});
