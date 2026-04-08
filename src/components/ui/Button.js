import React, { useRef, useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { spacing, typography, hitSlopComfortable, useTheme } from '../../theme';

/**
 * Botón con variante primaria (relleno) o secundaria (contorno).
 * Micro-interacción: escala ligera al pulsar.
 *
 * @param {'primary'|'secondary'} [variant='primary']
 */
export default function Button({
  title,
  onPress,
  style,
  disabled,
  accessibilityLabel,
  variant = 'primary',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (v) => {
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 6,
      tension: 380,
    }).start();
  };

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.touchable,
          isPrimary
            ? disabled
              ? styles.primaryDisabled
              : styles.primary
            : disabled
              ? styles.secondaryDisabled
              : styles.secondary,
        ]}
        onPressIn={() => {
          if (!disabled) springTo(0.97);
        }}
        onPressOut={() => springTo(1)}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.72}
        hitSlop={hitSlopComfortable}
      >
        <Text
          style={[
            styles.label,
            isPrimary
              ? disabled
                ? styles.labelPrimaryDisabled
                : styles.labelPrimary
              : disabled
                ? styles.labelSecondaryDisabled
                : styles.labelSecondary,
          ]}
          allowFontScaling
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    outer: {
      alignSelf: 'stretch',
    },
    touchable: {
      minHeight: Math.max(spacing.lg * 2, spacing.minTouchTarget),
      borderRadius: spacing.radiusButton,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    primaryDisabled: {
      backgroundColor: colors.buttonDisabled,
      borderColor: colors.buttonDisabled,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    secondaryDisabled: {
      backgroundColor: colors.background,
      borderColor: colors.borderSubtle,
    },
    label: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.subtitle.fontWeight,
    },
    labelPrimary: {
      color: colors.onPrimary,
    },
    labelPrimaryDisabled: {
      color: colors.buttonDisabledText,
    },
    labelSecondary: {
      color: colors.primary,
    },
    labelSecondaryDisabled: {
      color: colors.textDisabled,
    },
  });
}
