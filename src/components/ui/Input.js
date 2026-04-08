import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Campo de texto alineado al tema. Opcional: etiqueta y mensaje de error.
 */
export default function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  style,
  label,
  error,
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  ...rest
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  const cap =
    autoCapitalize !== undefined
      ? autoCapitalize
      : secureTextEntry
        ? 'none'
        : 'sentences';
  const corr = autoCorrect !== undefined ? autoCorrect : !secureTextEntry;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={styles.label} allowFontScaling>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={colors.primary}
        {...(Platform.OS === 'android' && {
          cursorColor: colors.primary,
          underlineColorAndroid: 'transparent',
        })}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={cap}
        autoCorrect={corr}
        accessibilityLabel={accessibilityLabel ?? placeholder ?? label ?? 'Campo de texto'}
        accessibilityHint={accessibilityHint}
        allowFontScaling
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {error ? (
        <Text style={styles.errorText} allowFontScaling accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
    },
    input: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.md - 2,
      borderRadius: spacing.radiusInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      color: colors.textPrimary,
      minHeight: Math.max(spacing.lg * 2, spacing.minTouchTarget),
    },
    inputFocused: {
      borderColor: colors.borderFocus,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
      fontWeight: '500',
    },
  });
}
