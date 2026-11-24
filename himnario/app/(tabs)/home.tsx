/**
 * HomeScreen component — The primary landing screen of the Himnario application.
 *
 * This screen features:
 * - Aligned serif title ("Inicio" / "Home"), compact platform menu and search bar.
 * - Home menu opens shared About content, help and reading/download settings.
 * - Horizontal swipe support (Instagram-style) to switch to adjacent tabs.
 * - An Apple Books-style hero card featuring the burgundy leather hymnal cover.
 * - A "Verse of the Day" component.
 * - Church Identity & Motto block ("Verdad, honestidad, justicia, santidad y caridad") with "Ver más".
 * - Quick access to recently viewed hymns with saved-offline badges.
 *
 * @returns {React.JSX.Element} The rendered Home screen.
 */
import SheetGrabber from '../../components/SheetGrabber';
import GlassSurface from '../../components/GlassSurface';
import AppMenuIcon from '../../components/AppMenuIcon';
import { buildSheetBackdropGesture, buildSheetPanGesture } from '../../utils/useSheetBackdropGesture';
import React, { useState, useRef, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  BackHandler,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { useRecentHymns } from '../../context/RecentHymnsContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymn } from '../../data/alabanzasEnglish';
import VerseCard from '../../components/VerseCard';
import HomeHeaderActions from '../../components/HomeHeaderActions';
import TabSwipeWrapper from '../../components/TabSwipeWrapper';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { offlineAudio, refreshOfflineAudio } from '../../audio/offline-audio';
import {
  hymnCoversStore,
  initHymnCovers,
  resolveActiveHymnCover,
} from '../../data/hymnCovers';
import { LinearGradient } from 'expo-linear-gradient';

const IS_IOS = Platform.OS === 'ios';
const IS_IPAD = IS_IOS && Boolean((Platform as any).isPad);

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { recentIds, clearRecent } = useRecentHymns();
  const { t, language, hymnLanguage } = useLanguage();
  const { currentHymnId } = useNowPlaying();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const coverState = useSyncExternalStore(hymnCoversStore.subscribe, hymnCoversStore.getSnapshot);
  const [coverFailedId, setCoverFailedId] = useState<string | null>(null);
  const activeCover = resolveActiveHymnCover(coverState, coverFailedId);
  const insets = useSafeAreaInsets();
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);
  const scrollViewRef = useRef<any>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleOpacity = scrollY.interpolate({ inputRange: [0, 35], outputRange: [1, 0], extrapolate: 'clamp' });
  const titleTranslateY = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, -10], extrapolate: 'clamp' });
  const [headerHidden, setHeaderHidden] = useState(false);
  const [headerGlassEpoch, setHeaderGlassEpoch] = useState(0);

  useEffect(() => {
    setCoverFailedId(null);
  }, [coverState.selectedId]);

  useEffect(() => {
    void refreshOfflineAudio();
    void initHymnCovers();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const [showDoctrine, setShowDoctrine] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const docTravel = Math.max(460, Math.round(screenHeight * 0.88));
  const docProgress = useSharedValue(1);
  const docDragOrigin = useSharedValue(0);

  const finishCloseDoctrine = useCallback(() => {
    setShowDoctrine(false);
  }, []);

  const closeDoctrine = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    docProgress.value = withTiming(1, { duration: 230, easing: Easing.out(Easing.cubic) });
    setTimeout(finishCloseDoctrine, 230);
  }, [docProgress, finishCloseDoctrine]);

  useEffect(() => {
    if (showDoctrine) {
      docProgress.value = 1;
      requestAnimationFrame(() => {
        docProgress.value = withSpring(0, { damping: 28, stiffness: 245, mass: 0.92, overshootClamping: true });
      });
    } else {
      docProgress.value = 1;
    }
  }, [showDoctrine, docProgress]);

  const docBackdropPan = useMemo(
    () =>
      buildSheetBackdropGesture({
        progress: docProgress,
        dragOrigin: docDragOrigin,
        travel: docTravel,
        enabled: showDoctrine,
        onTapClose: closeDoctrine,
        onFinishDismiss: finishCloseDoctrine,
      }),
    [docProgress, docDragOrigin, docTravel, showDoctrine, closeDoctrine, finishCloseDoctrine],
  );
  const docHeaderPan = useMemo(
    () =>
      buildSheetPanGesture({
        progress: docProgress,
        dragOrigin: docDragOrigin,
        travel: docTravel,
        enabled: showDoctrine,
        onFinishDismiss: finishCloseDoctrine,
      }),
    [docProgress, docDragOrigin, docTravel, showDoctrine, finishCloseDoctrine],
  );
  const docBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(docProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));
  const docSheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: docProgress.value * docTravel }],
  }));

  const displayHymnLang = language === 'en' ? 'en' : hymnLanguage;
  const allHymns = [...hymnsData, ...estribillosData];
  const recentHymns = recentIds
    .map((rid) => allHymns.find((h) => String(h.id) === rid))
    .filter(Boolean)
    .slice(0, 10)
    .map((h) => getLocalizedHymn(h as any, displayHymnLang)) as typeof hymnsData;

  // ── Android: block hardware/swipe back so home never navigates to index ──
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const handleHeaderSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/hymns',
      params: { tab: 'himnos', focusSearch: '1', t: String(Date.now()) },
    });
  };

  const rootBackgroundColor = isDarkMode ? '#010101' : '#FFFFFF';
  const headerTitleColor = isDarkMode ? '#ffffff' : '#111111';
  const sectionHeadingColor = isDarkMode ? '#ffffff' : '#111111';
  const sectionSubColor = isDarkMode ? 'rgba(235,235,245,0.6)' : '#6E6E73';

  // Apple Books top-to-bottom section band gradients:
  // - Dark mode: lighter charcoal at top (#1C1C1E) -> pure black at bottom (#000000)
  // - Light mode: crisp white at top (#FFFFFF) -> soft neutral gray at bottom (#EAEAEF)
  const topBandGradientColors: [string, string, string] = isDarkMode
    ? ['#010101', '#010101', '#000000']
    : ['#FFFFFF', '#F7F7FA', '#EAEAEF'];
  const bandGradientColors: [string, string, string] = isDarkMode
    ? ['#1C1C1E', '#0B0B0C', '#000000']
    : ['#FFFFFF', '#F7F7FA', '#EAEAEF'];
  const bandTopBorderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  const heroSubtitle = t.homeCompleteHymnAndChorusCollection;
  const recentsSubtitle = t.homeHymnsYouHaveOpenedRecently;
  const mottoLabelFormatted = t.homeOurChurchMotto;

  // ── Shared scroll content ─────────────────────────────────────────────────
  const scrollContent = (
    <>
      {/* ─── Top Section — "Explora los Himnos" (Apple Books Continue style) ─── */}
      <LinearGradient
        colors={topBandGradientColors}
        locations={[0, 0.55, 1]}
        style={[
          styles.topSection,
          { paddingTop: (headerHeight || insets.top + ipadTopOffset + 54) + 8 },
        ]}
      >
        <View style={IS_IPAD ? styles.tabletCenter : undefined}>
          <TouchableOpacity
            style={[
              styles.heroSurface,
              {
                backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
              },
              !isDarkMode && styles.lightCardShadow,
            ]}
            activeOpacity={0.82}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/hymns',
                params: { tab: 'himnos', t: String(Date.now()) },
              });
            }}
          >
            <View
              style={[
                styles.bookCoverShadow,
                activeCover.preset.is3D && { backgroundColor: 'transparent', borderRadius: 0 },
              ]}
            >
              <Image
                source={activeCover.source}
                onError={() => setCoverFailedId(activeCover.preset.id)}
                style={[
                  styles.bookCoverImage,
                  activeCover.preset.is3D && { borderWidth: 0, borderRadius: 4 },
                ]}
                resizeMode={activeCover.preset.is3D ? 'contain' : 'cover'}
              />
            </View>

            <View style={styles.heroTextSide}>
              <Text
                style={[styles.heroHeadline, { color: sectionHeadingColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {t.exploreAll}
              </Text>
              <Text
                style={[styles.heroSub, { color: sectionSubColor }]}
                numberOfLines={2}
              >
                {heroSubtitle}
              </Text>
              <Text
                style={[styles.heroMeta, { color: theme.primary }]}
                numberOfLines={1}
              >
                {t.appName}
              </Text>
            </View>

            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDarkMode ? 'rgba(255,255,255,0.45)' : '#99999E'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ─── Daily Verse (Full-Bleed Gradient Section Band) ───────────────── */}
      <VerseCard />

      {/* ─── Temario / Doctrine & Church Motto (Full-Bleed Gradient Band) ─── */}
      <LinearGradient
        colors={bandGradientColors}
        locations={[0, 0.55, 1]}
        style={[styles.sectionBand, { borderTopColor: bandTopBorderColor }]}
      >
        <View style={IS_IPAD ? styles.tabletCenter : undefined}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDoctrine(true);
            }}
          >
            <View style={styles.sectionHeaderBlock}>
              <View style={styles.sectionTitleInlineRow}>
                <Text style={[styles.sectionTitle, { color: sectionHeadingColor }]}>
                  {t.doctrineCardTitle}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={isDarkMode ? 'rgba(255,255,255,0.45)' : '#99999E'}
                  style={styles.sectionChevron}
                />
              </View>
              <Text style={[styles.sectionSub, { color: sectionSubColor }]}>
                {t.doctrineCardSub}
              </Text>
            </View>

            <View
              style={[
                styles.mottoCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
                !isDarkMode && styles.lightCardShadow,
              ]}
            >
              <Text style={[styles.mottoQuoteText, { color: theme.onSurface }]}>
                {`“${t.churchMottoText}”`}
              </Text>
              <View style={styles.mottoFooterRow}>
                <Text style={[styles.mottoLabelText, { color: theme.primary }]}>
                  — {mottoLabelFormatted}
                </Text>
                <Text style={[styles.doctrineSeeMore, { color: sectionSubColor }]}>
                  {t.seeMore} →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ─── Himnos Recientes (Full-Bleed Gradient Section Band) ──────────── */}
      <LinearGradient
        colors={bandGradientColors}
        locations={[0, 0.55, 1]}
        style={[
          styles.sectionBand,
          { borderTopColor: bandTopBorderColor, paddingBottom: bottomClearance },
        ]}
      >
        <View style={IS_IPAD ? styles.tabletCenter : undefined}>
          <View style={styles.recentsHeader}>
            <View style={styles.recentsHeaderTextWrap}>
              <Text style={[styles.sectionTitle, { color: sectionHeadingColor }]}>
                {t.recentHymns}
              </Text>
              <Text style={[styles.sectionSub, { color: sectionSubColor }]}>
                {recentsSubtitle}
              </Text>
            </View>
            {recentHymns.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearRecent();
                }}
              >
                <Text style={[styles.recentsLabel, { color: theme.primary }]}>
                  {t.churchClear}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentHymns.length === 0 ? (
            <Text style={[styles.recentEmpty, { color: sectionSubColor }]}>
              {t.recentEmpty}
            </Text>
          ) : (
            <View style={styles.recentListWrap}>
              {recentHymns.map((hymn, index) => {
                const isSaved = offline.savedIds.has(String(hymn.id));
                return (
                  <TouchableOpacity
                    key={hymn.id}
                    style={[
                      styles.recentItem,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: bandTopBorderColor,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/hymn/${hymn.id}`);
                    }}
                  >
                    <Text
                      style={[styles.recentNum, { color: theme.primary, opacity: 0.65 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {hymn.number}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentTitle, { color: theme.onSurface }]}>
                        {hymn.title}
                      </Text>
                      {hymn.categories ? (
                        <Text style={[styles.recentCat, { color: sectionSubColor }]}>
                          {translateCategories(hymn.categories, language)}
                        </Text>
                      ) : null}
                    </View>
                    {isSaved && (
                      <MaterialIcons
                        name="offline-pin"
                        size={16}
                        color={theme.primary}
                        style={{ opacity: 0.85 }}
                      />
                    )}
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={theme.outline}
                      style={{ opacity: 0.35 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </LinearGradient>
    </>
  );

  const docCardBg = isDarkMode ? '#1F1F23' : '#FFFFFF';
  const docSheetBg = isDarkMode ? '#131316' : '#FAF6EE';
  const docBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.outlineVariant + '55';
  const docMuted = isDarkMode ? 'rgba(235,235,245,0.62)' : theme.onSurfaceVariant;
  const docIconBg = isDarkMode ? 'rgba(255,255,255,0.09)' : theme.primary + '12';

  const doctrineSections: {
    key: string;
    ios: React.ComponentProps<typeof AppMenuIcon>['ios'];
    android: React.ComponentProps<typeof AppMenuIcon>['android'];
    title: string;
    body: string;
  }[] = [
    { key: 'name', ios: 'building.columns', android: 'account-balance', title: t.doctrineName, body: t.doctrineNameBody },
    { key: 'motto', ios: 'quote.opening', android: 'format-quote', title: t.doctrineMotto, body: t.doctrineMottoBody },
    { key: 'foundation', ios: 'book.closed.fill', android: 'menu-book', title: t.doctrineFoundation, body: t.doctrineFoundationBody },
    { key: 'purpose', ios: 'sparkles', android: 'auto-awesome', title: t.doctrinePurpose, body: t.doctrinePurposeBody },
  ];

  // Shared Modal JSX — Glorify-style backdrop/grabber/header swipe-down + Sacred Ink editorial cards
  const doctrineModal = (
    <Modal
      visible={showDoctrine}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={closeDoctrine}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.docOverlay}>
          <GestureDetector gesture={docBackdropPan}>
            <Reanimated.View style={[styles.docScrim, docBackdropStyle]}>
              <Pressable
                style={StyleSheet.absoluteFill}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                onPress={closeDoctrine}
              />
            </Reanimated.View>
          </GestureDetector>

          <Reanimated.View style={[styles.docSheetOuter, docSheetAnimStyle]}>
            <GestureDetector gesture={docHeaderPan}>
              <View style={styles.docGrabberZone}>
                <SheetGrabber inline interactive />
              </View>
            </GestureDetector>

            <View
              style={[
                styles.docSheet,
                {
                  backgroundColor: docSheetBg,
                  maxHeight: Math.round(screenHeight * 0.88),
                },
              ]}
            >
              {/* Draggable Sticky Header */}
              <GestureDetector gesture={docHeaderPan}>
                <View style={[styles.docHeader, { borderBottomColor: docBorder }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.docEyebrow, { color: docMuted }]}>
                      {t.homeOurChurchMotto.toUpperCase()}
                    </Text>
                    <Text style={[styles.docModalTitle, { color: theme.primary }]}>
                      {t.doctrineModalTitle}
                    </Text>
                  </View>
                  <GlassSurface
                    isInteractive
                    glassEffectStyle="regular"
                    intensity={58}
                    style={[
                      styles.docCloseGlass,
                      !IS_IOS && {
                        backgroundColor: docIconBg,
                        overflow: 'hidden',
                      },
                    ]}
                  >
                    <Pressable
                      onPress={closeDoctrine}
                      accessibilityRole="button"
                      accessibilityLabel={t.close}
                      style={({ pressed }) => [styles.docCloseGlassHit, pressed && { opacity: 0.72 }]}
                    >
                      <AppMenuIcon
                        ios="xmark"
                        android="close"
                        color={theme.primary}
                        size={19}
                        containerSize={22}
                        scale="large"
                        weight="semibold"
                      />
                    </Pressable>
                  </GlassSurface>
                </View>
              </GestureDetector>

              <ScrollView
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDarkMode ? 'white' : 'black'}
                contentContainerStyle={[
                  styles.docScroll,
                  { paddingBottom: Math.max(insets.bottom, 22) + 12 },
                ]}
              >
                {/* Intro Paragraph */}
                <Text style={[styles.docIntroBody, { color: theme.onSurface }]}>
                  {t.doctrineIntro}
                </Text>

                {/* Highlighted Scripture Quote Callout */}
                <View
                  style={[
                    styles.docVerseCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : theme.primary + '0A',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.10)' : theme.primary + '22',
                    },
                  ]}
                >
                  <View style={[styles.docVerseAccent, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.docVerse, { color: theme.primary }]}>
                    {t.doctrineVerse}
                  </Text>
                </View>

                {/* 4 Editorial Identity Cards */}
                <View style={styles.docCardsStack}>
                  {doctrineSections.map((sec) => (
                    <View
                      key={sec.key}
                      style={[
                        styles.docSectionCard,
                        { backgroundColor: docCardBg, borderColor: docBorder },
                      ]}
                    >
                      <View style={styles.docSectionHeader}>
                        <View style={[styles.docSectionIcon, { backgroundColor: docIconBg }]}>
                          <AppMenuIcon
                            ios={sec.ios}
                            android={sec.android}
                            color={theme.primary}
                            size={18}
                            containerSize={20}
                            weight="semibold"
                          />
                        </View>
                        <Text style={[styles.docSectionTitle, { color: theme.primary }]}>
                          {sec.title}
                        </Text>
                      </View>
                      <Text style={[styles.docBody, { color: theme.onSurface }]}>
                        {sec.body}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Bottom Pill Close Action */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.docCloseBtn, { backgroundColor: theme.primary }]}
                  onPress={closeDoctrine}
                >
                  <Text style={[styles.docCloseTxt, { color: theme.onPrimary }]}>{t.close}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Reanimated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );

  // Compact Home actions preserve the original scroll-driven header fade.
  const homeHeader = (
    <Animated.View
      pointerEvents={headerHidden ? "none" : "box-none"}
      onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top + ipadTopOffset + (IS_IOS ? 2 : 6),
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        },
      ]}
    >
      <View style={[styles.headerTitleRow, IS_IPAD && styles.tabletCenter]}>
        <Text style={[styles.headerTitle, { color: headerTitleColor, fontSize: 34 }]}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t.tabHome}</Text>
        <HomeHeaderActions glassEpoch={headerGlassEpoch} onSearch={handleHeaderSearchPress} />
      </View>
    </Animated.View>
  );

  return (
    <TabSwipeWrapper
      currentTab="home"
      shouldIgnoreTouch={(_, y) => y <= (headerHeight || insets.top + 60)}
      style={[styles.root, { backgroundColor: rootBackgroundColor }]}
    >
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <Animated.ScrollView
          // Verse-card modals remain React descendants: do not consume their first keyboard tap.
          keyboardShouldPersistTaps="always"
          ref={scrollViewRef}
          // The measured toolbar includes the top safe area; do not apply it twice.
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          contentContainerStyle={styles.scroll}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
            listener: (event: any) => {
              const hidden = event.nativeEvent.contentOffset.y >= 35;
              setHeaderHidden(current => {
                if (current === hidden) return current;
                if (current && !hidden && IS_IOS) {
                  setHeaderGlassEpoch(e => e + 1);
                }
                return hidden;
              });
            },
          })}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
        >
          {scrollContent}
        </Animated.ScrollView>
      </SafeAreaView>

      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(255,255,255,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(255,255,255,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {homeHeader}

      {doctrineModal}
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  tabletCenter: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerTitle: {
    ...fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    includeFontPadding: false,
    letterSpacing: -0.4,
    textAlign: 'left',
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  scroll: {
    paddingHorizontal: 0,
  },

  // Top Hero Section (Apple Books "Continue" Card style with Leather Hymnal Cover)
  topSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 26,
  },
  heroSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookCoverShadow: {
    width: 54,
    height: 80,
    borderRadius: 6,
    marginRight: 16,
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    backgroundColor: '#3A0E12',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroTextSide: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
    marginRight: 8,
  },
  heroHeadline: {
    ...fonts.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  heroSub: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regular),
    fontSize: 13.5,
    lineHeight: 18,
  },
  heroMeta: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 12.5,
    lineHeight: 16,
    marginTop: 3,
  },

  // Full-Bleed Apple Books Section Bands
  sectionBand: {
    width: '100%',
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderBlock: {
    marginBottom: 14,
    gap: 3,
  },
  sectionTitleInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...fonts.bold,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  sectionChevron: {
    marginLeft: 2,
    marginTop: 1,
  },
  sectionSub: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regular),
    fontSize: 15,
    lineHeight: 20,
  },

  // Doctrine & Church Motto inner quote block
  mottoCard: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lightCardShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  mottoQuoteText: {
    ...fonts.regularItalic,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 12,
  },
  mottoFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  mottoLabelText: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 13.5,
  },
  doctrineSeeMore: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 13.5,
  },

  // Recents
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  recentsHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  recentsLabel: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 14,
    paddingTop: 4,
  },
  recentListWrap: {
    marginTop: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 16,
  },
  recentNum: {
    ...fonts.bold,
    fontSize: 22,
    width: 48,
    textAlign: 'center',
  },
  recentTitle: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 2,
  },
  recentCat: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regular),
    fontSize: 13.5,
    lineHeight: 18,
  },
  recentEmpty: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regularItalic),
    fontSize: 15,
    lineHeight: 21,
    paddingVertical: 6,
  },

  // Doctrine modal
  docOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  docScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  docSheetOuter: {
    width: '100%',
  },
  docGrabberZone: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  docSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docEyebrow: {
    ...fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  docModalTitle: {
    ...fonts.bold,
    fontSize: 22,
    lineHeight: 27,
  },
  docCloseGlass: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docCloseGlassHit: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docScroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  docIntroBody: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regular),
    fontSize: 15.5,
    lineHeight: 24.5,
    paddingHorizontal: 4,
  },
  docVerseCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'stretch',
  },
  docVerseAccent: {
    width: 3.5,
    borderRadius: 2,
  },
  docVerse: {
    flex: 1,
    ...fonts.regularItalic,
    fontSize: 15.5,
    lineHeight: 23.5,
  },
  docCardsStack: {
    gap: 12,
  },
  docSectionCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSectionTitle: {
    ...fonts.bold,
    fontSize: 19,
    flex: 1,
  },
  docBody: {
    ...(IS_IOS ? fonts.sansRegular : fonts.regular),
    fontSize: 15,
    lineHeight: 23.5,
    opacity: 0.92,
  },
  docCloseBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCloseTxt: {
    ...(IS_IOS ? fonts.sansSemiBold : fonts.semiBold),
    fontSize: 16,
  },
});
