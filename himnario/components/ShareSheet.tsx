/**
 * ShareSheet — Unified share sheet used by the reader, full player, and mini player (Workstream E).
 *
 * Actions, in this exact order (nothing more):
 * 1. Messages — opens the system share menu with the hymn title and canonical link.
 * 2. WhatsApp (`https://wa.me/?text=...`, no custom URL-scheme permission needed)
 * 3. Create PDF — opens the in-app "Preparar PDF" editor (website parity: format, font size,
 *    columns, fit-to-page, include title, live preview) — see `PdfEditor.tsx`.
 * 4. Copy lyrics with title, author, reference, and canonical link
 *
 * iOS: Glass sheet with grabber. Android: Material 3 bottom sheet with ripple feedback.
 * The PDF editor renders inside this same modal (no nested modals).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { shouldCollapsePlayer } from '../utils/gestureMotion';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../utils/haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';
import PdfEditor from './PdfEditor';


const DEFAULT_COVER = require('../assets/images/EBP_HYMN_COVER.png');

export interface ShareableHymn {
  id: string | number;
  number: string | number;
  title: string;
  lyrics?: string;
  author?: string;
  reference?: string;
  audioCredit?: {
    name?: string;
    url?: string;
  };
}

export interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  hymn: ShareableHymn | null;
  variant?: 'reader' | 'player';
}

export default function ShareSheet({ visible, onClose, hymn, variant = 'reader' }: ShareSheetProps) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const es = language !== 'en';
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const travel = Math.max(420, Math.round(windowHeight * 0.82));
  const pdfHeight = Math.round(windowHeight * 0.92);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'menu' | 'pdf'>('menu');

  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const spring = {
    damping: 28,
    stiffness: 240,
    mass: 1,
    overshootClamping: true,
  };

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, progress]);

  useEffect(() => {
    if (visible) {
      progress.value = 1;
      progress.value = withSpring(0, spring);
    } else {
      setStatusMessage(null);
      setMode('menu');
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .enabled(mode === 'menu')
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(progress);
      dragOrigin.value = progress.value;
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(1, dragOrigin.value + event.translationY / travel)
      );
    })
    .onEnd((event) => {
      const collapse = shouldCollapsePlayer(
        progress.value * travel,
        event.velocityY,
        travel * 0.55
      );
      progress.value = withSpring(
        collapse ? 1 : 0,
        { ...spring, velocity: event.velocityY / travel },
        (finished) => {
          if (finished && collapse) runOnJS(finishClose)();
        }
      );
    })
    .onFinalize((_event, success) => {
      if (!success) {
        progress.value = withSpring(0, spring);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  if (!hymn) return null;

  const isChorus = String(hymn.id).startsWith('E');
  const label = `${isChorus ? 'Estribillo' : 'Himno'} ${hymn.number}`;
  const publicUrl = `https://himnarioebp.com/hymn/${encodeURIComponent(String(hymn.id))}/`;
  const linkMessage = `${label} · ${hymn.title}\nHimnario El Buen Pastor\n\n${publicUrl}`;
  const fullLyricsText = [
    `${label} · ${hymn.title}`,
    'Himnario El Buen Pastor',
    '',
    hymn.lyrics || '',
    hymn.author ? `\nAutor: ${hymn.author}` : '',
    hymn.reference ? `Referencia: ${hymn.reference}` : '',
    `\n${publicUrl}`,
  ]
    .filter((line, idx) => idx < 4 || Boolean(line))
    .join('\n');

  const handleMessages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusMessage(null);
    try {
      // Present above this modal so dismissing the native menu returns to our options.
      // iOS accepts a separate URL item; Android needs the link inside the message.
      await Share.share(
        Platform.OS === 'ios'
          ? { title: `${label} · ${hymn.title}`, message: `${label} · ${hymn.title}\nHimnario El Buen Pastor`, url: publicUrl }
          : { title: `${label} · ${hymn.title}`, message: linkMessage },
        { dialogTitle: es ? 'Compartir alabanza' : 'Share hymn' },
      );
    } catch {
      setStatusMessage(es ? 'No se pudo abrir el menú para compartir. Inténtalo de nuevo.' : 'Could not open the share menu. Please try again.');
    }
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const waText = encodeURIComponent(linkMessage);
    Linking.openURL(`https://wa.me/?text=${waText}`).catch(() => {});
    onClose();
  };

  const handleOpenPdf = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusMessage(null);
    setMode('pdf');
  };

  const handleCopyLyrics = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(fullLyricsText);
    setStatusMessage(t.shareLyricsCopied);
  };

  const options = [
    {
      key: 'messages',
      icon: 'sms' as const,
      iconBg: 'rgba(52, 199, 89, 0.16)',
      iconColor: '#34C759',
      title: t.shareMessages,
      subtitle: es ? 'Mensajes y más aplicaciones de tu dispositivo' : 'Messages and more apps on your device',
      onPress: handleMessages,
    },
    {
      key: 'whatsapp',
      icon: 'whatsapp' as const,
      iconFamily: 'fontawesome' as const,
      iconBg: 'rgba(37, 211, 102, 0.16)',
      iconColor: '#25D366',
      title: t.shareWhatsApp,
      subtitle: t.shareWhatsAppSub,
      onPress: handleWhatsApp,
    },
    {
      key: 'pdf',
      icon: 'picture-as-pdf' as const,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      title: es ? 'Crear PDF' : 'Create PDF',
      subtitle: es ? 'Elige formato, tamaño y columnas' : 'Choose format, size, and columns',
      onPress: handleOpenPdf,
    },
    {
      key: 'copy-lyrics',
      icon: 'content-copy' as const,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      title: t.shareCopyLyrics,
      subtitle: t.shareCopyLyricsSub,
      onPress: handleCopyLyrics,
    },
  ];

  const isIOS = Platform.OS === 'ios';
  const isPdf = mode === 'pdf';

  const menuBody = (
    <View style={styles.inner}>
      {/* Grabber */}
      <View style={[styles.grabber, { backgroundColor: theme.outlineVariant }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          {t.shareHymnTitle}
        </Text>
        <TouchableOpacity
          onPress={animateClose}
          style={[styles.closeBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
          accessibilityLabel={t.close}
        >
          <MaterialIcons name="close" size={18} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Hymn Preview Card */}
      <View
        style={[
          styles.previewCard,
          variant === 'player' && styles.playerCard,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(110,22,25,0.05)',
            borderColor: theme.outlineVariant + '26',
          },
        ]}
      >
        <Image source={DEFAULT_COVER} style={variant === 'player' ? styles.playerCover : styles.coverArt} />
        <View style={[styles.previewTextCol, variant === 'player' && styles.playerText]}>
          <Text style={[styles.previewBadge, { color: theme.primary }]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.previewTitle, { color: theme.onSurface }]} numberOfLines={2}>
            {hymn.title}
          </Text>
          <Text style={[styles.previewDomain, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            himnarioebp.com/hymn/{hymn.id}
          </Text>
        </View>
      </View>

      {/* Status Toast when copied */}
      {statusMessage && (
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: theme.primary + '18', borderColor: theme.primary + '38' },
          ]}
        >
          <MaterialIcons name="check-circle" size={16} color={theme.primary} />
          <Text style={[styles.statusText, { color: theme.primary }]}>
            {statusMessage}
          </Text>
        </View>
      )}

      {/* Share Action Rows */}
      <View style={styles.optionsList}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            android_ripple={{ color: theme.primary + '18' }}
            style={({ pressed }) => [
              styles.optionRow,
              {
                backgroundColor:
                  pressed && isIOS
                    ? theme.surfaceVariants.containerHighest
                    : theme.surfaceVariants.containerLowest,
                borderColor: theme.outlineVariant + '22',
              },
            ]}
            onPress={opt.onPress}
          >
            <View style={[styles.optionIconWrap, { backgroundColor: opt.key === 'whatsapp' || (isIOS && opt.key === 'messages') ? 'transparent' : opt.iconBg }]}>
              {isIOS && opt.key === 'messages' ? (
                <Image source={require('../assets/images/imessage-brand.png')} style={{ width: 38, height: 38 }} resizeMode="contain" />
              ) : opt.iconFamily === 'fontawesome' ? (
                <Image source={require('../assets/images/whatsapp-brand.png')} style={{ width: 38, height: 38 }} resizeMode="contain" />
              ) : (
                <MaterialIcons name={opt.icon} size={22} color={opt.iconColor} />
              )}
            </View>
            <View style={styles.optionTextCol}>
              <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
                {opt.title}
              </Text>
              <Text style={[styles.optionSub, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                {opt.subtitle}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.45 }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const sheetBody = isPdf ? (
    <View style={styles.pdfInner}>
      <View style={[styles.grabber, { backgroundColor: theme.outlineVariant, marginBottom: 10 }]} />
      <PdfEditor hymn={hymn} onBack={() => setMode('menu')} onClose={onClose} />
    </View>
  ) : (
    menuBody
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => (isPdf ? setMode('menu') : animateClose())}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />

        <GestureDetector gesture={pan}>
          <Animated.View style={[{ width: '100%' }, sheetAnimatedStyle]}>
            {isIOS ? (
              <GlassSurface
                intensity={65}
                stableBackdrop
                style={[
                  styles.iosSheet,
                  isPdf && { height: pdfHeight },
                  { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                ]}
              >
                {sheetBody}
              </GlassSurface>
            ) : (
              <View
                style={[
                  styles.androidSheet,
                  isPdf && { height: pdfHeight },
                  {
                    backgroundColor: theme.surfaceVariants.containerLow,
                    paddingBottom: Math.max(insets.bottom, 20) + 14,
                  },
                ]}
              >
                {sheetBody}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  iosSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  androidSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 18,
  },
  pdfSheet: {
    height: '92%',
    maxHeight: '92%',
  },
  pdfInner: {
    flex: 1,
  },
  inner: {
    gap: 14,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.35,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  playerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 18,
  },
  playerCover: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  playerText: {
    flex: 0,
    alignItems: 'center',
    gap: 6,
  },
  coverArt: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  previewTextCol: {
    flex: 1,
    gap: 2,
  },
  previewBadge: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  previewTitle: {
    fontFamily: fonts.boldItalic,
    fontSize: 17,
  },
  previewDomain: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    opacity: 0.65,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    overflow: 'hidden',
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTextCol: {
    flex: 1,
    gap: 1,
  },
  optionTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  optionSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    opacity: 0.75,
  },
});
