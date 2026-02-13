import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import colors from '../constants/colors';
import { fontSizes } from '../constants/typography';

import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainMenuScreen from '../screens/MainMenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RobotFunctionsScreen from '../screens/RobotFunctionsScreen';
import MedicalHistoryScreen from '../screens/MedicalHistoryScreen';
import IAMedicaScreen from '../screens/IAMedicaScreen';
import PatientsListScreen from '../screens/PatientsListScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';

const Stack = createNativeStackNavigator();

/**
 * Opciones globales del header - estilo médico azul consistente
 */
const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '600', fontSize: fontSizes.lg },
  headerBackTitleVisible: false,
};

/**
 * Opciones para pantallas secundarias: botón volver visible
 * Garantiza que siempre se pueda regresar al menú principal
 */
const secondaryScreenOptions = {
  ...headerOptions,
  headerBackVisible: true,
};

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Determina la pantalla inicial según estado de autenticación.
   * RoleSelection SIEMPRE es la primera pantalla cuando el usuario no está logueado.
   * Solo MainMenu cuando hay sesión activa.
   */
  const checkAuth = async () => {
    try {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (!user) {
        // Sin sesión: RoleSelection es la primera pantalla
        // El usuario elegirá rol y navegará a Login (con flecha ← para volver)
        setInitialRoute('RoleSelection');
      } else {
        // Con sesión activa: ir directo al menú principal
        setInitialRoute('MainMenu');
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
        {/* Flujo de autenticación */}
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

        {/* Menú principal - punto central, sin botón volver (es la raíz del flujo autenticado) */}
        <Stack.Screen
          name="MainMenu"
          component={MainMenuScreen}
          options={{
            ...headerOptions,
            title: 'MEDICAL corp',
            headerLeft: () => null,
          }}
        />

        {/* Pantallas secundarias - todas con botón volver hacia el menú */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Perfil',
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
          name="MedicalHistory"
          component={MedicalHistoryScreen}
          options={{
            ...secondaryScreenOptions,
            title: 'Historial médico',
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
