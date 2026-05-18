import React from 'react';
import TextInputField from './inputs/TextInputField';
import PasswordInput from './inputs/PasswordInput';

/**
 * Compatibilidad — delega a TextInputField o PasswordInput.
 * Preferir importar desde `./inputs` en código nuevo.
 */
export default function Input({ secureTextEntry, ...props }) {
  if (secureTextEntry) {
    return <PasswordInput {...props} />;
  }
  return <TextInputField {...props} />;
}
