/**
 * AppShareSheet — Custom YouVersion Bible-inspired "Compartir Aplicación" sheet.
 *
 * Features:
 * 1. Interactive segmented toggle:
 *    - "Tarjeta" (Visual 1200x630 promotional banner preview)
 *    - "Código QR" (Branded QR code for instant in-person scanning at church)
 * 2. Quick Share Actions:
 *    - WhatsApp (1-tap invite with https://himnarioebp.com/app/ which unfurls the 1200x630 banner)
 *    - Mensajes y más (Native OS share sheet with message + URL)
 *    - Compartir imagen promocional (Shares the actual PNG banner via expo-sharing)
 *    - Copiar enlace (Copies https://himnarioebp.com/app/ to clipboard)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../utils/haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import GlassSurface from './GlassSurface';

const APP_SHARE_BANNER = require('../assets/images/app-share-banner.png');
const APP_SMART_QR = require('../assets/images/ebp-smart-app-qr.png');
const IMESSAGE_ICON = require('../assets/images/imessage-brand.png');
const WHATSAPP_ICON = require('../assets/images/whatsapp-brand.png');

export const SMART_APP_URL = 'https://himnarioebp.com/app/';

export interface AppShareSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppShareSheet({ visible, onClose }: AppShareSheetProps) {
  const { theme, isDarkMode } = useTheme();
  const { language } = useLanguage();
  const es = language !== 'en';
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(240, windowWidth - 40);
  const bannerHeight = Math.round((cardWidth * 630) / 1200);

  const [tab, setTab] = useState<'banner' | 'qr'>('banner');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStatusMessage(null);
      setTab('banner');
      setSharingImage(false);
    }
  }, [visible]);

  const inviteTitle = es
    ? 'Himnario El Buen Pastor — App Oficial'
    : 'El Buen Pastor Hymnal — Official App';

  const inviteBody = es
    ? 'Alaba a Dios donde estés. Descarga la aplicación oficial del Himnario El Buen Pastor (637 himnos y 124 coritos con letras y audio sin conexión):'
    : 'Praise God wherever you are. Download the official El Buen Pastor Hymnal app (637 hymns and 124 choruses with lyrics and offline audio):';

  const fullShareMessage = `${inviteBody}\n\n${SMART_APP_URL}`;

  const handleMessages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusMessage(null);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { title: inviteTitle, message: inviteBody, url: SMART_APP_URL }
          : { title: inviteTitle, message: fullShareMessage },
        { dialogTitle: inviteTitle }
      );
    } catch {
      setStatusMessage(
        es
          ? 'No se pudo abrir el menú para compartir.'
          : 'Could not open the share menu.'
      );
    }
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const waText = encodeURIComponent(fullShareMessage);
    Linking.openURL(`https://wa.me/?text=${waText}`).catch(() => {});
    onClose();
  };

  const handleSharePromoImage = async () => {
    if (sharingImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusMessage(null);
    setSharingImage(true);
    try {
      const assetModule = tab === 'qr' ? APP_SMART_QR : APP_SHARE_BANNER;
      const [asset] = await Asset.loadAsync(assetModule);
      const localUri = asset.localUri || asset.uri;
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: inviteTitle,
        });
      } else {
        await handleMessages();
      }
    } catch {
      setStatusMessage(
        es
          ? 'No se pudo compartir la imagen. Intenta de nuevo.'
          : 'Could not share the image. Please try again.'
      );
    } finally {
      setSharingImage(false);
    }
  };

  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(SMART_APP_URL);
    setStatusMessage(
      es ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard'
    );
  };

  const isIOS = Platform.OS === 'ios';

  const options = [
    {
      key: 'whatsapp',
      title: 'WhatsApp',
      subtitle: es
        ? 'Enviar invitación con vista previa a un chat o grupo'
        : 'Send invite with preview banner to a chat or group',
      onPress: handleWhatsApp,
      iconBg: 'transparent',
      iconColor: '#25D366',
      customImage: WHATSAPP_ICON,
      customImageSize: 42,
    },
    {
      key: 'messages',
      title: es ? 'Mensajes y más…' : 'Messages & more…',
      subtitle: es
        ? 'Compartir enlace por iMessage, SMS o redes sociales'
        : 'Share link via iMessage, SMS, or social apps',
      onPress: handleMessages,
      iconBg: isIOS ? 'transparent' : 'rgba(52, 199, 89, 0.16)',
      iconColor: '#34C759',
      icon: 'sms' as const,
      customImage: isIOS ? IMESSAGE_ICON : undefined,
      customImageSize: 38,
    },
    {
      key: 'share-image',
      title:
        tab === 'qr'
          ? es
            ? 'Compartir imagen del código QR'
            : 'Share QR code image'
          : es
            ? 'Compartir tarjeta promocional'
            : 'Share promotional banner',
      subtitle: es
        ? 'Ideal para estados de WhatsApp, historias o grupos'
        : 'Great for WhatsApp Status, Stories, or church groups',
      onPress: handleSharePromoImage,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      icon: 'image' as const,
      loading: sharingImage,
    },
    {
      key: 'copy-link',
      title: es ? 'Copiar enlace de descarga' : 'Copy download link',
      subtitle: 'himnarioebp.com/app',
      onPress: handleCopyLink,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      icon: 'link' as const,
    },
  ];

  const sheetContent = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Grabber */}
      <View style={[styles.grabber, { backgroundColor: theme.outlineVariant }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          {es ? 'Compartir Aplicación' : 'Share App'}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeBtn,
            { backgroundColor: theme.surfaceVariants.containerHighest },
          ]}
          accessibilityLabel={es ? 'Cerrar' : 'Close'}
        >
          <MaterialIcons name="close" size={18} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Segmented Mode Switcher: Tarjeta | Código QR */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: isDarkMode
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(36,37,31,0.07)',
          },
        ]}
      >
        <Pressable
          style={[
            styles.segmentBtn,
            tab === 'banner' && [
              styles.segmentBtnActive,
              {
                backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
              },
            ],
          ]}
          onPress={() => {
            if (tab !== 'banner') {
              Haptics.selectionAsync();
              setTab('banner');
            }
          }}
        >
          <MaterialIcons
            name="featured-play-list"
            size={15}
            color={tab === 'banner' ? theme.primary : theme.onSurfaceVariant}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: tab === 'banner' ? theme.onSurface : theme.onSurfaceVariant,
                fontFamily:
                  tab === 'banner'
                    ? 'PublicSans_700Bold'
                    : 'PublicSans_500Medium',
              },
            ]}
            numberOfLines={1}
          >
            {es ? 'Tarjeta' : 'Banner'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            tab === 'qr' && [
              styles.segmentBtnActive,
              {
                backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
              },
            ],
          ]}
          onPress={() => {
            if (tab !== 'qr') {
              Haptics.selectionAsync();
              setTab('qr');
            }
          }}
        >
          <MaterialIcons
            name="qr-code-2"
            size={16}
            color={tab === 'qr' ? theme.primary : theme.onSurfaceVariant}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: tab === 'qr' ? theme.onSurface : theme.onSurfaceVariant,
                fontFamily:
                  tab === 'qr' ? 'PublicSans_700Bold' : 'PublicSans_500Medium',
              },
            ]}
            numberOfLines={1}
          >
            {es ? 'Código QR' : 'In-Person QR'}
          </Text>
        </Pressable>
      </View>

      {/* Visual Card Preview (Banner or QR) */}
      {tab === 'banner' ? (
        <Pressable
          onPress={handleMessages}
          style={[
            styles.bannerCard,
            {
              width: cardWidth,
              backgroundColor: '#FCF9F2',
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.14)'
                : 'rgba(110,22,25,0.14)',
            },
          ]}
        >
          <Image
            source={APP_SHARE_BANNER}
            style={[
              styles.bannerImage,
              { width: cardWidth, height: bannerHeight },
            ]}
            resizeMode="contain"
          />
          <View
            style={[
              styles.bannerFooter,
              {
                backgroundColor: isDarkMode
                  ? '#1C1C1E'
                  : 'rgba(255,255,255,0.92)',
                borderTopColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(36,37,31,0.08)',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.bannerFooterDomain, { color: theme.primary }]}
                numberOfLines={1}
              >
                HIMNARIOEBP.COM/APP
              </Text>
              <Text
                style={[styles.bannerFooterTitle, { color: theme.onSurface }]}
                numberOfLines={1}
              >
                {es
                  ? 'Disponible gratis para iPhone y Android'
                  : 'Available free for iPhone & Android'}
              </Text>
            </View>
            <MaterialIcons
              name="open-in-new"
              size={18}
              color={theme.onSurfaceVariant}
              style={{ opacity: 0.6 }}
            />
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.qrCard,
            {
              width: cardWidth,
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(110,22,25,0.04)',
              borderColor: theme.outlineVariant + '26',
            },
          ]}
        >
          <View style={styles.qrImageWrap}>
            <Image
              source={APP_SMART_QR}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.qrTitle, { color: theme.onSurface }]}>
            {es ? 'Escanea para descargar' : 'Scan to download'}
          </Text>
          <Text style={[styles.qrSubtitle, { color: theme.onSurfaceVariant }]}>
            {es
              ? 'Pídele a un hermano que apunte con la cámara de su teléfono para instalar la app en iPhone o Android.'
              : 'Ask someone nearby to point their phone camera here to install on iPhone or Android.'}
          </Text>
        </View>
      )}

      {/* Status Toast when copied */}
      {statusMessage && (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: theme.primary + '18',
              borderColor: theme.primary + '38',
            },
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
            <View
              style={[
                styles.optionIconWrap,
                { backgroundColor: opt.iconBg },
              ]}
            >
              {opt.loading ? (
                <ActivityIndicator size="small" color={opt.iconColor} />
              ) : opt.customImage ? (
                <Image
                  source={opt.customImage}
                  style={{
                    width: opt.customImageSize,
                    height: opt.customImageSize,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <MaterialIcons
                  name={opt.icon!}
                  size={22}
                  color={opt.iconColor}
                />
              )}
            </View>
            <View style={styles.optionTextCol}>
              <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
                {opt.title}
              </Text>
              <Text
                style={[styles.optionSub, { color: theme.onSurfaceVariant }]}
                numberOfLines={1}
              >
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
    </ScrollView>
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
            stableBackdrop
            style={[
              styles.iosSheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 12 },
            ]}
          >
            {sheetContent}
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
            {sheetContent}
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
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  androidSheet: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 18,
  },
  scroll: {
    width: '100%',
  },
  inner: {
    width: '100%',
    gap: 13,
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
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
  },
  bannerCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  bannerImage: {
    alignSelf: 'center',
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  bannerFooterDomain: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  bannerFooterTitle: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 13,
    marginTop: 1,
  },
  qrCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  qrImageWrap: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: 156,
    height: 156,
  },
  qrTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    marginTop: 4,
  },
  qrSubtitle: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 310,
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
