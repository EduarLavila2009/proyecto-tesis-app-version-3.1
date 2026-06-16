import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import Card from './Card';
import Icon from '../Icon';
import ClinicalTooltip from './ClinicalTooltip';
import { spacing, typography, useTheme } from '../../theme';

function getClinicalExplanation(label = '') {
  const norm = label.toLowerCase();
  if (norm.includes('cardíac') || norm.includes('ritmo') || norm.includes('frecuencia')) {
    return 'El ritmo cardíaco ideal en reposo oscila entre 60 y 90 bpm en adultos. Valores fuera de este rango pueden indicar fatiga, deshidratación, esfuerzo cardiovascular o arritmia periférica.';
  }
  if (norm.includes('temp') || norm.includes('calor')) {
    return 'La temperatura corporal normal en reposo se sitúa de 36.1°C a 37.2°C. Permite identificar tempranamente infecciones, cuadros de febrícula o hipotermia sistémica.';
  }
  if (norm.includes('presi') || norm.includes('arterial') || norm.includes('pa')) {
    return 'La presión arterial se compone de Sistólica (tensión máxima en contracción, ideal < 125 mmHg) y Diastólica (tensión en reposo, ideal < 85 mmHg). Su control regular protege los vasos cerebrales.';
  }
  if (norm.includes('oxíge') || norm.includes('spo') || norm.includes('saturaci')) {
    return 'La saturación de oxígeno mide la cantidad de O₂ transportado en sangre. Rangos normales: 95% a 100%. Valores inferiores a 92% indican hipoxia celular leve y requieren atención.';
  }
  return 'Esta métrica refleja el estado fisiológico y cardiovascular actual del paciente recolectado de forma continua para el monitoreo clínico integral.';
}

/**
 * Tarjeta de métrica vital — icono primary, valor destacado, etiqueta + insight opcional.
 */
export default function MetricTile({
  icon,
  value,
  label,
  insight,
  onPress,
  style,
  width,
  /** 'stable' | 'warning' | 'critical' — borde/accento visual (sin recalcular rangos) */
  alertLevel,
  /** 'default' | 'compact' — panel médico / listas */
  variant = 'default',
  /** 'primary' | 'secondary' — acento púrpura / turquesa en icono */
  iconAccent = 'primary',
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, alertLevel, variant),
    [colors, alertLevel, variant]
  );

  const scale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  // Animación infinita de pulso para estados críticos/warning
  useEffect(() => {
    if (alertLevel === 'critical' || alertLevel === 'warning') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.15,
              duration: 850,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 850,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.0,
              duration: 850,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 1.0,
              duration: 850,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();
      return () => {
        pulseAnimation.stop();
        pulseScale.setValue(1);
        pulseOpacity.setValue(1);
      };
    }
  }, [alertLevel]);

  const iconColor = iconAccent === 'secondary' ? colors.secondary : colors.primary;
  const iconBg =
    iconAccent === 'secondary' ? `${colors.secondary}22` : `${colors.primary}14`;

  const handlePressIn = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } catch (_) {}
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 350,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 350,
      friction: 8,
    }).start();
  };

  const clinicalInfo = useMemo(() => getClinicalExplanation(label), [label]);

  const tile = (
    <Card style={[styles.card, width != null && { width }, style]}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            backgroundColor: iconBg,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Icon name={icon} size={variant === 'compact' ? 18 : 22} color={iconColor} />
      </Animated.View>
      <Text style={styles.value} allowFontScaling numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.label} allowFontScaling numberOfLines={2}>
        {label}
      </Text>
      {insight ? (
        <Text style={styles.insight} allowFontScaling numberOfLines={3}>
          {insight}
        </Text>
      ) : null}
    </Card>
  );

  return (
    <ClinicalTooltip title={label} value={value} clinicalInfo={clinicalInfo}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [width != null && { width }]}
          accessibilityRole="button"
          accessibilityLabel={`${value}, ${label}. Mantén presionado para ver información clínica.`}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            {tile}
          </Animated.View>
        </Pressable>
      ) : (
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [width != null && { width }]}
          accessibilityRole="button"
          accessibilityLabel={`${value}, ${label}. Mantén presionado para ver información clínica.`}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            {tile}
          </Animated.View>
        </Pressable>
      )}
    </ClinicalTooltip>
  );
}

function createStyles(colors, alertLevel, variant) {
  const isCompact = variant === 'compact';
  const borderColor =
    alertLevel === 'critical'
      ? `${colors.danger}40`
      : alertLevel === 'warning'
        ? `${colors.warning}40`
        : colors.borderSubtle;

  const valueColor =
    alertLevel === 'critical'
      ? colors.danger
      : alertLevel === 'warning'
        ? colors.warning
        : colors.textPrimary;

  return StyleSheet.create({
    card: {
      padding: isCompact ? spacing.m : spacing.l,
      minHeight: isCompact ? spacing.minTouchTarget * 1.75 : spacing.minTouchTarget * 2 + spacing.l,
      borderWidth: alertLevel ? 1.5 : 1,
      borderColor,
    },
    iconWrap: {
      width: isCompact ? 34 : 40,
      height: isCompact ? 34 : 40,
      borderRadius: spacing.radiusButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isCompact ? spacing.xs : spacing.sm,
    },
    value: {
      fontSize: isCompact ? typography.subtitle.fontSize + 2 : typography.h2.fontSize,
      fontWeight: '800',
      lineHeight: isCompact ? typography.subtitle.lineHeight : typography.h2.lineHeight,
      color: valueColor,
      letterSpacing: -0.3,
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    insight: {
      ...typography.caption,
      color: colors.textPlaceholder,
      lineHeight: typography.caption.lineHeight * 1.25,
      marginTop: spacing.xs,
    },
  });
}
