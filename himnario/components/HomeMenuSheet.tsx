import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import AppMenuIcon from './AppMenuIcon';
import GlassSurface from './GlassSurface';
import OfflineAudioCard from './OfflineAudioCard';
import AboutHymnalContent from './AboutHymnalContent';
import TextSizeSheet from './TextSizeSheet';

type Page = 'menu' | 'settings' | 'downloads' | 'about' | 'help';
export type HomeMenuPage = 'settings' | 'about' | 'help';
export type MenuAnchor = { x: number; y: number; width: number; height: number };
const FEEDBACK_URL = 'https://himnarioebp.com/feedback.html';

/** One modal with in-sheet navigation: no stacked settings/about presentation races. */
export default function HomeMenuSheet({ anchor, initialPage = 'menu', onClose }: { anchor: MenuAnchor; initialPage?: Page; onClose: () => void }) {
  const { theme, isDarkMode, toggleTheme, fontSizeMultiplier } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [menuContentHeight, setMenuContentHeight] = useState(210);
  const [page, setPage] = useState<Page>(initialPage);
  const [aboutParent, setAboutParent] = useState<Page>('menu');
  const [showTextSize, setShowTextSize] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const menuWidth = Math.min(300, width - 32);
  const menuHeight = Math.min(menuContentHeight, Math.max(120, height - insets.top - insets.bottom - 24));
  const menuTop = Math.max(insets.top + 8, Math.min(anchor.y + anchor.height + 8, height - insets.bottom - menuHeight - 8));
  const titles: Record<Page, string> = {
    menu: t.homeMenu, settings: t.homeMenuSettings, downloads: t.homeMenuDownloads,
    about: t.homeMenuHistory, help: t.homeMenuHelp,
  };

  const go = (next: Page) => {
    Haptics.selectionAsync().catch(() => {});
    setLinkError(false);
    if (next === 'about') setAboutParent(page);
    setPage(next);
  };
  const back = () => {
    if (page === 'menu' || page === initialPage) onClose();
    else setPage(page === 'downloads' ? 'settings' : page === 'about' ? aboutParent : 'menu');
  };
  const openLink = async (url: string) => {
    setLinkError(false);
    try {
      await WebBrowser.openBrowserAsync(url, { toolbarColor: theme.background, controlsColor: theme.primary });
    } catch { setLinkError(true); }
  };

  const row = (label: string, ios: React.ComponentProps<typeof AppMenuIcon>['ios'], android: React.ComponentProps<typeof AppMenuIcon>['android'], onPress: () => void, subtitle?: string, compact = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={compact ? subtitle : undefined}
      onPress={onPress}
      android_ripple={{ color: theme.primary + '15' }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.primary + '0D' }]}
    >
      <AppMenuIcon ios={ios} android={android} color={theme.primary} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.onSurface }]}>{label}</Text>
        {!!subtitle && !compact && <Text style={[styles.rowSubtitle, { color: theme.onSurfaceVariant }]}>{subtitle}</Text>}
      </View>
      <AppMenuIcon ios="chevron.right" android="chevron-right" color={theme.outline} size={14} />
    </Pressable>
  );
  const divider = <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />;
  const group = (children: React.ReactNode) => <View style={[styles.group, { backgroundColor: theme.surfaceVariants.containerLow, borderColor: theme.outlineVariant + '50' }]}>{children}</View>;
  const sectionLabel = (label: string) => <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>{label}</Text>;

  const settings = <>
    {sectionLabel(t.homeMenuDisplay)}
    {group(<>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: isDarkMode }} accessibilityLabel={t.homeMenuDark}
        onPress={toggleTheme} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
        <AppMenuIcon ios="circle.lefthalf.filled" android="contrast" color={theme.primary} />
        <View style={styles.rowText}><Text style={[styles.rowTitle, { color: theme.onSurface }]}>{isDarkMode ? t.homeMenuDark : t.homeMenuLight}</Text></View>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Switch value={isDarkMode} trackColor={{ false: theme.outlineVariant, true: theme.primary }} thumbColor={Platform.OS === 'android' ? theme.onPrimary : undefined} />
        </View>
      </Pressable>
      {divider}
      {row(t.fontSize, 'textformat.size', 'format-size', () => setShowTextSize(true), `${Math.round(22 * fontSizeMultiplier)} px`)}
    </>)}

    {sectionLabel(t.language)}
    {group(<View style={styles.languageRow}>
      {(['es', 'en'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: language === value }}
        onPress={() => setLanguage(value)}
        style={[styles.languageOption, { backgroundColor: language === value ? theme.primary : theme.surfaceVariants.container, borderColor: language === value ? theme.primary : theme.outlineVariant }]}>
        <Text style={[styles.languageText, { color: language === value ? theme.onPrimary : theme.onSurface }]}>{value === 'es' ? t.spanish : t.english}</Text>
      </Pressable>)}
    </View>)}
    <Text style={[styles.note, { color: theme.onSurfaceVariant }]}>{t.homeMenuLanguageHint}</Text>

    {sectionLabel(t.homeMenuDetails)}
    {group(<>
      {row(t.homeMenuDownloads, 'arrow.down.circle', 'download', () => go('downloads'), t.homeMenuDownloadsSub)}
    </>)}
    <Text style={[styles.note, { color: theme.onSurfaceVariant }]}>{t.homeMenuPrivacyHint}</Text>
  </>;

  const help = <>
    <Text style={[styles.intro, { color: theme.onSurfaceVariant }]}>{t.homeMenuHelpIntro}</Text>
    {t.homeMenuTips.map((tip, index) => <View key={tip.title} style={[styles.tip, { borderBottomColor: theme.outlineVariant + '60' }]}>
      <View style={[styles.tipNumber, { backgroundColor: theme.surfaceVariants.container }]}><Text style={[styles.tipNumberText, { color: theme.primary }]}>{index + 1}</Text></View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.onSurface }]}>{tip.title}</Text>
        <Text style={[styles.tipBody, { color: theme.onSurfaceVariant }]}>{tip.body}</Text>
      </View>
    </View>)}
    <View style={[styles.feedbackCard, { backgroundColor: theme.surfaceVariants.containerLow }]}>
      <AppMenuIcon ios="bubble.left.and.bubble.right" android="chat-bubble-outline" color={theme.primary} size={24} />
      <Text style={[styles.feedbackTitle, { color: theme.onSurface }]}>{t.homeMenuFeedback}</Text>
      <Text style={[styles.tipBody, { color: theme.onSurfaceVariant }]}>{t.homeMenuFeedbackSub}</Text>
      <Pressable accessibilityRole="link" onPress={() => void openLink(FEEDBACK_URL)} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.primary, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[styles.primaryText, { color: theme.onPrimary }]}>{t.homeMenuOpenFeedback}</Text>
        <AppMenuIcon ios="arrow.up.right" android="open-in-new" color={theme.onPrimary} size={17} />
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => void openLink('https://himnarioebp.com/')} style={styles.webLink}>
        <Text style={[styles.webLinkText, { color: theme.primary }]}>{t.homeMenuOpenWebsite}</Text>
      </Pressable>
    </View>
    {linkError && <Text accessibilityRole="alert" style={[styles.note, { color: theme.primary }]}>{t.homeMenuLinkError}</Text>}
  </>;

  return <Modal transparent visible animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent onRequestClose={back}>
    <View style={styles.overlay} onAccessibilityEscape={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t.close} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: page === 'menu' ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.35)' }]} />
      <Animated.View key={page === 'menu' ? 'menu' : 'sheet'} entering={FadeIn.duration(160)} accessibilityViewIsModal style={page === 'menu'
        ? [styles.menuPosition, { width: menuWidth, height: menuHeight, top: menuTop, left: Math.max(16, Math.min(width - menuWidth - 16, anchor.x + anchor.width - menuWidth)) }]
        : [styles.sheetPosition, { top: Math.max(insets.top + 12, height * 0.08), bottom: 0, maxWidth: 640 }]}>
        <GlassSurface stableBackdrop intensity={80} style={[styles.surface, page !== 'menu' && styles.sheetSurface, Platform.OS !== 'ios' && { borderRadius: page === 'menu' ? 16 : 28 }]}>
          {page === 'menu' ? <ScrollView bounces={false} showsVerticalScrollIndicator={false}
            onContentSizeChange={(_width, contentHeight) => setMenuContentHeight(contentHeight + 12)}>
            <Text style={[styles.menuCaption, { color: theme.onSurfaceVariant }]}>Himnario El Buen Pastor</Text>
            {row(t.homeMenuHistory, 'clock', 'history', () => go('about'), t.homeMenuHistorySub, true)}
            {divider}
            {row(t.homeMenuHelp, 'questionmark.circle', 'help-outline', () => go('help'), t.homeMenuHelpSub, true)}
            {divider}
            {row(t.homeMenuSettings, 'gearshape', 'settings', () => go('settings'), t.homeMenuSettingsSub, true)}
          </ScrollView> : <>
            <View style={styles.sheetHeader}>
              <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t.homeMenuBack} style={styles.headerButton}>
                <AppMenuIcon ios="chevron.left" android="arrow-back" color={theme.primary} />
              </Pressable>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.onSurface }]} numberOfLines={2}>{titles[page]}</Text>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} style={styles.headerButton}>
                <View style={[styles.closeCircle, { backgroundColor: theme.surfaceVariants.containerHighest }]}><AppMenuIcon ios="xmark" android="close" color={theme.onSurfaceVariant} size={17} /></View>
              </Pressable>
            </View>
            <ScrollView key={page} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator indicatorStyle={isDarkMode ? 'white' : 'black'}
              contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
              {page === 'settings' ? settings : page === 'downloads' ? <OfflineAudioCard /> : page === 'about' ? <AboutHymnalContent /> : help}

            </ScrollView>
          </>}
        </GlassSurface>
      </Animated.View>
      {showTextSize && <TextSizeSheet visible onClose={() => setShowTextSize(false)} />}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  menuPosition: { position: 'absolute', elevation: 12, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  sheetPosition: { position: 'absolute', width: '100%', alignSelf: 'center' },
  surface: { flex: 1, borderRadius: 24, overflow: 'hidden', paddingVertical: 6 },
  sheetSurface: { flex: 1, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  menuCaption: { fontFamily: fonts.sansMedium, fontSize: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  row: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  rowSubtitle: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.65, marginLeft: 54, marginRight: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 23 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  group: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 22, marginBottom: 10, marginLeft: 14 },
  note: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 20, marginTop: 10, marginHorizontal: 12 },
  languageRow: { flexDirection: 'row', gap: 10, padding: 12 },
  languageOption: { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 12, alignItems: 'center' },
  languageText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  intro: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 24, marginVertical: 16 },
  tip: { flexDirection: 'row', gap: 14, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  tipNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  tipNumberText: { fontFamily: fonts.sansBold, fontSize: 13 },
  tipBody: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 24, marginTop: 7 },
  feedbackCard: { borderRadius: 22, padding: 20, marginTop: 24 },
  feedbackTitle: { fontFamily: fonts.bold, fontSize: 25, marginTop: 14 },
  primaryButton: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, minHeight: 48, padding: 12, marginTop: 18 },
  primaryText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  webLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  webLinkText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  version: { fontFamily: fonts.sansMedium, textAlign: 'center', fontSize: 12, marginTop: 26 },
});
