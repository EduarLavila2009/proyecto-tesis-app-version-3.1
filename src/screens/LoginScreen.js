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
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
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
      const emailTrim = email.trim().toLowerCase();

      // Buscar usuario en el array USERS (permite múltiples cuentas)
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (usersJson) {
        let users = [];
        try {
          users = JSON.parse(usersJson);
        } catch (_) {}
        const userData = users.find(
          (u) => u.email === emailTrim && u.password === password
        );
        if (userData) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainMenu' }],
            })
          );
          return;
        }
      }

      // Compatibilidad: si no está en USERS, comprobar USER (sesión anterior)
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userData = null;
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
        } catch (_) {}
      }
      if (userData && userData.email === emailTrim && userData.password === password) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
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
          <View style={styles.header}>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>MEDICAL corp</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
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
            </View>

            <View style={styles.fieldGroup}>
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
            </View>

            <TouchableOpacity
              style={[buttons.primary, styles.primaryButton]}
              onPress={handleLogin}
              activeOpacity={0.82}
            >
              <Text style={buttons.primaryText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryButtonText}>¿No tienes cuenta? Regístrate</Text>
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
    padding: spacing.xxl,
    paddingBottom: spacing.screen,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSizes.display,
    fontWeight: '700',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: fontSizes.base - 1,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.radiusMd,
    fontSize: fontSizes.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.text,
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  primaryButton: {
    marginTop: spacing.xxl,
    borderRadius: spacing.radiusMd,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryButtonText: {
    color: colors.textLight,
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});
