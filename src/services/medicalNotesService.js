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
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_NOTES);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

async function saveAll(list) {
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_NOTES, JSON.stringify(list));
}

/**
 * Notas clínicas del médico sobre un paciente (historial consultable).
 */
export async function getNotesForPatient(patientId, doctorId) {
  const pid = String(patientId ?? '').trim();
  const did = String(doctorId ?? '').trim();
  if (!pid) return [];
  const all = await getAll();
  return all
    .filter((n) => n.patientId === pid && (!did || n.doctorId === did))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addMedicalNote({ doctorId, doctorName, patientId, text }) {
  const pid = String(patientId ?? '').trim();
  const did = String(doctorId ?? '').trim();
  const body = String(text ?? '').trim();
  if (!pid || !did || !body) return { success: false, error: 'Nota vacía' };

  const entry = {
    id: `note_${Date.now()}`,
    patientId: pid,
    doctorId: did,
    doctorName: doctorName || 'Médico',
    text: body,
    createdAt: new Date().toISOString(),
  };

  const all = await getAll();
  all.unshift(entry);
  await saveAll(all.slice(0, 200));
  return { success: true, note: entry };
}
