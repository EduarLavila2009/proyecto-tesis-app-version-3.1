import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import {
  ScreenContainer,
  ScreenHeader,
  RoleOptionCard,
  OnboardingProgress,
} from '../components';
import {
  layout,
  screenScrollContentHero,
  authFormWrapStyle,
  useTheme,
} from '../theme';

/**
 * Primera pantalla del flujo: elegir rol y continuar a Login.
 */
export default function RoleSelectionScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(), []);
  const { width } = useWindowDimensions();
  const maxCardW = Math.min(layout.roleContentMaxWidth, width - layout.screenPaddingH * 2);
  const contentW = authFormWrapStyle(maxCardW);

  const handleRoleSelect = async (role) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, role);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error al guardar rol:', error);
    }
  };

  return (
    <ScreenContainer scroll animateEnter contentContainerStyle={styles.scrollContent}>
      <View style={contentW}>
        <OnboardingProgress currentStep={1} />
        <ScreenHeader
          brand="MEDICAL corp"
          title="¿Cómo vas a usar la app?"
          subtitle="Elige tu perfil para personalizar métricas, panel y herramientas."
          titleVariant="h1"
          centered={false}
          style={styles.header}
          subtitleStyle={styles.heroSubtitle}
        />

        <View style={styles.cardsColumn}>
          <RoleOptionCard
            title="Paciente"
            description="Consulta tu información médica, métricas y asistencia con IA."
            icon="person-circle-outline"
            iconColor={colors.primary}
            onPress={() => handleRoleSelect(ROLES.PATIENT)}
            accessibilityLabel="Modo paciente. Accede a tu información médica y asistencia"
          />
          <RoleOptionCard
            title="Médico"
            description="Accede a pacientes, panel clínico y vinculación por código QR."
            icon="medkit-outline"
            iconColor={colors.secondary}
            onPress={() => handleRoleSelect(ROLES.DOCTOR)}
            accessibilityLabel="Modo médico. Gestiona pacientes y funciones clínicas"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function createStyles() {
  return StyleSheet.create({
    scrollContent: screenScrollContentHero(),
    header: {
      marginBottom: layout.sectionGap,
    },
    heroSubtitle: {
      textAlign: 'left',
    },
    cardsColumn: {
      gap: layout.fieldGap,
    },
  });
}
