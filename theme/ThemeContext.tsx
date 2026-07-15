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
import { lightTheme, darkTheme } from './theme';

// Infer the theme type from lightTheme
type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load persisted settings on mount ────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('isDarkMode');
        const storedSize = await AsyncStorage.getItem('fontSizeMultiplier');
        if (storedTheme !== null) setIsDarkMode(JSON.parse(storedTheme));
        if (storedSize !== null) {
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
  // Instead of writing to AsyncStorage inside the state setter (which can
  // delay the re-render), we fire the write in a useEffect that only runs
  // once isLoaded is true (avoiding the initial load from re-persisting).
  useEffect(() => {
    if (!isLoaded) return; // Don't persist on first load
    AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode)).catch(
      console.error
    );
  }, [isDarkMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('fontSizeMultiplier', fontSizeMultiplier.toString()).catch(
      console.error
    );
  }, [fontSizeMultiplier, isLoaded]);

  // ── Toggle — just flips the boolean; persistence handled by useEffect ──
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const changeFontSize = useCallback((val: number) => {
    const clamped = Math.min(2.0, Math.max(0.8, val));
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
      toggleTheme,
      fontSizeMultiplier,
      changeFontSize,
      setFontSizeMultiplier,
    }),
    [theme, isDarkMode, toggleTheme, fontSizeMultiplier, changeFontSize, setFontSizeMultiplier],
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
