import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Campo de texto reutilizable (tema global).
 *
 * @param {string} value Valor controlado.
 * @param {(text: string) => void} onChangeText Callback al cambiar el texto.
 * @param {string} [placeholder] Texto placeholder.
 * @param {boolean} [secureTextEntry] Ocultar texto (contraseña).
 * @param {import('react-native').StyleProp<import('react-native').TextStyle>} [style] Estilos adicionales del TextInput.
 * @param {string} [accessibilityLabel] Etiqueta para lectores de pantalla.
 * @param {string} [accessibilityHint] Pista adicional (opcional).
 */
export default function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  style,
  accessibilityLabel,
  accessibilityHint,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}) {
  const [focused, setFocused] = useState(false);

  const cap =
    autoCapitalize !== undefined
      ? autoCapitalize
      : secureTextEntry
        ? 'none'
        : 'sentences';
  const corr =
    autoCorrect !== undefined ? autoCorrect : !secureTextEntry;

  return (
    <TextInput
      style={[styles.input, focused && styles.inputFocused, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={cap}
      autoCorrect={corr}
      accessibilityLabel={accessibilityLabel ?? placeholder ?? 'Campo de texto'}
      accessibilityHint={accessibilityHint}
      allowFontScaling
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.radiusInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    color: colors.textPrimary,
    minHeight: spacing.lg * 2,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
});
