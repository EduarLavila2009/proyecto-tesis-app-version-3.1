import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ROLES } from '../constants/storage';
import { db, isFirebaseDisabled } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { runWithTimeout } from '../utils/promiseTimeout';

const DEFAULT_USERS = [
  {
    id: 'PAC-0001',
    uid: 'local-uid-patient-1',
    name: 'Eduar Lavila',
    email: 'paciente@medicalcorp.com',
    role: ROLES.PATIENT,
    phone: '123456789',
    medicalHistory: {
      bloodType: 'O+',
      allergies: 'Ninguna conocida',
      chronicDiseases: 'Ninguna conocida',
      medications: 'Ninguna registrada',
      notes: '',
    },
    createdAt: new Date().toISOString(),
    password: 'password123',
    isVerified: true,
    verificationStatus: 'verified',
  },
  {
    id: 'MED-0001',
    uid: 'local-uid-doctor-1',
    name: 'Dr. Freddy Lopez',
    email: 'medico@medicalcorp.com',
    role: ROLES.DOCTOR,
    phone: '987654321',
    createdAt: new Date().toISOString(),
    password: 'password123',
  }
];

/**
 * Lee el usuario actual de la sesión (objeto parseado).
 * @returns {Promise<object|null>}
 */
export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (raw == null || raw === '') {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('storageService.getUser', error);
    return null;
  }
}

/**
 * Guarda el usuario de sesión (objeto serializado).
 * @param {object} user
 * @returns {Promise<void>}
 */
export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('storageService.saveUser', error);
    throw error;
  }
}

/**
 * Elimina la clave de usuario en sesión.
 * @returns {Promise<void>}
 */
export async function removeUser() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('storageService.removeUser', error);
    throw error;
  }
}

/**
 * Obtiene el array de usuarios registrados. Sincroniza desde Firestore y cae al cache local offline.
 * @returns {Promise<object[]>}
 */
export async function getUsers() {
  try {
    // 1. Intentar leer de Firestore (Online)
    if (!isFirebaseDisabled) {
      try {
        const querySnapshot = await runWithTimeout(
          getDocs(collection(db, 'users')),
          2500
        );
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data());
        });
        if (list.length > 0) {
          // Actualizar cache local
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
          return list;
        }
      } catch (onlineErr) {
        console.log('storageService.getUsers: Usando cache local offline:', onlineErr.message);
      }
    }

    // 2. Fallback: Leer cache local de AsyncStorage (Offline)
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (raw == null || raw === '') {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Deduplicación por id
    const map = new Map();
    parsed.forEach((u) => {
      if (u && u.id) {
        map.set(u.id, u);
      }
    });
    return Array.from(map.values());
  } catch (error) {
    console.error('storageService.getUsers', error);
    return [];
  }
}

/**
 * Persiste el array completo de usuarios en el almacenamiento local.
 * @param {object[]} users
 * @returns {Promise<void>}
 */
export async function saveUsers(users) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('storageService.saveUsers', error);
    throw error;
  }
}

/**
 * Guarda o actualiza los datos de un usuario en la lista local y en Firestore en la nube.
 * @param {object} updatedUser Objeto del usuario a guardar. Debe contener 'id'.
 * @returns {Promise<void>}
 */
export async function updateUserInList(updatedUser) {
  try {
    if (!updatedUser || !updatedUser.id) return;
    const users = await getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
    } else {
      users.push(updatedUser);
    }
    await saveUsers(users);

    if (!isFirebaseDisabled) {
      try {
        await runWithTimeout(
          setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true }),
          2500
        );
      } catch (dbErr) {
        console.warn('Fallo de sincronización online en Firestore:', dbErr.message);
      }
    }
  } catch (error) {
    console.error('storageService.updateUserInList', error);
    throw error;
  }
}
