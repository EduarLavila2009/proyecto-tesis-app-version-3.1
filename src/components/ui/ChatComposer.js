import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, hitSlopComfortable, chatLayout, useTheme } from '../../theme';

const SEND_SCALE_ACTIVE = 0.92;

/**
 * Barra de composición del chat — input redondeado + envío con feedback visual.
 */
export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder = 'Escribe tu síntoma o consulta…',
  maxLength = 500,
  sendDisabled,
  accessibilityLabel = 'Campo de mensaje',
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [focused, setFocused] = useState(false);
  const sendScale = useRef(new Animated.Value(1)).current;
  const canSend = !sendDisabled && String(value || '').trim().length > 0;

  const animateSendPress = (pressed) => {
    Animated.spring(sendScale, {
      toValue: pressed && canSend ? SEND_SCALE_ACTIVE : 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };

  const handleSend = () => {
    if (!canSend) return;
    Animated.sequence([
      Animated.timing(sendScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(sendScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 6,
      }),
    ]).start();
    onSend?.();
  };

  return (
    <View style={styles.row}>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          accessible
          accessibilityLabel={accessibilityLabel}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.primary}
          multiline
          maxLength={maxLength}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          allowFontScaling
          textAlignVertical="center"
          {...(Platform.OS === 'android' && {
            cursorColor: colors.primary,
            underlineColorAndroid: 'transparent',
          })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <Animated.View style={{ transform: [{ scale: sendScale }] }}>
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !canSend }}
          onPress={handleSend}
          onPressIn={() => animateSendPress(true)}
          onPressOut={() => animateSendPress(false)}
          disabled={!canSend}
          hitSlop={hitSlopComfortable}
          style={({ pressed }) => [
            styles.sendBtn,
            canSend ? styles.sendBtnActive : styles.sendBtnGhost,
            pressed && canSend && styles.sendBtnPressed,
          ]}
        >
          <Ionicons
            name="send"
            size={20}
            color={canSend ? colors.onPrimary : colors.textSecondary}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    inputWrap: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: spacing.radiusXl,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.85)',
      paddingHorizontal: spacing.m,
      paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
      minHeight: chatLayout.inputMinHeight,
      maxHeight: chatLayout.inputMaxHeight,
      justifyContent: 'center',
    },
    inputWrapFocused: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    input: {
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? spacing.xs : 0,
      maxHeight: chatLayout.inputMaxHeight - spacing.md,
      width: '100%',
    },
    sendBtn: {
      width: chatLayout.inputMinHeight,
      height: chatLayout.inputMinHeight,
      borderRadius: chatLayout.inputMinHeight / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs / 2,
    },
    sendBtnActive: {
      backgroundColor: colors.primary,
    },
    sendBtnGhost: {
      backgroundColor: colors.buttonDisabled,
    },
    sendBtnPressed: {
      opacity: 0.9,
    },
  });
}
