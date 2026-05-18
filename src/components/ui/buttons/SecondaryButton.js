import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, hitSlopComfortable, useTheme } from '../../../theme';
import { usePressFeedback } from './usePressFeedback';

/**
 * Botón secundario — fondo secondary, texto surface.
 * @param {'filled'|'outline'|'ghost'} [appearance='filled']
 */
export default function SecondaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  icon,
  iconSize = 20,
  iconPosition = 'left',
  appearance = 'filled',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scale, onPressIn, onPressOut } = usePressFeedback(disabled);

  const isFilled = appearance === 'filled';
  const isOutline = appearance === 'outline';
  const isGhost = appearance === 'ghost';

  const textColor = disabled
    ? colors.buttonDisabledText
    : isFilled
      ? colors.surface
      : isGhost
        ? colors.onCamera
        : colors.primary;

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.touchable,
          isFilled && styles.filled,
          isOutline && styles.outline,
          isGhost && styles.ghost,
          disabled && styles.touchableDisabled,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
        hitSlop={hitSlopComfortable}
      >
        {icon && iconPosition === 'left' ? (
          <Ionicons
            name={icon}
            size={iconSize}
            color={textColor}
            style={styles.iconLeft}
          />
        ) : null}
        <Text
          style={[styles.label, { color: textColor }, textStyle]}
          allowFontScaling
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' ? (
          <Ionicons
            name={icon}
            size={iconSize}
            color={textColor}
            style={styles.iconRight}
          />
        ) : null}
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: spacing.minTouchTarget,
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.m,
      borderRadius: spacing.radiusButton,
    },
    filled: {
      backgroundColor: colors.secondary,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    touchableDisabled: {
      backgroundColor: colors.buttonDisabled,
      opacity: 0.9,
    },
    label: {
      ...typography.title,
      textAlign: 'center',
    },
    iconLeft: {
      marginRight: spacing.s,
    },
    iconRight: {
      marginLeft: spacing.s,
    },
  });
}
