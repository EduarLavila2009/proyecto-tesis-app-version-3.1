import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  StatusBar,
  Alert,
} from 'react-native';
// Helper seguro para Fabric — ver src/utils/layoutAnimation.js
import { configureLayoutAnimation } from '../utils/layoutAnimation';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { STORAGE_KEYS } from '../constants/storage';
import {
  Card,
  TextInputField,
  PasswordInput,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
  TextLink,
  OnboardingProgress,
  RoleBadge,
} from '../components';
// Tokens de tema globales — typography evita "Property 'typography' doesn't exist" en createStyles
import {
  layout,
  spacing,
  typography,
  screenScrollContent,
  authFormWrapStyle,
  authFormCardStyle,
  createAuthFieldStyle,
  useTheme,
} from '../theme';
import * as authService from '../services/authService';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Registro — flujo onboarding paso 3 (misma estructura visual que LoginScreen).
 */
export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fieldStyles = useMemo(() => createAuthFieldStyle(), []);
  const headerHeight = useHeaderHeight();
  const keyboardOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
  const { width } = useWindowDimensions();
  const formWrap = authFormWrapStyle(
    Math.min(layout.contentMaxWidth, width - layout.screenPaddingH * 2)
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const role = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
          if (!cancelled) setSelectedRole(role);
        } catch (_) {
          if (!cancelled) setSelectedRole(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const validateForm = () => {
    configureLayoutAnimation();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!isValidEmail(email)) newErrors.email = 'Formato de correo no válido';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setRegisterError('');
    if (!validateForm()) return;

    if (!selectedRole) {
      Alert.alert(
        'Perfil no seleccionado',
        'Vuelve al paso anterior y elige si eres paciente o médico.',
        [{ text: 'Elegir perfil', onPress: () => navigation.navigate('RoleSelection') }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.register({
        name,
        email,
        password,
        role: selectedRole,
      });

      if (res.success) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        );
        return;
      }

      configureLayoutAnimation();
      if (res.code === 'EMAIL_EXISTS') {
        setRegisterError(res.message);
        return;
      }

      setRegisterError(res.message || 'No se pudo completar el registro.');
    } catch (error) {
      console.error('Error al registrar:', error);
      setRegisterError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToRoleSelection = () => {
    navigation.navigate('RoleSelection');
  };

  const isSubmitDisabled =
    submitting ||
    !name.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword;

  return (
    <ScreenContainer
      scroll
      animateEnter
      keyboardAvoiding
      keyboardVerticalOffset={keyboardOffset}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={formWrap}>
        <OnboardingProgress currentStep={3} />
        <RoleBadge role={selectedRole} />
        <ScreenHeader
          title="Crear cuenta"
          subtitle="Completa tus datos. Tu información se guarda solo en este dispositivo."
          centered={false}
          style={styles.headerSection}
        />

        <Card style={[authFormCardStyle(), styles.card]}>
          <TextInputField
            label="Nombre completo"
            required
            containerStyle={fieldStyles.field}
            value={name}
            error={errors.name}
            validationType="text"
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            placeholder="Tu nombre"
            accessibilityLabel="Campo de nombre completo"
            style={fieldStyles.input}
          />

          <TextInputField
            label="Correo electrónico"
            required
            containerStyle={fieldStyles.field}
            value={email}
            error={errors.email}
            validationType="email"
            validateOnBlur
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            placeholder="nombre@correo.com"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Campo de correo electrónico"
            style={fieldStyles.input}
          />

          <PasswordInput
            label="Contraseña"
            required
            containerStyle={fieldStyles.field}
            value={password}
            error={errors.password}
            minLength={6}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder="Mínimo 6 caracteres"
            accessibilityLabel="Campo de contraseña"
            style={fieldStyles.input}
          />

          <PasswordInput
            label="Confirmar contraseña"
            required
            containerStyle={fieldStyles.field}
            value={confirmPassword}
            error={errors.confirmPassword}
            minLength={6}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            placeholder="Repite la contraseña"
            accessibilityLabel="Campo de confirmar contraseña"
            style={fieldStyles.input}
          />

          {registerError ? (
            <Text
              style={[styles.registerErrorText, fieldStyles.bannerError]}
              accessibilityLiveRegion="polite"
              allowFontScaling
            >
              {registerError}
            </Text>
          ) : null}

          <PrimaryButton
            title={submitting ? 'Creando cuenta…' : 'Registrarse'}
            onPress={handleRegister}
            disabled={isSubmitDisabled}
            style={fieldStyles.submit}
            accessibilityLabel="Registrarse, crear cuenta"
          />
        </Card>

        <TextLink
          onPress={() => navigation.goBack()}
          accent="Inicia sesión"
          accessibilityLabel="¿Ya tienes cuenta? Inicia sesión"
        >
          ¿Ya tienes cuenta?{' '}
        </TextLink>

        <TextLink
          onPress={goToRoleSelection}
          accent="Cambiar perfil"
          style={styles.secondaryLink}
          accessibilityLabel="Cambiar perfil de paciente o médico"
        >
          ¿Elegiste otro perfil?{' '}
        </TextLink>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    scrollContent: screenScrollContent({
      paddingTop: layout.screenPaddingTop,
    }),
    headerSection: {
      marginBottom: layout.fieldGap,
    },
    card: {
      marginBottom: spacing.s,
    },
    registerErrorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      lineHeight: typography.body.lineHeight,
    },
    secondaryLink: {
      marginTop: spacing.s,
    },
  });
}
