import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importaciones del tema global y constantes del proyecto
import { useTheme, spacing, typography, getCardShadow } from '../theme';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { parsePatientQrPayload, verifyPatient } from '../services/connectionService';
import { PrimaryButton, SecondaryButton } from '../components';

/**
 * Pantalla de Verificación de Paciente mediante QR y Manual (Médico)
 */
export default function PatientVerificationScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const cardShadow = useMemo(() => getCardShadow(colors), [colors]);

  // Permisos y Estado de Cámara
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mode, setModeState] = useState('camera'); // 'camera' | 'manual' | 'success' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Entrada Manual
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [activeField, setActiveField] = useState(null);

  // Resultados de Verificación
  const [patientName, setPatientName] = useState('');
  const [verifiedId, setVerifiedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Animaciones (Línea de escaneo láser y escala del check de éxito)
  const laserAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const isScanningRef = useRef(true);

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

  // Animación del Láser del Escáner (Lazo infinito)
  useEffect(() => {
    if (mode === 'camera' && cameraPermission?.granted) {
      isScanningRef.current = true;
      const startLaserAnimation = () => {
        laserAnim.setValue(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(laserAnim, {
              toValue: 240,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(laserAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      startLaserAnimation();
    } else {
      isScanningRef.current = false;
      laserAnim.stopAnimation();
    }
  }, [mode, cameraPermission, laserAnim]);

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

  // Solicitar permiso de cámara en carga inicial
  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestCameraPermission();
    } else {
      // Forzar fallback manual en web de inmediato
      setModeState('manual');
    }
  }, [requestCameraPermission]);

  // Ejecución de la verificación de paciente
  const executeVerification = async (patientId) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await verifyPatient(patientId);
      if (res.success) {
        setPatientName(res.patientName || 'Paciente Registrado');
        setVerifiedId(patientId);
        setModeState('success');
        runSuccessAnimation();
        triggerHaptic('success');
      } else {
        setErrorMessage(res.message || 'Código inválido o paciente no registrado.');
        setModeState('error');
        triggerHaptic('error');
      }
    } catch (err) {
      console.error('Error al verificar paciente:', err);
      setErrorMessage('Ocurrió un error al procesar la verificación.');
      setModeState('error');
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback al detectar un código QR
  const onBarcodeScanned = useCallback(
    ({ data }) => {
      if (!isScanningRef.current) return;
      isScanningRef.current = false; // Detener lecturas duplicadas inmediatas
      triggerHaptic();

      const parsed = parsePatientQrPayload(data);
      if (parsed?.patientId) {
        executeVerification(parsed.patientId);
      } else {
        // El QR no tiene el formato clínico esperado
        setErrorMessage('Este código QR no corresponde a un paciente de MEDICAL corp.');
        setModeState('error');
        triggerHaptic('error');
      }
    },
    [triggerHaptic]
  );

  // Manejo del envío manual de código
  const handleManualSubmit = () => {
    triggerHaptic();
    const code = manualCode.trim();
    if (!code) {
      setManualError('Introduce el código de verificación.');
      return;
    }

    // Aceptamos formato PAC-XXXX o número de 9 dígitos
    const isClinicalFormat = /^PAC-\d{4}$/i.test(code);
    const isDigitsFormat = /^\d{9}$/.test(code);

    if (!isClinicalFormat && !isDigitsFormat) {
      setManualError('Introduce un formato válido (PAC-XXXX o 9 dígitos).');
      return;
    }

    setManualError('');
    executeVerification(code.toUpperCase());
  };

  // Re-escanear
  const handleRetryScan = () => {
    triggerHaptic();
    setManualCode('');
    setManualError('');
    setErrorMessage('');
    setPatientName('');
    setVerifiedId('');
    isScanningRef.current = true;
    setModeState('camera');
  };

  // Si no hay permisos concedidos o la cámara falla, la app muestra de inmediato la opción manual
  const showManualFallback = !cameraPermission?.granted || mode === 'manual' || Platform.OS === 'web';

  // --- VISTA 1: Escáner QR de Cámara ---
  if (!showManualFallback && mode === 'camera') {
    return (
      <View style={styles.cameraRoot}>
        <CameraView
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Máscara semi-transparente rodeando el visor */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.maskTop} />
          <View style={styles.maskMiddleRow}>
            <View style={styles.maskSide} />
            <View style={styles.maskViewportHole} />
            <View style={styles.maskSide} />
          </View>
          <View style={styles.maskBottom} />
        </View>

        {/* Capa de indicaciones y marco visual */}
        <SafeAreaView style={styles.cameraOverlayContainer}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              style={styles.circleCloseButton}
              accessibilityLabel="Cerrar y volver"
            >
              <Ionicons name="close" size={24} color={colors.onCamera} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Escáner Clínico</Text>
            <View style={{ width: 40 }} /> {/* Espaciador simétrico */}
          </View>

          <View style={styles.scannerViewport}>
            {/* Esquinas del marco */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animación del láser */}
            <Animated.View
              style={[
                styles.scannerLaser,
                {
                  transform: [{ translateY: laserAnim }],
                },
              ]}
            />
          </View>

          <View style={styles.cameraFooter}>
            <Text style={styles.scanInstruction}>Apunte al QR del paciente</Text>
            <Text style={styles.scanSubinstruction}>
              Alinea el código dentro del marco para verificar la identidad clínica automáticamente.
            </Text>

            {/* Botón de Fallback Manual */}
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => {
                triggerHaptic();
                setModeState('manual');
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.onCamera} />
              <Text style={styles.fallbackButtonText}>Ingresar código manualmente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- VISTA 2: Fallback de Verificación Manual ---
  if (showManualFallback && (mode === 'camera' || mode === 'manual')) {
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
              <Ionicons name="keypad-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verificación Manual</Text>
            <Text style={styles.subtitle}>
              {!cameraPermission?.granted && Platform.OS !== 'web'
                ? 'El acceso a la cámara fue denegado. Introduce el identificador del paciente para continuar.'
                : 'Introduce el ID clínico del paciente para verificar sus credenciales en la base de datos.'}
            </Text>
          </View>

          {/* Tarjeta de Entrada */}
          <View style={[styles.card, cardShadow]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código único de paciente</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'code' && styles.inputWrapperFocused,
                  manualError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={manualError ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={manualCode}
                  onChangeText={(t) => {
                    setManualCode(t);
                    if (manualError) setManualError('');
                  }}
                  onFocus={() => setActiveField('code')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Ej: PAC-0004 o 9 dígitos"
                  placeholderTextColor={colors.textPlaceholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  allowFontScaling
                />
              </View>
              {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}
            </View>

            {/* Botón de Enviar */}
            <TouchableOpacity
              onPress={handleManualSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Verificar Identidad</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {cameraPermission?.granted && Platform.OS !== 'web' ? (
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={() => {
                triggerHaptic();
                setModeState('camera');
              }}
            >
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={styles.themeToggleText}>Volver al escáner QR</Text>
            </TouchableOpacity>
          ) : null}

          {/* Conmutador de Temas Claro/Oscuro */}
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

  // --- VISTA 3: Éxito en Verificación ---
  if (mode === 'success') {
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
            <Text style={styles.cardHeading}>Expediente Activado</Text>
            <Text style={styles.successDescription}>
              La cuenta del paciente ha sido validada y vinculada en el sistema. Ahora el paciente
              puede utilizar todas las funciones clínicas y registrar alertas vitales.
            </Text>

            {/* Datos del Paciente */}
            <View style={styles.detailsBlock}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Nombre Completo:</Text>
                <Text style={styles.detailsValue}>{patientName}</Text>
              </View>
              <View style={styles.detailsDivider} />
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Identificación Clínica:</Text>
                <Text style={styles.detailsValue}>{verifiedId}</Text>
              </View>
              <View style={styles.detailsDivider} />
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Estado de Registro:</Text>
                <Text style={[styles.detailsValue, { color: colors.success, fontWeight: 'bold' }]}>
                  Activo / Verificado
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Volver a Pacientes"
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

  // --- VISTA 4: Error en Verificación ---
  if (mode === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successHeader}>
            <View style={[styles.successBadge, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="alert-circle" size={60} color={colors.error} />
            </View>
            <Text style={[styles.successTitle, { color: colors.error }]}>Fallo en la Verificación</Text>
            <View style={[styles.verifiedStatusPill, { borderColor: colors.error, backgroundColor: `${colors.error}1A` }]}>
              <Text style={[styles.verifiedStatusText, { color: colors.error }]}>ERROR DE CÓDIGO</Text>
            </View>
          </View>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardHeading}>No se pudo completar</Text>
            <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
              {errorMessage || 'El código escaneado no existe o no tiene los permisos clínicos adecuados.'}
            </Text>

            <PrimaryButton
              title="Intentar de nuevo"
              icon="refresh-outline"
              onPress={handleRetryScan}
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

// Estilos dinámicos y adaptativos
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

    // Éxito
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

    // Estilos de la cámara y overlay
    cameraRoot: {
      flex: 1,
      backgroundColor: '#000000',
    },
    maskTop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
    },
    maskMiddleRow: {
      flexDirection: 'row',
      height: 260,
    },
    maskSide: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
    },
    maskViewportHole: {
      width: 260,
      backgroundColor: 'transparent',
    },
    maskBottom: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
    },
    cameraOverlayContainer: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    cameraHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: spacing.md,
    },
    circleCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraTitle: {
      ...typography.subtitle,
      color: colors.onCamera,
      fontWeight: 'bold',
    },
    scannerViewport: {
      width: 260,
      height: 260,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: colors.scanFrameBorder,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: spacing.radiusInput,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: spacing.radiusInput,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: spacing.radiusInput,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: spacing.radiusInput,
    },
    scannerLaser: {
      width: 250,
      height: 3,
      backgroundColor: colors.error,
      position: 'absolute',
      top: 10,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 5,
    },
    cameraFooter: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.l,
    },
    scanInstruction: {
      ...typography.subtitle,
      color: colors.onCamera,
      fontWeight: 'bold',
      marginBottom: spacing.xs,
    },
    scanSubinstruction: {
      ...typography.caption,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 16,
    },
    fallbackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 1.5,
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.radiusButton,
      gap: spacing.xs,
    },
    fallbackButtonText: {
      ...typography.body,
      color: colors.onCamera,
      fontWeight: '600',
    },
  });
}
