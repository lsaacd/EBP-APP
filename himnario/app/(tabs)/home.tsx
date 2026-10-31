/**
 * HomeScreen component — The primary landing screen of the Himnario application.
 *
 * This screen features:
 * - Header with native search icon button (navigates to /hymns?focusSearch=1).
 * - One-time dismissible iOS streaming & offline-audio notice.
 * - A dynamic hero card for exploring all hymns.
 * - A "Continuar escuchando" (Continue listening) card when a hymn has been played.
 * - A "Verse of the Day" component.
 * - Church Identity & Motto block ("Verdad, honestidad, justicia, santidad y caridad") with "Ver más".
 * - Compact offline-audio status card linking to Settings.
 * - Quick access to recently viewed hymns with saved-offline badges.
 * - Platform-specific navigation behaviors (iOS fade-out vs Android collapsible header).
 *
 * @returns {React.JSX.Element} The rendered Home screen.
 */
import React, { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  View,
  Text,
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
import IosStreamingNotice from '../../components/IosStreamingNotice';
import GlassSurface from '../../components/GlassSurface';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { offlineAudio, refreshOfflineAudio } from '../../audio/offline-audio';
import { LinearGradient } from 'expo-linear-gradient';

const IS_IOS = Platform.OS === 'ios';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { recentIds, clearRecent } = useRecentHymns();
  const { t, language } = useLanguage();
  const {
    currentHymnId,
    lastPlayedHymnId,
    isPlaying,
    togglePlayPause,
    openPlayer,
  } = useNowPlaying();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);
  const scrollViewRef = useRef<any>(null);

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

  const continueHymnId = currentHymnId || lastPlayedHymnId;
  const continueHymn = continueHymnId
    ? allHymns.find((h) => String(h.id) === String(continueHymnId))
    : undefined;

  // ── Android: block hardware/swipe back so home never navigates to index ──
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  // ── Android / web: collapsible header (same pattern as settings) ───────────
  const [headerH, setHeaderH] = useState(0);
  const headerTranslate = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerHidden = useRef(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;

    if (y < 5 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      lastScrollY.current = y;
      return;
    }

    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 3) return;

    if (dy > 0 && !headerHidden.current && y > 10) {
      headerHidden.current = true;
      Animated.timing(headerTranslate, {
        toValue: -headerH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else if (dy < 0 && headerHidden.current) {
      headerHidden.current = false;
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  };

  // ── iOS: scroll-driven fade-out ───────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, -1],
    extrapolate: 'clamp',
  });

  const handleHeaderSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/hymns',
      params: { tab: 'himnos', focusSearch: '1', t: String(Date.now()) },
    });
  };

  // ── Shared scroll content ─────────────────────────────────────────────────
  const scrollContent = (
    <>
      {/* ─── One-Time iOS Streaming Notice ───────────────────────── */}
      <IosStreamingNotice />

      {/* ─── Hero Card — "Explora Todos Los Himnos" ───────────────── */}
      <View
        style={[
          styles.heroWrapper,
          {
            shadowColor: isDarkMode ? '#ffffff44' : theme.primary,
            backgroundColor: isDarkMode ? '#1c1c1c' : theme.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.heroSurface,
            { backgroundColor: isDarkMode ? '#1F1F1F' : theme.primary },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/hymns',
              params: { tab: 'himnos', t: String(Date.now()) },
            });
          }}
        >
          <MaterialIcons
            name="auto-stories"
            size={45}
            color="#ffffff"
            style={styles.heroIconSide}
          />
          <View style={styles.heroTextSide}>
            <Text
              style={[styles.heroHeadline, { color: '#ffffff' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {t.exploreAll}
            </Text>
            <Text
              style={[styles.heroSub, { color: '#ffffff', opacity: 0.7 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t.exploreCollection}
            </Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* ─── Continuar escuchando Card ────────────────────────────── */}
      {continueHymn && (
        <View
          style={[
            styles.continueCard,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.primary + '22',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.continueCardMain}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/hymn/${continueHymn.id}`);
            }}
          >
            <View
              style={[
                styles.continueBadge,
                { backgroundColor: theme.primary + '14' },
              ]}
            >
              <Text style={[styles.continueBadgeNum, { color: theme.primary }]}>
                {continueHymn.number}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.continueEyebrow, { color: theme.primary }]}>
                {t.continueListening}
              </Text>
              <Text
                style={[styles.continueTitle, { color: theme.onSurface }]}
                numberOfLines={1}
              >
                {continueHymn.title}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              currentHymnId === String(continueHymn.id) && isPlaying
                ? language === 'es'
                  ? 'Pausar'
                  : 'Pause'
                : t.continueListening
            }
            style={[styles.continuePlayBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (currentHymnId === String(continueHymn.id)) {
                togglePlayPause();
              } else {
                openPlayer(String(continueHymn.id));
              }
            }}
          >
            <MaterialIcons
              name={
                currentHymnId === String(continueHymn.id) && isPlaying
                  ? 'pause'
                  : 'play-arrow'
              }
              size={22}
              color={theme.onPrimary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Daily Verse ──────────────────────────────────────────── */}
      <VerseCard />

      {/* ─── Temario / Doctrine & Church Motto Card ───────────────── */}
      <TouchableOpacity
        style={[
          styles.doctrineCard,
          {
            backgroundColor: theme.surfaceVariants.containerLow,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.primary + '24',
          },
        ]}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowDoctrine(true);
        }}
      >
        <View style={styles.doctrineTopRow}>
          <View
            style={[
              styles.doctrineCardIconWrap,
              { backgroundColor: theme.primary + '12' },
            ]}
          >
            <MaterialIcons name="history-edu" size={24} color={theme.primary} />
          </View>
          <View style={styles.doctrineCardTextBlock}>
            <Text style={[styles.doctrineCardTitle, { color: theme.onSurface }]}>
              {t.doctrineCardTitle}
            </Text>
            <Text style={[styles.doctrineSeeMore, { color: theme.primary }]}>
              {t.seeMore} →
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={theme.outlineVariant} />
        </View>

        <View
          style={[
            styles.mottoDivider,
            { backgroundColor: theme.outlineVariant + '33' },
          ]}
        />

        <View style={styles.mottoQuoteWrap}>
          <Text style={[styles.mottoQuoteText, { color: theme.onSurface }]}>
            {`“${t.churchMottoText}”`}
          </Text>
          <Text style={[styles.mottoLabelText, { color: theme.primary }]}>
            {t.churchMottoLabel}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ─── Compact Offline Audio Status Row ─────────────────────── */}
      {offline.total > 0 && (
        <TouchableOpacity
          style={[
            styles.offlineStatusCard,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: theme.outlineVariant + '26',
            },
          ]}
          activeOpacity={0.78}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/settings');
          }}
        >
          <View
            style={[
              styles.offlineStatusIconWrap,
              { backgroundColor: theme.primary + '12' },
            ]}
          >
            <MaterialIcons
              name={offline.saved >= offline.total ? 'offline-pin' : 'cloud-download'}
              size={20}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.offlineStatusTitle, { color: theme.onSurface }]}>
              {t.offlineAudioTitle}
            </Text>
            <Text
              style={[styles.offlineStatusSub, { color: theme.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {t.offlineAudioSaved
                .replace('{saved}', String(offline.saved))
                .replace('{total}', String(offline.total))}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.outlineVariant} />
        </TouchableOpacity>
      )}

      {/* ─── Himnos Recientes ─────────────────────────────────────── */}
      <View style={styles.recentsSection}>
        <View style={styles.recentsHeader}>
          <Text style={[styles.recentsTitle, { color: theme.primary }]}>
            {t.recentHymns}
          </Text>
          {recentHymns.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearRecent();
              }}
            >
              <Text style={[styles.recentsLabel, { color: theme.outline }]}>
                {t.clearHistory}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {recentHymns.length === 0 ? (
          <Text style={[styles.recentEmpty, { color: theme.outline }]}>
            {t.recentEmpty}
          </Text>
        ) : (
          <View>
            {recentHymns.map((hymn) => {
              const isSaved = offline.savedIds.has(String(hymn.id));
              return (
                <TouchableOpacity
                  key={hymn.id}
                  style={styles.recentItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/hymn/${hymn.id}`);
                  }}
                >
                  <Text
                    style={[styles.recentNum, { color: theme.primary, opacity: 0.4 }]}
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
                      <Text style={[styles.recentCat, { color: theme.outline }]}>
                        {translateCategories(hymn.categories, language).toUpperCase()}
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
                    style={{ opacity: 0.3 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom clearance so content scrolls above the native tab bar */}
      <View style={{ height: bottomClearance }} />
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

  // ══════════════════════════════════════════════════════════════════════════
  // iOS LAYOUT — fade-out title + Animated.ScrollView + Glass Search Button
  // ══════════════════════════════════════════════════════════════════════════
  if (IS_IOS) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
        >
          {scrollContent}
        </Animated.ScrollView>

        <LinearGradient
          colors={[
            isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
            isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
          ]}
          style={[styles.statusBarScrim, { height: insets.top + 28 }]}
          pointerEvents="none"
        />

        <View
          style={[styles.headerContainer, { paddingTop: insets.top + 14 }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.headerTitleRow,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={{ width: 38 }} pointerEvents="none" />
            <Text
              style={[styles.headerTitle, { color: theme.primary, flex: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              Himnario El Buen Pastor
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                language === 'es' ? 'Buscar himnos' : 'Search hymns'
              }
              activeOpacity={0.75}
              onPress={handleHeaderSearchPress}
            >
              <GlassSurface
                isInteractive
                intensity={55}
                style={styles.headerSearchGlassBtn}
              >
                <MaterialIcons name="search" size={20} color={theme.primary} />
              </GlassSurface>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {doctrineModal}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANDROID / WEB LAYOUT — collapsible header + tonal Search Button
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { paddingTop: headerH + 20 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
        >
          {scrollContent}
        </ScrollView>
      </SafeAreaView>

      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        collapsable={false}
        pointerEvents="box-none"
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.background,
            transform: [{ translateY: headerTranslate }],
          },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 18 }]} pointerEvents="box-none">
          <View style={{ width: 40 }} pointerEvents="none" />
          <Text
            style={[styles.headerTitle, { color: theme.primary, flex: 1 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            Himnario El Buen Pastor
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={language === 'es' ? 'Buscar himnos' : 'Search hymns'}
            style={[
              styles.headerSearchAndroidBtn,
              { backgroundColor: theme.surfaceVariants.containerLow },
            ]}
            activeOpacity={0.75}
            onPress={handleHeaderSearchPress}
          >
            <MaterialIcons name="search" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {doctrineModal}
    </View>
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
    elevation: 4,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 8,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 25,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  headerSearchGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchAndroidBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
  },

  // Hero
  heroWrapper: {
    borderRadius: 16,
    marginBottom: 16,
  },
  heroSurface: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  heroIconSide: {
    flexShrink: 0,
    marginRight: 16,
    zIndex: 2,
  },
  heroTextSide: {
    flex: 1,
    flexShrink: 1,
    zIndex: 2,
    gap: 4,
  },
  heroHeadline: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  heroSub: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // Continuar escuchando
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  continueCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBadgeNum: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  continueEyebrow: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  continueTitle: {
    fontFamily: fonts.regularItalic,
    fontSize: 17,
  },
  continuePlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Doctrine & Church Motto card
  doctrineCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  doctrineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  doctrineCardTextBlock: {
    flex: 1,
    gap: 3,
  },
  doctrineCardTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  doctrineSeeMore: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
  },
  doctrineCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mottoDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 14,
  },
  mottoQuoteWrap: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  mottoQuoteText: {
    fontFamily: fonts.regularItalic,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  mottoLabelText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Compact Offline Audio Status Card
  offlineStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 32,
    gap: 12,
  },
  offlineStatusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineStatusTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
    marginBottom: 1,
  },
  offlineStatusSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
  },

  // Recents
  recentsSection: { gap: 16 },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  recentsTitle: {
    fontFamily: fonts.boldItalic,
    fontSize: 24,
  },
  recentsLabel: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 20,
  },
  recentNum: {
    fontFamily: fonts.bold,
    fontSize: 24,
    width: 56,
    textAlign: 'center',
  },
  recentTitle: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 17,
    marginBottom: 2,
  },
  recentCat: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  recentEmpty: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    opacity: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 8,
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
    fontFamily: fonts.boldItalic,
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
    fontFamily: fonts.boldItalic,
    fontSize: 20,
    marginBottom: 10,
  },
  docBody: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.85,
  },
  docVerse: {
    fontFamily: fonts.regularItalic,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  docCloseBtn: {
    marginHorizontal: 28,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  docCloseTxt: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
});
