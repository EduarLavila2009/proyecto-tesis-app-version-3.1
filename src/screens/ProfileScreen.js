import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  Switch,
  Share,
  Platform,
} from 'react-native';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import QRCode from 'react-native-qrcode-svg';
import { buildPatientQrPayload } from '../services/connectionService';
import { logout } from '../services/authService';
import { updateUserProfile } from '../services/profileService';
import { getUnreadAlertsCount } from '../services/alertsService';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  PressableScale,
  TabScreenLayout,
} from '../components';
import {
  spacing,
  typography,
  layout,
  useTheme,
  createSectionHeadingStyle,
} from '../theme';
import { useProfileLayout } from '../hooks/useProfileLayout';

function avatarInitials(name) {
  const t = (name || '').trim();
  if (!t || t === '—') return '?';
  const p = t.split(/\s+/).filter(Boolean);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

function hasAvatarUri(user) {
  const a = user?.avatar;
  return typeof a === 'string' && a.length > 10;
}

/**
 * Perfil — UI profesional, responsive y alineada al tema global.
 */
export default function ProfileScreen({ navigation }) {
  const { colors, cardShadow, isDark, setMode } = useTheme();
  const layoutMetrics = useProfileLayout();
  const styles = useMemo(
    () => createStyles(colors, layoutMetrics),
    [colors, layoutMetrics]
  );
  const [user, setUser] = useState(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

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
          const count = await getUnreadAlertsCount();
          if (!cancelled) setUnreadAlerts(count);
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
      : 'Sin registrar';

  const refreshUser = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (raw) setUser(JSON.parse(raw));
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos',
          'Para cambiar la foto necesitamos acceso a la galería.'
        );
        return;
      }

      setPickingPhoto(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.45,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setPickingPhoto(false);
        return;
      }

      const asset = result.assets[0];
      const avatarData =
        asset.base64 != null
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

      const res = await updateUserProfile({ avatar: avatarData });
      if (res.success) {
        await refreshUser();
      } else {
        Alert.alert('Error', res.message || 'No se pudo guardar la foto.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
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

  const handleShareQr = async () => {
    if (!user?.id) return;
    try {
      await Share.share({
        message: `Código de paciente MEDICAL corp\nID: ${user.id}\n${buildPatientQrPayload(user.id)}`,
      });
    } catch (_) {
      /* usuario canceló */
    }
  };

  const showAvatarImage = hasAvatarUri(user);
  const isPatient = user?.role === ROLES.PATIENT;
  const isDoctor = user?.role === ROLES.DOCTOR;
  const historyTarget = isDoctor ? 'Patients' : 'History';

  const { avatarDisplay, avatarRing, cameraBadge, qrSize } = layoutMetrics;

  return (
    <TabScreenLayout scrollProps={{ showsVerticalScrollIndicator: false }}>
      {/* Hero: avatar + identidad + acciones rápidas */}
      <View style={styles.hero}>
        <Pressable
          onPress={handlePickAvatar}
          style={({ pressed }) => [
            styles.avatarPressable,
            pressed && styles.avatarPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          accessibilityHint="Abre la galería para elegir una imagen"
          android_ripple={
            Platform.OS === 'android'
              ? { color: `${colors.primary}22`, borderless: true, radius: avatarRing / 2 }
              : undefined
          }
        >
          <View
            style={[
              styles.avatarRing,
              cardShadow,
              { width: avatarRing, height: avatarRing, borderRadius: 9999 },
            ]}
          >
            {pickingPhoto ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : showAvatarImage ? (
              <Image
                source={{ uri: user.avatar }}
                style={[
                  styles.avatarImage,
                  {
                    width: avatarDisplay,
                    height: avatarDisplay,
                    borderRadius: 9999,
                  },
                ]}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text
                style={[styles.avatarInitials, { fontSize: avatarDisplay * 0.28 }]}
                allowFontScaling
              >
                {avatarInitials(displayName)}
              </Text>
            )}
            <View
              style={[
                styles.cameraBadge,
                {
                  width: cameraBadge,
                  height: cameraBadge,
                  borderRadius: 9999,
                },
              ]}
            >
              <Ionicons name="camera" size={Math.round(cameraBadge * 0.5)} color={colors.onPrimary} />
            </View>
          </View>
        </Pressable>

        <Text style={styles.displayName} allowFontScaling numberOfLines={2}>
          {displayName}
        </Text>

        <View style={styles.emailPill}>
          <Text style={styles.displayEmail} allowFontScaling numberOfLines={2}>
            {displayEmail}
          </Text>
        </View>

        <Text style={styles.photoHint} allowFontScaling>
          Toca el avatar para cambiar tu foto
        </Text>

        <View style={styles.quickActionsRow}>
          <PrimaryButton
            title="Ver historial"
            icon="calendar-outline"
            onPress={() => navigation.navigate(historyTarget)}
            style={styles.quickActionBtn}
            accessibilityLabel="Ver historial"
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
      </View>

      {isPatient ? (
        <>
          <Text style={styles.sectionHeading} allowFontScaling>
            Salud y recordatorios
          </Text>
          <Card style={styles.toolsCard}>
            <PrimaryButton
              title="Cuidado y recordatorios"
              icon="heart-outline"
              onPress={() => navigation.navigate('PatientWellness')}
              style={styles.toolBtn}
              accessibilityLabel="Abrir recordatorios, agenda y contacto de emergencia"
            />
            <SecondaryButton
              title={unreadAlerts > 0 ? `Alertas (${unreadAlerts})` : 'Ver alertas'}
              icon="notifications-outline"
              appearance="outline"
              onPress={() => navigation.navigate('Alerts')}
              style={styles.toolBtnLast}
              accessibilityLabel="Ver alertas médicas"
            />
          </Card>
        </>
      ) : null}

      {/* Apariencia — modo oscuro vía ThemeProvider (sin cambiar lógica) */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Apariencia
      </Text>
      <Card style={[styles.settingsCard, isDark && styles.settingsCardDark]}>
        <View style={styles.themeRow}>
          <View style={[styles.themeIconWrap, { backgroundColor: colors.secondaryMuted }]}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny-outline'}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.themeTextBlock}>
            <Text style={styles.themeTitle} allowFontScaling>
              Modo oscuro
            </Text>
            <Text style={styles.themeHint} allowFontScaling>
              {isDark ? 'Tema oscuro activo' : 'Menos brillo en ambientes oscuros'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{
              false: colors.borderSubtle,
              true: `${colors.primary}99`,
            }}
            thumbColor={isDark ? colors.primary : colors.surface}
            ios_backgroundColor={colors.borderSubtle}
            accessibilityLabel="Activar modo oscuro"
          />
        </View>
      </Card>

      {isPatient && user?.id ? (
        <>
          <Text style={styles.sectionHeading} allowFontScaling>
            Tu código QR
          </Text>
          <Card style={[styles.qrCard, cardShadow]}>
            <Text style={styles.qrHint} allowFontScaling>
              Muéstralo a tu médico para que escanee y te vincule a su lista.
            </Text>
            <View style={styles.qrWrap}>
              <QRCode
                value={buildPatientQrPayload(user.id)}
                size={qrSize}
                color={colors.textPrimary}
                backgroundColor={colors.surface}
              />
            </View>
            <Text style={styles.qrId} selectable allowFontScaling>
              ID: {user.id}
            </Text>
            <SecondaryButton
              title="Compartir código"
              icon="share-outline"
              onPress={handleShareQr}
              style={styles.shareQrBtn}
              accessibilityLabel="Compartir código QR del paciente"
            />
          </Card>
        </>
      ) : null}

      {isDoctor ? (
        <PressableScale
          containerStyle={styles.pressableFull}
          style={styles.linkPatientBtn}
          onPress={() => navigation.navigate('ConnectPatient')}
          accessibilityRole="button"
          accessibilityLabel="Vincular paciente escaneando su código QR"
        >
          <Ionicons
            name="qr-code-outline"
            size={22}
            color={colors.primary}
            style={styles.linkPatientIcon}
          />
          <Text style={styles.linkPatientLabel} allowFontScaling>
            Vincular paciente (QR)
          </Text>
        </PressableScale>
      ) : null}

      <Text style={styles.sectionHeading} allowFontScaling>
        Información
      </Text>
      <Card style={styles.infoCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel} allowFontScaling>
            Teléfono
          </Text>
          <Text style={styles.fieldValue} selectable allowFontScaling>
            {displayPhone}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel} allowFontScaling>
            Rol
          </Text>
          <Text style={styles.fieldValue} selectable allowFontScaling>
            {user?.role === 'doctor' ? 'Médico' : 'Paciente'}
          </Text>
        </View>
      </Card>

      <PrimaryButton
        title="Editar perfil"
        icon="create-outline"
        onPress={handleEditProfile}
        style={styles.editBtn}
        accessibilityLabel="Editar datos del perfil"
      />

      <SecondaryButton
        title="Cerrar sesión"
        icon="log-out-outline"
        appearance="outline"
        onPress={handleLogout}
        style={styles.logoutBtn}
        textStyle={{ color: colors.danger }}
        accessibilityLabel="Cerrar sesión"
      />
    </TabScreenLayout>
  );
}

function createStyles(colors, metrics) {
  return StyleSheet.create({
    hero: {
      alignItems: 'center',
      marginBottom: layout.sectionGap,
      width: '100%',
    },
    avatarPressable: {
      marginBottom: spacing.m,
      borderRadius: 9999,
    },
    avatarPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    avatarRing: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: `${colors.primary}40`,
      overflow: 'hidden',
    },
    avatarImage: {
      resizeMode: 'cover',
    },
    avatarInitials: {
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    displayName: {
      ...typography.h2,
      color: colors.primary,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.m,
      maxWidth: metrics.contentWidth,
    },
    emailPill: {
      backgroundColor: colors.secondaryMuted,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.m,
      borderRadius: spacing.radiusLg,
      marginBottom: spacing.xs,
      maxWidth: metrics.contentWidth,
    },
    displayEmail: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    photoHint: {
      ...typography.caption,
      color: colors.textPlaceholder,
      textAlign: 'center',
      marginBottom: spacing.m,
    },
    quickActionsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
      maxWidth: metrics.contentWidth,
    },
    quickActionBtn: {
      flex: 1,
    },
    quickActionGap: {
      width: spacing.m,
    },
    toolsCard: {
      marginBottom: spacing.lg,
      paddingVertical: spacing.m,
    },
    toolBtn: {
      width: '100%',
      marginBottom: spacing.m,
    },
    toolBtnLast: {
      width: '100%',
    },
    sectionHeading: {
      ...createSectionHeadingStyle(colors),
      marginTop: 0,
      marginLeft: spacing.xs,
    },
    settingsCard: {
      marginBottom: spacing.lg,
    },
    settingsCardDark: {
      borderColor: colors.borderSubtle,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.m,
    },
    themeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: spacing.radiusButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    themeTitle: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    themeHint: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    qrCard: {
      marginBottom: spacing.lg,
      alignItems: 'center',
      width: '100%',
    },
    qrHint: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.m,
      lineHeight: typography.body.lineHeight,
    },
    qrWrap: {
      padding: spacing.m,
      borderRadius: spacing.radiusCard,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrId: {
      marginTop: spacing.m,
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    shareQrBtn: {
      width: '100%',
      marginTop: spacing.m,
    },
    linkPatientBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: spacing.minTouchTarget,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.lg,
      borderRadius: spacing.radiusButton,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
      marginBottom: spacing.lg,
    },
    linkPatientIcon: {
      marginRight: spacing.sm,
    },
    linkPatientLabel: {
      ...typography.bodyMedium,
      color: colors.primary,
    },
    infoCard: {
      marginBottom: spacing.l,
    },
    fieldRow: {
      paddingVertical: spacing.sm,
    },
    fieldLabel: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    fieldValue: {
      ...typography.body,
      color: colors.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
    },
    pressableFull: {
      width: '100%',
    },
    editBtn: {
      marginBottom: spacing.m,
    },
    logoutBtn: {
      marginBottom: spacing.s,
    },
  });
}
