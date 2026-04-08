import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { ICON_SIZES } from '../constants/icons';
import { COMING_SOON_MESSAGE } from '../constants/copy';
import { useTheme } from '../theme';

/**
 * Pacientes - Placeholder
 * Se implementará en futuras fases (rol Médico)
 */
export default function PatientsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="people-outline" size={ICON_SIZES.screenHeader} color={colors.primary} />
        </View>
        <Text style={styles.title}>Pacientes</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Próximamente</Text>
        </View>
        <Text style={styles.description}>{COMING_SOON_MESSAGE}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 4,
    },
    title: {
      fontSize: fontSizes.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    badge: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusMd,
      marginBottom: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    badgeText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    description: {
      fontSize: fontSizes.base - 1,
      lineHeight: 23,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}
