/**
 * widgetSync.android — Updates the Android "Versículo del Día" Home Screen widget
 * snapshot using the exact same `getDailyVerse` function as `VerseCard`.
 *
 * Safely guards on `requireOptionalNativeModule('ExpoWidgets')` so pre-SDK-58
 * binaries never throw.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { Language } from '../context/LanguageContext';
import { getDailyVerse } from '../data/dailyVerses';
import type { DailyVerseWidgetProps } from '../widgets/DailyVerseWidget';

function buildPropsForDate(date: Date, language: Language): DailyVerseWidgetProps {
  const { verse } = getDailyVerse(date);
  const localized = language === 'en' ? verse.en : verse.es;
  return {
    eyebrow: language === 'en' ? 'VERSE OF THE DAY' : 'VERSÍCULO DE HOY',
    refLabel: localized.ref,
    verseText: localized.text,
    brandLabel: 'El Buen Pastor',
  };
}

export function syncDailyVerseWidget(language: Language): void {
  try {
    if (!requireOptionalNativeModule('ExpoWidgets')) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const widgetModule = require('../widgets/DailyVerseWidget');
    const widget = widgetModule?.default;
    if (!widget || typeof widget.updateSnapshot !== 'function') return;

    widget.updateSnapshot(buildPropsForDate(new Date(), language));
  } catch {
    // Widget sync is best-effort and must never interrupt app startup
  }
}
