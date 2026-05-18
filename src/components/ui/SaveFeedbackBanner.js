import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Banner breve de éxito al guardar (feedback visual).
 */
export default function SaveFeedbackBanner({ message, onHidden }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (!message) return undefined;
    opacity.setValue(0);
    translateY.setValue(-8);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) onHidden?.();
        }
      );
    }, 2400);
    return () => clearTimeout(t);
  }, [message, opacity, translateY, onHidden]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.banner, { opacity, transform: [{ translateY }] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={styles.text} allowFontScaling>
        {message}
      </Text>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: `${colors.success}18`,
      borderWidth: 1,
      borderColor: `${colors.success}44`,
      borderRadius: spacing.radiusButton,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    text: {
      ...typography.body,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
  });
}
