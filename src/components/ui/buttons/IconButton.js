import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, hitSlopComfortable, useTheme } from '../../../theme';
import { usePressFeedback } from './usePressFeedback';

const ICON_SIZES = { sm: 20, md: 24, lg: 28 };

/**
 * Botón solo icono — fondo transparente o relleno según variant.
 * @param {'ghost'|'primary'|'secondary'} [variant='ghost']
 */
export default function IconButton({
  icon,
  onPress,
  disabled = false,
  size = 'md',
  color,
  accessibilityLabel,
  variant = 'ghost',
  style,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scale, onPressIn, onPressOut } = usePressFeedback(disabled);
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size] || ICON_SIZES.md;

  const iconColor =
    color ??
    (disabled
      ? colors.textDisabled
      : variant === 'primary'
        ? colors.surface
        : variant === 'secondary'
          ? colors.surface
          : colors.primary);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? icon}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.touchable,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
        hitSlop={hitSlopComfortable}
      >
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function createStyles(colors) {
  const dim = spacing.minTouchTarget;
  return StyleSheet.create({
    touchable: {
      width: dim,
      height: dim,
      borderRadius: dim / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
