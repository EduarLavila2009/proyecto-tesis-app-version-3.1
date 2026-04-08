import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

const MAX_RECORDS = 2000;

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function normalizeRecord(input) {
  if (!input) return null;

  const userId = String(input.userId ?? '').trim();
  if (!userId) return null;

  const dateMs =
    input.date instanceof Date
      ? input.date.getTime()
      : typeof input.date === 'number'
        ? input.date
        : new Date(input.date ?? Date.now()).getTime();

  if (!Number.isFinite(dateMs)) return null;

  const heartRate = Number(input.heartRate);
  const temperature = Number(input.temperature);
  const oxygen = Number(input.oxygen);

  const bp = input.bloodPressure || {};
  const systolic = bp?.systolic != null ? Number(bp.systolic) : Number(input.systolic ?? input.bloodPressureSystolic);
  const diastolic = bp?.diastolic != null ? Number(bp.diastolic) : Number(input.diastolic ?? input.bloodPressureDiastolic);

  if (![heartRate, temperature, oxygen, systolic, diastolic].every((n) => Number.isFinite(n))) {
    return null;
  }

  return {
    id: String(Date.now() + Math.random()).replace('.', ''),
    userId,
    date: new Date(dateMs).toISOString(),
    heartRate,
    temperature,
    bloodPressure: { systolic, diastolic },
    oxygen,
  };
}

async function getAllRecords() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export async function addMedicalRecord(payload) {
  const record = normalizeRecord(payload);
  if (!record) return { recorded: false, error: 'Datos inválidos' };

  const prev = await getAllRecords();
  const next = [record, ...prev].slice(0, MAX_RECORDS);

  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(next));
  return { recorded: true, record };
}

export async function getMedicalRecordsByUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];

  const all = await getAllRecords();
  const list = all.filter((r) => r?.userId === uid);
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return list;
}

export async function getLatestMedicalRecord(userId) {
  const list = await getMedicalRecordsByUser(userId);
  return list.length > 0 ? list[0] : null;
}

