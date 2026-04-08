import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { Card, Header, PressableScale, Icon, MedicalAlertBanner } from '../components';
import { spacing, typography, useTheme } from '../theme';
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
  const insets = useSafeAreaInsets();
  const [roleKey, setRoleKey] = useState(ROLES.PATIENT);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
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

  useFocusEffect(
    useCallback(() => {
      if (!alertActive) return;
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
    }, [alertActive, status.level, status.title, status.subtitle, status.reasons, vitals])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xl + spacing.lg + spacing.md + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* 2) Tarjeta principal: estado general */}
        <Card style={[styles.statusCard, { backgroundColor: statusBg }]}>
          <Text style={styles.statusCardLabel} allowFontScaling>
            Estado general
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

        {/* 3) Métricas: grid 2x2 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} allowFontScaling>
            Métricas
          </Text>
          <Text style={styles.sectionHint} allowFontScaling>
            Actualizado recientemente
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricIcon} pointerEvents="none">
              <Icon name="heart" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue} allowFontScaling>
              {vitals.heartRate} bpm
            </Text>
            <Text style={styles.metricLabel} allowFontScaling>
              Ritmo cardíaco
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricIcon} pointerEvents="none">
              <Icon name="temperature" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue} allowFontScaling>
              {vitals.temperature.toFixed(1)}°C
            </Text>
            <Text style={styles.metricLabel} allowFontScaling>
              Temperatura
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricIcon} pointerEvents="none">
              <Icon name="blood" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue} allowFontScaling>
              {bpLabel}
            </Text>
            <Text style={styles.metricLabel} allowFontScaling>
              Presión
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricIcon} pointerEvents="none">
              <Icon name="lungs" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue} allowFontScaling>
              {vitals.oxygen}%
            </Text>
            <Text style={styles.metricLabel} allowFontScaling>
              Oxígeno
            </Text>
          </Card>
        </View>

        {/* 4) Acciones: botones modernos */}
        <Text style={styles.sectionTitleOnly} allowFontScaling>
          Acciones
        </Text>

        <View style={styles.actionsRow}>
          <PressableScale
            containerStyle={styles.actionHalf}
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={() => navigation.navigate(historyTarget)}
            accessibilityRole="button"
            accessibilityLabel="Ver historial"
          >
            <View style={styles.actionBtnInner} pointerEvents="none">
              <Icon name="calendar" size={18} color={colors.onPrimary} />
              <Text style={styles.actionPrimaryText} allowFontScaling>
                Ver historial
              </Text>
            </View>
          </PressableScale>

          <View style={styles.actionGap} />

          <PressableScale
            containerStyle={styles.actionHalf}
            style={[styles.actionBtn, styles.actionSecondary]}
            onPress={() => navigation.navigate('MedicalAI')}
            accessibilityRole="button"
            accessibilityLabel="IA médica"
          >
            <View style={styles.actionBtnInner} pointerEvents="none">
              <Icon name="ai" size={18} color={colors.primary} />
              <Text style={styles.actionSecondaryText} allowFontScaling>
                IA médica
              </Text>
            </View>
          </PressableScale>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
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
    borderRadius: spacing.radiusCard,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statusCardLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '48%',
    padding: spacing.lg,
  },
  metricIcon: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: spacing.radiusButton,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: typography.subtitle.fontSize + 2,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
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
    width: spacing.md,
  },
  actionBtn: {
    width: '100%',
    minHeight: spacing.xl + spacing.md,
    borderRadius: spacing.radiusButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowRadius: spacing.md,
    elevation: spacing.xs,
  },
  actionPrimaryText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionSecondaryText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.primary,
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
