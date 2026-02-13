/**
 * Configuración del menú principal por rol
 * Separación lógica: Paciente vs Médico
 */
import { ROLES } from './storage';

/** Iconos Ionicons: estilo outline, médicos/tecnológicos */
export const MENU_ITEMS = {
  [ROLES.PATIENT]: [
    { id: 'profile', screen: 'Profile', title: 'Perfil', icon: 'person-circle-outline', isPlaceholder: false },
    { id: 'history', screen: 'MedicalHistory', title: 'Historial médico', icon: 'document-text-outline', isPlaceholder: false },
    { id: 'ai', screen: 'MedicalAI', title: 'IA médica', icon: 'pulse-outline', isPlaceholder: false },
  ],
  [ROLES.DOCTOR]: [
    { id: 'profile', screen: 'Profile', title: 'Perfil', icon: 'person-circle-outline', isPlaceholder: false },
    { id: 'patients', screen: 'Patients', title: 'Pacientes', icon: 'people-outline', isPlaceholder: false },
    { id: 'robot', screen: 'RobotFunctions', title: 'Funciones del robot', icon: 'hardware-chip-outline', isPlaceholder: true },
  ],
};
