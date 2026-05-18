/**
 * Claves para AsyncStorage
 * Almacenamiento local sin backend
 */
export const STORAGE_KEYS = {
  ROLE: 'medical_corp_role',
  USER: 'medical_corp_user',
  /** Array de todos los usuarios registrados (para consulta por ID en fase Médico) */
  USERS: 'medical_corp_users',
  /** Preferencia de tema: "light" | "dark" */
  THEME: 'medical_corp_theme',
  /** Historial del chat de IA médica (local) */
  AI_MEDICAL_CHAT: 'medical_corp_ai_medical_chat_v1',
  /** Registros médicos por usuario (métricas vitales) */
  MEDICAL_RECORDS: 'medical_corp_medical_records_v1',
  /** Alertas médicas internas (log local) */
  MEDICAL_ALERTS: 'medical_corp_medical_alerts_v1',
  /** Última firma de alerta para evitar duplicados */
  MEDICAL_ALERTS_LAST_SIG: 'medical_corp_medical_alerts_last_sig_v1',
  /**
   * Vínculos médico–paciente (local).
   * Formato: array de { patientId, doctorId, createdAt }
   */
  DOCTOR_PATIENT_LINKS: 'medical_corp_doctor_patient_links',
  /** Recordatorios locales (medición, medicación) por userId */
  REMINDERS: 'medical_corp_reminders_v1',
  /** Eventos de agenda / calendario básico */
  AGENDA_EVENTS: 'medical_corp_agenda_v1',
  /** Notas clínicas del médico por paciente */
  MEDICAL_NOTES: 'medical_corp_medical_notes_v1',
  /** IDs de notificaciones programadas (recordatorios) */
  SCHEDULED_NOTIFICATIONS: 'medical_corp_scheduled_notifications_v1',
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
