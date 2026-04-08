import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { lightColors, darkColors } from './colors';
import { getCardShadow, getSoftShadow } from './shadows';

const ThemeContext = createContext(null);

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
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
