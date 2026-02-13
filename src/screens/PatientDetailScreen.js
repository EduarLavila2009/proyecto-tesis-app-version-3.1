import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';

/**
 * Detalle de paciente - Solo lectura
 * Recibe patientId por route.params, busca en USERS y muestra historial médico.
 */
export default function PatientDetailScreen({ route }) {
  const { patientId } = route.params || {};
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Paciente no encontrado.</Text>
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
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value && String(value).trim() ? value : '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Datos del paciente</Text>
          <Row label="Nombre" value={patient.name} />
          <Row label="ID" value={patient.id} />
          <Row label="Correo" value={patient.email} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Historial médico</Text>
          {hasHistory ? (
            <>
              <Row label="Tipo de sangre" value={h.bloodType} />
              <Row label="Alergias" value={h.allergies} />
              <Row label="Enfermedades crónicas" value={h.chronicDiseases} />
              <Row label="Medicamentos actuales" value={h.medications} />
              <Row label="Notas adicionales" value={h.notes} />
            </>
          ) : (
            <Text style={styles.noData}>Sin datos médicos registrados.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.screen,
  },
  block: {
    backgroundColor: colors.backgroundLighter,
    padding: spacing.lg,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  blockTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.primaryLight,
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSizes.base,
    color: colors.textLight,
  },
  noData: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
