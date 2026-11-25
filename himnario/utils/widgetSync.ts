/**
 * widgetSync (default / Android / Web / test harness) — safe no-op stub.
 * iOS resolves `widgetSync.ios.ts` to update the WidgetKit 7-day timeline.
 */
import type { Language } from '../context/LanguageContext';

export function syncDailyVerseWidget(_language: Language): void {
  // iOS WidgetKit only (resolved via widgetSync.ios.ts)
}
