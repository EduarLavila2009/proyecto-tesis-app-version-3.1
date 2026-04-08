import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { Card, Button, Input, StatBox } from '../components';
import { spacing, typography, useTheme } from '../theme';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
import { getMedicalRecordsByUser } from '../services/medicalRecordsService';

/**
 * Detalle de paciente - Solo lectura
 * Recibe patientId por route.params, busca en USERS y muestra historial médico.
 */
export default function PatientDetailScreen({ route }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { patientId } = route.params || {};
  const incomingVitals = route.params?.vitals;
  const incomingAlert = route.params?.alert;
  const incomingLastMeasuredAt = route.params?.lastMeasuredAt;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [vitals, setVitals] = useState(() =>
    incomingVitals && typeof incomingVitals === 'object'
      ? incomingVitals
      : {
          heartRate: 82,
          systolic: 118,
          diastolic: 76,
          temp: 36.6,
          spo2: 98,
        }
  );
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [lastMeasuredAt, setLastMeasuredAt] = useState(
    typeof incomingLastMeasuredAt === 'number'
      ? new Date(incomingLastMeasuredAt)
      : null
  );

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      let users = [];
      if (usersJson) {
        try {
          users = JSON.parse(usersJson);
        } catch (_) {}
      }
      const found = users.find((u) => u.id === patientId);
      setPatient(found || null);

      // Cargar historial real de métricas del paciente
      const records = await getMedicalRecordsByUser(patientId);
      setMedicalRecords(records);
      const latest = records[0];

      // Si no se pasaron valores desde la lista, usamos la última medición real
      if (!incomingVitals && latest?.bloodPressure) {
        setVitals({
          heartRate: latest.heartRate,
          temp: latest.temperature,
          systolic: latest.bloodPressure.systolic,
          diastolic: latest.bloodPressure.diastolic,
          spo2: latest.oxygen,
        });
      }

      // Última medición (fecha real)
      if (!incomingLastMeasuredAt && latest?.date) {
        setLastMeasuredAt(new Date(latest.date));
      }
    } catch (error) {
      console.error('Error al cargar paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText} allowFontScaling>
            Cargando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText} allowFontScaling>
            Paciente no encontrado.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const h = patient.medicalHistory || {};
  const hasHistory =
    [h.bloodType, h.allergies, h.chronicDiseases, h.medications, h.notes].some(
      (v) => v && String(v).trim()
    );

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.label} allowFontScaling>
        {label}
      </Text>
      <Text style={styles.value} allowFontScaling>
        {value && String(value).trim() ? value : '—'}
      </Text>
    </View>
  );

  const alertStatus =
    incomingAlert && typeof incomingAlert === 'object'
      ? incomingAlert
      : evaluateMonitoringAlert(
          vitals.heartRate,
          vitals.systolic,
          vitals.diastolic,
          vitals.spo2
        );

  const level = alertStatus?.level || 'stable';
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

  const bpLabel = `${vitals.systolic}/${vitals.diastolic}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.block}>
          <View style={styles.titleRow}>
            <Text style={styles.blockTitle} allowFontScaling>
              Estado clínico
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling>
                {alertStatus?.title || 'Estable'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} allowFontScaling>
            {alertStatus?.subtitle || '—'}
          </Text>
          {lastMeasuredAt ? (
            <Text style={styles.metaLine} allowFontScaling>
              Última medición: {lastMeasuredAt.toLocaleString()}
            </Text>
          ) : null}
        </Card>

        <Text style={styles.sectionHeading} allowFontScaling>
          Métricas
        </Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <StatBox value={vitals.heartRate} label="FC (bpm)" style={styles.metricCell} />
            <StatBox value={`${vitals.temp.toFixed(1)} °C`} label="Temp" style={styles.metricCell} />
          </View>
          <View style={[styles.metricsRow, { marginTop: spacing.sm }]}>
            <StatBox value={bpLabel} label="Presión" style={styles.metricCell} />
            <StatBox value={`${vitals.spo2}%`} label="SpO₂" style={styles.metricCell} />
          </View>
        </View>

        <Card style={styles.block}>
          <Text style={styles.blockTitle} allowFontScaling>
            Historial de métricas
          </Text>
          {medicalRecords && medicalRecords.length > 0 ? (
            medicalRecords.slice(0, 5).map((r) => (
              <View key={r.id} style={styles.recordLine}>
                <Text style={styles.recordWhen} allowFontScaling>
                  {r.date ? new Date(r.date).toLocaleString() : '—'}
                </Text>
                <Text style={styles.recordValues} allowFontScaling>
                  FC {r.heartRate ?? '—'} · Temp{' '}
                  {typeof r.temperature === 'number' ? r.temperature.toFixed(1) : '—'} °C · PA{' '}
                  {r.bloodPressure?.systolic != null && r.bloodPressure?.diastolic != null
                    ? `${r.bloodPressure.systolic}/${r.bloodPressure.diastolic}`
                    : '—'}{' '}
                  mmHg · SpO₂ {r.oxygen ?? '—'}%
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData} allowFontScaling>
              Sin métricas registradas para este paciente.
            </Text>
          )}
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockTitle} allowFontScaling>
            Datos del paciente
          </Text>
          <Row label="Nombre" value={patient.name} />
          <Row label="ID" value={patient.id} />
          <Row label="Correo" value={patient.email} />
          <Row label="Teléfono" value={patient.phone} />
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockTitle} allowFontScaling>
            Acciones
          </Text>
          <Button
            title="Ver historial"
            onPress={() => {
              const summary = hasHistory
                ? `Sangre: ${h.bloodType || '—'}\nAlergias: ${h.allergies || '—'}\nCrónicas: ${
                    h.chronicDiseases || '—'
                  }\nMedicamentos: ${h.medications || '—'}\nNotas: ${h.notes || '—'}`
                : 'Sin datos médicos registrados.';
              Alert.alert('Historial médico', summary, [{ text: 'Cerrar' }]);
            }}
            style={styles.actionBtn}
            accessibilityLabel="Ver historial médico del paciente"
          />
          <Button
            title="Contactar"
            onPress={() => {
              const contact = `Correo: ${patient.email || '—'}\nTeléfono: ${patient.phone || '—'}`;
              Alert.alert(
                'Contacto (simulado)',
                `${contact}\n\nEn producción aquí se abriría chat, llamada o teleconsulta.`,
                [{ text: 'OK' }]
              );
            }}
            style={styles.actionBtnLast}
            accessibilityLabel="Contactar al paciente"
          />
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockTitle} allowFontScaling>
            Notas médicas (simulado)
          </Text>
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="Escribe una nota clínica..."
            multiline
            style={styles.notesInput}
            accessibilityLabel="Notas médicas"
          />
          <Button
            title="Guardar nota"
            onPress={() =>
              Alert.alert(
                'Nota guardada',
                'Se guardó de forma simulada (sin backend).',
                [{ text: 'OK' }]
              )
            }
            style={styles.actionBtnLast}
            accessibilityLabel="Guardar nota médica simulada"
          />
        </Card>

        <Card style={styles.block}>
          <Text style={styles.blockTitle} allowFontScaling>
            Historial médico (registro del paciente)
          </Text>
          {hasHistory ? (
            <>
              <Row label="Tipo de sangre" value={h.bloodType} />
              <Row label="Alergias" value={h.allergies} />
              <Row label="Enfermedades crónicas" value={h.chronicDiseases} />
              <Row label="Medicamentos actuales" value={h.medications} />
              <Row label="Notas adicionales" value={h.notes} />
            </>
          ) : (
            <Text style={styles.noData} allowFontScaling>
              Sin datos médicos registrados.
            </Text>
          )}
        </Card>
      </ScrollView>
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
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
    },
    loadingText: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    errorText: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.screen,
    },
    sectionHeading: {
      fontSize: typography.caption.fontSize,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    block: {
      padding: spacing.lg,
      borderRadius: spacing.radiusLg,
      marginBottom: spacing.lg,
    },
    blockTitle: {
      fontSize: typography.subtitle.fontSize,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.sm,
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
    subtitle: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: typography.body.fontSize * 1.45,
    },
    metaLine: {
      marginTop: spacing.sm,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    metricsGrid: {
      marginBottom: spacing.lg,
    },
    recordLine: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    recordWhen: {
      fontSize: typography.caption.fontSize,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.xs / 2,
    },
    recordValues: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      color: colors.textPrimary,
      lineHeight: typography.body.fontSize * 1.45,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    metricCell: {
      flex: 1,
      minWidth: 0,
    },
    row: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
    },
    noData: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    actionBtn: {
      width: '100%',
      minHeight: spacing.minTouchTarget,
      marginBottom: spacing.md,
    },
    actionBtnLast: {
      width: '100%',
      minHeight: spacing.minTouchTarget,
      marginBottom: 0,
      marginTop: spacing.md,
    },
    notesInput: {
      minHeight: 120,
      textAlignVertical: 'top',
      paddingTop: spacing.md - 2,
    },
  });
}
