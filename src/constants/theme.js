/**
 * Estilos reutilizables para consistencia visual
 * Jerarquía: títulos, subtítulos, acciones
 */
import colors from './colors';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
  },
  titleSmall: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textLight,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: colors.textMuted,
  },
};

export const buttons = {
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  outlineText: {
    color: colors.textLight,
    fontSize: 16,
  },
};
