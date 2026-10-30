/**
 * ShareSheet — Unified share sheet used by the reader, full player, and mini player (Workstream E).
 *
 * Actions (parity with `docs/js/sharing.js`):
 * - WhatsApp (`https://wa.me/?text=...`, no custom URL-scheme permission needed)
 * - Copy link (`https://himnarioebp.com/hymn/{id}/`)
 * - Copy full lyrics with title, author, reference, and canonical link
 * - System share sheet (`Share.share`)
 *
 * iOS: Glass sheet with grabber. Android: Material 3 bottom sheet with ripple feedback.
 */
import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';

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
}

export default function ShareSheet({ visible, onClose, hymn }: ShareSheetProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setStatusMessage(null);
  }, [visible]);

  if (!hymn) return null;

  const isChorus = String(hymn.id).startsWith('E');
  const label = `${isChorus ? 'Estribillo' : 'Himno'} ${hymn.number}`;
  const publicUrl = `https://himnarioebp.com/hymn/${encodeURIComponent(String(hymn.id))}/`;
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

  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(publicUrl);
    setStatusMessage(t.shareLinkCopied);
  };

  const handleCopyLyrics = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(fullLyricsText);
    setStatusMessage(t.shareLyricsCopied);
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const waText = encodeURIComponent(`${label} · ${hymn.title}\nHimnario El Buen Pastor\n\n${publicUrl}`);
    Linking.openURL(`https://wa.me/?text=${waText}`).catch(() => {});
    onClose();
  };

  const handleSystemShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      Share.share({
        title: `${label} · ${hymn.title}`,
        message: fullLyricsText,
        url: publicUrl,
      }).catch(() => {});
    }, 220);
  };

  const options = [
    {
      key: 'copy-link',
      icon: 'link' as const,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      title: t.shareCopyLink,
      subtitle: t.shareCopyLinkSub,
      onPress: handleCopyLink,
    },
    {
      key: 'whatsapp',
      icon: 'chat' as const,
      iconBg: 'rgba(37, 211, 102, 0.16)',
      iconColor: '#25D366',
      title: t.shareWhatsApp,
      subtitle: t.shareWhatsAppSub,
      onPress: handleWhatsApp,
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
    {
      key: 'more',
      icon: 'ios-share' as const,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      title: t.shareSystemMore,
      subtitle: t.shareSystemMoreSub,
      onPress: handleSystemShare,
    },
  ];

  const isIOS = Platform.OS === 'ios';

  const sheetBody = (
    <View style={styles.inner}>
      {/* Grabber */}
      <View style={[styles.grabber, { backgroundColor: theme.outlineVariant }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          {t.shareHymnTitle}
        </Text>
        <TouchableOpacity
          onPress={onClose}
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
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(110,22,25,0.05)',
            borderColor: theme.outlineVariant + '26',
          },
        ]}
      >
        <Image source={DEFAULT_COVER} style={styles.coverArt} />
        <View style={styles.previewTextCol}>
          <Text style={[styles.previewBadge, { color: theme.primary }]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.previewTitle, { color: theme.onSurface }]} numberOfLines={1}>
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
            <View style={[styles.optionIconWrap, { backgroundColor: opt.iconBg }]}>
              <MaterialIcons name={opt.icon} size={22} color={opt.iconColor} />
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {isIOS ? (
          <GlassSurface
            intensity={65}
            style={[
              styles.iosSheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 12 },
            ]}
          >
            {sheetBody}
          </GlassSurface>
        ) : (
          <View
            style={[
              styles.androidSheet,
              {
                backgroundColor: theme.surfaceVariants.containerLow,
                paddingBottom: Math.max(insets.bottom, 20) + 14,
              },
            ]}
          >
            {sheetBody}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  iosSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  androidSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 18,
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
