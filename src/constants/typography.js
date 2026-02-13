/**
 * Sistema de diseño MEDICAL corp — Tipografía
 * Tamaños y pesos estándar. Combinar con colors para estilos completos.
 */

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 28,
  hero: 32,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.75,
};

/**
 * Estilos de texto listos para usar (requieren color inyectado o usar con theme)
 * Uso: { ...typography.title, color: colors.textLight }
 */
const createTypography = (colors) => ({
  hero: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    color: colors?.textLight,
  },
  display: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    color: colors?.textLight,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors?.textLight,
  },
  titleSmall: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors?.textLight,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors?.textSecondary,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors?.text,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors?.text,
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: colors?.textMuted,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors?.textSecondary,
  },
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
});

export { createTypography };

// Re-export para acceso directo sin colors (solo tamaños/pesos)
export default {
  fontSizes,
  fontWeights,
  lineHeights,
  createTypography,
};
