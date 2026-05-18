import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { hitSlopComfortable } from '../theme/accessibility';
import { motion } from '../theme/motion';

const SCALE_PRESSED = motion.scale.pressed;

/**
 * Presión con `activeOpacity={0.8}` y escala ligera vía `Animated` (`useNativeDriver: true`).
 */
export default function PressableScale({
  children,
  style,
  containerStyle,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  activeOpacity = 1,
  hitSlop = hitSlopComfortable,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      ...motion.spring.press,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
      <TouchableOpacity
        {...rest}
        style={style}
        disabled={disabled}
        onPress={onPress}
        activeOpacity={activeOpacity}
        hitSlop={hitSlop}
        onPressIn={(e) => {
          if (!disabled) springTo(SCALE_PRESSED);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          springTo(1);
          onPressOut?.(e);
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
