import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Card from './Card';
import Icon from '../Icon';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Tarjeta de métrica vital — icono primary, valor destacado, etiqueta + insight opcional.
 */
export default function MetricTile({
  icon,
  value,
  label,
  insight,
  onPress,
  style,
  width,
  /** 'stable' | 'warning' | 'critical' — borde/accento visual (sin recalcular rangos) */
  alertLevel,
  /** 'default' | 'compact' — panel médico / listas */
  variant = 'default',
  /** 'primary' | 'secondary' — acento púrpura / turquesa en icono */
  iconAccent = 'primary',
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, alertLevel, variant),
    [colors, alertLevel, variant]
  );

  const iconColor = iconAccent === 'secondary' ? colors.secondary : colors.primary;
  const iconBg =
    iconAccent === 'secondary' ? `${colors.secondary}22` : `${colors.primary}14`;

  const tile = (
    <Card style={[styles.card, width != null && { width }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]} pointerEvents="none">
        <Icon name={icon} size={variant === 'compact' ? 18 : 22} color={iconColor} />
      </View>
      <Text style={styles.value} allowFontScaling numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.label} allowFontScaling numberOfLines={2}>
        {label}
      </Text>
      {insight ? (
        <Text style={styles.insight} allowFontScaling numberOfLines={3}>
          {insight}
        </Text>
      ) : null}
    </Card>
  );

  if (!onPress) return tile;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        width != null && { width },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${value}, ${label}`}
    >
      {tile}
    </Pressable>
  );
}

function createStyles(colors, alertLevel, variant) {
  const isCompact = variant === 'compact';
  const borderColor =
    alertLevel === 'critical'
      ? colors.danger
      : alertLevel === 'warning'
        ? colors.warning
        : colors.borderSubtle;

  const valueColor =
    alertLevel === 'critical'
      ? colors.danger
      : alertLevel === 'warning'
        ? colors.warning
        : colors.textPrimary;

  return StyleSheet.create({
    card: {
      padding: isCompact ? spacing.m : spacing.l,
      minHeight: isCompact ? spacing.minTouchTarget * 1.75 : spacing.minTouchTarget * 2 + spacing.l,
      borderWidth: alertLevel ? 1.5 : StyleSheet.hairlineWidth,
      borderColor,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: isCompact ? 34 : 40,
      height: isCompact ? 34 : 40,
      borderRadius: spacing.radiusButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isCompact ? spacing.xs : spacing.sm,
    },
    value: {
      fontSize: isCompact ? typography.subtitle.fontSize + 2 : typography.h2.fontSize,
      fontWeight: '800',
      lineHeight: isCompact ? typography.subtitle.lineHeight : typography.h2.lineHeight,
      color: valueColor,
      letterSpacing: -0.3,
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    insight: {
      ...typography.caption,
      color: colors.textPlaceholder,
      lineHeight: typography.caption.lineHeight * 1.25,
      marginTop: spacing.xs,
    },
  });
}
