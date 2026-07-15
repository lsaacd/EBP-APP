/**
 * HomeScreen component — The primary landing screen of the Himnario application.
 *
 * This screen features:
 * - A dynamic hero card for exploring all hymns.
 * - A "Verse of the Day" component.
 * - Quick access to recently viewed hymns.
 * - Platform-specific navigation behaviors (iOS fade-out vs Android collapsible header).
 *
 * @returns {React.JSX.Element} The rendered Home screen.
 */
import React, { useState, useRef, useCallback } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useRecentHymns } from '../../context/RecentHymnsContext';
import { useLanguage } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import VerseCard from '../../components/VerseCard';
import { useNowPlaying } from '../../context/NowPlayingContext';

import { LinearGradient } from 'expo-linear-gradient';

const IS_IOS = Platform.OS === 'ios';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { recentIds, clearRecent } = useRecentHymns();
  const { t } = useLanguage();
  const { currentHymnId } = useNowPlaying();
  const insets = useSafeAreaInsets();
  const bottomClearance = Math.max(insets.bottom, 20) + (currentHymnId ? 140 : 80);
  const scrollViewRef = useRef<any>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);
  const [showDoctrine, setShowDoctrine] = useState(false);

  // Resolve hymn objects from IDs, show max 5
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

  // ── Shared scroll content ─────────────────────────────────────────────────
  const scrollContent = (
    <>
      {/* ─── Hero Card — "Ver todos los himnos" ───────── */}
      <View
        style={[styles.heroWrapper, {
          shadowColor: isDarkMode ? '#ffffffff' : theme.primary,
          backgroundColor: isDarkMode ? '#1c1c1c' : theme.primary,
        }]}
      >
        <TouchableOpacity
          style={[styles.heroSurface, { backgroundColor: isDarkMode ? '#1F1F1F' : theme.primary }]}
          activeOpacity={0.92}
          onPress={() => router.push({ pathname: '/hymns', params: { tab: 'himnos', t: Date.now() } })}
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
              style={[styles.heroSub, { color: '#ffffff', opacity: 0.82 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t.exploreCollection}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── Daily Verse ───────────────────────────────── */}
      <VerseCard />

      {/* ─── Temario / Doctrine Card ───────────────────── */}
      <TouchableOpacity
        style={[styles.doctrineCard, {
          backgroundColor: theme.surfaceVariants.containerLow,
          borderWidth: 1,
          borderColor: theme.primary + '18',
        }]}
        activeOpacity={0.82}
        onPress={() => setShowDoctrine(true)}
      >
        <View style={styles.doctrineCardTextBlock}>
          <Text style={[styles.doctrineCardTitle, { color: theme.onSurface }]}>
            {t.doctrineCardTitle}
          </Text>
        </View>
        <View style={[styles.doctrineCardIconWrap, { backgroundColor: theme.primary + '15' }]}>
          <MaterialIcons name="history-edu" size={28} color={theme.primary} />
        </View>
      </TouchableOpacity>

      {/* ─── Himnos Recientes ─────────────────── */}
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
              <Text style={[styles.recentsLabel, { color: theme.outline }]}>{t.clearHistory}</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentHymns.length === 0 ? (
          <Text style={[styles.recentEmpty, { color: theme.outline }]}>
            {t.recentEmpty}
          </Text>
        ) : (
          <View>
            {recentHymns.map((hymn) => (
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
                      {hymn.categories.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.outline} style={{ opacity: 0.3 }} />
              </TouchableOpacity>
            ))}
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
            <Text style={[styles.docModalTitle, { color: theme.primary }]} >
              {t.doctrineModalTitle}
            </Text>
            <View style={[styles.docDivider, { backgroundColor: theme.outlineVariant }]} />

            {/* Intro */}
            <Text style={[styles.docBody, { color: theme.onSurface }]}>
              {t.doctrineIntro}
            </Text>
            <Text style={[styles.docVerse, { color: theme.primary }]}>
              {t.doctrineVerse}
            </Text>
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
  // iOS LAYOUT — fade-out title + Animated.ScrollView
  // ══════════════════════════════════════════════════════════════════════════
  if (IS_IOS) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>

        {/* 1. Scroll content rendered FIRST (bottom of the Z-stack) */}
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
        >
          {scrollContent}
        </Animated.ScrollView>

        {/* 2. Scrim (middle of the Z-stack) */}
        <LinearGradient
          colors={[
            isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
            isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
          ]}
          style={[styles.statusBarScrim, { height: insets.top + 28 }]}
          pointerEvents="none"
        />

        {/* 3. Header Container rendered LAST with pointerEvents="box-none" so it sits on top and receives touches */}
        <View
          style={[
            styles.headerContainer,
            { paddingTop: insets.top + 16 },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.headerTitleRow, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}
            pointerEvents="box-none"
          >
            <Text
              style={[styles.headerTitle, { color: theme.primary, flex: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              Himnario El Buen Pastor
            </Text>
          </Animated.View>
        </View>

        {doctrineModal}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANDROID / WEB LAYOUT — same collapsible header pattern as settings page
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* 1. Scroll content rendered FIRST (bottom of the Z-stack) */}
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

      {/* 2. Scrim (middle of the Z-stack) */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* 3. Header Container rendered LAST with pointerEvents="box-none" so it sits on top and receives touches */}
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        collapsable={false}
        pointerEvents="box-none"
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]} pointerEvents="box-none">
          <Text
            style={[styles.headerTitle, { color: theme.primary, flex: 1 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            Himnario El Buen Pastor
          </Text>
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
    zIndex: 20,   // above header (10) and scroll content
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerDivider: {
    height: 1,
    width: '100%',
    marginTop: 8,
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
    alignItems: 'center',
  },
  heroHeadline: {
    fontFamily: fonts.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 1.8,
    textAlign: 'center',
  },

  // Doctrine card (replaces cantos card)
  doctrineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 40,
    gap: 16,
  },
  doctrineCardTextBlock: {
    flex: 1,
    gap: 4,
  },
  doctrineCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  doctrineCardSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  doctrineCardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    gap: 24,
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

  // Header icon
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
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
