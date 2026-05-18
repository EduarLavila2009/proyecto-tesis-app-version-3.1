import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, useTheme } from '../../theme';

/**
 * Contenedor circular para iconos destacados en pantallas de flujo.
 */
export default function IconCircle({ children, color, size = 88, style }) {
  const { colors } = useTheme();
  const tint = color ?? colors.primary;
  const dim = size;

  return (
    <View
      style={[
        styles.root,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: `${tint}18`,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});
