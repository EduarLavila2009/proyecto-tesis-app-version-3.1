/**
 * Tokens de color — Material Design (claro / oscuro).
 * Usar `useTheme().colors` en pantallas; no hardcodear hex.
 *
 * Contraste texto/fondo ≥ 4.5:1 (WCAG AA).
 */

export const lightColors = {
  primary: '#6200EE',
  primaryPressed: '#5000C8',

  secondary: '#03DAC6',
  secondaryMuted: 'rgba(3, 218, 198, 0.12)',

  background: '#FFFFFF',
  surface: '#FFFFFF',

  textPrimary: '#000000',
  textSecondary: '#666666',
  textPlaceholder: '#757575',
  textDisabled: '#9E9E9E',

  onPrimary: '#FFFFFF',
  onSecondary: '#000000',

  borderSubtle: '#E0E0E0',
  borderFocus: '#6200EE',

  /** Alias semántico solicitado */
  error: '#B00020',
  danger: '#B00020',
  success: '#018786',
  warning: '#F57C00',
  info: '#6200EE',

  shadow: '#000000',

  buttonDisabled: '#E0E0E0',
  buttonDisabledText: '#666666',

  /** Escáner QR / cámara */
  cameraBackground: '#000000',
  onCamera: '#FFFFFF',
  scanFrameBorder: 'rgba(255,255,255,0.85)',
};

/** Modo oscuro — variantes Material con misma identidad de marca. */
export const darkColors = {
  primary: '#BB86FC',
  primaryPressed: '#985EFF',

  secondary: '#03DAC6',
  secondaryMuted: 'rgba(3, 218, 198, 0.16)',

  background: '#121212',
  surface: '#1E1E1E',

  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textPlaceholder: '#9E9E9E',
  textDisabled: '#757575',

  onPrimary: '#FFFFFF',
  onSecondary: '#000000',

  borderSubtle: '#2C2C2C',
  borderFocus: '#BB86FC',

  error: '#CF6679',
  danger: '#CF6679',
  success: '#03DAC6',
  warning: '#FFB74D',
  info: '#BB86FC',

  shadow: '#000000',

  buttonDisabled: '#2C2C2C',
  buttonDisabledText: '#9E9E9E',

  cameraBackground: '#000000',
  onCamera: '#FFFFFF',
  scanFrameBorder: 'rgba(255,255,255,0.85)',
};

/** Tema claro por defecto (import estático sin contexto). */
export const colors = lightColors;
