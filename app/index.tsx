import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import EbpLogo from '../assets/images/EBP-LOGO.svg';

const { width } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.5, 220);

/**
 * AppSplashScreen — A custom JS-based splash screen.
 * Renamed from 'SplashScreen' to avoid collision with the 'expo-splash-screen' module.
 */
export default function AppSplashScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // ── Auto-navigate after 1.5 s ────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // ── Pulse animation for the "tap" hint ───────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const navigate = () => router.replace('/home');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Corner glow — Top Right */}
      <View style={[styles.cornerTop, { backgroundColor: theme.primary }]} />

      {/* Corner glow — Bottom Left */}
      <View
        style={[
          styles.cornerBottom,
          { backgroundColor: theme.secondaryContainer },
        ]}
      />

      {/* Main Content */}
      <View style={styles.main}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View
            style={[
              styles.logoGlow,
              { backgroundColor: theme.primary, opacity: 0.05 },
            ]}
          />
          <EbpLogo
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            style={styles.logoImage}
          />
        </View>

        {/* App Identity */}
        <View style={[styles.identity, { paddingTop: insets.top + 20 }]}>
          <Text
            style={[styles.headline, { color: theme.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            Himnario El Buen Pastor
          </Text>
          <Text
            style={[
              styles.subhead,
              { color: theme.onSurfaceVariant, opacity: 0.8 },
            ]}
          >
            Alaba al Señor con alegría
          </Text>
        </View>

        {/* Decorative divider */}
        <LinearGradient
          colors={['transparent', theme.primary + '4D', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />
      </View>

      {/* Footer attribution */}
      <View style={styles.footer}>
        <MaterialIcons name="auto-stories" size={14} color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.onSurface }]}>
          EDICIÓN DIGITAL 2026
        </Text>
        {/* Pulsing "tap to continue" hint */}
        <Animated.Text
          style={[styles.tapHint, { color: theme.onSurfaceVariant, opacity: pulseAnim }]}
        >
          Toca para continuar
        </Animated.Text>
      </View>

      {/* Full-screen transparent tap zone — zIndex:99 beats main/footer's zIndex:10 */}
      <TouchableOpacity
        style={styles.tapZone}
        activeOpacity={1}
        onPress={navigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  cornerTop: {
    position: 'absolute',
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    borderBottomLeftRadius: 1000,
    opacity: 0.05,
  },
  cornerBottom: {
    position: 'absolute',
    bottom: -96,
    left: -96,
    width: 192,
    height: 192,
    borderTopRightRadius: 1000,
    opacity: 0.10,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoGlow: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    borderRadius: 80,
    transform: [{ scale: 1.5 }],
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  identity: {
    alignItems: 'center',
    marginBottom: 64,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  subhead: {
    fontFamily: fonts.regularItalic,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  divider: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    opacity: 0.4,
    zIndex: 10,
  },
  footerText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 3,
  },
  tapHint: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 12,
  },
  // Full-screen touch target — zIndex:99 ensures it wins over main (10)
  // and footer (10) regardless of render order on both iOS and Android.
  tapZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
});
