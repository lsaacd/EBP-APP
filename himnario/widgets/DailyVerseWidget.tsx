/**
 * DailyVerseWidget — iOS Home Screen & Lock Screen Widget ("Versículo del Día")
 * powered by `expo-widgets` + `@expo/ui/swift-ui`.
 *
 * Constraints:
 * - The layout function begins with `'widget';` and runs serialized inside the iOS
 *   WidgetKit extension, so it MUST NOT reference module-scope variables or helpers.
 * - All stack children are kept flat arrays (no nested mapped arrays).
 * - Cross-free iconography (`book.pages`) per doctrinal rule.
 */
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  multilineTextAlignment,
  opacity,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type DailyVerseWidgetProps = {
  eyebrow: string;
  refLabel: string;
  verseText: string;
  brandLabel: string;
};

const DailyVerseWidgetView = (
  props: DailyVerseWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';
  const isDark = environment.colorScheme === 'dark';
  const family = environment.widgetFamily ?? 'systemMedium';
  const isAccessory = family === 'accessoryRectangular';
  const isSmall = family === 'systemSmall';
  const isLarge = family === 'systemLarge';

  const bg = isDark ? '#121214' : '#FAF5EE';
  const accent = isDark ? '#FDF9F2' : '#6E1619';
  const textPrimary = isDark ? '#FDF9F2' : '#1E1918';
  const textSecondary = isDark ? '#C9C4BE' : '#5E534F';

  const eyebrow = props.eyebrow || 'VERSÍCULO DE HOY';
  const refLabel = props.refLabel || 'Salmo 23:1';
  const verseText = props.verseText || 'Jehová es mi pastor; nada me faltará.';
  const brandLabel = props.brandLabel || 'El Buen Pastor';

  if (isAccessory) {
    return (
      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[
          widgetURL('el-buen-pastor-himnario://'),
          frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
        ]}
      >
        <HStack alignment="center" spacing={4}>
          <Image systemName="book.pages" size={10} />
          <Text modifiers={[font({ size: 11, weight: 'bold' }), lineLimit(1)]}>
            {refLabel}
          </Text>
        </HStack>
        <Text
          modifiers={[
            font({ design: 'serif', size: 12, weight: 'regular' }),
            lineLimit(2),
          ]}
        >
          {verseText}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={isLarge ? 14 : isSmall ? 6 : 8}
      modifiers={[
        containerBackground(bg, 'widget'),
        widgetURL('el-buen-pastor-himnario://'),
        padding({
          horizontal: isLarge ? 22 : isSmall ? 14 : 16,
          vertical: isLarge ? 20 : isSmall ? 12 : 14,
        }),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      ]}
    >
      <HStack alignment="center" spacing={isLarge ? 7 : 5}>
        <Image systemName="book.pages" size={isLarge ? 15 : isSmall ? 11 : 12} color={accent} />
        <Text
          modifiers={[
            font({ size: isLarge ? 12 : isSmall ? 9.5 : 10.5, weight: 'bold' }),
            foregroundStyle(accent),
            lineLimit(1),
          ]}
        >
          {eyebrow}
        </Text>
        <Spacer />
      </HStack>

      {isLarge && <Spacer />}

      <Text
        modifiers={[
          font({
            design: 'serif',
            size: isLarge ? 21 : isSmall ? 13 : 15,
            weight: 'medium',
          }),
          foregroundStyle(textPrimary),
          lineLimit(isLarge ? 8 : isSmall ? 4 : 3),
          multilineTextAlignment('leading'),
        ]}
      >
        {`“${verseText}”`}
      </Text>

      <Spacer />

      <HStack alignment="center" spacing={6}>
        <Text
          modifiers={[
            font({ size: isLarge ? 14 : isSmall ? 11 : 12, weight: 'semibold' }),
            foregroundStyle(accent),
            lineLimit(1),
          ]}
        >
          {refLabel}
        </Text>
        <Spacer />
        {!isSmall && (
          <Text
            modifiers={[
              font({ size: isLarge ? 12 : 10.5, weight: 'medium' }),
              foregroundStyle(textSecondary),
              opacity(0.85),
              lineLimit(1),
            ]}
          >
            {brandLabel}
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

const DailyVerseWidget = createWidget<DailyVerseWidgetProps>(
  'DailyVerseWidget',
  DailyVerseWidgetView,
  {
    eyebrow: 'VERSÍCULO DE HOY',
    refLabel: 'Salmo 23:1',
    verseText: 'Jehová es mi pastor; nada me faltará.',
    brandLabel: 'El Buen Pastor',
  },
);

export default DailyVerseWidget;
