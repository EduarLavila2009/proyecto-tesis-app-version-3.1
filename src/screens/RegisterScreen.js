import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { buttons } from '../constants/theme';
import { PressableScale } from '../components';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Genera el siguiente ID único según rol: PAC-0001, PAC-0002, MED-0001, etc.
 * @param {Array} users - Array actual de usuarios
 * @param {string} role - ROLES.PATIENT o ROLES.DOCTOR
 * @returns {string}
 */
const generateUserId = (users, role) => {
  const prefix = role === ROLES.DOCTOR ? 'MED' : 'PAC';
  const samePrefix = (users || []).filter((u) => u.id && u.id.startsWith(prefix));
  const numbers = samePrefix.map((u) => parseInt(u.id.replace(prefix, ''), 10)).filter((n) => !Number.isNaN(n));
  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
};

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!isValidEmail(email)) newErrors.email = 'Formato de correo no válido';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const role = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
      const roleKey = (role || ROLES.PATIENT).toLowerCase();

      // Obtener array de usuarios (o vacío si es el primero)
      let users = [];
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (usersJson) {
        try {
          users = JSON.parse(usersJson);
        } catch (_) {
          users = [];
        }
      }

      const id = generateUserId(users, roleKey);

      const userData = {
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: roleKey,
        medicalHistory: { ...DEFAULT_MEDICAL_HISTORY },
      };

      users.push(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (error) {
      console.error('Error al registrar:', error);
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
            <Text style={styles.title} allowFontScaling>
              Registro
            </Text>
            <Text style={styles.subtitle} allowFontScaling>
              Crear cuenta en MEDICAL corp
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Nombre completo"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                accessibilityLabel="Campo de nombre completo"
                allowFontScaling
              />
              {errors.name && (
                <Text style={styles.errorText} allowFontScaling>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError, { color: '#FFFFFF' }]}
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
                selectionColor={colors.primary}
                cursorColor={colors.primary}
                accessibilityLabel="Campo de correo electrónico"
                allowFontScaling
              />
              {errors.email && (
                <Text style={styles.errorText} allowFontScaling>
                  {errors.email}
                </Text>
              )}
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
                accessibilityLabel="Campo de contraseña"
                allowFontScaling
              />
              {errors.password && (
                <Text style={styles.errorText} allowFontScaling>
                  {errors.password}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirmar contraseña"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                secureTextEntry
                accessibilityLabel="Campo de confirmar contraseña"
                allowFontScaling
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText} allowFontScaling>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <PressableScale
              style={[buttons.primary, styles.primaryButton]}
              onPress={handleRegister}
              accessibilityRole="button"
              accessibilityLabel="Registrarse, crear cuenta"
            >
              <Text style={buttons.primaryText} allowFontScaling>
                Registrarse
              </Text>
            </PressableScale>

            <PressableScale
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio de sesión"
            >
              <Text style={styles.secondaryButtonText} allowFontScaling>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </PressableScale>
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
