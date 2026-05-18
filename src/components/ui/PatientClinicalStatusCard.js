import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Bloque hero de estado clínico — borde de acento, icono y jerarquía clara.
 * Solo presentación; título/subtítulo/fecha vienen del padre.
 */
export default function PatientClinicalStatusCard({
  statusTitle,
  statusSubtitle,
  lastMeasuredLabel,
  level = 'stable',
  style,
}) {
  const { colors, cardShadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, level), [colors, level]);

  const statusColor =
    level === 'critical'
      ? colors.danger
      : level === 'warning'
        ? colors.warning
        : colors.success;

  const statusIcon =
    level === 'critical'
      ? 'alert-circle'
      : level === 'warning'
        ? 'warning'
        : 'checkmark-circle';

  return (
    <Card style={[styles.card, cardShadow, style]}>
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${statusColor}18` }]}>
            <Ionicons name={statusIcon} size={26} color={statusColor} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.sectionLabel} allowFontScaling>
              ESTADO CLÍNICO
            </Text>
            <View style={styles.titleRow}>
              <Text style={styles.blockTitle} allowFontScaling>
                Estado clínico
              </Text>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling>
                  {statusTitle || 'Estable'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.observationBox}>
          <Text style={styles.observationLabel} allowFontScaling>
            Última observación
          </Text>
          <Text style={styles.subtitle} allowFontScaling>
            {statusSubtitle || '—'}
          </Text>
        </View>

        {lastMeasuredLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.textPlaceholder} />
            <Text style={styles.metaLine} allowFontScaling>
              {lastMeasuredLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function createStyles(colors, level) {
  return StyleSheet.create({
    card: {
      padding: 0,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: spacing.radiusCard,
      borderBottomLeftRadius: spacing.radiusCard,
    },
    inner: {
      padding: spacing.l,
      paddingLeft: spacing.l + spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.m,
      marginBottom: spacing.m,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: spacing.radiusButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    sectionLabel: {
      ...typography.caption,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.textPlaceholder,
      marginBottom: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    blockTitle: {
      ...typography.subtitle,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.radiusButton,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: typography.caption.fontSize,
      fontWeight: '800',
    },
    observationBox: {
      backgroundColor: colors.secondaryMuted,
      borderRadius: spacing.radiusButton,
      padding: spacing.m,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    observationLabel: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: typography.body.lineHeight * 1.35,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.m,
    },
    metaLine: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
    },
  });
}
