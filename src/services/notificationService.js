import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

// Detectar de forma segura si la aplicación se ejecuta en el cliente Expo Go
let isExpoGo = false;
try {
  const Constants = require('expo-constants').default;
  isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'store-client';
} catch (_) {
  // Fallback seguro si la biblioteca expo-constants no se puede resolver
}

/** Muestra alertas aunque la app esté en primer plano. Envuelta en try-catch por resiliencia. */
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.warn('[MEDICAL corp NotificationService] No se pudo inicializar setNotificationHandler:', error);
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export async function requestNotificationPermissions() {
  try {
    if (isExpoGo && Platform.OS === 'android') {
      console.warn(
        "[MEDICAL corp NotificationService] Entorno de ejecución: Expo Go en Android.\n" +
        "IMPORTANTE: La funcionalidad nativa de push notifications remotas fue removida en Expo Go a partir de SDK 53.\n" +
        "Para probar push notifications remotas con total fidelidad en producción, por favor compila la app usando un build de desarrollo ('expo-dev-client')."
      );
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('[MEDICAL corp NotificationService] Error solicitando permisos de notificación:', error);
    return false;
  }
}

/**
 * Notificación local inmediata (alerta de métricas).
 */
export async function notifyVitalsAlert({ title, body }) {
  try {
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
  } catch (error) {
    console.warn('[MEDICAL corp NotificationService] Error enviando alerta local instantánea:', error);
    return { scheduled: false };
  }
}

/**
 * Programa recordatorio local (medición / medicación).
 */
export async function scheduleReminderNotification(reminder) {
  try {
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
  } catch (error) {
    console.warn('[MEDICAL corp NotificationService] Error programando notificación diferida:', error);
    return { scheduled: false, notificationId: null };
  }
}

export async function cancelReminderNotification(reminderId) {
  try {
    const mapRaw = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    const map = safeParse(mapRaw, {});
    const nid = map[reminderId];
    if (nid) {
      await Notifications.cancelScheduledNotificationAsync(nid);
      delete map[reminderId];
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(map));
    }
  } catch (error) {
    console.warn('[MEDICAL corp NotificationService] Error cancelando recordatorio de notificación:', error);
  }
}

