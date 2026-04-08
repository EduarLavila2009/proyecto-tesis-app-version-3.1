import { Platform } from 'react-native';

function iosShadow(opacity, radius, offsetY, shadowColor) {
  return {
    shadowColor,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
}

/** Sombras dinámicas según token `colors.shadow`. */
export function getCardShadow(c) {
  return Platform.select({
    ios: iosShadow(0.07, 14, 5, c.shadow),
    android: { elevation: 4 },
    default: { elevation: 3 },
  });
}

export function getSoftShadow(c) {
  return Platform.select({
    ios: iosShadow(0.05, 10, 3, c.shadow),
    android: { elevation: 2 },
    default: { elevation: 1 },
  });
}

/** Mapa para importaciones agrupadas: import { shadows } from '../theme' */
export const shadows = {
  card: getCardShadow,
  soft: getSoftShadow,
};
