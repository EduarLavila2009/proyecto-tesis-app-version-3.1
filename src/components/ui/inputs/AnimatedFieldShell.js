import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { motion } from '../../../theme/motion';

/** Mensaje de error con fade-in. */
export function AnimatedFieldError({ error, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: motion.duration.fast,
      useNativeDriver: true,
    }).start();
  }, [error, opacity]);

  if (!error) return null;

  return (
    <Animated.Text
      style={[style, { opacity }]}
      allowFontScaling
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      {children ?? error}
    </Animated.Text>
  );
}
