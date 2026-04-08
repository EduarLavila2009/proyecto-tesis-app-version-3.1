import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import QRCode from 'react-native-qrcode-svg';
import { buildPatientQrPayload } from '../services/connectionService';
import { logout } from '../services/authService';
import { updateUserProfile } from '../services/profileService';
import { Header, Card, PressableScale } from '../components';
import { spacing, typography, useTheme } from '../theme';

const AVATAR_DISPLAY = 112;
const AVATAR_RING = AVATAR_DISPLAY + spacing.lg * 2;

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
 * Perfil — datos en AsyncStorage; foto desde galería (base64 o URI).
 */
export default function ProfileScreen({ navigation }) {
  const { colors, cardShadow, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);

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

  const showAvatarImage = hasAvatarUri(user);
  const isPatient = user?.role === ROLES.PATIENT;
  const isDoctor = user?.role === ROLES.DOCTOR;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xl + spacing.lg + spacing.md + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Mi perfil"
          style={styles.headerBlock}
          textStyle={styles.headerTitle}
        />

        <View style={styles.hero}>
          <Pressable
            onPress={handlePickAvatar}
            style={({ pressed }) => [styles.avatarPressable, pressed && styles.avatarPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            <View style={[styles.avatarRing, cardShadow]}>
              {pickingPhoto ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : showAvatarImage ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Text style={styles.avatarInitials} allowFontScaling>
                  {avatarInitials(displayName)}
                </Text>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color={colors.onPrimary} />
              </View>
            </View>
          </Pressable>

          <Text style={styles.displayName} allowFontScaling numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={styles.displaySub} allowFontScaling>
            {displayEmail}
          </Text>

          <Pressable onPress={handlePickAvatar} style={styles.changePhotoLink}>
            <Text style={styles.changePhotoText} allowFontScaling>
              Cambiar foto de perfil
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeading} allowFontScaling>
          Apariencia
        </Text>
        <Card style={styles.settingsCard}>
          <View style={styles.themeRow}>
            <View style={styles.themeTextBlock}>
              <Text style={styles.themeTitle} allowFontScaling>
                Modo oscuro
              </Text>
              <Text style={styles.themeHint} allowFontScaling>
                Menos brillo en ambientes oscuros
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
            />
          </View>
        </Card>

        {isPatient && user?.id ? (
          <>
            <Text style={styles.sectionHeading} allowFontScaling>
              Tu código QR
            </Text>
            <Card style={styles.qrCard}>
              <Text style={styles.qrHint} allowFontScaling>
                Muéstralo a tu médico para que escanee y te vincule a su lista.
              </Text>
              <View style={styles.qrWrap}>
                <QRCode
                  value={buildPatientQrPayload(user.id)}
                  size={200}
                  color={colors.textPrimary}
                  backgroundColor={colors.surface}
                />
              </View>
              <Text style={styles.qrId} selectable allowFontScaling>
                ID: {user.id}
              </Text>
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
            <Ionicons name="qr-code-outline" size={22} color={colors.primary} style={styles.linkPatientIcon} />
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

        <PressableScale
          containerStyle={styles.pressableFull}
          style={styles.editPrimaryBtn}
          onPress={handleEditProfile}
          accessibilityRole="button"
          accessibilityLabel="Editar datos del perfil"
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={colors.onPrimary}
            style={styles.editIcon}
          />
          <Text style={styles.editPrimaryLabel} allowFontScaling>
            Editar perfil
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
            size={22}
            color={colors.danger}
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText} allowFontScaling>
            Cerrar sesión
          </Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    headerBlock: {
      marginBottom: spacing.lg,
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
    hero: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    avatarPressable: {
      marginBottom: spacing.md,
    },
    avatarPressed: {
      opacity: 0.88,
    },
    avatarRing: {
      width: AVATAR_RING,
      height: AVATAR_RING,
      borderRadius: AVATAR_RING / 2,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: `${colors.primary}35`,
      overflow: 'hidden',
    },
    avatarImage: {
      width: AVATAR_DISPLAY + spacing.md,
      height: AVATAR_DISPLAY + spacing.md,
      borderRadius: (AVATAR_DISPLAY + spacing.md) / 2,
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    displayName: {
      fontSize: typography.title.fontSize + 2,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    displaySub: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    changePhotoLink: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    changePhotoText: {
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    sectionHeading: {
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    settingsCard: {
      width: '100%',
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderRadius: spacing.radiusLg,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    themeTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    themeTitle: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    themeHint: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      color: colors.textSecondary,
      lineHeight: typography.caption.fontSize * 1.4,
    },
    qrCard: {
      width: '100%',
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderRadius: spacing.radiusLg,
      alignItems: 'center',
    },
    qrHint: {
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: typography.body.fontSize * 1.45,
    },
    qrWrap: {
      padding: spacing.md,
      borderRadius: spacing.radiusCard,
      backgroundColor: colors.surface,
    },
    qrId: {
      marginTop: spacing.md,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    linkPatientBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: spacing.minTouchTarget + spacing.xs,
      paddingVertical: spacing.md,
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
      fontSize: typography.body.fontSize,
      fontWeight: '700',
      color: colors.primary,
    },
    infoCard: {
      width: '100%',
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderRadius: spacing.radiusLg,
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
    editPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: spacing.minTouchTarget + spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: spacing.radiusButton,
      backgroundColor: colors.primary,
      marginBottom: spacing.md,
    },
    editIcon: {
      marginRight: spacing.sm,
    },
    editPrimaryLabel: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: spacing.minTouchTarget + spacing.xs,
      paddingVertical: spacing.md,
      marginTop: spacing.xs,
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
}
