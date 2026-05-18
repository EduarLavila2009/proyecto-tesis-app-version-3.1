import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { spacing, typography, hitSlopComfortable, useThemedStyles } from '../../theme';
import PressableScale from '../PressableScale';

/**
 * Enlace de texto secundario (p. ej. "¿Ya tienes cuenta? Inicia sesión").
 */
export default function TextLink({
  children,
  accent,
  onPress,
  accessibilityLabel,
  style,
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <PressableScale
      style={[styles.wrap, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlopComfortable}
    >
      <Text style={styles.base} allowFontScaling>
        {children}
        {accent ? (
          <Text style={styles.accent} allowFontScaling>
            {accent}
          </Text>
        ) : null}
      </Text>
    </PressableScale>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: spacing.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    base: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    accent: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
