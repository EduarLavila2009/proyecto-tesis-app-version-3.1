import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { PressableScale, Card, ScreenContainer } from '../components';
import { spacing, typography, useTheme } from '../theme';

const ICON_SIZE = 28;

/**
 * Primera pantalla del flujo: elegir rol y continuar a Login.
 */
export default function RoleSelectionScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const maxCardW = Math.min(420, width - spacing.lg * 2);

  const handleRoleSelect = async (role) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, role);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error al guardar rol:', error);
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brand} allowFontScaling>
            MEDICAL corp
          </Text>
          <Text style={styles.title} allowFontScaling>
            ¿Cómo vas a usar la app?
          </Text>
          <Text style={styles.subtitle} allowFontScaling>
            Elige tu perfil para personalizar la experiencia.
          </Text>
        </View>

        <View style={[styles.cardsColumn, { maxWidth: maxCardW, alignSelf: 'center', width: '100%' }]}>
          <PressableScale
            containerStyle={styles.pressableFull}
            onPress={() => handleRoleSelect(ROLES.PATIENT)}
            accessibilityRole="button"
            accessibilityLabel="Modo paciente. Accede a tu información médica y asistencia"
          >
            <Card style={styles.roleCard}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="person-circle-outline" size={ICON_SIZE} color={colors.primary} />
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle} allowFontScaling>
                    Paciente
                  </Text>
                  <Text style={styles.cardDescription} allowFontScaling>
                    Consulta tu información médica, métricas y asistencia con IA.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </PressableScale>

          <PressableScale
            containerStyle={styles.pressableFull}
            onPress={() => handleRoleSelect(ROLES.DOCTOR)}
            accessibilityRole="button"
            accessibilityLabel="Modo médico. Gestiona pacientes y funciones del robot"
          >
            <Card style={styles.roleCard}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="medkit-outline" size={ICON_SIZE} color={colors.secondary} />
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle} allowFontScaling>
                    Médico
                  </Text>
                  <Text style={styles.cardDescription} allowFontScaling>
                    Accede a pacientes, panel clínico y herramientas de apoyo.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </PressableScale>
        </View>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
  },
  header: {
    marginBottom: spacing.xl + spacing.sm,
  },
  brand: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title.fontSize + 4,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.45,
  },
  pressableFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  cardsColumn: {
    gap: spacing.md,
  },
  roleCard: {
    padding: spacing.md + 2,
    borderRadius: spacing.radiusLg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: spacing.radiusButton,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  cardTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.caption.fontSize * 1.45,
  },
  });
}
