import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, hitSlopComfortable, useTheme } from '../../../theme';
import { usePressFeedback } from './usePressFeedback';

/**
 * Botón principal — fondo primary, texto surface, tipografía title.
 */
export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  icon,
  iconSize = 20,
  iconPosition = 'left',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scale, onPressIn, onPressOut } = usePressFeedback(disabled);

  const label = (
    <Text
      style={[styles.label, disabled && styles.labelDisabled, textStyle]}
      allowFontScaling
    >
      {title}
    </Text>
  );

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled }}
        style={[styles.touchable, disabled && styles.touchableDisabled]}
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
            color={disabled ? colors.buttonDisabledText : colors.onPrimary}
            style={styles.iconLeft}
          />
        ) : null}
        {label}
        {icon && iconPosition === 'right' ? (
          <Ionicons
            name={icon}
            size={iconSize}
            color={disabled ? colors.buttonDisabledText : colors.onPrimary}
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
      backgroundColor: colors.primary,
    },
    touchableDisabled: {
      backgroundColor: colors.buttonDisabled,
      opacity: 0.9,
    },
    label: {
      ...typography.title,
      color: colors.onPrimary,
      textAlign: 'center',
    },
    labelDisabled: {
      color: colors.buttonDisabledText,
    },
    iconLeft: {
      marginRight: spacing.s,
    },
    iconRight: {
      marginLeft: spacing.s,
    },
  });
}
