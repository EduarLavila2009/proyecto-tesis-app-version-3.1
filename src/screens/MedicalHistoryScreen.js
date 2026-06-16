import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import * as storageService from '../services/storageService';
import {
  TextInputField,
  DropdownSelect,
  MetricTile,
  HistoryRecordCard,
  VitalsMiniGraph,
  GlassmorphicCard,
  PressableScale,
} from '../components';

const BLOOD_TYPE_OPTIONS = [
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
];

import {
  spacing,
  typography,
  layout,
  useTheme,
  createSectionHeadingStyle,
  createFieldGroupStyle,
} from '../theme';
import { useMetricsGridLayout } from '../hooks/useMetricsGridLayout';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
import { evaluatePredictiveTriage } from '../utils/vitalsTrends';
import { exportMedicalHistoryToPdf } from '../services/pdfReportService';
import {
  addMedicalRecord,
  getMedicalRecordsByUser,
} from '../services/medicalRecordsService';

function formatRecordDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function alertLevelForMetric(reasons, prefix) {
  if (!reasons?.length) return undefined;
  const related = reasons.filter((r) => r.code.startsWith(prefix));
  if (related.some((r) => r.severity === 'critical')) return 'critical';
  if (related.some((r) => r.severity === 'warning')) return 'warning';
  return undefined;
}

function GlassFormPanel({ title, icon, children, colors, styles }) {
  return (
    <GlassmorphicCard style={styles.formPanelCard}>
      <View style={styles.formPanelHeader}>
        <View style={styles.formPanelIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.formPanelTitle}>{title}</Text>
      </View>
      <View style={styles.formPanelBody}>
        {children}
      </View>
    </GlassmorphicCard>
  );
}

export default function MedicalHistoryScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { gridStyle, tileWidth } = useMetricsGridLayout();
  const listRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');

  const [heartRateInput, setHeartRateInput] = useState('');
  const [temperatureInput, setTemperatureInput] = useState('');
  const [bpSystolicInput, setBpSystolicInput] = useState('');
  const [bpDiastolicInput, setBpDiastolicInput] = useState('');
  const [oxygenInput, setOxygenInput] = useState('');

  // Estado del Filtro de chips superior deslizable
  const [activeFilter, setActiveFilter] = useState('todo');

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  const latestRecord = medicalRecords[0] ?? null;

  const latestVitals = useMemo(() => {
    if (!latestRecord) return null;
    const systolic = latestRecord?.bloodPressure?.systolic;
    const diastolic = latestRecord?.bloodPressure?.diastolic;
    return {
      heartRate: latestRecord.heartRate,
      temperature: latestRecord.temperature,
      systolic,
      diastolic,
      oxygen: latestRecord.oxygen,
      bpLabel:
        typeof systolic === 'number' && typeof diastolic === 'number'
          ? `${systolic}/${diastolic}`
          : '—',
    };
  }, [latestRecord]);

  const latestAlertStatus = useMemo(() => {
    if (!latestVitals) return null;
    const { heartRate, systolic, diastolic, oxygen } = latestVitals;
    if (
      typeof heartRate !== 'number' ||
      typeof systolic !== 'number' ||
      typeof diastolic !== 'number'
    ) {
      return null;
    }
    return evaluateMonitoringAlert(heartRate, systolic, diastolic, oxygen);
  }, [latestVitals]);

  const predictiveAlert = useMemo(() => {
    return evaluatePredictiveTriage(medicalRecords);
  }, [medicalRecords]);

  const handleExportPdf = useCallback(async () => {
    if (!user) return;
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const historyData = {
      bloodType,
      allergies,
      chronicDiseases,
      medications,
      notes,
    };
    await exportMedicalHistoryToPdf(user.name || 'Paciente', medicalRecords, historyData);
  }, [user, medicalRecords, bloodType, allergies, chronicDiseases, medications, notes]);

  const [graphMetric, setGraphMetric] = useState('hr'); // 'hr' | 'bp' | 'spo2' | 'temp'

  const activeTrendData = useMemo(() => {
    if (medicalRecords.length === 0) {
      if (graphMetric === 'temp') return [36.5, 36.7, 36.8, 36.4, 36.6];
      if (graphMetric === 'bp') return [120, 118, 122, 115, 121];
      if (graphMetric === 'spo2') return [98, 97, 99, 96, 98];
      return [72, 75, 82, 68, 88, 79, 74];
    }
    const list = [...medicalRecords].reverse();
    if (graphMetric === 'temp') {
      const vals = list.map((r) => r.temperature).filter((t) => typeof t === 'number' && t > 0);
      return vals.length > 0 ? vals : [36.5, 36.7, 36.8, 36.4, 36.6];
    }
    if (graphMetric === 'bp') {
      const vals = list.map((r) => r.bloodPressure?.systolic || r.systolic).filter((b) => typeof b === 'number' && b > 0);
      return vals.length > 0 ? vals : [120, 118, 122, 115, 121];
    }
    if (graphMetric === 'spo2') {
      const vals = list.map((r) => r.oxygen).filter((o) => typeof o === 'number' && o > 0);
      return vals.length > 0 ? vals : [98, 97, 99, 96, 98];
    }
    const vals = list.map((r) => r.heartRate).filter((hr) => typeof hr === 'number' && hr > 0);
    return vals.length > 0 ? vals : [72, 75, 82, 68, 88, 79, 74];
  }, [medicalRecords, graphMetric]);

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

  const latestMetricTiles = useMemo(() => {
    if (!latestVitals) return [];
    const reasons = latestAlertStatus?.reasons ?? [];
    const temp =
      typeof latestVitals.temperature === 'number'
        ? `${latestVitals.temperature.toFixed(1)} °C`
        : '—';
    return [
      {
        id: 'hr',
        icon: 'heart',
        value: `${latestVitals.heartRate ?? '—'} bpm`,
        label: 'Ritmo cardíaco',
        alertLevel: alertLevelForMetric(reasons, 'HR_'),
      },
      {
        id: 'temp',
        icon: 'temperature',
        value: temp,
        label: 'Temperatura',
      },
      {
        id: 'bp',
        icon: 'blood',
        value: latestVitals.bpLabel,
        label: 'Presión arterial',
        alertLevel: alertLevelForMetric(reasons, 'BP_'),
      },
      {
        id: 'spo2',
        icon: 'lungs',
        value: `${latestVitals.oxygen ?? '—'}%`,
        label: 'Oxígeno (SpO₂)',
        alertLevel: alertLevelForMetric(reasons, 'SPO2_'),
      },
    ];
  }, [latestVitals, latestAlertStatus]);

  useEffect(() => {
    loadUserAndHistory();
  }, []);

  const loadUserAndHistory = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!userJson) {
        setLoading(false);
        return;
      }
      const data = JSON.parse(userJson);
      if (data.role !== ROLES.PATIENT) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(data);
      const h = data.medicalHistory || DEFAULT_MEDICAL_HISTORY;
      setBloodType(h.bloodType || '');
      setAllergies(h.allergies || '');
      setChronicDiseases(h.chronicDiseases || '');
      setMedications(h.medications || '');
      setNotes(h.notes || '');

      if (data?.id) {
        const records = await getMedicalRecordsByUser(data.id);
        setMedicalRecords(records);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!user) return;

    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const medicalHistory = {
      bloodType: bloodType.trim(),
      allergies: allergies.trim(),
      chronicDiseases: chronicDiseases.trim(),
      medications: medications.trim(),
      notes: notes.trim(),
    };

    try {
      const updatedUser = { ...user, medicalHistory };

      await storageService.saveUser(updatedUser);

      if (user.id) {
        await storageService.updateUserInList({ id: user.id, medicalHistory });
      }

      setUser(updatedUser);
      Alert.alert('Éxito', 'Historial actualizado correctamente.');
    } catch (error) {
      console.error('Error al guardar historial:', error);
      Alert.alert('Error', 'No se pudo guardar el historial.');
    }
  }, [user, bloodType, allergies, chronicDiseases, medications, notes]);

  const handleAddMeasurement = useCallback(async () => {
    if (!user?.id) return;

    const heartRate = Number(heartRateInput);
    const temperature = Number(temperatureInput);
    const systolic = Number(bpSystolicInput);
    const diastolic = Number(bpDiastolicInput);
    const oxygen = Number(oxygenInput);

    const ok =
      Number.isFinite(heartRate) &&
      Number.isFinite(temperature) &&
      Number.isFinite(systolic) &&
      Number.isFinite(diastolic) &&
      Number.isFinite(oxygen);

    if (!ok) {
      Alert.alert(
        'Datos incompletos',
        'Completa valores numéricos: FC, temperatura, PA (sistólica/diastólica) y SpO₂.'
      );
      return;
    }

    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const res = await addMedicalRecord({
      userId: user.id,
      date: new Date(),
      heartRate,
      temperature,
      bloodPressure: { systolic, diastolic },
      oxygen,
    });

    if (!res.recorded) {
      Alert.alert('Error', res.error || 'No se pudo guardar el registro.');
      return;
    }

    const updated = await getMedicalRecordsByUser(user.id);
    setMedicalRecords(updated);
    setHeartRateInput('');
    setTemperatureInput('');
    setBpSystolicInput('');
    setBpDiastolicInput('');
    setOxygenInput('');
    Alert.alert('Guardado', 'Nueva medición guardada correctamente.');
  }, [
    user,
    heartRateInput,
    temperatureInput,
    bpSystolicInput,
    bpDiastolicInput,
    oxygenInput,
  ]);

  // Filtrado lógico de registros para el FlatList
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'todo') return medicalRecords;
    if (activeFilter === 'manual') return medicalRecords.filter(r => r.source !== 'auto' && r.source !== 'automatic');
    if (activeFilter === 'auto') return medicalRecords.filter(r => r.source === 'auto' || r.source === 'automatic');
    if (activeFilter === 'alertas') {
      return medicalRecords.filter(r => {
        const systolic = r?.bloodPressure?.systolic;
        const diastolic = r?.bloodPressure?.diastolic;
        if (typeof r.heartRate !== 'number' || typeof systolic !== 'number' || typeof diastolic !== 'number') return false;
        const alertStatus = evaluateMonitoringAlert(r.heartRate, systolic, diastolic, r.oxygen);
        return alertStatus && alertStatus.level !== 'stable';
      });
    }
    return medicalRecords;
  }, [medicalRecords, activeFilter]);

  const renderRecord = useCallback(
    ({ item }) => {
      const systolic = item?.bloodPressure?.systolic;
      const diastolic = item?.bloodPressure?.diastolic;
      const bpText =
        typeof systolic === 'number' && typeof diastolic === 'number'
          ? `${systolic}/${diastolic}`
          : '—';

      const alertStatus =
        typeof item.heartRate === 'number' &&
        typeof systolic === 'number' &&
        typeof diastolic === 'number'
          ? evaluateMonitoringAlert(item.heartRate, systolic, diastolic, item.oxygen)
          : null;

      return (
        <HistoryRecordCard
          dateLabel={formatRecordDate(item.date)}
          heartRate={item.heartRate}
          temperature={item.temperature}
          bloodPressureText={bpText}
          oxygen={item.oxygen}
          source={item.source}
          alertStatus={alertStatus}
        />
      );
    },
    []
  );

  const FILTER_OPTIONS = [
    { label: 'Todo', value: 'todo', icon: 'list' },
    { label: 'Automático', value: 'auto', icon: 'pulse' },
    { label: 'Manual', value: 'manual', icon: 'create' },
    { label: 'Alertas', value: 'alertas', icon: 'warning' },
  ];

  const listHeader = useCallback(
    () => {
      const predictiveGlow = predictiveAlert ? (predictiveAlert.level === 'stable' ? 'success' : predictiveAlert.level) : undefined;
      
      return (
        <View style={styles.listHeader}>
          {/* Cabecera Premium */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="folder-open-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.pageTitle} allowFontScaling accessibilityRole="header">
                  Historial Clínico
                </Text>
                <Text style={styles.sectionLabel} allowFontScaling>
                  Mediciones y ficha clínica en este dispositivo
                </Text>
              </View>
            </View>
          </View>

          {/* Triage predictivo longitudinal (alerta preventiva) */}
          {predictiveAlert && predictiveAlert.level !== 'stable' ? (
            <GlassmorphicCard
              style={styles.trendAlertCard}
              alertType={predictiveGlow}
            >
              <View style={styles.trendAlertHeader}>
                <Ionicons 
                  name={predictiveAlert.level === 'critical' ? 'shield-outline' : 'warning-outline'} 
                  size={20} 
                  color={predictiveAlert.level === 'critical' ? colors.danger : colors.warning} 
                />
                <Text style={[styles.trendAlertTitle, { color: predictiveAlert.level === 'critical' ? colors.danger : colors.warning }]}>
                  {predictiveAlert.title}
                </Text>
              </View>
              <Text style={styles.trendAlertText}>{predictiveAlert.message}</Text>
            </GlassmorphicCard>
          ) : null}

          {/* Acciones Rápidas con Gradientes y Haptics */}
          <View style={styles.quickActionsRow}>
            <PressableScale
              onPress={handleExportPdf}
              style={styles.quickActionBtn}
              accessibilityLabel="Exportar Historial Médico a PDF"
            >
              <LinearGradient
                colors={['#0F766E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Exportar PDF</Text>
              </LinearGradient>
            </PressableScale>
            
            <View style={styles.quickActionGap} />
            
            <PressableScale
              onPress={() => navigation.navigate('MedicalAI')}
              style={styles.quickActionBtn}
              accessibilityLabel="Abrir asistente de IA médica"
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradientBlue}
              >
                <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>IA Médica</Text>
              </LinearGradient>
            </PressableScale>
          </View>

          {/* Filtro Rápido Dinámico Deslizable */}
          <Text style={styles.sectionHeading} allowFontScaling>
            Filtrar Registros
          </Text>
          <View style={styles.chipBarWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTER_OPTIONS}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.chipBarContent}
              renderItem={({ item }) => {
                const isActive = activeFilter === item.value;
                const bgCol = isActive ? colors.primary : 'rgba(17, 24, 39, 0.4)';
                const borderCol = isActive ? colors.primary : 'rgba(255, 255, 255, 0.05)';
                const textCol = isActive ? '#FFFFFF' : colors.textSecondary;
                const iconCol = isActive ? '#FFFFFF' : colors.primary;

                const handleChipPress = () => {
                  try {
                    const Haptics = require('expo-haptics');
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync();
                    }
                  } catch (_) {}
                  setActiveFilter(item.value);
                };

                return (
                  <PressableScale
                    onPress={handleChipPress}
                    style={[styles.chip, { backgroundColor: bgCol, borderColor: borderCol }]}
                  >
                    <Ionicons name={item.icon + '-outline'} size={13} color={iconCol} style={styles.chipIcon} />
                    <Text style={[styles.chipText, { color: textCol }]}>{item.label}</Text>
                  </PressableScale>
                );
              }}
            />
          </View>

          {/* Gráfico y Métricas */}
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
            <GlassmorphicCard style={styles.graphContainerCard}>
              <VitalsMiniGraph
                data={activeTrendData}
                label={activeGraphDetails.label}
                colorAccent={activeGraphDetails.color}
              />
            </GlassmorphicCard>
          ) : null}

          <Text style={styles.sectionHeading} allowFontScaling>
            Métricas vitales
          </Text>
          <Text style={styles.sectionHint} allowFontScaling>
            {latestRecord
              ? `Última medición · ${formatRecordDate(latestRecord.date)}`
              : 'Sin mediciones — agrega la primera más abajo'}
          </Text>

          {latestMetricTiles.length > 0 ? (
            <View style={[styles.metricsGrid, gridStyle]}>
              {latestMetricTiles.map((tile) => (
                <MetricTile
                  key={tile.id}
                  icon={tile.icon}
                  value={tile.value}
                  label={tile.label}
                  width={tileWidth}
                  alertLevel={tile.alertLevel}
                />
              ))}
            </View>
          ) : (
            <GlassmorphicCard style={styles.emptyVitalsCard}>
              <Text style={styles.emptyVitalsText} allowFontScaling>
                Registra una medición para ver FC, temperatura, presión y oxígeno aquí.
              </Text>
            </GlassmorphicCard>
          )}

          <Text style={[styles.sectionHeading, styles.recordsHeading]} allowFontScaling>
            Últimos registros
          </Text>
          {filteredRecords.length === 0 ? (
            <Text style={styles.emptyRecordsHint} allowFontScaling>
              No hay registros que coincidan con el filtro seleccionado.
            </Text>
          ) : null}
        </View>
      );
    },
    [
      styles,
      navigation,
      latestRecord,
      latestMetricTiles,
      gridStyle,
      tileWidth,
      medicalRecords.length,
      filteredRecords.length,
      activeFilter,
      colors,
      predictiveAlert,
      activeTrendData,
      activeGraphDetails,
      graphMetric,
    ]
  );

  const listFooter = useCallback(
    () => {
      const triageLevel = latestAlertStatus?.level || 'stable';
      const triageGlow = triageLevel === 'stable' ? 'success' : triageLevel;

      return (
        <View style={styles.footer}>
          {/* Nueva Medición Form Panel */}
          <GlassFormPanel title="Agregar nueva medición" icon="add-circle-outline" colors={colors} styles={styles}>
            <TextInputField
              label="Ritmo cardíaco (bpm)"
              containerStyle={styles.fieldGroup}
              placeholder="Ej. 82"
              value={heartRateInput}
              onChangeText={setHeartRateInput}
              validationType="number"
              accessibilityLabel="Campo ritmo cardíaco"
            />

            <TextInputField
              label="Temperatura (°C)"
              containerStyle={styles.fieldGroup}
              placeholder="Ej. 36.6"
              value={temperatureInput}
              onChangeText={setTemperatureInput}
              validationType="number"
              accessibilityLabel="Campo temperatura"
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.sectionFieldLabel} allowFontScaling>
                Presión arterial (PA)
              </Text>
              <View style={styles.bpRow}>
                <TextInputField
                  containerStyle={styles.bpField}
                  placeholder="Sistólica"
                  value={bpSystolicInput}
                  onChangeText={setBpSystolicInput}
                  validationType="number"
                  accessibilityLabel="Campo sistólica"
                />
                <Text style={styles.bpSlash} allowFontScaling>
                  /
                </Text>
                <TextInputField
                  containerStyle={styles.bpField}
                  placeholder="Diastólica"
                  value={bpDiastolicInput}
                  onChangeText={setBpDiastolicInput}
                  validationType="number"
                  accessibilityLabel="Campo diastólica"
                />
              </View>
            </View>

            <TextInputField
              label="Oxígeno (SpO₂ %)"
              containerStyle={styles.fieldGroup}
              placeholder="Ej. 98"
              value={oxygenInput}
              onChangeText={setOxygenInput}
              validationType="number"
              accessibilityLabel="Campo oxígeno"
            />

            <PressableScale
              onPress={handleAddMeasurement}
              style={styles.saveBtnPressable}
            >
              <LinearGradient
                colors={['#0F766E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Text style={styles.saveBtnText}>Guardar medición</Text>
              </LinearGradient>
            </PressableScale>
          </GlassFormPanel>

          {/* Pasaporte Clínico de Identificación Digital */}
          <Text style={styles.sectionHeading} allowFontScaling>
            Pasaporte Clínico
          </Text>

          <GlassmorphicCard style={styles.idCard} alertType={triageGlow}>
            <View style={styles.passportHeader}>
              <View style={styles.passportBadgeIconWrap}>
                <Ionicons name="card" size={16} color={colors.primary} />
              </View>
              <Text style={styles.passportTitle}>PASAPORTE CLÍNICO DIGITAL</Text>
              <View style={[
                styles.passportStatusDot, 
                { backgroundColor: triageLevel === 'critical' ? colors.danger : triageLevel === 'warning' ? colors.warning : colors.success }
              ]} />
            </View>
            <View style={styles.passportBody}>
              <View style={styles.passportCol}>
                <Text style={styles.passportName}>{user?.name || 'Paciente'}</Text>
                <Text style={styles.idLabel}>ID ÚNICO PACIENTE</Text>
                <Text style={styles.idValue}>{user?.id || '—'}</Text>
                <Text style={styles.passportRole}>ROL: PACIENTE CO-MONITOREADO</Text>
              </View>
              <View style={styles.passportColRight}>
                <View style={styles.qrBackground}>
                  <Ionicons name="qr-code-outline" size={48} color={colors.textPrimary} />
                </View>
              </View>
            </View>
          </GlassmorphicCard>

          {/* Datos Clínicos Form Panel */}
          <GlassFormPanel title="Datos clínicos" icon="medical-outline" colors={colors} styles={styles}>
            <DropdownSelect
              label="Tipo de sangre"
              containerStyle={styles.fieldGroup}
              placeholder="Selecciona tipo de sangre"
              options={BLOOD_TYPE_OPTIONS}
              value={bloodType}
              onValueChange={setBloodType}
              accessibilityLabel="Tipo de sangre"
            />
            <TextInputField
              label="Alergias"
              containerStyle={styles.fieldGroup}
              placeholder="Alergias conocidas"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              numberOfLines={3}
              accessibilityLabel="Campo de alergias"
            />
            <TextInputField
              label="Enfermedades crónicas"
              containerStyle={styles.fieldGroup}
              placeholder="Enfermedades crónicas"
              value={chronicDiseases}
              onChangeText={setChronicDiseases}
              multiline
              numberOfLines={3}
              accessibilityLabel="Campo de enfermedades crónicas"
            />
          </GlassFormPanel>

          {/* Tratamiento y Notas Form Panel */}
          <GlassFormPanel title="Tratamiento y notas" icon="document-text-outline" colors={colors} styles={styles}>
            <TextInputField
              label="Medicamentos actuales"
              containerStyle={styles.fieldGroup}
              placeholder="Medicamentos que toma actualmente"
              value={medications}
              onChangeText={setMedications}
              multiline
              numberOfLines={3}
              accessibilityLabel="Campo de medicamentos actuales"
            />
            <TextInputField
              label="Notas adicionales"
              containerStyle={styles.fieldGroup}
              placeholder="Otras observaciones"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              accessibilityLabel="Campo de notas adicionales"
            />

            <PressableScale
              onPress={handleSave}
              style={styles.saveBtnPressable}
            >
              <LinearGradient
                colors={['#0F766E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </LinearGradient>
            </PressableScale>
          </GlassFormPanel>
        </View>
      );
    },
    [
      user,
      bloodType,
      allergies,
      chronicDiseases,
      medications,
      notes,
      handleSave,
      heartRateInput,
      temperatureInput,
      bpSystolicInput,
      bpDiastolicInput,
      oxygenInput,
      handleAddMeasurement,
      styles,
      colors,
      latestAlertStatus,
    ]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.loadingText} allowFontScaling>
            Cargando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== ROLES.PATIENT) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText} allowFontScaling>
            Esta pantalla es solo para el rol Paciente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardOuter}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <FlatList
          ref={listRef}
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          extraData={{
            user,
            bloodType,
            allergies,
            chronicDiseases,
            medications,
            notes,
            heartRateInput,
            temperatureInput,
            bpSystolicInput,
            bpDiastolicInput,
            oxygenInput,
            medicalRecords,
            filteredRecords,
            latestMetricTiles,
            activeFilter,
          }}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: spacing.xl + spacing.lg + spacing.md + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          onScrollToIndexFailed={() => {
            listRef.current?.scrollToOffset({ offset: 320, animated: true });
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  const fieldGroup = createFieldGroupStyle();

  return StyleSheet.create({
    keyboardOuter: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPaddingH,
      paddingTop: layout.screenPaddingTop,
    },
    listHeader: {
      marginBottom: spacing.sm,
    },
    headerBlock: {
      marginBottom: spacing.m,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIconWrap: {
      width: 42,
      height: 42,
      borderRadius: spacing.radiusButton,
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    sectionHeading: {
      ...typography.title,
      color: colors.textPrimary,
      fontWeight: '800',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    sectionHint: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginBottom: spacing.m,
    },
    quickActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: spacing.sm,
      marginBottom: spacing.m,
    },
    quickActionBtn: {
      flex: 1,
      minWidth: 0,
      borderRadius: spacing.radiusButton,
      overflow: 'hidden',
    },
    quickActionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusButton,
    },
    quickActionGradientBlue: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusButton,
    },
    quickActionText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    quickActionGap: {
      width: spacing.sm,
    },
    chipBarWrapper: {
      marginHorizontal: -layout.screenPaddingH,
      paddingHorizontal: layout.screenPaddingH,
    },
    chipBarContent: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: spacing.radiusButton * 1.5,
      borderWidth: 1,
    },
    chipIcon: {
      marginRight: spacing.xs,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
    },
    graphContainerCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    metricsGrid: {
      marginBottom: spacing.m,
    },
    emptyVitalsCard: {
      padding: spacing.lg,
      marginBottom: spacing.m,
    },
    emptyVitalsText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.body.fontSize * 1.45,
    },
    recordsHeading: {
      marginTop: spacing.md,
      marginBottom: spacing.m,
    },
    emptyRecordsHint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.m,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    footer: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    formPanelCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    formPanelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    formPanelIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    formPanelTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    formPanelBody: {
      width: '100%',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    loadingText: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      color: colors.textSecondary,
    },
    forbiddenText: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    idCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    passportHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    passportBadgeIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    passportTitle: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: colors.textSecondary,
      flex: 1,
    },
    passportStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    passportBody: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    passportCol: {
      flex: 1,
    },
    passportName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    passportRole: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.4,
      marginTop: spacing.xs,
    },
    passportColRight: {
      marginLeft: spacing.md,
    },
    qrBackground: {
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusButton,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    idLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textPlaceholder,
      letterSpacing: 0.5,
    },
    idValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    fieldGroup,
    sectionFieldLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.m,
    },
    bpRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bpField: {
      flex: 1,
      minWidth: 0,
      marginBottom: 0,
    },
    bpSlash: {
      fontSize: 16,
      fontWeight: typography.body.fontWeight,
      color: colors.textSecondary,
      marginHorizontal: -spacing.sm / 2,
      alignSelf: 'center',
    },
    saveBtnPressable: {
      width: '100%',
      borderRadius: spacing.radiusButton,
      overflow: 'hidden',
      marginTop: spacing.md,
    },
    saveBtnGradient: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusButton,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    trendAlertCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    trendAlertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    trendAlertTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    trendAlertText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      lineHeight: 16,
      paddingLeft: 20 + spacing.sm,
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
