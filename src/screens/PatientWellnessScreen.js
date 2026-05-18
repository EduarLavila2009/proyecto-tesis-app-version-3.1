import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { STORAGE_KEYS } from '../constants/storage';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  TextInputField,
  ScreenContainer,
  SectionCard,
  SaveFeedbackBanner,
} from '../components';
import { spacing, typography, stackScrollContent, useTheme, createFieldGroupStyle } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveFeedback } from '../hooks/useSaveFeedback';
import {
  getRemindersByUser,
  addReminder,
  toggleReminderCompleted,
  deleteReminder,
} from '../services/remindersService';
import {
  getUpcomingAgenda,
  addAgendaEvent,
  deleteAgendaEvent,
} from '../services/agendaService';
import { updateUserProfile } from '../services/profileService';
import { scheduleReminderNotification, requestNotificationPermissions } from '../services/notificationService';

const fieldGroup = createFieldGroupStyle();

export default function PatientWellnessScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { feedbackMessage, showSuccess, clearFeedback } = useSaveFeedback();

  const [userId, setUserId] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState('measurement');
  const [evtTitle, setEvtTitle] = useState('');
  const [evtNotes, setEvtNotes] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u.id);
      setEmergencyName(u.emergencyContact?.name ?? '');
      setEmergencyPhone(u.emergencyContact?.phone ?? '');
      setAlertsEnabled(u.notificationPrefs?.vitalsAlerts !== false);

      const [rems, events] = await Promise.all([
        getRemindersByUser(u.id),
        getUpcomingAgenda(u.id, 14),
      ]);
      setReminders(rems);
      setAgenda(events);
    } catch (e) {
      console.error('PatientWellnessScreen.load', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAddReminder = async () => {
    if (!userId || !remTitle.trim()) {
      Alert.alert('Completa el título del recordatorio');
      return;
    }
    const due = new Date();
    due.setHours(due.getHours() + 1);
    const res = await addReminder({
      userId,
      title: remTitle.trim(),
      type: remType,
      dueAt: due,
    });
    if (res.success) {
      await scheduleReminderNotification(res.reminder);
      setRemTitle('');
      showSuccess('Recordatorio creado');
      load();
    }
  };

  const handleAddEvent = async () => {
    if (!userId || !evtTitle.trim()) {
      Alert.alert('Indica el título del evento');
      return;
    }
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    const res = await addAgendaEvent({
      userId,
      title: evtTitle.trim(),
      startAt: start,
      notes: evtNotes,
    });
    if (res.success) {
      setEvtTitle('');
      setEvtNotes('');
      showSuccess('Evento añadido a la agenda');
      load();
    }
  };

  const handleSaveEmergency = async () => {
    const res = await updateUserProfile({
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
      },
      notificationPrefs: { vitalsAlerts: alertsEnabled },
    });
    if (res.success) {
      if (alertsEnabled) await requestNotificationPermissions();
      showSuccess('Contacto y preferencias guardados');
    } else {
      Alert.alert('Error', res.message || 'No se pudo guardar');
    }
  };

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={stackScrollContent(insets, { paddingTop: spacing.m })}
      scrollProps={{ showsVerticalScrollIndicator: false }}
    >
      <SaveFeedbackBanner message={feedbackMessage} onHidden={clearFeedback} />

      <Text style={styles.pageTitle} allowFontScaling accessibilityRole="header">
        Cuidado y recordatorios
      </Text>
      <Text style={styles.intro} allowFontScaling>
        Alertas de métricas, recordatorios y agenda local en este dispositivo.
      </Text>

      <SectionCard title="Alertas de salud" icon="notifications-outline">
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel} allowFontScaling>
            Notificar si FC, presión u oxígeno están fuera de rango
          </Text>
          <Switch
            value={alertsEnabled}
            onValueChange={setAlertsEnabled}
            trackColor={{ false: colors.borderSubtle, true: `${colors.primary}99` }}
            thumbColor={alertsEnabled ? colors.primary : colors.surface}
          />
        </View>
        <SecondaryButton
          title="Ver alertas guardadas"
          icon="alert-circle-outline"
          appearance="outline"
          onPress={() => navigation.navigate('Alerts')}
          style={styles.mt}
        />
      </SectionCard>

      <SectionCard title="Contacto de emergencia" icon="call-outline">
        <TextInputField
          label="Nombre"
          containerStyle={fieldGroup}
          value={emergencyName}
          onChangeText={setEmergencyName}
          placeholder="Ej. María López"
        />
        <TextInputField
          label="Teléfono"
          containerStyle={fieldGroup}
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          placeholder="Ej. +34 600 000 000"
          validationType="phone"
        />
        <PrimaryButton title="Guardar contacto" onPress={handleSaveEmergency} />
      </SectionCard>

      <SectionCard title="Recordatorios" icon="alarm-outline">
        <View style={styles.typeRow}>
          <SecondaryButton
            title="Medición"
            appearance={remType === 'measurement' ? 'filled' : 'outline'}
            onPress={() => setRemType('measurement')}
            style={styles.typeBtn}
          />
          <SecondaryButton
            title="Medicación"
            appearance={remType === 'medication' ? 'filled' : 'outline'}
            onPress={() => setRemType('medication')}
            style={styles.typeBtn}
          />
        </View>
        <TextInputField
          label="Título"
          containerStyle={fieldGroup}
          value={remTitle}
          onChangeText={setRemTitle}
          placeholder="Ej. Tomar presión arterial"
        />
        <PrimaryButton title="Añadir recordatorio (1 h)" onPress={handleAddReminder} />
        {reminders.map((r) => (
          <View key={r.id} style={styles.listItem}>
            <PressableRow
              icon={r.type === 'medication' ? 'medkit-outline' : 'fitness-outline'}
              title={r.title}
              subtitle={new Date(r.dueAt).toLocaleString()}
              done={r.completed}
              onToggle={() =>
                toggleReminderCompleted(r.id, !r.completed).then(() => load())
              }
              onDelete={() => deleteReminder(r.id).then(() => load())}
              colors={colors}
            />
          </View>
        ))}
        {reminders.length === 0 ? (
          <Text style={styles.empty} allowFontScaling>
            Sin recordatorios. Añade uno arriba.
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Agenda (próximos 14 días)" icon="calendar-outline">
        <TextInputField
          label="Evento"
          containerStyle={fieldGroup}
          value={evtTitle}
          onChangeText={setEvtTitle}
          placeholder="Ej. Control con médico"
        />
        <TextInputField
          label="Notas"
          containerStyle={fieldGroup}
          value={evtNotes}
          onChangeText={setEvtNotes}
          placeholder="Opcional"
          multiline
          numberOfLines={2}
        />
        <PrimaryButton title="Añadir a agenda (mañana 10:00)" onPress={handleAddEvent} />
        {agenda.map((e) => (
          <View key={e.id} style={styles.listItem}>
            <PressableRow
              icon="calendar-outline"
              title={e.title}
              subtitle={new Date(e.startAt).toLocaleString()}
              onDelete={() => deleteAgendaEvent(e.id).then(() => load())}
              colors={colors}
            />
          </View>
        ))}
        {agenda.length === 0 ? (
          <Text style={styles.empty} allowFontScaling>
            No hay eventos próximos.
          </Text>
        ) : null}
      </SectionCard>
    </ScreenContainer>
  );
}

function PressableRow({ icon, title, subtitle, done, onToggle, onDelete, colors }) {
  return (
    <View style={rowStyles(colors).wrap}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={rowStyles(colors).text}>
        <Text
          style={[rowStyles(colors).title, done && rowStyles(colors).titleDone]}
          allowFontScaling
        >
          {title}
        </Text>
        <Text style={rowStyles(colors).sub} allowFontScaling>
          {subtitle}
        </Text>
      </View>
      {onToggle ? (
        <SecondaryButton
          title={done ? 'Hecho' : 'Pendiente'}
          appearance="outline"
          onPress={onToggle}
          style={rowStyles(colors).miniBtn}
        />
      ) : null}
      {onDelete ? (
        <SecondaryButton
          title="×"
          appearance="ghost"
          onPress={onDelete}
          style={rowStyles(colors).miniBtn}
        />
      ) : null}
    </View>
  );
}

const rowStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    text: { flex: 1, minWidth: 0 },
    title: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    titleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
    sub: { ...typography.caption, color: colors.textSecondary },
    miniBtn: { minWidth: 72 },
  });

function createStyles(colors) {
  return StyleSheet.create({
    pageTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    intro: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: typography.body.lineHeight * 1.35,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.m,
    },
    switchLabel: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
    },
    mt: { marginTop: spacing.m },
    typeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.m,
    },
    typeBtn: { flex: 1, minWidth: 0 },
    listItem: { marginTop: spacing.xs },
    empty: {
      ...typography.caption,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: spacing.m,
    },
  });
}
