import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, useTheme } from '../../theme';
import { ROLES } from '../../constants/storage';

/**
 * Muestra el rol elegido en el flujo de onboarding.
 */
export default function RoleBadge({ role }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isDoctor = role === ROLES.DOCTOR;
  const label = isDoctor ? 'Médico' : 'Paciente';
  const icon = isDoctor ? 'medkit-outline' : 'person-circle-outline';
  const tint = isDoctor ? colors.secondary : colors.primary;

  if (!role) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: `${tint}14`, borderColor: `${tint}40` }]}
      accessibilityRole="text"
      accessibilityLabel={`Perfil seleccionado: ${label}`}
    >
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={[styles.text, { color: tint }]} allowFontScaling>
        {label}
      </Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.m,
      borderRadius: spacing.radiusInput,
      borderWidth: 1,
      marginBottom: spacing.m,
    },
    text: {
      ...typography.caption,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}
