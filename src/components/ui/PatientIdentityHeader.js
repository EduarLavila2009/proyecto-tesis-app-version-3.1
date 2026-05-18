import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { spacing, typography, useTheme } from '../../theme';

function initials(name) {
  const t = (name || '').trim();
  if (!t) return '?';
  const p = t.split(/\s+/).filter(Boolean);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

/** Cabecera del detalle — avatar, nombre y meta sin alterar datos. */
export default function PatientIdentityHeader({ name, email, patientId, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText} allowFontScaling>
            {initials(name)}
          </Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.name} allowFontScaling numberOfLines={2}>
            {name || '—'}
          </Text>
          {email ? (
            <Text style={styles.email} allowFontScaling numberOfLines={1}>
              {email}
            </Text>
          ) : null}
          {patientId ? (
            <Text style={styles.idLine} allowFontScaling numberOfLines={1}>
              ID {patientId}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.m,
      backgroundColor: colors.secondaryMuted,
      borderColor: `${colors.primary}22`,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.m,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}18`,
      borderWidth: 1.5,
      borderColor: `${colors.primary}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.primary,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      ...typography.title,
      fontSize: typography.subtitle.fontSize + 2,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    email: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    idLine: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginTop: 2,
    },
  });
}
