import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import colors from '../constants/colors';

/**
 * Pantalla de selección de rol - Primera pantalla al abrir la app
 * Permite elegir entre Paciente y Doctor antes del login
 */
export default function RoleSelectionScreen({ navigation }) {
  const handleRoleSelect = async (role) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, role);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al guardar rol:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Nombre de la empresa */}
        <Text style={styles.logo}>MEDICAL corp</Text>
        <Text style={styles.subtitle}>
          Asistencia de salud integral con Inteligencia Artificial
        </Text>

        {/* Botones de selección de rol */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => handleRoleSelect(ROLES.PATIENT)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>👤</Text>
            <Text style={styles.roleTitle}>Paciente</Text>
            <Text style={styles.roleDescription}>Acceso como paciente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => handleRoleSelect(ROLES.DOCTOR)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>👨‍⚕️</Text>
            <Text style={styles.roleTitle}>Doctor</Text>
            <Text style={styles.roleDescription}>Acceso como profesional médico</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  roleButton: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
