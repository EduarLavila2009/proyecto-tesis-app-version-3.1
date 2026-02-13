/**
 * Estilos reutilizables MEDICAL corp — Consistencia visual
 * Usa colors, spacing y typography del sistema de diseño.
 */
import colors from './colors';
import spacing from './spacing';
import { createTypography, fontSizes } from './typography';

export const typography = createTypography(colors);

export const buttons = {
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  outlineText: {
    color: colors.textLight,
    fontSize: fontSizes.base,
  },
};
