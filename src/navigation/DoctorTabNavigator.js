import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createTabScreenOptions } from './headerOptions';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import PatientsListScreen from '../screens/PatientsListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  DoctorDashboard: 'grid-outline',
  Patients: 'people-outline',
  Profile: 'person-outline',
};

export default function DoctorTabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabOptions = useMemo(
    () => createTabScreenOptions(colors, { bottom: insets.bottom }),
    [colors, insets.bottom]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabOptions,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name] || 'ellipse-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{ title: 'Panel', tabBarLabel: 'Panel' }}
      />
      <Tab.Screen name="Patients" component={PatientsListScreen} options={{ title: 'Pacientes', tabBarLabel: 'Pacientes' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil', tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}
