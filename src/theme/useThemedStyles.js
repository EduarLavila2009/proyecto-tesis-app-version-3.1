import { useMemo } from 'react';
import { useTheme } from './themeProvider';

/**
 * Genera StyleSheet temático con memoización segura.
 * @param {(colors: import('./colors').lightColors) => object} createStylesFn
 */
export function useThemedStyles(createStylesFn) {
  const { colors } = useTheme();
  return useMemo(() => createStylesFn(colors), [colors, createStylesFn]);
}
