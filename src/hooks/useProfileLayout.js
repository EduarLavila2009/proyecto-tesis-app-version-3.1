import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { layout, spacing } from '../theme';

/**
 * Tamaños adaptativos para avatar y QR en pantalla Perfil (solo UI).
 */
export function useProfileLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const horizontalPad = layout.screenPaddingH * 2;
    const contentWidth = Math.max(0, width - horizontalPad);

    const avatarDisplay = Math.round(
      Math.min(120, Math.max(96, contentWidth * 0.26))
    );
    const avatarRing = avatarDisplay + spacing.l * 2;
    const cameraBadge = Math.max(34, Math.round(avatarDisplay * 0.32));

    const qrMax = Math.min(220, contentWidth - spacing.xl * 2);
    const qrSize = Math.max(160, qrMax);

    return {
      contentWidth,
      avatarDisplay,
      avatarRing,
      cameraBadge,
      qrSize,
      isCompact: width < 360 || height < 640,
    };
  }, [width, height]);
}
