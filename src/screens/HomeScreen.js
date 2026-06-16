import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Pressable, Linking, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  MedicalAlertBanner,
  TabScreenLayout,
  Icon,
  MetricTile,
  SOSProgressButton,
  LiveHeartRateCard,
  GlassmorphicCard,
  PressableScale,
} from '../components';
import { spacing, typography, layout, useTheme, scale } from '../theme';
import { useMetricsGridLayout } from '../hooks/useMetricsGridLayout';
import {
  evaluateMonitoringAlert,
  isAlertStatus,
  SIM_HEART_RATE_BPM,
  SIM_BP_SYSTOLIC,
  SIM_BP_DIASTOLIC,
  SIM_SPO2,
  SIM_TEMP_C,
} from '../utils/vitalsMonitoring';
import { processVitalsAlert } from '../services/vitalsMonitorService';
import { getLatestMedicalRecord } from '../services/medicalRecordsService';

const DEMO_LAST_CLINICAL_EVENT = {
  date: '5 abr 2026',
  description:
    'Consulta de seguimiento — presión arterial 118/76 mmHg, sin alteraciones.',
};

function alertLevelForMetric(reasons, prefix) {
  if (!reasons?.length) return undefined;
  const related = reasons.filter((r) => r.code.startsWith(prefix));
  if (related.some((r) => r.severity === 'critical')) return 'critical';
  if (related.some((r) => r.severity === 'warning')) return 'warning';
  return undefined;
}

function statusDisplayWord(level) {
  if (level === 'stable') return 'Estable';
  if (level === 'warning') return 'Atención';
  return 'Crítico';
}

function statusSubtitle(level) {
  if (level === 'stable') return 'Signos vitales normales y monitoreados';
  if (level === 'warning') return 'Valores ligeramente fuera de rango';
  return 'Valores fuera del rango de seguridad';
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [roleKey, setRoleKey] = useState(ROLES.PATIENT);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('paciente@medicalcorp.com');
  const [userId, setUserId] = useState(null);
  const [vitalsAlertsEnabled, setVitalsAlertsEnabled] = useState(true);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [emergencyContact, setEmergencyContact] = useState(null);

  const [callDuration, setCallDuration] = useState(0);

  // Temporizador de duración de llamada de primeros auxilios
  useEffect(() => {
    let timer = null;
    if (sosModalVisible) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sosModalVisible]);

  const formatCallDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDial911 = () => {
    triggerHaptic('notification');
    Linking.openURL('tel:911').catch(() => {
      Alert.alert(
        'Simulador de Emergencia',
        'Llamada simulada al 911 iniciada con éxito. En un dispositivo físico, esto abriría el marcador telefónico.'
      );
    });
  };

  const [vitals, setVitals] = useState({
    heartRate: SIM_HEART_RATE_BPM,
    temperature: SIM_TEMP_C,
    systolic: SIM_BP_SYSTOLIC,
    diastolic: SIM_BP_DIASTOLIC,
    oxygen: SIM_SPO2,
  });

  const triggerHaptic = (type) => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        if (type === 'notification') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (_) {}
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [roleRaw, userRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.ROLE),
            AsyncStorage.getItem(STORAGE_KEYS.USER),
          ]);
          if (!cancelled && roleRaw) setRoleKey(roleRaw.toLowerCase());
          if (!cancelled && userRaw) {
            try {
              const u = JSON.parse(userRaw);
              if (u?.name) setUserName(String(u.name));
              if (u?.email) setUserEmail(String(u.email));
              if (u?.id) setUserId(String(u.id));
              setVitalsAlertsEnabled(u?.notificationPrefs?.vitalsAlerts !== false);
              setMedicalHistory(u?.medicalHistory || null);
              setEmergencyContact(u?.emergencyContact || null);

              // Cargar última medición guardada (si existe)
              if (u?.id) {
                const latest = await getLatestMedicalRecord(String(u.id));
                if (!cancelled && latest?.bloodPressure) {
                  setVitals({
                    heartRate: latest.heartRate,
                    temperature: latest.temperature,
                    systolic: latest.bloodPressure.systolic,
                    diastolic: latest.bloodPressure.diastolic,
                    oxygen: latest.oxygen,
                  });
                }
              }
            } catch (_) {
              /* ignorar */
            }
          }
        } catch (_) {
          /* defaults */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const displayName = userName.trim() || 'Eduar';
  const status = evaluateMonitoringAlert(
    vitals.heartRate,
    vitals.systolic,
    vitals.diastolic,
    vitals.oxygen
  );
  const alertActive = isAlertStatus(status.level);
  const statusColor = alertActive ? colors.danger : colors.secondary;
  const statusWord = statusDisplayWord(status.level);

  const insightText =
    status.level === 'stable'
      ? 'Tu estado se mantiene estable. Mantén hidratación y controles programados.'
      : status.subtitle;

  const historyTarget = roleKey === ROLES.DOCTOR ? 'Patients' : 'History';

  const bpLabel = `${vitals.systolic}/${vitals.diastolic}`;

  const statusIconName = alertActive ? 'medical' : 'heart';
  const { gridStyle, tileWidth } = useMetricsGridLayout();

  const reasons = status.reasons ?? [];

  const metricItems = useMemo(
    () => [
      {
        id: 'hr',
        icon: 'heart',
        value: `${vitals.heartRate} bpm`,
        label: 'Ritmo cardíaco',
        insight: 'En reposo suele estar entre 60 y 100 bpm.',
        alertLevel: alertLevelForMetric(reasons, 'HR_'),
      },
      {
        id: 'temp',
        icon: 'temperature',
        value: `${vitals.temperature.toFixed(1)} °C`,
        label: 'Temperatura',
        insight: 'Rango habitual adulto: ~36,1–37,2 °C.',
        alertLevel: undefined,
      },
      {
        id: 'bp',
        icon: 'blood',
        value: bpLabel,
        label: 'Presión arterial',
        insight: 'Ideal medir en reposo, mismo brazo.',
        alertLevel: alertLevelForMetric(reasons, 'BP_'),
      },
      {
        id: 'spo2',
        icon: 'lungs',
        value: `${vitals.oxygen}%`,
        label: 'Oxígeno (SpO₂)',
        insight: 'Por encima de 95% suele considerarse adecuado.',
        alertLevel: alertLevelForMetric(reasons, 'SPO2_'),
      },
    ],
    [vitals, bpLabel, reasons]
  );

  useFocusEffect(
    useCallback(() => {
      if (!alertActive || !vitalsAlertsEnabled) return;
      processVitalsAlert({
        heartRate: vitals.heartRate,
        systolic: vitals.systolic,
        diastolic: vitals.diastolic,
        spo2: vitals.oxygen,
        patientId: userId,
        patientName: userName || null,
        notifyLocal: true,
      }).catch(() => {});
    }, [
      alertActive,
      vitalsAlertsEnabled,
      userId,
      userName,
      vitals,
    ])
  );

  // Animación infinita de pulso para el estatus de alerta principal
  const statusPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let animLoop = null;
    if (alertActive) {
      statusPulseAnim.setValue(1);
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(statusPulseAnim, {
            toValue: 1.12,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(statusPulseAnim, {
            toValue: 1.0,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      statusPulseAnim.setValue(1);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [alertActive]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TabScreenLayout scrollProps={{ showsVerticalScrollIndicator: false }}>
          {/* 1) Header superior premium - Avatar alineado a la izquierda */}
          <View style={styles.topHeader}>
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileIconContainer}
            >
              <View style={styles.profileIcon}>
                <Icon name="user" size={26} color={colors.primary} />
              </View>
              {/* Micro-badge de telemetría activa en verde */}
              <View style={[styles.onlineIndicator, { backgroundColor: colors.secondary }]} />
            </TouchableOpacity>

            <View style={styles.topHeaderText}>
              <Text style={styles.hello} allowFontScaling>
                {displayName}
              </Text>
              <Text style={styles.subHello} allowFontScaling numberOfLines={1}>
                {userEmail}
              </Text>
            </View>
          </View>

          {alertActive ? (
            <MedicalAlertBanner
              title="Alerta activa"
              subtitle={status.subtitle}
              onPress={() => navigation.navigate('Alerts')}
            />
          ) : null}

          {/* 2) Estado general — Glassmorphic con triage neón superior + pulso elástico */}
          <PressableScale
            onPress={() => {
              triggerHaptic('impact');
              navigation.navigate('Alerts');
            }}
            containerStyle={{ marginBottom: spacing.lg }}
          >
            <GlassmorphicCard style={styles.statusCard} alertType={status.level === 'stable' ? 'success' : status.level}>
              <View style={styles.statusCardHeaderRow}>
                <Text style={styles.statusCardLabel} allowFontScaling>
                  ESTADO DEL PACIENTE
                </Text>
                <View style={[styles.pulseDot, { backgroundColor: statusColor }]} />
              </View>
              <View style={styles.statusCardContent}>
                <Animated.View style={[styles.statusIconWrap, {
                  backgroundColor: alertActive ? `${colors.danger}14` : `${colors.secondary}14`,
                  borderColor: alertActive ? `${colors.danger}33` : `${colors.secondary}33`,
                  transform: [{ scale: statusPulseAnim }],
                }]} pointerEvents="none">
                  <Icon name={statusIconName} size={28} color={statusColor} />
                </Animated.View>
                <View style={styles.statusTextBlock}>
                  <Text style={[styles.statusBig, { color: statusColor }]} allowFontScaling>
                    {statusWord}
                  </Text>
                  <Text style={styles.statusSmall} allowFontScaling>
                    {statusSubtitle(status.level)}
                  </Text>
                </View>
              </View>
            </GlassmorphicCard>
          </PressableScale>

          {/* 3) Chips Carrusel de Acción Rápida (Slicing de Interfaz) */}
          <Text style={styles.sectionTitleOnly} allowFontScaling>
            Acciones Rápidas
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
            style={styles.chipsScrollWrapper}
          >
            <PressableScale
              onPress={() => {
                triggerHaptic('impact');
                navigation.navigate(historyTarget);
              }}
              style={[styles.chipBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityLabel="Ver historial"
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: colors.textPrimary }]}>Historial Clínico</Text>
            </PressableScale>

            <PressableScale
              onPress={() => {
                triggerHaptic('impact');
                navigation.navigate('MedicalAI');
              }}
              style={[styles.chipBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityLabel="IA médica"
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: colors.textPrimary }]}>IA Médica</Text>
            </PressableScale>

            <PressableScale
              onPress={() => {
                triggerHaptic('impact');
                Alert.alert(
                  'Recordatorios',
                  'Frecuencias de hidratación y tomas de medicación sincronizadas de forma inteligente con tu agenda.'
                );
              }}
              style={[styles.chipBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityLabel="Recordatorios"
            >
              <Ionicons name="alarm-outline" size={18} color={colors.primary} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: colors.textPrimary }]}>Recordatorios</Text>
            </PressableScale>

            {roleKey === ROLES.PATIENT ? (
              <PressableScale
                onPress={() => {
                  triggerHaptic('impact');
                  setSosModalVisible(true);
                }}
                style={[styles.chipBtn, { backgroundColor: colors.surface, borderColor: `${colors.danger}26` }]}
                accessibilityLabel="Ficha SOS"
              >
                <Ionicons name="medical-outline" size={18} color={colors.danger} style={styles.chipIcon} />
                <Text style={[styles.chipText, { color: colors.danger, fontWeight: '700' }]}>Ficha SOS</Text>
              </PressableScale>
            ) : null}
          </ScrollView>

          {/* 4) Métricas Vitales */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} allowFontScaling>
              Signos Vitales
            </Text>
            <Text style={styles.sectionHint} allowFontScaling>
              Monitoreo activo
            </Text>
          </View>

          {/* Tarjeta de monitoreo cardiovascular interactivo en vivo */}
          <LiveHeartRateCard
            heartRate={vitals.heartRate}
            statusLevel={status.level}
            onPress={() => navigation.navigate(historyTarget)}
          />

          <View style={[styles.metricsGrid, gridStyle]}>
            {metricItems
              .filter((item) => item.id !== 'hr')
              .map((item) => (
                <MetricTile
                  key={item.id}
                  icon={item.icon}
                  value={item.value}
                  label={item.label}
                  insight={item.insight}
                  width={tileWidth}
                  alertLevel={item.alertLevel}
                  onPress={() => navigation.navigate(historyTarget)}
                />
              ))}
          </View>

          {/* 5) Tarjeta SOS Widget */}
          {roleKey === ROLES.PATIENT ? (
            <GlassmorphicCard style={styles.sosCardWidget}>
              <View style={styles.sosCardHeader}>
                <View style={[styles.sosCardIconWrap, { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}26`, borderWidth: 1 }]}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.danger} />
                </View>
                <View style={styles.sosCardHeaderText}>
                  <Text style={[styles.sosCardTitle, { color: colors.textPrimary }]} allowFontScaling>
                    Widget Clínico SOS
                  </Text>
                  <Text style={[styles.sosCardSubtitle, { color: colors.textSecondary }]} allowFontScaling>
                    Presiona el botón flotante en pantalla para alertar o accede a tu información crítica a continuación.
                  </Text>
                </View>
              </View>
              
              <View style={styles.sosCardInteractionRow}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('impact');
                    setSosModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.sosCardBtn,
                    { backgroundColor: colors.danger },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                  ]}
                  accessibilityLabel="Abrir ficha médica de primeros auxilios"
                >
                  <Ionicons name="medical" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sosCardBtnText} allowFontScaling>VER FICHA DE AUXILIOS</Text>
                </Pressable>
              </View>
            </GlassmorphicCard>
          ) : null}

          {/* 6) Insight */}
          <GlassmorphicCard style={styles.insightCard}>
            <View style={styles.insightHeaderRow}>
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.insightLabel} allowFontScaling>
                Recomendación de Salud
              </Text>
            </View>
            <Text style={styles.insightBody} allowFontScaling>
              {insightText}
            </Text>
          </GlassmorphicCard>
 
          {/* 7) Último registro */}
          <GlassmorphicCard style={styles.lastCard}>
            <View style={styles.lastHeaderRow}>
              <View style={styles.lastHeaderTitle}>
                <Ionicons name="document-text-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.lastLabel} allowFontScaling>
                  Último informe clínico
                </Text>
              </View>
              <Text style={styles.lastDate} allowFontScaling>
                {DEMO_LAST_CLINICAL_EVENT.date}
              </Text>
            </View>
            <Text style={styles.lastDescription} allowFontScaling>
              {DEMO_LAST_CLINICAL_EVENT.description}
            </Text>
          </GlassmorphicCard>
 
          <Text style={styles.footerHint} allowFontScaling>
            MEDICAL corp · Información orientativa, no sustituye la consulta médica.
          </Text>
      </TabScreenLayout>
 
      {/* Botón SOS Flotante de Presión Progresiva con Progreso Circular */}
      {roleKey === ROLES.PATIENT ? (
        <SOSProgressButton onTrigger={() => setSosModalVisible(true)} />
      ) : null}
 
      {/* SOS Ficha de Primeros Auxilios Modal */}
      <Modal
        visible={sosModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1 }]}>
            {/* Tirador superior estético para emular bottom-sheet */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Ionicons name="medical" size={28} color={colors.danger} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>FICHA DE AUXILIOS</Text>
              <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSosModalVisible(false)}>
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
 
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Bloque de Simulación de llamada en curso */}
              <View style={[styles.callingSimulatorBox, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}26` }]}>
                <Ionicons name="call" size={22} color={colors.danger} style={styles.callingIcon} />
                <View style={styles.callingTextView}>
                  <Text style={[styles.callingTitleText, { color: colors.danger }]} allowFontScaling>ALERTA SIMULADA 911 ACTIVA</Text>
                  <Text style={[styles.callingTimerText, { color: colors.textPrimary }]} allowFontScaling>Duración del evento: {formatCallDuration(callDuration)}</Text>
                </View>
              </View>
 
              <View style={styles.sosAlertBox}>
                <Ionicons name="alert-circle" size={22} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosAlertText} allowFontScaling>
                    Conexión simulada activa con telemetría clínica en vivo.
                  </Text>
                  <Text style={[styles.sosAlertSubText, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]} allowFontScaling>
                    Compartiendo · FC: {vitals.heartRate} bpm · SpO₂: {vitals.oxygen}%
                  </Text>
                </View>
              </View>
 
              <Text style={styles.modalSectionTitle}>Parámetros Clínicos</Text>
              <GlassmorphicCard style={styles.modalInfoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Paciente:</Text>
                  <Text style={[styles.infoValue, { fontWeight: '700' }]}>{displayName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Grupo Sanguíneo:</Text>
                  <Text style={[styles.infoValue, { color: colors.danger, fontWeight: '800', fontSize: scale(14) }]}>
                    {medicalHistory?.bloodType || 'No registrado'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alergias:</Text>
                  <Text style={styles.infoValue}>{medicalHistory?.allergies || 'Ninguna conocida'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patologías:</Text>
                  <Text style={styles.infoValue}>{medicalHistory?.chronicDiseases || 'Ninguna conocida'}</Text>
                </View>
                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>Medicación:</Text>
                  <Text style={styles.infoValue}>{medicalHistory?.medications || 'Ninguna registrada'}</Text>
                </View>
              </GlassmorphicCard>
 
              {emergencyContact ? (
                <>
                  <Text style={styles.modalSectionTitle}>Contacto de Emergencia</Text>
                  <GlassmorphicCard style={styles.modalInfoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Contacto:</Text>
                      <Text style={styles.infoValue}>{emergencyContact.name}</Text>
                    </View>
                    <View style={styles.infoRowLast}>
                      <Text style={styles.infoLabel}>Teléfono:</Text>
                      <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
                        {emergencyContact.phone}
                      </Text>
                    </View>
                  </GlassmorphicCard>
                </>
              ) : null}
            </ScrollView>
 
            <View style={styles.modalFooterActions}>
              <SecondaryButton
                title="Llamar al 911 (Urgencias)"
                icon="call-outline"
                onPress={handleDial911}
                style={[styles.modalDialBtn, { borderColor: colors.danger, marginBottom: spacing.sm }]}
                textStyle={{ color: colors.danger, fontWeight: '700' }}
              />
  
              <PrimaryButton
                title="Cerrar Ficha SOS"
                onPress={() => setSosModalVisible(false)}
                style={styles.modalCloseBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    topHeaderText: {
      flex: 1,
      minWidth: 0,
      marginLeft: spacing.md,
      justifyContent: 'center',
    },
    hello: {
      fontSize: scale(18),
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    subHello: {
      fontSize: scale(14.5),
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 2,
    },
    profileIconContainer: {
      position: 'relative',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    profileIcon: {
      width: spacing.xl + spacing.md,
      height: spacing.xl + spacing.md,
      borderRadius: (spacing.xl + spacing.md) / 2,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 11,
      height: 11,
      borderRadius: 5.5,
      borderWidth: 2,
      borderColor: colors.background,
    },

    statusCard: {
      marginBottom: 0, // Controlado por el PressableScale containerStyle
    },
    statusCardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusCardLabel: {
      ...typography.label,
      color: colors.textSecondary,
      letterSpacing: 0.6,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    statusTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    statusBig: {
      fontSize: scale(typography.title.fontSize),
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    statusSmall: {
      marginTop: spacing.xs - 2,
      fontSize: scale(typography.body.fontSize - 1),
      fontWeight: '400',
      color: colors.textSecondary,
      lineHeight: scale(19),
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: scale(typography.subtitle.fontSize),
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionHint: {
      fontSize: scale(typography.caption.fontSize),
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sectionTitleOnly: {
      fontSize: scale(typography.subtitle.fontSize),
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: spacing.sm,
    },

    metricsGrid: {
      marginBottom: spacing.lg,
    },

    // Horizontal Chips Styles
    chipsScrollWrapper: {
      marginBottom: spacing.lg,
      minHeight: 52,
    },
    chipsScroll: {
      paddingRight: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm - 2,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      borderWidth: 1.5,
      minHeight: 40,
    },
    chipIcon: {
      marginRight: 6,
    },
    chipText: {
      fontSize: scale(13),
      fontWeight: '600',
    },

    insightCard: {
      marginBottom: spacing.lg,
    },
    insightHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    insightLabel: {
      fontSize: scale(typography.caption.fontSize),
      fontWeight: '800',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    insightBody: {
      fontSize: scale(typography.body.fontSize - 0.5),
      fontWeight: '400',
      color: colors.textPrimary,
      lineHeight: scale(20),
    },

    lastCard: {
      marginBottom: spacing.xl,
    },
    lastHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    lastHeaderTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastLabel: {
      fontSize: scale(typography.caption.fontSize),
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    lastDate: {
      fontSize: scale(typography.caption.fontSize),
      fontWeight: '700',
      color: colors.primary,
    },
    lastDescription: {
      fontSize: scale(typography.body.fontSize - 0.5),
      fontWeight: '400',
      color: colors.textPrimary,
      lineHeight: scale(20),
    },

    footerHint: {
      fontSize: typography.caption.fontSize,
      fontWeight: '500',
      color: colors.textPlaceholder,
      marginTop: spacing.xs,
      marginBottom: spacing.xl * 1.5,
      textAlign: 'center',
      lineHeight: typography.caption.fontSize * 1.45,
    },

    // Modal bottom sheet styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: spacing.lg,
      maxHeight: '90%',
    },
    modalHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      paddingBottom: spacing.sm,
    },
    modalTitle: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      flex: 1,
      marginLeft: spacing.sm,
      letterSpacing: 0.5,
    },
    modalCloseIcon: {
      padding: 4,
    },
    modalScroll: {
      paddingBottom: spacing.lg,
    },
    callingSimulatorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: spacing.radiusCard,
      borderWidth: 1,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    callingIcon: {
      marginRight: spacing.xs,
    },
    callingTextView: {
      flex: 1,
    },
    callingTitleText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    callingTimerText: {
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },
    sosAlertBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      padding: spacing.md,
      borderRadius: spacing.radiusCard,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.16)',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sosAlertText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.danger,
      lineHeight: 18,
    },
    modalSectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    modalInfoCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm - 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    infoRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm - 2,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'right',
      maxWidth: '65%',
    },
    modalFooterActions: {
      marginTop: spacing.xs,
    },
    modalDialBtn: {
      width: '100%',
    },
    modalCloseBtn: {
      width: '100%',
    },

    // SOS Card Widget Styles
    sosCardWidget: {
      marginBottom: spacing.lg,
    },
    sosCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sosCardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    sosCardHeaderText: {
      flex: 1,
    },
    sosCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.1,
    },
    sosCardSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
      lineHeight: 16,
    },
    sosCardInteractionRow: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    sosCardBtn: {
      height: 44,
      borderRadius: 22,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    sosCardBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.5,
    },
  });
}
