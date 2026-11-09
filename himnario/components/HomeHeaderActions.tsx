import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, UIManager, View, type ViewProps } from 'react-native';
import type { MenuAction, MenuComponentProps } from '@react-native-menu/menu';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import GlassSurface from './GlassSurface';
import AppMenuIcon from './AppMenuIcon';
import HomeMenuSheet, { type HomeMenuPage, type MenuAnchor } from './HomeMenuSheet';
import AppShareSheet from './AppShareSheet';
import * as Haptics from '../utils/haptics';

// Loading an unregistered Fabric component can crash an older installed binary.
// Web and pre-menu builds retain the existing accessible menu as a fallback.
let NativeMenu: React.ComponentType<MenuComponentProps & ViewProps> | null = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    if (UIManager.hasViewManagerConfig('MenuView')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      NativeMenu = require('@react-native-menu/menu').MenuView;
    }
  } catch { /* Native module is available only after a full rebuild. */ }
}

export default function HomeHeaderActions({ onSearch }: { onSearch: () => void }) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const menuAnchorRef = useRef<View>(null);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sheet, setSheet] = useState<{ anchor: MenuAnchor; page: 'menu' | HomeMenuPage } | null>(null);
  const [shareAppVisible, setShareAppVisible] = useState(false);

  useEffect(() => () => {
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
  }, []);

  const openSheet = (page: 'menu' | HomeMenuPage) => {
    menuAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setSheet({ anchor: { x, y, width, height }, page });
    });
  };
  const selectAction: NonNullable<MenuComponentProps['onPressAction']> = ({ nativeEvent }) => {
    const page = nativeEvent.event;
    if (page !== 'about' && page !== 'help' && page !== 'settings') return;
    // onCloseMenu fires BEFORE UIKit's dismissal animation completes. Allow the
    // system menu to dismiss before presenting our settings/help detail modal.
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    selectionTimer.current = setTimeout(() => {
      selectionTimer.current = null;
      openSheet(page);
    }, Platform.OS === 'ios' ? 400 : 150);
  };

  // Fabric encodes an omitted imageColor as 0; UIKit then renders the SF Symbol
  // with a fully transparent tint. Explicit colors also follow our theme toggle.
  const iosIconColor = Platform.OS === 'ios' ? (isDarkMode ? '#FDF9F2' : '#24251F') : undefined;
  const actions: MenuAction[] = [
    { id: 'about', title: t.homeMenuHistory, image: Platform.OS === 'ios' ? 'clock' : 'ic_menu_recent_history', imageColor: iosIconColor },
    { id: 'help', title: t.homeMenuHelp, image: Platform.OS === 'ios' ? 'questionmark.circle' : 'ic_menu_help', imageColor: iosIconColor },
    { id: 'settings', title: t.homeMenuSettings, image: Platform.OS === 'ios' ? 'gearshape' : 'ic_menu_preferences', imageColor: iosIconColor },
  ];
  // iOS inline groups provide a native separator before Settings. Android keeps
  // the same actions flat instead of introducing an unnecessary submenu.
  const groupedActions: MenuAction[] = Platform.OS === 'ios' ? [
    { title: '', displayInline: true, subactions: actions.slice(0, 2) },
    { title: '', displayInline: true, subactions: actions.slice(2) },
  ] : actions;

  const isIOS = Platform.OS === 'ios';
  const menuIcon = <AppMenuIcon ios="ellipsis" android="more-vert" size={isIOS ? 23 : 22} weight="bold" color={theme.primary} />;
  const buttonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.button,
    !isIOS && styles.androidButtonClip,
    !isIOS && { backgroundColor: pressed ? theme.primary + '18' : 'transparent' },
  ];

  const handleShareAppPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareAppVisible(true);
  };

  return <>
    <View style={styles.actionsRow}>
      <GlassSurface intensity={55} isInteractive style={[styles.shareCircle, Platform.OS === 'android' && styles.androidCapsule]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language === 'es' ? 'Compartir aplicación' : 'Share app'}
          onPress={handleShareAppPress}
          android_ripple={{ color: theme.primary + '20', borderless: false }}
          style={buttonStyle}
        >
          <AppMenuIcon ios="square.and.arrow.up" android="share" size={isIOS ? 25 : 24} containerSize={33} weight="bold" color={theme.primary} />
        </Pressable>
      </GlassSurface>
      <GlassSurface intensity={55} isInteractive style={[styles.capsule, Platform.OS === 'android' && styles.androidCapsule]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.searchPlaceholder}
          onPress={onSearch} android_ripple={{ color: theme.primary + '20', borderless: false }} style={buttonStyle}>
          <AppMenuIcon ios="magnifyingglass" android="search" size={isIOS ? 25 : 24} containerSize={33} weight="bold" color={theme.primary} />
        </Pressable>
        {!isIOS && (
          <View pointerEvents="none" style={[styles.separator, { backgroundColor: theme.outlineVariant }]} />
        )}
        <View ref={menuAnchorRef} collapsable={false} style={styles.menuAnchor}>
          {NativeMenu ? <NativeMenu
            title="Himnario El Buen Pastor" actions={groupedActions} themeVariant={isDarkMode ? 'dark' : 'light'}
            isAnchoredToRight shouldOpenOnLongPress={false} onPressAction={selectAction}
            onOpenMenu={() => setExpanded(true)} onCloseMenu={() => setExpanded(false)}
            accessible accessibilityRole="button" accessibilityLabel={t.homeMenu} accessibilityState={{ expanded }}
            style={styles.button}>
            <View pointerEvents="none" accessible={false} style={styles.button}>{menuIcon}</View>
          </NativeMenu> : <Pressable accessibilityRole="button" accessibilityLabel={t.homeMenu}
            accessibilityState={{ expanded: sheet !== null }} onPress={() => openSheet('menu')}
            android_ripple={{ color: theme.primary + '20', borderless: false }} style={buttonStyle}>
            {menuIcon}
          </Pressable>}
        </View>
      </GlassSurface>
    </View>
    {sheet && <HomeMenuSheet initialPage={sheet.page} anchor={sheet.anchor} onClose={() => setSheet(null)} />}
    <AppShareSheet visible={shareAppVisible} onClose={() => setShareAppVisible(false)} />
  </>;
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  shareCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  capsule: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, flexShrink: 0, paddingHorizontal: 3 },
  androidCapsule: { borderRadius: 22 },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  androidButtonClip: { overflow: 'hidden' },
  menuAnchor: { width: 44, height: 44 },
  separator: { width: StyleSheet.hairlineWidth, height: 18, opacity: 0.65 },
});
