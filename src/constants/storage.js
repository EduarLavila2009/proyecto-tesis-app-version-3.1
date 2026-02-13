/**
 * Claves para AsyncStorage
 * Almacenamiento local sin backend
 */
export const STORAGE_KEYS = {
  ROLE: 'medical_corp_role',
  USER: 'medical_corp_user',
  /** Array de todos los usuarios registrados (para consulta por ID en fase Médico) */
  USERS: 'medical_corp_users',
};

export const ROLES = {
  PATIENT: 'paciente',
  DOCTOR: 'doctor',
};

/** Estructura por defecto del historial médico (Paciente) */
export const DEFAULT_MEDICAL_HISTORY = {
  bloodType: '',
  allergies: '',
  chronicDiseases: '',
  medications: '',
  notes: '',
};
