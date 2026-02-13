import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES, DEFAULT_MEDICAL_HISTORY } from '../constants/storage';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { buttons } from '../constants/theme';

/**
 * Historial médico - Solo rol Paciente
 * Carga y edita el historial del usuario actual. Guarda en AsyncStorage.
 * Estructura preparada para que el Médico consulte por ID en fases posteriores.
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

  const handleSave = async () => {
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

      // Actualizar usuario actual en sesión
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // Actualizar en el array USERS (para consulta por ID del Médico)
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
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== ROLES.PATIENT) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText}>Esta pantalla es solo para el rol Paciente.</Text>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ID del paciente (no editable) */}
          <View style={styles.idBlock}>
            <Text style={styles.idLabel}>ID del paciente</Text>
            <Text style={styles.idValue}>{user.id || '—'}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tipo de sangre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. O+, A-, B+"
                placeholderTextColor={colors.textMuted}
                value={bloodType}
                onChangeText={setBloodType}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Alergias</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Alergias conocidas"
                placeholderTextColor={colors.textMuted}
                value={allergies}
                onChangeText={setAllergies}
                multiline
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Enfermedades crónicas</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Enfermedades crónicas"
                placeholderTextColor={colors.textMuted}
                value={chronicDiseases}
                onChangeText={setChronicDiseases}
                multiline
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Medicamentos actuales</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Medicamentos que toma actualmente"
                placeholderTextColor={colors.textMuted}
                value={medications}
                onChangeText={setMedications}
                multiline
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notas adicionales</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Otras observaciones"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[buttons.primary, styles.saveButton]}
              onPress={handleSave}
              activeOpacity={0.82}
            >
              <Text style={buttons.primaryText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.screen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  forbiddenText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  idBlock: {
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  idLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  idValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textLight,
  },
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundLighter,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.radiusMd,
    fontSize: fontSizes.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textLight,
    minHeight: 52,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.xxl,
    borderRadius: spacing.radiusMd,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
});
