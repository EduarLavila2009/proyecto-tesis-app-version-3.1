import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import * as storageService from '../services/storageService';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  TextInputField,
  MetricTile,
  VitalsStatusLegend,
  ScreenContainer,
  PatientClinicalStatusCard,
  PatientIdentityHeader,
  SectionCard,
  SaveFeedbackBanner,
  VitalsMiniGraph,
  GlassmorphicCard,
  PressableScale,
} from '../components';
import { useSaveFeedback } from '../hooks/useSaveFeedback';
import { getNotesForPatient, addMedicalNote } from '../services/medicalNotesService';
import {
  spacing,
  typography,
  layout,
  stackScrollContent,
  useTheme,
  createSectionHeadingStyle,
} from '../theme';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
import { evaluatePredictiveTriage } from '../utils/vitalsTrends';
import { exportMedicalHistoryToPdf } from '../services/pdfReportService';
import { alertLevelForMetric } from '../utils/vitalsMetricAlerts';
import { getMedicalRecordsByUser } from '../services/medicalRecordsService';

/**
 * Detalle de paciente - Solo lectura
 * Recibe patientId por route.params, busca en USERS y muestra historial médico.
 */
export default function PatientDetailScreen({ route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { patientId } = route.params || {};
  const incomingVitals = route.params?.vitals;
  const incomingAlert = route.params?.alert;
  const incomingLastMeasuredAt = route.params?.lastMeasuredAt;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [doctorUser, setDoctorUser] = useState(null);
  const { feedbackMessage, showSuccess, clearFeedback } = useSaveFeedback();
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

  const predictiveAlert = useMemo(() => {
    return evaluatePredictiveTriage(medicalRecords);
  }, [medicalRecords]);

  const [graphMetric, setGraphMetric] = useState('hr'); // 'hr' | 'bp' | 'spo2' | 'temp'

  const activeTrendData = useMemo(() => {
    if (medicalRecords.length === 0) {
      if (graphMetric === 'temp') return [vitals.temp];
      if (graphMetric === 'bp') return [vitals.systolic];
      if (graphMetric === 'spo2') return [vitals.spo2];
      return [vitals.heartRate];
    }
    const list = [...medicalRecords].reverse();
    if (graphMetric === 'temp') {
      const vals = list.map((r) => r.temperature).filter((t) => typeof t === 'number' && t > 0);
      return vals.length > 0 ? vals : [vitals.temp];
    }
    if (graphMetric === 'bp') {
      const vals = list.map((r) => r.bloodPressure?.systolic || r.systolic).filter((b) => typeof b === 'number' && b > 0);
      return vals.length > 0 ? vals : [vitals.systolic];
    }
    if (graphMetric === 'spo2') {
      const vals = list.map((r) => r.oxygen).filter((o) => typeof o === 'number' && o > 0);
      return vals.length > 0 ? vals : [vitals.spo2];
    }
    const vals = list.map((r) => r.heartRate).filter((hr) => typeof hr === 'number' && hr > 0);
    return vals.length > 0 ? vals : [vitals.heartRate];
  }, [medicalRecords, graphMetric, vitals]);

  const activeGraphDetails = useMemo(() => {
    switch (graphMetric) {
      case 'temp':
        return {
          label: 'Evolución de Temperatura (°C)',
          color: '#F97316',
        };
      case 'bp':
        return {
          label: 'Presión Arterial Sistólica (mmHg)',
          color: '#22C55E',
        };
      case 'spo2':
        return {
          label: 'Oxígeno en Sangre (SpO₂ %)',
          color: '#06B6D4',
        };
      default:
        return {
          label: 'Ritmo Cardíaco (bpm)',
          color: colors.primary,
        };
    }
  }, [graphMetric, colors]);

  const handleExportPdf = useCallback(async () => {
    if (!patient) return;
    const historyData = patient.medicalHistory || {};
    await exportMedicalHistoryToPdf(patient.name || 'Paciente', medicalRecords, historyData);
  }, [patient, medicalRecords]);

  const loadClinicalNotes = useCallback(async (pid, did) => {
    if (!pid) return;
    const list = await getNotesForPatient(pid, did);
    setClinicalNotes(list);
  }, []);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      const sessionRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let doc = null;
      if (sessionRaw) {
        try {
          doc = JSON.parse(sessionRaw);
          setDoctorUser(doc);
        } catch (_) {}
      }

      const users = await storageService.getUsers();
      const found = users.find((u) => u.id === patientId);
      setPatient(found || null);

      const records = await getMedicalRecordsByUser(patientId);
      setMedicalRecords(records);
      const latest = records[0];

      if (!incomingVitals && latest?.bloodPressure) {
        setVitals({
          heartRate: latest.heartRate,
          temp: latest.temperature,
          systolic: latest.bloodPressure.systolic,
          diastolic: latest.bloodPressure.diastolic,
          spo2: latest.oxygen,
        });
      }

      if (!incomingLastMeasuredAt && latest?.date) {
        setLastMeasuredAt(new Date(latest.date));
      }

      await loadClinicalNotes(patientId, doc?.id);
    } catch (error) {
      console.error('Error al cargar paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredWrap}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText} allowFontScaling>
            Cargando...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!patient) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredWrap}>
        <View style={styles.centered}>
          <Text style={styles.errorText} allowFontScaling>
            Paciente no encontrado.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const h = patient.medicalHistory || {};
  const hasHistory =
    [h.bloodType, h.allergies, h.chronicDiseases, h.medications, h.notes].some(
      (v) => v && String(v).trim()
    );

  const DataRow = ({ label, value, icon }) => (
    <View style={styles.dataRow}>
      {icon ? (
        <View style={styles.dataIconWrap}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.dataTextCol}>
        <Text style={styles.label} allowFontScaling>
          {label}
        </Text>
        <Text style={styles.value} allowFontScaling>
          {value && String(value).trim() ? value : '—'}
        </Text>
      </View>
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
  const bpLabel = `${vitals.systolic}/${vitals.diastolic}`;
  const reasons = alertStatus?.reasons ?? [];

  const metricItems = [
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
  ];

  const lastMeasuredLabel = lastMeasuredAt
    ? `Última medición: ${lastMeasuredAt.toLocaleString()}`
    : null;

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={stackScrollContent(insets, {
        maxWidth: layout.contentMaxWidth,
        alignSelf: 'center',
        width: '100%',
      })}
      scrollProps={{ showsVerticalScrollIndicator: false }}
    >
      <SaveFeedbackBanner message={feedbackMessage} onHidden={clearFeedback} />

      {/* Identidad — contexto rápido del paciente */}
      <PatientIdentityHeader
        name={patient.name}
        email={patient.email}
        patientId={patient.id}
      />

      {/* Estado clínico — hero con borde de acento y caja de observación */}
      <PatientClinicalStatusCard
        statusTitle={alertStatus?.title || 'Estable'}
        statusSubtitle={alertStatus?.subtitle || '—'}
        lastMeasuredLabel={lastMeasuredLabel}
        level={level}
      />

      {/* Triage predictivo longitudinal (alerta preventiva) */}
      {predictiveAlert && predictiveAlert.level !== 'stable' ? (
        <Card style={[styles.trendAlertCard, { borderColor: predictiveAlert.level === 'critical' ? colors.danger : colors.warning, marginBottom: spacing.lg }]}>
          <View style={styles.trendAlertHeader}>
            <Ionicons 
              name={predictiveAlert.level === 'critical' ? 'shield-outline' : 'warning-outline'} 
              size={22} 
              color={predictiveAlert.level === 'critical' ? colors.danger : colors.warning} 
            />
            <Text style={[styles.trendAlertTitle, { color: predictiveAlert.level === 'critical' ? colors.danger : colors.warning }]}>
              {predictiveAlert.title}
            </Text>
          </View>
          <Text style={styles.trendAlertText}>{predictiveAlert.message}</Text>
        </Card>
      ) : null}

      {/* Gráfico y selector interactivo de tendencias */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Gráfica de Tendencia Clínica
      </Text>
      <View style={styles.graphSelectorRow}>
        {[
          { id: 'hr', label: 'Ritmo C.' },
          { id: 'bp', label: 'Presión S.' },
          { id: 'spo2', label: 'Oxígeno' },
          { id: 'temp', label: 'Temp.' },
        ].map((opt) => (
          <PressableScale
            key={opt.id}
            onPress={() => {
              try {
                const Haptics = require('expo-haptics');
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              } catch (_) {}
              setGraphMetric(opt.id);
            }}
            style={[
              styles.graphSelectorBtn,
              graphMetric === opt.id && styles.graphSelectorBtnActive,
            ]}
          >
            <Text
              style={[
                styles.graphSelectorText,
                graphMetric === opt.id && styles.graphSelectorTextActive,
              ]}
              allowFontScaling
            >
              {opt.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {medicalRecords.length > 0 ? (
        <GlassmorphicCard style={{ marginBottom: spacing.lg }}>
          <VitalsMiniGraph
            data={activeTrendData}
            label={activeGraphDetails.label}
            colorAccent={activeGraphDetails.color}
          />
        </GlassmorphicCard>
      ) : (
        <Card style={{ padding: spacing.md, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
            No hay suficientes mediciones para trazar la gráfica de tendencias del paciente.
          </Text>
        </Card>
      )}

      {/* Métricas vitales — grid 2×2 responsive */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Métricas vitales
      </Text>
      <VitalsStatusLegend style={styles.legend} />
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
              style={styles.metricTileFull}
            />
          </View>
        ))}
      </View>

      {/* Historial de métricas — líneas tipo timeline */}
      <SectionCard title="Historial de métricas" icon="analytics-outline">
        {medicalRecords && medicalRecords.length > 0 ? (
          medicalRecords.slice(0, 5).map((r, index) => (
            <View
              key={r.id}
              style={[
                styles.recordLine,
                index === 0 && styles.recordLineFirst,
                index === Math.min(medicalRecords.length, 5) - 1 && styles.recordLineLast,
              ]}
            >
              <View style={styles.recordIconWrap}>
                <Ionicons name="pulse-outline" size={16} color={colors.secondary} />
              </View>
              <View style={styles.recordBody}>
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
            </View>
          ))
        ) : (
          <Text style={styles.noData} allowFontScaling>
            Sin métricas registradas para este paciente.
          </Text>
        )}
      </SectionCard>

      {/* Datos del paciente — filas con icono */}
      <SectionCard title="Datos del paciente" icon="person-outline">
        <DataRow label="Nombre" value={patient.name} icon="person-outline" />
        <View style={styles.rowDivider} />
        <DataRow label="ID" value={patient.id} icon="finger-print-outline" />
        <View style={styles.rowDivider} />
        <DataRow label="Correo" value={patient.email} icon="mail-outline" />
        <View style={styles.rowDivider} />
        <DataRow label="Teléfono" value={patient.phone} icon="call-outline" />
      </SectionCard>

      {/* Acciones — botones destacados en fila */}
      <Card style={styles.actionsCard}>
        <Text style={styles.actionsTitle} allowFontScaling>
          Acciones
        </Text>
        <View style={styles.actionsRow}>
          <PrimaryButton
            title="Exportar PDF"
            icon="document-text-outline"
            onPress={handleExportPdf}
            style={styles.actionBtn}
            accessibilityLabel="Exportar Historial Médico del paciente a PDF"
          />
          <View style={styles.actionGap} />
          <SecondaryButton
            title="Videollamada"
            icon="videocam-outline"
            appearance="outline"
            onPress={() => {
              navigation.navigate('VideoCall', { contactName: patient.name || 'Paciente', role: 'patient' });
            }}
            style={styles.actionBtn}
            accessibilityLabel="Iniciar teleconsulta con el paciente"
          />
        </View>
      </Card>

      {/* Notas médicas — historial consultable (local) */}
      <SectionCard title="Notas médicas (simulado)" icon="create-outline">
        <TextInputField
          value={note}
          onChangeText={setNote}
          placeholder="Escribe una nota clínica..."
          multiline
          numberOfLines={4}
          style={styles.notesInput}
          accessibilityLabel="Notas médicas"
        />
        <PrimaryButton
          title="Guardar nota"
          onPress={async () => {
            if (!doctorUser?.id) {
              Alert.alert('Error', 'Sesión de médico no disponible.');
              return;
            }
            const res = await addMedicalNote({
              doctorId: doctorUser.id,
              doctorName: doctorUser.name,
              patientId,
              text: note,
            });
            if (res.success) {
              setNote('');
              showSuccess('Nota guardada en el historial');
              loadClinicalNotes(patientId, doctorUser.id);
            } else {
              Alert.alert('Error', res.error || 'No se pudo guardar la nota');
            }
          }}
          style={styles.saveNoteBtn}
          accessibilityLabel="Guardar nota médica simulada"
        />
        {clinicalNotes.length > 0 ? (
          <View style={styles.notesHistory}>
            <Text style={styles.notesHistoryTitle} allowFontScaling>
              Historial de notas
            </Text>
            {clinicalNotes.map((n) => (
              <View key={n.id} style={styles.noteItem}>
                <Text style={styles.noteMeta} allowFontScaling>
                  {new Date(n.createdAt).toLocaleString()} · {n.doctorName}
                </Text>
                <Text style={styles.noteBody} allowFontScaling>
                  {n.text}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData} allowFontScaling>
            Aún no hay notas para este paciente.
          </Text>
        )}
      </SectionCard>

      {/* Historial médico (registro del paciente) */}
      <SectionCard title="Historial médico (registro del paciente)" icon="medkit-outline">
        {hasHistory ? (
          <>
            <DataRow label="Tipo de sangre" value={h.bloodType} />
            <View style={styles.rowDivider} />
            <DataRow label="Alergias" value={h.allergies} />
            <View style={styles.rowDivider} />
            <DataRow label="Enfermedades crónicas" value={h.chronicDiseases} />
            <View style={styles.rowDivider} />
            <DataRow label="Medicamentos actuales" value={h.medications} />
            <View style={styles.rowDivider} />
            <DataRow label="Notas adicionales" value={h.notes} />
          </>
        ) : (
          <Text style={styles.noData} allowFontScaling>
            Sin datos médicos registrados.
          </Text>
        )}
      </SectionCard>

      <View style={styles.scrollFooter} />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    centeredWrap: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    centered: {
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
    sectionHeading: {
      ...createSectionHeadingStyle(colors),
      marginTop: 0,
    },
    legend: {
      marginBottom: spacing.m,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    metricCell: {
      width: '48%',
      flexGrow: 1,
      minWidth: 136,
    },
    metricTileFull: {
      width: '100%',
    },
    recordLine: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.m,
      paddingVertical: spacing.m,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    recordLineFirst: {
      borderTopWidth: 0,
      paddingTop: 0,
    },
    recordLineLast: {
      paddingBottom: 0,
    },
    recordIconWrap: {
      width: 32,
      height: 32,
      borderRadius: spacing.radiusButton,
      backgroundColor: colors.secondaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordBody: {
      flex: 1,
      minWidth: 0,
    },
    recordWhen: {
      fontSize: typography.caption.fontSize,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    recordValues: {
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
      lineHeight: typography.body.fontSize * 1.45,
    },
    dataRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.m,
      paddingVertical: spacing.sm,
    },
    dataIconWrap: {
      width: 32,
      height: 32,
      borderRadius: spacing.radiusButton,
      backgroundColor: `${colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dataTextCol: {
      flex: 1,
      minWidth: 0,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginLeft: 32 + spacing.m,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
    },
    noData: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: typography.body.fontSize * 1.45,
    },
    actionsCard: {
      marginBottom: spacing.lg,
      padding: spacing.l,
      backgroundColor: `${colors.primary}08`,
      borderColor: `${colors.primary}22`,
    },
    actionsTitle: {
      ...typography.subtitle,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.m,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
      minHeight: spacing.minTouchTarget + spacing.xs,
    },
    actionGap: {
      width: spacing.sm,
    },
    notesInput: {
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: spacing.m,
    },
    saveNoteBtn: {
      width: '100%',
    },
    notesHistory: {
      marginTop: spacing.lg,
    },
    notesHistoryTitle: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    noteItem: {
      paddingVertical: spacing.m,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    noteMeta: {
      ...typography.caption,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    noteBody: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: typography.body.lineHeight * 1.35,
    },
    scrollFooter: {
      height: spacing.l,
    },
    trendAlertCard: {
      padding: spacing.md,
      borderWidth: 1.5,
      borderRadius: spacing.radiusCard,
      backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    trendAlertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    trendAlertTitle: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    trendAlertText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 17,
      paddingLeft: 22 + spacing.sm,
    },
    graphSelectorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    graphSelectorBtn: {
      flex: 1,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: spacing.radiusInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    graphSelectorBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    graphSelectorText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    graphSelectorTextActive: {
      color: '#FFFFFF',
    },
  });
}
