/**
 * DailyVerseWidget (Android) — Home Screen Widget ("Versículo del Día")
 * powered by `expo-widgets` + `@expo/ui/jetpack-compose` (Glance renderer).
 *
 * Constraints verified against `expo-widgets/android/ExpoWidgetEmittableTree.kt`:
 * - Begins with `'widget';` and runs inside the dedicated Android Hermes widget runtime.
 * - Uses only Glance-supported components (`Column`, `Row`, `Spacer`, `Text`) and
 *   modifiers (`fillMaxSize`, `fillMaxWidth`, `height`, `padding`, `background`, `cornerRadius`).
 * - Cross-free, Sacred Ink light/dark adaptive palette.
 */
import { Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { DailyVerseWidgetProps } from './DailyVerseWidget';

const DailyVerseAndroidWidgetView = (
  props: DailyVerseWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';
  const isDark = environment.colorScheme === 'dark';

  const bg = isDark ? '#121214' : '#FAF5EE';
  const accent = isDark ? '#FDF9F2' : '#6E1619';
  const textPrimary = isDark ? '#FDF9F2' : '#1E1918';

  const eyebrow = props.eyebrow || 'VERSÍCULO DE HOY';
  const refLabel = props.refLabel || 'Salmo 23:1';
  const verseText = props.verseText || 'Jehová es mi pastor; nada me faltará.';
  const brandLabel = props.brandLabel || 'El Buen Pastor';

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        cornerRadius(20),
        background(bg),
        padding(16, 14, 16, 14),
      ]}
    >
      <Text
        color={accent}
        maxLines={1}
        style={{ fontSize: 11, fontWeight: '700' }}
      >
        {eyebrow}
      </Text>

      <Spacer modifiers={[height(8)]} />

      <Text
        color={textPrimary}
        maxLines={4}
        style={{ fontSize: 15, fontWeight: '500' }}
      >
        {`“${verseText}”`}
      </Text>

      <Spacer modifiers={[height(10)]} />

      <Row modifiers={[fillMaxWidth()]}>
        <Text
          color={accent}
          maxLines={1}
          style={{ fontSize: 12, fontWeight: '600' }}
        >
          {`${refLabel} · ${brandLabel}`}
        </Text>
      </Row>
    </Column>
  );
};

const DailyVerseWidget = createWidget<DailyVerseWidgetProps>(
  'DailyVerseWidget',
  DailyVerseAndroidWidgetView,
  {
    eyebrow: 'VERSÍCULO DE HOY',
    refLabel: 'Salmo 23:1',
    verseText: 'Jehová es mi pastor; nada me faltará.',
    brandLabel: 'El Buen Pastor',
  },
);

export default DailyVerseWidget;
