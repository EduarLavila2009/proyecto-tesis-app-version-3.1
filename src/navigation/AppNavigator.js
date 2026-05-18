import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {

  NavigationContainer,

  DefaultTheme,

  DarkTheme,

} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants/storage';

import { useTheme } from '../theme';

import NavigationHeader from '../components/ui/NavigationHeader';

import { createStackScreenOptions } from './headerOptions';

import MainTabsGate from './MainTabsGate';



import RoleSelectionScreen from '../screens/RoleSelectionScreen';

import LoginScreen from '../screens/LoginScreen';

import RegisterScreen from '../screens/RegisterScreen';

import EditProfileScreen from '../screens/EditProfileScreen';

import RobotFunctionsScreen from '../screens/RobotFunctionsScreen';

import IAMedicaScreen from '../screens/IAMedicaScreen';

import PatientsListScreen from '../screens/PatientsListScreen';

import PatientDetailScreen from '../screens/PatientDetailScreen';

import ConnectPatientScreen from '../screens/ConnectPatientScreen';

import AlertsScreen from '../screens/AlertsScreen';

import SettingsScreen from '../screens/SettingsScreen';
import PatientWellnessScreen from '../screens/PatientWellnessScreen';



const Stack = createNativeStackNavigator();



export default function AppNavigator() {

  const { colors: themeColors, isDark } = useTheme();

  const [initialRoute, setInitialRoute] = useState(null);



  const navigationTheme = useMemo(

    () => ({

      ...(isDark ? DarkTheme : DefaultTheme),

      colors: {

        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),

        primary: themeColors.primary,

        background: themeColors.background,

        card: themeColors.primary,

        text: themeColors.onPrimary,

        border: themeColors.borderSubtle,

        notification: themeColors.primary,

      },

    }),

    [isDark, themeColors]

  );



  const stackScreenOptions = useMemo(

    () => createStackScreenOptions(themeColors),

    [themeColors]

  );



  const renderStackHeader = useCallback(

    (props) => <NavigationHeader {...props} />,

    []

  );



  const stackOptionsWithHeader = useMemo(

    () => ({

      ...stackScreenOptions,

      header: renderStackHeader,

    }),

    [stackScreenOptions, renderStackHeader]

  );



  useEffect(() => {

    checkAuth();

  }, []);



  const checkAuth = async () => {

    try {

      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      setInitialRoute(user ? 'MainTabs' : 'RoleSelection');

    } catch (_) {

      setInitialRoute('RoleSelection');

    }

  };



  if (initialRoute === null) {

    return (

      <View style={[styles.boot, { backgroundColor: themeColors.background }]}>

        <ActivityIndicator size="large" color={themeColors.primary} accessibilityLabel="Cargando aplicación" />

      </View>

    );

  }



  return (

    <NavigationContainer theme={navigationTheme}>

      <Stack.Navigator

        initialRouteName={initialRoute}

        screenOptions={stackOptionsWithHeader}

      >

        <Stack.Screen

          name="RoleSelection"

          component={RoleSelectionScreen}

          options={{ headerShown: false }}

        />

        <Stack.Screen

          name="Login"

          component={LoginScreen}

          options={{ title: 'Iniciar sesión' }}

        />

        <Stack.Screen

          name="Register"

          component={RegisterScreen}

          options={{ title: 'Registro' }}

        />

        <Stack.Screen

          name="MainTabs"

          component={MainTabsGate}

          options={{ headerShown: false }}

        />

        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />

        <Stack.Screen name="RobotFunctions" component={RobotFunctionsScreen} options={{ title: 'Funciones del robot' }} />

        <Stack.Screen name="MedicalAI" component={IAMedicaScreen} options={{ title: 'IA médica' }} />

        <Stack.Screen name="Patients" component={PatientsListScreen} options={{ title: 'Pacientes' }} />

        <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Detalle del paciente' }} />

        <Stack.Screen name="ConnectPatient" component={ConnectPatientScreen} options={{ title: 'Vincular paciente' }} />

        <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alertas médicas' }} />

        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />

        <Stack.Screen
          name="PatientWellness"
          component={PatientWellnessScreen}
          options={{ title: 'Cuidado y recordatorios' }}
        />

      </Stack.Navigator>

    </NavigationContainer>

  );

}



const styles = StyleSheet.create({

  boot: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

});


