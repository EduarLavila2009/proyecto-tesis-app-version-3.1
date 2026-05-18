import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, chatLayout, useTheme } from '../../theme';

const DOT_COUNT = 3;
const DOT_SIZE = 7;
const ANIM_MS = 380;

/**
 * Indicador “escribiendo…” con puntos animados (solo presentación).
 */
export default function ChatTypingIndicator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const anims = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    const loops = anims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(anim, {
            toValue: 1,
            duration: ANIM_MS,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.35,
            duration: ANIM_MS,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View style={styles.row}>
      <View style={styles.avatar} accessibilityElementsHidden>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
      </View>
      <View style={styles.bubble}>
        <Text style={styles.label} allowFontScaling>
          Asistente escribiendo
        </Text>
        <View style={styles.dotsRow}>
          {anims.map((opacity, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [
                    {
                      scale: opacity.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [0.85, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: chatLayout.messageGap,
      width: '100%',
    },
    avatar: {
      width: chatLayout.avatarSize,
      height: chatLayout.avatarSize,
      borderRadius: chatLayout.avatarSize / 2,
      backgroundColor: colors.secondaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      marginBottom: spacing.xs,
    },
    bubble: {
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.l,
      borderRadius: chatLayout.bubbleRadius,
      borderBottomLeftRadius: chatLayout.bubbleTailRadius,
      backgroundColor: colors.secondaryMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      maxWidth: '78%',
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: DOT_SIZE + 4,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.primary,
    },
  });
}
