import { StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { layout } from './layout';
import { typography } from './typography';

/**
 * Tokens de formularios — inputs, grupos y paneles (auth, historial, perfil).
 */

export const formTokens = {
  fieldGap: layout.fieldGap,
  labelGap: spacing.xs,
  inputPaddingV: spacing.s,
  inputPaddingH: spacing.m,
  inputMinHeight: spacing.minTouchTarget,
  panelPadding: spacing.l,
  panelGap: layout.sectionGap,
};

/** Margen entre campos en pantallas con formulario largo. */
export function createFieldGroupStyle() {
  return {
    marginBottom: formTokens.fieldGap,
  };
}

/** Estilo de etiqueta de campo (coherente con FieldShell). */
export function createFieldLabelStyle(colors) {
  return {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: formTokens.labelGap,
  };
}

/** Panel para bloques de formulario en tabs (Historial, etc.). */
export function createFormPanelStyle(colors, cardShadow) {
  return {
    width: '100%',
    marginBottom: formTokens.panelGap,
    padding: formTokens.panelPadding,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    ...(cardShadow || {}),
  };
}
