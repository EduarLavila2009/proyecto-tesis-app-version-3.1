import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { layout, spacing } from '../theme';

/** Ancho mínimo por celda para mantener grid 2×2 legible. */
const MIN_TILE_WIDTH = 148;

/**
 * Calcula 2 columnas o 1 según ancho útil (padding horizontal del tab).
 */
export function useMetricsGridLayout() {
  const { width: windowWidth } = useWindowDimensions();

  return useMemo(() => {
    const gap = spacing.md;
    const horizontalPad = layout.screenPaddingH * 2;
    const available = Math.max(0, windowWidth - horizontalPad);
    const twoColumns = available >= MIN_TILE_WIDTH * 2 + gap;
    const tileWidth = twoColumns
      ? (available - gap) / 2
      : available;

    return {
      twoColumns,
      gap,
      tileWidth,
      gridStyle: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        width: '100%',
      },
    };
  }, [windowWidth]);
}
