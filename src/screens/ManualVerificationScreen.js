import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importaciones del tema global y constantes del proyecto
import { useTheme, spacing, typography, getCardShadow } from '../theme';
import { STORAGE_KEYS } from '../constants/storage';
import { verifyPatient } from '../services/connectionService';
import { PrimaryButton, SecondaryButton } from '../components';

/**
 * Pantalla de Verificación Manual de Paciente (Médico)
 * Fiel al requisito de usar un código de 9 dígitos únicamente numérico.
 */
export default function ManualVerificationScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const cardShadow = useMemo(() => getCardShadow(colors), [colors]);

  // Estados de Entrada
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationState, setVerificationState] = useState('input'); // 'input' | 'success' | 'error'

  // Resultados
  const [patientName, setPatientName] = useState('');
  const [verifiedId, setVerifiedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Animaciones
  const activeFieldRef = useState(null);
  const [activeField, setActiveField] = activeFieldRef;
  const successScale = useRef(new Animated.Value(0)).current;

  // Vibración táctil micro-interactiva (Expo Haptics)
  const triggerHaptic = useCallback(async (type = 'selection') => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          await Haptics.selectionAsync();
        }
      }
    } catch (_) {
      // Ignorar de forma segura si no está disponible o es web
    }
  }, []);

  // Animación del check de éxito
  const runSuccessAnimation = useCallback(() => {
    successScale.setValue(0);
    Animated.spring(successScale, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [successScale]);

  // Validar y ejecutar verificación
  const handleVerify = async () => {
    triggerHaptic();
    const cleanCode = code.trim();

    // Requisito 1: Validar que el código tenga exactamente 9 caracteres y solo números.
    if (!cleanCode) {
      setError('Por favor introduce el código de verificación.');
      return;
    }

    const digitsRegex = /^\d{9}$/;
    if (!digitsRegex.test(cleanCode)) {
      setError('El código debe tener exactamente 9 dígitos y contener solo números.');
      triggerHaptic('error');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Requisito 2: Llamar al método verifyPatient(code)
      const res = await verifyPatient(cleanCode);
      if (res.success) {
        setPatientName(res.patientName || 'Paciente Activo');
        setVerifiedId(cleanCode);
        setVerificationState('success');
        runSuccessAnimation();
        triggerHaptic('success');
      } else {
        // Requisito 1: Mensaje de error personalizado
        setErrorMessage('Código inválido, verifique e intente de nuevo.');
        setVerificationState('error');
        triggerHaptic('error');
      }
    } catch (err) {
      console.error('Error al verificar manualmente:', err);
      setErrorMessage('Ocurrió un error inesperado al consultar la base de datos.');
      setVerificationState('error');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    triggerHaptic();
    setCode('');
    setError('');
    setErrorMessage('');
    setVerificationState('input');
  };

  // --- VISTA 1: Formulario de Entrada ---
  if (verificationState === 'input') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verificación Manual</Text>
            <Text style={styles.subtitle}>
              Introduce el código numérico de 9 dígitos proporcionado por el paciente para verificar su identidad y activar su expediente clínico.
            </Text>
          </View>

          {/* Tarjeta del Formulario */}
          <View style={[styles.card, cardShadow]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código de Verificación (9 dígitos)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'code' && styles.inputWrapperFocused,
                  error && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color={error ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={code}
                  onChangeText={(t) => {
                    // Solo permitir dígitos en la entrada
                    const clean = t.replace(/\D/g, '');
                    setCode(clean);
                    if (error) setError('');
                  }}
                  onFocus={() => setActiveField('code')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Ej: 485930291"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="number-pad"
                  maxLength={9}
                  allowFontScaling
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Botón de Enviar */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Verificar Paciente</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Selector de Tema */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => {
              triggerHaptic();
              setMode(isDark ? 'light' : 'dark');
            }}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.primary} />
            <Text style={styles.themeToggleText}>Ver en modo {isDark ? 'Claro' : 'Oscuro'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA 2: Éxito ---
  if (verificationState === 'success') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successHeader}>
            <Animated.View style={{ transform: [{ scale: successScale }] }}>
              <View style={[styles.successBadge, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="checkmark-circle" size={60} color={colors.success} />
              </View>
            </Animated.View>
            <Text style={styles.successTitle}>¡Verificación Exitosa!</Text>
            <View style={styles.verifiedStatusPill}>
              <Text style={styles.verifiedStatusText}>PACIENTE VERIFICADO CORRECTAMENTE</Text>
            </View>
          </View>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardHeading}>Expediente Clínico Activado</Text>
            <Text style={styles.successDescription}>
              La cuenta del paciente ha sido validada y activada de forma manual en el sistema. El paciente ya puede ingresar a su cuenta clínica para realizar sus mediciones de telemonitoreo.
            </Text>

            {/* Detalles */}
            <View style={styles.detailsBlock}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Paciente:</Text>
                <Text style={styles.detailsValue}>{patientName}</Text>
              </View>
              <View style={styles.detailsDivider} />
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Código de Validación:</Text>
                <Text style={styles.detailsValue}>{verifiedId}</Text>
              </View>
              <View style={styles.detailsDivider} />
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Estado Clínico:</Text>
                <Text style={[styles.detailsValue, { color: colors.success, fontWeight: 'bold' }]}>
                  Verificado / Habilitado
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Volver a la Lista"
              icon="people-outline"
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              style={styles.backButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA 3: Error ---
  if (verificationState === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successHeader}>
            <View style={[styles.successBadge, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="alert-circle" size={60} color={colors.error} />
            </View>
            <Text style={[styles.successTitle, { color: colors.error }]}>Fallo en la Verificación</Text>
            <View style={[styles.verifiedStatusPill, { borderColor: colors.error, backgroundColor: `${colors.error}1A` }]}>
              <Text style={[styles.verifiedStatusText, { color: colors.error }]}>CÓDIGO INVÁLIDO</Text>
            </View>
          </View>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardHeading}>Error en el Código</Text>
            <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
              {errorMessage || 'Código inválido, verifique e intente de nuevo.'}
            </Text>

            <PrimaryButton
              title="Intentar de nuevo"
              icon="refresh-outline"
              onPress={handleRetry}
              style={styles.backButton}
            />

            <SecondaryButton
              title="Volver"
              appearance="outline"
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Estilos de la Pantalla
function createStyles(colors, isDark) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      alignItems: 'center',
      paddingBottom: spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      width: '100%',
      maxWidth: 400,
    },
    logoBadge: {
      width: 56,
      height: 56,
      borderRadius: spacing.radiusButton,
      backgroundColor: colors.secondaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.title,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
      lineHeight: 18,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusCard,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.borderSubtle,
      borderRadius: spacing.radiusInput,
      paddingHorizontal: spacing.sm,
      backgroundColor: isDark ? '#0F172A' : '#FAFAFA',
      height: spacing.minTouchTarget,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    inputWrapperError: {
      borderColor: colors.error,
    },
    inputIcon: {
      marginRight: spacing.xs,
    },
    textInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      height: '100%',
      letterSpacing: 2, // Espaciado para mejorar lectura del código numérico
      fontSize: 16,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs / 2,
      fontWeight: '500',
    },
    submitButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: spacing.radiusButton,
      height: spacing.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    submitButtonDisabled: {
      backgroundColor: colors.buttonDisabled,
    },
    submitButtonText: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.onPrimary,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      backgroundColor: colors.secondaryMuted,
    },
    themeToggleText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },

    // Éxito / Error
    successHeader: {
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    successBadge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    successTitle: {
      ...typography.title,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    verifiedStatusPill: {
      backgroundColor: `${colors.success}1A`,
      borderColor: colors.success,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
    },
    verifiedStatusText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    cardHeading: {
      ...typography.subtitle,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    successDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    detailsBlock: {
      backgroundColor: isDark ? '#080C14' : '#F8FAFC',
      borderRadius: spacing.radiusInput,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    detailsLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    detailsValue: {
      ...typography.body,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    detailsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginVertical: spacing.xs / 2,
    },
    backButton: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: spacing.radiusButton,
    },
  });
}
