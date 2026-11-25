/**
 * OAuthButtonsStack — Official Apple HIG Sign in with Apple & Google Identity
 * 4-color "G" buttons, shared by both the native iOS SwiftUI auth sheet
 * (via `@expo/ui/swift-ui` `<RNHostView>`) and the RN fallback sheet.
 *
 * Guidelines honored:
 * - Sign in with Apple (Apple HIG & Guideline 4.8):
 *   - Equal or greater prominence (placed first/top, identical 50pt height & full width).
 *   - High-contrast polarity: solid `#FFFFFF` + `#000000` ink in Dark Mode;
 *     solid `#000000` + `#FFFFFF` ink in Light Mode.
 * - Sign in with Google (Google Identity Branding Guidelines):
 *   - Official 4-color Google "G" SVG (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`).
 *   - Dark Mode: `#131314` surface, `#8E918F` hairline border, `#E3E3E3` text,
 *     crisp white circular badge backing the 4-color "G".
 *   - Light Mode: `#FFFFFF` surface, `#747775` subtle border, `#1F1F1F` text.
 * - No trailing settings chevron (`>`), crisp `14pt` continuous curves, optional
 *   horizontal hairline divider (`o con tu correo` / `or with email`) beneath.
 */
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../theme/theme';
import AppMenuIcon from './AppMenuIcon';

export interface OAuthButtonsStackProps {
  isDarkMode: boolean;
  canSignInWithApple: boolean;
  canSignInWithGoogle: boolean;
  appleLabel: string;
  googleLabel: string;
  dividerLabel?: string;
  showDivider?: boolean;
  disabled?: boolean;
  busyProvider?: 'apple' | 'google' | null;
  onPressApple?: () => void;
  onPressGoogle?: () => void;
}

function GoogleFourColorLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function AppleLogoMark({ color, size = 19 }: { color: string; size?: number }) {
  if (Platform.OS === 'ios') {
    return (
      <AppMenuIcon
        ios="apple.logo"
        android="login"
        color={color}
        size={size}
        containerSize={22}
        weight="medium"
      />
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </Svg>
  );
}

export default function OAuthButtonsStack({
  isDarkMode,
  canSignInWithApple,
  canSignInWithGoogle,
  appleLabel,
  googleLabel,
  dividerLabel,
  showDivider = false,
  disabled = false,
  busyProvider = null,
  onPressApple,
  onPressGoogle,
}: OAuthButtonsStackProps) {
  const showApple = canSignInWithApple && Boolean(onPressApple);
  const showGoogle = canSignInWithGoogle && Boolean(onPressGoogle);
  if (!showApple && !showGoogle) return null;

  const appleBg = isDarkMode ? '#FFFFFF' : '#000000';
  const appleInk = isDarkMode ? '#000000' : '#FFFFFF';
  const googleBg = isDarkMode ? '#131314' : '#FFFFFF';
  const googleBorder = isDarkMode ? '#8E918F' : '#747775';
  const googleInk = isDarkMode ? '#E3E3E3' : '#1F1F1F';
  const dividerLineColor = isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(60,60,67,0.18)';
  const dividerTextColor = isDarkMode ? 'rgba(235,235,245,0.58)' : 'rgba(60,60,67,0.60)';

  return (
    <View style={styles.container}>
      {showApple ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appleLabel}
          disabled={disabled}
          onPress={onPressApple}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: appleBg,
              opacity: disabled ? 0.58 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
            },
          ]}
        >
          {busyProvider === 'apple' ? (
            <ActivityIndicator size="small" color={appleInk} />
          ) : (
            <>
              <View style={styles.appleIconWrap}>
                <AppleLogoMark color={appleInk} size={19} />
              </View>
              <Text numberOfLines={1} style={[styles.buttonLabel, { color: appleInk }]}>
                {appleLabel}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      {showGoogle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={googleLabel}
          disabled={disabled}
          onPress={onPressGoogle}
          style={({ pressed }) => [
            styles.button,
            styles.googleButton,
            {
              backgroundColor: googleBg,
              borderColor: googleBorder,
              opacity: disabled ? 0.58 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
            },
          ]}
        >
          {busyProvider === 'google' ? (
            <ActivityIndicator size="small" color={googleInk} />
          ) : (
            <>
              <View
                style={[
                  styles.googleBadge,
                  isDarkMode ? styles.googleBadgeDark : styles.googleBadgeLight,
                ]}
              >
                <GoogleFourColorLogo size={isDarkMode ? 15 : 18} />
              </View>
              <Text numberOfLines={1} style={[styles.buttonLabel, { color: googleInk }]}>
                {googleLabel}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      {showDivider && dividerLabel ? (
        <View style={styles.dividerRow} accessible={false}>
          <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
          <Text style={[styles.dividerText, { color: dividerTextColor }]}>
            {dividerLabel}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  googleButton: {
    borderWidth: 1,
  },
  appleIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadgeDark: {
    backgroundColor: '#FFFFFF',
  },
  googleBadgeLight: {
    backgroundColor: 'transparent',
  },
  buttonLabel: {
    ...fonts.sansSemiBold,
    fontSize: 16,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...fonts.sansMedium,
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
