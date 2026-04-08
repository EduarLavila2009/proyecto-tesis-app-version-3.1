import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { useTheme } from '../theme';
import { fontSizes } from '../constants/typography';

import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RobotFunctionsScreen from '../screens/RobotFunctionsScreen';
import MedicalHistoryScreen from '../screens/MedicalHistoryScreen';
import IAMedicaScreen from '../screens/IAMedicaScreen';
import PatientsListScreen from '../screens/PatientsListScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ConnectPatientScreen from '../screens/ConnectPatientScreen';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Ionicons por pestaña (barra inferior). */
const PATIENT_TAB_ICONS = {
  Home: 'home-outline',
  Dashboard: 'speedometer-outline',
  History: 'calendar-outline',
  Profile: 'person-outline',
};

const DOCTOR_TAB_ICONS = {
  DoctorDashboard: 'grid-outline',
  Patients: 'people-outline',
  Profile: 'person-outline',
};

function PatientTabNavigator() {
  const { colors: c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.borderSubtle,
          elevation: 8,
          shadowOpacity: 0.04,
        },
        tabBarLabelStyle: { fontSize: fontSizes.sm - 2 },
        tabBarIcon: ({ color, size }) => {
          const iconName = PATIENT_TAB_ICONS[route.name];
          return (
            <Ionicons
              name={iconName || 'ellipse-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio', tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Panel', tabBarLabel: 'Panel' }}
      />
      <Tab.Screen
        name="History"
        component={MedicalHistoryScreen}
        options={{ title: 'Historial', tabBarLabel: 'Historial' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

function DoctorTabNavigator() {
  const { colors: c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.borderSubtle,
          elevation: 8,
          shadowOpacity: 0.04,
        },
        tabBarLabelStyle: { fontSize: fontSizes.sm - 2 },
        tabBarIcon: ({ color, size }) => {
          const iconName = DOCTOR_TAB_ICONS[route.name];
          return (
            <Ionicons
              name={iconName || 'ellipse-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{ title: 'Panel', tabBarLabel: 'Panel' }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsListScreen}
        options={{ title: 'Pacientes', tabBarLabel: 'Pacientes' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors: themeColors, isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);
  const [sessionRole, setSessionRole] = useState(null);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: themeColors.primary,
        background: themeColors.background,
        card: themeColors.surface,
        text: themeColors.textPrimary,
        border: themeColors.borderSubtle,
        notification: themeColors.primary,
      },
    }),
    [isDark, themeColors]
  );

  const stackScreenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: themeColors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: themeColors.borderSubtle,
      },
      headerTintColor: themeColors.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: fontSizes.lg,
        color: themeColors.textPrimary,
      },
      headerShadowVisible: false,
      headerBackTitleVisible: false,
      animation: 'default',
    }),
    [themeColors]
  );

  const secondaryScreenOptions = useMemo(
    () => ({
      ...stackScreenOptions,
      headerBackVisible: true,
    }),
    [stackScreenOptions]
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!user) {
        setInitialRoute('RoleSelection');
        setSessionRole(null);
      } else {
        try {
          const parsed = JSON.parse(user);
          setSessionRole(parsed?.role || null);
        } catch (_) {
          setSessionRole(null);
        }
        setInitialRoute('MainTabs');
      }
    } catch (error) {
      setInitialRoute('RoleSelection');
      setSessionRole(null);
    }
  };

  if (initialRoute === null) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={stackScreenOptions}
      >
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'MEDICAL corp',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Registro',
          }}
        />

        <Stack.Screen
          name="MainTabs"
          component={sessionRole === ROLES.DOCTOR ? DoctorTabNavigator : PatientTabNavigator}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Editar perfil',
          }}
        />

        <Stack.Screen
          name="RobotFunctions"
          component={RobotFunctionsScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Funciones del robot',
          }}
        />
        <Stack.Screen
          name="MedicalAI"
          component={IAMedicaScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'IA médica',
          }}
        />
        <Stack.Screen
          name="Patients"
          component={PatientsListScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Pacientes',
          }}
        />
        <Stack.Screen
          name="PatientDetail"
          component={PatientDetailScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Detalle del paciente',
          }}
        />
        <Stack.Screen
          name="ConnectPatient"
          component={ConnectPatientScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Vincular paciente',
          }}
        />
        <Stack.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Alertas médicas',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Ajustes',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
