import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Caja de métrica: valor destacado arriba, etiqueta debajo, contenido centrado.
 *
 * @param {string|number|null|undefined} value Valor mostrado (grande). Si es null/undefined, se muestra "—".
 * @param {string} label Descripción bajo el valor.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style] Estilos adicionales del contenedor.
 */
export default function StatBox({ value, label, style }) {
  const displayValue = value === null || value === undefined ? '—' : String(value);

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityLabel={`${displayValue}, ${label}`}
    >
      <Text style={styles.value} allowFontScaling>
        {displayValue}
      </Text>
      <Text style={styles.label} allowFontScaling>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondaryMuted,
    borderRadius: spacing.radiusCard,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: spacing.xl + spacing.lg + spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  value: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
