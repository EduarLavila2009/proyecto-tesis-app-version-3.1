import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  ROLES,
  DEFAULT_MEDICAL_HISTORY,
} from '../constants/storage';
import * as storageService from './storageService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Validación de campos del formulario de login (mismas reglas que LoginScreen).
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ valid: boolean, errors: { email?: string, password?: string } }}
 */
export function validateLoginInput(email, password) {
  const errors = {};
  if (!email || !String(email).trim()) {
    errors.email = 'El correo es obligatorio';
  } else if (!isValidEmailFormat(email)) {
    errors.email = 'Formato de correo no válido';
  }
  if (!password) {
    errors.password = 'La contraseña es obligatoria';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Genera el siguiente ID según rol: PAC-0001, MED-0001, etc. (alineado con RegisterScreen).
 * @param {Array} users
 * @param {string} role
 * @returns {string}
 */
function generateUserId(users, role) {
  const prefix = role === ROLES.DOCTOR ? 'MED' : 'PAC';
  const samePrefix = (users || []).filter((u) => u.id && u.id.startsWith(prefix));
  const numbers = samePrefix
    .map((u) => parseInt(u.id.replace(prefix, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Inicia sesión: valida el formulario, busca en la lista de usuarios; si no hay coincidencia, compatibilidad con USER guardado.
 *
 * @returns {Promise<
 *   | { success: true, ok: true, user: object }
 *   | { success: false, ok: false, message: string, code: string, errors?: { email?: string, password?: string }, error?: Error }
 * >}
 */
export async function login(email, password) {
  const { valid, errors: validationErrors } = validateLoginInput(email, password);
  if (!valid) {
    const message =
      validationErrors.email ||
      validationErrors.password ||
      'Revisa los datos del formulario.';
    return {
      success: false,
      ok: false,
      message,
      code: 'VALIDATION_ERROR',
      errors: validationErrors,
    };
  }

  try {
    const emailTrim = String(email).trim().toLowerCase();

    const users = await storageService.getUsers();
    const fromList = users.find(
      (u) => u.email === emailTrim && u.password === password
    );
    if (fromList) {
      await storageService.saveUser(fromList);
      return { success: true, ok: true, user: fromList };
    }

    const storedUser = await storageService.getUser();
    if (
      storedUser &&
      storedUser.email === emailTrim &&
      storedUser.password === password
    ) {
      await storageService.saveUser(storedUser);
      return { success: true, ok: true, user: storedUser };
    }

    return {
      success: false,
      ok: false,
      message: 'Credenciales incorrectas. Regístrate si no tienes cuenta.',
      code: 'INVALID_CREDENTIALS',
    };
  } catch (error) {
    console.error('authService.login', error);
    return {
      success: false,
      ok: false,
      message: 'Ocurrió un error al iniciar sesión.',
      code: 'STORAGE_ERROR',
      error,
    };
  }
}

/**
 * Registra un usuario: añade a la lista, guarda sesión. Incluye rol, ID e historial por defecto (compatibilidad con el modelo actual).
 *
 * @returns {Promise<
 *   | { success: true, ok: true, user: object }
 *   | { success: false, ok: false, message: string, code?: string, error?: Error }
 * >}
 */
export async function register(userData) {
  try {
    if (
      !userData ||
      typeof userData.name !== 'string' ||
      !userData.name.trim() ||
      typeof userData.email !== 'string' ||
      !userData.email.trim() ||
      userData.password == null ||
      userData.password === ''
    ) {
      return {
        success: false,
        ok: false,
        message: 'Datos de registro incompletos.',
        code: 'INVALID_INPUT',
      };
    }

    const roleFromStorage = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
    const roleKey = (
      userData.role ||
      roleFromStorage ||
      ROLES.PATIENT
    ).toLowerCase();

    let users = await storageService.getUsers();
    const emailNorm = userData.email.trim().toLowerCase();
    if (users.some((u) => u.email === emailNorm)) {
      return {
        success: false,
        ok: false,
        message: 'Ya existe una cuenta con este correo. Inicia sesión.',
        code: 'EMAIL_EXISTS',
      };
    }

    const id = userData.id ?? generateUserId(users, roleKey);

    const finalUser = {
      id,
      name: userData.name.trim(),
      email: emailNorm,
      password: userData.password,
      role: roleKey,
      phone: typeof userData.phone === 'string' ? userData.phone.trim() : '',
      avatar: typeof userData.avatar === 'string' ? userData.avatar : '',
      medicalHistory: {
        ...DEFAULT_MEDICAL_HISTORY,
        ...(userData.medicalHistory || {}),
      },
    };

    users.push(finalUser);
    await storageService.saveUsers(users);
    await storageService.saveUser(finalUser);

    return { success: true, ok: true, user: finalUser };
  } catch (error) {
    console.error('authService.register', error);
    return {
      success: false,
      ok: false,
      message: 'No se pudo completar el registro.',
      code: 'STORAGE_ERROR',
      error,
    };
  }
}

/**
 * Cierra sesión (elimina usuario actual en AsyncStorage).
 *
 * @returns {Promise<
 *   | { success: true, ok: true }
 *   | { success: false, ok: false, message: string, code?: string, error?: Error }
 * >}
 */
export async function logout() {
  try {
    await storageService.removeUser();
    return { success: true, ok: true };
  } catch (error) {
    console.error('authService.logout', error);
    return {
      success: false,
      ok: false,
      message: 'No se pudo cerrar la sesión.',
      code: 'STORAGE_ERROR',
      error,
    };
  }
}
