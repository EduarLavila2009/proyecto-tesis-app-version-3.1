import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMING_SOON_MESSAGE } from '../constants/copy';
import { ScreenContainer, IconCircle } from '../components';
import { spacing, typography, layout, screenScrollContentCentered, useTheme } from '../theme';

/**
 * Pantalla Funciones del robot — placeholder alineado al tema global.
 */
export default function RobotFunctionsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={screenScrollContentCentered({ maxWidth: layout.contentMaxWidth, alignSelf: 'center' })}
    >
      <IconCircle color={colors.primary} size={96}>
        <Ionicons name="hardware-chip-outline" size={44} color={colors.primary} />
      </IconCircle>
      <Text style={styles.title} allowFontScaling accessibilityRole="header">
        Funciones del robot
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText} allowFontScaling>
          Próximamente
        </Text>
      </View>
      <Text style={styles.description} allowFontScaling>
        {COMING_SOON_MESSAGE}
      </Text>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: layout.sectionGap,
      marginBottom: spacing.m,
      textAlign: 'center',
    },
    badge: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusInput,
      marginBottom: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    badgeText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.body.lineHeight,
    },
  });
}
