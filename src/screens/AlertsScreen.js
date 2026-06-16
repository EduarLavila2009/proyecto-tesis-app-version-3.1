import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassmorphicCard, PressableScale, ScreenContainer } from '../components';
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

    const handlePress = () => {
      try {
        const Haptics = require('expo-haptics');
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync();
        }
      } catch (_) {}
    };

    return (
      <PressableScale onPress={handlePress} style={styles.itemPressable} accessibilityRole="button">
        <GlassmorphicCard
          style={styles.itemCard}
          alertType={item.level}
        >
          <View style={styles.itemTop}>
            <View style={[styles.iconWrap, { backgroundColor: `${accent}14`, borderColor: `${accent}33` }]}>
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
        </GlassmorphicCard>
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
          <GlassmorphicCard style={styles.emptyCard} alertType="success">
            <View style={styles.emptyHeaderRow}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
              <Text style={styles.emptyTitle} allowFontScaling>
                Sin alertas activas
              </Text>
            </View>
            <Text style={styles.emptyText} allowFontScaling>
              Tu estado clínico se encuentra estable y monitoreado. Si se detectan valores anormales, aparecerán aquí de forma inmediata.
            </Text>
          </GlassmorphicCard>
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
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    itemText: {
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    itemPatient: {
      marginTop: 2,
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    when: {
      fontSize: 11,
      color: colors.textPlaceholder,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      fontWeight: '500',
      paddingLeft: 36 + spacing.md,
    },
    emptyCard: {
      padding: spacing.lg,
    },
    emptyHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18.5,
      fontWeight: '500',
      paddingLeft: 24 + spacing.sm,
    },
  });
}
