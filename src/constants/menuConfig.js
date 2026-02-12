/**
 * Configuración del menú principal por rol
 * Separación lógica: Paciente vs Médico
 */
import { ROLES } from './storage';

export const MENU_ITEMS = {
  [ROLES.PATIENT]: [
    { id: 'profile', screen: 'Profile', title: 'Perfil', icon: 'person', isPlaceholder: false },
    { id: 'history', screen: 'MedicalHistory', title: 'Historial médico', icon: 'document-text', isPlaceholder: true },
    { id: 'ai', screen: 'MedicalAI', title: 'IA médica', icon: 'sparkles', isPlaceholder: false },
  ],
  [ROLES.DOCTOR]: [
    { id: 'profile', screen: 'Profile', title: 'Perfil', icon: 'person', isPlaceholder: false },
    { id: 'patients', screen: 'Patients', title: 'Pacientes', icon: 'people', isPlaceholder: true },
    { id: 'robot', screen: 'RobotFunctions', title: 'Funciones del robot', icon: 'hardware-chip', isPlaceholder: true },
  ],
};
