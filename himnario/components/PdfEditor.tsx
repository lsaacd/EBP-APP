/**
 * PdfEditor — In-app "Preparar PDF" editor (parity with the website's `docs/js/pdf-export.js`).
 *
 * Controls: Formato (Una página / Dos copias), Letra (pt) stepper, Columnas (Una / Dos),
 * "Ajustar a la página" auto-fit, and "Incluir título". A live page preview (react-native-svg)
 * is rendered from the exact same layout plan that is exported through expo-print, so the
 * preview always matches the generated PDF.
 *
 * Rendered inside ShareSheet's modal (no nested modal) so it works from the reader and the player.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts } from '../theme/theme';
import {
  PDF_AUTO_FIT_START,
  PDF_DEFAULT_FONT,
  PDF_MAX_FONT,
  PDF_MIN_FONT,
  buildPdfHtml,
  buildPdfPlan,
  buildPdfSvg,
  defaultColumnsFor,
  hymnKindLabel,
  pdfStatusText,
  type PdfFormat,
  type PdfHymn,
  type PdfOptions,
} from '../utils/pdfLayout';

const PREVIEW_FONTS =
  Platform.OS === 'ios'
    ? { serif: 'Georgia', sans: 'Helvetica' }
    : { serif: 'serif', sans: 'sans-serif' };
const PDF_FONTS = { serif: 'Georgia, Times New Roman, serif', sans: 'Helvetica, Arial, sans-serif' };
const NO_MARGINS = { top: 0, right: 0, bottom: 0, left: 0 };

export interface PdfEditorProps {
  hymn: PdfHymn;
  onBack: () => void;
  onClose: () => void;
}

export default function PdfEditor({ hymn, onBack, onClose }: PdfEditorProps) {
  const { theme, isDarkMode } = useTheme();
  const { language } = useLanguage();
  const es = language !== 'en';
  const { width: windowWidth } = useWindowDimensions();

  const [format, setFormat] = useState<PdfFormat>('single');
  const [columns, setColumns] = useState<1 | 2>(() => defaultColumnsFor(hymn));
  const [includeTitle, setIncludeTitle] = useState(true);
  const [requested, setRequested] = useState(PDF_DEFAULT_FONT);
  const [busy, setBusy] = useState<'share' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const opts: PdfOptions = useMemo(
    () => ({ format, columns, includeTitle }),
    [format, columns, includeTitle]
  );
  const plan = useMemo(() => buildPdfPlan(hymn, requested, opts), [hymn, requested, opts]);
  const previewXml = useMemo(
    () => buildPdfSvg(hymn, plan, opts, PREVIEW_FONTS),
    [hymn, plan, opts]
  );

  const previewWidth = Math.min(windowWidth - 48, 520);
  const previewHeight = (previewWidth * plan.page.h) / plan.page.w;

  const tap = () => Haptics.selectionAsync().catch(() => {});

  const createPdfFile = async () => {
    const svg = buildPdfSvg(hymn, plan, opts, PDF_FONTS);
    const page = plan.page;
    let file = await Print.printToFileAsync({
      html: buildPdfHtml(svg, plan),
      width: page.w,
      height: page.h,
      margins: NO_MARGINS,
    });
    // Rounding can occasionally push a hairline onto a second page; shrink slightly and retry.
    if (file.numberOfPages > 1) {
      file = await Print.printToFileAsync({
        html: buildPdfHtml(svg, plan, 96),
        width: page.w,
        height: page.h,
        margins: NO_MARGINS,
      });
    }
    return file.uri;
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy('share');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await createPdfFile();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `${hymnKindLabel(hymn)} · ${hymn.title}`,
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch {
      setError(es ? 'No se pudo crear el PDF. Intenta de nuevo.' : 'Could not create the PDF. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    if (busy) return;
    setBusy('print');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await createPdfFile();
      await Print.printAsync({ uri });
    } catch (e: any) {
      // Cancelling the print dialog rejects on some platforms; only surface real failures.
      const message = String(e?.message ?? '');
      if (!/cancel/i.test(message)) {
        setError(es ? 'No se pudo abrir la impresión. Intenta de nuevo.' : 'Could not open printing. Please try again.');
      }
    } finally {
      setBusy(null);
    }
  };

  const chipBg = theme.surfaceVariants.containerHighest;
  const border = theme.outlineVariant + '40';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.iconBtn, { backgroundColor: chipBg }]}
          accessibilityLabel={es ? 'Volver a compartir' : 'Back to share'}
        >
          <MaterialIcons name="chevron-left" size={22} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          {es ? 'Preparar PDF' : 'Prepare PDF'}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.iconBtn, { backgroundColor: chipBg }]}
          accessibilityLabel={es ? 'Cerrar vista previa del PDF' : 'Close PDF preview'}
        >
          <MaterialIcons name="close" size={18} color={theme.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
        {es
          ? 'Elige el formato, ajusta el tamaño y descarga o imprime la alabanza.'
          : 'Choose the format, adjust the size, and download or print the hymn.'}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Formato */}
        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
          {es ? 'Formato' : 'Format'}
        </Text>
        <Segmented
          value={format}
          onChange={(v) => {
            tap();
            setFormat(v);
          }}
          options={[
            { value: 'single', label: es ? 'Una página' : 'One page' },
            { value: 'two-up', label: es ? 'Dos copias (cortar)' : 'Two copies (cut)' },
          ]}
        />

        {/* Letra + Columnas */}
        <View style={styles.inlineRow}>
          <View style={styles.inlineCol}>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              {es ? 'Letra (pt)' : 'Text (pt)'}
            </Text>
            <View style={[styles.stepper, { borderColor: border, backgroundColor: theme.surfaceVariants.containerLowest }]}>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={plan.fontSize <= PDF_MIN_FONT}
                onPress={() => {
                  tap();
                  setRequested(Math.max(PDF_MIN_FONT, plan.fontSize - 0.5));
                }}
                accessibilityLabel={es ? 'Reducir letra del PDF' : 'Decrease PDF text size'}
              >
                <Text style={[styles.stepTxt, { color: theme.primary, opacity: plan.fontSize <= PDF_MIN_FONT ? 0.3 : 1 }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: theme.onSurface }]}>{plan.fontSize}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={plan.fontSize >= PDF_MAX_FONT || plan.reduced}
                onPress={() => {
                  tap();
                  setRequested(Math.min(PDF_MAX_FONT, plan.fontSize + 0.5));
                }}
                accessibilityLabel={es ? 'Aumentar letra del PDF' : 'Increase PDF text size'}
              >
                <Text
                  style={[
                    styles.stepTxt,
                    { color: theme.primary, opacity: plan.fontSize >= PDF_MAX_FONT || plan.reduced ? 0.3 : 1 },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inlineCol, { flex: 1.25 }]}>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              {es ? 'Columnas' : 'Columns'}
            </Text>
            <Segmented
              value={columns}
              onChange={(v) => {
                tap();
                setColumns(v);
              }}
              options={[
                { value: 1, label: es ? 'Una' : 'One' },
                { value: 2, label: es ? 'Dos' : 'Two' },
              ]}
            />
          </View>
        </View>

        {/* Ajustar + Incluir título */}
        <View style={[styles.inlineRow, { alignItems: 'center' }]}>
          <TouchableOpacity
            style={[styles.fitBtn, { borderColor: border, backgroundColor: theme.surfaceVariants.containerLowest }]}
            onPress={() => {
              tap();
              setRequested(PDF_AUTO_FIT_START);
            }}
          >
            <MaterialIcons name="fit-screen" size={18} color={theme.primary} />
            <Text style={[styles.fitTxt, { color: theme.primary }]}>
              {es ? 'Ajustar a la página' : 'Fit to page'}
            </Text>
          </TouchableOpacity>
          <View style={styles.titleToggle}>
            <Text style={[styles.toggleTxt, { color: theme.onSurface }]}>
              {es ? 'Incluir título' : 'Include title'}
            </Text>
            <Switch
              value={includeTitle}
              onValueChange={(v) => {
                tap();
                setIncludeTitle(v);
              }}
              trackColor={{ true: theme.primary }}
              accessibilityLabel={es ? 'Incluir título' : 'Include title'}
            />
          </View>
        </View>

        {/* Status */}
        <Text style={[styles.status, { color: theme.onSurfaceVariant }]} accessibilityLiveRegion="polite">
          {pdfStatusText(plan, opts, es ? 'es' : 'en')}
        </Text>
        {error && <Text style={[styles.error, { color: theme.error ?? '#b3261e' }]}>{error}</Text>}

        {/* Live preview */}
        <View
          style={[
            styles.previewWell,
            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1eee6' },
          ]}
        >
          <View
            style={[styles.paper, { width: previewWidth, height: previewHeight }]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={es ? 'Vista previa de la alabanza en PDF' : 'PDF preview of the hymn'}
          >
            <SvgXml xml={previewXml} width={previewWidth} height={previewHeight} />
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: busy && busy !== 'share' ? 0.6 : 1 }]}
          onPress={handleShare}
          disabled={!!busy}
        >
          {busy === 'share' ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="ios-share" size={18} color={theme.onPrimary} />
              <Text style={[styles.primaryTxt, { color: theme.onPrimary }]}>
                {es ? 'Guardar PDF' : 'Save PDF'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.primary + '55', opacity: busy && busy !== 'print' ? 0.6 : 1 }]}
          onPress={handlePrint}
          disabled={!!busy}
        >
          {busy === 'print' ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <MaterialIcons name="print" size={18} color={theme.primary} />
              <Text style={[styles.secondaryTxt, { color: theme.primary }]}>
                {es ? 'Imprimir' : 'Print'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Small segmented control ────────────────────────────────────────────────
function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.surfaceVariants.containerHighest }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.segmentItem, selected && { backgroundColor: theme.primary }]}
            onPress={() => !selected && onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[styles.segmentTxt, { color: selected ? theme.onPrimary : theme.onSurface }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 24, textAlign: 'center' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.85,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: 10, paddingBottom: 12 },
  label: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  inlineRow: { flexDirection: 'row', gap: 12 },
  inlineCol: { flex: 1 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentTxt: { fontFamily: 'PublicSans_600SemiBold', fontSize: 13 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 42,
  },
  stepBtn: { width: 44, height: 42, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontFamily: 'PublicSans_700Bold', fontSize: 22, lineHeight: 26 },
  stepValue: { fontFamily: 'PublicSans_700Bold', fontSize: 16, minWidth: 44, textAlign: 'center' },
  fitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  fitTxt: { fontFamily: 'PublicSans_600SemiBold', fontSize: 13 },
  titleToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  toggleTxt: { fontFamily: 'PublicSans_600SemiBold', fontSize: 13 },
  status: { fontFamily: 'PublicSans_400Regular', fontSize: 12.5 },
  error: { fontFamily: 'PublicSans_600SemiBold', fontSize: 12.5 },
  previewWell: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  paper: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  primaryBtn: {
    flex: 1.6,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryTxt: { fontFamily: 'PublicSans_700Bold', fontSize: 14.5 },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryTxt: { fontFamily: 'PublicSans_700Bold', fontSize: 14.5 },
});

