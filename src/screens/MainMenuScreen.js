import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { MENU_ITEMS } from '../constants/menuConfig';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { ICON_SIZES } from '../constants/icons';
import { PressableScale } from '../components';

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
              // Navegar a RoleSelection; sesión solo se pierde al cerrar manualmente
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'RoleSelection' }],
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
          <Text style={styles.welcome} allowFontScaling>
            Bienvenido
          </Text>
          {user && (
            <Text style={styles.userName} allowFontScaling>
              {user.name}
            </Text>
          )}
          {roleKey && (
            <View
              style={[
                styles.roleBadge,
                roleKey === ROLES.DOCTOR ? styles.roleBadgeDoctor : styles.roleBadgePatient,
              ]}
            >
              <Text style={styles.roleText} allowFontScaling>
                Modo {roleLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.dashboard}>
          {menuItems.map((item) => (
            <PressableScale
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
              accessibilityRole="button"
              accessibilityLabel={
                item.isPlaceholder
                  ? `${item.title}, próximamente`
                  : `Abrir ${item.title}`
              }
            >
              <View style={styles.cardIcon}>
                <Ionicons name={item.icon} size={ICON_SIZES.menuCard} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} allowFontScaling>
                  {item.title}
                </Text>
                {item.isPlaceholder && (
                  <Text style={styles.cardBadge} allowFontScaling>
                    Próximamente
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={ICON_SIZES.action} color={colors.textMuted} />
            </PressableScale>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <PressableScale
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={ICON_SIZES.action} color={colors.critical} />
            <Text style={styles.logoutText} allowFontScaling>
              Cerrar sesión
            </Text>
          </PressableScale>
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
    padding: spacing.xxl,
    paddingBottom: spacing.screen,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  welcome: {
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: fontSizes.display,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radiusMd,
  },
  roleBadgePatient: {
    backgroundColor: colors.primary,
  },
  roleBadgeDoctor: {
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  roleText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
    marginBottom: spacing.xxl,
  },
  dashboard: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.radiusLg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.cardIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cardBadge: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  logoutSection: {
    marginTop: spacing.xxl,
    paddingTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.critical,
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.critical,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
});
