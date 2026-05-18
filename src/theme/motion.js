import { Animated } from 'react-native';

/**
 * Tokens de movimiento — duraciones y springs unificados.
 */
export const motion = {
  duration: {
    instant: 80,
    fast: 160,
    focus: 200,
    normal: 280,
    slow: 360,
  },
  scale: {
    pressed: 0.95,
    pressedSubtle: 0.97,
  },
  spring: {
    press: { friction: 6, tension: 380, useNativeDriver: true },
    sheet: { friction: 8, tension: 65, useNativeDriver: true },
    success: { friction: 5, tension: 120, useNativeDriver: true },
  },
  shake: {
    steps: [10, -10, 6, -6, 0],
    stepMs: 45,
  },
  screenEnter: {
    offsetY: 14,
    duration: 300,
  },
};

/** Animación shake horizontal para errores de validación. */
export function runShake(translateX) {
  const { steps, stepMs } = motion.shake;
  translateX.setValue(0);
  return Animated.sequence(
    steps.map((to) =>
      Animated.timing(translateX, {
        toValue: to,
        duration: stepMs,
        useNativeDriver: true,
      })
    )
  );
}
