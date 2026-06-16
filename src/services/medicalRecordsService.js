import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { db, isFirebaseDisabled } from './firebase';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { runWithTimeout } from '../utils/promiseTimeout';

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
    source: input.source || 'manual',
  };
}

async function getAllRecords() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Guarda una medición médica localmente y en la nube en Firestore.
 * @param {object} payload
 */
export async function addMedicalRecord(payload) {
  const record = normalizeRecord(payload);
  if (!record) return { recorded: false, error: 'Datos inválidos' };

  // 1. Guardar en Firestore
  if (!isFirebaseDisabled) {
    try {
      await runWithTimeout(
        setDoc(doc(db, 'medical_records', record.id), record),
        2500
      );
    } catch (onlineErr) {
      console.warn("Fallo de guardado en Firestore de registro médico:", onlineErr.message);
    }
  }

  // 2. Guardar localmente en cache
  const prev = await getAllRecords();
  const next = [record, ...prev].slice(0, MAX_RECORDS);

  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(next));
  return { recorded: true, record };
}

/**
 * Obtiene el historial clínico de un usuario de Firestore y actualiza el cache local.
 * @param {string} userId
 */
export async function getMedicalRecordsByUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];

  // 1. Intentar leer de Firestore (Online)
  if (!isFirebaseDisabled) {
    try {
      const recordsRef = collection(db, 'medical_records');
      const q = query(recordsRef, where('userId', '==', uid));
      const querySnapshot = await runWithTimeout(getDocs(q), 2500);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data());
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Sincronizar cache local conservando los registros de otros usuarios
        const allLocal = await getAllRecords();
        const otherUsersRecords = allLocal.filter((r) => r?.userId !== uid);
        const updatedAll = [...list, ...otherUsersRecords].slice(0, MAX_RECORDS);
        await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(updatedAll));

        return list;
      }
    } catch (onlineErr) {
      console.log("medicalRecordsService.getMedicalRecordsByUser: Usando cache offline:", onlineErr.message);
    }
  }

  // 2. Fallback: Leer cache local de AsyncStorage (Offline)
  const all = await getAllRecords();
  const list = all.filter((r) => r?.userId === uid);
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return list;
}

/**
 * Obtiene el registro médico más reciente de un usuario.
 * @param {string} userId
 */
export async function getLatestMedicalRecord(userId) {
  const list = await getMedicalRecordsByUser(userId);
  return list.length > 0 ? list[0] : null;
}
