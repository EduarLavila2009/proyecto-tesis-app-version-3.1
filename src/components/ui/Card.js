import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { formTokens } from '../../theme/forms';

/**
 * Tarjeta estándar: superficie, borde sutil, sombra suave, padding uniforme.
 * @param {'default'|'compact'} [variant='default']
 */
export default function Card({ children, style, variant = 'default' }) {
  const { colors, cardShadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);

  return (
    <View style={[styles.root, cardShadow, style]}>{children}</View>
  );
}

function createStyles(colors, variant) {
  const padding =
    variant === 'compact' ? spacing.m : formTokens.panelPadding;

  return StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusCard,
      padding,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      width: '100%',
    },
  });
}
