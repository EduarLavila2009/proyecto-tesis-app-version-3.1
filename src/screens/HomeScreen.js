import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { Card, Header, Button, StatBox } from '../components';
import { colors, spacing, typography } from '../theme';
import {
  evaluateMonitoringAlert,
  isAlertStatus,
  SIM_HEART_RATE_BPM,
  SIM_BP_SYSTOLIC,
  SIM_BP_DIASTOLIC,
  SIM_SPO2,
  SIM_TEMP_C,
} from '../utils/vitalsMonitoring';

/** Misma entrada demo que la primera fila del historial clínico simulado (solo UI). */
const DEMO_LAST_CLINICAL_EVENT = {
  date: '5 abr 2026',
  description:
    'Consulta de seguimiento — presión arterial 118/76 mmHg, sin alteraciones.',
};

const ACTION_ICON_SIZE = spacing.lg + spacing.xs;

const QUICK_ACTIONS = [
  {
    id: 'history',
    title: 'Ver Historial',
    icon: 'document-text-outline',
    nav: 'History',
  },
  {
    id: 'contact',
    title: 'Contactar Médico',
    icon: 'chatbubbles-outline',
    nav: null,
  },
  {
    id: 'measure',
    title: 'Nueva Medición',
    icon: 'pulse-outline',
    nav: 'Dashboard',
  },
];

function statusDisplayWord(level) {
  if (level === 'stable') return 'Normal';
  if (level === 'warning') return 'Atención';
  return 'Crítico';
}

export default function HomeScreen({ navigation }) {
  const [roleKey, setRoleKey] = useState(ROLES.PATIENT);
  const [userName, setUserName] = useState('');

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

  const displayName = userName.trim() || 'Usuario';
  const status = evaluateMonitoringAlert(
    SIM_HEART_RATE_BPM,
    SIM_BP_SYSTOLIC,
    SIM_BP_DIASTOLIC
  );
  const alertActive = isAlertStatus(status.level);
  const statusColor = alertActive ? colors.danger : colors.secondary;
  const statusWord = statusDisplayWord(status.level);

  const insightText =
    status.level === 'stable'
      ? 'Tu estado se mantiene estable. Sigue con tu rutina de medicación y controles programados.'
      : status.subtitle;

  const historyTarget = roleKey === ROLES.DOCTOR ? 'Patients' : 'History';

  const handleQuickAction = (item) => {
    if (item.id === 'contact') {
      Alert.alert(
        'Contactar médico',
        'Canal de contacto con su equipo médico (simulado). En producción podría abrir teléfono, chat o cita.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    if (item.nav) {
      navigation.navigate(item.nav === 'History' ? historyTarget : item.nav);
    }
  };

  const bpLabel = `${SIM_BP_SYSTOLIC}/${SIM_BP_DIASTOLIC}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Header
            title={`Hola, ${displayName}`}
            style={styles.headerWrap}
            textStyle={styles.greeting}
          />
          <Text style={styles.statusLine} allowFontScaling>
            <Text style={styles.statusPrefix} allowFontScaling>
              Estado:{' '}
            </Text>
            <Text style={[styles.statusValue, { color: statusColor }]} allowFontScaling>
              {statusWord}
            </Text>
          </Text>
          <Text style={styles.statusHint} allowFontScaling>
            {status.subtitle}
          </Text>
        </View>

        <Text style={styles.sectionLabel} allowFontScaling>
          Signos vitales
        </Text>
        <View style={styles.metricsBlock}>
          <View style={styles.metricsRow}>
            <StatBox
              value={SIM_HEART_RATE_BPM}
              label="FC (bpm)"
              style={[styles.statCell, styles.statLeft]}
            />
            <StatBox
              value={`${SIM_TEMP_C.toFixed(1)} °C`}
              label="Temp."
              style={[styles.statCell, styles.statMid]}
            />
            <StatBox
              value={`${SIM_SPO2}%`}
              label="SpO₂"
              style={[styles.statCell, styles.statRight]}
            />
          </View>
          <View style={styles.bpRow}>
            <StatBox value={bpLabel} label="PA (mmHg)" style={styles.statBp} />
          </View>
        </View>

        <Text style={styles.sectionLabel} allowFontScaling>
          Acciones rápidas
        </Text>
        {QUICK_ACTIONS.map((item) => (
          <View key={item.id} style={styles.actionRow}>
            <View style={styles.actionIconWrap} pointerEvents="none">
              <Ionicons name={item.icon} size={ACTION_ICON_SIZE} color={colors.primary} />
            </View>
            <Button
              title={item.title}
              onPress={() => handleQuickAction(item)}
              style={styles.actionButton}
              accessibilityLabel={item.title}
            />
          </View>
        ))}

        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIcon}>
              <Ionicons name="information-circle-outline" size={spacing.lg} color={colors.primary} />
            </View>
            <Text style={styles.insightTitle} allowFontScaling>
              Resumen clínico
            </Text>
          </View>
          <Text style={styles.insightBody} allowFontScaling>
            {insightText}
          </Text>
        </Card>

        <Card style={styles.lastCard}>
          <Text style={styles.lastLabel} allowFontScaling>
            Último registro
          </Text>
          <Text style={styles.lastDate} allowFontScaling>
            {DEMO_LAST_CLINICAL_EVENT.date}
          </Text>
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

const GUTTER = spacing.sm;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  headerWrap: {
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
  },
  statusLine: {
    marginTop: spacing.xs,
    textAlign: 'left',
    width: '100%',
  },
  statusPrefix: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
  },
  statusValue: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
  },
  statusHint: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.caption.fontSize * 1.5,
    textAlign: 'left',
    width: '100%',
  },
  sectionLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  metricsBlock: {
    marginBottom: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: -GUTTER / 2,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: GUTTER / 2,
  },
  statLeft: {},
  statMid: {},
  statRight: {},
  bpRow: {
    marginTop: GUTTER,
  },
  statBp: {
    paddingVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  actionIconWrap: {
    width: spacing.xl + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  insightCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightIcon: {
    marginRight: spacing.sm,
  },
  insightTitle: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
  },
  insightBody: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.45,
  },
  lastCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  lastLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  lastDate: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  lastDescription: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.body.fontSize * 1.45,
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
