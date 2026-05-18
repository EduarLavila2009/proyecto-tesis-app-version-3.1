import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createTabScreenOptions } from './headerOptions';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MedicalHistoryScreen from '../screens/MedicalHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Dashboard: 'speedometer-outline',
  History: 'calendar-outline',
  Profile: 'person-outline',
};

export default function PatientTabNavigator() {
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio', tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Panel', tabBarLabel: 'Panel' }} />
      <Tab.Screen name="History" component={MedicalHistoryScreen} options={{ title: 'Historial', tabBarLabel: 'Historial' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil', tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}
