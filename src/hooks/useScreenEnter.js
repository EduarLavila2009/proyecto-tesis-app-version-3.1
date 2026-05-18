import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { motion } from '../theme/motion';

/** Entrada suave al montar (fade + slide). */
export function useScreenEnter(enabled = true) {
  const opacity = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  const translateY = useRef(
    new Animated.Value(enabled ? motion.screenEnter.offsetY : 0)
  ).current;

  useEffect(() => {
    if (!enabled) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.screenEnter.duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.screenEnter.duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enabled, opacity, translateY]);

  return {
    style: {
      opacity,
      transform: [{ translateY }],
    },
  };
}
