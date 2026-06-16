import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from './ui/Card';
import PressableScale from './PressableScale';
import { spacing, typography, useTheme } from '../theme';

export default function MedicalAlertBanner({ title, subtitle, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title || 'Alerta médica'}
      style={styles.pressable}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title} allowFontScaling numberOfLines={1}>
              {title || 'Alerta médica'}
            </Text>
            <Text style={styles.subtitle} allowFontScaling numberOfLines={2}>
              {subtitle || 'Se detectaron valores anormales. Revisa el detalle.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </View>
      </Card>
    </PressableScale>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    pressable: {
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: colors.danger,
      padding: spacing.lg,
      borderRadius: spacing.radiusLg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '900',
      color: colors.onPrimary,
      letterSpacing: -0.2,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.caption.fontSize,
      color: 'rgba(255,255,255,0.92)',
      lineHeight: typography.caption.fontSize * 1.35,
    },
  });
}

