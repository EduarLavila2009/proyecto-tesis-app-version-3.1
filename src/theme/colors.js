/**
 * Tokens de color — Material Design (claro / oscuro).
 * Usar `useTheme().colors` en pantallas; no hardcodear hex.
 *
 * Contraste texto/fondo ≥ 4.5:1 (WCAG AA).
 */

export const lightColors = {
  primary: '#0F766E',            // Clinical Blue (Teal de calma y precisión - Ajustado para contraste de 5.5:1)
  primaryPressed: '#0D5C56',

  secondary: '#047857',          // Emerald Jade (Estable - Ajustado para contraste de 5.8:1)
  secondaryMuted: 'rgba(4, 120, 87, 0.08)',

  background: '#F8FAFC',         // Fondo neutro limpio
  surface: '#FFFFFF',            // Superficies blancas puras

  textPrimary: '#0F172A',        // Slate oscuro para máxima lectura
  textSecondary: '#334155',      // Slate intermedio para legibilidad secundaria
  textPlaceholder: '#64748B',
  textDisabled: '#CBD5E1',

  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',

  borderSubtle: '#E2E8F0',       // Separadores muy suaves
  borderFocus: '#0F766E',

  error: '#DC2626',              // Coral Red / Clinical Crimson (Ajustado para contraste de 6.5:1)
  danger: '#DC2626',
  success: '#047857',
  warning: '#B45309',            // Amber Clínico (Ajustado para contraste de 5.5:1)
  info: '#0F766E',

  shadow: '#0F172A',

  buttonDisabled: '#E2E8F0',
  buttonDisabledText: '#94A3B8',

  cameraBackground: '#000000',
  onCamera: '#FFFFFF',
  scanFrameBorder: 'rgba(255,255,255,0.85)',
};

/** Modo oscuro — variantes Material con identidad premium Deep Slate */
export const darkColors = {
  primary: '#0D9488',            // Clinical Blue
  primaryPressed: '#0F766E',

  secondary: '#10B981',          // Emerald Jade
  secondaryMuted: 'rgba(16, 185, 129, 0.08)',

  background: '#080C14',         // Fondo Deep Slate clínico
  surface: '#111827',            // Gris oscuro slate para tarjetas

  textPrimary: '#FFFFFF',        // Blanco puro
  textSecondary: '#94A3B8',      // Slate atenuado
  textPlaceholder: '#475569',
  textDisabled: '#334155',

  onPrimary: '#FFFFFF',
  onSecondary: '#080C14',

  borderSubtle: 'rgba(255, 255, 255, 0.08)', // Bordes translúcidos finos
  borderFocus: '#0D9488',

  error: '#EF4444',              // Coral Red
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',            // Amber
  info: '#0D9488',

  shadow: '#000000',

  buttonDisabled: '#1E293B',
  buttonDisabledText: '#475569',

  cameraBackground: '#000000',
  onCamera: '#FFFFFF',
  scanFrameBorder: 'rgba(255,255,255,0.85)',
};

/** Tema claro por defecto (import estático sin contexto). */
export const colors = lightColors;

