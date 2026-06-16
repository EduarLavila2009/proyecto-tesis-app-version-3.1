import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { useTheme } from '../theme';
import PatientTabNavigator from './PatientTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';

/**
 * Elige el Tab navigator según el rol del usuario en sesión (lee AsyncStorage al enfocar).
 * Evita mostrar tabs de paciente tras login como médico.
 */
export default function MainTabsGate() {
  const { colors } = useTheme();
  const [role, setRole] = useState(null);
  const [ready, setReady] = useState(false);

  const resolveRole = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setRole(user?.role || null);
        setReady(true);
        return;
      }
      const roleRaw = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
      setRole(roleRaw || ROLES.PATIENT);
    } catch (_) {
      setRole(ROLES.PATIENT);
    } finally {
      setReady(true);
    }
  }, []);

  // Carga inicial al montar la compuerta de navegación
  React.useEffect(() => {
    resolveRole();
  }, [resolveRole]);

  useFocusEffect(
    useCallback(() => {
      // Recarga el rol en segundo plano sin interrumpir la UI con un spinner
      resolveRole();
    }, [resolveRole])
  );

  if (!ready) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
      </View>
    );
  }

  return role === ROLES.DOCTOR ? <DoctorTabNavigator /> : <PatientTabNavigator />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
