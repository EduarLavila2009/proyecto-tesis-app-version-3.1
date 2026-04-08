import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, useTheme } from '../../theme';

/**
 * Tarjeta estándar: superficie, borde sutil, sombra suave.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style]
 */
export default function Card({ children, style }) {
  const { colors, cardShadow } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.root, cardShadow, style]}>{children}</View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusCard,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
  });
}
