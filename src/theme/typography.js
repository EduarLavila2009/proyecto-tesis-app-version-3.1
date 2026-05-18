import { Platform } from 'react-native';

/**
 * Familia tipográfica — Roboto en Android; sistema en iOS (Expo Go).
 * Para Noto Sans explícito: cargar con @expo-google-fonts/noto-sans en App.js.
 */
export const fontFamily = Platform.select({
  android: 'Roboto',
  ios: 'System',
  web: 'Roboto, "Noto Sans", system-ui, sans-serif',
  default: 'System',
});

const base = { fontFamily };

/**
 * Escala tipográfica global (pt ≈ px en React Native).
 */
export const typography = {
  h1: {
    ...base,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    ...base,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  title: {
    ...base,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  body: {
    ...base,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    ...base,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  /** Etiquetas de formulario */
  label: {
    ...base,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  /** Alias legacy (pantallas existentes) */
  display: {
    ...base,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  titleSmall: {
    ...base,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  subtitle: {
    ...base,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyMedium: {
    ...base,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
};
