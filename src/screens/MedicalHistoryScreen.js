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
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  TextInputField,
  DropdownSelect,
  FormPanel,
  MetricTile,
  HistoryRecordCard,
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
  createCardTitleStyle,
  createFieldGroupStyle,
} from '../theme';
import { useMetricsGridLayout } from '../hooks/useMetricsGridLayout';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
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

/**
 * Historial médico - Solo rol Paciente
 * Carga y edita el historial del usuario actual. Guarda en AsyncStorage.
 */
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

    const medicalHistory = {
      bloodType: bloodType.trim(),
      allergies: allergies.trim(),
      chronicDiseases: chronicDiseases.trim(),
      medications: medications.trim(),
      notes: notes.trim(),
    };

    try {
      const updatedUser = { ...user, medicalHistory };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      if (user.id) {
        const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        let users = [];
        if (usersJson) {
          try {
            users = JSON.parse(usersJson);
          } catch (_) {}
        }
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          users[index] = { ...users[index], medicalHistory };
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
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

  const scrollToRecords = useCallback(() => {
    if (medicalRecords.length === 0) {
      Alert.alert(
        'Sin registros',
        'Aún no hay mediciones guardadas. Agrega una medición más abajo.'
      );
      return;
    }
    listRef.current?.scrollToIndex({ index: 0, animated: true, viewOffset: spacing.sm });
  }, [medicalRecords.length]);

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

  const listHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.pageTitle} allowFontScaling accessibilityRole="header">
          Historial y métricas
        </Text>
        <Text style={styles.sectionLabel} allowFontScaling>
          Mediciones y ficha clínica en este dispositivo
        </Text>

        <View style={styles.quickActionsRow}>
          <PrimaryButton
            title="Ver historial completo"
            icon="list-outline"
            onPress={scrollToRecords}
            style={styles.quickActionBtn}
            accessibilityLabel="Ver historial completo de mediciones"
          />
          <View style={styles.quickActionGap} />
          <SecondaryButton
            title="IA médica"
            icon="sparkles-outline"
            onPress={() => navigation.navigate('MedicalAI')}
            style={styles.quickActionBtn}
            accessibilityLabel="Abrir asistente de IA médica"
          />
        </View>

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
          <Card style={styles.emptyVitalsCard}>
            <Text style={styles.emptyVitalsText} allowFontScaling>
              Registra una medición para ver FC, temperatura, presión y oxígeno aquí.
            </Text>
          </Card>
        )}

        <Text style={[styles.sectionHeading, styles.recordsHeading]} allowFontScaling>
          Últimos registros
        </Text>
        {medicalRecords.length === 0 ? (
          <Text style={styles.emptyRecordsHint} allowFontScaling>
            No hay registros todavía.
          </Text>
        ) : null}
      </View>
    ),
    [
      styles,
      scrollToRecords,
      navigation,
      latestRecord,
      latestMetricTiles,
      gridStyle,
      tileWidth,
      medicalRecords.length,
    ]
  );

  const listFooter = useCallback(
    () => (
      <View style={styles.footer}>
        <FormPanel title="Agregar nueva medición">
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

          <PrimaryButton
            title="Guardar medición"
            onPress={handleAddMeasurement}
            style={styles.saveButton}
            accessibilityLabel="Guardar nueva medición"
          />
        </FormPanel>

        <Text style={styles.sectionHeading} allowFontScaling>
          Ficha clínica
        </Text>

        <Card style={styles.idCard}>
          <Text style={styles.cardBlockTitle} allowFontScaling>
            Identificación
          </Text>
          <Text style={styles.idLabel} allowFontScaling>
            ID del paciente
          </Text>
          <Text style={styles.idValue} allowFontScaling>
            {user?.id || '—'}
          </Text>
        </Card>

        <FormPanel title="Datos clínicos">
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
        </FormPanel>

        <FormPanel title="Tratamiento y notas">
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

          <PrimaryButton
            title="Guardar cambios"
            onPress={handleSave}
            style={styles.saveButton}
            accessibilityLabel="Guardar cambios del historial médico"
          />
        </FormPanel>
      </View>
    ),
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
          data={medicalRecords}
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
            latestMetricTiles,
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
    pageTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.s,
    },
    sectionHeading: createSectionHeadingStyle(colors),
    sectionLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.m,
    },
    sectionHint: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginBottom: spacing.m,
    },
    quickActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: spacing.xl,
    },
    quickActionBtn: {
      flex: 1,
      minWidth: 0,
      minHeight: spacing.xl + spacing.md,
    },
    quickActionGap: {
      width: spacing.md,
    },
    metricsGrid: {
      marginBottom: spacing.xl,
    },
    emptyVitalsCard: {
      marginBottom: spacing.xl,
      backgroundColor: colors.secondaryMuted,
    },
    emptyVitalsText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.body.fontSize * 1.45,
    },
    recordsHeading: {
      marginTop: spacing.xs,
    },
    emptyRecordsHint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.m,
    },
    footer: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
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
      marginBottom: spacing.lg,
    },
    cardBlockTitle: {
      ...createCardTitleStyle(colors),
      marginBottom: spacing.md,
    },
    idLabel: {
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    idValue: {
      fontSize: typography.subtitle.fontSize,
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
    },
    saveButton: {
      width: '100%',
      marginTop: spacing.lg,
    },
  });
}
