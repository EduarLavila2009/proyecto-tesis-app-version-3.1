import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import colors from '../constants/colors';
import { colors as themeColors } from '../theme';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Ionicons por pestaña (barra inferior). */
const TAB_ICONS = {
  Home: 'home-outline',
  Dashboard: 'speedometer-outline',
  History: 'calendar-outline',
  Profile: 'person-outline',
};

/**
 * Pestañas principales tras iniciar sesión (Home, Dashboard, History, Profile).
 * Las pantallas son las mismas componentes que antes en el stack; no se duplican archivos.
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: themeColors.primary },
        headerTintColor: themeColors.onPrimary,
        headerTitleStyle: { fontWeight: '600', fontSize: fontSizes.lg },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.borderSubtle,
        },
        tabBarLabelStyle: { fontSize: fontSizes.sm - 2 },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name];
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

/**
 * Transición nativa tipo slide al avanzar/volver en el stack (comportamiento por defecto de react-native-screens).
 */
const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '600', fontSize: fontSizes.lg },
  headerBackTitleVisible: false,
  animation: 'default',
};

const secondaryScreenOptions = {
  ...headerOptions,
  headerBackVisible: true,
};

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!user) {
        setInitialRoute('RoleSelection');
      } else {
        setInitialRoute('MainTabs');
      }
    } catch (error) {
      setInitialRoute('RoleSelection');
    }
  };

  if (initialRoute === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={headerOptions}
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
          component={MainTabNavigator}
          options={{ headerShown: false }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
