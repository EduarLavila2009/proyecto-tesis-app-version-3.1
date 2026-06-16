import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  ROLES,
  DEFAULT_MEDICAL_HISTORY,
} from '../constants/storage';
import * as storageService from './storageService';
import { auth, db, isFirebaseDisabled } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { runWithTimeout } from '../utils/promiseTimeout';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Validación de campos del formulario de login.
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
 * Genera el ID clínico compatible (ej: PAC-4829, MED-1083).
 */
function generateUserId(role) {
  const prefix = role === ROLES.DOCTOR ? 'MED' : 'PAC';
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${randomDigits}`;
}

const isOfflineOrInvalidKey = (error) => {
  const code = error?.code || '';
  const message = error?.message || '';
  return (
    code.includes('api-key-not-valid') ||
    code.includes('invalid-api-key') ||
    code.includes('network-request-failed') ||
    message.includes('api-key-not-valid') ||
    message.includes('invalid-api-key') ||
    message.includes('TIMEOUT_ERROR') ||
    message.includes('network')
  );
};

export async function registerLocalOffline(userData) {
  try {
    const emailNorm = userData.email.trim().toLowerCase();

    // 1. Obtener todos los usuarios registrados localmente
    const users = await storageService.getUsers();

    // 2. Verificar si el email ya existe localmente
    const emailExists = users.some((u) => u.email === emailNorm);
    if (emailExists) {
      return {
        success: false,
        ok: false,
        message: 'Ya existe una cuenta con este correo. Inicia sesión.',
        code: 'EMAIL_EXISTS',
      };
    }

    // 3. Generar IDs y crear el objeto de usuario local
    const roleFromStorage = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
    const roleKey = (userData.role || roleFromStorage || ROLES.PATIENT).toLowerCase();
    const id = userData.id ?? generateUserId(roleKey);
    const localUid = `local-uid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const finalUser = {
      id,
      uid: localUid,
      name: userData.name.trim(),
      email: emailNorm,
      role: roleKey,
      phone: typeof userData.phone === 'string' ? userData.phone.trim() : '',
      avatar: typeof userData.avatar === 'string' ? userData.avatar : '',
      medicalHistory: {
        ...DEFAULT_MEDICAL_HISTORY,
        ...(userData.medicalHistory || {}),
      },
      createdAt: new Date().toISOString(),
      password: userData.password, // Almacenar para validación offline
    };

    // 4. Guardar en la lista local de usuarios
    users.push(finalUser);
    await storageService.saveUsers(users);

    // 5. Guardar sesión activa localmente (sin el password para que no flote en la sesión)
    const { password: _ignore, ...sessionUser } = finalUser;
    await storageService.saveUser(sessionUser);

    return { success: true, ok: true, user: sessionUser };
  } catch (localErr) {
    console.error('Error en registerLocalOffline:', localErr);
    return {
      success: false,
      ok: false,
      message: 'No se pudo completar el registro local offline.',
      code: 'OFFLINE_ERROR',
    };
  }
}

export async function loginLocalOffline(email, password) {
  try {
    const emailNorm = String(email).trim().toLowerCase();

    // 1. Obtener todos los usuarios registrados localmente
    const users = await storageService.getUsers();

    // 2. Buscar por email
    const user = users.find((u) => u.email === emailNorm);
    if (!user) {
      return {
        success: false,
        ok: false,
        message: 'Credenciales incorrectas. Regístrate si no tienes cuenta.',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // 3. Validar contraseña
    if (user.password && user.password !== password) {
      return {
        success: false,
        ok: false,
        message: 'Credenciales incorrectas. Regístrate si no tienes cuenta.',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // 4. Guardar sesión activa localmente (sin el password)
    const { password: _ignore, ...sessionUser } = user;
    await storageService.saveUser(sessionUser);

    return { success: true, ok: true, user: sessionUser };
  } catch (localErr) {
    console.error('Error en loginLocalOffline:', localErr);
    return {
      success: false,
      ok: false,
      message: 'No se pudo iniciar sesión localmente offline.',
      code: 'OFFLINE_ERROR',
    };
  }
}

/**
 * Inicia sesión con Firebase Auth y busca el perfil clínico en Firestore por UID.
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

  if (isFirebaseDisabled) {
    console.log('authService.login: Firebase desactivado, usando login local offline');
    return await loginLocalOffline(email, password);
  }

  try {
    const emailTrim = String(email).trim().toLowerCase();

    // 1. Autenticar con Firebase Auth
    const userCredential = await runWithTimeout(
      signInWithEmailAndPassword(auth, emailTrim, password),
      2500
    );
    const fbUser = userCredential.user;

    // 2. Buscar en Firestore el perfil del usuario que contenga la UID correspondiente
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', fbUser.uid));
    const querySnapshot = await runWithTimeout(getDocs(q), 2500);

    let userData;
    if (!querySnapshot.empty) {
      userData = querySnapshot.docs[0].data();
    } else {
      // Si no existe, creamos un perfil básico con la UID
      const clinicalId = generateUserId(ROLES.PATIENT);
      userData = {
        id: clinicalId,
        uid: fbUser.uid,
        name: fbUser.displayName || 'Paciente Clínico',
        email: emailTrim,
        role: ROLES.PATIENT,
        medicalHistory: { ...DEFAULT_MEDICAL_HISTORY },
        createdAt: new Date().toISOString(),
      };
      await runWithTimeout(
        setDoc(doc(db, 'users', clinicalId), userData),
        2500
      );
    }

    // 3. Guardar sesión local
    await storageService.saveUser(userData);

    return { success: true, ok: true, user: userData };
  } catch (error) {
    console.error('authService.login error:', error);

    if (isOfflineOrInvalidKey(error)) {
      console.log('authService.login: Fallo de Firebase, intentando login local offline');
      return await loginLocalOffline(email, password);
    }

    let message = 'Ocurrió un error al iniciar sesión.';
    let code = 'AUTH_ERROR';
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-email'
    ) {
      message = 'Credenciales incorrectas. Regístrate si no tienes cuenta.';
      code = 'INVALID_CREDENTIALS';
    }
    return {
      success: false,
      ok: false,
      message,
      code,
      error,
    };
  }
}

/**
 * Registra un usuario en Firebase Auth y guarda su perfil en Firestore indexado por ID clínico.
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

    if (isFirebaseDisabled) {
      console.log('authService.register: Firebase desactivado, usando registro local offline');
      return await registerLocalOffline(userData);
    }

    const roleFromStorage = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
    const roleKey = (
      userData.role ||
      roleFromStorage ||
      ROLES.PATIENT
    ).toLowerCase();

    const emailNorm = userData.email.trim().toLowerCase();

    // 1. Crear usuario en Firebase Auth
    const userCredential = await runWithTimeout(
      createUserWithEmailAndPassword(auth, emailNorm, userData.password),
      2500
    );
    const fbUser = userCredential.user;

    // 2. Generar el ID clínico de tesis
    const id = userData.id ?? generateUserId(roleKey);

    const finalUser = {
      id,
      uid: fbUser.uid,
      name: userData.name.trim(),
      email: emailNorm,
      role: roleKey,
      phone: typeof userData.phone === 'string' ? userData.phone.trim() : '',
      avatar: typeof userData.avatar === 'string' ? userData.avatar : '',
      medicalHistory: {
        ...DEFAULT_MEDICAL_HISTORY,
        ...(userData.medicalHistory || {}),
      },
      createdAt: new Date().toISOString(),
    };

    // 3. Guardar perfil clínico en Firestore indexado por 'id' clínico (ej: PAC-3829)
    await runWithTimeout(
      setDoc(doc(db, 'users', id), finalUser),
      2500
    );

    // 4. Guardar sesión activa localmente
    await storageService.saveUser(finalUser);

    return { success: true, ok: true, user: finalUser };
  } catch (error) {
    console.error('authService.register error:', error);

    if (isOfflineOrInvalidKey(error)) {
      console.log('authService.register: Fallo de Firebase, intentando registro local offline');
      return await registerLocalOffline(userData);
    }

    let message = 'No se pudo completar el registro.';
    let code = 'AUTH_ERROR';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Ya existe una cuenta con este correo. Inicia sesión.';
      code = 'EMAIL_EXISTS';
    }
    return {
      success: false,
      ok: false,
      message,
      code,
      error,
    };
  }
}

/**
 * Cierra la sesión en Firebase Auth y limpia AsyncStorage.
 */
export async function logout() {
  try {
    if (!isFirebaseDisabled) {
      try {
        await signOut(auth);
      } catch (authErr) {
        console.warn('Fallo de signOut en Firebase:', authErr.message);
      }
    }
    await storageService.removeUser();
    return { success: true, ok: true };
  } catch (error) {
    console.error('authService.logout', error);
    return {
      success: false,
      ok: false,
      message: 'No se pudo cerrar la sesión.',
      code: 'AUTH_ERROR',
      error,
    };
  }
}
