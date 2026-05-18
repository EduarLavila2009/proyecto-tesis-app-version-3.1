import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Card, PressableScale, ScreenContainer } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, layout, stackScrollContent, useTheme } from '../theme';
import { getAlerts, markAllAlertsRead } from '../services/alertsService';

function formatWhen(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function AlertsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const [alerts, setAlerts] = useState([]);

  const load = useCallback(async () => {
    const list = await getAlerts();
    setAlerts(list);
    await markAllAlertsRead();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }) => {
    const isCritical = item.level === 'critical';
    const accent = isCritical ? colors.danger : colors.warning;
    const icon = isCritical ? 'alert-circle' : 'warning';

    return (
      <PressableScale style={styles.itemPressable} accessibilityRole="button">
        <Card style={styles.itemCard}>
          <View style={styles.itemTop}>
            <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
              <Ionicons name={icon} size={18} color={accent} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle} allowFontScaling numberOfLines={1}>
                {item.title || (isCritical ? 'Crítico' : 'Atención')}
              </Text>
              {item.patientName ? (
                <Text style={styles.itemPatient} allowFontScaling numberOfLines={1}>
                  {item.patientName}
                </Text>
              ) : null}
            </View>
            <Text style={styles.when} allowFontScaling>
              {formatWhen(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.subtitle} allowFontScaling>
            {item.subtitle || '—'}
          </Text>
        </Card>
      </PressableScale>
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle} allowFontScaling>
              Sin alertas
            </Text>
            <Text style={styles.emptyText} allowFontScaling>
              Cuando se detecten valores anormales, aparecerán aquí como notificaciones internas.
            </Text>
          </Card>
        }
      />
    </ScreenContainer>
  );
}

function createStyles(colors, insets) {
  return StyleSheet.create({
    listContent: stackScrollContent(insets, {
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      width: '100%',
    }),
    itemPressable: {
      marginBottom: spacing.md,
    },
    itemCard: {
      padding: spacing.lg,
    },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    itemText: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    itemPatient: {
      marginTop: 2,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    when: {
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    subtitle: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: typography.body.fontSize * 1.45,
    },
    emptyCard: {
      padding: spacing.lg,
      borderRadius: spacing.radiusLg,
    },
    emptyTitle: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: typography.body.fontSize * 1.5,
    },
  });
}

