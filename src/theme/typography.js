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
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    ...base,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  title: {
    ...base,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  body: {
    ...base,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  caption: {
    ...base,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  /** Etiquetas de formulario y badges */
  label: {
    ...base,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  /** Métrica Gigante (Signos vitales destacados) */
  display: {
    ...base,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -1,
  },
  titleSmall: {
    ...base,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  subtitle: {
    ...base,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bodyMedium: {
    ...base,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
};
