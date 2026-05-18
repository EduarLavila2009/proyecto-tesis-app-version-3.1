import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, hitSlopComfortable, motion, useTheme, useThemedStyles } from '../../../theme';
import FieldShell from './FieldShell';
import AnimatedFieldWrap from './AnimatedFieldWrap';
import { createFieldStyles } from './fieldStyles';

/**
 * Selector de opciones (lista modal con slide-up).
 * @param {{ label: string, value: string }[]} options
 */
export default function DropdownSelect({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = 'Seleccionar…',
  error: externalError,
  required = false,
  containerStyle,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const fieldStyles = useThemedStyles(createFieldStyles);
  const styles = useMemo(() => createDropdownStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const sheetY = useRef(new Animated.Value(320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const displayError = externalError || internalError;

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? (value ? String(value) : null);

  useEffect(() => {
    if (open) {
      sheetY.setValue(320);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: motion.duration.normal,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          ...motion.spring.sheet,
        }),
      ]).start();
    }
  }, [open, sheetY, backdropOpacity]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 320,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setFocused(false);
    });
  };

  const handleSelect = (item) => {
    onValueChange?.(item.value);
    setInternalError(null);
    closeModal();
  };

  const openModal = () => {
    setOpen(true);
    setFocused(true);
  };

  return (
    <FieldShell label={label} required={required} error={displayError} containerStyle={containerStyle}>
      {/* Sin Animated.View scale envolviendo el campo: evita anidar native+JS drivers con shake/borde. */}
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Selector'}
        accessibilityState={{ expanded: open }}
        onPress={openModal}
        style={({ pressed }) => [pressed && styles.triggerPressed]}
      >
        <AnimatedFieldWrap
          focused={focused || open}
          hasError={!!displayError}
          errorKey={displayError}
          style={[fieldStyles.input, styles.trigger]}
        >
          <View style={styles.triggerInner}>
            <Text
              style={[
                typography.body,
                selectedLabel ? styles.valueText : styles.placeholderText,
              ]}
              numberOfLines={1}
              allowFontScaling
            >
              {selectedLabel ?? placeholder}
            </Text>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={focused || open ? colors.primary : colors.textSecondary}
            />
          </View>
        </AnimatedFieldWrap>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} accessibilityLabel="Cerrar" />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <Text style={styles.sheetTitle} allowFontScaling>
              {label || 'Seleccionar'}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected }}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[styles.optionText, selected && styles.optionTextSelected]}
                      allowFontScaling
                    >
                      {item.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
            <Pressable
              style={styles.closeBtn}
              onPress={closeModal}
              hitSlop={hitSlopComfortable}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector"
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </FieldShell>
  );
}

function createDropdownStyles(colors) {
  return StyleSheet.create({
    trigger: {
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    triggerPressed: {
      opacity: 0.92,
    },
    triggerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.s,
      minHeight: spacing.minTouchTarget,
    },
    valueText: {
      flex: 1,
      color: colors.textPrimary,
      marginRight: spacing.s,
    },
    placeholderText: {
      flex: 1,
      color: colors.textSecondary,
      marginRight: spacing.s,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: spacing.radiusLg,
      borderTopRightRadius: spacing.radiusLg,
      paddingTop: spacing.m,
      paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.m,
      maxHeight: '70%',
    },
    sheetTitle: {
      ...typography.title,
      color: colors.textPrimary,
      paddingHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.m,
      minHeight: spacing.minTouchTarget,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    optionSelected: {
      backgroundColor: colors.secondaryMuted,
    },
    optionText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    closeBtn: {
      alignItems: 'center',
      paddingVertical: spacing.m,
    },
    closeBtnText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
