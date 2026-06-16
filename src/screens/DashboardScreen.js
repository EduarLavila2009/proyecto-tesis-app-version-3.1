import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { STORAGE_KEYS } from '../constants/storage';
import {
  MetricTile,
  MedicalAlertBanner,
  TabScreenLayout,
  GlassmorphicCard,
  LiveHeartRateCard,
  PressableScale,
} from '../components';
import { spacing, typography, useTheme, createSectionHeadingStyle, createCardTitleStyle, scale, layout } from '../theme';
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
import { recordMedicalAlert } from '../services/alertsService';
import { getLatestMedicalRecord, getMedicalRecordsByUser } from '../services/medicalRecordsService';

function formatRecordTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (diffDays === 0) {
    return `Hoy ${timeStr}`;
  } else if (diffDays === 1) {
    return `Ayer ${timeStr}`;
  } else {
    return `Hace ${diffDays} d`;
  }
}

const METRICS_ANIM_MS = 520;

function alertLevelForMetric(reasons, prefix) {
  if (!reasons?.length) return undefined;
  const related = reasons.filter((r) => r.code.startsWith(prefix));
  if (related.some((r) => r.severity === 'critical')) return 'critical';
  if (related.some((r) => r.severity === 'warning')) return 'warning';
  return undefined;
}

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { gridStyle, tileWidth } = useMetricsGridLayout();
  const [patientName, setPatientName] = useState('Paciente');
  const [recentRecords, setRecentRecords] = useState([]);
  const [vitals, setVitals] = useState({
    heartRate: SIM_HEART_RATE_BPM,
    temperature: SIM_TEMP_C,
    systolic: SIM_BP_SYSTOLIC,
    diastolic: SIM_BP_DIASTOLIC,
    oxygen: SIM_SPO2,
  });
  const metricsOpacity = useRef(new Animated.Value(0)).current;
  const metricsTranslate = useRef(new Animated.Value(10)).current;

  const runMetricsEntrance = useCallback(() => {
    metricsOpacity.setValue(0);
    metricsTranslate.setValue(10);
    Animated.parallel([
      Animated.timing(metricsOpacity, {
        toValue: 1,
        duration: METRICS_ANIM_MS,
        useNativeDriver: true,
      }),
      Animated.timing(metricsTranslate, {
        toValue: 0,
        duration: METRICS_ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [metricsOpacity, metricsTranslate]);

  useFocusEffect(
    useCallback(() => {
      runMetricsEntrance();
    }, [runMetricsEntrance])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (cancelled || !raw) return;
          const u = JSON.parse(raw);
          if (u?.name) setPatientName(u.name);
          if (u?.id) {
            const list = await getMedicalRecordsByUser(String(u.id));
            if (!cancelled) {
              const mapped = list.slice(0, 3).map((r) => ({
                id: r.id,
                time: formatRecordTime(r.date),
                detail: `Ritmo cardíaco: ${r.heartRate} bpm · SpO₂: ${r.oxygen}% · PA: ${r.bloodPressure.systolic}/${r.bloodPressure.diastolic} · Temp: ${r.temperature}°C`,
                source: r.source || 'manual',
              }));
              setRecentRecords(mapped);

              const latest = list[0];
              if (latest?.bloodPressure) {
                setVitals({
                  heartRate: latest.heartRate,
                  temperature: latest.temperature,
                  systolic: latest.bloodPressure.systolic,
                  diastolic: latest.bloodPressure.diastolic,
                  oxygen: latest.oxygen,
                });
              }
            }
          }
        } catch (_) {
          /* mantener nombre por defecto */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const status = evaluateMonitoringAlert(
    vitals.heartRate,
    vitals.systolic,
    vitals.diastolic,
    vitals.oxygen
  );
  const isAlert = isAlertStatus(status.level);
  const statusWord = isAlert ? 'Alerta' : 'Estable';
  const statusColor = isAlert ? colors.danger : colors.success;

  const bpLabel = `${vitals.systolic}/${vitals.diastolic}`;
  const reasons = status.reasons ?? [];

  const metricItems = useMemo(
    () => [
      {
        id: 'hr',
        icon: 'heart',
        value: `${vitals.heartRate} bpm`,
        label: 'Ritmo cardíaco',
        alertLevel: alertLevelForMetric(reasons, 'HR_'),
      },
      {
        id: 'temp',
        icon: 'temperature',
        value: `${vitals.temperature.toFixed(1)} °C`,
        label: 'Temperatura',
      },
      {
        id: 'bp',
        icon: 'blood',
        value: bpLabel,
        label: 'Presión (mmHg)',
        alertLevel: alertLevelForMetric(reasons, 'BP_'),
      },
      {
        id: 'spo2',
        icon: 'lungs',
        value: `${vitals.oxygen}%`,
        label: 'Oxígeno (SpO₂)',
        alertLevel: alertLevelForMetric(reasons, 'SPO2_'),
      },
    ],
    [vitals, bpLabel, reasons]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAlert) return;
      recordMedicalAlert({
        level: status.level,
        title: status.title,
        subtitle: status.subtitle,
        reasons: status.reasons,
        vitals: {
          heartRate: vitals.heartRate,
          systolic: vitals.systolic,
          diastolic: vitals.diastolic,
          spo2: vitals.oxygen,
        },
      }).catch(() => {});
    }, [isAlert, status.level, status.title, status.subtitle, status.reasons, vitals])
  );

  const handleAlertPress = () => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
    navigation.navigate('Alerts');
  };

  const alertGlowType = status.level === 'stable' ? 'success' : status.level;

  return (
    <TabScreenLayout scrollProps={{ showsVerticalScrollIndicator: false }}>
      {isAlert ? (
        <MedicalAlertBanner
          title="Alerta médica"
          subtitle={status.subtitle}
          onPress={handleAlertPress}
        />
      ) : null}

      {/* Hero Header Card */}
      <GlassmorphicCard
        style={styles.heroCard}
        alertType={alertGlowType}
      >
        <View style={styles.heroHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.greeting} allowFontScaling accessibilityRole="header">
              Hola, {patientName} 👋
            </Text>
            <Text style={styles.heroSubtitle}>Bienvenido a tu panel de salud en tiempo real</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Panel de Alertas Inteligente / Triage Widget */}
        <PressableScale onPress={handleAlertPress} style={styles.triagePressable}>
          <View style={styles.statusPillRow}>
            <Ionicons
              name={isAlert ? 'warning-outline' : 'shield-checkmark-outline'}
              size={18}
              color={statusColor}
              style={styles.statusIcon}
            />
            <Text style={styles.statusIntro} allowFontScaling>
              Monitoreo Fisiológico:
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isAlert ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusColor }]} allowFontScaling>
                {statusWord.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.hint} allowFontScaling>
            {status.subtitle}
          </Text>
        </PressableScale>
      </GlassmorphicCard>

      {/* Acciones Rápidas Unificadas */}
      <View style={styles.quickActionsRow}>
        <PressableScale
          onPress={() => navigation.navigate('History')}
          style={styles.quickActionBtn}
          accessibilityLabel="Ver historial médico completo"
        >
          <LinearGradient
            colors={['#0F766E', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Ver Historial</Text>
          </LinearGradient>
        </PressableScale>
        
        <View style={styles.quickActionGap} />
        
        <PressableScale
          onPress={() => navigation.navigate('MedicalAI')}
          style={styles.quickActionBtn}
          accessibilityLabel="Abrir asistente de IA médica"
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradientBlue}
          >
            <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
            <Text style={styles.quickActionText}>IA Médica</Text>
          </LinearGradient>
        </PressableScale>
      </View>

      {/* Monitoreo Cardiovascular */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Monitoreo Cardiovascular
      </Text>
      <LiveHeartRateCard
        heartRate={vitals.heartRate}
        statusLevel={status.level}
        onPress={() => navigation.navigate('History')}
      />

      {/* Otras Métricas Vitales */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Otras Métricas Vitales
      </Text>
      <Animated.View
        style={[
          styles.metricsGrid,
          gridStyle,
          {
            opacity: metricsOpacity,
            transform: [{ translateY: metricsTranslate }],
          },
        ]}
        accessibilityLabel="Métricas vitales"
      >
        {metricItems
          .filter((item) => item.id !== 'hr')
          .map((item) => (
            <MetricTile
              key={item.id}
              icon={item.icon}
              value={item.value}
              label={item.label}
              width={tileWidth}
              alertLevel={item.alertLevel}
              onPress={() => navigation.navigate('History')}
            />
          ))}
      </Animated.View>

      {/* Historial Timeline de Últimos Registros */}
      <GlassmorphicCard style={styles.recordsCard}>
        <Text style={styles.cardTitle} allowFontScaling>
          Últimos registros
        </Text>
        <View style={styles.timelineWrapper}>
          {recentRecords.length > 0 ? (
            recentRecords.map((row, index) => {
              const isAuto = row.source === 'auto';
              const iconName = isAuto ? 'pulse-outline' : 'create-outline';
              return (
                <View key={row.id} style={styles.timelineItem}>
                  {/* Línea vertical conectora */}
                  {index < recentRecords.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                  
                  {/* Icono de registro */}
                  <View style={styles.timelineBulletWrap}>
                    <View style={styles.recordIconWrap}>
                      <Ionicons name={iconName} size={15} color={colors.primary} />
                    </View>
                  </View>
  
                  {/* Contenido de la fila */}
                  <View style={styles.timelineContent}>
                    <View style={styles.recordHeaderRow}>
                      <Text style={styles.recordTime} allowFontScaling>
                        {row.time}
                      </Text>
                      <View style={styles.sourceTag}>
                        <Text style={styles.sourceTagText}>
                          {isAuto ? 'AUTO' : 'MANUAL'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recordDetail} allowFontScaling>
                      {row.detail}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyRecordsText} allowFontScaling>
              No hay mediciones registradas. Agrega tu primer registro en la pestaña Historial.
            </Text>
          )}
        </View>
      </GlassmorphicCard>
    </TabScreenLayout>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    heroCard: {
      marginBottom: spacing.md,
      padding: spacing.lg,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(13, 148, 136, 0.15)',
    },
    heroTitleWrap: {
      flex: 1,
    },
    greeting: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 1,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginVertical: spacing.md,
    },
    triagePressable: {
      width: '100%',
    },
    statusPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statusIcon: {
      marginRight: 1,
    },
    statusIntro: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingVertical: 1,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    hint: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.sm,
      lineHeight: 17,
    },
    sectionHeading: createSectionHeadingStyle(colors),
    quickActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    quickActionBtn: {
      flex: 1,
      minWidth: 0,
      borderRadius: spacing.radiusButton,
      overflow: 'hidden',
    },
    quickActionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusButton,
    },
    quickActionGradientBlue: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusButton,
    },
    quickActionText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    quickActionGap: {
      width: spacing.sm,
    },
    metricsGrid: {
      marginBottom: spacing.xl,
    },
    recordsCard: {
      marginBottom: spacing.xl,
      padding: spacing.lg,
    },
    cardTitle: {
      ...createCardTitleStyle(colors),
      fontSize: 14,
      fontWeight: '800',
      marginBottom: spacing.lg,
    },
    timelineWrapper: {
      position: 'relative',
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      position: 'relative',
    },
    timelineLine: {
      position: 'absolute',
      left: 16,
      top: 32,
      bottom: -18,
      width: 1.5,
      backgroundColor: colors.borderSubtle,
    },
    timelineBulletWrap: {
      width: 32,
      alignItems: 'center',
    },
    recordIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(13, 148, 136, 0.15)',
    },
    timelineContent: {
      flex: 1,
      marginLeft: spacing.sm,
      justifyContent: 'center',
    },
    recordHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    recordTime: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    sourceTag: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
      paddingVertical: 1,
      paddingHorizontal: 5,
      borderRadius: 6,
    },
    sourceTagText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    recordDetail: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 16,
    },
    emptyRecordsText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
      fontStyle: 'italic',
    },
  });
}
