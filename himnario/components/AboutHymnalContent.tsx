import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import EbpLogo from '../assets/images/EBP-LOGO.svg';

/** Shared by the Settings tab and the Home menu: one version/credits source. */
export default function AboutHymnalContent() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={{ paddingTop: 12 }}>
      <View style={styles.aboutHeader}>
        <EbpLogo width={58} height={78} style={{ marginBottom: 16 }} />
        <Text style={[styles.aboutAppName, { color: theme.primary }]}>
          Himnario El Buen Pastor
        </Text>
        <Text style={[styles.aboutVersion, { color: theme.onSurfaceVariant }]}>
          {t.aboutVersion.replace(/\d+\.\d+\.\d+/, Constants.expoConfig?.version ?? '1.1.0')}
        </Text>
        <Text style={[styles.aboutTagline, { color: theme.primary, opacity: 0.5 }]}>
          {t.aboutTagline}
        </Text>
      </View>
      <View style={[styles.aboutDivider, { backgroundColor: theme.outlineVariant, opacity: 0.2 }]} />
      <Text style={[styles.aboutDescription, { color: theme.onSurface }]}>
        {t.aboutDescription}
      </Text>
      <Text style={[styles.aboutSectionTitle, { color: theme.primary }]}>
        {t.aboutChangelog}
      </Text>
      <Text style={[styles.aboutRelease, { color: theme.outline }]}>
        {t.aboutFirstRelease}
      </Text>
      {(t.aboutChangelogItems as readonly string[]).map((item, i) => (
        <View key={i} style={styles.aboutItem}>
          <View style={[styles.aboutBullet, { backgroundColor: theme.primary }]} />
          <Text style={[styles.aboutItemText, { color: theme.onSurface }]}>{item}</Text>
        </View>
      ))}
      <View style={[styles.aboutDivider, { backgroundColor: theme.outlineVariant, opacity: 0.2 }]} />
      <Text style={[styles.aboutSectionTitle, { color: theme.primary }]}>
        {t.aboutBuiltBy}
      </Text>
      <Text style={[styles.aboutCredit, { color: theme.onSurface }]}>
        {t.aboutBuiltByName}
      </Text>
      <Text style={[styles.aboutCopyright, { color: theme.outline }]}>
        {t.aboutCopyright}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aboutAppName: {
    fontFamily: fonts.boldItalic,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 6,
  },
  aboutVersion: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 6,
  },
  aboutTagline: {
    fontFamily: fonts.regularItalic,
    fontSize: 14,
  },
  aboutDivider: {
    height: 1,
    marginVertical: 20,
  },
  aboutDescription: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.85,
  },
  aboutSectionTitle: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aboutRelease: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 12,
    opacity: 0.6,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  aboutBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
    opacity: 0.7,
  },
  aboutItemText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  aboutCredit: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  aboutCopyright: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    opacity: 0.45,
    textAlign: 'center',
  },
});
