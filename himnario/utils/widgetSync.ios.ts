/**
 * widgetSync.ios — Schedules a 7-day midnight timeline for the iOS "Versículo del Día"
 * Home Screen & Lock Screen widget using the exact same `getDailyVerse` function as
 * the Home screen `VerseCard`.
 *
 * Safely guards on `requireOptionalNativeModule('ExpoWidgets')` so pre-Build-#40
 * binaries and Expo Go never throw.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { Language } from '../context/LanguageContext';
import { getDailyVerse } from '../data/dailyVerses';
import type { DailyVerseWidgetProps } from '../widgets/DailyVerseWidget';

const TIMELINE_DAYS = 7;

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
    if (!widget || typeof widget.updateTimeline !== 'function') return;

    const now = new Date();
    const entries: { date: Date; props: DailyVerseWidgetProps }[] = [
      { date: now, props: buildPropsForDate(now, language) },
    ];

    for (let offset = 1; offset < TIMELINE_DAYS; offset++) {
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        0,
        0,
        5,
      );
      entries.push({
        date: midnight,
        props: buildPropsForDate(midnight, language),
      });
    }

    widget.updateTimeline(entries);
  } catch {
    // Widget sync is best-effort and must never interrupt app startup
  }
}
