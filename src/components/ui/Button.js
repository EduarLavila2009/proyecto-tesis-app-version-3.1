import React from 'react';
import PrimaryButton from './buttons/PrimaryButton';
import SecondaryButton from './buttons/SecondaryButton';

/**
 * Compatibilidad — delega a PrimaryButton / SecondaryButton.
 * @param {'primary'|'secondary'} [variant='primary']
 */
export default function Button({
  variant = 'primary',
  appearance,
  ...props
}) {
  if (variant === 'secondary') {
    return (
      <SecondaryButton
        appearance={appearance ?? 'outline'}
        {...props}
      />
    );
  }
  return <PrimaryButton {...props} />;
}
