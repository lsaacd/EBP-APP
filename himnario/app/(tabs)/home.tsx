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
import React, { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  BackHandler,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { useRecentHymns } from '../../context/RecentHymnsContext';
import { useLanguage, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import VerseCard from '../../components/VerseCard';
import HomeHeaderActions from '../../components/HomeHeaderActions';
import TabSwipeWrapper from '../../components/TabSwipeWrapper';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { offlineAudio, refreshOfflineAudio } from '../../audio/offline-audio';
import { LinearGradient } from 'expo-linear-gradient';

const IS_IOS = Platform.OS === 'ios';
const HYMNAL_BOOK_COVER = require('../../assets/images/hymnal-leather-cover.jpg');

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { recentIds, clearRecent } = useRecentHymns();
  const { t, language } = useLanguage();
  const { currentHymnId } = useNowPlaying();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);
  const scrollViewRef = useRef<any>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleOpacity = scrollY.interpolate({ inputRange: [0, 35], outputRange: [1, 0], extrapolate: 'clamp' });
  const titleTranslateY = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, -10], extrapolate: 'clamp' });
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    void refreshOfflineAudio();
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

  const allHymns = [...hymnsData, ...estribillosData];
  const recentHymns = recentIds
    .map((rid) => allHymns.find((h) => String(h.id) === rid))
    .filter(Boolean)
    .slice(0, 10) as typeof hymnsData;

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

  const heroSubtitle = language === 'es'
    ? 'Colección completa de alabanzas y coritos'
    : 'Complete hymn and chorus collection';
  const recentsSubtitle = language === 'es'
    ? 'Alabanzas que has abierto recientemente.'
    : 'Hymns you have opened recently.';
  const mottoLabelFormatted = language === 'es'
    ? 'Lema de nuestra Iglesia'
    : 'Our Church Motto';

  // ── Shared scroll content ─────────────────────────────────────────────────
  const scrollContent = (
    <>
      {/* ─── Top Section — "Explora los Himnos" (Apple Books Continue style) ─── */}
      <LinearGradient
        colors={topBandGradientColors}
        locations={[0, 0.55, 1]}
        style={[
          styles.topSection,
          { paddingTop: (headerHeight || insets.top + 54) + 8 },
        ]}
      >
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
          <View style={styles.bookCoverShadow}>
            <Image
              source={HYMNAL_BOOK_COVER}
              style={styles.bookCoverImage}
              resizeMode="cover"
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
      </LinearGradient>

      {/* ─── Daily Verse (Full-Bleed Gradient Section Band) ───────────────── */}
      <VerseCard />

      {/* ─── Temario / Doctrine & Church Motto (Full-Bleed Gradient Band) ─── */}
      <LinearGradient
        colors={bandGradientColors}
        locations={[0, 0.55, 1]}
        style={[styles.sectionBand, { borderTopColor: bandTopBorderColor }]}
      >
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
                {language === 'es' ? 'Limpiar' : 'Clear'}
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
      </LinearGradient>
    </>
  );

  // Shared Modal JSX
  const doctrineModal = (
    <Modal
      visible={showDoctrine}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDoctrine(false)}
    >
      <View style={styles.docOverlay}>
        <View style={[styles.docSheet, { backgroundColor: theme.background }]}>
          <View style={[styles.docHandle, { backgroundColor: theme.outlineVariant }]} />
          <ScrollView
            showsVerticalScrollIndicator={true}
            indicatorStyle={isDarkMode ? 'white' : 'black'}
            contentContainerStyle={styles.docScroll}
          >
            <Text style={[styles.docModalTitle, { color: theme.primary }]}>
              {t.doctrineModalTitle}
            </Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Intro */}
            <Text style={[styles.docBody, { color: theme.onSurface }]}>{t.doctrineIntro}</Text>
            <Text style={[styles.docVerse, { color: theme.primary }]}>{t.doctrineVerse}</Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Nombre */}
            <Text style={[styles.docSectionTitle, { color: theme.primary }]}>
              {t.doctrineName}
            </Text>
            <Text style={[styles.docBody, { color: theme.onSurface }]}>
              {t.doctrineNameBody}
            </Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Lema */}
            <Text style={[styles.docSectionTitle, { color: theme.primary }]}>
              {t.doctrineMotto}
            </Text>
            <Text style={[styles.docBody, { color: theme.onSurface }]}>
              {t.doctrineMottoBody}
            </Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Fundamento */}
            <Text style={[styles.docSectionTitle, { color: theme.primary }]}>
              {t.doctrineFoundation}
            </Text>
            <Text style={[styles.docBody, { color: theme.onSurface }]}>
              {t.doctrineFoundationBody}
            </Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Finalidad */}
            <Text style={[styles.docSectionTitle, { color: theme.primary }]}>
              {t.doctrinePurpose}
            </Text>
            <Text style={[styles.docBody, { color: theme.onSurface }]}>
              {t.doctrinePurposeBody}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.docCloseBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowDoctrine(false)}
          >
            <Text style={[styles.docCloseTxt, { color: theme.onPrimary }]}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          paddingTop: insets.top + (IS_IOS ? 2 : 6),
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        },
      ]}
    >
      <View style={styles.headerTitleRow}>
        <Text style={[styles.headerTitle, { color: headerTitleColor, fontSize: 34 }]}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{language === 'es' ? 'Inicio' : 'Home'}</Text>
        <HomeHeaderActions onSearch={handleHeaderSearchPress} />
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
          ref={scrollViewRef}
          // The measured toolbar includes the top safe area; do not apply it twice.
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          contentContainerStyle={styles.scroll}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
            listener: (event: any) => {
              const hidden = event.nativeEvent.contentOffset.y >= 35;
              setHeaderHidden(current => current === hidden ? current : hidden);
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  heroSub: {
    fontFamily: IS_IOS ? fonts.sansRegular : fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  heroMeta: {
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
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
    fontFamily: fonts.bold,
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
    fontFamily: IS_IOS ? fonts.sansRegular : fonts.regular,
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
    fontFamily: fonts.regularItalic,
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
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
    fontSize: 13.5,
  },
  doctrineSeeMore: {
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
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
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
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
    fontFamily: fonts.bold,
    fontSize: 22,
    width: 48,
    textAlign: 'center',
  },
  recentTitle: {
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 2,
  },
  recentCat: {
    fontFamily: IS_IOS ? fonts.sansRegular : fonts.regular,
    fontSize: 13.5,
    lineHeight: 18,
  },
  recentEmpty: {
    fontFamily: IS_IOS ? fonts.sansRegular : fonts.regularItalic,
    fontSize: 15,
    lineHeight: 21,
    paddingVertical: 6,
  },

  // Doctrine modal
  docOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  docSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  docHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  docScroll: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  docModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  docDivider: {
    height: 1,
    opacity: 0.2,
    marginVertical: 20,
  },
  docSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 10,
  },
  docBody: {
    fontFamily: IS_IOS ? fonts.sansRegular : fonts.regular,
    fontSize: 15.5,
    lineHeight: 24,
    opacity: 0.9,
  },
  docVerse: {
    fontFamily: fonts.regularItalic,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.8,
  },
  docCloseBtn: {
    marginHorizontal: 28,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  docCloseTxt: {
    fontFamily: IS_IOS ? fonts.sansSemiBold : fonts.semiBold,
    fontSize: 15.5,
  },
});
