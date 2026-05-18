/**
 * Punto único de importación del tema global MEDICAL corp.
 *
 * Uso:
 *   import { spacing, typography, useTheme } from '../theme';
 *   const { colors, cardShadow } = useTheme();
 */
export { colors, lightColors, darkColors } from './colors';
export { default as theme } from './theme';
export { spacing } from './spacing';
export {
  layout,
  screenScrollContent,
  screenScrollContentCentered,
  screenScrollContentHero,
  tabListContent,
  stackScrollContent,
} from './layout';
export { typography, fontFamily } from './typography';
export { hitSlopComfortable } from './accessibility';
export { getCardShadow, getSoftShadow, shadows } from './shadows';
export { useThemedStyles } from './useThemedStyles';
export { ThemeProvider, useTheme } from './themeProvider';
export { motion, runShake } from './motion';
export { authFormCardStyle, authFormWrapStyle, createAuthFieldStyle } from './authLayout';
export { chatLayout, getChatBubbleMaxWidth } from './chatLayout';
export {
  createSectionHeadingStyle,
  createCardTitleStyle,
  createTabCardStyle,
  screenUi,
} from './screenUi';
export {
  formTokens,
  createFieldGroupStyle,
  createFieldLabelStyle,
  createFormPanelStyle,
} from './forms';
export {
  configureLayoutAnimation,
  layoutAnimPreset,
  isNewArchitectureEnabled,
} from '../utils/layoutAnimation';
