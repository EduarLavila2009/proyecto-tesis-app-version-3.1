import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { PressableScale, ScreenContainer } from '../components';
import { spacing, typography, tabListContent, useTheme } from '../theme';
import { getDoctorPatientLinks } from '../services/connectionService';

/**
 * Lista de pacientes - Solo rol Médico
 * Obtiene USERS de AsyncStorage, filtra pacientes y permite abrir detalle por ID.
 */
export default function PatientsListScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  if (!currentUser || currentUser.role !== ROLES.DOCTOR) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredWrap}>
        <View style={styles.centered}>
          <Text style={styles.forbiddenText} allowFontScaling>
            Acceso restringido. Solo médicos pueden ver pacientes.
          </Text>
        </View>
      </ScreenContainer>
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
    <ScreenContainer edges={['top', 'left', 'right']}>
      <FlatList
        data={patients}
        keyExtractor={(item, index) => item.id || item.email || `patient-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={tabListContent(insets)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText} allowFontScaling>
              No hay pacientes registrados.
            </Text>
          </View>
        }
      />
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
      ...typography.body,
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    forbiddenText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    scanBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusInput,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    scanBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: spacing.radiusInput,
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
      ...typography.subtitle,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    scanBannerSub: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: spacing.radiusInput,
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
      ...typography.subtitle,
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
      borderRadius: spacing.radiusInput,
      backgroundColor: `${colors.primary}14`,
    },
    badgeText: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    cardId: {
      ...typography.caption,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    cardEmail: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    emptyWrap: {
      padding: spacing.xxl,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
}
