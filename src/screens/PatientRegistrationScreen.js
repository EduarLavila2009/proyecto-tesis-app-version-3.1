import React, { useState, useMemo, useCallback } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';

// Importaciones del tema global y constantes del proyecto
import { useTheme, spacing, typography, getCardShadow } from '../theme';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import { buildPatientQrPayload, verifyPatient } from '../services/connectionService';
import { PrimaryButton, SecondaryButton } from '../components';
import * as storageService from '../services/storageService';

/**
 * Pantalla de Registro de Pacientes Clínicos
 * Flujo previo a la verificación médica presencial/QR.
 */
export default function PatientRegistrationScreen({ navigation }) {
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const cardShadow = useMemo(() => getCardShadow(colors), [colors]);

  // Estados del Formulario
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Estados de Interfaz y Validación
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);

  // Focus individual para inputs (efecto de borde suave dinámico)
  const [activeField, setActiveField] = useState(null);

  // Vibración táctil micro-interactiva (Expo Haptics)
  const triggerHaptic = useCallback(async (type = 'selection') => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.selectionAsync();
        }
      }
    } catch (_) {
      // Ignorar de forma segura si no está disponible
    }
  }, []);

  // Formateador automático de fecha de nacimiento (DD/MM/AAAA)
  const handleDobChange = (text) => {
    const clean = text.replace(/\D/g, '');
    let formatted = clean;

    if (clean.length > 2 && clean.length <= 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    } else if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    }

    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }

    setDob(formatted);
    if (errors.dob) {
      setErrors((prev) => ({ ...prev, dob: null }));
    }
  };

  // Formateador de teléfono (solo números)
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  // Validaciones completas
  const validateForm = () => {
    const newErrors = {};

    // Nombre completo obligatorio
    if (!name.trim()) {
      newErrors.name = 'El nombre completo es obligatorio';
    }

    // Fecha de nacimiento obligatoria y formato válido
    if (!dob.trim()) {
      newErrors.dob = 'La fecha de nacimiento es obligatoria';
    } else {
      const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!dobRegex.test(dob)) {
        newErrors.dob = 'Usa el formato DD/MM/AAAA';
      } else {
        const parts = dob.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const daysInMonth = (m, y) => new Date(y, m, 0).getDate();

        if (month < 1 || month > 12) {
          newErrors.dob = 'Mes no válido (01-12)';
        } else if (day < 1 || day > daysInMonth(month, year)) {
          newErrors.dob = 'Día no válido para este mes';
        } else {
          const inputDate = new Date(year, month - 1, day);
          const today = new Date();
          const minDate = new Date(1900, 0, 1);

          if (inputDate > today) {
            newErrors.dob = 'No puede ser una fecha futura';
          } else if (inputDate < minDate) {
            newErrors.dob = 'La fecha es demasiado antigua';
          }
        }
      }
    }

    // Correo electrónico
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Formato de correo electrónico no válido';
      }
    }

    // Teléfono
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      if (phone.length !== cleanPhone.length) {
        newErrors.phone = 'El teléfono solo debe contener números';
      } else if (cleanPhone.length < 7) {
        newErrors.phone = 'Mínimo 7 dígitos';
      }
    }

    // Contraseña
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Confirmar Contraseña
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar datos y registrar
  const handleRegister = async () => {
    triggerHaptic();
    if (!validateForm()) {
      Alert.alert('Formulario Inválido', 'Por favor revisa los campos con error.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Obtener lista de usuarios registrados para generar el nuevo ID (ej: PAC-0005)
      const users = await storageService.getUsers();

      const patientPrefix = 'PAC';
      const patientUsers = users.filter((u) => u.id && u.id.startsWith(patientPrefix));
      const numbers = patientUsers
        .map((u) => parseInt(u.id.replace(patientPrefix + '-', ''), 10))
        .filter((n) => !Number.isNaN(n));
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      const generatedId = `${patientPrefix}-${String(nextNum).padStart(4, '0')}`;

      // 2. Generar código único de verificación de 9 dígitos para validación manual
      const generatedCode = String(Math.floor(100000000 + Math.random() * 900000000));

      // 3. Construir objeto de paciente no verificado
      const newPatient = {
        id: generatedId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dateOfBirth: dob.trim(),
        role: ROLES.PATIENT,
        isVerified: false,
        verificationStatus: 'pending',
        verificationCode: generatedCode,
        createdAt: new Date().toISOString(),
        password: password,
        medicalHistory: {
          ...DEFAULT_MEDICAL_HISTORY,
        },
      };

      // 4. Guardar en la lista global de usuarios y como usuario activo/pendiente
      await storageService.updateUserInList(newPatient);
      await storageService.saveUser(newPatient);

      // 5. Cambiar al estado de registrado exitosamente
      setRegisteredPatient(newPatient);
      triggerHaptic('success');
    } catch (error) {
      console.error('Error al registrar paciente:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos localmente. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDob('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setRegisteredPatient(null);
  };

  const handleCheckVerification = async () => {
    triggerHaptic();
    try {
      const users = await storageService.getUsers();
      const currentDbUser = users.find((u) => u.id === registeredPatient.id);
      if (currentDbUser && currentDbUser.isVerified) {
        await storageService.saveUser(currentDbUser);
        Alert.alert('¡Cuenta Verificada!', 'Tu cuenta ha sido verificada con éxito. Bienvenido al panel clínico.', [
          {
            text: 'Entrar',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                })
              );
            }
          }
        ]);
      } else {
        Alert.alert(
          'Pendiente de verificación',
          'Pídele a tu médico que escanee tu código QR o introduzca tu código de 9 dígitos para activar tu cuenta.'
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo verificar el estado actual.');
    }
  };

  const handleAutoVerifyDemo = async () => {
    triggerHaptic('success');
    try {
      const res = await verifyPatient(registeredPatient.id);
      if (res.success) {
        const users = await storageService.getUsers();
        const currentDbUser = users.find((u) => u.id === registeredPatient.id);
        if (currentDbUser) {
          await storageService.saveUser(currentDbUser);
        }
        Alert.alert('Simulación de Éxito', '¡Cuenta verificada automáticamente en modo demostración!', [
          {
            text: 'Entrar al Panel',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                })
              );
            }
          }
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo simular la verificación.');
    }
  };

  // Pantalla 1: Formulario de Registro
  if (!registeredPatient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Superior */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="medical" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Registro de Paciente</Text>
            <Text style={styles.subtitle}>
              Por favor completa el formulario. Tu cuenta quedará creada en estado pendiente para
              su posterior validación clínica.
            </Text>
          </View>

          {/* Tarjeta del Formulario */}
          <View style={[styles.card, cardShadow]}>
            {/* Input: Nombre Completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'name' && styles.inputWrapperFocused,
                  errors.name && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={errors.name ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  onFocus={() => setActiveField('name')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Ej: Juan Antonio Pérez"
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Input: Fecha de Nacimiento */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de nacimiento *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'dob' && styles.inputWrapperFocused,
                  errors.dob && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={errors.dob ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={handleDobChange}
                  onFocus={() => setActiveField('dob')}
                  onBlur={() => setActiveField(null)}
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
              </View>
              {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
            </View>

            {/* Input: Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'email' && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={errors.email ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  onFocus={() => setActiveField('email')}
                  onBlur={() => setActiveField(null)}
                  placeholder="nombre@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Input: Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono móvil *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'phone' && styles.inputWrapperFocused,
                  errors.phone && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={errors.phone ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setActiveField('phone')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Mínimo 7 dígitos (solo números)"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {/* Input: Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'password' && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={errors.password ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry={secureText}
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={{ padding: 4 }}>
                  <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Input: Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeField === 'confirmPassword' && styles.inputWrapperFocused,
                  errors.confirmPassword && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={errors.confirmPassword ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  onFocus={() => setActiveField('confirmPassword')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Repite la contraseña"
                  secureTextEntry={secureText}
                  placeholderTextColor={colors.textPlaceholder}
                  allowFontScaling
                />
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            {/* Botón de Enviar */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Registrar Paciente</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Conmutador de Temas Claro/Oscuro Integrado (para demo visual) */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => {
              triggerHaptic();
              setMode(isDark ? 'light' : 'dark');
            }}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.primary} />
            <Text style={styles.themeToggleText}>
              Ver en modo {isDark ? 'Claro' : 'Oscuro'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pantalla 2: Registro Exitoso / Pendiente de Verificación
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Encabezado de Éxito */}
        <View style={styles.successHeader}>
          <View style={styles.successBadge}>
            <Ionicons name="time-outline" size={42} color={colors.warning} />
          </View>
          <Text style={styles.successTitle}>¡Paciente Registrado!</Text>
          <View style={styles.pendingStatusPill}>
            <Text style={styles.pendingStatusText}>PENDIENTE DE VERIFICACIÓN</Text>
          </View>
        </View>

        {/* Tarjeta de Resumen con QR */}
        <View style={[styles.card, cardShadow]}>
          <Text style={styles.cardHeading}>Verificación Clínica Requerida</Text>
          <Text style={styles.qrDescription}>
            Muestra el siguiente código QR o proporciona tu ID clínico al personal de salud para
            vincular tu expediente y habilitar las funciones médicas completas.
          </Text>

          {/* Código QR */}
          <View style={styles.qrContainer}>
            <View style={styles.qrBorder}>
              <QRCode
                value={buildPatientQrPayload(registeredPatient.id)}
                size={160}
                color={isDark ? '#000000' : '#0F172A'}
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrPatientId}>{registeredPatient.id}</Text>
          </View>

          {/* Detalles del Registro */}
          <View style={styles.detailsBlock}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Nombre:</Text>
              <Text style={styles.detailsValue}>{registeredPatient.name}</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Nacimiento:</Text>
              <Text style={styles.detailsValue}>{registeredPatient.dateOfBirth}</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Código Manual (9 dígs):</Text>
              <Text style={[styles.detailsValue, { fontWeight: 'bold', color: colors.secondary }]}>
                {registeredPatient.verificationCode}
              </Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Email:</Text>
              <Text style={styles.detailsValue}>{registeredPatient.email}</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Teléfono:</Text>
              <Text style={styles.detailsValue}>{registeredPatient.phone}</Text>
            </View>
          </View>

          {/* Botones de Finalización y Verificación */}
          <PrimaryButton
            title="Comprobar Verificación y Entrar"
            icon="checkmark-circle-outline"
            onPress={handleCheckVerification}
            style={[styles.backButton, { marginBottom: spacing.md }]}
          />

          <SecondaryButton
            title="Volver a Registro"
            icon="refresh-outline"
            appearance="outline"
            onPress={() => {
              triggerHaptic();
              resetForm();
            }}
            style={styles.backButton}
          />
        </View>

        {/* Simulación Auto-Verificación */}
        <TouchableOpacity
          style={styles.autoVerifyBtn}
          onPress={handleAutoVerifyDemo}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.autoVerifyText}>
            Simular Auto-Verificación instantánea (Demo)
          </Text>
        </TouchableOpacity>

        {/* Botón opcional para simular redirección a inicio */}
        {navigation ? (
          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => {
              triggerHaptic();
              navigation.goBack();
            }}
          >
            <Text style={styles.secondaryLinkLabel}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// Generación de Estilos Tematizados (Claro / Oscuro)
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
      marginTop: spacing.sm,
      marginBottom: spacing.md,
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
      marginTop: spacing.lg,
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

    // Estilos de Éxito / QR
    successHeader: {
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    successBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.warning}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    successTitle: {
      ...typography.title,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    pendingStatusPill: {
      backgroundColor: `${colors.warning}1A`,
      borderColor: colors.warning,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
    },
    pendingStatusText: {
      ...typography.caption,
      color: colors.warning,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    cardHeading: {
      ...typography.subtitle,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    qrDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    qrContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    qrBorder: {
      padding: spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: spacing.radiusCard,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    qrPatientId: {
      ...typography.subtitle,
      color: colors.primary,
      fontWeight: 'bold',
      marginTop: spacing.sm,
      letterSpacing: 1,
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
    secondaryLink: {
      marginTop: spacing.md,
    },
    secondaryLinkLabel: {
      ...typography.body,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    autoVerifyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      backgroundColor: colors.secondaryMuted,
      alignSelf: 'center',
    },
    autoVerifyText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
