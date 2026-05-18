import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, useTheme } from '../../theme';

const DEFAULT_STEPS = ['Perfil', 'Acceso', 'Cuenta'];

/**
 * Indicador de progreso del flujo de onboarding (rol → login → registro).
 * @param {1|2|3} currentStep Paso activo (1-based)
 */
export default function OnboardingProgress({ currentStep = 1, steps = DEFAULT_STEPS }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: steps.length,
        now: currentStep,
        text: `Paso ${currentStep} de ${steps.length}`,
      }}
    >
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <React.Fragment key={label}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isActive && styles.dotActive,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                ) : (
                  <Text
                    style={[styles.dotText, isActive && styles.dotTextActive]}
                    allowFontScaling
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.label, (isActive || isDone) && styles.labelActive]}
                allowFontScaling
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {index < steps.length - 1 ? (
              <View style={[styles.line, isDone && styles.lineDone]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: '100%',
      marginBottom: spacing.l,
    },
    stepCol: {
      alignItems: 'center',
      width: 72,
    },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    dotActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    dotDone: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    dotText: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    dotTextActive: {
      color: colors.onPrimary,
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    labelActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: colors.borderSubtle,
      marginTop: 13,
      marginHorizontal: spacing.xs,
      minWidth: spacing.m,
    },
    lineDone: {
      backgroundColor: colors.primary,
    },
  });
}
