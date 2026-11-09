import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { shouldCollapsePlayer } from '../utils/gestureMotion';
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
  const travel = Math.max(420, Math.round(height * 0.88));
  const tallSheetHeight = Math.round(height * 0.9);
  const isScrollablePage = page === 'about' || page === 'help';

  const progress = useSharedValue(initialPage === 'menu' ? 0 : 1);
  const dragOrigin = useSharedValue(0);
  const spring = {
    damping: 28,
    stiffness: 240,
    mass: 1,
    overshootClamping: true,
  };

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    if (page === 'menu') {
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, onClose, page, progress]);

  useEffect(() => {
    if (page !== 'menu') {
      progress.value = 1;
      progress.value = withSpring(0, spring);
    } else {
      progress.value = 0;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page === 'menu']);

  const pan = Gesture.Pan()
    .enabled(page !== 'menu' && !showTextSize)
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(progress);
      dragOrigin.value = progress.value;
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(1, dragOrigin.value + event.translationY / travel)
      );
    })
    .onEnd((event) => {
      const collapse = shouldCollapsePlayer(
        progress.value * travel,
        event.velocityY,
        travel * 0.55
      );
      progress.value = withSpring(
        collapse ? 1 : 0,
        { ...spring, velocity: event.velocityY / travel },
        (finished) => {
          if (finished && collapse) runOnJS(finishClose)();
        }
      );
    })
    .onFinalize((_event, success) => {
      if (!success) {
        progress.value = withSpring(0, spring);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: page === 'menu' ? 1 : 1 - progress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: page === 'menu' ? 0 : progress.value * travel }],
  }));

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
    if (page === 'menu' || page === initialPage) animateClose();
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

  const pageBody = page === 'settings' ? settings : page === 'downloads' ? <OfflineAudioCard /> : page === 'about' ? <AboutHymnalContent /> : help;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={back}
    >
      <GestureHandlerRootView
        style={[styles.overlay, page !== 'menu' && styles.sheetOverlay]}
        onAccessibilityEscape={animateClose}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: page === 'menu' ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.42)' },
            backdropStyle,
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.close}
          onPress={animateClose}
          style={StyleSheet.absoluteFill}
        />

        {page === 'menu' ? (
          <Animated.View
            key="menu"
            entering={FadeIn.duration(160)}
            accessibilityViewIsModal
            style={[
              styles.menuPosition,
              {
                width: menuWidth,
                height: menuHeight,
                top: menuTop,
                left: Math.max(16, Math.min(width - menuWidth - 16, anchor.x + anchor.width - menuWidth)),
              },
            ]}
          >
            <GlassSurface
              stableBackdrop
              intensity={80}
              style={[styles.surface, Platform.OS !== 'ios' && { borderRadius: 16 }]}
            >
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={(_width, contentHeight) => setMenuContentHeight(contentHeight + 12)}
              >
                <Text style={[styles.menuCaption, { color: theme.onSurfaceVariant }]}>Himnario El Buen Pastor</Text>
                {row(t.homeMenuHistory, 'clock', 'history', () => go('about'), t.homeMenuHistorySub, true)}
                {divider}
                {row(t.homeMenuHelp, 'questionmark.circle', 'help-outline', () => go('help'), t.homeMenuHelpSub, true)}
                {divider}
                {row(t.homeMenuSettings, 'gearshape', 'settings', () => go('settings'), t.homeMenuSettingsSub, true)}
              </ScrollView>
            </GlassSurface>
          </Animated.View>
        ) : (
          <GestureDetector gesture={pan}>
            <Animated.View
              key="sheet"
              accessibilityViewIsModal
              style={[styles.sheetWrap, { maxWidth: 640 }, sheetAnimatedStyle]}
            >
              <GlassSurface
                stableBackdrop
                intensity={80}
                style={[
                  styles.sheetSurface,
                  isScrollablePage && { height: tallSheetHeight },
                ]}
              >
                <View style={[styles.grabber, { backgroundColor: theme.outlineVariant }]} />
                <View style={styles.sheetHeader}>
                  <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t.homeMenuBack} style={styles.headerButton}>
                    {page !== initialPage && (
                      <AppMenuIcon ios="chevron.left" android="arrow-back" color={theme.primary} />
                    )}
                  </Pressable>
                  <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.onSurface }]} numberOfLines={2}>
                    {titles[page]}
                  </Text>
                  <Pressable onPress={animateClose} accessibilityRole="button" accessibilityLabel={t.close} style={styles.headerButton}>
                    <View style={[styles.closeCircle, { backgroundColor: theme.surfaceVariants.containerHighest }]}>
                      <AppMenuIcon ios="xmark" android="close" color={theme.onSurfaceVariant} size={17} />
                    </View>
                  </Pressable>
                </View>

                {isScrollablePage ? (
                  <ScrollView
                    key={page}
                    contentInsetAdjustmentBehavior="never"
                    showsVerticalScrollIndicator
                    indicatorStyle={isDarkMode ? 'white' : 'black'}
                    contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}
                  >
                    {pageBody}
                  </ScrollView>
                ) : (
                  <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
                    {pageBody}
                  </View>
                )}
              </GlassSurface>
            </Animated.View>
          </GestureDetector>
        )}

        {showTextSize && <TextSizeSheet visible onClose={() => setShowTextSize(false)} />}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  sheetOverlay: { justifyContent: 'flex-end' },
  menuPosition: { position: 'absolute', elevation: 12, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  sheetWrap: { width: '100%', alignSelf: 'center' },
  surface: { flex: 1, borderRadius: 24, overflow: 'hidden', paddingVertical: 6 },
  sheetSurface: {
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    overflow: 'hidden',
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.35,
    marginBottom: 4,
  },
  menuCaption: { fontFamily: fonts.sansMedium, fontSize: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  row: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  rowSubtitle: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.65, marginLeft: 54, marginRight: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 6 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 23 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  group: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 18, marginBottom: 10, marginLeft: 14 },
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
