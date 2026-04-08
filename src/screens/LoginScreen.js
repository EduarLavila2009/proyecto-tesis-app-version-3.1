import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  StatusBar,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { spacing, typography, useTheme } from '../theme';
import {
  Card,
  Header,
  Input,
  Button,
  PressableScale,
  ScreenContainer,
} from '../components';
import * as authService from '../services/authService';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Pantalla de inicio de sesión — UI con tema global; toda la lógica en `authService.login`.
 */
export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = useHeaderHeight();
  const keyboardOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    setLoginError('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

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

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const isSubmitDisabled = email.trim() === '' || password === '';

  return (
    <ScreenContainer
      scroll
      keyboardAvoiding
      keyboardVerticalOffset={keyboardOffset}
      contentContainerStyle={styles.scroll}
    >
          <View style={styles.headerSection}>
            <Header
              title="Iniciar Sesión"
              style={styles.headerWrap}
              textStyle={styles.headerTitle}
            />
            <Text style={styles.subtitle} allowFontScaling>
              Accede con tu cuenta MEDICAL corp
            </Text>
          </View>

          <View style={styles.cardWrap}>
            <Card style={styles.card}>
              <Input
                label="Email"
                containerStyle={styles.fieldBlock}
                value={email}
                error={errors.email}
                onChangeText={(text) => {
                  setEmail(text);
                  setLoginError('');
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
                containerStyle={styles.fieldBlock}
                value={password}
                error={errors.password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLoginError('');
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder="Introduce tu contraseña"
                secureTextEntry
                accessibilityLabel="Campo de contraseña"
                style={styles.input}
              />

              {loginError ? (
                <Text
                  style={styles.loginErrorText}
                  accessibilityLiveRegion="polite"
                  allowFontScaling
                >
                  {loginError}
                </Text>
              ) : null}

              <Button
                title="Entrar"
                onPress={handleLogin}
                disabled={isSubmitDisabled}
                style={styles.submitBtn}
                accessibilityLabel="Iniciar sesión, botón Entrar"
              />
            </Card>
          </View>

          <PressableScale
            style={styles.linkWrap}
            onPress={() => navigation.navigate('Register')}
            accessibilityRole="link"
            accessibilityLabel="Ir a registro, ¿no tienes cuenta?"
          >
            <Text style={styles.linkText} allowFontScaling>
              ¿No tienes cuenta?{' '}
              <Text style={styles.linkAccent} allowFontScaling>
                Regístrate
              </Text>
            </Text>
          </PressableScale>
    </ScreenContainer>
  );
}

const MAX_FORM_WIDTH = spacing.md * 26;
const HEADER_TITLE_SIZE = typography.title.fontSize + 6;

function createStyles(colors) {
  return StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  headerWrap: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: HEADER_TITLE_SIZE,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.45,
    textAlign: 'left',
    width: '100%',
    marginTop: spacing.xs,
  },
  cardWrap: {
    width: '100%',
    maxWidth: MAX_FORM_WIDTH,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    padding: spacing.lg + spacing.xs,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    minHeight: spacing.xl + spacing.md,
  },
  loginErrorText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.body.fontSize * 1.45,
  },
  submitBtn: {
    width: '100%',
    marginTop: spacing.sm,
    minHeight: spacing.xl + spacing.md,
  },
  linkWrap: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  });
}
