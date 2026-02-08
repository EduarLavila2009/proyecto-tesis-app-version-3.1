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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import colors from '../constants/colors';

export default function MainMenuScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const roleData = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      if (roleData) {
        setRole(roleData === 'doctor' ? 'Doctor' : 'Paciente');
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

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
              navigation.replace('Login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcome}>Bienvenido</Text>
        {user && <Text style={styles.userName}>{user.name}</Text>}
        {role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        )}

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuTitle}>Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} disabled>
            <Text style={styles.menuIcon}>🤖</Text>
            <Text style={styles.menuTitle}>Funciones del robot</Text>
            <Text style={styles.comingSoon}>Próximamente</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
  welcome: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  roleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  comingSoon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
