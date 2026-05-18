import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { spacing, typography, useTheme, createCardTitleStyle } from '../../theme';

/**
 * Card de sección con título e icono opcional (detalle paciente, ajustes).
 */
export default function SectionCard({ title, icon, children, style, titleStyle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
        ) : null}
        <Text style={[styles.title, titleStyle]} allowFontScaling>
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.m,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: spacing.radiusButton,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...createCardTitleStyle(colors),
      marginBottom: 0,
      flex: 1,
    },
  });
}
