import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../theme';
import { formTokens } from '../../../theme/forms';

export function createFieldStyles(colors) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      ...typography.label,
      color: colors.textPrimary,
      marginBottom: formTokens.labelGap,
    },
    labelRequired: {
      color: colors.error,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      paddingVertical: formTokens.inputPaddingV,
      paddingHorizontal: formTokens.inputPaddingH,
      borderRadius: spacing.radiusInput,
      minHeight: formTokens.inputMinHeight,
    },
    inputMultiline: {
      minHeight: formTokens.inputMinHeight * 2,
      paddingTop: formTokens.inputPaddingV + 2,
      textAlignVertical: 'top',
    },
    inputInner: {
      borderWidth: 0,
      backgroundColor: 'transparent',
      paddingVertical: formTokens.inputPaddingV,
      paddingHorizontal: formTokens.inputPaddingH,
    },
    inputDisabled: {
      backgroundColor: colors.buttonDisabled,
      color: colors.textDisabled,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
    hintText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
