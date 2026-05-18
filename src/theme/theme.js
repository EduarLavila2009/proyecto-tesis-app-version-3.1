/**
 * Objeto de tema unificado — colores, tipografía y espaciado.
 * Para runtime dinámico usar `useTheme()` (modo claro/oscuro).
 */
import { colors, lightColors, darkColors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';

export const theme = {
  colors,
  lightColors,
  darkColors,
  typography,
  spacing,
  fontFamily,
};

export default theme;
