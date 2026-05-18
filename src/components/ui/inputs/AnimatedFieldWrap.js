import React, { useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { useTheme } from '../../../theme/themeProvider';
import { useFieldMotion } from '../../../hooks/useFieldMotion';

/**
 * Envuelve inputs con borde animado al foco y shake en error.
 *
 * Drivers separados (evita Red Box "JS driven animation on native node"):
 * - Capa exterior: solo translateX (shake) → useNativeDriver: true
 * - Capa interior: solo borderColor (foco) → useNativeDriver: false
 */
export default function AnimatedFieldWrap({
  focused,
  hasError,
  errorKey,
  style,
  children,
}) {
  const { colors } = useTheme();
  const { focusProgress, shakeX } = useFieldMotion(focused, hasError, errorKey);

  const borderColor = useMemo(
    () =>
      focusProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.secondary, colors.primary],
      }),
    [focusProgress, colors.secondary, colors.primary]
  );

  return (
    <Animated.View
      style={{ transform: [{ translateX: shakeX }] }}
    >
      <Animated.View
        style={[
          style,
          styles.wrap,
          hasError
            ? { borderColor: colors.error }
            : { borderColor },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: spacing.radiusInput,
    overflow: 'hidden',
  },
});
