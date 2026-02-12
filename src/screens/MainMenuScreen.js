import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { MENU_ITEMS } from '../constants/menuConfig';
import colors from '../constants/colors';

/**
 * Menú principal - Dashboard dinámico según rol
 * Paciente: Perfil, Historial médico, IA médica
 * Médico: Perfil, Pacientes, Funciones del robot
 */
export default function MainMenuScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [roleKey, setRoleKey] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const roleData = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
      if (userJson) setUser(JSON.parse(userJson));
      if (roleData) setRoleKey(roleData);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const roleLabel = roleKey === ROLES.DOCTOR ? 'Médico' : 'Paciente';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.USER);
              // Reset a [RoleSelection, Login] para que el usuario vea Login
              // pero pueda usar flecha ← para volver a RoleSelection y cambiar rol
              navigation.dispatch(
                CommonActions.reset({
                  index: 1,
                  routes: [
                    { name: 'RoleSelection' },
                    { name: 'Login' },
                  ],
                })
              );
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = MENU_ITEMS[roleKey] || MENU_ITEMS[ROLES.PATIENT];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcome}>Bienvenido</Text>
          {user && <Text style={styles.userName}>{user.name}</Text>}
          {roleKey && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Modo {roleLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.dashboard}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.85}
            >
              <View style={styles.cardIcon}>
                <Ionicons name={item.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.isPlaceholder && (
                  <Text style={styles.cardBadge}>Próximamente</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  welcome: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dashboard: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Ligera sombra para dar profundidad al dashboard
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.cardIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardBadge: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
    // Sin sombra: se mantiene como acción secundaria plana
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
