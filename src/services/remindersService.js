import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

async function getAll() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

async function saveAll(list) {
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(list));
}

/**
 * Recordatorios de medición o medicación (local).
 * @param {string} userId
 */
export async function getRemindersByUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];
  const all = await getAll();
  return all
    .filter((r) => r.userId === uid)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export async function addReminder({ userId, title, type, dueAt, repeatDaily = false }) {
  const uid = String(userId ?? '').trim();
  if (!uid || !title?.trim()) return { success: false, error: 'Datos incompletos' };

  const entry = {
    id: `rem_${Date.now()}`,
    userId: uid,
    title: title.trim(),
    type: type === 'medication' ? 'medication' : 'measurement',
    dueAt: dueAt instanceof Date ? dueAt.toISOString() : dueAt,
    repeatDaily: Boolean(repeatDaily),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const all = await getAll();
  all.push(entry);
  await saveAll(all);
  return { success: true, reminder: entry };
}

export async function toggleReminderCompleted(reminderId, completed) {
  const all = await getAll();
  const idx = all.findIndex((r) => r.id === reminderId);
  if (idx === -1) return { success: false };
  all[idx] = { ...all[idx], completed: Boolean(completed) };
  await saveAll(all);
  return { success: true, reminder: all[idx] };
}

export async function deleteReminder(reminderId) {
  const all = await getAll();
  const next = all.filter((r) => r.id !== reminderId);
  await saveAll(next);
  return { success: true };
}

/** Recordatorios vencidos no completados (para avisos in-app). */
export async function getDueReminders(userId) {
  const now = Date.now();
  const list = await getRemindersByUser(userId);
  return list.filter((r) => !r.completed && new Date(r.dueAt).getTime() <= now);
}
