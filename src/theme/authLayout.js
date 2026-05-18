import { StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { layout } from './layout';
import { formTokens } from './forms';

/** Estilos compartidos para tarjetas de formulario en auth/onboarding. */
export function authFormCardStyle() {
  return {
    width: '100%',
    padding: layout.formCardPadding,
    borderRadius: spacing.radiusCard,
  };
}

export function authFormWrapStyle(maxWidth = layout.contentMaxWidth) {
  return {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
  };
}

export function createAuthFieldStyle() {
  return StyleSheet.create({
    field: {
      marginBottom: formTokens.fieldGap,
    },
    input: {
      width: '100%',
    },
    submit: {
      width: '100%',
      marginTop: spacing.sm,
      minHeight: spacing.minTouchTarget,
    },
    bannerError: {
      marginBottom: layout.fieldGap,
    },
  });
}
