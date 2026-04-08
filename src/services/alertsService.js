import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

const MAX_ALERTS = 60;

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function buildSignature({ level, reasons, vitals, patientId }) {
  const reasonCodes = (reasons || []).map((r) => r.code).sort().join('|');
  const v = vitals || {};
  const compactVitals = [
    v.heartRate ?? '',
    v.systolic ?? '',
    v.diastolic ?? '',
    v.spo2 ?? '',
  ].join(',');
  return `${patientId || 'self'}:${level}:${reasonCodes}:${compactVitals}`;
}

export async function getAlerts() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_ALERTS);
  const arr = safeJsonParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

/**
 * Registra una alerta en el log interno, evitando duplicados consecutivos.
 * @param {{ level: 'stable'|'warning'|'critical', title: string, subtitle: string, reasons?: any[], patientId?: string, patientName?: string, vitals?: any }} payload
 */
export async function recordMedicalAlert(payload) {
  if (!payload || (payload.level !== 'warning' && payload.level !== 'critical')) {
    return { recorded: false };
  }

  const now = Date.now();
  const entry = {
    id: String(now),
    createdAt: now,
    level: payload.level,
    title: payload.title,
    subtitle: payload.subtitle,
    reasons: payload.reasons || [],
    patientId: payload.patientId || null,
    patientName: payload.patientName || null,
    vitals: payload.vitals || null,
    read: false,
  };

  const sig = buildSignature({
    level: payload.level,
    reasons: payload.reasons || [],
    vitals: payload.vitals || {},
    patientId: payload.patientId || null,
  });

  const lastSig = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_ALERTS_LAST_SIG);
  if (lastSig && lastSig === sig) return { recorded: false };

  const prev = await getAlerts();
  const next = [entry, ...prev].slice(0, MAX_ALERTS);

  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_ALERTS, JSON.stringify(next));
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_ALERTS_LAST_SIG, sig);
  return { recorded: true, entry };
}

export async function markAllAlertsRead() {
  const prev = await getAlerts();
  const next = prev.map((a) => ({ ...a, read: true }));
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICAL_ALERTS, JSON.stringify(next));
  return next;
}

