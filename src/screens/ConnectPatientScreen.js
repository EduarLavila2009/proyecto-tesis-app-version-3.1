import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import {
  parsePatientQrPayload,
  linkDoctorToPatient,
} from '../services/connectionService';
import {
  PrimaryButton,
  SecondaryButton,
  ScreenContainer,
  ScreenHeader,
  IconCircle,
} from '../components';
import { spacing, typography, layout, motion, useTheme } from '../theme';

/**
 * Médico: escanea el QR del paciente y guarda vínculo local (AsyncStorage).
 */
export default function ConnectPatientScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [loadingUser, setLoadingUser] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [phase, setPhase] = useState('intro');
  const [handled, setHandled] = useState(false);
  const handledRef = useRef(false);
  const [result, setResult] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const loadDoctor = useCallback(async () => {
    setLoadingUser(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) {
        setDoctorId(null);
        return;
      }
      const u = JSON.parse(raw);
      if (u?.role !== ROLES.DOCTOR || !u?.id) {
        setDoctorId(null);
        return;
      }
      setDoctorId(u.id);
    } catch (_) {
      setDoctorId(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoctor();
      setPhase('intro');
      setHandled(false);
      handledRef.current = false;
      setResult(null);
    }, [loadDoctor])
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    requestCameraPermission();
  }, [requestCameraPermission]);

  const runSuccessAnimation = useCallback(() => {
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...motion.spring.success,
    }).start();
  }, [scaleAnim]);

  const onBarcodeScanned = useCallback(
    async ({ data }) => {
      if (handledRef.current || !doctorId) return;
      handledRef.current = true;
      const parsed = parsePatientQrPayload(data);
      if (!parsed) {
        setHandled(true);
        setResult({
          ok: false,
          title: 'Código no válido',
          message: 'Este QR no es un código de paciente MEDICAL corp.',
        });
        return;
      }

      setHandled(true);
      const res = await linkDoctorToPatient(doctorId, parsed.patientId);
      if (res.success) {
        setResult({
          ok: true,
          title: res.alreadyLinked ? 'Ya vinculado' : '¡Conectado!',
          message: res.alreadyLinked ? res.message : `${res.patientName}`,
          subtitle: res.alreadyLinked
            ? undefined
            : 'El paciente aparecerá en tu lista como vinculado.',
        });
        runSuccessAnimation();
        setTimeout(() => navigation.goBack(), res.alreadyLinked ? 1800 : 2200);
      } else {
        setResult({
          ok: false,
          title: 'No se pudo vincular',
          message: res.message || 'Intenta de nuevo.',
        });
      }
    },
    [doctorId, navigation, runSuccessAnimation]
  );

  const startScan = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'El escáner solo funciona en iOS y Android.');
      return;
    }
    const permissionResult = await requestCameraPermission();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permiso de cámara',
        'Necesitamos acceso a la cámara para leer el código QR del paciente.'
      );
      return;
    }
    handledRef.current = false;
    setHandled(false);
    setResult(null);
    setPhase('camera');
  };

  const cancelCamera = () => {
    setPhase('intro');
    handledRef.current = false;
    setHandled(false);
    setResult(null);
  };

  const resetToIntro = () => {
    setResult(null);
    handledRef.current = false;
    setHandled(false);
    setPhase('intro');
  };

  if (loadingUser) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContent}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
        <Text style={styles.loadingLabel} allowFontScaling>
          Preparando escáner…
        </Text>
      </ScreenContainer>
    );
  }

  if (!doctorId) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContent}>
        <IconCircle color={colors.warning} size={88}>
          <Ionicons name="warning-outline" size={40} color={colors.warning} />
        </IconCircle>
        <ScreenHeader
          title="Solo médicos"
          subtitle="Inicia sesión con un perfil médico para vincular pacientes."
          style={styles.feedbackHeader}
        />
        <SecondaryButton
          title="Volver"
          appearance="outline"
          onPress={() => navigation.goBack()}
          style={styles.feedbackButton}
          accessibilityLabel="Volver"
        />
      </ScreenContainer>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContent}>
        <IconCircle color={colors.textSecondary}>
          <Ionicons name="phone-portrait-outline" size={40} color={colors.textSecondary} />
        </IconCircle>
        <ScreenHeader
          title="Escáner no disponible en web"
          subtitle="Usa Expo Go en un dispositivo móvil para escanear códigos QR."
          style={styles.feedbackHeader}
        />
        <SecondaryButton
          title="Volver"
          appearance="outline"
          onPress={() => navigation.goBack()}
          style={styles.feedbackButton}
          accessibilityLabel="Volver"
        />
      </ScreenContainer>
    );
  }

  if (phase === 'camera' && cameraPermission?.granted && !result) {
    return (
      <View style={styles.cameraRoot}>
        <CameraView
          onBarcodeScanned={handled ? undefined : onBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint} allowFontScaling>
            Coloca el QR del paciente dentro del marco
          </Text>
          <SecondaryButton
            title="Cancelar"
            appearance="ghost"
            onPress={cancelCamera}
            style={styles.cancelScanBtn}
            accessibilityLabel="Cancelar escaneo"
          />
        </View>
      </View>
    );
  }

  if (result && !result.ok) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContent}>
        <IconCircle color={colors.error}>
          <Ionicons name="close-circle" size={48} color={colors.error} />
        </IconCircle>
        <ScreenHeader
          title={result.title}
          subtitle={result.message}
          style={styles.feedbackHeader}
        />
        <PrimaryButton
          title="Intentar de nuevo"
          onPress={resetToIntro}
          style={styles.feedbackButton}
          accessibilityLabel="Intentar de nuevo"
        />
      </ScreenContainer>
    );
  }

  if (result && result.ok) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContent}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconCircle color={colors.secondary} size={96}>
            <Ionicons name="checkmark-circle" size={56} color={colors.secondary} />
          </IconCircle>
        </Animated.View>
        <ScreenHeader
          title={result.title}
          subtitle={result.subtitle ? `${result.message}\n${result.subtitle}` : result.message}
          style={styles.feedbackHeader}
        />
        <ActivityIndicator color={colors.primary} style={styles.successSpinner} />
        <Text style={styles.successHint} allowFontScaling>
          Redirigiendo…
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll animateEnter contentContainerStyle={styles.introContent}>
      <IconCircle color={colors.primary} size={96}>
        <Ionicons name="qr-code-outline" size={44} color={colors.primary} />
      </IconCircle>
      <ScreenHeader
        title="Vincular paciente"
        subtitle="Pide al paciente que abra su perfil y muestre su código QR. Luego escanea el código con la cámara."
        style={styles.introHeader}
      />
      <PrimaryButton
        title="Escanear QR"
        icon="camera-outline"
        onPress={startScan}
        style={styles.scanButton}
        accessibilityLabel="Escanear código QR del paciente"
      />
      <SecondaryButton
        title="Cancelar"
        appearance="outline"
        onPress={() => navigation.goBack()}
        style={styles.cancelIntroBtn}
        accessibilityLabel="Cancelar y volver"
      />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    centeredContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: layout.screenPaddingBottom,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingLabel: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.m,
    },
    feedbackHeader: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      marginTop: spacing.l,
      marginBottom: spacing.l,
    },
    feedbackButton: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
    },
    introContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPaddingH,
      paddingTop: layout.screenPaddingTop,
      paddingBottom: layout.screenPaddingBottom,
      justifyContent: 'center',
      alignItems: 'center',
    },
    introHeader: {
      marginBottom: layout.sectionGap,
      width: '100%',
      maxWidth: layout.contentMaxWidth,
    },
    scanButton: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      marginBottom: spacing.m,
    },
    cancelIntroBtn: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
    },
    cameraRoot: {
      flex: 1,
      backgroundColor: colors.cameraBackground,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xl,
    },
    scanFrame: {
      width: 260,
      height: 260,
      borderRadius: spacing.radiusLg,
      borderWidth: 3,
      borderColor: colors.scanFrameBorder,
    },
    scanHint: {
      ...typography.body,
      fontWeight: '600',
      color: colors.onCamera,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
    cancelScanBtn: {
      marginBottom: spacing.l,
    },
    successSpinner: {
      marginTop: spacing.l,
    },
    successHint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.m,
    },
  });
}
