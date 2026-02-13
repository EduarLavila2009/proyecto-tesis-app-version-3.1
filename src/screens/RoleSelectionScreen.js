import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { ICON_SIZES } from '../constants/icons';

/**
 * Pantalla de selección de rol - SIEMPRE la primera del flujo de autenticación.
 * El usuario elige Paciente o Médico, se guarda en AsyncStorage y navega a Login.
 * Usa navigate (no replace) para que Login mantenga RoleSelection en el stack
 * y muestre la flecha ← para volver a cambiar de rol.
 */
export default function RoleSelectionScreen({ navigation }) {
  const handleRoleSelect = async (role) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, role);
      // navigate (no replace): mantiene RoleSelection en el stack para que Login muestre flecha ←
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error al guardar rol:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>MEDICAL corp</Text>
          <Text style={styles.title}>¿Qué modo deseas usar?</Text>
          <Text style={styles.subtitle}>
            Selecciona el perfil con el que vas a acceder a la aplicación.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect(ROLES.PATIENT)}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconWrapper}>
              <Ionicons name="person-circle-outline" size={ICON_SIZES.roleCard} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>PACIENTE</Text>
            <Text style={styles.cardDescription}>
              Accede a tu información médica y asistencia
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect(ROLES.DOCTOR)}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconWrapper}>
              <Ionicons name="medkit-outline" size={ICON_SIZES.roleCard} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>MÉDICO</Text>
            <Text style={styles.cardDescription}>
              Gestiona pacientes y funciones del robot
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xxl,
    paddingTop: spacing.section,
  },
  header: {
    marginBottom: spacing.section,
  },
  brand: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.display,
    fontWeight: '700',
    color: colors.textLight,
    lineHeight: 36,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSizes.base - 1,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.xxl,
    borderRadius: spacing.radiusLg,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  cardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.cardIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: fontSizes.base - 1,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
