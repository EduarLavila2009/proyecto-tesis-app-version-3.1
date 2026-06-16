import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassmorphicCard from './GlassmorphicCard';
import PressableScale from '../PressableScale';
import ClinicalTooltip from './ClinicalTooltip';
import { spacing, typography, useTheme } from '../../theme';
import { isAlertStatus } from '../../utils/vitalsMonitoring';

function getClinicalExplanation(label = '') {
  const norm = label.toLowerCase();
  if (norm.includes('cardíac') || norm.includes('ritmo') || norm.includes('frecuencia') || norm === 'fc') {
    return 'El ritmo cardíaco ideal en reposo oscila entre 60 y 90 bpm en adultos. Valores fuera de este rango pueden indicar fatiga, deshidratación, esfuerzo cardiovascular o arritmia periférica (OMS).';
  }
  if (norm.includes('temp') || norm.includes('calor')) {
    return 'La temperatura corporal normal en reposo se sitúa de 36.1°C a 37.2°C. Permite identificar tempranamente infecciones, cuadros de febrícula o hipotermia sistémica (AHA).';
  }
  if (norm.includes('presi') || norm.includes('arterial') || norm === 'pa') {
    return 'La presión arterial se compone de Sistólica (ideal < 120 mmHg) y Diastólica (ideal < 80 mmHg). Su control regular protege los vasos cerebrales y coronarios (AHA/OMS).';
  }
  if (norm.includes('oxíge') || norm.includes('spo') || norm === 'spo₂') {
    return 'La saturación de oxígeno mide el O₂ transportado en sangre. Rangos normales: 95% a 100%. Valores inferiores a 92% indican hipoxia celular y requieren atención inmediata.';
  }
  return 'Esta métrica refleja el estado fisiológico y cardiovascular actual del paciente.';
}

export default function HistoryRecordCard({
  dateLabel,
  heartRate,
  temperature,
  bloodPressureText,
  oxygen,
  source = 'manual',
  alertStatus,
  style,
  onPress,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isAuto = source === 'auto' || source === 'automatic';
  const iconName = isAuto ? 'pulse-outline' : 'create-outline';
  const sourceLabel = isAuto ? 'Automático' : 'Manual';

  const showAlert = alertStatus && isAlertStatus(alertStatus.level);

  // Animación de pulso continuo para alertas clínicas
  const warningPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let anim = null;
    if (showAlert) {
      warningPulse.setValue(1);
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(warningPulse, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(warningPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      warningPulse.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [showAlert]);

  const handlePress = () => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}

    if (onPress) {
      onPress();
    } else {
      Alert.alert(
        'Informe Fisiológico',
        `Medición realizada el ${dateLabel} (${sourceLabel}).\n\nFC: ${heartRate} bpm\nTemp: ${temperature.toFixed(1)} °C\nPA: ${bloodPressureText} mmHg\nSpO₂: ${oxygen}%\n\nEstado: ${alertStatus ? (alertStatus.level === 'stable' ? 'Estable' : alertStatus.subtitle) : 'Normal'}`
      );
    }
  };

  const alertTypeMapped = alertStatus ? (alertStatus.level === 'stable' ? 'success' : alertStatus.level) : undefined;

  return (
    <PressableScale onPress={handlePress} style={styles.pressableWrap}>
      <GlassmorphicCard
        style={[styles.card, style]}
        alertType={alertTypeMapped}
      >
        {showAlert ? (
          <View
            style={[
              styles.alertBanner,
              alertStatus.level === 'critical' ? styles.alertCritical : styles.alertWarning,
            ]}
          >
            <Animated.View style={{ transform: [{ scale: warningPulse }] }}>
              <Ionicons
                name="alert-circle"
                size={16}
                color={alertStatus.level === 'critical' ? colors.danger : colors.warning}
              />
            </Animated.View>
            <Text
              style={[
                styles.alertBannerText,
                {
                  color: alertStatus.level === 'critical' ? colors.danger : colors.warning,
                },
              ]}
              allowFontScaling
              numberOfLines={2}
            >
              {alertStatus.subtitle || 'Valores fuera del rango de seguridad'}
            </Text>
          </View>
        ) : null}

        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={18} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.dateText} allowFontScaling>
              {dateLabel}
            </Text>
            <Text style={styles.sourceText} allowFontScaling>
              {sourceLabel}
            </Text>
          </View>
          {showAlert ? (
            <Animated.View 
              style={[
                styles.pulseBadge, 
                { 
                  backgroundColor: alertStatus.level === 'critical' ? colors.danger : colors.warning,
                  transform: [{ scale: warningPulse }]
                }
              ]} 
            />
          ) : null}
        </View>

        <View style={styles.metricsRow}>
          <MetricPill
            label="FC"
            value={`${heartRate ?? '—'} bpm`}
            colors={colors}
            styles={styles}
            alert={alertLevelForMetric(alertStatus?.reasons, 'HR_')}
          />
          <MetricPill
            label="Temp"
            value={typeof temperature === 'number' ? `${temperature.toFixed(1)} °C` : '—'}
            colors={colors}
            styles={styles}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricPill
            label="PA"
            value={`${bloodPressureText ?? '—'} mmHg`}
            colors={colors}
            styles={styles}
            alert={alertLevelForMetric(alertStatus?.reasons, 'BP_')}
          />
          <MetricPill
            label="SpO₂"
            value={`${oxygen ?? '—'}%`}
            colors={colors}
            styles={styles}
            alert={alertLevelForMetric(alertStatus?.reasons, 'SPO2_')}
          />
        </View>
      </GlassmorphicCard>
    </PressableScale>
  );
}

function alertLevelForMetric(reasons, prefix) {
  if (!reasons?.length) return undefined;
  const related = reasons.filter((r) => r.code.startsWith(prefix));
  if (related.some((r) => r.severity === 'critical')) return 'critical';
  if (related.some((r) => r.severity === 'warning')) return 'warning';
  return undefined;
}

function MetricPill({ label, value, colors, styles: parentStyles, alert }) {
  const { isDark } = useTheme();
  const borderCol = alert === 'critical' ? colors.danger : alert === 'warning' ? colors.warning : colors.borderSubtle;
  const textCol = alert === 'critical' ? colors.danger : alert === 'warning' ? colors.warning : colors.textPrimary;
  const bgCol = alert === 'critical' ? `${colors.danger}0B` : alert === 'warning' ? `${colors.warning}0B` : isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)';

  const clinicalInfo = useMemo(() => getClinicalExplanation(label), [label]);

  const triggerHaptic = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } catch (_) {}
  };

  return (
    <ClinicalTooltip title={label} value={value} clinicalInfo={clinicalInfo}>
      <PressableScale
        onPress={triggerHaptic}
        activeScale={0.93}
        style={parentStyles.metricPillPressable}
      >
        <View style={[parentStyles.metricPill, { borderColor: borderCol, backgroundColor: bgCol }]}>
          <Text style={[parentStyles.metricPillLabel, { color: colors.textSecondary }]} allowFontScaling>
            {label}
          </Text>
          <Text style={[parentStyles.metricPillValue, { color: textCol }]} allowFontScaling numberOfLines={1}>
            {value}
          </Text>
        </View>
      </PressableScale>
    </ClinicalTooltip>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    pressableWrap: {
      width: '100%',
    },
    card: {
      marginBottom: spacing.md,
    },
    alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.radiusButton,
      marginBottom: spacing.m,
    },
    alertWarning: {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
    },
    alertCritical: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    alertBannerText: {
      ...typography.caption,
      fontWeight: '600',
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: spacing.radiusButton,
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    dateText: {
      ...typography.bodyMedium,
      color: colors.primary,
      fontWeight: '700',
      marginBottom: 1,
    },
    sourceText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    pulseBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm - 2,
    },
    metricPillPressable: {
      flex: 1,
      minWidth: 0,
    },
    metricPill: {
      paddingVertical: spacing.sm - 2,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.radiusButton,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    metricPillLabel: {
      ...typography.caption,
      fontWeight: '700',
      marginBottom: 1,
    },
    metricPillValue: {
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
