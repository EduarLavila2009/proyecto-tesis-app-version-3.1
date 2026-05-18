import React, { useState, useMemo } from 'react';
import { TextInput, Platform, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, hitSlopComfortable, useTheme } from '../../../theme';
import FieldShell from './FieldShell';
import AnimatedFieldWrap from './AnimatedFieldWrap';
import { createFieldStyles } from './fieldStyles';
import { validateText } from './validators';

/**
 * Campo de contraseña con toggle mostrar/ocultar y animaciones de foco/error.
 */
export default function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Contraseña',
  label = 'Contraseña',
  error: externalError,
  required = true,
  containerStyle,
  style,
  minLength = 6,
  validateOnBlur = false,
  accessibilityLabel,
  ...rest
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createFieldStyles(colors), [colors]);
  const shellStyles = useMemo(() => createShellStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const displayError = externalError || internalError;

  const validate = () => {
    if (!required && !value?.trim()) return null;
    const msg = validateText(value, {
      minLength,
      label: label || 'La contraseña',
    });
    setInternalError(msg);
    return msg;
  };

  const handleToggle = () => {
    setVisible((v) => !v);
  };

  return (
    <FieldShell
      label={label}
      required={required}
      error={displayError}
      containerStyle={containerStyle}
    >
      <AnimatedFieldWrap
        focused={focused}
        hasError={!!displayError}
        errorKey={displayError}
        style={[shellStyles.row, style]}
      >
        <TextInput
          accessible
          accessibilityLabel={accessibilityLabel ?? label ?? 'Campo de contraseña'}
          style={[styles.input, styles.inputInner, shellStyles.input]}
          value={value}
          onChangeText={(text) => {
            onChangeText?.(text);
            if (displayError) setInternalError(null);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          {...(Platform.OS === 'android' && {
            cursorColor: colors.primary,
            underlineColorAndroid: 'transparent',
          })}
          allowFontScaling
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (validateOnBlur) validate();
            rest.onBlur?.(e);
          }}
        />
        {/* Toggle sin Animated.View hijo: evita mezclar scale (native) con borderColor (JS) del wrap. */}
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          hitSlop={hitSlopComfortable}
          style={({ pressed }) => [shellStyles.toggle, pressed && shellStyles.togglePressed]}
          onPress={handleToggle}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={focused ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </AnimatedFieldWrap>
    </FieldShell>
  );
}

function createShellStyles(colors) {
  return StyleSheet.create({
    row: {
      position: 'relative',
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusInput,
      minHeight: spacing.minTouchTarget,
    },
    input: {
      paddingRight: spacing.minTouchTarget,
    },
    toggle: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: spacing.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    togglePressed: {
      opacity: 0.7,
    },
  });
}
