/**
 * Typography tokens.
 *
 * Each platform uses its own native typefaces, with no bundled font files:
 *  - iOS: New York (system serif) for titles and lyrics, San Francisco for UI.
 *  - Android: the system serif (Noto Serif) and Roboto.
 *  - Web: the Google fonts loaded in app/_layout.tsx.
 *
 * A token is a style fragment (family + weight), not a bare family name, so
 * spread it into a style: `{ ...fonts.bold, fontSize: 20 }`.
 */
import { Platform, type TextStyle } from 'react-native';

type Weight = NonNullable<TextStyle['fontWeight']>;
export type FontToken = Pick<TextStyle, 'fontFamily' | 'fontWeight' | 'fontStyle'>;

const system = Platform.select<{ serif: string; sans: string } | null>({
  ios: { serif: 'ui-serif', sans: 'System' },
  android: { serif: 'serif', sans: 'sans-serif' },
  default: null,
});

function face(kind: 'serif' | 'sans', weight: Weight, webFamily: string, italic = false): FontToken {
  if (!system) return { fontFamily: webFamily };
  return italic
    ? { fontFamily: system[kind], fontWeight: weight, fontStyle: 'italic' }
    : { fontFamily: system[kind], fontWeight: weight };
}

export const fonts = {
  // Serif — headlines, hymn titles and lyrics
  regular: face('serif', '400', 'Newsreader_400Regular'),
  regularItalic: face('serif', '400', 'Newsreader_400Regular_Italic', true),
  medium: face('serif', '500', 'Newsreader_500Medium'),
  semiBold: face('serif', '600', 'Newsreader_600SemiBold'),
  bold: face('serif', '700', 'Newsreader_700Bold'),
  boldItalic: face('serif', '700', 'Newsreader_700Bold_Italic', true),
  // Sans-serif — body text and UI
  sansRegular: face('sans', '400', 'PublicSans_400Regular'),
  sansMedium: face('sans', '500', 'PublicSans_500Medium'),
  sansSemiBold: face('sans', '600', 'PublicSans_600SemiBold'),
  sansBold: face('sans', '700', 'PublicSans_700Bold'),
  sansExtraBold: face('sans', '800', 'PublicSans_800ExtraBold'),
} as const;
