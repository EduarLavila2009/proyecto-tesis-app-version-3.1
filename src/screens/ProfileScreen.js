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
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import QRCode from 'react-native-qrcode-svg';
import { buildPatientQrPayload } from '../services/connectionService';
import { logout } from '../services/authService';
import { updateUserProfile } from '../services/profileService';
import { getUnreadAlertsCount } from '../services/alertsService';
import { getMedicalRecordsByUser } from '../services/medicalRecordsService';
import { evaluateMonitoringAlert } from '../utils/vitalsMonitoring';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  PressableScale,
  TabScreenLayout,
  BadgeSystem,
  GlassmorphicCard,
} from '../components';
import {
  spacing,
  typography,
  layout,
  useTheme,
  createSectionHeadingStyle,
  scale,
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
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

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
          const parsedUser = JSON.parse(raw);
          setUser(parsedUser);
          
          const count = await getUnreadAlertsCount();
          if (!cancelled) setUnreadAlerts(count);

          if (parsedUser?.id) {
            const records = await getMedicalRecordsByUser(parsedUser.id);
            if (!cancelled) setMedicalRecords(records);
          }
        } catch (_) {
          setUser(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const badgesData = useMemo(() => {
    if (!user || user.role !== ROLES.PATIENT) return [];

    const totalRecords = medicalRecords.length;

    // 1) Insignia 1: Guardián de la Salud (Adherencia >= 5 registros)
    const badgeAdherenceUnlocked = totalRecords >= 5;
    const badgeAdherenceProgress = Math.min(totalRecords, 5);

    // Obtener los últimos 5 registros para evaluar
    const last5 = medicalRecords.slice(0, 5);
    const last5Length = last5.length;

    // 2) Insignia 2: Corazón de Hierro (Últimos 5 registros con FC de 60 a 90 bpm)
    let hrStableCount = 0;
    if (last5Length > 0) {
      last5.forEach((r) => {
        if (r.heartRate >= 60 && r.heartRate <= 90) hrStableCount++;
      });
    }
    const badgeHeartUnlocked = last5Length >= 5 && hrStableCount === 5;
    const badgeHeartProgress = last5Length < 5 ? hrStableCount : hrStableCount;

    // 3) Insignia 3: Oxígeno Puro (Últimos 5 registros con SpO2 >= 96%)
    let oxygenGoodCount = 0;
    if (last5Length > 0) {
      last5.forEach((r) => {
        if (r.oxygen >= 96) oxygenGoodCount++;
      });
    }
    const badgeOxygenUnlocked = last5Length >= 5 && oxygenGoodCount === 5;
    const badgeOxygenProgress = oxygenGoodCount;

    // 4) Insignia 4: Presión Controlada (Promedio sistólica últimos 5 registros <= 125 mmHg)
    let bpSystolicGoodCount = 0;
    if (last5Length > 0) {
      last5.forEach((r) => {
        if (r.bloodPressure && r.bloodPressure.systolic <= 125) bpSystolicGoodCount++;
      });
    }
    const badgeBpUnlocked = last5Length >= 5 && bpSystolicGoodCount === 5;
    const badgeBpProgress = bpSystolicGoodCount;

    return [
      {
        id: 'adherence',
        title: 'Guardián de la Salud',
        description: 'Completa al menos 5 registros vitales en tu historial.',
        detail: 'Este logro reconoce tu disciplina en el registro de métricas. El monitoreo recurrente es clave en la detección temprana de anomalías fisiológicas domiciliarias.',
        medicalFact: 'Según la Organización Mundial de la Salud (OMS), el autocuidado de hábitos saludables reduce significativamente las admisiones de emergencia.',
        icon: 'heart-outline',
        color: ['#0D9488', '#10B981'],
        unlocked: badgeAdherenceUnlocked,
        progress: badgeAdherenceProgress,
        target: 5,
        progressLabel: `${badgeAdherenceProgress}/5 registros`,
      },
      {
        id: 'heart_rate',
        title: 'Corazón de Hierro',
        description: 'Tus últimos 5 registros de ritmo cardíaco deben estar entre 60 y 90 bpm.',
        detail: 'Este logro se otorga por mantener una frecuencia cardíaca en reposo estable dentro de rangos clínicamente recomendados.',
        medicalFact: 'La Asociación Americana del Corazón (AHA) establece que una frecuencia cardíaca en reposo regular refleja una función muscular cardíaca eficiente.',
        icon: 'heart',
        color: ['#EF4444', '#F59E0B'],
        unlocked: badgeHeartUnlocked,
        progress: badgeHeartProgress,
        target: 5,
        progressLabel: `${badgeHeartProgress}/5 estables`,
      },
      {
        id: 'oxygen',
        title: 'Oxígeno Puro',
        description: 'Tus últimos 5 registros de saturación SpO₂ deben ser mayor o igual a 96%.',
        detail: 'Este logro reconoce un excelente nivel de oxigenación tisular y adecuado funcionamiento pulmonar en reposo.',
        medicalFact: 'Un SpO₂ de 96% a 100% es un indicador clínico de intercambio gaseoso y ventilación pulmonar altamente óptimos.',
        icon: 'lungs',
        color: ['#10B981', '#0D9488'],
        unlocked: badgeOxygenUnlocked,
        progress: badgeOxygenProgress,
        target: 5,
        progressLabel: `${badgeOxygenProgress}/5 excelentes`,
      },
      {
        id: 'blood_pressure',
        title: 'Presión Controlada',
        description: 'Tus últimos 5 registros de presión arterial sistólica deben ser menor o igual a 125 mmHg.',
        detail: 'Este logro se otorga por mantener una presión sistólica estable que previene la sobrecarga endotelial de reposo.',
        medicalFact: 'Mantener la presión arterial sistólica en reposo por debajo de 125 mmHg reduce drásticamente factores de sobrecarga cardiovascular estructural.',
        icon: 'pulse-outline',
        color: ['#8B5CF6', '#EC4899'],
        unlocked: badgeBpUnlocked,
        progress: badgeBpProgress,
        target: 5,
        progressLabel: `${badgeBpProgress}/5 controlados`,
      },
    ];
  }, [user, medicalRecords]);

  const latestRecord = medicalRecords[0] ?? null;

  const latestAlertStatus = useMemo(() => {
    if (!latestRecord) return 'stable';
    const systolic = latestRecord?.bloodPressure?.systolic;
    const diastolic = latestRecord?.bloodPressure?.diastolic;
    if (
      typeof latestRecord.heartRate !== 'number' ||
      typeof systolic !== 'number' ||
      typeof diastolic !== 'number'
    ) {
      return 'stable';
    }
    try {
      const alertEval = evaluateMonitoringAlert(latestRecord.heartRate, systolic, diastolic, latestRecord.oxygen);
      return alertEval?.level || 'stable';
    } catch (_) {
      return 'stable';
    }
  }, [latestRecord]);
 
  const displayName = user?.name?.trim() || '—';
  const displayEmail = user?.email?.trim() || '—';
  const displayPhone =
    typeof user?.phone === 'string' && user.phone.trim()
      ? user.phone.trim()
      : 'Sin registrar';

  const triggerHaptic = (type) => {
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (_) {}
  };

  const refreshUser = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (raw) setUser(JSON.parse(raw));
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Para cambiar tu foto de perfil necesitamos acceso a tu galería multimedia.'
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
        triggerHaptic('success');
      } else {
        Alert.alert('Error', res.message || 'No se pudo guardar la imagen de perfil.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cargar la imagen seleccionada.');
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleEditProfile = () => {
    triggerHaptic('impact');
    navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    triggerHaptic('impact');
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión de tu cuenta clínica?', [
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
    triggerHaptic('impact');
    try {
      await Share.share({
        message: `Pasaporte Clínico Digital MEDICAL corp\nPaciente: ${displayName}\nID: ${user.id}\n${buildPatientQrPayload(user.id)}`,
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
      {/* Hero: avatar + identidad visual premium */}
      <View style={styles.hero}>
        <PressableScale
          onPress={handlePickAvatar}
          style={styles.avatarPressable}
          accessibilityLabel="Cambiar foto de perfil"
        >
          <View
            style={[
              styles.avatarRing,
              cardShadow,
              { width: avatarRing, height: avatarRing, borderRadius: avatarRing / 2 },
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
                    borderRadius: avatarDisplay / 2,
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
                  borderRadius: cameraBadge / 2,
                },
              ]}
            >
              <Ionicons name="camera" size={Math.round(cameraBadge * 0.5)} color={colors.onPrimary} />
            </View>
          </View>
        </PressableScale>

        <Text style={styles.displayName} allowFontScaling numberOfLines={2}>
          {displayName}
        </Text>

        <View style={styles.emailPill}>
          <Text style={styles.displayEmail} allowFontScaling numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>

        <Text style={styles.photoHint} allowFontScaling>
          Toca tu avatar para actualizar tu fotografía
        </Text>
      </View>

      {/* 1. Pasaporte Clínico QR (Top Priority en Layout) */}
      {isPatient && user?.id ? (
        <>
          <Text style={styles.sectionHeading} allowFontScaling>
            Pasaporte Clínico Digital
          </Text>
          <GlassmorphicCard
            style={[styles.qrCard, { padding: 0 }]}
            alertType={latestAlertStatus === 'stable' ? 'success' : latestAlertStatus}
          >
            <View style={styles.qrCardInner}>
              <View style={[styles.qrHeaderPill, {
                backgroundColor: latestAlertStatus === 'critical' ? `${colors.danger}15` : latestAlertStatus === 'warning' ? `${colors.warning}15` : colors.secondaryMuted,
                borderColor: latestAlertStatus === 'critical' ? `${colors.danger}33` : latestAlertStatus === 'warning' ? `${colors.warning}33` : `${colors.primary}33`,
                borderWidth: 1
              }]}>
                <Ionicons
                  name={latestAlertStatus === 'critical' ? 'alert-circle' : 'shield-checkmark'}
                  size={14}
                  color={latestAlertStatus === 'critical' ? colors.danger : latestAlertStatus === 'warning' ? colors.warning : colors.primary}
                />
                <Text style={[styles.qrHeaderPillText, {
                  color: latestAlertStatus === 'critical' ? colors.danger : latestAlertStatus === 'warning' ? colors.warning : colors.primary
                }]}>PASAPORTE CLÍNICO DIGITAL</Text>
              </View>
 
              <Text style={styles.qrHint} allowFontScaling>
                Muestra esta credencial a tu médico tratante para vincular de forma segura tu expediente clínico.
              </Text>
              
              <View style={[styles.qrWrap, {
                shadowColor: latestAlertStatus === 'critical' ? colors.danger : latestAlertStatus === 'warning' ? colors.warning : colors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.22,
                shadowRadius: 15,
                elevation: 6,
              }]}>
                <QRCode
                  value={buildPatientQrPayload(user.id)}
                  size={qrSize}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>
              
              <Text style={styles.qrId} selectable allowFontScaling>
                ID CLINICO · {user.id}
              </Text>
              
              <SecondaryButton
                title="Compartir pasaporte"
                icon="share-outline"
                onPress={handleShareQr}
                style={styles.shareQrBtn}
                accessibilityLabel="Compartir código QR del paciente"
              />
            </View>
          </GlassmorphicCard>
        </>
      ) : null}

      {/* 2. Logros Clínicos de Autocuidado (Central) */}
      {isPatient && badgesData.length > 0 ? (
        <>
          <Text style={styles.sectionHeading} allowFontScaling>
            Logros de Autocuidado
          </Text>
          <GlassmorphicCard style={styles.badgesCard}>
            <BadgeSystem
              badges={badgesData}
              onBadgePress={(badge) => {
                triggerHaptic('impact');
                setSelectedBadge(badge);
                setBadgeModalVisible(true);
              }}
            />
          </GlassmorphicCard>
        </>
      ) : null}

      {/* 3. Salud y Recordatorios */}
      {isPatient ? (
        <>
          <Text style={styles.sectionHeading} allowFontScaling>
            Monitoreo y Agenda
          </Text>
          <GlassmorphicCard style={styles.toolsCard}>
            <PrimaryButton
              title="Cuidado y recordatorios"
              icon="heart-outline"
              onPress={() => { triggerHaptic('impact'); navigation.navigate('PatientWellness'); }}
              style={styles.toolBtn}
              accessibilityLabel="Abrir recordatorios, agenda y contacto de emergencia"
            />
            <SecondaryButton
              title={unreadAlerts > 0 ? `Alertas activas (${unreadAlerts})` : 'Revisar alertas médicas'}
              icon="notifications-outline"
              onPress={() => { triggerHaptic('impact'); navigation.navigate('Alerts'); }}
              style={styles.toolBtnLast}
              accessibilityLabel="Ver alertas médicas"
            />
          </GlassmorphicCard>
        </>
      ) : null}

      {/* 4. Apariencia y Ajustes */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Apariencia
      </Text>
      <GlassmorphicCard style={styles.settingsCard}>
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
              {isDark ? 'Tema clínico oscuro activo' : 'Reducción de fatiga en baja luz'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(v) => { triggerHaptic('impact'); setMode(v ? 'dark' : 'light'); }}
            trackColor={{
              false: colors.borderSubtle,
              true: `${colors.primary}99`,
            }}
            thumbColor={isDark ? colors.primary : colors.surface}
            ios_backgroundColor={colors.borderSubtle}
            accessibilityLabel="Activar modo oscuro"
          />
        </View>
      </GlassmorphicCard>

      {/* 5. Doctor Connection Tool */}
      {isDoctor ? (
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
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
              Vincular paciente (Escanear QR)
            </Text>
          </PressableScale>

          <PressableScale
            containerStyle={styles.pressableFull}
            style={[styles.linkPatientBtn, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('PatientVerification')}
            accessibilityRole="button"
            accessibilityLabel="Verificar paciente escaneando su código QR"
          >
            <Ionicons
              name="qr-code-outline"
              size={22}
              color={colors.primary}
              style={styles.linkPatientIcon}
            />
            <Text style={[styles.linkPatientLabel, { color: colors.primary }]} allowFontScaling>
              Verificar paciente (Escáner QR)
            </Text>
          </PressableScale>

          <PressableScale
            containerStyle={styles.pressableFull}
            style={[styles.linkPatientBtn, { backgroundColor: colors.secondaryMuted, borderColor: colors.secondary }]}
            onPress={() => navigation.navigate('ManualVerification')}
            accessibilityRole="button"
            accessibilityLabel="Verificar paciente introduciendo código de 9 dígitos"
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={colors.secondary}
              style={styles.linkPatientIcon}
            />
            <Text style={[styles.linkPatientLabel, { color: colors.secondary }]} allowFontScaling>
              Verificar paciente (Código Manual)
            </Text>
          </PressableScale>
        </View>
      ) : null}

      {/* 6. Información Adicional */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Información de Cuenta
      </Text>
      <GlassmorphicCard style={styles.infoCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel} allowFontScaling>
            Teléfono Registrado
          </Text>
          <Text style={styles.fieldValue} selectable allowFontScaling>
            {displayPhone}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel} allowFontScaling>
            Rol de Acceso
          </Text>
          <Text style={styles.fieldValue} selectable allowFontScaling>
            {user?.role === 'doctor' ? 'Personal Médico Autorizado' : 'Paciente Monitoreado'}
          </Text>
        </View>
      </GlassmorphicCard>

      {/* 7. Acciones Rápidas del Sistema */}
      <Text style={styles.sectionHeading} allowFontScaling>
        Acciones Rápidas
      </Text>
      <View style={styles.systemActionsCard}>
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
          color={colors.danger}
          onPress={handleLogout}
          style={styles.logoutBtn}
          accessibilityLabel="Cerrar sesión"
        />
      </View>

      {/* Modal Educativo de Detalles de Insignia */}
      <Modal
        visible={badgeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1 }]}>
            {selectedBadge && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>LOGRO CLÍNICO</Text>
                  <TouchableOpacity onPress={() => setBadgeModalVisible(false)}>
                    <Ionicons name="close" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.badgeModalHero}>
                    {selectedBadge.unlocked ? (
                      <LinearGradient
                        colors={selectedBadge.color}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badgeModalIconGlow}
                      >
                        <Ionicons name={selectedBadge.icon} size={48} color="#FFFFFF" />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.badgeModalIconLocked, { backgroundColor: colors.secondaryMuted }]}>
                        <Ionicons name="lock-closed" size={44} color={colors.textPlaceholder} />
                      </View>
                    )}
                    
                    <Text style={[styles.badgeModalTitle, { color: colors.textPrimary }]} allowFontScaling>
                      {selectedBadge.title}
                    </Text>
                    
                    <View style={[
                      styles.badgeModalStatusPill,
                      {
                        backgroundColor: selectedBadge.unlocked ? `${colors.success}1A` : `${colors.primary}1A`,
                        borderColor: selectedBadge.unlocked ? colors.success : colors.primary
                      }
                    ]}>
                      <Ionicons
                        name={selectedBadge.unlocked ? 'checkmark-circle' : 'time-outline'}
                        size={14}
                        color={selectedBadge.unlocked ? colors.success : colors.primary}
                      />
                      <Text style={[
                        styles.badgeModalStatusText,
                        { color: selectedBadge.unlocked ? colors.success : colors.primary }
                      ]} allowFontScaling>
                        {selectedBadge.unlocked ? 'LOGRADO' : 'EN DESARROLLO'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.badgeModalSectionHeading}>Criterio de Desbloqueo</Text>
                  <GlassmorphicCard style={styles.badgeModalCard}>
                    <Text style={[styles.badgeModalBody, { color: colors.textPrimary }]} allowFontScaling>
                      {selectedBadge.description}
                    </Text>
                    {!selectedBadge.unlocked ? (
                      <View style={{ marginTop: spacing.sm }}>
                        <View style={styles.modalProgressBar}>
                          <View
                            style={[
                              styles.modalProgressFill,
                              {
                                backgroundColor: colors.primary,
                                width: `${(selectedBadge.progress / selectedBadge.target) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.modalProgressText, { color: colors.textSecondary }]} allowFontScaling>
                          Progreso actual: {selectedBadge.progressLabel}
                        </Text>
                      </View>
                    ) : null}
                  </GlassmorphicCard>

                  <Text style={styles.badgeModalSectionHeading}>Importancia Clínica</Text>
                  <GlassmorphicCard style={styles.badgeModalCard}>
                    <Text style={[styles.badgeModalBody, { color: colors.textPrimary, lineHeight: 20 }]} allowFontScaling>
                      {selectedBadge.detail}
                    </Text>
                  </GlassmorphicCard>

                  <Text style={styles.badgeModalSectionHeading}>Evidencia Científica</Text>
                  <GlassmorphicCard style={[styles.badgeModalCard, { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: spacing.md }]}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                      <Ionicons name="book-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                      <Text style={[styles.badgeModalBody, { color: colors.textSecondary, fontStyle: 'italic', flex: 1 }]} allowFontScaling>
                        {selectedBadge.medicalFact}
                      </Text>
                    </View>
                  </GlassmorphicCard>
                </ScrollView>

                <PrimaryButton
                  title="Entendido"
                  onPress={() => setBadgeModalVisible(false)}
                  style={styles.badgeModalCloseBtn}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
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
      fontSize: scale(typography.h2.fontSize),
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
      fontSize: scale(typography.body.fontSize - 1),
      color: colors.textSecondary,
      textAlign: 'center',
    },
    photoHint: {
      ...typography.caption,
      fontSize: scale(typography.caption.fontSize),
      color: colors.textPlaceholder,
      textAlign: 'center',
      marginBottom: spacing.m,
    },
    toolsCard: {
      marginBottom: spacing.lg,
      padding: spacing.md,
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
      marginBottom: spacing.sm,
    },
    settingsCard: {
      marginBottom: spacing.lg,
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
      width: '100%',
    },
    qrCardInner: {
      padding: spacing.lg, 
      width: '100%', 
      alignItems: 'center',
    },
    qrHeaderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 20,
      marginBottom: spacing.md,
    },
    qrHeaderPillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    qrHint: {
      ...typography.body,
      fontSize: scale(typography.body.fontSize - 1),
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: typography.body.lineHeight * 1.35,
      paddingHorizontal: spacing.sm,
    },
    qrWrap: {
      padding: spacing.m,
      borderRadius: spacing.radiusCard,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    qrId: {
      marginTop: spacing.lg,
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: 1,
    },
    shareQrBtn: {
      width: '100%',
      marginTop: spacing.lg,
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
    systemActionsCard: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    editBtn: {
      marginBottom: spacing.m,
    },
    logoutBtn: {
      marginBottom: spacing.s,
    },
    badgesCard: {
      marginBottom: spacing.lg,
      padding: spacing.md,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      borderRadius: spacing.radiusCard * 1.5,
      padding: spacing.lg,
      width: '100%',
      maxHeight: '85%',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
      paddingBottom: spacing.m,
      marginBottom: spacing.m,
    },
    modalTitle: {
      ...typography.subtitle,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    modalScroll: {
      paddingBottom: spacing.lg,
    },
    badgeModalHero: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.md,
    },
    badgeModalIconGlow: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      marginBottom: spacing.md,
    },
    badgeModalIconLocked: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.borderSubtle,
      marginBottom: spacing.md,
    },
    badgeModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: spacing.xs,
      letterSpacing: -0.3,
    },
    badgeModalStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    badgeModalStatusText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    badgeModalSectionHeading: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
    badgeModalCard: {
      padding: spacing.md,
      marginBottom: spacing.xs,
    },
    badgeModalBody: {
      fontSize: 13,
      fontWeight: '500',
    },
    modalProgressBar: {
      height: 6,
      width: '100%',
      backgroundColor: colors.borderSubtle,
      borderRadius: 3,
      overflow: 'hidden',
    },
    modalProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    modalProgressText: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    badgeModalCloseBtn: {
      marginTop: spacing.md,
      width: '100%',
    },
  });
}
