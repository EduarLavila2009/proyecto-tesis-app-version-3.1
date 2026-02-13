import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';

/**
 * Lista de pacientes - Solo rol Médico
 * Obtiene USERS de AsyncStorage, filtra pacientes y permite abrir detalle por ID.
 */
export default function PatientsListScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userJson) setCurrentUser(JSON.parse(userJson));

      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      let users = [];
      if (usersJson) {
        try {
          users = JSON.parse(usersJson);
        } catch (_) {
          users = [];
        }
      }
      const list = users.filter((u) => u.role === ROLES.PATIENT);
      setPatients(list);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
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

  if (!currentUser || currentUser.role !== ROLES.DOCTOR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText}>
            Acceso restringido. Solo médicos pueden ver pacientes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
      activeOpacity={0.82}
    >
      <Text style={styles.cardName}>{item.name || '—'}</Text>
      <Text style={styles.cardId}>{item.id || '—'}</Text>
      <Text style={styles.cardEmail}>{item.email || '—'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item, index) => item.id || item.email || `patient-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No hay pacientes registrados.</Text>
          </View>
        }
      />
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
  forbiddenText: {
    fontSize: fontSizes.base,
    color: colors.textLight,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.screen,
  },
  card: {
    backgroundColor: colors.backgroundLighter,
    padding: spacing.lg,
    borderRadius: spacing.radiusMd,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  cardId: {
    fontSize: fontSizes.sm,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  cardEmail: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  emptyWrap: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
