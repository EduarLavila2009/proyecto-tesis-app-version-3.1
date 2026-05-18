import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { motion, runShake } from '../theme/motion';

/**
 * Borde (JS) y shake (nativo) usan Animated.Value distintos y vistas distintas en AnimatedFieldWrap.
 */
export function useFieldMotion(focused, hasError, errorKey) {
  const focusProgress = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // borderColor no soporta useNativeDriver: true
    Animated.timing(focusProgress, {
      toValue: focused && !hasError ? 1 : 0,
      duration: motion.duration.focus,
      useNativeDriver: false,
    }).start();
  }, [focused, hasError, focusProgress]);

  useEffect(() => {
    if (!hasError || !errorKey) return;
    // translateX solo en la capa exterior (AnimatedFieldWrap)
    runShake(shakeX).start();
  }, [hasError, errorKey, shakeX]);

  return { focusProgress, shakeX };
}
