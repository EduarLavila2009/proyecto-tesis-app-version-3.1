import React, { useState, useMemo, useCallback } from 'react';

import { TextInput, Platform } from 'react-native';

import { useTheme } from '../../../theme';

import FieldShell from './FieldShell';

import AnimatedFieldWrap from './AnimatedFieldWrap';

import { createFieldStyles } from './fieldStyles';

import { validateByType } from './validators';



const KEYBOARD_BY_TYPE = {

  email: 'email-address',

  number: 'numeric',

  phone: 'phone-pad',

  text: 'default',

};



/**

 * Campo de texto general con tema global, foco animado y shake en error.

 * @param {'text'|'email'|'number'|'phone'} [validationType='text']

 */

export default function TextInputField({

  value,

  onChangeText,

  placeholder,

  label,

  error: externalError,

  required = false,

  containerStyle,

  style,

  inputStyle,

  validationType = 'text',

  validateOnBlur = false,

  validationOptions = {},

  onValidation,

  accessibilityLabel,

  accessibilityHint,

  keyboardType,

  autoCapitalize,

  autoCorrect,

  multiline = false,

  numberOfLines,

  editable = true,

  ...rest

}) {

  const { colors } = useTheme();

  const styles = useMemo(() => createFieldStyles(colors), [colors]);

  const [focused, setFocused] = useState(false);

  const [internalError, setInternalError] = useState(null);



  const displayError = externalError || internalError;



  const runValidation = useCallback(

    (text) => {

      if (!validateOnBlur && !required && validationType === 'text') return null;

      const msg = validateByType(text, validationType, {

        required,

        ...validationOptions,

        label: label || validationOptions.label,

      });

      setInternalError(msg);

      onValidation?.(msg);

      return msg;

    },

    [validateOnBlur, required, validationType, validationOptions, label, onValidation]

  );



  const cap =

    autoCapitalize !== undefined

      ? autoCapitalize

      : validationType === 'email' || validationType === 'number'

        ? 'none'

        : 'sentences';

  const corr = autoCorrect !== undefined ? autoCorrect : validationType === 'text';



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

        style={[

          styles.input,

          multiline && styles.inputMultiline,

          !editable && styles.inputDisabled,

          style,

        ]}

      >

        <TextInput

          accessible

          accessibilityLabel={accessibilityLabel ?? label ?? placeholder ?? 'Campo de texto'}

          accessibilityHint={accessibilityHint}

          accessibilityState={{ disabled: !editable }}

          style={[styles.inputInner, inputStyle]}

          value={value}

          onChangeText={(text) => {

            onChangeText?.(text);

            if (displayError) {

              setInternalError(null);

              onValidation?.(null);

            }

          }}

          placeholder={placeholder}

          placeholderTextColor={colors.textSecondary}

          selectionColor={colors.primary}

          {...(Platform.OS === 'android' && {

            cursorColor: colors.primary,

            underlineColorAndroid: 'transparent',

          })}

          keyboardType={keyboardType ?? KEYBOARD_BY_TYPE[validationType] ?? 'default'}

          autoCapitalize={cap}

          autoCorrect={corr}

          multiline={multiline}

          numberOfLines={numberOfLines}

          editable={editable}

          allowFontScaling

          {...rest}

          onFocus={(e) => {

            setFocused(true);

            rest.onFocus?.(e);

          }}

          onBlur={(e) => {

            setFocused(false);

            if (validateOnBlur) runValidation(value);

            rest.onBlur?.(e);

          }}

        />

      </AnimatedFieldWrap>

    </FieldShell>

  );

}


