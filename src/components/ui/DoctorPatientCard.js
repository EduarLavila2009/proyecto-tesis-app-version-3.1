import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from './Card';
import MetricTile from './MetricTile';
import { PrimaryButton, SecondaryButton } from './buttons';
import { spacing, typography, useTheme } from '../../theme';
import { alertLevelForMetric } from '../../utils/vitalsMetricAlerts';

function patientInitials(name) {
  const t = (name || '').trim();
  if (!t) return '?';
  const p = t.split(/\s+/).filter(Boolean);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

/**
 * Tarjeta de paciente vinculado — identidad, estado, grid de métricas y acciones.
 * Solo presentación; datos y alertas vienen del padre.
 */
export default function DoctorPatientCard({
  name,
  email,
  lastMeasuredLabel,
  alert,
  vitals,
  onPressDetail,
  style,
}) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const level = alert?.level || 'stable';
  const styles = useMemo(() => createStyles(colors, level), [colors, level]);
  const statusColor =
    level === 'critical'
      ? colors.danger
      : level === 'warning'
        ? colors.warning
        : colors.success;
  const statusBg =
    level === 'critical'
      ? `${colors.danger}18`
      : level === 'warning'
        ? `${colors.warning}18`
        : `${colors.success}18`;
  const statusIcon =
    level === 'critical'
      ? 'alert-circle'
      : level === 'warning'
        ? 'warning'
        : 'checkmark-circle';

  const reasons = alert?.reasons ?? [];
  const bpLabel = `${vitals.systolic}/${vitals.diastolic}`;

  const metricItems = useMemo(
    () => [
      {
        id: 'hr',
        icon: 'heart',
        label: 'Ritmo cardíaco',
        value: `${vitals.heartRate} bpm`,
        alertLevel: alertLevelForMetric(reasons, 'HR_'),
        iconAccent: 'primary',
      },
      {
        id: 'temp',
        icon: 'temperature',
        label: 'Temperatura',
        value: `${vitals.temp.toFixed(1)} °C`,
        iconAccent: 'secondary',
      },
      {
        id: 'bp',
        icon: 'blood',
        label: 'Presión arterial',
        value: bpLabel,
        alertLevel: alertLevelForMetric(reasons, 'BP_'),
        iconAccent: 'primary',
      },
      {
        id: 'spo2',
        icon: 'lungs',
        label: 'Oxígeno (SpO₂)',
        value: `${vitals.spo2}%`,
        alertLevel: alertLevelForMetric(reasons, 'SPO2_'),
        iconAccent: 'secondary',
      },
    ],
    [vitals, bpLabel, reasons]
  );

  const handleContact = () => {
    navigation.navigate('VideoCall', { contactName: name || 'Paciente', role: 'patient' });
  };

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText} allowFontScaling>
            {patientInitials(name)}
          </Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name} allowFontScaling numberOfLines={1}>
            {name || '—'}
          </Text>
          <Text style={styles.email} allowFontScaling numberOfLines={1}>
            {email || 'Sin correo registrado'}
          </Text>
          <Text style={styles.meta} allowFontScaling numberOfLines={1}>
            {lastMeasuredLabel}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Ionicons name={statusIcon} size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling>
            {alert?.title || 'Normal'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {metricItems.map((item) => (
          <View key={item.id} style={styles.metricCell}>
            <MetricTile
              variant="compact"
              icon={item.icon}
              iconAccent={item.iconAccent}
              value={item.value}
              label={item.label}
              alertLevel={item.alertLevel}
              style={styles.metricTile}
            />
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <SecondaryButton
          title="Contactar"
          icon="call-outline"
          onPress={handleContact}
          style={styles.actionBtn}
          accessibilityLabel={`Contactar a ${name || 'paciente'}`}
        />
        <View style={styles.actionGap} />
        <PrimaryButton
          title="Ver detalle"
          icon="chevron-forward"
          iconPosition="right"
          onPress={onPressDetail}
          style={styles.actionBtn}
          accessibilityLabel={`Ver detalle de ${name || 'paciente'}`}
        />
      </View>
    </Card>
  );
}

function createStyles(colors, level) {
  const isAlert = level === 'critical' || level === 'warning';
  const borderColor =
    level === 'critical'
      ? colors.danger
      : level === 'warning'
        ? colors.warning
        : colors.borderSubtle;

  return StyleSheet.create({
    card: {
      padding: spacing.l,
      borderWidth: isAlert ? 1.5 : StyleSheet.hairlineWidth,
      borderColor,
      borderLeftWidth: 6,
      borderLeftColor: borderColor,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.m,
      marginBottom: spacing.m,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${colors.primary}18`,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.primary,
    },
    identityText: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      ...typography.subtitle,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    email: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    meta: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginTop: spacing.xs,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.radiusButton,
      maxWidth: 110,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.m,
    },
    metricCell: {
      width: '48%',
      flexGrow: 1,
      minWidth: 136,
    },
    metricTile: {
      width: '100%',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
      minHeight: spacing.minTouchTarget,
    },
    actionGap: {
      width: spacing.sm,
    },
  });
}
