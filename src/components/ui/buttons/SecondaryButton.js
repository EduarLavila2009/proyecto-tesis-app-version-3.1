import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, hitSlopComfortable, useTheme } from '../../../theme';
import { usePressFeedback } from './usePressFeedback';

/**
 * Botón secundario — fondo secondary, texto surface, o borde primary si es outline.
 * @param {'filled'|'outline'|'ghost'} [appearance='filled']
 * @param {string} [color] Color de acento personalizado para sincronizar borde, icono y texto.
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
  color,
}) {
  const { colors } = useTheme();

  const isFilled = appearance === 'filled';
  const isOutline = appearance === 'outline';
  const isGhost = appearance === 'ghost';

  // Usar el color personalizado si se provee; si no, heredar del tema según la variante
  const activeColor = color || (isFilled ? colors.secondary : colors.primary);

  const styles = useMemo(() => createStyles(colors, activeColor), [colors, activeColor]);
  const { scale, onPressIn, onPressOut } = usePressFeedback(disabled);

  const textColor = disabled
    ? colors.buttonDisabledText
    : isFilled
      ? colors.surface
      : activeColor;

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

function createStyles(colors, activeColor) {
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
      backgroundColor: activeColor,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: activeColor,
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
