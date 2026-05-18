import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  MetricTile,
  MedicalAlertBanner,
  TabScreenLayout,
} from '../components';
import { spacing, typography, useTheme, createSectionHeadingStyle, createCardTitleStyle } from '../theme';
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
import { getLatestMedicalRecord } from '../services/medicalRecordsService';

const RECENT_RECORDS = [
  {
    id: '1',
    time: 'Hoy 08:42',
    detail: 'Medición automática — FC estable, sin eventos.',
    source: 'auto',
  },
  {
    id: '2',
    time: 'Ayer 21:15',
    detail: 'Recordatorio: hidratación adecuada.',
    source: 'manual',
  },
  {
    id: '3',
    time: 'Hace 2 días',
    detail: 'Sincronización de dispositivo completada.',
    source: 'auto',
  },
];

const METRICS_ANIM_MS = 520;

function alertLevelForMetric(reasons, prefix) {
  if (!reasons?.length) return undefined;
  const related = reasons.filter((r) => r.code.startsWith(prefix));
  if (related.some((r) => r.severity === 'critical')) return 'critical';
  if (related.some((r) => r.severity === 'warning')) return 'warning';
  return undefined;
}

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { gridStyle, tileWidth } = useMetricsGridLayout();
  const [patientName, setPatientName] = useState('Paciente');
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
            const latest = await getLatestMedicalRecord(String(u.id));
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
  const statusWord = isAlert ? 'Alerta' : 'Normal';
  const statusColor = isAlert ? colors.danger : colors.secondary;

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

  return (
    <TabScreenLayout scrollProps={{ showsVerticalScrollIndicator: false }}>
      {isAlert ? (
        <MedicalAlertBanner
          title="Alerta médica"
          subtitle={status.subtitle}
          onPress={() => navigation.navigate('Alerts')}
        />
      ) : null}

      <Card style={styles.heroCard}>
        <Text style={styles.greeting} allowFontScaling accessibilityRole="header">
          Hola, {patientName}
        </Text>
        <View style={styles.statusPillRow}>
          <Text style={styles.statusIntro} allowFontScaling>
            Estado:{' '}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isAlert ? colors.danger + '18' : colors.secondaryMuted },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusColor }]} allowFontScaling>
              {statusWord}
            </Text>
          </View>
        </View>
        {isAlert ? (
          <Text style={styles.alertShout} allowFontScaling accessibilityRole="alert">
            ¡Alerta!
          </Text>
        ) : null}
        <Text style={styles.hint} allowFontScaling>
          {status.subtitle}
        </Text>
      </Card>

      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle} allowFontScaling>
          Acciones rápidas
        </Text>
        <PrimaryButton
          title="Ver historial completo"
          icon="calendar-outline"
          onPress={() => navigation.navigate('History')}
          style={styles.actionBtnLarge}
          accessibilityLabel="Ver historial médico completo"
        />
        <SecondaryButton
          title="IA médica"
          icon="sparkles-outline"
          onPress={() => navigation.navigate('MedicalAI')}
          style={styles.actionBtnLast}
          accessibilityLabel="Abrir asistente de IA médica"
        />
      </Card>

      <Text style={styles.sectionHeading} allowFontScaling>
        Métricas vitales
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
        {metricItems.map((item) => (
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

      <Card style={styles.recordsCard}>
        <Text style={styles.cardTitle} allowFontScaling>
          Últimos registros
        </Text>
        {RECENT_RECORDS.map((row, index) => {
          const isAuto = row.source === 'auto';
          const iconName = isAuto ? 'pulse-outline' : 'create-outline';
          return (
            <View
              key={row.id}
              style={[
                styles.recordBlock,
                index === RECENT_RECORDS.length - 1 && styles.recordBlockLast,
              ]}
            >
              <View style={styles.recordHeaderRow}>
                <View style={styles.recordIconWrap}>
                  <Ionicons name={iconName} size={16} color={colors.primary} />
                </View>
                <View style={styles.recordHeaderText}>
                  <Text style={styles.recordTime} allowFontScaling>
                    {row.time}
                  </Text>
                  <Text style={styles.recordSource} allowFontScaling>
                    {isAuto ? 'Automático' : 'Manual'}
                  </Text>
                </View>
              </View>
              <Text style={styles.recordDetail} allowFontScaling>
                {row.detail}
              </Text>
            </View>
          );
        })}
      </Card>
    </TabScreenLayout>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    heroCard: {
      marginBottom: spacing.lg,
    },
    sectionHeading: createSectionHeadingStyle(colors),
    greeting: {
      ...typography.title,
      color: colors.textPrimary,
      textAlign: 'left',
      width: '100%',
      letterSpacing: -0.3,
      marginBottom: spacing.md,
    },
    statusPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    statusIntro: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      color: colors.textPrimary,
      marginRight: spacing.sm,
    },
    statusBadge: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.radiusButton,
    },
    statusBadgeText: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '700',
    },
    alertShout: {
      marginTop: spacing.md,
      fontSize: typography.subtitle.fontSize + 2,
      fontWeight: '800',
      color: colors.danger,
      letterSpacing: 0.2,
    },
    hint: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: typography.caption.fontSize * 1.5,
    },
    actionsCard: {
      marginBottom: spacing.xl,
    },
    metricsGrid: {
      marginBottom: spacing.xl,
    },
    recordsCard: {
      marginBottom: spacing.lg,
    },
    cardTitle: {
      ...createCardTitleStyle(colors),
      marginBottom: spacing.lg,
    },
    actionBtnLarge: {
      width: '100%',
      minHeight: spacing.xl + spacing.md,
      marginBottom: spacing.md,
    },
    actionBtnLast: {
      width: '100%',
      minHeight: spacing.xl + spacing.md,
      marginBottom: 0,
    },
    recordBlock: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    recordBlockLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    recordHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    recordIconWrap: {
      width: 32,
      height: 32,
      borderRadius: spacing.radiusButton,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    recordHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    recordTime: {
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    recordSource: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    recordDetail: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      color: colors.textPrimary,
      lineHeight: typography.body.fontSize * 1.45,
      paddingLeft: 32 + spacing.sm,
    },
  });
}
