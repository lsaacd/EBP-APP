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
import SheetGrabber from '../SheetGrabber';
import Constants from 'expo-constants';
import AboutHymnalContent from '../AboutHymnalContent';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, computeUserInitials } from '../../context/AuthContext';
import { APPLE_AVATAR_GRADIENT } from '../HomeHeaderActions';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { sendFeedbackEmail } from '../../utils/feedback';
import { useNowPlaying } from '../../context/NowPlayingContext';
import OfflineAudioCard from '../OfflineAudioCard';
import AppShareSheet from '../AppShareSheet';
import WhatsNewSheet from '../WhatsNewSheet';
import TabSwipeWrapper from '../TabSwipeWrapper';

const IS_IPAD = Platform.OS === 'ios' && Boolean((Platform as any).isPad);

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();
  const { t, language, hymnLanguage, setLanguage, setHymnLanguage } = useLanguage();
  const { user, isSyncing, syncBlocked, openAuthSheet } = useAuth();
  const insets = useSafeAreaInsets();
  const ipadTopOffset = IS_IPAD ? 50 : 0;
  const { currentHymnId, showFullPlayer } = useNowPlaying();
  const hasMiniPlayer = !!currentHymnId && !showFullPlayer;
  const [langPickerTarget, setLangPickerTarget] = useState<'app' | 'hymn' | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showShareApp, setShowShareApp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const isSlidingFont = useRef(false);
  const slidingResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (slidingResetTimerRef.current) clearTimeout(slidingResetTimerRef.current); }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Native-driver scroll fade shared by iOS and Android; no opaque app-bar box.
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

      {/* ─── Section: Cuenta y Nube ────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.authSectionTitle}
        </Text>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={openAuthSheet}
          style={[
            styles.card,
            styles.accountHeroCard,
            {
              backgroundColor: theme.surfaceVariants.containerLow,
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.12)'
                : theme.outlineVariant + '70',
            },
          ]}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              {user ? (
                <View
                  style={[
                    styles.accountAvatarGradient,
                    {
                      backgroundColor: isDarkMode ? '#F3EEE8' : theme.primary,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.22)' : theme.primary + '38',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.accountAvatarInitials,
                      { color: isDarkMode ? '#1A1A1A' : '#FFFFFF' },
                    ]}
                  >
                    {user.initials || computeUserInitials(user.displayName, user.email)}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.accountAvatarBadge,
                    {
                      backgroundColor: isDarkMode
                        ? theme.surfaceVariants.container
                        : theme.primary + '14',
                      borderColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.14)'
                        : theme.primary + '28',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="person-outline"
                    size={24}
                    color={isDarkMode ? '#FDF9F2' : theme.primary}
                  />
                </View>
              )}
              <View style={styles.cardTextContainer}>
                <Text
                  style={[
                    styles.cardTitle,
                    styles.accountCardTitle,
                    {
                      color: user
                        ? theme.onSurface
                        : isDarkMode
                        ? '#F2D7B6'
                        : theme.primary,
                    },
                  ]}
                >
                  {user ? user.displayName || user.email.split('@')[0] : t.authSignIn}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {user
                    ? `${user.email} · ${isSyncing ? t.authSyncingStatus : syncBlocked ? t.authSyncPausedStatus : t.authSyncedStatus}`
                    : t.authMenuSignInSub}
                </Text>
              </View>
            </View>
            {user ? (
              <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
            ) : (
              <View
                style={[
                  styles.accountCtaPill,
                  {
                    backgroundColor: isDarkMode
                      ? theme.surfaceVariants.container
                      : theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.accountCtaPillText,
                    { color: isDarkMode ? '#FFFFFF' : theme.onPrimary },
                  ]}
                >
                  {t.authSettingsSignInCta}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={16}
                  color={isDarkMode ? '#FFFFFF' : theme.onPrimary}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
        {!user && (
          <Text style={[styles.accountFootnote, { color: theme.onSurfaceVariant }]}>
            {t.authSettingsCardHint}
          </Text>
        )}
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
                false: Platform.OS === 'ios' ? (isDarkMode ? '#39393D' : '#E9E9EA') : isDarkMode ? 'rgba(255, 255, 255, 0.20)' : theme.outlineVariant + '66',
                true: Platform.OS === 'ios' ? (isDarkMode ? theme.surfaceVariants.containerHighest : theme.primary) : isDarkMode ? theme.surfaceVariants.container : theme.primary,
              }}
              thumbColor={
                Platform.OS === 'ios'
                  ? undefined
                  : isDarkMode
                    ? '#FFFFFF'
                    : theme.surfaceVariants.containerHighest
              }
              ios_backgroundColor={
                isDarkMode ? '#39393D' : '#E9E9EA'
              }
            />
          </View>
        </View>

        {/* Font Size Card */}
        <View style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="format-size" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface, marginBottom: 0 }]}>
                  {t.fontSize} · {Math.round(22 * fontSizeMultiplier)} px
                </Text>
              </View>
            </View>
            {Math.round(22 * fontSizeMultiplier) !== 22 && (
              <TouchableOpacity
                onPress={() => setFontSizeMultiplier(1.0)}
                style={{ flexShrink: 0, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: theme.primary + '16' }}
              >
                <Text style={{ ...fonts.sansSemiBold, fontSize: 12, color: theme.primary }}>
                  {t.textSizeReset}
                </Text>
              </TouchableOpacity>
            )}
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
              {hymnLanguage === 'en' ? 'How Great Thou Art!' : '¡Cuán Grande es Él!'}
            </Text>
            <Text style={[
              styles.previewText,
              {
                color: theme.onSurface,
                fontSize: Math.min(42, Math.round(22 * fontSizeMultiplier)),
                lineHeight: Math.round(Math.min(42, Math.round(22 * fontSizeMultiplier)) * 1.5),
              }
            ]}>
              {hymnLanguage === 'en' ? 'O Lord my God, when I in awesome wonder...' : 'Señor, mi Dios, al contemplar los cielos...'}
            </Text>
          </View>

          {/* +/- Controls + Slider */}
          <View style={styles.sliderRow}>
            <TouchableOpacity
              onPress={() => setFontSizeMultiplier((Math.round(22 * fontSizeMultiplier) - 1) / 22)}
              style={[styles.stepBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
            >
              <MaterialIcons name="remove" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Slider
              onSlidingStart={() => { if (slidingResetTimerRef.current) { clearTimeout(slidingResetTimerRef.current); slidingResetTimerRef.current = null; } isSlidingFont.current = true; }}
              onSlidingComplete={() => { if (slidingResetTimerRef.current) clearTimeout(slidingResetTimerRef.current); slidingResetTimerRef.current = setTimeout(() => { slidingResetTimerRef.current = null; isSlidingFont.current = false; }, 100); }}
              style={{ flex: 1, height: 40 }}
              minimumValue={12 / 22}
              maximumValue={64 / 22}
              step={1 / 22}
              value={fontSizeMultiplier}
              onValueChange={setFontSizeMultiplier}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.surfaceVariants.containerHighest}
              thumbTintColor={theme.primary}
            />

            <TouchableOpacity
              onPress={() => setFontSizeMultiplier((Math.round(22 * fontSizeMultiplier) + 1) / 22)}
              style={[styles.stepBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
            >
              <MaterialIcons name="add" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Section: Offline audio (Android only) ───── */}
      <OfflineAudioCard />

      {/* ─── Section: General ──────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
          {t.general}
        </Text>

        {/* App Language */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setLangPickerTarget('app')}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="language" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>{t.appLanguage}</Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.appLanguageSub}
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

        {/* Hymn Lyrics Language */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setLangPickerTarget('hymn')}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="translate" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>{t.hymnLanguage}</Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.hymnLanguageSub}
                </Text>
              </View>
            </View>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: theme.primary }]}>
                {hymnLanguage === 'es' ? t.spanish : t.english}
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

        {/* What's New / Novedades */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setShowWhatsNew(true)}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="auto-awesome" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
                  {t.settingsWhatsNewRow}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {`${t.hymnalVersionLabel} ${Constants.expoConfig?.version ?? '2.2.0'}`}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.5 }}
            />
          </View>
        </TouchableOpacity>

        {/* Share App / Compartir aplicación */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surfaceVariants.containerLow }]}
          onPress={() => setShowShareApp(true)}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <MaterialIcons name="share" size={24} color={theme.primary} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
                  {t.authShareAppRow}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.onSurfaceVariant }]}>
                  {t.authShareAppSub}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.5 }}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── Section: Rate this App (iOS only until Android is live on Play Store) ─ */}
      {Platform.OS === 'ios' && (
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
                  Linking.openURL('https://apps.apple.com/app/id6794435414?action=write-review').catch(() => {});
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
      )}

      {/* ─── Signature Footer ─────────────────────── */}
      <View style={styles.signatureFooter}>
        <View style={[styles.signatureLine, { backgroundColor: theme.primary }]} />
        <Text style={[styles.signatureQuote, { color: theme.primary }]}>
          {t.signatureQuote}
        </Text>
        <Text style={[styles.signatureMeta, { color: theme.onSurfaceVariant }]}>
          v {Constants.expoConfig?.version ?? '2.0.0'} — Solo A Dios La Gloria
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
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAbout(false)}
          />
          <View style={[styles.aboutSheet, { backgroundColor: theme.background }]}>
            <SheetGrabber />
            <View style={styles.aboutHandle} />
            <ScrollView 
              showsVerticalScrollIndicator={true} 
              indicatorStyle={isDarkMode ? 'white' : 'black'}
              contentContainerStyle={styles.aboutScroll}
            >
              <AboutHymnalContent />
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
        visible={langPickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLangPickerTarget(null)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop click interceptor */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setLangPickerTarget(null)}
          />
          <View style={[styles.langSheet, { backgroundColor: theme.surfaceVariants.container }]}>
            <Text style={[styles.langSheetTitle, { color: theme.onSurface }]}>
              {langPickerTarget === 'hymn' ? t.hymnLanguage : t.appLanguage}
            </Text>
            {(['es', 'en'] as const).map((lang) => {
              const label = lang === 'es' ? t.spanish : t.english;
              const currentSelection = langPickerTarget === 'hymn' ? hymnLanguage : language;
              const isSelected = currentSelection === lang;
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
                  onPress={() => {
                    if (langPickerTarget === 'hymn') {
                      setHymnLanguage(lang);
                    } else {
                      setLanguage(lang);
                    }
                    setLangPickerTarget(null);
                  }}
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

      <AppShareSheet visible={showShareApp} onClose={() => setShowShareApp(false)} />
      <WhatsNewSheet visible={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED LAYOUT — transparent fade-out title + Animated.ScrollView
  // ══════════════════════════════════════════════════════════════════════════
  return (
      <TabSwipeWrapper currentTab="settings" shouldIgnoreTouch={() => isSlidingFont.current} style={[styles.root, { backgroundColor: theme.background }]}>
        {/* Fade-out header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + ipadTopOffset + 16,
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
          style={[styles.statusBarScrim, { height: insets.top + ipadTopOffset + 28 }]}
          pointerEvents="none"
        />

        <Animated.ScrollView
          ref={scrollViewRef}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + ipadTopOffset + 64 },
            IS_IPAD && styles.tabletCenter,
          ]}
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
      </TabSwipeWrapper>
    );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
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
    ...fonts.bold,
    fontSize: 31,
    lineHeight: 40,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  iconBtn: { padding: 8 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  pageHeader: { marginBottom: 40 },
  pageTitle: {
    ...fonts.bold,
    fontSize: 34,
    marginBottom: 8,
    lineHeight: 40,
  },
  pageSubhead: {
    ...fonts.sansRegular,
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
    ...fonts.bold,
    fontSize: 19,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  rateDesc: {
    ...fonts.regularItalic,
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
    ...fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    ...fonts.sansBold,
    fontSize: 11,
    letterSpacing: 2,
    opacity: 0.6,
  },

  card: {
    padding: 20,
    borderRadius: 12,
    gap: 0,
  },
  accountHeroCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  accountAvatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarInitials: {
    ...fonts.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  accountAvatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCardTitle: {
    ...fonts.sansSemiBold,
  },
  accountCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 999,
    gap: 2,
  },
  accountCtaPillText: {
    ...fonts.sansSemiBold,
    fontSize: 13,
  },
  accountFootnote: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    lineHeight: 18,
    opacity: 0.72,
    paddingHorizontal: 4,
    marginTop: -4,
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
    ...fonts.sansMedium,
    fontSize: 17,
    marginBottom: 2,
  },
  cardDesc: {
    ...fonts.sansRegular,
    fontSize: 13,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    ...fonts.sansMedium,
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
    ...fonts.boldItalic,
    fontSize: 25,
    marginBottom: 6,
  },
  previewText: {
    ...fonts.regular,
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
    ...fonts.regularItalic,
    fontSize: 20,
    opacity: 0.6,
    textAlign: 'center',
  },
  signatureMeta: {
    ...fonts.sansRegular,
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
  aboutCloseBtn: {
    marginHorizontal: 28,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutCloseTxt: {
    ...fonts.sansSemiBold,
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
    ...fonts.sansBold,
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
    ...fonts.sansMedium,
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
