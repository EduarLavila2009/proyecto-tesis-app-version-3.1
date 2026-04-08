/**
 * Tokens de color — modo claro y oscuro.
 * Usar `useTheme().colors` en pantallas; no hardcodear hex.
 */

export const lightColors = {
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',

  secondary: '#22C55E',
  secondaryMuted: 'rgba(34, 197, 94, 0.12)',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textPlaceholder: '#475569',
  textDisabled: '#94A3B8',

  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',

  borderSubtle: '#E2E8F0',
  borderFocus: '#2563EB',

  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#2563EB',

  shadow: '#0F172A',

  buttonDisabled: '#E2E8F0',
  buttonDisabledText: '#334155',
};

/** Oscuro: base azul-pizarra (no gris plano). */
export const darkColors = {
  primary: '#3B82F6',
  primaryPressed: '#2563EB',

  secondary: '#34D399',
  secondaryMuted: 'rgba(52, 211, 153, 0.16)',

  background: '#0B1220',
  surface: '#151E2E',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textPlaceholder: '#64748B',
  textDisabled: '#64748B',

  onPrimary: '#FFFFFF',
  onSecondary: '#0B1220',

  borderSubtle: '#2D3F55',
  borderFocus: '#60A5FA',

  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  info: '#60A5FA',

  shadow: '#020617',

  buttonDisabled: '#334155',
  buttonDisabledText: '#94A3B8',
};

/** Compatibilidad: tema claro por defecto si se importa sin contexto. */
export const colors = lightColors;
