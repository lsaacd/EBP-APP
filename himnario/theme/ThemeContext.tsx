import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './theme';

// Infer the theme type from lightTheme
type Theme = typeof lightTheme;
export type AppearanceMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => void;
  toggleTheme: () => void;
  fontSizeMultiplier: number;
  changeFontSize: (val: number) => void;
  setFontSizeMultiplier: (val: number) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>('light');
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  const isDarkMode =
    appearanceMode === 'system'
      ? systemColorScheme === 'dark'
      : appearanceMode === 'dark';

  // ── Load persisted settings on mount ────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          'appearanceMode',
          'isDarkMode',
          'fontSizeMultiplier',
        ]);
        const storedMode = entries[0]?.[1];
        const storedTheme = entries[1]?.[1];
        const storedSize = entries[2]?.[1];

        if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
          setAppearanceModeState(storedMode);
        } else if (storedTheme !== null && storedTheme !== undefined) {
          setAppearanceModeState(JSON.parse(storedTheme) ? 'dark' : 'light');
        }
        if (storedSize !== null && storedSize !== undefined) {
          const parsed = parseFloat(storedSize);
          if (!isNaN(parsed)) setFontSizeMultiplierState(parsed);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // ── Persist AFTER React commits — keeps the UI toggle instant ──────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('appearanceMode', appearanceMode).catch(console.error);
  }, [appearanceMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return; // Don't persist on first load
    AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode)).catch(
      console.error
    );
  }, [isDarkMode, isLoaded]);

  // Sync native OS appearance (iOS UITabBarController / Android system surfaces)
  // with the user's selected mode; 'auto' restores real system dark/light tracking.
  useEffect(() => {
    if (!isLoaded || Platform.OS === 'web') return;
    try {
      Appearance.setColorScheme?.(appearanceMode === 'system' ? 'auto' : appearanceMode);
    } catch {
      // Ignore on runtimes where setColorScheme is unsupported
    }
  }, [appearanceMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('fontSizeMultiplier', fontSizeMultiplier.toString()).catch(
      console.error
    );
  }, [fontSizeMultiplier, isLoaded]);

  const setAppearanceMode = useCallback((mode: AppearanceMode) => {
    setAppearanceModeState(mode);
  }, []);

  // ── Toggle — switches explicitly so reader dark/light works in system mode ─
  const toggleTheme = useCallback(() => {
    setAppearanceModeState((prev) => {
      const currentDark =
        prev === 'system' ? Appearance.getColorScheme() === 'dark' : prev === 'dark';
      return currentDark ? 'light' : 'dark';
    });
  }, []);

  const changeFontSize = useCallback((val: number) => {
    // Allow 12px to 64px (base 22px => 12/22 ≈ 0.545 to 64/22 ≈ 2.909)
    const clamped = Math.min(64 / 22, Math.max(12 / 22, val));
    setFontSizeMultiplierState(clamped);
  }, []);

  // Alias for components that call setFontSizeMultiplier directly
  const setFontSizeMultiplier = changeFontSize;

  // ── Memoize theme object so consumers don't re-render on unrelated changes ─
  const theme = useMemo(
    () => (isDarkMode ? (darkTheme as unknown as Theme) : lightTheme),
    [isDarkMode],
  );

  // ── Memoize the entire context value to prevent cascading re-renders ───
  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
      appearanceMode,
      setAppearanceMode,
      toggleTheme,
      fontSizeMultiplier,
      changeFontSize,
      setFontSizeMultiplier,
    }),
    [
      theme,
      isDarkMode,
      appearanceMode,
      setAppearanceMode,
      toggleTheme,
      fontSizeMultiplier,
      changeFontSize,
      setFontSizeMultiplier,
    ],
  );

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>');
  return ctx;
};
