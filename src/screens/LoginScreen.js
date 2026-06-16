import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
// Helper seguro: no usa UIManager.setLayoutAnimationEnabledExperimental (Fabric / newArchEnabled).
import { configureLayoutAnimation } from '../utils/layoutAnimation';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import {
  spacing,
  typography,
  layout,
  screenScrollContent,
  authFormWrapStyle,
  authFormCardStyle,
  createAuthFieldStyle,
  useTheme,
} from '../theme';
import {
  Card,
  TextInputField,
  PasswordInput,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
  OnboardingProgress,
  RoleBadge,
  TextLink,
} from '../components';
import * as authService from '../services/authService';

/**
 * Inicio de sesión — flujo onboarding paso 2.
 */
export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fieldStyles = useMemo(() => createAuthFieldStyle(), []);
  const headerHeight = useHeaderHeight();
  const keyboardOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
  const formWrap = authFormWrapStyle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
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

  const handleLogin = async () => {
    setLoginError('');
    configureLayoutAnimation();

    const res = await authService.login(email, password);

    if (res.errors) {
      setErrors(res.errors);
    } else {
      setErrors({});
    }

    if (res.success) {
      setLoginError('');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
      return;
    }

    if (res.code === 'STORAGE_ERROR') {
      console.error('Error en login:', res.error);
    }

    configureLayoutAnimation();
    if (res.code === 'VALIDATION_ERROR') {
      setLoginError('');
      return;
    }

    setLoginError(
      res.message ||
        (res.code === 'INVALID_CREDENTIALS'
          ? 'Credenciales incorrectas. Regístrate si no tienes cuenta.'
          : 'Ocurrió un error al iniciar sesión.')
    );
  };

  const goToRoleSelection = () => {
    navigation.navigate('RoleSelection');
  };

  const isSubmitDisabled = email.trim() === '' || password === '';

  return (
    <ScreenContainer
      scroll
      animateEnter
      keyboardAvoiding
      keyboardVerticalOffset={keyboardOffset}
      contentContainerStyle={styles.scroll}
    >
      <View style={formWrap}>
        <OnboardingProgress currentStep={2} />
        <RoleBadge role={selectedRole} />
        <ScreenHeader
          title="Accede a tu cuenta"
          subtitle="Ingresa el correo y la contraseña con los que te registraste."
          centered={false}
          style={styles.headerSection}
        />

        <Card style={[authFormCardStyle(), styles.card]}>
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
              setLoginError('');
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
            minLength={1}
            onChangeText={(text) => {
              setPassword(text);
              setLoginError('');
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder="Introduce tu contraseña"
            accessibilityLabel="Campo de contraseña"
            style={fieldStyles.input}
          />

          {loginError ? (
            <Text
              style={[styles.loginErrorText, fieldStyles.bannerError]}
              accessibilityLiveRegion="polite"
              allowFontScaling
            >
              {loginError}
            </Text>
          ) : null}

          <PrimaryButton
            title="Entrar"
            onPress={handleLogin}
            disabled={isSubmitDisabled}
            style={fieldStyles.submit}
            accessibilityLabel="Iniciar sesión"
          />
        </Card>

        <TextLink
          onPress={() => {
            if (selectedRole === ROLES.PATIENT) {
              navigation.navigate('PatientRegistration');
            } else {
              navigation.navigate('Register');
            }
          }}
          accent="Regístrate"
          accessibilityLabel="¿No tienes cuenta? Regístrate"
        >
          ¿No tienes cuenta?{' '}
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
    scroll: screenScrollContent({
      paddingTop: layout.screenPaddingTop,
    }),
    headerSection: {
      marginBottom: layout.fieldGap,
    },
    card: {
      marginBottom: spacing.s,
    },
    loginErrorText: {
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
