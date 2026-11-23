/**
 * HymnQrPanel — the QR page inside the hymn share sheet.
 *
 * The code opens the hymn on the website (himnarioebp.com/hymn/<id>/), so
 * someone without the app — or without room to install it — can still read
 * and hear it. It lives inside the share sheet rather than in a second modal:
 * stacking two modals freezes UIKit on iOS.
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Print from 'expo-print';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import * as Haptics from '../utils/haptics';
import { buildQrPath } from '../utils/qrPath';
import { QR_INK, qrPrintHtml } from '../utils/qrPrint';

const QR_SIZE = 200;

export default function HymnQrPanel({
  url,
  label,
  title,
  onBack,
}: {
  /** The hymn's public web address. */
  url: string;
  /** e.g. "Himno 243". */
  label: string;
  title: string;
  onBack: () => void;
}) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [printing, setPrinting] = useState(false);

  const qr = useMemo(() => {
    try {
      return buildQrPath(url);
    } catch {
      return null;
    }
  }, [url]);

  const handlePrint = async () => {
    if (!qr || printing) return;
    Haptics.selectionAsync();
    setPrinting(true);
    try {
      await Print.printAsync({
        html: qrPrintHtml({
          title,
          subtitle: label,
          hint: t.hymnQrPrintHint,
          brand: t.appName,
          qr,
        }),
      });
    } catch {
      // A cancelled print dialog rejects too; nothing to report.
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t.homeMenuBack}
          style={[styles.roundBtn, { backgroundColor: theme.surfaceVariants.containerHighest }]}
        >
          <MaterialIcons name="arrow-back" size={18} color={theme.onSurfaceVariant} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>{t.churchQrCodeAction}</Text>
        <View style={styles.roundBtn} />
      </View>

      <Text style={[styles.label, { color: theme.primary }]}>{label.toUpperCase()}</Text>
      <Text numberOfLines={2} style={[styles.title, { color: theme.onSurface }]}>
        {title}
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
            <Text style={{ ...fonts.sansRegular, fontSize: 13, color: '#5A5048', textAlign: 'center' }}>
              {t.churchQrPrintError}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.hint, { color: theme.onSurfaceVariant }]}>{t.hymnQrScanHint}</Text>

      <Pressable
        onPress={() => void handlePrint()}
        disabled={printing || !qr}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.printBtn,
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
            <MaterialIcons name="print" size={18} color={theme.onSurface} />
            <Text style={{ ...fonts.sansSemiBold, fontSize: 14.5, color: theme.onSurface }}>
              {t.churchQrPrint}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 8 },
  headerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...fonts.bold, fontSize: 20 },
  label: { ...fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1.6 },
  title: { ...fonts.bold, fontSize: 19, textAlign: 'center' },
  qrPlate: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 18, marginTop: 6 },
  qrFallback: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  hint: {
    ...fonts.sansRegular,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 300,
  },
  printBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 6,
  },
});
