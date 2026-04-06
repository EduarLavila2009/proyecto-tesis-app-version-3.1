import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Contenedor visual tipo tarjeta.
 *
 * @param {React.ReactNode} children Contenido interior.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style] Estilos adicionales del contenedor.
 */
export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: spacing.shadowOpacityCard,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowRadius: Math.max(spacing.md, typography.caption.fontSize),
    elevation: spacing.xs,
  },
});
