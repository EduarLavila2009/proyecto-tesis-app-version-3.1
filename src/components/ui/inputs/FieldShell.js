import React from 'react';
import { View, Text } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { createFieldStyles } from './fieldStyles';
import { AnimatedFieldError } from './AnimatedFieldShell';

/**
 * Contenedor de campo: label, control hijo y mensaje de error.
 */
export default function FieldShell({
  label,
  required = false,
  error,
  hint,
  containerStyle,
  children,
}) {
  const styles = useThemedStyles(createFieldStyles);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} allowFontScaling accessibilityRole="text">
          {label}
          {required ? <Text style={styles.labelRequired}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? (
        <AnimatedFieldError error={error} style={styles.errorText} />
      ) : hint && !error ? (
        <Text style={styles.hintText} allowFontScaling>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
