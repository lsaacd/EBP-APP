// ============================================================
// SACRED INK DESIGN SYSTEM — El Buen Pastor Himnario
// All hex codes sourced directly from the Stitch HTML templates
// ============================================================

// Font family names as loaded by expo-google-fonts
export const fonts = {
  // Newsreader (Serif) — for headlines and hymn titles
  regular: 'Newsreader_400Regular',
  regularItalic: 'Newsreader_400Regular_Italic',
  semiBold: 'Newsreader_600SemiBold',
  bold: 'Newsreader_700Bold',
  boldItalic: 'Newsreader_700Bold_Italic',
  // Public Sans (Sans-Serif) — for body text and UI
  sansRegular: 'PublicSans_400Regular',
  sansMedium: 'PublicSans_500Medium',
  sansSemiBold: 'PublicSans_600SemiBold',
  sansBold: 'PublicSans_700Bold',
};

// -------------------------------------------------------------------
// LIGHT THEME — "Parchment Palette"
// Background: #fcf9f2 ("Our Paper"), Primary: #6e1619 ("Sacred Accent")
// -------------------------------------------------------------------
export const lightTheme = {
  // Core
  background: '#fcf9f2',
  surface: '#fcf9f2',
  surfaceBright: '#fcf9f2',

  // Primary (Burgundy — Sacred Accent)
  primary: '#6e1619',
  primaryContainer: '#8d2d2d',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffaba6',
  primaryFixed: '#ffdad7',
  primaryFixedDim: '#ffb3af',
  inversePrimary: '#ffb3af',

  // Surface Tiers (Tonal Layering — "Paper Weight")
  surfaceVariants: {
    containerLowest: '#ffffff',
    containerLow: '#f6f3ec',
    container: '#f0eee7',
    containerHigh: '#ebe8e1',
    containerHighest: '#e5e2db',
  },
  surfaceDim: '#dcdad3',
  surfaceVariant: '#e5e2db',

  // On-Surface
  onSurface: '#1c1c18',
  onSurfaceVariant: '#564240',
  onBackground: '#1c1c18',

  // Secondary
  secondary: '#575f6a',
  secondaryContainer: '#d8e0ed',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#5b636e',
  secondaryFixed: '#dbe3f0',
  secondaryFixedDim: '#bfc7d4',
  onSecondaryFixed: '#141c25',
  onSecondaryFixedVariant: '#3f4752',

  // Tertiary (Warm Amber)
  tertiary: '#493417',
  tertiaryContainer: '#624a2c',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#dbbb95',
  tertiaryFixed: '#ffddb6',
  tertiaryFixedDim: '#e2c19b',
  onTertiaryFixed: '#291801',
  onTertiaryFixedVariant: '#594325',

  // Outline
  outline: '#897170',
  outlineVariant: '#ddc0be',

  // Inverse
  inverseSurface: '#31312c',
  inverseOnSurface: '#f3f0ea',

  // Surface tint
  surfaceTint: '#a23c3b',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
};

// -------------------------------------------------------------------
// DARK THEME — "Pure Black" palette
// Background: #010101  (true black)
// Containers / buttons: #373737  (dark grey)
// Text: #ffffff  (white)
// Primary accent: #fdf9f2  (parchment cream — matches light mode background)
// -------------------------------------------------------------------
export const darkTheme = {
  // Core surfaces
  background: '#010101',   // true black canvas
  surface: '#373737',      // cards / elevated surfaces
  surfaceBright: '#4a4a4a', // topmost bright layer

  // Primary accent — parchment cream on black
  primary: '#fdf9f2',           // headlines, icons, active elements
  primaryContainer: '#373737',  // button fills (dark grey)
  onPrimary: '#010101',         // text/icon ON a primary-filled element
  onPrimaryContainer: '#ffffff', // text ON a primaryContainer
  primaryFixed: '#ffffff',
  primaryFixedDim: '#fdf9f2',
  inversePrimary: '#373737',

  // Surface Tiers — tonal scale rising from the true-black floor
  // Each step is one visible lift above the previous layer
  surfaceVariants: {
    containerLowest: '#010101',  // = background (floor)
    containerLow: '#1c1c1c',     // search bars, section dividers
    container: '#373737',        // cards, list items — main "button" colour
    containerHigh: '#454545',    // icon wells, step buttons
    containerHighest: '#525252', // slider tracks, toggle tracks
  },
  surfaceDim: '#000000',         // dimmed overlay / scrim
  surfaceVariant: '#373737',

  // On-Surface — all text/icons that sit on dark surfaces
  onSurface: '#ffffff',          // primary body text
  onSurfaceVariant: '#fdf9f2',   // secondary / subdued text
  onBackground: '#ffffff',

  // Secondary (neutral supporting palette — kept compatible)
  secondary: '#bfc7d4',
  secondaryContainer: '#373737',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#fdf9f2',
  secondaryFixed: '#dbe3f0',
  secondaryFixedDim: '#bfc7d4',
  onSecondaryFixed: '#ffffff',
  onSecondaryFixedVariant: '#373737',

  // Tertiary (warm amber — kept for reading controls)
  tertiary: '#e2c19b',
  tertiaryContainer: '#454545',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#fdf9f2',
  tertiaryFixed: '#fdf9f2',
  tertiaryFixedDim: '#e2c19b',
  onTertiaryFixed: '#010101',
  onTertiaryFixedVariant: '#373737',

  // Outline
  outline: '#ffffff',             // borders, dividers
  outlineVariant: 'rgba(255, 255, 255, 0.12)', // subtle ghost borders

  // Inverse (for snackbars / toasts that invert the scheme)
  inverseSurface: '#fdf9f2',
  inverseOnSurface: '#373737',

  // Surface tint (colour wash on elevated cards)
  surfaceTint: '#fdf9f2',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',
};

