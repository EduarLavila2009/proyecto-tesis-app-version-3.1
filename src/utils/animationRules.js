/**
 * Reglas para evitar conflictos useNativeDriver en Animated.
 *
 * - Nodo A (exterior): solo transform / opacity → useNativeDriver: true
 * - Nodo B (interior): borderColor, width, height, etc. → useNativeDriver: false
 * - No mezclar ambos drivers en el mismo Animated.View
 */

export const NATIVE_DRIVER_PROPS = ['transform', 'opacity'];

export function canUseNativeDriver(styleKeys) {
  return styleKeys.every((key) => NATIVE_DRIVER_PROPS.includes(key));
}
