import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { Card, PressableScale } from '../components';
import { spacing, typography, useTheme } from '../theme';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
import { getDoctorPatientLinks } from '../services/connectionService';
import { getLatestMedicalRecord } from '../services/medicalRecordsService';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hashStringToInt(str) {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function formatRelativeTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const deltaMs = Date.now() - d.getTime();
  if (!Number.isFinite(deltaMs)) return '—';

  const min = Math.round(deltaMs / 60000);
  if (min < 1) return 'Hace instantes';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.round(h / 24);
  return `Hace ${days} d`;
}

function buildSimVitals(patientId) {
  const seed = hashStringToInt(patientId);
  const r01 = (seed % 1000) / 1000;
  const r02 = ((seed >> 10) % 1000) / 1000;
  const r03 = ((seed >> 20) % 1000) / 1000;

  const heartRate = Math.round(72 + (r01 - 0.5) * 44); // ~50–94 (a veces más alto)
  const systolic = Math.round(115 + (r02 - 0.5) * 50); // ~90–140+
  const diastolic = Math.round(75 + (r03 - 0.5) * 26); // ~62–88+
  const temp = 36.5 + (r03 - 0.5) * 0.8;
  const spo2 = clamp(Math.round(98 + (r02 - 0.7) * 5), 92, 100);

  return { heartRate, systolic, diastolic, temp, spo2 };
}

export default function DoctorDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const user = userJson ? JSON.parse(userJson) : null;
      setDoctor(user);

      if (!user || user.role !== ROLES.DOCTOR) {
        setPatients([]);
        return;
      }

      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const links = await getDoctorPatientLinks();
      const connectedIds = new Set(
        links.filter((l) => l.doctorId === user.id).map((l) => l.patientId)
      );

      const list = await Promise.all(
        (users || [])
          .filter((u) => u.role === ROLES.PATIENT && connectedIds.has(u.id))
          .map(async (p) => {
            const latest = await getLatestMedicalRecord(p.id);
            const fallbackTs = Date.now() - (hashStringToInt(p.id + 't') % (36 * 60 * 60000));

            const vitals = latest?.bloodPressure
              ? {
                  heartRate: latest.heartRate,
                  systolic: latest.bloodPressure.systolic,
                  diastolic: latest.bloodPressure.diastolic,
                  temp: latest.temperature,
                  spo2: latest.oxygen,
                }
              : buildSimVitals(p.id);

            const alert = evaluateMonitoringAlert(
              vitals.heartRate,
              vitals.systolic,
              vitals.diastolic,
              vitals.spo2
            );

            const lastMeasuredAt = latest?.date
              ? new Date(latest.date).getTime()
              : fallbackTs;

            return {
              ...p,
              vitals,
              alert,
              lastMeasuredAt,
            };
          })
      );

      list.sort((a, b) => b.lastMeasuredAt - a.lastMeasuredAt);

      setPatients(list);
    } catch (e) {
      console.error('DoctorDashboardScreen.load', e);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }) => {
    const level = item.alert?.level || 'stable';
    const statusColor =
      level === 'critical'
        ? colors.danger
        : level === 'warning'
        ? colors.warning
        : colors.success;
    const statusBg =
      level === 'critical'
        ? `${colors.danger}14`
        : level === 'warning'
        ? `${colors.warning}14`
        : `${colors.success}14`;

    return (
      <PressableScale
        onPress={() =>
          navigation.navigate('PatientDetail', {
            patientId: item.id,
            vitals: item.vitals,
            alert: item.alert,
            lastMeasuredAt: item.lastMeasuredAt,
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Abrir paciente ${item.name || '—'}`}
        style={styles.cardPressable}
      >
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.name} allowFontScaling numberOfLines={1}>
                {item.name || '—'}
              </Text>
              <Text style={styles.meta} allowFontScaling numberOfLines={1}>
                Última medición: {formatRelativeTime(item.lastMeasuredAt)}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling>
                {item.alert?.title || 'Estable'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.metricMini}>
              <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metricMiniText} allowFontScaling>
                {item.vitals.heartRate} bpm
              </Text>
            </View>
            <View style={styles.metricMini}>
              <Ionicons name="pulse-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metricMiniText} allowFontScaling>
                {item.vitals.systolic}/{item.vitals.diastolic}
              </Text>
            </View>
            <View style={styles.metricMini}>
              <Ionicons name="thermometer-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metricMiniText} allowFontScaling>
                {item.vitals.temp.toFixed(1)} °C
              </Text>
            </View>
          </View>
        </Card>
      </PressableScale>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText} allowFontScaling>
            Cargando panel clínico...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor || doctor.role !== ROLES.DOCTOR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.forbidden} allowFontScaling>
            Acceso restringido. Este panel es exclusivo para médicos.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle} allowFontScaling>
              Panel clínico
            </Text>
            <Text style={styles.headerSub} allowFontScaling>
              Pacientes conectados ({patients.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle} allowFontScaling>
              Sin pacientes conectados
            </Text>
            <Text style={styles.emptyText} allowFontScaling>
              Vincula pacientes desde la sección “Pacientes” para que aparezcan aquí.
            </Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
    },
    forbidden: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.body.fontSize * 1.4,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.screen,
    },
    header: {
      marginBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: typography.title.fontSize + 2,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    headerSub: {
      marginTop: spacing.xs,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    cardPressable: {
      marginBottom: spacing.md,
    },
    card: {
      padding: spacing.lg,
      borderRadius: spacing.radiusLg,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    cardTitleBlock: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    meta: {
      marginTop: spacing.xs,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: spacing.radiusButton,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    statusText: {
      fontSize: typography.caption.fontSize,
      fontWeight: '800',
    },
    cardBottom: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    metricMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.radiusInput,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    metricMiniText: {
      fontSize: typography.caption.fontSize,
      color: colors.textPrimary,
      fontWeight: '600',
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

