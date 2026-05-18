import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
} from '../components';
import { spacing, typography, layout, useTheme } from '../theme';
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

/** Misma entrada demo que la primera fila del historial clínico simulado (solo UI). */
const DEMO_LAST_CLINICAL_EVENT = {
  date: '5 abr 2026',
  description:
    'Consulta de seguimiento — presión arterial 118/76 mmHg, sin alteraciones.',
};

function statusDisplayWord(level) {
  if (level === 'stable') return 'Normal';
  if (level === 'warning') return 'Atención';
  return 'Crítico';
}

function statusSubtitle(level) {
  if (level === 'stable') return 'Sin alertas detectadas';
  if (level === 'warning') return 'Algunos valores elevados';
  return 'Valores fuera del rango recomendado';
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [roleKey, setRoleKey] = useState(ROLES.PATIENT);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [vitalsAlertsEnabled, setVitalsAlertsEnabled] = useState(true);
  const [vitals, setVitals] = useState({
    heartRate: SIM_HEART_RATE_BPM,
    temperature: SIM_TEMP_C,
    systolic: SIM_BP_SYSTOLIC,
    diastolic: SIM_BP_DIASTOLIC,
    oxygen: SIM_SPO2,
  });

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
              if (u?.id) setUserId(String(u.id));
              setVitalsAlertsEnabled(u?.notificationPrefs?.vitalsAlerts !== false);

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

  const statusBg = alertActive ? `${colors.danger}14` : colors.secondaryMuted;
  const statusIconName = alertActive ? 'medical' : 'heart';
  const { gridStyle, tileWidth } = useMetricsGridLayout();

  const metricItems = useMemo(
    () => [
      {
        id: 'hr',
        icon: 'heart',
        value: `${vitals.heartRate} bpm`,
        label: 'Ritmo cardíaco',
        insight: 'En reposo suele estar entre 60 y 100 bpm.',
      },
      {
        id: 'temp',
        icon: 'temperature',
        value: `${vitals.temperature.toFixed(1)} °C`,
        label: 'Temperatura',
        insight: 'Rango habitual adulto: ~36,1–37,2 °C.',
      },
      {
        id: 'bp',
        icon: 'blood',
        value: bpLabel,
        label: 'Presión arterial',
        insight: 'Ideal medir en reposo, mismo brazo.',
      },
      {
        id: 'spo2',
        icon: 'lungs',
        value: `${vitals.oxygen}%`,
        label: 'Oxígeno (SpO₂)',
        insight: 'Por encima de 95% suele considerarse adecuado.',
      },
    ],
    [vitals, bpLabel]
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

  return (
    <TabScreenLayout scrollProps={{ showsVerticalScrollIndicator: false }}>
        {/* 1) Header superior */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderText}>
            <Text style={styles.hello} allowFontScaling>
              Hola, {displayName} 👋
            </Text>
            <Text style={styles.subHello} allowFontScaling>
              Tu salud en tiempo real
            </Text>
          </View>
          <View style={styles.profileIcon} pointerEvents="none">
            <Icon name="user" size={28} color={colors.textSecondary} />
          </View>
        </View>

        {alertActive ? (
          <MedicalAlertBanner
            title="Alerta detectada"
            subtitle={status.subtitle}
            onPress={() => navigation.navigate('Alerts')}
          />
        ) : null}

        {/* Estado general — fondo secondaryMuted (estable) o danger suave (alerta) */}
        <Card style={[styles.statusCard, { backgroundColor: statusBg }]}>
          <Text style={styles.statusCardLabel} allowFontScaling>
            ESTADO GENERAL
          </Text>
          <View style={styles.statusCardContent}>
            <View style={styles.statusIconWrap} pointerEvents="none">
              <Icon name={statusIconName} size={28} color={statusColor} />
            </View>
            <View style={styles.statusTextBlock}>
              <Text style={[styles.statusBig, { color: statusColor }]} allowFontScaling>
                {statusWord}
              </Text>
              <Text style={styles.statusSmall} allowFontScaling>
                {statusSubtitle(status.level)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Métricas — grid responsive 2×2 / 1 columna */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} allowFontScaling>
            Métricas
          </Text>
          <Text style={styles.sectionHint} allowFontScaling>
            Actualizado recientemente
          </Text>
        </View>

        <View style={[styles.metricsGrid, gridStyle]}>
          {metricItems.map((item) => (
            <MetricTile
              key={item.id}
              icon={item.icon}
              value={item.value}
              label={item.label}
              insight={item.insight}
              width={tileWidth}
              onPress={() => navigation.navigate(historyTarget)}
            />
          ))}
        </View>

        {/* 4) Acciones: botones modernos */}
        <Text style={styles.sectionTitleOnly} allowFontScaling>
          Acciones
        </Text>

        <View style={styles.actionsRow}>
          <PrimaryButton
            title="Ver historial"
            icon="calendar-outline"
            onPress={() => navigation.navigate(historyTarget)}
            style={styles.actionHalf}
            accessibilityLabel="Ver historial"
          />
          <View style={styles.actionGap} />
          <SecondaryButton
            title="IA médica"
            icon="sparkles-outline"
            onPress={() => navigation.navigate('MedicalAI')}
            style={styles.actionHalf}
            accessibilityLabel="IA médica"
          />
        </View>

        {/* 5) Insight */}
        <Card style={styles.insightCard}>
          <Text style={styles.insightLabel} allowFontScaling>
            Insight
          </Text>
          <Text style={styles.insightBody} allowFontScaling>
            {insightText}
          </Text>
        </Card>

        {/* 6) Último registro */}
        <Card style={styles.lastCard}>
          <View style={styles.lastHeaderRow}>
            <Text style={styles.lastLabel} allowFontScaling>
              Último registro clínico
            </Text>
            <Text style={styles.lastDate} allowFontScaling>
              {DEMO_LAST_CLINICAL_EVENT.date}
            </Text>
          </View>
          <Text style={styles.lastDescription} allowFontScaling>
            {DEMO_LAST_CLINICAL_EVENT.description}
          </Text>
        </Card>

        <Text style={styles.footerHint} allowFontScaling>
          MEDICAL corp · Información orientativa, no sustituye la consulta médica.
        </Text>
    </TabScreenLayout>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  topHeaderText: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.md,
  },
  hello: {
    fontSize: typography.title.fontSize + 6,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subHello: {
    marginTop: spacing.xs,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.45,
  },
  profileIcon: {
    width: spacing.xl + spacing.sm,
    height: spacing.xl + spacing.sm,
    borderRadius: (spacing.xl + spacing.sm) / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCard: {
    marginBottom: layout.sectionGap,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  statusCardLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    width: spacing.xl + spacing.lg,
    height: spacing.xl + spacing.lg,
    borderRadius: (spacing.xl + spacing.lg) / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  statusBig: {
    fontSize: typography.title.fontSize,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusSmall: {
    marginTop: spacing.xs,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.4,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
  },
  sectionTitleOnly: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  metricsGrid: {
    marginBottom: layout.sectionGap,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.xl,
  },
  actionHalf: {
    flex: 1,
  },
  actionGap: {
    width: spacing.m,
  },

  insightCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  insightLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  insightBody: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.body.fontSize * 1.5,
  },

  lastCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  lastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lastLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
    marginRight: spacing.md,
  },
  lastDate: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  lastDescription: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.body.fontSize * 1.5,
  },

  footerHint: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: typography.caption.fontSize * 1.5,
  },
  });
}
