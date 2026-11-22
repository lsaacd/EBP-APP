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
import SheetGrabber from './SheetGrabber';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export interface AppShareContentProps {
  embedded?: boolean;
  onAfterWhatsApp?: () => void;
}

export function AppShareContent({
  embedded = false,
  onAfterWhatsApp,
}: AppShareContentProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(240, Math.min(windowWidth - (embedded ? 36 : 40), 560));
  const bannerHeight = Math.round((cardWidth * 630) / 1200);

  const [tab, setTab] = useState<'banner' | 'qr'>('banner');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);

  const inviteTitle = t.appShareElBuenPastorHymnalOfficialApp;

  const inviteBody = t.appSharePraiseGodWhereverYouAreDownload;

  const fullShareMessage = `${inviteBody}\n\n${SMART_APP_URL}`;

  const handleMessages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        t.appShareCouldNotOpenTheShareMenu
      );
    }
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const waText = encodeURIComponent(fullShareMessage);
    Linking.openURL(`https://wa.me/?text=${waText}`).catch(() => {});
    onAfterWhatsApp?.();
  };

  const handleSharePromoImage = async () => {
    if (sharingImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        t.appShareCouldNotShareTheImagePlease
      );
    } finally {
      setSharingImage(false);
    }
  };

  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(SMART_APP_URL);
    setStatusMessage(
      t.shareLinkCopied
    );
  };

  const isIOS = Platform.OS === 'ios';

  const options = [
    {
      key: 'messages',
      title: t.appShareMessagesMore,
      subtitle: t.appShareShareLinkViaImessageSmsOr,
      onPress: handleMessages,
      iconBg: isIOS ? 'transparent' : 'rgba(52, 199, 89, 0.16)',
      iconColor: '#34C759',
      icon: 'sms' as const,
      customImage: isIOS ? IMESSAGE_ICON : undefined,
      customImageSize: 38,
    },
    {
      key: 'whatsapp',
      title: 'WhatsApp',
      subtitle: t.appShareSendInviteWithPreviewBannerTo,
      onPress: handleWhatsApp,
      iconBg: 'transparent',
      iconColor: '#25D366',
      customImage: WHATSAPP_ICON,
      customImageSize: 38,
    },
    {
      key: 'share-image',
      title:
        tab === 'qr'
          ? t.appShareShareQrCodeImage
          : t.appShareSharePromotionalBanner,
      subtitle: t.appShareGreatForWhatsappStatusStoriesOr,
      onPress: handleSharePromoImage,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      icon: 'image' as const,
      loading: sharingImage,
    },
    {
      key: 'copy-link',
      title: t.appShareCopyDownloadLink,
      subtitle: 'himnarioebp.com/app',
      onPress: handleCopyLink,
      iconBg: theme.primary + '18',
      iconColor: theme.primary,
      icon: 'link' as const,
    },
  ];

  return (
    <View style={styles.inner}>
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
                ...(tab === 'banner' ? fonts.sansBold : fonts.sansMedium),
              },
            ]}
            numberOfLines={1}
          >
            {t.appShareBanner}
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
                ...(tab === 'qr' ? fonts.sansBold : fonts.sansMedium),
              },
            ]}
            numberOfLines={1}
          >
            {t.appShareInPersonQr}
          </Text>
        </Pressable>
      </View>

      {/* Visual Card Preview (Banner or QR) */}
      {tab === 'banner' ? (
        <Pressable
          onPress={handleMessages}
          style={({ pressed }) => [
            styles.bannerCard,
            {
              width: cardWidth,
              alignSelf: 'center',
              backgroundColor: '#FCF9F2',
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.14)'
                : 'rgba(110,22,25,0.14)',
              transform: [{ scale: pressed ? 0.985 : 1 }],
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
                {t.appShareAvailableFreeForIphoneAndroid}
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
              alignSelf: 'center',
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
            {t.appShareScanToDownload}
          </Text>
          <Text style={[styles.qrSubtitle, { color: theme.onSurfaceVariant }]}>
            {t.appShareAskSomeoneNearbyToPointTheir}
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
                transform: [{ scale: pressed ? 0.985 : 1 }],
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
    </View>
  );
}

export interface AppShareSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppShareSheet({ visible, onClose }: AppShareSheetProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const travel = Math.max(420, Math.round(windowHeight * 0.82));

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
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
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
    .onEnd((event, success) => {
      const collapse =
        success &&
        shouldCollapsePlayer(
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
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  const isIOS = Platform.OS === 'ios';

  const sheetContent = (
    <View style={styles.inner}>
      {/* Grabber */}
      <View style={styles.grabber} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          {t.appShareShareApp}
        </Text>
        <TouchableOpacity
          onPress={animateClose}
          style={[
            styles.closeBtn,
            { backgroundColor: theme.surfaceVariants.containerHighest },
          ]}
          accessibilityLabel={t.close}
        >
          <MaterialIcons name="close" size={18} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <AppShareContent onAfterWhatsApp={onClose} />
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={animateClose}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />

        <GestureDetector gesture={pan}>
          <Animated.View style={[{ width: '100%' }, sheetAnimatedStyle]}>
            <SheetGrabber />
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
    ...fonts.bold,
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
    ...fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  bannerFooterTitle: {
    ...fonts.sansSemiBold,
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
    ...fonts.bold,
    fontSize: 17,
    marginTop: 4,
  },
  qrSubtitle: {
    ...fonts.sansRegular,
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
    ...fonts.sansSemiBold,
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
    ...fonts.sansSemiBold,
    fontSize: 15,
  },
  optionSub: {
    ...fonts.sansRegular,
    fontSize: 12,
    opacity: 0.75,
  },
});
