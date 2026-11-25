/**
 * TrackEllipsisMenu — Apple Music–style trailing `···` native action menu for hymn rows.
 *
 * Uses `@expo/ui/swift-ui` `<Menu>` on iOS 26+ for guaranteed crisp SF Symbols,
 * `@react-native-menu/menu` on Android, and Alert fallback on Web/older builds.
 */
import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { MenuView, type MenuAction } from '@react-native-menu/menu';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getExpoSwiftUI } from '../utils/expoSwiftUI';
import * as Haptics from '../utils/haptics';
import AppMenuIcon from './AppMenuIcon';

const IS_IOS = Platform.OS === 'ios';
const HAS_NATIVE_MENU =
  Platform.OS !== 'web' && Boolean(UIManager.hasViewManagerConfig?.('MenuView'));

export interface TrackEllipsisMenuProps {
  hymnId: string;
  hymnNumber: string | number;
  hymnTitle: string;
  canPlay: boolean;
  removeLabel: string;
  removeIcon?: 'bookmark.slash' | 'minus.circle';
  onPlay: () => void;
  onOpenLyrics: () => void;
  onAddToPlaylist?: () => void;
  onRemove: () => void;
  iconColor?: string;
}

export default function TrackEllipsisMenu({
  hymnId,
  hymnNumber,
  hymnTitle,
  canPlay,
  removeLabel,
  removeIcon = 'bookmark.slash',
  onPlay,
  onOpenLyrics,
  onAddToPlaylist,
  onRemove,
  iconColor,
}: TrackEllipsisMenuProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const swiftUI = IS_IOS ? getExpoSwiftUI() : null;
  const mutedColor =
    iconColor ?? (isDarkMode ? 'rgba(235,235,245,0.56)' : theme.onSurfaceVariant);

  const handleShare = async () => {
    Haptics.selectionAsync();
    const isChorus = hymnId.startsWith('E');
    const prefix = (isChorus ? t.chorusNumberLabel : t.hymnNumberLabel).replace(
      '{n}',
      String(hymnNumber),
    );
    const publicUrl = `https://himnarioebp.com/hymn/${encodeURIComponent(hymnId)}/`;
    const titleLine = `${prefix} · ${hymnTitle}`;
    try {
      await Share.share(
        IS_IOS
          ? { title: titleLine, message: `${titleLine}\n${t.appName}`, url: publicUrl }
          : { title: titleLine, message: `${titleLine}\n${t.appName}\n\n${publicUrl}` },
        { dialogTitle: t.shareHymnTitle },
      );
    } catch {}
  };

  const handleAction = (id: string) => {
    Haptics.selectionAsync();
    if (id === 'play') onPlay();
    else if (id === 'lyrics') onOpenLyrics();
    else if (id === 'playlist') onAddToPlaylist?.();
    else if (id === 'share') void handleShare();
    else if (id === 'remove') onRemove();
  };

  const nativeActions = useMemo<MenuAction[]>(() => {
    const tint = isDarkMode ? '#FFFFFF' : '#1C1C1E';
    const items: MenuAction[] = [];
    if (canPlay) {
      items.push({
        id: 'play',
        title: t.favoritesPlayNow,
        image: IS_IOS ? 'play.fill' : undefined,
        imageColor: IS_IOS ? tint : undefined,
      });
    }
    items.push({
      id: 'lyrics',
      title: t.favoritesOpenLyrics,
      image: IS_IOS ? 'book' : undefined,
      imageColor: IS_IOS ? tint : undefined,
    });
    if (onAddToPlaylist) {
      items.push({
        id: 'playlist',
        title: t.favoritesAddToPlaylist,
        image: IS_IOS ? 'text.badge.plus' : undefined,
        imageColor: IS_IOS ? tint : undefined,
      });
    }
    items.push(
      {
        id: 'share',
        title: t.favoritesShareHymn,
        image: IS_IOS ? 'square.and.arrow.up' : undefined,
        imageColor: IS_IOS ? tint : undefined,
      },
      {
        id: 'remove',
        title: removeLabel,
        image: IS_IOS ? removeIcon : undefined,
        imageColor: IS_IOS ? '#FF3B30' : undefined,
        attributes: { destructive: true },
      },
    );
    return items;
  }, [
    canPlay,
    isDarkMode,
    onAddToPlaylist,
    removeIcon,
    removeLabel,
    t.favoritesAddToPlaylist,
    t.favoritesOpenLyrics,
    t.favoritesPlayNow,
    t.favoritesShareHymn,
  ]);

  const openFallbackAlert = () => {
    Haptics.selectionAsync();
    const btns: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (canPlay) btns.push({ text: t.favoritesPlayNow, onPress: onPlay });
    btns.push({ text: t.favoritesOpenLyrics, onPress: onOpenLyrics });
    if (onAddToPlaylist) btns.push({ text: t.favoritesAddToPlaylist, onPress: onAddToPlaylist });
    btns.push(
      { text: t.favoritesShareHymn, onPress: () => void handleShare() },
      { text: removeLabel, style: 'destructive', onPress: onRemove },
      { text: t.cancel, style: 'cancel' },
    );
    Alert.alert(`${hymnNumber}. ${hymnTitle}`, undefined, btns);
  };

  if (swiftUI?.ui.Menu) {
    const { Button: SwiftButton, Host, Image: SwiftImage, Menu: SwiftMenu, Section: SwiftSection } =
      swiftUI.ui;
    const { foregroundStyle, frame } = swiftUI.modifiers;
    return (
      <Host
        style={styles.hit}
        colorScheme={isDarkMode ? 'dark' : 'light'}
        seedColor={theme.primary}
      >
        <SwiftMenu
          label={
            <SwiftImage
              systemName="ellipsis"
              size={17}
              modifiers={[
                foregroundStyle({ type: 'color', color: mutedColor }),
                frame({ width: 34, height: 34 }),
              ]}
            />
          }
        >
          {canPlay ? (
            <SwiftButton
              label={t.favoritesPlayNow}
              systemImage="play.fill"
              onPress={() => handleAction('play')}
            />
          ) : null}
          <SwiftButton
            label={t.favoritesOpenLyrics}
            systemImage="book"
            onPress={() => handleAction('lyrics')}
          />
          {onAddToPlaylist ? (
            <SwiftButton
              label={t.favoritesAddToPlaylist}
              systemImage="text.badge.plus"
              onPress={() => handleAction('playlist')}
            />
          ) : null}
          <SwiftButton
            label={t.favoritesShareHymn}
            systemImage="square.and.arrow.up"
            onPress={() => handleAction('share')}
          />
          <SwiftSection>
            <SwiftButton
              role="destructive"
              label={removeLabel}
              systemImage={removeIcon}
              onPress={() => handleAction('remove')}
            />
          </SwiftSection>
        </SwiftMenu>
      </Host>
    );
  }

  if (HAS_NATIVE_MENU) {
    return (
      <MenuView
        actions={nativeActions}
        shouldOpenOnLongPress={false}
        themeVariant={isDarkMode ? 'dark' : 'light'}
        onPressAction={({ nativeEvent }) => handleAction(nativeEvent.event)}
        style={styles.hit}
      >
        <View style={styles.hit} accessibilityRole="button" accessibilityLabel={t.churchMoreActions}>
          <AppMenuIcon
            ios="ellipsis"
            android="more-horiz"
            size={18}
            color={mutedColor}
            weight="semibold"
          />
        </View>
      </MenuView>
    );
  }

  return (
    <Pressable
      hitSlop={8}
      onPress={openFallbackAlert}
      accessibilityRole="button"
      accessibilityLabel={t.churchMoreActions}
      style={({ pressed }) => [styles.hit, pressed && { opacity: 0.6 }]}
    >
      <AppMenuIcon
        ios="ellipsis"
        android="more-horiz"
        size={18}
        color={mutedColor}
        weight="semibold"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
