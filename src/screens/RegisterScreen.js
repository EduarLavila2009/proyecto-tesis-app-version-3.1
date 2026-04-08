import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import { Card, Input, Button, PressableScale, ScreenContainer } from '../components';
import { spacing, typography, useTheme } from '../theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateUserId = (users, role) => {
  const prefix = role === ROLES.DOCTOR ? 'MED' : 'PAC';
  const samePrefix = (users || []).filter((u) => u.id && u.id.startsWith(prefix));
  const numbers = samePrefix
    .map((u) => parseInt(u.id.replace(prefix, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
};

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = useHeaderHeight();
  const keyboardOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
  const { width } = useWindowDimensions();
  const formMaxW = Math.min(440, width - spacing.lg * 2);

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
        phone: '',
        avatar: '',
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
    <ScreenContainer
      scroll
      keyboardAvoiding
      keyboardVerticalOffset={keyboardOffset}
      contentContainerStyle={styles.scrollContent}
    >
          <View style={[styles.header, { maxWidth: formMaxW, alignSelf: 'center', width: '100%' }]}>
            <Text style={styles.title} allowFontScaling>
              Crear cuenta
            </Text>
            <Text style={styles.subtitle} allowFontScaling>
              Completa tus datos para unirte a MEDICAL corp
            </Text>
          </View>

          <View style={{ width: '100%', maxWidth: formMaxW, alignSelf: 'center' }}>
            <Card style={styles.card}>
              <Input
                label="Nombre completo"
                containerStyle={styles.fieldGroup}
                value={name}
                error={errors.name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                placeholder="Tu nombre"
                accessibilityLabel="Campo de nombre completo"
                style={styles.input}
              />

              <Input
                label="Correo electrónico"
                containerStyle={styles.fieldGroup}
                value={email}
                error={errors.email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                placeholder="nombre@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Campo de correo electrónico"
                style={styles.input}
              />

              <Input
                label="Contraseña"
                containerStyle={styles.fieldGroup}
                value={password}
                error={errors.password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                accessibilityLabel="Campo de contraseña"
                style={styles.input}
              />

              <Input
                label="Confirmar contraseña"
                containerStyle={styles.fieldGroup}
                value={confirmPassword}
                error={errors.confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                placeholder="Repite la contraseña"
                secureTextEntry
                accessibilityLabel="Campo de confirmar contraseña"
                style={styles.input}
              />

              <Button
                title="Registrarse"
                onPress={handleRegister}
                style={styles.primaryButton}
                accessibilityLabel="Registrarse, crear cuenta"
              />

              <PressableScale
                style={styles.secondaryWrap}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Volver al inicio de sesión"
              >
                <Text style={styles.secondaryText} allowFontScaling>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.secondaryAccent} allowFontScaling>
                    Inicia sesión
                  </Text>
                </Text>
              </PressableScale>
            </Card>
          </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.screen,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.title.fontSize + 2,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body.fontSize * 1.45,
  },
  card: {
    padding: spacing.lg + spacing.xs,
    borderRadius: spacing.radiusLg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
  },
  primaryButton: {
    marginTop: spacing.md,
    minHeight: spacing.lg * 2 + spacing.xs,
  },
  secondaryWrap: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  secondaryAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  });
}
