import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import colors from '../constants/colors';
import { buttons } from '../constants/theme';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Formato de correo no válido';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userData = null;
      if (storedUser) {
        userData = JSON.parse(storedUser);
      }

      if (userData && userData.email === email.trim() && userData.password === password) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        // Reset a solo MainMenu: limpia el stack de auth (RoleSelection, Login)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainMenu' }],
          })
        );
      } else {
        Alert.alert(
          'Error',
          'Credenciales incorrectas. Regístrate si no tienes cuenta.'
        );
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>MEDICAL corp</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity
              style={[buttons.primary, styles.primaryButton]}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={buttons.primaryText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttons.secondary, styles.secondaryButton]}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={buttons.secondaryText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
  },
  primaryButton: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 8,
  },
});
