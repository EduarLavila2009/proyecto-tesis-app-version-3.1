/**
 * Punto único de importación del tema global.
 *
 * Uso:
 *   import { spacing, typography, useTheme } from '../theme';
 *   const { colors, cardShadow } = useTheme();
 */
export { colors, lightColors, darkColors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { hitSlopComfortable } from './accessibility';
export { getCardShadow, getSoftShadow, shadows } from './shadows';
export { ThemeProvider, useTheme } from './themeProvider';
