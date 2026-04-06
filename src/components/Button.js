import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography, hitSlopComfortable } from '../theme';

/**
 * Botón primario con ligera escala al pulsar (`useNativeDriver`) y `activeOpacity={0.8}`.
 */
export default function Button({ title, onPress, style, disabled, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 380,
    }).start();
  };

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.touchable,
          disabled ? styles.touchableDisabled : styles.touchableEnabled,
        ]}
        onPressIn={() => {
          if (!disabled) animateScale(0.96);
        }}
        onPressOut={() => animateScale(1)}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        hitSlop={hitSlopComfortable}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]} allowFontScaling>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
  },
  touchable: {
    minHeight: spacing.lg * 2,
    borderRadius: spacing.radiusButton,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableEnabled: {
    backgroundColor: colors.primary,
  },
  touchableDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.onPrimary,
  },
  labelDisabled: {
    color: colors.buttonDisabledText,
  },
});
