import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ancho de pantalla de referencia (iPhone 13 / 14 normal)
const REFERENCE_WIDTH = 390;

/**
 * Escala un tamaño numérico en base al ancho de la pantalla actual.
 * @param {number} size Tamaño base para pantallas estándar
 * @returns {number} Tamaño escalado proporcionalmente
 */
export const scale = (size) => {
  const newSize = (SCREEN_WIDTH / REFERENCE_WIDTH) * size;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

/**
 * Retorna la cantidad adecuada de columnas según el ancho del dispositivo.
 * @returns {number} Cantidad de columnas (2 para móvil, 3 para tablet)
 */
export const getResponsiveColumns = () => {
  if (SCREEN_WIDTH > 600) return 3; // Tablets
  return 2; // Móviles normales
};
