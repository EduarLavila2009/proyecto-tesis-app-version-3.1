import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, useTheme } from '../theme';

/**
 * Caja de métrica — valor destacado + etiqueta.
 * @param {'default'|'accent'} [variant='default'] — accent usa color primary en el valor
 */
export default function StatBox({ value, label, style, variant = 'default' }) {
  const { colors, cardShadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const displayValue = value === null || value === undefined ? '—' : String(value);

  return (
    <View
      style={[styles.container, cardShadow, style]}
      accessible
      accessibilityLabel={`${displayValue}, ${label}`}
    >
      <Text style={styles.value} allowFontScaling numberOfLines={2}>
        {displayValue}
      </Text>
      <Text style={styles.label} allowFontScaling numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(colors, variant) {
  return StyleSheet.create({
    container: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusCard,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.s,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: spacing.minTouchTarget * 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    value: {
      fontSize: typography.h2.fontSize,
      fontWeight: '700',
      lineHeight: typography.h2.lineHeight,
      color: variant === 'accent' ? colors.primary : colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '600',
    },
  });
}
