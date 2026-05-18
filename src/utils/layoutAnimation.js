import { LayoutAnimation } from 'react-native';

/**
 * New Architecture (Fabric): `setLayoutAnimationEnabledExperimental` es no-op y genera warning.
 * No llamar UIManager en ningún archivo; usar solo configureLayoutAnimation().
 */
export function isNewArchitectureEnabled() {
  return (
    typeof global !== 'undefined' &&
    (global.RN$Bridgeless === true || global.nativeFabricUIManager != null)
  );
}

export const layoutAnimPreset = LayoutAnimation.Presets.easeInEaseOut;

/**
 * Transición suave al mostrar/ocultar bloques (errores de formulario, etc.).
 * En Fabric se omite configureNext: LayoutAnimation no es fiable y el flag experimental no aplica.
 */
export function configureLayoutAnimation(preset = layoutAnimPreset) {
  if (isNewArchitectureEnabled()) {
    return;
  }
  LayoutAnimation.configureNext(preset);
}
