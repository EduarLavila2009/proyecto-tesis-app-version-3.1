import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { spacing, typography, useTheme } from '../../theme';
import { isAlertStatus } from '../../utils/vitalsMonitoring';

/**
 * Ítem de historial de medición — fecha, resumen y tipo (manual / automático).
 * alertStatus: resultado visual de evaluateMonitoringAlert (solo presentación).
 */
export default function HistoryRecordCard({
  dateLabel,
  heartRate,
  temperature,
  bloodPressureText,
  oxygen,
  source = 'manual',
  alertStatus,
  style,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, alertStatus), [colors, alertStatus]);

  const isAuto = source === 'auto' || source === 'automatic';
  const iconName = isAuto ? 'pulse-outline' : 'create-outline';
  const sourceLabel = isAuto ? 'Automático' : 'Manual';

  const showAlert = alertStatus && isAlertStatus(alertStatus.level);

  return (
    <Card style={[styles.card, style]}>
      {showAlert ? (
        <View
          style={[
            styles.alertBanner,
            alertStatus.level === 'critical' ? styles.alertCritical : styles.alertWarning,
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color={alertStatus.level === 'critical' ? colors.danger : colors.warning}
          />
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
            Valores fuera del rango habitual
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
      </View>

      <View style={styles.metricsRow}>
        <MetricPill label="FC" value={`${heartRate ?? '—'} bpm`} colors={colors} styles={styles} />
        <MetricPill
          label="Temp"
          value={typeof temperature === 'number' ? `${temperature.toFixed(1)} °C` : '—'}
          colors={colors}
          styles={styles}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricPill label="PA" value={`${bloodPressureText ?? '—'} mmHg`} colors={colors} styles={styles} />
        <MetricPill label="SpO₂" value={`${oxygen ?? '—'}%`} colors={colors} styles={styles} />
      </View>
    </Card>
  );
}

function MetricPill({ label, value, colors, styles: parentStyles }) {
  return (
    <View style={parentStyles.metricPill}>
      <Text style={[parentStyles.metricPillLabel, { color: colors.textSecondary }]} allowFontScaling>
        {label}
      </Text>
      <Text style={[parentStyles.metricPillValue, { color: colors.textPrimary }]} allowFontScaling numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function createStyles(colors, alertStatus) {
  const borderAccent =
    alertStatus?.level === 'critical'
      ? colors.danger
      : alertStatus?.level === 'warning'
        ? colors.warning
        : colors.borderSubtle;

  return StyleSheet.create({
    card: {
      marginBottom: spacing.m,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: borderAccent,
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
      backgroundColor: `${colors.warning}18`,
    },
    alertCritical: {
      backgroundColor: `${colors.danger}14`,
    },
    alertBannerText: {
      ...typography.caption,
      fontWeight: '600',
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: spacing.radiusButton,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.m,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    dateText: {
      ...typography.bodyMedium,
      color: colors.primary,
      marginBottom: spacing.xs / 2,
    },
    sourceText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    metricPill: {
      flex: 1,
      minWidth: 0,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.radiusButton,
      backgroundColor: colors.secondaryMuted,
    },
    metricPillLabel: {
      ...typography.caption,
      fontWeight: '600',
      marginBottom: 2,
    },
    metricPillValue: {
      fontSize: typography.body.fontSize,
      fontWeight: '700',
    },
  });
}
