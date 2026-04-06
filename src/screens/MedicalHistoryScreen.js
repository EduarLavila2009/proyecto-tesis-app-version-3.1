import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import { Header, Card, Button } from '../components';
import { colors, spacing, typography } from '../theme';

/**
 * Registros clínicos de demostración (solo UI; no se persisten).
 * La ficha editable debajo sigue siendo la fuente de verdad en AsyncStorage.
 */
const SIMULATED_CLINICAL_RECORDS = [
  {
    id: '1',
    date: '5 abr 2026',
    description:
      'Consulta de seguimiento — presión arterial 118/76 mmHg, sin alteraciones.',
  },
  {
    id: '2',
    date: '22 mar 2026',
    description:
      'Análisis de laboratorio recibido. Resultados dentro de parámetros normales.',
  },
  {
    id: '3',
    date: '10 mar 2026',
    description: 'Vacuna antigripal aplicada. Sin reacciones adversas.',
  },
  {
    id: '4',
    date: '28 feb 2026',
    description:
      'Teleconsulta: revisión de medicación. Se mantiene pauta actual.',
  },
];

/**
 * Historial médico - Solo rol Paciente
 * Carga y edita el historial del usuario actual. Guarda en AsyncStorage.
 */
export default function MedicalHistoryScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');

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

  const renderRecord = useCallback(({ item }) => {
    return (
      <View style={styles.cardSpacing}>
        <Card style={styles.recordCard}>
          <Text style={styles.recordDate} allowFontScaling>
            {item.date}
          </Text>
          <Text style={styles.recordDescription} allowFontScaling>
            {item.description}
          </Text>
        </Card>
      </View>
    );
  }, []);

  const listHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        <Header
          title="Historial Clínico"
          style={styles.headerBlock}
          textStyle={styles.headerTitle}
        />
        <Text style={styles.sectionLabel} allowFontScaling>
          Registros recientes
        </Text>
      </View>
    ),
    []
  );

  const listFooter = useCallback(
    () => (
      <View style={styles.footer}>
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
              placeholder="Ej. O+, A-, B+"
              placeholderTextColor={colors.textSecondary}
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
              placeholder="Alergias conocidas"
              placeholderTextColor={colors.textSecondary}
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
              placeholder="Enfermedades crónicas"
              placeholderTextColor={colors.textSecondary}
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
              placeholder="Medicamentos que toma actualmente"
              placeholderTextColor={colors.textSecondary}
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
              placeholder="Otras observaciones"
              placeholderTextColor={colors.textSecondary}
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
    [user, bloodType, allergies, chronicDiseases, medications, notes, handleSave]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText} allowFontScaling>
            Esta pantalla es solo para el rol Paciente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={SIMULATED_CLINICAL_RECORDS}
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
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
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
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
    minHeight: spacing.lg * 2,
  },
  inputMultiline: {
    minHeight: spacing.xl + spacing.lg,
    textAlignVertical: 'top',
  },
  saveButton: {
    width: '100%',
    marginTop: spacing.lg,
  },
});
