import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';

/**
 * MEDICAL corp — Raíz de la aplicación.
 * ThemeProvider: colores (#6200EE), tipografía (h1–caption), espaciado (s–xl), expo-system-ui.
 */
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
