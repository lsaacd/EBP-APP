/**
 * ChurchQrSheet — a QR code a congregation can share or print.
 *
 * The code holds the church's deep link, which the app's own scanner and any
 * phone camera both understand. It is drawn on the device (no network, no
 * third-party image service) and printed as vector, so a printed sheet keeps
 * working offline and stays sharp at any size.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Print from 'expo-print';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import { churchShareUrl } from '../utils/churchMapUtils';
import { churchDisplayName } from '../utils/churchName';
import { buildQrPath } from '../utils/qrPath';
import { QR_INK, qrPrintHtml } from '../utils/qrPrint';
import AppMenuIcon from './AppMenuIcon';
import GlassSurface from './GlassSurface';

const QR_SIZE = 212;

export type QrChurch = {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
};

export default function ChurchQrSheet({
  church,
  onClose,
}: {
  church: QrChurch | null;
  onClose: () => void;
}) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [printing, setPrinting] = useState(false);

  const isIOS = Platform.OS === 'ios';
  const cardBg = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isIOS
    ? isDarkMode
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(255,255,255,0.68)'
    : isDarkMode
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(0,0,0,0.07)';
  const mutedText = isDarkMode ? 'rgba(235,235,245,0.68)' : theme.onSurfaceVariant;
  const prominentBurgundy = isDarkMode ? '#9E2A32' : '#6e1619';

  const title = church ? churchDisplayName(church.name, church.city) : '';
  const address = church
    ? [church.address, church.city, church.state, church.postalCode].filter(Boolean).join(', ')
    : '';
  const url = church ? churchShareUrl(church.id) : '';

  // Encoding is pure work; only redo it when the church changes.
  const qr = useMemo(() => {
    if (!url) return null;
    try {
      return buildQrPath(url);
    } catch {
      return null;
    }
  }, [url]);

  const handleShare = useCallback(() => {
    if (!church) return;
    Haptics.selectionAsync();
    void Share.share(
      Platform.OS === 'ios'
        ? { message: `${title} — ${address}`, url }
        : { message: `${title} — ${address}\n${url}` },
    ).catch(() => {
      Alert.alert(t.churchError, t.shareSheetCouldNotOpenTheShareMenu);
    });
  }, [address, church, t, title, url]);

  const handlePrint = useCallback(async () => {
    if (!church || !qr || printing) return;
    Haptics.selectionAsync();
    setPrinting(true);
    try {
      const html = qrPrintHtml({
        title,
        subtitle: address,
        hint: t.churchQrPrintHint,
        brand: t.appName,
        qr,
      });
      await Print.printAsync({ html });
    } catch {
      // A cancelled print dialog rejects too, so stay quiet rather than
      // reporting an error the user caused on purpose.
    } finally {
      setPrinting(false);
    }
  }, [address, church, printing, qr, t, title]);

  return (
    <Modal
      visible={Boolean(church)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t.close}>
        {church && (
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.cardWrap}
          >
            <GlassSurface
              glassEffectStyle="regular"
              intensity={76}
              style={[
                styles.card,
                !isIOS && { backgroundColor: cardBg },
                { borderColor: cardBorder },
              ]}
            >
              <Text numberOfLines={2} style={[styles.title, { color: theme.onSurface }]}>
                {title}
              </Text>
              <Text numberOfLines={2} style={[styles.address, { color: mutedText }]}>
                {address}
              </Text>

              {/* White plate: a QR must stay dark-on-light to scan, in either theme. */}
              <View style={styles.qrPlate}>
                {qr ? (
                  <Svg width={QR_SIZE} height={QR_SIZE} viewBox={`0 0 ${qr.extent} ${qr.extent}`}>
                    <Rect width={qr.extent} height={qr.extent} fill="#FFFFFF" />
                    <Path d={qr.path} fill={QR_INK} />
                  </Svg>
                ) : (
                  <View style={styles.qrFallback}>
                    <Text style={{ ...fonts.sansRegular, fontSize: 13, color: '#5A5048' }}>
                      {t.churchQrPrintError}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.hint, { color: mutedText }]}>{t.churchQrScanHint}</Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleShare}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: prominentBurgundy, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <AppMenuIcon
                    ios="square.and.arrow.up"
                    android="share"
                    color="#FFFFFF"
                    size={16}
                  />
                  <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: '#FFFFFF' }}>
                    {t.churchQrShare}
                  </Text>
                </Pressable>

                {isIOS ? (
                  <GlassSurface
                    isInteractive
                    glassEffectStyle="regular"
                    intensity={58}
                    style={styles.actionGlass}
                  >
                    <Pressable
                      onPress={() => void handlePrint()}
                      disabled={printing || !qr}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.actionGlassHit,
                        { opacity: pressed || !qr ? 0.8 : 1 },
                      ]}
                    >
                      {printing ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <>
                          <AppMenuIcon ios="printer" android="print" color={theme.onSurface} size={16} />
                          <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: theme.onSurface }}>
                            {t.churchQrPrint}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </GlassSurface>
                ) : (
                  <Pressable
                    onPress={() => void handlePrint()}
                    disabled={printing || !qr}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.action,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.09)'
                          : theme.surfaceVariants.containerHighest,
                        opacity: pressed || !qr ? 0.85 : 1,
                      },
                    ]}
                  >
                    {printing ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <AppMenuIcon ios="printer" android="print" color={theme.onSurface} size={16} />
                        <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: theme.onSurface }}>
                          {t.churchQrPrint}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              {isIOS ? (
                <GlassSurface
                  isInteractive
                  glassEffectStyle="regular"
                  intensity={58}
                  style={styles.closeGlassPill}
                >
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={styles.closeGlassHit}
                  >
                    <Text style={{ ...fonts.sansSemiBold, fontSize: 14.5, color: theme.onSurface }}>
                      {t.close}
                    </Text>
                  </Pressable>
                </GlassSurface>
              ) : (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.closeRow}
                >
                  <Text style={{ ...fonts.sansSemiBold, fontSize: 14, color: mutedText }}>
                    {t.close}
                  </Text>
                </Pressable>
              )}
            </GlassSurface>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 344,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  title: { ...fonts.bold, fontSize: 19, textAlign: 'center' },
  address: { ...fonts.sansRegular, fontSize: 13, textAlign: 'center' },
  qrPlate: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    marginTop: 4,
  },
  qrFallback: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  hint: { ...fonts.sansRegular, fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 2 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  actionGlass: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  actionGlassHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  closeRow: { paddingVertical: 6, paddingHorizontal: 12 },
  closeGlassPill: {
    marginTop: 2,
    borderRadius: 999,
  },
  closeGlassHit: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
