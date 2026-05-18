import { StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { typography } from './typography';
import { layout } from './layout';

/**
 * Estilos reutilizables para pantallas de tabs (Panel, Historial, Perfil).
 * Mantiene jerarquía visual: h2 título de bloque → body contenido → caption meta.
 */

/** Etiqueta de sección en mayúsculas (ej. "MÉTRICAS VITALES"). */
export function createSectionHeadingStyle(colors) {
  return {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.m,
    marginTop: spacing.l,
  };
}

/** Título dentro de una Card (ej. "Últimos registros"). */
export function createCardTitleStyle(colors) {
  return {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  };
}

/** Contenedor estándar de tarjeta en tabs. */
export function createTabCardStyle(colors, cardShadow) {
  return {
    marginBottom: layout.sectionGap,
    padding: spacing.l,
    borderRadius: spacing.radiusCard,
    backgroundColor: colors.surface,
    ...cardShadow,
  };
}

export const screenUi = StyleSheet.create({
  screenTitle: {
    ...typography.h2,
    marginBottom: spacing.s,
  },
});
