/**
 * ListSortMenu — Compact native pull-down sort menu (modeled after Oddswell's ListSortMenu).
 *
 * Uses `@react-native-menu/menu` on iOS/Android for authentic native UIMenu pull-down checkmarks
 * and falls back cleanly to a cycling Pressable on Web or environments without the native MenuView.
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { MenuView } from '@react-native-menu/menu';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import AppMenuIcon from './AppMenuIcon';
import GlassSurface from './GlassSurface';

export type ListSortOption<T extends string> = {
  value: T;
  label: string;
  shortLabel: string;
  iosIcon?: string;
};

export interface ListSortMenuProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly ListSortOption<T>[];
  menuTitle: string;
  /** Render inside a compact Liquid Glass pill on iOS (great beside filter chips). */
  pill?: boolean;
}

const HAS_NATIVE_MENU =
  Platform.OS !== 'web' && Boolean(UIManager.hasViewManagerConfig?.('MenuView'));

export default function ListSortMenu<T extends string>({
  value,
  onChange,
  options,
  menuTitle,
  pill = false,
}: ListSortMenuProps<T>) {
  const { theme, isDarkMode } = useTheme();
  const selected = options.find((opt) => opt.value === value) ?? options[0];
  if (!selected) return null;

  const isIOS = Platform.OS === 'ios';
  const labelColor = isDarkMode ? '#FDF9F2' : theme.onSurface;
  const iconColor = isDarkMode ? 'rgba(253,249,242,0.72)' : theme.primary;

  const triggerInner = (
    <View style={[styles.trigger, pill && styles.triggerPill]} accessibilityRole="button" accessibilityLabel={`${menuTitle}: ${selected.label}`}>
      <AppMenuIcon
        ios="arrow.up.arrow.down"
        android="sort"
        size={13}
        containerSize={15}
        weight="semibold"
        color={iconColor}
      />
      <Text numberOfLines={1} style={[styles.label, { color: labelColor }]}>
        {selected.shortLabel}
      </Text>
      <AppMenuIcon
        ios="chevron.up.chevron.down"
        android="unfold-more"
        size={11}
        containerSize={13}
        weight="semibold"
        color={isDarkMode ? 'rgba(255,255,255,0.52)' : theme.onSurfaceVariant}
      />
    </View>
  );

  const styledTrigger = pill ? (
    isIOS ? (
      <GlassSurface
        isInteractive
        glassEffectStyle="regular"
        intensity={56}
        tonalColor={
          isDarkMode
            ? 'rgba(255,255,255,0.09)'
            : theme.surfaceVariants.containerHigh
        }
        style={[
          styles.pillShell,
          {
            borderColor: isDarkMode
              ? 'rgba(255,255,255,0.16)'
              : theme.outlineVariant + '44',
          },
        ]}
      >
        {triggerInner}
      </GlassSurface>
    ) : (
      <View
        style={[
          styles.pillShell,
          styles.pillAndroid,
          {
            backgroundColor: theme.surfaceVariants.containerHighest,
            borderColor: theme.outlineVariant + '38',
          },
        ]}
      >
        {triggerInner}
      </View>
    )
  ) : (
    triggerInner
  );

  if (!HAS_NATIVE_MENU) {
    const cycleNext = () => {
      const idx = options.findIndex((opt) => opt.value === value);
      const next = options[(idx + 1) % options.length];
      if (next) {
        Haptics.selectionAsync().catch(() => {});
        onChange(next.value);
      }
    };
    return (
      <Pressable onPress={cycleNext} style={({ pressed }) => [pressed && { opacity: 0.72 }]}>
        {styledTrigger}
      </Pressable>
    );
  }

  return (
    <MenuView
      title={menuTitle}
      onPressAction={({ nativeEvent }) => {
        const nextVal = nativeEvent.event as T;
        if (nextVal && nextVal !== value) {
          Haptics.selectionAsync().catch(() => {});
          onChange(nextVal);
        }
      }}
      actions={options.map((opt) => ({
        id: opt.value,
        title: opt.label,
        state: opt.value === value ? ('on' as const) : ('off' as const),
        image: isIOS && opt.iosIcon ? opt.iosIcon : undefined,
        imageColor: isIOS ? (isDarkMode ? '#FFFFFF' : theme.primary) : undefined,
      }))}
    >
      {styledTrigger}
    </MenuView>
  );
}

const styles = StyleSheet.create({
  pillShell: {
    height: 38,
    borderRadius: 999,
    borderCurve: 'continuous',
    justifyContent: 'center',
  },
  pillAndroid: {
    borderWidth: 1,
    elevation: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  triggerPill: {
    height: 38,
    paddingHorizontal: 13,
  },
  label: {
    ...fonts.sansSemiBold,
    fontSize: 13.5,
    letterSpacing: -0.2,
    flexShrink: 0,
  },
});
