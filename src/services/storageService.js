import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Persistencia local con `@react-native-async-storage/async-storage`.
 * Claves: `STORAGE_KEYS.USER` (sesión), `STORAGE_KEYS.USERS` (lista JSON).
 */

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
 * Obtiene el array de usuarios registrados.
 * @returns {Promise<object[]>}
 */
export async function getUsers() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (raw == null || raw === '') {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('storageService.getUsers', error);
    return [];
  }
}

/**
 * Persiste el array completo de usuarios.
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
