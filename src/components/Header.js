import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Título de sección reutilizable, centrado horizontalmente.
 *
 * @param {string} title Texto del título.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [style] Estilo del contenedor (margins, padding, ancho, etc.).
 * @param {import('react-native').StyleProp<import('react-native').TextStyle>} [textStyle] Estilo del texto del título (opcional).
 */
export default function Header({ title, style, textStyle }) {
  return (
    <View style={[styles.container, style]}>
      <Text
        style={[styles.title, textStyle]}
        accessibilityRole="header"
        allowFontScaling
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.primary,
    textAlign: 'center',
  },
});
