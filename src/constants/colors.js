/**
 * @deprecated Preferir `import { useTheme } from '../theme'`.
 * Reexportación alineada con el tema global (modo claro).
 */
import { lightColors } from '../theme/colors';

export default {
  ...lightColors,
  white: '#FFFFFF',
  black: '#000000',
  text: lightColors.textPrimary,
  textOnPrimary: lightColors.onPrimary,
  textLight: lightColors.onPrimary,
  textMuted: lightColors.textSecondary,
  border: lightColors.borderSubtle,
  borderLight: lightColors.borderSubtle,
  critical: lightColors.error,
  criticalDark: lightColors.error,
};
