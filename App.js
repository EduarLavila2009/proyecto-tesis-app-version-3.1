import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * MEDICAL corp - App principal
 * Proyecto: Robot Mecánico Médico Personal
 * Tesis: Asistencia de salud pública integral con IA
 */
export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
