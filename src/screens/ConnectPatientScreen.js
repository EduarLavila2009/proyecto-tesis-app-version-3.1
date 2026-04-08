import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import {
  parsePatientQrPayload,
  linkDoctorToPatient,
} from '../services/connectionService';
import { spacing, typography, useTheme } from '../theme';

const QR_TYPES =
  BarCodeScanner.Constants?.BarCodeType?.qr != null
    ? [BarCodeScanner.Constants.BarCodeType.qr]
    : ['qr'];

/**
 * Médico: escanea el QR del paciente y guarda vínculo local (AsyncStorage).
 */
export default function ConnectPatientScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [permission, setPermission] = useState(null);
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
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  const runSuccessAnimation = useCallback(() => {
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const onBarCodeScanned = useCallback(
    async (nativeEvent) => {
      if (handledRef.current || !doctorId) return;
      handledRef.current = true;
      const data = nativeEvent?.data;
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
          subtitle: res.alreadyLinked ? undefined : 'El paciente aparecerá en tu lista como vinculado.',
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
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setPermission(status === 'granted');
    if (status !== 'granted') {
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

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!doctorId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text style={styles.errorTitle} allowFontScaling>
            Solo médicos
          </Text>
          <Text style={styles.errorBody} allowFontScaling>
            Inicia sesión como médico para vincular pacientes.
          </Text>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.introTitle} allowFontScaling>
            Escáner no disponible en web
          </Text>
          <Text style={styles.introHint} allowFontScaling>
            Usa la app en un dispositivo móvil para escanear códigos QR.
          </Text>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'camera' && permission && !result) {
    return (
      <View style={styles.cameraRoot}>
        <BarCodeScanner
          onBarCodeScanned={handled ? undefined : onBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={QR_TYPES}
        />
        <SafeAreaView style={styles.overlay} pointerEvents="box-none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint} allowFontScaling>
            Coloca el QR del paciente dentro del marco
          </Text>
          <Pressable style={styles.cancelScanBtn} onPress={cancelCamera}>
            <Text style={styles.cancelScanText}>Cancelar</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (result && !result.ok) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.resultBox}>
          <Ionicons name="close-circle" size={56} color={colors.danger} />
          <Text style={styles.resultTitle} allowFontScaling>
            {result.title}
          </Text>
          <Text style={styles.resultBody} allowFontScaling>
            {result.message}
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              setResult(null);
              handledRef.current = false;
              setHandled(false);
              setPhase('intro');
            }}
          >
            <Text style={styles.primaryBtnText}>Entendido</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (result && result.ok) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.resultBox}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={72} color={colors.secondary} />
          </Animated.View>
          <Text style={styles.resultTitle} allowFontScaling>
            {result.title}
          </Text>
          <Text style={styles.resultBody} allowFontScaling>
            {result.message}
          </Text>
          {result.subtitle ? (
            <Text style={styles.resultSub} allowFontScaling>
              {result.subtitle}
            </Text>
          ) : null}
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.introContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="qr-code-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.introTitle} allowFontScaling>
          Vincular paciente
        </Text>
        <Text style={styles.introBody} allowFontScaling>
          Pide al paciente que abra su perfil y muestre su código QR. Luego pulsa el botón y apunta la
          cámara al código.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={startScan}
        >
          <Ionicons name="camera-outline" size={22} color={colors.onPrimary} style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>Escanear QR</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    introContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    introTitle: {
      fontSize: typography.title.fontSize,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    introBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.body.fontSize * 1.5,
      marginBottom: spacing.xl,
    },
    introHint: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: spacing.radiusButton,
      minWidth: '88%',
    },
    btnIcon: {
      marginRight: spacing.sm,
    },
    primaryBtnText: {
      fontSize: typography.body.fontSize,
      fontWeight: '700',
      color: colors.onPrimary,
    },
    secondaryBtn: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    secondaryBtnText: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    cameraRoot: {
      flex: 1,
      backgroundColor: '#000',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: spacing.xl,
    },
    scanFrame: {
      marginTop: 120,
      width: 260,
      height: 260,
      borderRadius: spacing.radiusLg,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.85)',
      backgroundColor: 'transparent',
    },
    scanHint: {
      color: '#fff',
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    cancelScanBtn: {
      padding: spacing.lg,
    },
    cancelScanText: {
      color: '#fff',
      fontSize: typography.body.fontSize,
      fontWeight: '600',
    },
    resultBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    resultTitle: {
      fontSize: typography.title.fontSize,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    resultBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    resultSub: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    errorTitle: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    errorBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
