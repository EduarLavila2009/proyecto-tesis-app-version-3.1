import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { PressableScale } from '../components';
import { useTheme } from '../theme';
import { getDoctorPatientLinks } from '../services/connectionService';

/**
 * Lista de pacientes - Solo rol Médico
 * Obtiene USERS de AsyncStorage, filtra pacientes y permite abrir detalle por ID.
 */
export default function PatientsListScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentUser, setCurrentUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [linkedMap, setLinkedMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let user = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch (_) {
          user = null;
        }
      }
      setCurrentUser(user);

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

      const links = await getDoctorPatientLinks();
      const map = {};
      if (user?.id) {
        links
          .filter((l) => l.doctorId === user.id)
          .forEach((l) => {
            map[l.patientId] = true;
          });
      }
      setLinkedMap(map);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

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

  if (!currentUser || currentUser.role !== ROLES.DOCTOR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText} allowFontScaling>
            Acceso restringido. Solo médicos pueden ver pacientes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => {
    const linked = linkedMap[item.id];
    return (
      <PressableScale
        style={styles.card}
        onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Paciente ${item.name || 'sin nombre'}, identificador ${item.id || '—'}, correo ${item.email || '—'}`}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardName} allowFontScaling>
            {item.name || '—'}
          </Text>
          {linked ? (
            <View style={styles.badge}>
              <Ionicons name="link" size={14} color={colors.primary} />
              <Text style={styles.badgeText} allowFontScaling>
                Vinculado
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardId} allowFontScaling>
          {item.id || '—'}
        </Text>
        <Text style={styles.cardEmail} allowFontScaling>
          {item.email || '—'}
        </Text>
      </PressableScale>
    );
  };

  const listHeader = (
    <Pressable
      style={({ pressed }) => [styles.scanBanner, pressed && { opacity: 0.92 }]}
      onPress={() => navigation.navigate('ConnectPatient')}
      accessibilityRole="button"
      accessibilityLabel="Abrir escáner para vincular paciente con código QR"
    >
      <View style={styles.scanBannerIcon}>
        <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.scanBannerText}>
        <Text style={styles.scanBannerTitle} allowFontScaling>
          Vincular con QR
        </Text>
        <Text style={styles.scanBannerSub} allowFontScaling>
          Escanea el código del paciente en su perfil
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item, index) => item.id || item.email || `patient-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText} allowFontScaling>
              No hay pacientes registrados.
            </Text>
          </View>
        }
      />
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
      fontSize: fontSizes.base,
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    forbiddenText: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.screen,
    },
    scanBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusMd,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    scanBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: spacing.radiusMd,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    scanBannerText: {
      flex: 1,
      minWidth: 0,
    },
    scanBannerTitle: {
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    scanBannerSub: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: spacing.radiusMd,
      marginBottom: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    cardName: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: spacing.radiusMd,
      backgroundColor: `${colors.primary}14`,
    },
    badgeText: {
      fontSize: fontSizes.sm - 2,
      fontWeight: '700',
      color: colors.primary,
    },
    cardId: {
      fontSize: fontSizes.sm,
      color: colors.primary,
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
}
