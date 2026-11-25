import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { fonts } from '../theme/fonts';
import { useTheme } from '../theme/ThemeContext';
import AppMenuIcon from './AppMenuIcon';
import GlassSurface from './GlassSurface';

export interface ActionToastMessage {
  id: number;
  title: string;
  subtitle?: string;
  icon?: 'check' | 'photo' | 'pin';
}

interface ActionToastProps {
  toast: ActionToastMessage | null;
  topOffset?: number;
}

export default function ActionToast({ toast, topOffset = 18 }: ActionToastProps) {
  const { theme, isDarkMode } = useTheme();
  if (!toast) return null;

  const iosIcon =
    toast.icon === 'pin'
      ? 'mappin.circle.fill'
      : toast.icon === 'photo'
        ? 'photo.circle.fill'
        : 'checkmark.circle.fill';
  const androidIcon =
    toast.icon === 'pin'
      ? 'add-location-alt'
      : toast.icon === 'photo'
        ? 'add-photo-alternate'
        : 'check-circle';

  const fallbackBg = isDarkMode ? 'rgba(34, 34, 34, 0.94)' : 'rgba(255, 253, 249, 0.96)';
  const stroke = isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(110, 22, 25, 0.14)';

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      entering={FadeInUp.springify().damping(18).stiffness(270).mass(0.75)}
      exiting={FadeOutUp.duration(220)}
      style={[styles.anchor, { top: topOffset }]}
    >
      <GlassSurface
        glassEffectStyle="regular"
        intensity={72}
        tonalColor={fallbackBg}
        style={[
          styles.pill,
          {
            borderColor: stroke,
          },
        ]}
      >
        <View style={styles.iconBadge}>
          <AppMenuIcon
            ios={iosIcon}
            android={androidIcon}
            color="#2E9E56"
            size={20}
          />
        </View>
        <View style={styles.textWrap}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: theme.onSurface }]}
          >
            {toast.title}
          </Text>
          {!!toast.subtitle && (
            <Text
              numberOfLines={1}
              style={[styles.subtitle, { color: theme.onSurfaceVariant }]}
            >
              {toast.subtitle}
            </Text>
          )}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 120,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexShrink: 1,
    gap: 1,
  },
  title: {
    ...fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    ...fonts.sansRegular,
    fontSize: 12,
    lineHeight: 15,
  },
});
