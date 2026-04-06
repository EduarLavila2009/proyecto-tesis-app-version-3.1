import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { logout } from '../services/authService';
import { Header, Card, PressableScale } from '../components';
import { colors, spacing, typography } from '../theme';

const AVATAR_ICON_SIZE = spacing.xl * 2 + spacing.lg;

/**
 * Perfil de usuario: solo lectura de datos en sesión (AsyncStorage USER).
 */
export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (cancelled || !raw) {
            setUser(null);
            return;
          }
          setUser(JSON.parse(raw));
        } catch (_) {
          setUser(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const displayName = user?.name?.trim() || '—';
  const displayEmail = user?.email?.trim() || '—';
  const displayPhone =
    typeof user?.phone === 'string' && user.phone.trim()
      ? user.phone.trim()
      : 'No registrado en la app';

  const handleEditProfile = () => {
    Alert.alert(
      'Editar perfil',
      'Esta función estará disponible en una próxima versión.',
      [{ text: 'Entendido' }]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          const res = await logout();
          if (res.success) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
              })
            );
            return;
          }
          console.error('Error al cerrar sesión:', res.error || res.message);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Mi Perfil"
          style={styles.headerBlock}
          textStyle={styles.headerTitle}
        />

        <View style={styles.avatarSection}>
          <View style={styles.avatarRing} accessibilityLabel="Avatar de usuario">
            <Ionicons name="person-circle" size={AVATAR_ICON_SIZE} color={colors.primary} />
          </View>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel} allowFontScaling>
              Nombre
            </Text>
            <Text
              style={styles.fieldValue}
              selectable
              allowFontScaling
            >
              {displayName}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel} allowFontScaling>
              Email
            </Text>
            <Text
              style={styles.fieldValue}
              selectable
              allowFontScaling
            >
              {displayEmail}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel} allowFontScaling>
              Teléfono
            </Text>
            <Text
              style={styles.fieldValue}
              selectable
              allowFontScaling
            >
              {displayPhone}
            </Text>
          </View>
        </Card>

        <PressableScale
          containerStyle={styles.pressableFull}
          style={styles.editOutlineBtn}
          onPress={handleEditProfile}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
        >
          <Text style={styles.editOutlineLabel} allowFontScaling>
            Editar Perfil
          </Text>
        </PressableScale>

        <PressableScale
          containerStyle={styles.pressableFull}
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons
            name="log-out-outline"
            size={spacing.lg + spacing.xs}
            color={colors.danger}
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText} allowFontScaling>
            Cerrar Sesión
          </Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerBlock: {
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.sm,
  },
  avatarRing: {
    width: AVATAR_ICON_SIZE + spacing.lg * 2,
    height: AVATAR_ICON_SIZE + spacing.lg * 2,
    borderRadius: (AVATAR_ICON_SIZE + spacing.lg * 2) / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '33',
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowRadius: spacing.md,
    elevation: spacing.xs,
  },
  infoCard: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  fieldRow: {
    paddingVertical: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.body.fontSize * 1.45,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },
  pressableFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  editOutlineBtn: {
    width: '100%',
    minHeight: spacing.lg * 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radiusButton,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  editOutlineLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: spacing.lg * 2,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusButton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.danger,
  },
});
