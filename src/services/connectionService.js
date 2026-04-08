import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';

/**
 * Payload JSON en el QR del paciente (v1).
 * @param {string} patientId
 */
export function buildPatientQrPayload(patientId) {
  return JSON.stringify({
    v: 1,
    type: 'MEDICAL_CORP_PATIENT',
    patientId: String(patientId || ''),
  });
}

/**
 * @param {string} data Contenido leído del QR
 * @returns {{ patientId: string } | null}
 */
export function parsePatientQrPayload(data) {
  if (typeof data !== 'string' || !data.trim()) return null;
  try {
    const o = JSON.parse(data);
    if (o?.v === 1 && o?.type === 'MEDICAL_CORP_PATIENT' && o?.patientId) {
      return { patientId: String(o.patientId) };
    }
  } catch (_) {
    /* no es JSON */
  }
  return null;
}

export async function getDoctorPatientLinks() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_PATIENT_LINKS);
    if (raw == null || raw === '') return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

async function saveDoctorPatientLinks(links) {
  await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_PATIENT_LINKS, JSON.stringify(links));
}

/**
 * Verifica usuarios en USERS y persiste el vínculo si no existe.
 * @param {string} doctorId
 * @param {string} patientId
 */
export async function linkDoctorToPatient(doctorId, patientId) {
  const doctorIdStr = String(doctorId || '').trim();
  const patientIdStr = String(patientId || '').trim();
  if (!doctorIdStr || !patientIdStr) {
    return {
      success: false,
      code: 'INVALID',
      message: 'Datos de vínculo incompletos.',
    };
  }
  if (doctorIdStr === patientIdStr) {
    return {
      success: false,
      code: 'SAME_USER',
      message: 'No puedes vincular tu propia cuenta.',
    };
  }

  let users = [];
  try {
    const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (usersJson) users = JSON.parse(usersJson);
    if (!Array.isArray(users)) users = [];
  } catch (_) {
    users = [];
  }

  const doctor = users.find((u) => u.id === doctorIdStr);
  const patient = users.find((u) => u.id === patientIdStr);

  if (!doctor || doctor.role !== ROLES.DOCTOR) {
    return {
      success: false,
      code: 'INVALID_DOCTOR',
      message: 'Tu sesión no es válida como médico.',
    };
  }
  if (!patient || patient.role !== ROLES.PATIENT) {
    return {
      success: false,
      code: 'INVALID_PATIENT',
      message:
        'El código no corresponde a un paciente registrado en MEDICAL corp.',
    };
  }

  const links = await getDoctorPatientLinks();
  const exists = links.some(
    (l) => l.patientId === patientIdStr && l.doctorId === doctorIdStr
  );
  if (exists) {
    return {
      success: true,
      code: 'ALREADY_LINKED',
      alreadyLinked: true,
      message: 'Ya estabas vinculado con este paciente.',
      patientName: patient.name || patientIdStr,
    };
  }

  const next = [
    ...links,
    {
      patientId: patientIdStr,
      doctorId: doctorIdStr,
      createdAt: new Date().toISOString(),
    },
  ];
  await saveDoctorPatientLinks(next);
  return {
    success: true,
    code: 'LINKED',
    alreadyLinked: false,
    message: 'Paciente vinculado correctamente.',
    patientName: patient.name || patientIdStr,
  };
}

/**
 * @param {string} doctorId
 * @param {string} patientId
 */
export async function isDoctorLinkedToPatient(doctorId, patientId) {
  const links = await getDoctorPatientLinks();
  return links.some(
    (l) => l.doctorId === doctorId && l.patientId === patientId
  );
}
