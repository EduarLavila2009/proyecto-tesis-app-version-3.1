import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { STORAGE_KEYS } from '../constants/storage';
import { configureLayoutAnimation } from '../utils/layoutAnimation';
import { lightColors, darkColors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';
import { getCardShadow, getSoftShadow } from './shadows';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (!cancelled && (raw === 'dark' || raw === 'light')) {
          setModeState(raw);
        }
      } catch (_) {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (next) => {
    const m = next === 'dark' ? 'dark' : 'light';
    // Sin UIManager.setLayoutAnimationEnabledExperimental (no-op en New Architecture).
    configureLayoutAnimation();
    setModeState(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, m);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const isDark = mode === 'dark';
  const colors = useMemo(
    () => (isDark ? darkColors : lightColors),
    [isDark]
  );

  const cardShadow = useMemo(() => getCardShadow(colors), [colors]);
  const softShadow = useMemo(() => getSoftShadow(colors), [colors]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      typography,
      spacing,
      fontFamily,
      cardShadow,
      softShadow,
      setMode,
      toggleTheme,
    }),
    [mode, isDark, colors, cardShadow, softShadow, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}
