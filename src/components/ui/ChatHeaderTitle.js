import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Título del header del chat IA — icono + nombre + subtítulo (stack navigator).
 */
export default function ChatHeaderTitle({
  title = 'Asistente MEDICAL',
  subtitle = 'IA médica · Orientación informativa',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.iconCircle}>
        <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1} allowFontScaling>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: 260,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    textCol: {
      flexShrink: 1,
      minWidth: 0,
    },
    title: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '700',
      color: colors.onPrimary,
      lineHeight: typography.subtitle.lineHeight,
    },
    subtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.85)',
      marginTop: 1,
    },
  });
}
