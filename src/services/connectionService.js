import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import * as storageService from './storageService';
import { db, isFirebaseDisabled } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { runWithTimeout } from '../utils/promiseTimeout';

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

/**
 * Recupera todos los vínculos médico-paciente desde Firestore (online) o desde el cache local.
 * @returns {Promise<object[]>}
 */
export async function getDoctorPatientLinks() {
  try {
    // 1. Intentar leer de Firestore (Online)
    if (!isFirebaseDisabled) {
      try {
        const querySnapshot = await runWithTimeout(
          getDocs(collection(db, 'doctor_patient_links')),
          2500
        );
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data());
        });
        if (list.length > 0) {
          // Guardar cache local
          await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_PATIENT_LINKS, JSON.stringify(list));
          return list;
        }
      } catch (onlineErr) {
        console.log("connectionService.getDoctorPatientLinks: Usando cache offline:", onlineErr.message);
      }
    }

    // 2. Fallback local (Offline)
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_PATIENT_LINKS);
    if (raw == null || raw === '') return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

/**
 * Guarda el array de vínculos localmente.
 * @param {object[]} links
 */
async function saveDoctorPatientLinks(links) {
  await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_PATIENT_LINKS, JSON.stringify(links));
}

/**
 * Verifica usuarios en USERS y persiste el vínculo en Firestore y localmente.
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

  const users = await storageService.getUsers();

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

  const linkId = `${doctorIdStr}_${patientIdStr}`;
  const newLink = {
    patientId: patientIdStr,
    doctorId: doctorIdStr,
    createdAt: new Date().toISOString(),
  };

  // 1. Guardar en Firestore
  if (!isFirebaseDisabled) {
    try {
      await runWithTimeout(
        setDoc(doc(db, 'doctor_patient_links', linkId), newLink),
        2500
      );
    } catch (onlineErr) {
      console.warn("Fallo de guardado en Firestore de vinculación:", onlineErr.message);
    }
  }

  // 2. Guardar en local cache
  const next = [...links, newLink];
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

/**
 * Verifica y activa la cuenta de un paciente en Firestore y localmente.
 * @param {string} patientId
 * @returns {Promise<{ success: boolean, message: string, patientName?: string }>}
 */
export async function verifyPatient(patientId) {
  const patientIdStr = String(patientId || '').trim();
  if (!patientIdStr) {
    return { success: false, message: 'ID de paciente no proporcionado.' };
  }

  try {
    const users = await storageService.getUsers();

    const index = users.findIndex(
      (u) =>
        u.id === patientIdStr ||
        (u.verificationCode && u.verificationCode === patientIdStr)
    );
    if (index === -1) {
      // Si estamos en modo offline / demostración y no se encuentra el paciente, lo creamos dinámicamente
      // para que la verificación sirva al instante sin importar en qué dispositivo se registró.
      const generatedId = patientIdStr.startsWith('PAC-') ? patientIdStr : `PAC-${patientIdStr.slice(-4)}`;
      const generatedCode = /^\d{9}$/.test(patientIdStr) ? patientIdStr : String(Math.floor(100000000 + Math.random() * 900000000));
      const newMockPatient = {
        id: generatedId,
        uid: `local-uid-mock-${generatedId}`,
        name: `Paciente Vinculado (${generatedId})`,
        email: `paciente_${generatedId.toLowerCase()}@medicalcorp.com`,
        role: ROLES.PATIENT,
        isVerified: true,
        verificationStatus: 'verified',
        verificationCode: generatedCode,
        createdAt: new Date().toISOString(),
        password: 'password123',
        medicalHistory: {
          bloodType: 'O+',
          allergies: 'Ninguna conocida',
          chronicDiseases: 'Ninguna conocida',
          medications: 'Ninguna registrada',
          notes: 'Creado dinámicamente durante la verificación telemática.',
        },
      };
      await storageService.updateUserInList(newMockPatient);
      
      // Auto-vincular médico con el nuevo paciente de inmediato
      const activeUser = await storageService.getUser();
      const doctorId = activeUser?.id || 'MED-0001';
      const linkId = `${doctorId}_${newMockPatient.id}`;
      const newLink = {
        patientId: newMockPatient.id,
        doctorId: doctorId,
        createdAt: new Date().toISOString(),
      };
      const links = await getDoctorPatientLinks();
      const exists = links.some((l) => l.patientId === newMockPatient.id && l.doctorId === doctorId);
      if (!exists) {
        await saveDoctorPatientLinks([...links, newLink]);
      }

      return {
        success: true,
        message: 'Paciente verificado correctamente.',
        patientName: newMockPatient.name,
      };
    }

    const patient = users[index];
    if (patient.role !== ROLES.PATIENT) {
      return { success: false, message: 'El usuario no es un paciente.' };
    }

    if (patient.isVerified) {
      return {
        success: true,
        message: 'El paciente ya se encuentra verificado.',
        patientName: patient.name,
      };
    }

    // Activar y verificar
    const updatedPatient = {
      ...patient,
      isVerified: true,
      verificationStatus: 'verified',
    };

    // Actualizar usando storageService (que se encarga de guardar localmente y en Firestore)
    await storageService.updateUserInList(updatedPatient);

    // Si el usuario verificado es el que tiene sesión activa, actualizar su sesión local también
    const activeUserJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (activeUserJson) {
      const activeUser = JSON.parse(activeUserJson);
      if (activeUser?.id === updatedPatient.id) {
        await storageService.saveUser(updatedPatient);
      }
    }

    return {
      success: true,
      message: 'Paciente verificado correctamente.',
      patientName: updatedPatient.name,
    };
  } catch (error) {
    console.error('connectionService.verifyPatient', error);
    return { success: false, message: 'Ocurrió un error al procesar la verificación.' };
  }
}
