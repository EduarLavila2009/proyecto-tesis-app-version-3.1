import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

/** Muestra alertas aunque la app esté en primer plano. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Notificación local inmediata (alerta de métricas).
 */
export async function notifyVitalsAlert({ title, body }) {
  const ok = await requestNotificationPermissions();
  if (!ok) return { scheduled: false };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Alerta médica',
      body: body || 'Revisa tus métricas vitales.',
      sound: true,
    },
    trigger: null,
  });
  return { scheduled: true };
}

/**
 * Programa recordatorio local (medición / medicación).
 */
export async function scheduleReminderNotification(reminder) {
  const ok = await requestNotificationPermissions();
  if (!ok) return { scheduled: false, notificationId: null };

  const due = new Date(reminder.dueAt);
  if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) {
    return { scheduled: false, notificationId: null };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title:
        reminder.type === 'medication'
          ? 'Recordatorio de medicación'
          : 'Recordatorio de medición',
      body: reminder.title,
      sound: true,
    },
    trigger: { type: 'date', date: due },
  });

  const mapRaw = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
  const map = safeParse(mapRaw, {});
  map[reminder.id] = notificationId;
  await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(map));

  return { scheduled: true, notificationId };
}

export async function cancelReminderNotification(reminderId) {
  const mapRaw = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
  const map = safeParse(mapRaw, {});
  const nid = map[reminderId];
  if (nid) {
    await Notifications.cancelScheduledNotificationAsync(nid);
    delete map[reminderId];
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(map));
  }
}
