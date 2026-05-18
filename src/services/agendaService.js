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
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.AGENDA_EVENTS);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

async function saveAll(list) {
  await AsyncStorage.setItem(STORAGE_KEYS.AGENDA_EVENTS, JSON.stringify(list));
}

export async function getAgendaEventsByUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];
  const all = await getAll();
  return all
    .filter((e) => e.userId === uid)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export async function addAgendaEvent({ userId, title, startAt, notes = '' }) {
  const uid = String(userId ?? '').trim();
  if (!uid || !title?.trim()) return { success: false };

  const entry = {
    id: `evt_${Date.now()}`,
    userId: uid,
    title: title.trim(),
    startAt: startAt instanceof Date ? startAt.toISOString() : startAt,
    notes: String(notes || '').trim(),
    createdAt: new Date().toISOString(),
  };

  const all = await getAll();
  all.push(entry);
  await saveAll(all);
  return { success: true, event: entry };
}

export async function deleteAgendaEvent(eventId) {
  const all = await getAll();
  await saveAll(all.filter((e) => e.id !== eventId));
  return { success: true };
}

/** Próximos 7 días desde hoy. */
export async function getUpcomingAgenda(userId, daysAhead = 7) {
  const list = await getAgendaEventsByUser(userId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);
  end.setHours(23, 59, 59, 999);
  return list.filter((e) => {
    const t = new Date(e.startAt).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}
