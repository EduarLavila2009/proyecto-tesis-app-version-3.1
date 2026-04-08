import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { Card, Header, Button, StatBox, MedicalAlertBanner } from '../components';
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

const RECENT_RECORDS = [
  { id: '1', time: 'Hoy 08:42', detail: 'Medición automática — FC estable, sin eventos.' },
  { id: '2', time: 'Ayer 21:15', detail: 'Recordatorio: hidratación adecuada.' },
  { id: '3', time: 'Hace 2 días', detail: 'Sincronización de dispositivo completada.' },
];

const METRICS_ANIM_MS = 520;

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [patientName, setPatientName] = useState('Paciente');
  const [userId, setUserId] = useState(null);
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
            setUserId(String(u.id));
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

  const gridGutter = Math.min(spacing.md, Math.max(spacing.sm, windowWidth * 0.02));

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xl + spacing.lg + spacing.md + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isAlert ? (
          <MedicalAlertBanner
            title="Alerta médica"
            subtitle={status.subtitle}
            onPress={() => navigation.navigate('Alerts')}
          />
        ) : null}

        <Card style={styles.heroCard}>
          <Header
            title={`Hola, ${patientName}`}
            style={styles.headerWrap}
            textStyle={styles.greeting}
          />
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

        <Text style={styles.sectionHeading} allowFontScaling>
          Métricas vitales
        </Text>
        <Animated.View
          style={[
            styles.metricsGrid,
            {
              opacity: metricsOpacity,
              transform: [{ translateY: metricsTranslate }],
            },
          ]}
          accessibilityLabel="Métricas vitales"
        >
          <View style={[styles.metricsRow, { marginHorizontal: -gridGutter / 2 }]}>
            <StatBox
              value={vitals.heartRate}
              label="FC (bpm)"
              style={[styles.statCell, { marginHorizontal: gridGutter / 2 }]}
            />
            <StatBox
              value={`${vitals.temperature.toFixed(1)} °C`}
              label="Temperatura"
              style={[styles.statCell, { marginHorizontal: gridGutter / 2 }]}
            />
          </View>
          <View style={[styles.metricsRow, styles.metricsRowSecond, { marginHorizontal: -gridGutter / 2 }]}>
            <StatBox
              value={bpLabel}
              label="Presión (mmHg)"
              style={[styles.statCell, { marginHorizontal: gridGutter / 2 }]}
            />
            <StatBox
              value={`${vitals.oxygen}%`}
              label="Oxígeno (SpO₂)"
              style={[styles.statCell, { marginHorizontal: gridGutter / 2 }]}
            />
          </View>
        </Animated.View>

        <Card style={styles.recordsCard}>
          <Text style={styles.cardTitle} allowFontScaling>
            Últimos registros
          </Text>
          {RECENT_RECORDS.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.recordBlock,
                index === RECENT_RECORDS.length - 1 && styles.recordBlockLast,
              ]}
            >
              <Text style={styles.recordTime} allowFontScaling>
                {row.time}
              </Text>
              <Text style={styles.recordDetail} allowFontScaling>
                {row.detail}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.actionsCard}>
          <Text style={styles.cardTitle} allowFontScaling>
            Acciones rápidas
          </Text>
          <Button
            title="Contactar Doctor"
            onPress={() =>
              Alert.alert(
                'Contacto',
                'Canal de contacto con su equipo médico (simulado). En producción podría abrir teléfono, chat o cita.',
                [{ text: 'Entendido' }]
              )
            }
            style={styles.actionBtnLarge}
            accessibilityLabel="Contactar doctor"
          />
          <Button
            title="Ver Historial"
            onPress={() => navigation.navigate('History')}
            style={styles.actionBtnLast}
            accessibilityLabel="Ver historial médico"
          />
        </Card>
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
  heroCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
  },
  sectionHeading: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  headerWrap: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
    letterSpacing: -0.3,
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
  metricsGrid: {
    marginBottom: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricsRowSecond: {
    marginTop: spacing.sm,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
  },
  recordsCard: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionsCard: {
    width: '100%',
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  recordTime: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  recordDetail: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.body.fontSize * 1.45,
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
  });
}
