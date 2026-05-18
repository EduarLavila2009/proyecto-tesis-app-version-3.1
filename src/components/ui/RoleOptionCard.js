import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, layout, useTheme, useThemedStyles } from '../../theme';
import Card from './Card';
import PressableScale from '../PressableScale';

const ICON_SIZE = 28;
const ICON_WRAP = 52;

/**
 * Tarjeta táctil para selección de rol u opción similar.
 */
export default function RoleOptionCard({
  title,
  description,
  icon,
  iconColor,
  onPress,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tint = iconColor ?? colors.primary;

  return (
    <PressableScale
      containerStyle={styles.pressable}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `${tint}14` }]}>
            <Ionicons name={icon} size={ICON_SIZE} color={tint} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title} allowFontScaling>
              {title}
            </Text>
            <Text style={styles.description} allowFontScaling>
              {description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </Card>
    </PressableScale>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    pressable: {
      width: '100%',
      alignSelf: 'stretch',
    },
    card: {
      padding: spacing.md + 2,
      borderRadius: spacing.radiusLg,
      minHeight: layout.minTouchTarget + spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: ICON_WRAP,
      height: ICON_WRAP,
      borderRadius: spacing.radiusButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.subtitle,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: typography.caption.fontSize * 1.45,
    },
  });
}
