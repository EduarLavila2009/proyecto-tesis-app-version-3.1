import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import { Header, Card, Button } from '../components';
import { spacing, typography, useTheme } from '../theme';
import {
  addMedicalRecord,
  getMedicalRecordsByUser,
} from '../services/medicalRecordsService';

function formatRecordDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

/**
 * Historial médico - Solo rol Paciente
 * Carga y edita el historial del usuario actual. Guarda en AsyncStorage.
 */
export default function MedicalHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');

  // Inputs para registrar nuevas métricas (demo local sin hardware)
  const [heartRateInput, setHeartRateInput] = useState('');
  const [temperatureInput, setTemperatureInput] = useState('');
  const [bpSystolicInput, setBpSystolicInput] = useState('');
  const [bpDiastolicInput, setBpDiastolicInput] = useState('');
  const [oxygenInput, setOxygenInput] = useState('');

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

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

  const renderRecord = useCallback(({ item }) => {
    const systolic = item?.bloodPressure?.systolic;
    const diastolic = item?.bloodPressure?.diastolic;
    const bpText =
      typeof systolic === 'number' && typeof diastolic === 'number'
        ? `${systolic}/${diastolic}`
        : '—';

    return (
      <View style={styles.cardSpacing}>
        <Card style={styles.recordCard}>
          <Text style={styles.recordDate} allowFontScaling>
            {formatRecordDate(item.date)}
          </Text>
          <Text style={styles.recordDescription} allowFontScaling>
            FC: {item.heartRate ?? '—'} bpm
          </Text>
          <Text style={styles.recordDescription} allowFontScaling>
            Temp:{' '}
            {typeof item.temperature === 'number' ? item.temperature.toFixed(1) : '—'} °C
          </Text>
          <Text style={styles.recordDescription} allowFontScaling>
            Presión: {bpText} mmHg
          </Text>
          <Text style={styles.recordDescription} allowFontScaling>
            SpO₂: {item.oxygen ?? '—'}%
          </Text>
        </Card>
      </View>
    );
  }, [styles]);

  const listHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        <Header
          title="Historial de métricas"
          style={styles.headerBlock}
          textStyle={styles.headerTitle}
        />
        <Text style={styles.sectionLabel} allowFontScaling>
          Mediciones guardadas en este dispositivo
        </Text>
      </View>
    ),
    [styles]
  );

  const listFooter = useCallback(
    () => (
      <View style={styles.footer}>
        <Text style={styles.sectionLabel} allowFontScaling>
          Agregar nueva medición
        </Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Ritmo cardíaco (bpm)
            </Text>
            <TextInput
              style={styles.input}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Ej. 82"
              placeholderTextColor={colors.textPlaceholder}
              value={heartRateInput}
              onChangeText={setHeartRateInput}
              keyboardType="numeric"
              accessibilityLabel="Campo ritmo cardíaco"
              allowFontScaling
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Temperatura (°C)
            </Text>
            <TextInput
              style={styles.input}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Ej. 36.6"
              placeholderTextColor={colors.textPlaceholder}
              value={temperatureInput}
              onChangeText={setTemperatureInput}
              keyboardType="numeric"
              accessibilityLabel="Campo temperatura"
              allowFontScaling
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Presión arterial (PA)
            </Text>
            <View style={styles.bpRow}>
              <TextInput
                style={[styles.input, styles.bpInput]}
                selectionColor={colors.primary}
                {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
                placeholder="Sistólica"
                placeholderTextColor={colors.textPlaceholder}
                value={bpSystolicInput}
                onChangeText={setBpSystolicInput}
                keyboardType="numeric"
                accessibilityLabel="Campo sistólica"
                allowFontScaling
              />
              <Text style={styles.bpSlash} allowFontScaling>
                /
              </Text>
              <TextInput
                style={[styles.input, styles.bpInput]}
                selectionColor={colors.primary}
                {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
                placeholder="Diastólica"
                placeholderTextColor={colors.textPlaceholder}
                value={bpDiastolicInput}
                onChangeText={setBpDiastolicInput}
                keyboardType="numeric"
                accessibilityLabel="Campo diastólica"
                allowFontScaling
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Oxígeno (SpO₂ %)
            </Text>
            <TextInput
              style={styles.input}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Ej. 98"
              placeholderTextColor={colors.textPlaceholder}
              value={oxygenInput}
              onChangeText={setOxygenInput}
              keyboardType="numeric"
              accessibilityLabel="Campo oxígeno"
              allowFontScaling
            />
          </View>

          <Button
            title="Guardar medición"
            onPress={handleAddMeasurement}
            style={styles.saveButton}
            accessibilityLabel="Guardar nueva medición"
          />
        </View>

        <Text style={styles.sectionLabel} allowFontScaling>
          Ficha clínica
        </Text>

        <View style={styles.idBlock}>
          <Text style={styles.idLabel} allowFontScaling>
            ID del paciente
          </Text>
          <Text style={styles.idValue} allowFontScaling>
            {user?.id || '—'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Tipo de sangre
            </Text>
            <TextInput
              style={styles.input}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Ej. O+, A-, B+"
              placeholderTextColor={colors.textPlaceholder}
              value={bloodType}
              onChangeText={setBloodType}
              accessibilityLabel="Campo de tipo de sangre"
              allowFontScaling
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Alergias
            </Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Alergias conocidas"
              placeholderTextColor={colors.textPlaceholder}
              value={allergies}
              onChangeText={setAllergies}
              multiline
              accessibilityLabel="Campo de alergias"
              allowFontScaling
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Enfermedades crónicas
            </Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Enfermedades crónicas"
              placeholderTextColor={colors.textPlaceholder}
              value={chronicDiseases}
              onChangeText={setChronicDiseases}
              multiline
              accessibilityLabel="Campo de enfermedades crónicas"
              allowFontScaling
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Medicamentos actuales
            </Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Medicamentos que toma actualmente"
              placeholderTextColor={colors.textPlaceholder}
              value={medications}
              onChangeText={setMedications}
              multiline
              accessibilityLabel="Campo de medicamentos actuales"
              allowFontScaling
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label} allowFontScaling>
              Notas adicionales
            </Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              selectionColor={colors.primary}
              {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
              placeholder="Otras observaciones"
              placeholderTextColor={colors.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              accessibilityLabel="Campo de notas adicionales"
              allowFontScaling
            />
          </View>

          <Button
            title="Guardar cambios"
            onPress={handleSave}
            style={styles.saveButton}
            accessibilityLabel="Guardar cambios del historial médico"
          />
        </View>
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
      colors,
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
          }}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                spacing.xl + spacing.lg + spacing.md + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  listHeader: {
    marginBottom: spacing.sm,
  },
  headerBlock: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
  },
  sectionLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  cardSpacing: {
    marginBottom: spacing.sm,
  },
  recordCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  recordDate: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  recordDescription: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    lineHeight: typography.body.fontSize * 1.45,
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
  idBlock: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
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
  form: {
    paddingBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.body.fontWeight,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
    minHeight: Math.max(spacing.lg * 2, spacing.minTouchTarget),
  },
  inputMultiline: {
    minHeight: spacing.xl + spacing.lg,
    textAlignVertical: 'top',
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bpInput: {
    flex: 1,
    minWidth: 0,
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
