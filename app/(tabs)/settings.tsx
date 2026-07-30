/**
 * SettingsScreen component — Provides user configuration options for the application.
 *
 * Features:
 * - Theme selection (Dark / Light mode).
 * - Dynamic font size adjustment with a live preview.
 * - Language switching (English / Spanish).
 * - "About" section with app version and credits.
 *
 * @returns {React.JSX.Element} The rendered Settings screen.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { sendFeedbackEmail } from '../../utils/feedback';
import { useNowPlaying } from '../../context/NowPlayingContext';

const IS_IOS = Platform.OS === 'ios';

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const hasMiniPlayer = !!currentHymnId && !showFullPlayer;
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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

  // ── Android / web: collapsible header ─────────────────────────────────────
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
      {/* ─── Page Title ────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageSubhead, { color: theme.onSurfaceVariant, opacity: 0.8 }]}>
          {t.settingsSub}
        </Text>
      </View>

      {/* ─── Section: Apariencia ────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.appearance}
        </Text>

        {/* Dark / Light Mode Toggle */}
        <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name={isDarkMode ? "light-mode" : "dark-mode"} size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
                  {isDarkMode ? t.lightModeTitle : t.darkModeTitle}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {isDarkMode ? t.lightModeSub : t.darkModeSub}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.outlineVariant + '66',
                true: theme.primary,
              }}
              thumbColor={
                isDarkMode
                  ? theme.inverseSurface
                  : theme.surfaceVariants.containerHighest
              }
              ios_backgroundColor={theme.outlineVariant + '66'}
            />
          </View>
        </View>

        {/* Font Size Card */}
        <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
          <View style={styles.cardInfo}>
            <MaterialIcons name="format-size" size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
              {t.fontSize}
            </Text>
          </View>

          {/* Preview canvas */}
          <View style={[
            styles.previewCanvas,
            {
              backgroundColor: theme.surfaceVariants.containerLowest,
              borderColor: theme.outlineVariant + '1A',
            }
          ]}>
            <Text style={[styles.previewTitle, { color: theme.primary }]}>
              ¡Cuán Grande es Él!
            </Text>
            <Text style={[
              styles.previewText,
              {
                color: theme.onSurface,
                fontSize: Math.round(18 * fontSizeMultiplier),
                lineHeight: Math.round(18 * fontSizeMultiplier * 1.6),
              }
            ]}>
              Señor, mi Dios, al contemplar los cielos...
            </Text>
          </View>

          {/* +/- Controls + Slider */}
          <View style={styles.sliderRow}>
            <TouchableOpacity
              onPress={() => setFontSizeMultiplier(fontSizeMultiplier - 0.1)}
              style={[styles.stepBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
            >
              <MaterialIcons name="remove" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={0.8}
              maximumValue={2.0}
              step={0.05}
              value={fontSizeMultiplier}
              onValueChange={setFontSizeMultiplier}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.surfaceVariants.containerHighest}
              thumbTintColor={theme.primary}
            />

            <TouchableOpacity
              onPress={() => setFontSizeMultiplier(fontSizeMultiplier + 0.1)}
              style={[styles.stepBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
            >
              <MaterialIcons name="add" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Section: General ──────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.general}
        </Text>

        {/* Language */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setShowLangPicker(true)}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="language" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>{t.language}</Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.languageSub}
                </Text>
              </View>
            </View>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: theme.primary }]}>
                {language === 'es' ? t.spanish : t.english}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={theme.onSurfaceVariant}
                style={{ opacity: 0.4 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setShowAbout(true)}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="info" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
                  {t.about}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.aboutSub}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="open-in-new"
              size={22}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.4 }}
            />
          </View>
        </TouchableOpacity>

        {/* Report Error / Enviar sugerencia */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => sendFeedbackEmail(language)}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="feedback" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
                  {t.reportError}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.reportErrorSub}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="open-in-new"
              size={22}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.4 }}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── Section: Rate this App ──────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.rateApp.toUpperCase()}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
          <View style={styles.rateContent}>
            {/* Decorative star row */}
            <View style={styles.rateStarsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <MaterialIcons
                  key={i}
                  name="star"
                  size={22}
                  color={theme.primary}
                  style={{ opacity: 1 - (Math.abs(i - 3) * 0.15) }}
                />
              ))}
            </View>

            <Text style={[styles.rateTitle, { color: theme.onSurface }]}>
              {t.rateApp}
            </Text>
            <Text style={[styles.rateDesc, { color: theme.onSurfaceVariant }]}>
              {t.rateAppSub}
            </Text>

            <TouchableOpacity
              style={[styles.rateBtn, { borderColor: theme.primary }]}
              activeOpacity={0.7}
              onPress={() => {
                const storeUrl = Platform.select({
                  ios: 'https://apps.apple.com/app/id0000000000', // Replace with real App Store ID
                  android: 'https://play.google.com/store/apps/details?id=com.himnario.elbuenpastor', // Replace with real package name
                  default: '',
                });
                if (storeUrl) Linking.openURL(storeUrl);
              }}
            >
              <Text style={[styles.rateBtnText, { color: theme.primary }]}>
                {t.rateAppButton}
              </Text>
              <MaterialIcons name="open-in-new" size={14} color={theme.primary} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Signature Footer ─────────────────────── */}
      <View style={styles.signatureFooter}>
        <View style={[styles.signatureLine, { backgroundColor: theme.primary }]} />
        <Text style={[styles.signatureQuote, { color: theme.primary }]}>
          {t.signatureQuote}
        </Text>
        <Text style={[styles.signatureMeta, { color: theme.onSurfaceVariant }]}>
          v 1.0.0 — Solo A Dios La Gloria
        </Text>
      </View>

      <View style={{ height: hasMiniPlayer ? 200 : 120 }} />
    </>
  );

  // ── Modals (shared) ───────────────────────────────────────────────────────
  const modals = (
    <>
      <Modal
        visible={showAbout}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.aboutOverlay}>
          {/* Backdrop click interceptor */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowAbout(false)}
          />
          <View style={[styles.aboutSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.aboutHandle, { backgroundColor: theme.outlineVariant }]} />
            <ScrollView 
              showsVerticalScrollIndicator={true} 
              indicatorStyle={isDarkMode ? 'white' : 'black'}
              contentContainerStyle={styles.aboutScroll}
            >
              <View style={styles.aboutHeader}>
                <Text style={[styles.aboutAppName, { color: theme.primary }]}>
                  Himnario El Buen Pastor
                </Text>
                <Text style={[styles.aboutVersion, { color: theme.onSurfaceVariant }]}>
                  {t.aboutVersion}
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
            </ScrollView>
            <TouchableOpacity
              style={[styles.aboutCloseBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={[styles.aboutCloseTxt, { color: theme.onPrimary }]}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop click interceptor */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowLangPicker(false)}
          />
          <View style={[styles.langSheet, { backgroundColor: theme.surfaceVariants.container }]}>
            <Text style={[styles.langSheetTitle, { color: theme.onSurface }]}>
              {t.language}
            </Text>
            {(['es', 'en'] as const).map((lang) => {
              const label = lang === 'es' ? t.spanish : t.english;
              const isSelected = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langOption,
                    {
                      borderColor: isSelected ? theme.primary : 'transparent',
                      backgroundColor: isSelected ? theme.primary + '12' : 'transparent'
                    },
                  ]}
                  onPress={() => { setLanguage(lang); setShowLangPicker(false); }}
                >
                  <Text style={[
                    styles.langOptionText,
                    { color: isSelected ? theme.primary : theme.onSurface },
                  ]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // iOS LAYOUT — fade-out title + Animated.ScrollView
  // ══════════════════════════════════════════════════════════════════════════
  if (IS_IOS) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        {/* Fade-out header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + 16,
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[styles.headerTitle, { color: theme.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {t.settings}
          </Text>
        </Animated.View>

        {/* ── Status Bar Scrim ──────────────────────────────────── */}
        <LinearGradient
          colors={[
            isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
            isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
          ]}
          style={[styles.statusBarScrim, { height: insets.top + 28 }]}
          pointerEvents="none"
        />

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


        {modals}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANDROID / WEB LAYOUT — collapsible header
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* Collapsible TopAppBar */}
      <Animated.View
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
        style={[
          styles.headerContainer,
          { backgroundColor: theme.background, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]} pointerEvents="box-none">
          <Text
            style={[styles.headerTitle, { color: theme.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {t.settings}
          </Text>
        </View>
      </Animated.View>

      {/* ── Status Bar Scrim ──────────────────────────────────── */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { paddingTop: headerH + 8 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
        >
          {scrollContent}
        </ScrollView>
      </SafeAreaView>


      {modals}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 31,
    lineHeight: 40,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  iconBtn: { padding: 8 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  pageHeader: { marginBottom: 40 },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: 8,
    lineHeight: 40,
  },
  pageSubhead: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
  },

  section: { marginBottom: 32, gap: 16 },

  // Rate this App
  rateContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  rateTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  rateDesc: {
    fontFamily: fonts.regularItalic,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.55,
    marginBottom: 20,
    lineHeight: 20,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  rateBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    opacity: 0.6,
  },

  card: {
    padding: 20,
    borderRadius: 12,
    gap: 0,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 17,
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 14,
  },

  previewCanvas: {
    marginTop: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewTitle: {
    fontFamily: fonts.boldItalic,
    fontSize: 25,
    marginBottom: 6,
  },
  previewText: {
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signatureFooter: {
    marginTop: 40,
    alignItems: 'center',
  },
  signatureLine: {
    width: 64,
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    opacity: 0.10,
  },
  signatureQuote: {
    fontFamily: fonts.regularItalic,
    fontSize: 20,
    opacity: 0.6,
    textAlign: 'center',
  },
  signatureMeta: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    marginTop: 16,
    opacity: 0.4,
  },

  // About modal
  aboutOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  aboutSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  aboutHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  aboutScroll: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
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
  aboutCloseBtn: {
    marginHorizontal: 28,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutCloseTxt: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },

  // Language picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  langSheet: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  langSheetTitle: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 17,
    marginBottom: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  langOptionText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 16,
  },
  iconOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  iconOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
  },
  iconColorPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionLabel: {
    fontSize: 13,
  },
  iconCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
});
