import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, useTheme } from '../../theme';

const LEGEND_ITEMS = [
  { key: 'stable', label: 'Normal' },
  { key: 'warning', label: 'Atención' },
  { key: 'critical', label: 'Alerta' },
];

/**
 * Leyenda de estados vitales para paneles clínicos.
 */
export default function VitalsStatusLegend({ style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, style]} accessibilityRole="text">
      {LEGEND_ITEMS.map((item) => {
        const dotColor =
          item.key === 'critical'
            ? colors.danger
            : item.key === 'warning'
              ? colors.warning
              : colors.success;
        return (
          <View key={item.key} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.label} allowFontScaling>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.m,
      backgroundColor: colors.secondaryMuted,
      borderRadius: spacing.radiusButton,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
