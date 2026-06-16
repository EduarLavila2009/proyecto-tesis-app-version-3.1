import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS, ROLES } from '../constants/storage';
import * as storageService from '../services/storageService';
import {
  Card,
  PressableScale,
  ScreenContainer,
  DoctorPatientCard,
  VitalsStatusLegend,
  FilterChipBar,
} from '../components';
import { processVitalsAlert } from '../services/vitalsMonitorService';
import {
  spacing,
  typography,
  tabListContent,
  useTheme,
  createSectionHeadingStyle,
} from '../theme';
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

  const heartRate = Math.round(72 + (r01 - 0.5) * 44);
  const systolic = Math.round(115 + (r02 - 0.5) * 50);
  const diastolic = Math.round(75 + (r03 - 0.5) * 26);
  const temp = 36.5 + (r03 - 0.5) * 0.8;
  const spo2 = clamp(Math.round(98 + (r02 - 0.7) * 5), 92, 100);

  return { heartRate, systolic, diastolic, temp, spo2 };
}

export default function DoctorDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const FILTER_OPTIONS = useMemo(
    () => [
      { id: 'all', label: 'Todos' },
      { id: 'stable', label: 'Normal' },
      { id: 'warning', label: 'Atención' },
      { id: 'critical', label: 'Alerta' },
    ],
    []
  );

  const filteredPatients = useMemo(() => {
    if (statusFilter === 'all') return patients;
    return patients.filter((p) => (p.alert?.level || 'stable') === statusFilter);
  }, [patients, statusFilter]);

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

      const users = await storageService.getUsers();
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

      list.sort((a, b) => {
        const order = { critical: 0, warning: 1, stable: 2 };
        const la = order[a.alert?.level] ?? 2;
        const lb = order[b.alert?.level] ?? 2;
        if (la !== lb) return la - lb;
        return b.lastMeasuredAt - a.lastMeasuredAt;
      });

      for (const p of list) {
        if (p.alert?.level === 'warning' || p.alert?.level === 'critical') {
          await processVitalsAlert({
            heartRate: p.vitals.heartRate,
            systolic: p.vitals.systolic,
            diastolic: p.vitals.diastolic,
            spo2: p.vitals.spo2,
            patientId: p.id,
            patientName: p.name,
            notifyLocal: false,
          });
        }
      }

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

  const openPatientDetail = useCallback(
    (item) => {
      navigation.navigate('PatientDetail', {
        patientId: item.id,
        vitals: item.vitals,
        alert: item.alert,
        lastMeasuredAt: item.lastMeasuredAt,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PressableScale
        onPress={() => openPatientDetail(item)}
        accessibilityRole="button"
        accessibilityLabel={`Abrir paciente ${item.name || '—'}`}
        style={styles.cardPressable}
      >
        <DoctorPatientCard
          name={item.name}
          email={item.email}
          lastMeasuredLabel={`Última medición: ${formatRelativeTime(item.lastMeasuredAt)}`}
          alert={item.alert}
          vitals={item.vitals}
          onPressDetail={() => openPatientDetail(item)}
        />
      </PressableScale>
    ),
    [openPatientDetail, styles.cardPressable]
  );

  const listContentStyle = useMemo(
    () => tabListContent(insets, { paddingBottom: spacing.xxl + insets.bottom }),
    [insets]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling accessibilityRole="header">
          Panel clínico
        </Text>
        <Text style={styles.headerSub} allowFontScaling>
          Pacientes vinculados ({patients.length})
          {statusFilter !== 'all' ? ` · mostrando ${filteredPatients.length}` : ''}
        </Text>
        <FilterChipBar
          options={FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          style={styles.filterBar}
        />
        <Text style={styles.sectionHeading} allowFontScaling>
          Métricas vitales
        </Text>
        <VitalsStatusLegend style={styles.legend} />
      </View>
    ),
    [patients.length, styles]
  );

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredWrap}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText} allowFontScaling>
            Cargando panel clínico...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!doctor || doctor.role !== ROLES.DOCTOR) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredWrap}>
        <View style={styles.centered}>
          <Text style={styles.forbidden} allowFontScaling>
            Acceso restringido. Este panel es exclusivo para médicos.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={listContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={styles.listFooter} />}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle} allowFontScaling>
              Sin pacientes conectados
            </Text>
            <Text style={styles.emptyText} allowFontScaling>
              Vincula pacientes desde la pestaña «Pacientes» para ver sus métricas aquí.
            </Text>
          </Card>
        }
      />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    centeredWrap: {
      flexGrow: 1,
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
    header: {
      marginBottom: spacing.lg,
    },
    headerTitle: {
      ...typography.title,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    headerSub: {
      marginTop: spacing.xs,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: spacing.m,
    },
    sectionHeading: {
      ...createSectionHeadingStyle(colors),
      marginTop: spacing.s,
    },
    filterBar: {
      marginBottom: spacing.m,
    },
    legend: {
      marginBottom: spacing.lg,
    },
    cardPressable: {
      marginBottom: spacing.md,
    },
    listFooter: {
      height: spacing.lg,
    },
    emptyCard: {
      padding: spacing.lg,
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
